import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { StudentPreferences, UserProfile } from '../types/domain'

type WritableProfileValue = string | number | boolean | string[] | Record<string, boolean> | FieldValue | null

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizePreferencePayload(data: Partial<UserProfile>): Record<string, WritableProfileValue> {
  const normalized: Record<string, WritableProfileValue> = {}

  if (typeof data.uid === 'string' && data.uid) normalized.uid = data.uid
  if (typeof data.sex === 'string') normalized.sex = data.sex
  if (isFiniteNumber(data.weightKg)) {
    normalized.weightKg = data.weightKg
    normalized.weight = data.weightKg
  } else if (isFiniteNumber(data.weight)) {
    normalized.weight = data.weight
    normalized.weightKg = data.weight
  }

  if (isFiniteNumber(data.heightCm)) {
    normalized.heightCm = data.heightCm
    normalized.height = data.heightCm
  } else if (isFiniteNumber(data.height)) {
    normalized.height = data.height
    normalized.heightCm = data.height
  }

  if (typeof data.goal === 'string') normalized.goal = data.goal
  if (isFiniteNumber(data.trainingFrequency)) normalized.trainingFrequency = data.trainingFrequency

  if (typeof data.trainingLevel === 'string') {
    normalized.trainingLevel = data.trainingLevel
    normalized.experienceLevel = data.trainingLevel
  } else if (typeof data.experienceLevel === 'string') {
    normalized.experienceLevel = data.experienceLevel
    normalized.trainingLevel = data.experienceLevel
  }

  if (typeof data.trainingLocation === 'string') normalized.trainingLocation = data.trainingLocation
  if (typeof data.dietPreference === 'string') normalized.dietPreference = data.dietPreference
  if (isFiniteNumber(data.waterGoalMl)) normalized.waterGoalMl = data.waterGoalMl
  if (isFiniteNumber(data.waterProgressMl)) normalized.waterProgressMl = data.waterProgressMl

  if (typeof data.onboardingCompleted === 'boolean') normalized.onboardingCompleted = data.onboardingCompleted
  if (typeof data.onboardingDraft === 'boolean') normalized.onboardingDraft = data.onboardingDraft
  if (typeof data.recommendationsNeedRefresh === 'boolean') normalized.recommendationsNeedRefresh = data.recommendationsNeedRefresh

  if (typeof data.birthDate === 'string' && data.birthDate) normalized.birthDate = data.birthDate
  if (typeof data.city === 'string') normalized.city = data.city.trim()
  if (Array.isArray(data.equipmentAvailable)) normalized.equipmentAvailable = data.equipmentAvailable.filter(Boolean)
  if (typeof data.mainDifficulty === 'string') normalized.mainDifficulty = data.mainDifficulty.trim()
  if (typeof data.selectedWorkoutId === 'string') normalized.selectedWorkoutId = data.selectedWorkoutId
  if (typeof data.selectedDietId === 'string') normalized.selectedDietId = data.selectedDietId
  if (data.selectedWorkoutId === null) normalized.selectedWorkoutId = null
  if (data.selectedDietId === null) normalized.selectedDietId = null

  if (data.notificationsEnabled && typeof data.notificationsEnabled === 'object') {
    normalized.notificationsEnabled = Object.fromEntries(
      Object.entries(data.notificationsEnabled).filter(([, value]) => typeof value === 'boolean')
    ) as Record<string, boolean>
  }

  return normalized
}

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as UserProfile) : null
  },

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(docRef)
    const normalized = normalizePreferencePayload(data)

    if (snap.exists()) {
      await updateDoc(docRef, {
        ...normalized,
        updatedAt: serverTimestamp(),
      })
      return
    }

    await setDoc(docRef, {
      uid,
      notificationsEnabled: { training: true, water: true, community: true },
      waterProgressMl: 0,
      onboardingDraft: true,
      ...normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async completeOnboarding(uid: string, preferences: StudentPreferences): Promise<void> {
    const profileRef = doc(db, COLLECTIONS.PROFILES, uid)
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    const snap = await getDoc(profileRef)
    const normalized = normalizePreferencePayload({
      uid,
      ...preferences,
      onboardingCompleted: true,
      onboardingDraft: false,
      recommendationsNeedRefresh: false,
      waterProgressMl: 0,
      notificationsEnabled: { training: true, water: true, community: true },
    })

    const profilePayload = {
      uid,
      ...normalized,
      onboardingCompletedAt: serverTimestamp(),
      createdAt: snap.exists() ? snap.data().createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(profileRef, profilePayload, { merge: true })
    await setDoc(
      userRef,
      {
        onboardingCompleted: true,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  },
}
