import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { sendPushToUser } from '../utils/fcm'
import { yesterdayKey } from '../utils/date'
import { notificationService } from '../notifications/service'

// Runs daily at 19:00 São Paulo (22:00 UTC) — last chance to keep the streak alive today
export const streakRiskAlert = onSchedule(
  {
    schedule: '0 19 * * *',
    timeZone: 'America/Sao_Paulo',
    region: 'southamerica-east1',
    memory: '256MiB',
  },
  async () => {
    const db = admin.firestore()
    const yesterday = yesterdayKey()

    // Profiles where last activity was yesterday — streak will break if nothing done today
    const snap = await db.collection('profiles')
      .where('lastStreakActivityDate', '==', yesterday)
      .limit(500)
      .get()

    if (snap.empty) {
      logger.info('streakRiskAlert: no users at risk')
      return
    }

    logger.info(`streakRiskAlert: alerting ${snap.size} users`)

    const dedupeDate = new Date().toISOString().slice(0, 10)

    await Promise.allSettled(
      snap.docs.map(async (doc) => {
        const uid = doc.id
        const streak: number = doc.data().currentStreak ?? 1

        const title = '🔥 Seu streak está em risco!'
        const body = `Não perca seus ${streak} dia${streak !== 1 ? 's' : ''} seguidos. Registre uma atividade hoje.`
        const url = '/app/today'

        await sendPushToUser(uid, { title, body, url })

        await notificationService.createNotificationOnce({
          workspaceId: 'default',
          userId: uid,
          type: 'streak_at_risk',
          title,
          body,
          actionUrl: url,
          sourceId: dedupeDate,
          sourceType: 'streak',
          dedupeKey: `streak_at_risk:${uid}:${dedupeDate}`,
          metadata: { streak },
        })
      })
    )

    logger.info('streakRiskAlert: done')
  }
)
