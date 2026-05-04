import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Exercise } from '../types/domain'

export const exerciseService = {
  async getExercises(): Promise<Exercise[]> {
    const q = query(collection(db, COLLECTIONS.EXERCISES))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise))
  },

  async getActiveExercises(): Promise<Exercise[]> {
    const q = query(collection(db, COLLECTIONS.EXERCISES), where('status', '==', 'active'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise))
  },

  async getExercise(id: string): Promise<Exercise | null> {
    const docRef = doc(db, COLLECTIONS.EXERCISES, id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...snapshot.data() } as Exercise
  },

  async createExercise(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.EXERCISES))
    await setDoc(docRef, {
      ...exercise,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateExercise(id: string, exercise: Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.EXERCISES, id)
    await updateDoc(docRef, {
      ...exercise,
      updatedAt: serverTimestamp()
    })
  },

  async archiveExercise(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.EXERCISES, id)
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    })
  }
}
