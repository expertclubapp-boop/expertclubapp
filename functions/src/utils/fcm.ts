import * as admin from 'firebase-admin'
import { logger } from 'firebase-functions'

const PUSH_TOKENS_SUB = 'pushTokens'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(uid: string, payload: PushPayload): Promise<void> {
  const db = admin.firestore()
  const tokensSnap = await db.collection(`users/${uid}/${PUSH_TOKENS_SUB}`).get()
  if (tokensSnap.empty) return

  const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean)
  if (tokens.length === 0) return

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.url ? { url: payload.url } : {},
    webpush: {
      notification: { icon: '/icons/icon-192x192.png', badge: '/icons/icon-192x192.png' },
      fcmOptions: { link: payload.url ?? '/app/today' },
    },
  })

  // Purge stale tokens
  const toDelete = response.responses
    .map((r, i) => (!r.success && isStaleToken(r.error?.code ?? '') ? tokensSnap.docs[i] : null))
    .filter(Boolean) as admin.firestore.QueryDocumentSnapshot[]

  if (toDelete.length > 0) {
    const batch = db.batch()
    toDelete.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    logger.info(`Purged ${toDelete.length} stale FCM tokens for uid=${uid}`)
  }
}

export async function sendPushToUsers(uids: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(uids.map((uid) => sendPushToUser(uid, payload)))
}

function isStaleToken(code: string): boolean {
  return code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/invalid-argument'
}
