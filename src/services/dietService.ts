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
import type { Diet } from '../types/domain'

export const dietService = {
  async getAllPublished(): Promise<Diet[]> {
    const colRef = collection(db, COLLECTIONS.DIETS)
    const q = query(colRef, where('status', '==', 'published'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Diet))
  },

  async getById(id: string): Promise<Diet | null> {
    const docRef = doc(db, COLLECTIONS.DIETS, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Diet) : null
  },

  async getAll(): Promise<Diet[]> {
    const colRef = collection(db, COLLECTIONS.DIETS)
    const snap = await getDocs(colRef)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Diet))
  },

  async create(diet: Omit<Diet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { setDoc, doc, serverTimestamp, collection } = await import('firebase/firestore')
    const docRef = doc(collection(db, COLLECTIONS.DIETS))
    await setDoc(docRef, {
      ...diet,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(diet.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    })
    return docRef.id
  },

  async update(id: string, diet: Partial<Omit<Diet, 'id' | 'createdAt'>>): Promise<void> {
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
    const docRef = doc(db, COLLECTIONS.DIETS, id)
    await updateDoc(docRef, {
      ...diet,
      updatedAt: serverTimestamp(),
      ...(diet.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    })
  }
}
