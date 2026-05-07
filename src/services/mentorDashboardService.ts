import { collection, collectionGroup, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type {
  AffiliateAccount,
  BodyCheckin,
  CommissionEntry,
  DailyCheckin,
  DietDay,
  Subscription,
  User,
  WeeklyCheckin,
  WorkoutSession,
} from '../types/domain'
import { adminMetricsService } from './adminMetricsService'

export interface MentorStudentRow {
  uid: string
  displayName: string
  email: string
  planName: string
  subscriptionStatus: string
  createdAt: string | null
  lastDailyCheckinAt: string | null
  lastWorkoutAt: string | null
  lastDietDayAt: string | null
  adherencePercent: number | null
  pendingCheckinDays: number | null
}

export interface MentorCheckinRow {
  uid: string
  displayName: string
  email: string
  lastDailyCheckinAt: string | null
  lastWeeklyCheckinAt: string | null
  lastBodyCheckinAt: string | null
  averageSleep: number | null
  averageMood: number | null
  pendingCheckinDays: number | null
  needsAttention: boolean
}

export interface MentorAgendaItem {
  id: string
  type: 'follow_up' | 'renewal'
  title: string
  subtitle: string
  dueDate: string | null
  href: string
}

export interface MentorOverviewData {
  scopeNote: string
  activeStudents: number
  pendingCheckins: number
  completedWorkoutsWeek: number
  averageDietAdherence: number | null
  estimatedMrr: number
  activeAffiliates: number
  attentionStudents: MentorStudentRow[]
}

export interface MentorFinanceData {
  scopeNote: string
  estimatedMrr: number
  revenueAtRisk: number
  activeStudents: number
  overdueStudents: number
  pendingCommissions: number
  paidCommissions: number
  planMix: Array<{ planName: string; students: number; revenue: number }>
}

export interface MentorReportsData {
  scopeNote: string
  activeIn7Days: number
  dormantStudents: number
  highAdherenceStudents: number
  rows: Array<MentorStudentRow & { lastSeenAt: string | null }>
}

interface MentorDataset {
  users: User[]
  subscriptions: Subscription[]
  affiliates: AffiliateAccount[]
  commissions: CommissionEntry[]
  dailyCheckins: DailyCheckin[]
  weeklyCheckins: WeeklyCheckin[]
  bodyCheckins: BodyCheckin[]
  workoutSessions: WorkoutSession[]
  dietDays: DietDay[]
}

const SCOPE_NOTE =
  'Os dados do mentor estao agregados globalmente. O schema atual ainda nao diferencia workspace ou mentorId de forma confiavel.'

function toDateValue(value: unknown): number {
  if (!value) return 0
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number }
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().getTime()
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      return maybeTimestamp.seconds * 1000
    }
  }
  return 0
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  const millis = toDateValue(value)
  return millis > 0 ? new Date(millis).toISOString() : null
}

function getLatestByUid<T extends { uid: string }>(
  items: T[],
  getDate: (item: T) => unknown,
): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    const current = acc[item.uid]
    if (!current || toDateValue(getDate(item)) > toDateValue(getDate(current))) {
      acc[item.uid] = item
    }
    return acc
  }, {})
}

function daysSince(value: string | null): number | null {
  if (!value) return null
  const diff = Date.now() - toDateValue(value)
  if (diff < 0) return 0
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

async function loadMentorDataset(): Promise<MentorDataset> {
  const [
    usersSnap,
    subscriptionsSnap,
    affiliatesSnap,
    commissionsSnap,
    dailySnap,
    weeklySnap,
    bodySnap,
    workoutSnap,
    dietSnap,
  ] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.USERS)),
    getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS)),
    getDocs(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS)),
    getDocs(collection(db, COLLECTIONS.COMMISSION_LEDGER)),
    getDocs(collectionGroup(db, 'dailyCheckins')),
    getDocs(collectionGroup(db, 'weeklyCheckins')),
    getDocs(collectionGroup(db, 'bodyCheckins')),
    getDocs(collectionGroup(db, 'workoutSessions')),
    getDocs(collectionGroup(db, 'dietDays')),
  ])

  return {
    users: usersSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as User),
    subscriptions: subscriptionsSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as Subscription),
    affiliates: affiliatesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AffiliateAccount),
    commissions: commissionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CommissionEntry),
    dailyCheckins: dailySnap.docs.map((doc) => doc.data() as DailyCheckin),
    weeklyCheckins: weeklySnap.docs.map((doc) => doc.data() as WeeklyCheckin),
    bodyCheckins: bodySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BodyCheckin),
    workoutSessions: workoutSnap.docs.map((doc) => doc.data() as WorkoutSession),
    dietDays: dietSnap.docs.map((doc) => doc.data() as DietDay),
  }
}

function buildStudentRows(dataset: MentorDataset): MentorStudentRow[] {
  const memberUsers = dataset.users.filter((user) => user.role === 'member')
  const subscriptionsByUid = Object.fromEntries(
    dataset.subscriptions.map((subscription) => [subscription.uid, subscription]),
  )
  const latestDaily = getLatestByUid(dataset.dailyCheckins, (entry) => entry.dateKey)
  const latestWorkout = getLatestByUid(
    dataset.workoutSessions.filter((entry) => entry.status === 'completed'),
    (entry) => entry.completedAt ?? entry.finishedAt ?? entry.startedAt,
  )
  const latestDietDay = getLatestByUid(dataset.dietDays, (entry) => entry.dateKey)

  return memberUsers
    .map((user) => {
      const subscription = subscriptionsByUid[user.uid]
      const lastDaily = latestDaily[user.uid]
      const lastWorkout = latestWorkout[user.uid]
      const lastDietDay = latestDietDay[user.uid]

      return {
        uid: user.uid,
        displayName: user.displayName || 'Aluno sem nome',
        email: user.email,
        planName: subscription?.planName || user.subscriptionPlan || '-',
        subscriptionStatus: subscription?.status || user.subscriptionStatus || 'pending',
        createdAt: normalizeDate(user.createdAt),
        lastDailyCheckinAt: normalizeDate(lastDaily?.dateKey),
        lastWorkoutAt: normalizeDate(lastWorkout?.completedAt ?? lastWorkout?.finishedAt ?? lastWorkout?.startedAt),
        lastDietDayAt: normalizeDate(lastDietDay?.dateKey),
        adherencePercent: lastDietDay?.adherencePercent ?? null,
        pendingCheckinDays: daysSince(normalizeDate(lastDaily?.dateKey)),
      }
    })
    .sort((left, right) => {
      const leftPending = left.pendingCheckinDays ?? Number.MAX_SAFE_INTEGER
      const rightPending = right.pendingCheckinDays ?? Number.MAX_SAFE_INTEGER
      if (leftPending !== rightPending) return rightPending - leftPending
      return left.displayName.localeCompare(right.displayName)
    })
}

export const mentorDashboardService = {
  async getOverview(): Promise<MentorOverviewData> {
    const [metrics, dataset] = await Promise.all([
      adminMetricsService.getDashboard(),
      loadMentorDataset(),
    ])
    const students = buildStudentRows(dataset)

    return {
      scopeNote: SCOPE_NOTE,
      activeStudents: metrics.activeStudents,
      pendingCheckins: students.filter((student) => (student.pendingCheckinDays ?? 999) >= 3).length,
      completedWorkoutsWeek: metrics.completedWorkoutsWeek,
      averageDietAdherence: metrics.averageDietAdherence,
      estimatedMrr: metrics.estimatedMrr,
      activeAffiliates: dataset.affiliates.filter((affiliate) => affiliate.status === 'active').length,
      attentionStudents: students.filter((student) => (student.pendingCheckinDays ?? 999) >= 3).slice(0, 6),
    }
  },

  async listStudents(): Promise<MentorStudentRow[]> {
    return buildStudentRows(await loadMentorDataset())
  },

  async listCheckins(): Promise<MentorCheckinRow[]> {
    const dataset = await loadMentorDataset()
    const students = buildStudentRows(dataset)
    const latestWeekly = getLatestByUid(dataset.weeklyCheckins, (entry) => entry.weekKey)
    const latestBody = getLatestByUid(dataset.bodyCheckins, (entry) => entry.date)
    const latestDaily = getLatestByUid(dataset.dailyCheckins, (entry) => entry.dateKey)

    return students.map((student) => {
      const daily = latestDaily[student.uid]
      const weekly = latestWeekly[student.uid]
      const body = latestBody[student.uid]
      const pendingDays = student.pendingCheckinDays

      return {
        uid: student.uid,
        displayName: student.displayName,
        email: student.email,
        lastDailyCheckinAt: student.lastDailyCheckinAt,
        lastWeeklyCheckinAt: normalizeDate(weekly?.weekKey),
        lastBodyCheckinAt: normalizeDate(body?.date),
        averageSleep: daily?.sleep ?? null,
        averageMood: daily?.mood ?? null,
        pendingCheckinDays: pendingDays,
        needsAttention: (pendingDays ?? 999) >= 3 || !weekly,
      }
    })
  },

  async getAgenda(): Promise<MentorAgendaItem[]> {
    const dataset = await loadMentorDataset()
    const students = buildStudentRows(dataset)
    const usersByUid = Object.fromEntries(dataset.users.map((user) => [user.uid, user]))

    const followUps = students
      .filter((student) => (student.pendingCheckinDays ?? 999) >= 2)
      .slice(0, 8)
      .map((student) => ({
        id: `follow-up-${student.uid}`,
        type: 'follow_up' as const,
        title: `Retomar contato com ${student.displayName}`,
        subtitle: student.pendingCheckinDays
          ? `${student.pendingCheckinDays} dias sem check-in diario.`
          : 'Aluno sem historico recente de check-in.',
        dueDate: student.lastDailyCheckinAt,
        href: '/mentor/checkins',
      }))

    const renewals = dataset.subscriptions
      .filter((subscription) => {
        const renewal = normalizeDate(subscription.renewalDate ?? subscription.currentPeriodEnd)
        if (!renewal) return false
        const diff = toDateValue(renewal) - Date.now()
        return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 10
      })
      .sort(
        (left, right) =>
          toDateValue(normalizeDate(left.renewalDate ?? left.currentPeriodEnd)) -
          toDateValue(normalizeDate(right.renewalDate ?? right.currentPeriodEnd)),
      )
      .slice(0, 8)
      .map((subscription) => ({
        id: `renewal-${subscription.uid}`,
        type: 'renewal' as const,
        title: `Renovacao proxima de ${usersByUid[subscription.uid]?.displayName || subscription.uid}`,
        subtitle: `${subscription.planName} · status ${subscription.status}`,
        dueDate: normalizeDate(subscription.renewalDate ?? subscription.currentPeriodEnd),
        href: '/mentor/financeiro',
      }))

    return [...followUps, ...renewals].sort(
      (left, right) => toDateValue(left.dueDate) - toDateValue(right.dueDate),
    )
  },

  async getFinance(): Promise<MentorFinanceData> {
    const dataset = await loadMentorDataset()
    const activeSubscriptions = dataset.subscriptions.filter((subscription) =>
      ['active', 'trialing'].includes(subscription.status),
    )
    const overdueSubscriptions = dataset.subscriptions.filter((subscription) =>
      ['past_due', 'expired'].includes(subscription.status),
    )
    const planMix = activeSubscriptions.reduce<Record<string, { planName: string; students: number; revenue: number }>>(
      (acc, subscription) => {
        const key = subscription.planName || subscription.planId || 'Sem plano'
        acc[key] = acc[key] || { planName: key, students: 0, revenue: 0 }
        acc[key].students += 1
        acc[key].revenue += subscription.price || 0
        return acc
      },
      {},
    )

    return {
      scopeNote: SCOPE_NOTE,
      estimatedMrr: activeSubscriptions.reduce((sum, subscription) => sum + (subscription.price || 0), 0),
      revenueAtRisk: overdueSubscriptions.reduce((sum, subscription) => sum + (subscription.price || 0), 0),
      activeStudents: activeSubscriptions.length,
      overdueStudents: overdueSubscriptions.length,
      pendingCommissions: dataset.commissions
        .filter((entry) => ['pending', 'approved'].includes(entry.status))
        .reduce((sum, entry) => sum + entry.commissionAmount, 0),
      paidCommissions: dataset.commissions
        .filter((entry) => entry.status === 'paid')
        .reduce((sum, entry) => sum + entry.commissionAmount, 0),
      planMix: Object.values(planMix).sort((left, right) => right.revenue - left.revenue),
    }
  },

  async getReports(): Promise<MentorReportsData> {
    const students = await this.listStudents()
    const rows = students.map((student) => {
      const lastSeenAt = [student.lastDailyCheckinAt, student.lastWorkoutAt, student.lastDietDayAt]
        .filter(Boolean)
        .sort((left, right) => toDateValue(right) - toDateValue(left))[0] ?? null

      return {
        ...student,
        lastSeenAt,
      }
    })

    return {
      scopeNote: SCOPE_NOTE,
      activeIn7Days: rows.filter((row) => {
        if (!row.lastSeenAt) return false
        return Date.now() - toDateValue(row.lastSeenAt) <= 1000 * 60 * 60 * 24 * 7
      }).length,
      dormantStudents: rows.filter((row) => {
        if (!row.lastSeenAt) return true
        return Date.now() - toDateValue(row.lastSeenAt) > 1000 * 60 * 60 * 24 * 7
      }).length,
      highAdherenceStudents: rows.filter((row) => (row.adherencePercent ?? 0) >= 80).length,
      rows: rows.sort((left, right) => toDateValue(right.lastSeenAt) - toDateValue(left.lastSeenAt)),
    }
  },
}
