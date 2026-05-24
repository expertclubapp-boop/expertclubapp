import { collection, doc, setDoc, getDocs, updateDoc, query, orderBy, limit, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { normalizeFirestoreWriteData, nowTimestamp } from '../lib/firebase/date'
import type { Notification } from '../types/domain'

export const notificationService = {
  async getUserNotifications(uid: string, limitCount = 20): Promise<Notification[]> {
    const colRef = collection(db, `users/${uid}/notifications`)
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Notification)
  },

  async markAsRead(uid: string, notificationId: string): Promise<void> {
    const docRef = doc(db, `users/${uid}/notifications`, notificationId)
    await updateDoc(docRef, { isRead: true })
  },

  async markAllAsRead(uid: string): Promise<void> {
    const colRef = collection(db, `users/${uid}/notifications`)
    const q = query(colRef, where('isRead', '==', false))
    const snap = await getDocs(q)
    
    if (snap.empty) return
    
    const batch = writeBatch(db)
    snap.docs.forEach(d => {
      batch.update(d.ref, { isRead: true })
    })
    await batch.commit()
  },

  // Admin / System use
  async sendNotification(uid: string, notification: Omit<Notification, 'id' | 'uid' | 'createdAt' | 'isRead'>): Promise<void> {
    const colRef = collection(db, `users/${uid}/notifications`)
    const docRef = doc(colRef)
    const newNotif = {
      ...notification,
      id: docRef.id,
      uid,
      isRead: false,
      createdAt: nowTimestamp()
    }
    await setDoc(docRef, normalizeFirestoreWriteData(newNotif))
  }
}
