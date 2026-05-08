import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Subscription, CheckoutSession, BillingEvent } from '../types/domain'

export const billingService = {
  async getSubscription(uid: string): Promise<Subscription | null> {
    const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, uid)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as Subscription) : null
  },

  async getLatestCheckoutSession(uid: string): Promise<CheckoutSession | null> {
    const colRef = collection(db, COLLECTIONS.CHECKOUT_SESSIONS)
    const q = query(colRef, where('uid', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckoutSession))
    sessions.sort((a, b) => dateMillis(b.createdAt as any) - dateMillis(a.createdAt as any))
    return sessions[0]
  },

  async getBillingHistory(uid: string): Promise<BillingEvent[]> {
    const colRef = collection(db, COLLECTIONS.BILLING_EVENTS)
    const q = query(colRef, where('uid', '==', uid))
    const snap = await getDocs(q)
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() } as BillingEvent))
    return events.sort((a, b) => dateMillis(b.createdAt as any) - dateMillis(a.createdAt as any))
  }
}
