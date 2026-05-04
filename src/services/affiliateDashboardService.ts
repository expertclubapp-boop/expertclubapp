import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AffiliateAccount } from '../types/domain'

export interface AffiliateDashboardReferral {
  id: string
  firstName: string
  status: 'active' | 'inactive' | 'cancelled' | 'pending'
  joinedAt: string
  commissionAmount: number
}

export interface AffiliateDashboardPayout {
  id: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  paidAt?: string
  createdAt: string
}

export interface AffiliateDashboardSummary {
  affiliateId: string
  referralCode?: string
  totalReferrals: number
  activeReferrals: number
  inactiveReferrals: number
  pendingCommission: number
  approvedCommission: number
  paidCommission: number
  referrals: AffiliateDashboardReferral[]
  payouts: AffiliateDashboardPayout[]
}

export const affiliateDashboardService = {
  async getAccountByUid(uid: string): Promise<AffiliateAccount | null> {
    const q = query(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS), where('uid', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as AffiliateAccount
  },

  async getSummary(affiliateId: string): Promise<AffiliateDashboardSummary | null> {
    const snap = await getDoc(doc(db, 'affiliateDashboards', affiliateId))
    return snap.exists() ? (snap.data() as AffiliateDashboardSummary) : null
  },
}
