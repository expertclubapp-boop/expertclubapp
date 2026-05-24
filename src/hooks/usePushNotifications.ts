import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { messagingReady, onForegroundMessage, requestPushPermission } from '../lib/firebase/messaging'
import { track } from '../lib/analytics'

type PushStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

const STORAGE_KEY = 'ec_push_asked'

export function usePushNotifications() {
  const { firebaseUser } = useAuth()
  const [status, setStatus] = useState<PushStatus>('idle')

  useEffect(() => {
    if (!messagingReady) {
      setStatus('unavailable')
      return
    }
    const current = Notification.permission
    if (current === 'granted') setStatus('granted')
    else if (current === 'denied') setStatus('denied')
  }, [])

  // Listen for foreground messages (app is open)
  useEffect(() => {
    if (status !== 'granted') return
    return onForegroundMessage((payload) => {
      const { title, body } = payload.notification ?? {}
      if (title && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body ?? '', icon: '/icons/icon-192x192.png' })
      }
    })
  }, [status])

  const requestPermission = useCallback(async () => {
    if (!firebaseUser || status === 'requesting') return
    setStatus('requesting')
    localStorage.setItem(STORAGE_KEY, 'true')
    const result = await requestPushPermission(firebaseUser.uid)
    setStatus(result)
    if (result === 'granted') {
      track('push_notification_granted')
    } else if (result === 'denied') {
      track('push_notification_denied')
    }
  }, [firebaseUser, status])

  const shouldPrompt =
    status === 'idle' &&
    messagingReady &&
    Notification.permission === 'default' &&
    !localStorage.getItem(STORAGE_KEY)

  return { status, requestPermission, shouldPrompt }
}
