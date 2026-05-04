import { useState, useEffect } from 'react'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/domain'

export function useNotifications(uid: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = async () => {
    if (!uid) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await notificationService.getUserNotifications(uid)
      setNotifications(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [uid])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = async (id: string) => {
    if (!uid) return
    await notificationService.markAsRead(uid, id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = async () => {
    if (!uid) return
    await notificationService.markAllAsRead(uid)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return { notifications, unreadCount, isLoading, reload, markAsRead, markAllAsRead }
}
