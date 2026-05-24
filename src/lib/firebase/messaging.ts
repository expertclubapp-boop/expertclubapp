import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import app, { db, firebaseEnvReady } from './firebase'
import { COLLECTIONS } from './paths'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export const messagingReady = firebaseEnvReady && Boolean(VAPID_KEY) && 'Notification' in window

function buildSwUrl() {
  if (!firebaseEnvReady) return '/firebase-messaging-sw.js'
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

export async function requestPushPermission(uid: string): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!messagingReady) return 'unavailable'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  try {
    const swReg = await navigator.serviceWorker.register(buildSwUrl(), { scope: '/' })
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })

    await setDoc(
      doc(db, COLLECTIONS.USERS, uid, 'pushTokens', token.slice(0, 64)),
      {
        token,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        platform: getPlatformLabel(),
        userAgent: navigator.userAgent.slice(0, 200),
      },
      { merge: true }
    )

    return 'granted'
  } catch {
    return 'unavailable'
  }
}

export function onForegroundMessage(handler: (payload: MessagePayload) => void) {
  if (!messagingReady) return () => undefined
  const messaging = getMessaging(app)
  return onMessage(messaging, handler)
}

function getPlatformLabel(): string {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad/i.test(ua)) return 'ios'
  return 'desktop'
}
