import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { sendPushToUser } from '../utils/fcm'
import { daysFromNowIso, toDate } from '../utils/date'
import { notificationService } from '../notifications/service'

const WARN_DAYS_BEFORE = 3

// Runs daily at 09:00 São Paulo (12:00 UTC)
// Finds subscriptions expiring in ≤ WARN_DAYS_BEFORE days
export const billingExpiryAlert = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'America/Sao_Paulo',
    region: 'southamerica-east1',
    memory: '256MiB',
  },
  async () => {
    const db = admin.firestore()
    const nowMs = Date.now()
    const thresholdMs = nowMs + WARN_DAYS_BEFORE * 86_400_000
    const dedupeDate = new Date().toISOString().slice(0, 10)

    const snap = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'trialing'])
      .limit(1000)
      .get()

    if (snap.empty) {
      logger.info('billingExpiryAlert: no active subscriptions')
      return
    }

    const expiring = snap.docs.filter((doc) => {
      const periodEnd = toDate(doc.data().currentPeriodEnd)
      if (!periodEnd) return false
      const endMs = periodEnd.getTime()
      return endMs >= nowMs && endMs <= thresholdMs
    })

    if (expiring.length === 0) {
      logger.info('billingExpiryAlert: no subscriptions expiring soon')
      return
    }

    logger.info(`billingExpiryAlert: ${expiring.length} subscriptions expiring`)

    await Promise.allSettled(
      expiring.map(async (doc) => {
        const uid = doc.data().uid as string
        if (!uid) return

        const periodEnd = toDate(doc.data().currentPeriodEnd)!
        const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - nowMs) / 86_400_000))

        const title = '💳 Sua assinatura está vencendo'
        const body =
          daysLeft === 0
            ? 'Sua assinatura vence hoje. Renove agora para manter o acesso.'
            : `Sua assinatura vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Renove para continuar.`

        await sendPushToUser(uid, { title, body, url: '/app/billing/plans' })

        await notificationService.createNotificationOnce({
          workspaceId: 'default',
          userId: uid,
          type: 'billing_expiring',
          title,
          body,
          actionUrl: '/app/billing/plans',
          sourceId: dedupeDate,
          sourceType: 'subscription',
          dedupeKey: `billing_expiring:${uid}:${dedupeDate}`,
          metadata: { daysLeft },
        })
      })
    )

    logger.info('billingExpiryAlert: done')
  }
)
