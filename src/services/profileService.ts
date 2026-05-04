import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { UserProfile } from '../types/domain'

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as UserProfile) : null
  },

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(docRef)
    
    if (snap.exists()) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(docRef, {
        uid,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  },

  async completeOnboarding(uid: string, profile: UserProfile): Promise<void> {
    // 1. Save Profile
    await this.updateProfile(uid, profile)
    
    // 2. Mark User as Onboarding Complete
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    await updateDoc(userRef, {
      onboardingCompleted: true,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    })
  }
}
