import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { sendPushToUser } from '../utils/fcm'
import { daysAgoKey } from '../utils/date'
import { notificationService } from '../notifications/service'

const INACTIVITY_DAYS = 3

// Runs daily at 08:00 São Paulo (11:00 UTC)
// Finds students who haven't logged any activity in INACTIVITY_DAYS days
// Notifies the student and creates a mentor alert document
export const inactivityAlert = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'America/Sao_Paulo',
    region: 'southamerica-east1',
    memory: '256MiB',
  },
  async () => {
    const db = admin.firestore()
    const threshold = daysAgoKey(INACTIVITY_DAYS)
    const dedupeDate = new Date().toISOString().slice(0, 10)

    // Profiles with some past activity that has now gone stale
    const snap = await db.collection('profiles')
      .where('lastStreakActivityDate', '>', '')
      .where('lastStreakActivityDate', '<', threshold)
      .limit(500)
      .get()

    if (snap.empty) {
      logger.info('inactivityAlert: no inactive users')
      return
    }

    logger.info(`inactivityAlert: ${snap.size} inactive students found`)

    // Collect mentors who need to be alerted (uid → Set of studentUids)
    const mentorAlertMap = new Map<string, string[]>()

    await Promise.allSettled(
      snap.docs.map(async (doc) => {
        const uid = doc.id
        const lastActivity: string = doc.data().lastStreakActivityDate ?? ''
        const daysSince = Math.floor(
          (Date.now() - new Date(lastActivity).getTime()) / 86_400_000
        )

        // — Student push + in-app notification
        await sendPushToUser(uid, {
          title: '👋 Sentimos sua falta!',
          body: `Faz ${daysSince} dias que você não registra uma atividade. Que tal voltar hoje?`,
          url: '/app/today',
        })

        await notificationService.createNotificationOnce({
          workspaceId: 'default',
          userId: uid,
          type: 'student_inactive',
          title: '👋 Sentimos sua falta!',
          body: `Faz ${daysSince} dias que você não registra uma atividade. Que tal voltar hoje?`,
          actionUrl: '/app/today',
          sourceId: dedupeDate,
          sourceType: 'inactivity',
          dedupeKey: `student_inactive:${uid}:${dedupeDate}`,
          metadata: { daysSince },
        })

        // — Find assigned mentor
        const userSnap = await db.collection('users').doc(uid).get()
        if (!userSnap.exists) return
        const mentorId: string | undefined = userSnap.data()?.mentorId
        if (!mentorId) return

        const existing = mentorAlertMap.get(mentorId) ?? []
        existing.push(uid)
        mentorAlertMap.set(mentorId, existing)
      })
    )

    // Write consolidated inactivity alerts for each mentor
    if (mentorAlertMap.size > 0) {
      const batch = db.batch()
      for (const [mentorId, studentUids] of mentorAlertMap) {
        const alertRef = db.collection('mentorAlerts').doc(`inactivity:${mentorId}:${dedupeDate}`)
        batch.set(alertRef, {
          mentorId,
          type: 'inactivity',
          studentUids,
          date: dedupeDate,
          count: studentUids.length,
          resolved: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
      await batch.commit()
      logger.info(`inactivityAlert: created alerts for ${mentorAlertMap.size} mentors`)

      // Send push to each mentor
      await Promise.allSettled(
        Array.from(mentorAlertMap.entries()).map(([mentorId, studentUids]) =>
          sendPushToUser(mentorId, {
            title: '⚠️ Alunos inativos',
            body: `${studentUids.length} aluno${studentUids.length !== 1 ? 's' : ''} sem atividade há ${INACTIVITY_DAYS}+ dias.`,
            url: '/mentor/alunos',
          })
        )
      )
    }

    logger.info('inactivityAlert: done')
  }
)
