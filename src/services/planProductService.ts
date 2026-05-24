import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Plan } from '../types/domain'

const col = () => collection(db, COLLECTIONS.PLANS)

export const planProductService = {
  async list(): Promise<Plan[]> {
    const q = query(col(), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plan))
  },

  async listActive(): Promise<Plan[]> {
    const q = query(col(), where('status', '==', 'active'), orderBy('price', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plan))
  },

  async getById(id: string): Promise<Plan | null> {
    const snap = await getDoc(doc(col(), id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Plan
  },

  async create(data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(col(), { ...data, createdAt: now, updatedAt: now })
    return ref.id
  },

  async update(id: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(col(), id), { ...data, updatedAt: new Date().toISOString() })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(col(), id))
  },
}
