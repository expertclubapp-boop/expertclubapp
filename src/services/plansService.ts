import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { Plan } from '../types/domain'

export const plansService = {
  async getActivePlans(): Promise<Plan[]> {
    const colRef = collection(db, COLLECTIONS.PLANS)
    const q = query(
      colRef, 
      where('status', '==', 'active')
    )
    const snap = await getDocs(q)
    const plans = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan))
    return plans.sort((a, b) => a.price - b.price)
  },

  async getPlanById(planId: string): Promise<Plan | null> {
    const docRef = doc(db, COLLECTIONS.PLANS, planId)
    const snap = await getDoc(docRef)
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Plan) : null
  }
}
