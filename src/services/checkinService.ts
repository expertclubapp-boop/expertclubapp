import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { DailyCheckin, WeeklyCheckin } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

export const checkinService = {
  // Daily Checkins
  async getDailyCheckin(uid: string, dateKey: string) {
    const docRef = doc(db, COLLECTIONS.USERS, uid, 'dailyCheckins', dateKey)
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() as DailyCheckin : null
  },

  async saveDailyCheckin(uid: string, checkin: DailyCheckin) {
    const docRef = doc(db, COLLECTIONS.USERS, uid, 'dailyCheckins', checkin.dateKey)
    await setDoc(docRef, {
      ...checkin,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Non-blocking scoring
    challengeScoringService.processUserAction({
      uid,
      sourceType: 'daily_checkin',
      sourceId: checkin.dateKey
    }).catch(console.error)
  },

  async getRecentDailyCheckins(uid: string, limitCount = 30) {
    const colRef = collection(db, COLLECTIONS.USERS, uid, 'dailyCheckins')
    const q = query(colRef, orderBy('dateKey', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as DailyCheckin)
  },

  // Weekly Checkins
  async getWeeklyCheckin(uid: string, weekKey: string) {
    const docRef = doc(db, COLLECTIONS.USERS, uid, 'weeklyCheckins', weekKey)
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() as WeeklyCheckin : null
  },

  async saveWeeklyCheckin(uid: string, checkin: WeeklyCheckin) {
    const docRef = doc(db, COLLECTIONS.USERS, uid, 'weeklyCheckins', checkin.weekKey)
    await setDoc(docRef, {
      ...checkin,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Non-blocking scoring
    challengeScoringService.processUserAction({
      uid,
      sourceType: 'weekly_checkin',
      sourceId: checkin.weekKey
    }).catch(console.error)
  },

  async getWeeklyCheckinHistory(uid: string, limitCount = 12) {
    const colRef = collection(db, COLLECTIONS.USERS, uid, 'weeklyCheckins')
    const q = query(colRef, orderBy('weekKey', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as WeeklyCheckin)
  }
}
