import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Query,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { fromFirestoreDate, toFirestoreDate } from '../lib/firebase/date'
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
  queryWarnings: string[]
}

const METRICS_LIMITS = {
  users: 500,
  subscriptions: 1000,
  affiliates: 100,
  commissions: 1000,
  activity: 500,
  hydration: 300,
}

const SUBSCRIPTION_STATUSES = ['active', 'trialing', 'pending', 'past_due', 'expired', 'cancelled']
const COMMISSION_STATUSES = ['pending', 'approved', 'paid']

function isPermissionDenied(error: unknown) {
  return (error as { code?: string })?.code === 'permission-denied'
}

async function readRequired<T>(queryName: string, firestoreQuery: Query): Promise<T[]> {
  try {
    const snap = await getDocs(firestoreQuery)
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T))
  } catch (error) {
    if (isPermissionDenied(error)) throw error
    throw new Error(`Falha ao carregar métrica crítica: ${queryName}`)
  }
}

type OptionalRead<T> = { data: T[]; warning?: string }

async function readOptional<T>(
  queryName: string,
  firestoreQuery: Query,
): Promise<OptionalRead<T>> {
  try {
    const snap = await getDocs(firestoreQuery)
    return { data: snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T)) }
  } catch (error) {
    if (isPermissionDenied(error)) throw error
    console.error(`[adminMetricsService] Métrica secundária indisponível: ${queryName}`, error)
    return { data: [], warning: `${queryName} indisponível; métrica exibida como recorte vazio.` }
  }
}

function unwrapOptionalResult<T>(result: PromiseSettledResult<OptionalRead<T>>): OptionalRead<T> {
  if (result.status === 'rejected') throw result.reason
  return result.value
}

export const adminMetricsService = {
  async getDashboard(): Promise<AdminMetrics> {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const weekAgoCursor = toFirestoreDate(weekAgo)!
    const monthAgoCursor = toFirestoreDate(monthAgo)!

    const [users, subscriptions, affiliates, commissions] = await Promise.all([
      readRequired<User>(
        'users.member.limited',
        query(collection(db, COLLECTIONS.USERS), where('role', '==', 'member'), limit(METRICS_LIMITS.users)),
      ),
      readRequired<Subscription>(
        'subscriptions.status.limited',
        query(
          collection(db, COLLECTIONS.SUBSCRIPTIONS),
          where('status', 'in', SUBSCRIPTION_STATUSES),
          limit(METRICS_LIMITS.subscriptions),
        ),
      ),
      readRequired<AffiliateAccount>(
        'affiliateAccounts.limited',
        query(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS), limit(METRICS_LIMITS.affiliates)),
      ),
      readRequired<CommissionEntry>(
        'commissionLedger.status.limited',
        query(
          collection(db, COLLECTIONS.COMMISSION_LEDGER),
          where('status', 'in', COMMISSION_STATUSES),
          limit(METRICS_LIMITS.commissions),
        ),
      ),
    ])

    const activityResults = await Promise.allSettled([
      readOptional<{ createdAt?: unknown; dateKey?: string }>(
        'dailyCheckins.7d',
        query(
          collectionGroup(db, 'dailyCheckins'),
          where('createdAt', '>=', weekAgoCursor),
          orderBy('createdAt', 'desc'),
          limit(METRICS_LIMITS.activity),
        ),
      ),
      readOptional<{ createdAt?: unknown; date?: string }>(
        'bodyCheckins.30d',
        query(
          collectionGroup(db, 'bodyCheckins'),
          where('createdAt', '>=', monthAgoCursor),
          orderBy('createdAt', 'desc'),
          limit(METRICS_LIMITS.activity),
        ),
      ),
      readOptional<{ startedAt?: unknown; completedAt?: unknown; status?: string }>(
        'workoutSessions.7d',
        query(
          collectionGroup(db, 'workoutSessions'),
          where('startedAt', '>=', weekAgoCursor),
          orderBy('startedAt', 'desc'),
          limit(METRICS_LIMITS.activity),
        ),
      ),
      readOptional<{ adherencePercent?: number; createdAt?: unknown; dateKey?: string }>(
        'dietDays.30d',
        query(
          collectionGroup(db, 'dietDays'),
          where('createdAt', '>=', monthAgoCursor),
          orderBy('createdAt', 'desc'),
          limit(METRICS_LIMITS.activity),
        ),
      ),
      readOptional<{ dateKey?: string }>(
        'hydrationDays.sample',
        query(collectionGroup(db, 'hydrationDays'), limit(METRICS_LIMITS.hydration)),
      ),
    ])
    const dailyResult = unwrapOptionalResult(activityResults[0] as PromiseSettledResult<OptionalRead<{ createdAt?: unknown; dateKey?: string }>>)
    const bodyResult = unwrapOptionalResult(activityResults[1] as PromiseSettledResult<OptionalRead<{ createdAt?: unknown; date?: string }>>)
    const workoutResult = unwrapOptionalResult(activityResults[2] as PromiseSettledResult<OptionalRead<{ startedAt?: unknown; completedAt?: unknown; status?: string }>>)
    const dietResult = unwrapOptionalResult(activityResults[3] as PromiseSettledResult<OptionalRead<{ adherencePercent?: number; createdAt?: unknown; dateKey?: string }>>)
    const hydrationResult = unwrapOptionalResult(activityResults[4] as PromiseSettledResult<OptionalRead<{ dateKey?: string }>>)

    const daily = dailyResult.data
    const body = bodyResult.data
    const workouts = workoutResult.data
    const dietDays = dietResult.data
    const hydrationDays = hydrationResult.data
    const queryWarnings = [dailyResult, bodyResult, workoutResult, dietResult, hydrationResult]
      .map((result) => result.warning)
      .filter(Boolean) as string[]

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
      dailyCheckinsWeek: daily.length,
      bodyCheckinsMonth: body.filter(item => {
        const createdAt = fromFirestoreDate(item.createdAt as any)
        const legacyDate = item.date ? new Date(item.date) : null
        return createdAt ? createdAt >= monthAgo : Boolean(legacyDate && legacyDate >= monthAgo)
      }).length,
      completedWorkoutsWeek: workouts.filter(item => {
        const completedAt = fromFirestoreDate((item.completedAt ?? item.startedAt) as any)
        return item.status === 'completed' && completedAt ? completedAt >= weekAgo : false
      }).length,
      averageDietAdherence: dietDays.length ? Math.round(dietDays.reduce((sum, item) => sum + (item.adherencePercent || 0), 0) / dietDays.length) : null,
      appUsage: {
        workouts: workouts.length,
        diets: dietDays.length,
        checkins: daily.length + body.length,
        hydration: hydrationDays.length,
      },
      topAffiliates: affiliates
        .sort((a, b) => ((b.pendingCommission || 0) + (b.totalCommissionPaid || 0)) - ((a.pendingCommission || 0) + (a.totalCommissionPaid || 0)))
        .slice(0, 5),
      subscriptionStatus,
      queryWarnings,
    }
  },
}
