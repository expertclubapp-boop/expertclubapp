import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import { challengeScoringService } from './challengeScoringService'
import { profileService } from './profileService'

export const hydrationService = {
  async getToday(uid: string): Promise<any> {
    const dateKey = new Date().toISOString().split('T')[0]
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.HYDRATION_DAYS)
    const docRef = doc(db, path, dateKey)
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() : null
  },

  async normalizeGoalMl(uid: string, existingGoal?: number, providedGoal?: number): Promise<number> {
    if (existingGoal && existingGoal > 0) return existingGoal
    if (providedGoal && providedGoal > 0) return providedGoal
    
    const profile = await profileService.getProfile(uid)
    if (profile?.waterGoalMl && profile.waterGoalMl > 0) return profile.waterGoalMl
    
    // Fallback weight * 35
    if (profile?.weight && profile.weight > 0) return Math.round(profile.weight * 35)
    
    return 2500 // Safe global fallback
  },

  async addWater(uid: string, ml: number, goalMl?: number): Promise<void> {
    const dateKey = new Date().toISOString().split('T')[0]
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.HYDRATION_DAYS)
    const docRef = doc(db, path, dateKey)
    const snap = await getDoc(docRef)

    const currentGoal = await this.normalizeGoalMl(uid, snap.exists() ? snap.data().goalMl : undefined, goalMl)

    if (snap.exists()) {
      const data = snap.data()
      const newTotal = (data.totalMl || 0) + ml
      await updateDoc(docRef, {
        totalMl: increment(ml),
        goalMl: currentGoal, // Ensure it's normalized if it was missing
        updatedAt: serverTimestamp(),
        goalReached: newTotal >= currentGoal
      })
    } else {
      await setDoc(docRef, {
        uid,
        dateKey,
        goalMl: currentGoal,
        totalMl: ml,
        goalReached: ml >= currentGoal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    const currentTotal = (snap.exists() ? snap.data().totalMl || 0 : 0) + ml
    if (currentTotal >= currentGoal) {
      challengeScoringService.processUserAction({
        uid,
        sourceType: 'hydration_goal',
        sourceId: dateKey
      }).catch(console.error)
    }
  },

  async getRecentHistory(uid: string, limitCount = 30): Promise<any[]> {
    const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.HYDRATION_DAYS)
    const colRef = collection(db, path)
    const q = query(colRef, orderBy('dateKey', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  }
}
