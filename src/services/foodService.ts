import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Food } from '../types/domain'

export const foodService = {
  async getFoods(): Promise<Food[]> {
    const q = query(collection(db, COLLECTIONS.FOODS))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Food))
  },

  async getActiveFoods(): Promise<Food[]> {
    const q = query(collection(db, COLLECTIONS.FOODS), where('status', '==', 'active'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Food))
  },

  async getFood(id: string): Promise<Food | null> {
    const docRef = doc(db, COLLECTIONS.FOODS, id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...snapshot.data() } as Food
  },

  async createFood(food: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.FOODS))
    await setDoc(docRef, {
      ...food,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  async updateFood(id: string, food: Partial<Omit<Food, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FOODS, id)
    await updateDoc(docRef, {
      ...food,
      updatedAt: serverTimestamp()
    })
  },

  async archiveFood(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FOODS, id)
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    })
  }
}
