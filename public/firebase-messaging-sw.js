importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js')

// Config will be injected at runtime via query params on registration
// to avoid duplicating the env vars inside the service worker
const url = new URL(location.href)

firebase.initializeApp({
  apiKey: url.searchParams.get('apiKey') ?? '',
  authDomain: url.searchParams.get('authDomain') ?? '',
  projectId: url.searchParams.get('projectId') ?? '',
  storageBucket: url.searchParams.get('storageBucket') ?? '',
  messagingSenderId: url.searchParams.get('messagingSenderId') ?? '',
  appId: url.searchParams.get('appId') ?? '',
})

const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification ?? {}
  const notificationTitle = title ?? 'Expert Club'
  const notificationOptions = {
    body: body ?? '',
    icon: icon ?? '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data?.url ?? '/app/today', ...data },
    vibrate: [200, 100, 200],
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Click handler — opens the app URL from notification data
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/app/today'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
