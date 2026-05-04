import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { WorkoutSession } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

export const workoutSessionService = {
  async startSession(uid: string, session: Partial<WorkoutSession>): Promise<string> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const newDocRef = doc(collection(db, path))
    const sessionId = newDocRef.id
    
    await setDoc(newDocRef, {
      ...session,
      id: sessionId,
      uid,
      status: 'active',
      startedAt: serverTimestamp(),
      lastInteractionAt: serverTimestamp(),
      durationSeconds: 0,
      totalTonnageKg: 0,
      exercisesCompleted: 0,
      totalSets: 0,
      prs: [],
      createdAt: serverTimestamp(),
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
      ...data,
      updatedAt: serverTimestamp(),
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
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as WorkoutSession)
  }
}
