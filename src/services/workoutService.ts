import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Workout } from '../types/domain'

export const workoutService = {
  async getAllPublished(): Promise<Workout[]> {
    const colRef = collection(db, COLLECTIONS.WORKOUTS)
    const q = query(colRef, where('status', '==', 'published'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout))
  },

  async getById(id: string): Promise<Workout | null> {
    const docRef = doc(db, COLLECTIONS.WORKOUTS, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Workout) : null
  },

  async getAll(): Promise<Workout[]> {
    const colRef = collection(db, COLLECTIONS.WORKOUTS)
    const snap = await getDocs(colRef)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout))
  },

  async create(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { setDoc, doc, serverTimestamp, collection } = await import('firebase/firestore')
    const docRef = doc(collection(db, COLLECTIONS.WORKOUTS))
    await setDoc(docRef, {
      ...workout,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(workout.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    })
    return docRef.id
  },

  async update(id: string, workout: Partial<Omit<Workout, 'id' | 'createdAt'>>): Promise<void> {
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
    const docRef = doc(db, COLLECTIONS.WORKOUTS, id)
    await updateDoc(docRef, {
      ...workout,
      updatedAt: serverTimestamp(),
      ...(workout.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    })
  }
}
