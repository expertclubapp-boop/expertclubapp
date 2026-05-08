import { collection, doc, setDoc, getDoc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { nowTimestamp, toFirestoreDate } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { WorkoutSession } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

const SESSION_DATE_FIELDS = [
  'startedAt',
  'completedAt',
  'finishedAt',
  'lastInteractionAt',
  'inactiveWarningShownAt',
  'createdAt',
  'updatedAt',
] as const

function normalizeSessionDateFields(data: Partial<WorkoutSession>) {
  const normalized: Record<string, unknown> = { ...data }
  SESSION_DATE_FIELDS.forEach((field) => {
    if (field in normalized) {
      const timestamp = toFirestoreDate(normalized[field] as any)
      if (timestamp) normalized[field] = timestamp
    }
  })
  return normalized as Partial<WorkoutSession>
}

function sessionStartedAtMs(session: WorkoutSession) {
  const raw = (session as any).startedAt

  if (!raw) return 0
  if (typeof raw?.toDate === 'function') return raw.toDate().getTime()
  if (raw instanceof Date) return raw.getTime()
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function isMissingIndexError(error: unknown) {
  const code = (error as any)?.code
  const message = String((error as any)?.message ?? '')

  return code === 'failed-precondition' && /index|requires/i.test(message)
}

export const workoutSessionService = {
  async startSession(uid: string, session: Partial<WorkoutSession>): Promise<string> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const newDocRef = doc(collection(db, path))
    const sessionId = newDocRef.id
    
    await setDoc(newDocRef, {
      ...normalizeSessionDateFields(session),
      id: sessionId,
      uid,
      status: 'active',
      startedAt: nowTimestamp(),
      lastInteractionAt: nowTimestamp(),
      durationSeconds: 0,
      totalTonnageKg: 0,
      exercisesCompleted: 0,
      totalSets: 0,
      prs: [],
      createdAt: nowTimestamp(),
    })
    
    return sessionId
  },

  async getSession(uid: string, sessionId: string): Promise<WorkoutSession | null> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const docRef = doc(db, path, sessionId)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as WorkoutSession) : null
  },

  async updateSession(uid: string, sessionId: string, data: Partial<WorkoutSession>): Promise<void> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const docRef = doc(db, path, sessionId)
    await updateDoc(docRef, {
      ...normalizeSessionDateFields(data),
      updatedAt: nowTimestamp(),
    })

    if (data.status === 'completed') {
      challengeScoringService.processUserAction({
        uid,
        sourceType: 'workout_completed',
        sourceId: sessionId
      }).catch(console.error)
    }
  },

  async getLatestSession(uid: string): Promise<WorkoutSession | null> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const colRef = collection(db, path)
    const q = query(colRef, orderBy('startedAt', 'desc'), limit(1))
    const snap = await getDocs(q)
    return !snap.empty ? (snap.docs[0].data() as WorkoutSession) : null
  },

  async getRecentSessions(uid: string, limitCount = 30): Promise<WorkoutSession[]> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const colRef = collection(db, path)
    const q = query(colRef, orderBy('startedAt', 'desc'), limit(limitCount))
    try {
      const snap = await getDocs(q)
      return snap.docs.map(d => d.data() as WorkoutSession)
    } catch (error) {
      if (!isMissingIndexError(error)) throw error

      const fallbackSnap = await getDocs(colRef)
      return fallbackSnap.docs
        .map(d => d.data() as WorkoutSession)
        .sort((a, b) => sessionStartedAtMs(b) - sessionStartedAtMs(a))
        .slice(0, limitCount)
    }
  }
}
