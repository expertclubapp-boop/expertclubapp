import { collection, collectionGroup, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { fromFirestoreDate } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AffiliateAccount, CommissionEntry, Subscription, User } from '../types/domain'

export interface AdminMetrics {
  estimatedMrr: number
  activeStudents: number
  blockedStudents: number
  newStudents: number
  cancelledSubscriptions: number
  pendingSubscriptions: number
  pendingCommissions: number
  paidCommissions: number
  approvedCommissions: number
  dailyCheckinsWeek: number
  bodyCheckinsMonth: number
  completedWorkoutsWeek: number
  averageDietAdherence: number | null
  appUsage: { workouts: number; diets: number; checkins: number; hydration: number }
  topAffiliates: AffiliateAccount[]
  subscriptionStatus: Record<string, number>
}

export const adminMetricsService = {
  async getDashboard(): Promise<AdminMetrics> {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const [usersSnap, subsSnap, affiliatesSnap, commissionsSnap, dailySnap, bodySnap, workoutSnap, dietSnap, hydrationSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS)),
      getDocs(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS)),
      getDocs(collection(db, COLLECTIONS.COMMISSION_LEDGER)),
      getDocs(collectionGroup(db, 'dailyCheckins')),
      getDocs(collectionGroup(db, 'bodyCheckins')),
      getDocs(collectionGroup(db, 'workoutSessions')),
      getDocs(collectionGroup(db, 'dietDays')),
      getDocs(collectionGroup(db, 'hydrationDays')),
    ])

    const users = usersSnap.docs.map(d => d.data() as User)
    const subscriptions = subsSnap.docs.map(d => d.data() as Subscription)
    const affiliates = affiliatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AffiliateAccount))
    const commissions = commissionsSnap.docs.map(d => d.data() as CommissionEntry)
    const daily = dailySnap.docs.map(d => d.data() as { dateKey?: string })
    const body = bodySnap.docs.map(d => d.data() as { date?: string })
    const workouts = workoutSnap.docs.map(d => d.data() as { completedAt?: unknown; status?: string })
    const dietDays = dietSnap.docs.map(d => d.data() as { adherencePercent?: number; dateKey?: string })
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const activeSubs = subscriptions.filter(sub => ['active', 'trialing'].includes(sub.status))
    const subscriptionStatus = subscriptions.reduce<Record<string, number>>((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1
      return acc
    }, {})

    return {
      estimatedMrr: activeSubs.reduce((sum, sub) => sum + (sub.price || 0), 0),
      activeStudents: users.filter(user => user.role !== 'admin' && ['active', 'trialing'].includes(user.subscriptionStatus || '')).length || activeSubs.length,
      blockedStudents: subscriptions.filter(sub => ['past_due', 'expired'].includes(sub.status)).length,
      newStudents: users.filter(user => {
        const createdAt = fromFirestoreDate(user.createdAt as any)
        return createdAt ? createdAt >= thisMonth : false
      }).length,
      cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
      pendingSubscriptions: subscriptions.filter(sub => ['pending', 'past_due'].includes(sub.status)).length,
      pendingCommissions: commissions.filter(item => ['pending', 'approved'].includes(item.status)).reduce((sum, item) => sum + item.commissionAmount, 0),
      approvedCommissions: commissions.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.commissionAmount, 0),
      paidCommissions: commissions.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.commissionAmount, 0),
      dailyCheckinsWeek: daily.filter(item => item.dateKey && new Date(item.dateKey) >= weekAgo).length,
      bodyCheckinsMonth: body.filter(item => item.date && new Date(item.date) >= monthAgo).length,
      completedWorkoutsWeek: workouts.filter(item => {
        const completedAt = fromFirestoreDate(item.completedAt as any)
        return item.status === 'completed' && completedAt ? completedAt >= weekAgo : false
      }).length,
      averageDietAdherence: dietDays.length ? Math.round(dietDays.reduce((sum, item) => sum + (item.adherencePercent || 0), 0) / dietDays.length) : null,
      appUsage: {
        workouts: workouts.length,
        diets: dietSnap.size,
        checkins: dailySnap.size + bodySnap.size,
        hydration: hydrationSnap.size,
      },
      topAffiliates: affiliates.sort((a, b) => (b.pendingCommission + b.totalCommissionPaid) - (a.pendingCommission + a.totalCommissionPaid)).slice(0, 5),
      subscriptionStatus,
    }
  },
}
