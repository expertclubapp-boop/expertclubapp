import { collection, getDocs, query, where, collectionGroup, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { toFirestoreDate } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS } from '../lib/firebase/paths'
import type { 
  Subscription, 
  CheckoutSession, 
  BillingEvent, 
  User, 
  UserProfile,
  AffiliateAccount,
  CommissionEntry,
  WorkoutSession,
  DietDay,
  DailyCheckin
} from '../types/domain'

export type LaunchDateRange = "today" | "7d" | "30d" | "month" | "all"

export type LaunchOpsMetrics = {
  revenueConfirmed: number
  estimatedMrr: number
  checkoutCount: number
  approvedPayments: number
  activeSubscriptions: number
  pendingSubscriptions: number
  pastDueSubscriptions: number
  cancelledSubscriptions: number
  commissionApproved: number
  commissionPaid: number
  commissionBalance: number
  onboardingCompleted: number
  firstWorkoutCompleted: number
  firstDietDayLogged: number
  dailyCheckins7d: number
  workoutSessions7d: number
  dietDays7d: number
}

export type AffiliateLaunchRow = {
  affiliateId: string
  affiliateName: string
  referralCode: string
  checkouts: number
  approvedPayments: number
  activeSubscriptions: number
  commissionApproved: number
  commissionPaid: number
  commissionBalance: number
  conversionRate?: number
}

export type LaunchAlert = {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export const adminLaunchService = {
  async getLaunchData(range: LaunchDateRange) {
    // 1. Determine Date Range
    const now = new Date()
    let startDate = new Date(0) // all time
    
    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const startDateCursor = toFirestoreDate(startDate)
    const sevenDaysAgoCursor = toFirestoreDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))

    // 2. Fetch Data (Client-side aggregation for V1 Launch)
    // NOTE: In production with many users, these should be migrated to Cloud Functions aggregations.
    
    const [
      subsSnap,
      checkoutsSnap,
      billingSnap,
      usersSnap,
      profilesSnap,
      affiliatesSnap,
      commissionsSnap,
      workoutsSnap,
      dietsSnap,
      checkinsSnap
    ] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS)),
      getDocs(query(collection(db, COLLECTIONS.CHECKOUT_SESSIONS), where('createdAt', '>=', startDateCursor))),
      getDocs(query(collection(db, COLLECTIONS.BILLING_EVENTS), where('createdAt', '>=', startDateCursor))),
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.PROFILES)),
      getDocs(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS)),
      getDocs(collection(db, COLLECTIONS.COMMISSION_LEDGER)),
      getDocs(query(
        collectionGroup(db, SUB_COLLECTIONS.WORKOUT_SESSIONS),
        where('startedAt', '>=', sevenDaysAgoCursor),
        orderBy('startedAt', 'desc')
      )),
      getDocs(query(
        collectionGroup(db, SUB_COLLECTIONS.DIET_DAYS),
        where('createdAt', '>=', sevenDaysAgoCursor),
        orderBy('createdAt', 'desc')
      )),
      getDocs(query(
        collectionGroup(db, SUB_COLLECTIONS.DAILY_CHECKINS),
        where('createdAt', '>=', sevenDaysAgoCursor),
        orderBy('createdAt', 'desc')
      ))
    ])

    const subscriptions = subsSnap.docs.map(d => d.data() as Subscription)
    const checkouts = checkoutsSnap.docs.map(d => d.data() as CheckoutSession)
    const billingEvents = billingSnap.docs.map(d => d.data() as BillingEvent)
    const users = usersSnap.docs.map(d => d.data() as User)
    const profiles = profilesSnap.docs.map(d => d.data() as UserProfile)
    const affiliates = affiliatesSnap.docs.map(d => d.data() as AffiliateAccount)
    const commissions = commissionsSnap.docs.map(d => d.data() as CommissionEntry)
    const workoutSessions7d = workoutsSnap.docs.map(d => d.data() as WorkoutSession)
    const dietDays7d = dietsSnap.docs.map(d => d.data() as DietDay)
    const dailyCheckins7d = checkinsSnap.docs.map(d => d.data() as DailyCheckin)

    // 3. Compute Metrics
    const metrics: LaunchOpsMetrics = {
      revenueConfirmed: 0,
      estimatedMrr: 0,
      checkoutCount: checkouts.length,
      approvedPayments: 0,
      activeSubscriptions: 0,
      pendingSubscriptions: 0,
      pastDueSubscriptions: 0,
      cancelledSubscriptions: 0,
      commissionApproved: 0,
      commissionPaid: 0,
      commissionBalance: 0,
      onboardingCompleted: 0,
      firstWorkoutCompleted: 0,
      firstDietDayLogged: 0,
      dailyCheckins7d: dailyCheckins7d.length,
      workoutSessions7d: workoutSessions7d.filter(s => s.status === 'completed').length,
      dietDays7d: dietDays7d.length
    }

    // Revenue & Subscriptions
    subscriptions.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trialing') {
        metrics.activeSubscriptions++
        if (sub.price && sub.interval === 'monthly') {
          metrics.estimatedMrr += sub.price
        }
      } else if (sub.status === 'pending') {
        metrics.pendingSubscriptions++
      } else if (sub.status === 'past_due') {
        metrics.pastDueSubscriptions++
      } else if (sub.status === 'cancelled' || sub.status === 'expired') {
        metrics.cancelledSubscriptions++
      }
    })

    billingEvents.forEach(evt => {
      if (evt.normalizedStatus === 'active' && evt.amount) {
        metrics.approvedPayments++
        metrics.revenueConfirmed += evt.amount
      }
    })

    // Commissions
    commissions.forEach(comm => {
      if (comm.status === 'approved') metrics.commissionApproved += comm.commissionAmount
      if (comm.status === 'paid') metrics.commissionPaid += comm.commissionAmount
    })
    metrics.commissionBalance = metrics.commissionApproved - metrics.commissionPaid

    // App Usage (All time users)
    users.forEach(u => {
      if (u.onboardingCompleted) metrics.onboardingCompleted++
    })

    // Profile checks
    const activeStudentUids = users.filter(u => u.role === 'member' && u.subscriptionStatus === 'active').map(u => u.uid)
    const profileMap = new Map(profiles.map(p => [p.uid, p]))

    // We count first workout/diet as > 0 completed in the last 7 days as a proxy for V1, or we'd need to query all time.
    // For a real "first ever", we'd need user fields like `hasCompletedFirstWorkout`.
    // For V1 Launch, we just look at overall engagement.
    metrics.firstWorkoutCompleted = new Set(workoutSessions7d.filter(s => s.status === 'completed').map(s => s.uid)).size
    metrics.firstDietDayLogged = new Set(dietDays7d.map(d => d.uid)).size

    // 4. Compute Affiliates Table
    const affiliateRows: AffiliateLaunchRow[] = affiliates.map(aff => {
      const affCheckouts = checkouts.filter(c => c.referralCode && (c as any).affiliateId === aff.id || c.source === aff.id)
      const affSubs = subscriptions.filter(s => s.referralCode && (s as any).affiliateId === aff.id || s.source === aff.id)
      const affComms = commissions.filter(c => c.affiliateId === aff.id)
      
      let approved = 0
      let paid = 0
      affComms.forEach(c => {
        if (c.status === 'approved') approved += c.commissionAmount
        if (c.status === 'paid') paid += c.commissionAmount
      })

      return {
        affiliateId: aff.id,
        affiliateName: aff.name,
        referralCode: affCheckouts[0]?.referralCode || '-', // Simplified mapping
        checkouts: affCheckouts.length,
        approvedPayments: affComms.length,
        activeSubscriptions: affSubs.filter(s => s.status === 'active').length,
        commissionApproved: approved,
        commissionPaid: paid,
        commissionBalance: approved - paid,
        conversionRate: affCheckouts.length > 0 ? (affComms.length / affCheckouts.length) * 100 : 0
      }
    }).sort((a, b) => b.activeSubscriptions - a.activeSubscriptions)

    // 5. Compute Alerts
    const alerts: LaunchAlert[] = []

    // Alert: High past due
    if (metrics.pastDueSubscriptions > 10 || (metrics.pastDueSubscriptions / Math.max(1, metrics.activeSubscriptions)) > 0.1) {
      alerts.push({
        id: 'high-past-due',
        severity: 'critical',
        title: 'Muitas assinaturas em Past Due',
        description: `${metrics.pastDueSubscriptions} assinaturas constam como atrasadas no gateway.`,
        actionLabel: 'Ver assinaturas',
        actionHref: '/admin/subscriptions'
      })
    }

    // Alert: Active students without onboarding
    const noOnboarding = users.filter(u => u.role === 'member' && u.subscriptionStatus === 'active' && !u.onboardingCompleted)
    if (noOnboarding.length > 0) {
      alerts.push({
        id: 'missing-onboarding',
        severity: 'warning',
        title: 'Alunos ativos sem Onboarding',
        description: `${noOnboarding.length} alunos com pagamento aprovado ainda não finalizaram o onboarding.`,
        actionLabel: 'Ver alunos',
        actionHref: '/admin/users'
      })
    }

    // Alert: Active students without diet/workout
    let noDiet = 0
    let noWorkout = 0
    activeStudentUids.forEach(uid => {
      const p = profileMap.get(uid)
      if (p) {
        if (!p.selectedDietId) noDiet++
        if (!p.selectedWorkoutId) noWorkout++
      }
    })

    if (noDiet > 0) {
      alerts.push({
        id: 'missing-diet',
        severity: 'warning',
        title: 'Alunos sem dieta',
        description: `${noDiet} alunos ativos não possuem dieta selecionada.`,
        actionLabel: 'Ver alunos',
        actionHref: '/admin/users'
      })
    }

    if (noWorkout > 0) {
      alerts.push({
        id: 'missing-workout',
        severity: 'warning',
        title: 'Alunos sem treino',
        description: `${noWorkout} alunos ativos não possuem treino selecionado.`,
        actionLabel: 'Ver alunos',
        actionHref: '/admin/users'
      })
    }

    // Alert: Commission to pay
    if (metrics.commissionBalance > 0) {
      alerts.push({
        id: 'pending-commission',
        severity: 'info',
        title: 'Comissões Pendentes',
        description: `Existem R$ ${metrics.commissionBalance.toFixed(2)} em comissões aprovadas para pagar.`,
        actionLabel: 'Ver comissões',
        actionHref: '/admin/commissions'
      })
    }

    return { metrics, affiliateRows, alerts, users }
  }
}
