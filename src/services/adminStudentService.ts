import { collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis, nowTimestamp } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS } from '../lib/firebase/paths'
import type {
  BodyCheckin,
  DailyCheckin,
  Diet,
  DietDay,
  HydrationDay,
  Subscription,
  User,
  UserProfile,
  WeeklyCheckin,
  Workout,
  WorkoutSession,
} from '../types/domain'
import { studentEvolutionReportService, type StudentEvolutionReport } from './studentEvolutionReportService'
import { studentInsightService, type StudentInsightSummary } from './studentInsightService'

const STUDENT_360_LIMITS = {
  WORKOUT_SESSIONS: 20,
  DIET_DAYS: 30,
  DAILY_CHECKINS: 30,
  WEEKLY_CHECKINS: 12,
  BODY_CHECKINS: 12,
  HYDRATION_DAYS: 30,
} as const

type Identified<T> = T & { id: string }

export interface AdminStudent360 {
  user: User
  subscription?: Subscription | null
  profile?: UserProfile | null
  currentWorkout?: { id: string; title: string; goal?: string; level?: string } | null
  currentDiet?: { id: string; title: string; calories?: number; protein?: number; carbs?: number; fat?: number } | null
  recentWorkoutSessions: Array<Identified<WorkoutSession>>
  recentDietDays: Array<Identified<DietDay>>
  recentDailyCheckins: Array<Identified<DailyCheckin>>
  recentWeeklyCheckins: Array<Identified<WeeklyCheckin>>
  recentBodyCheckins: Array<Identified<BodyCheckin>>
  recentHydrationDays: Array<Identified<HydrationDay>>
  insightSummary: StudentInsightSummary
  evolutionReport: StudentEvolutionReport
  summary: {
    lastWorkoutAt?: WorkoutSession['startedAt']
    lastCheckinAt?: DailyCheckin['createdAt'] | DailyCheckin['dateKey']
    dietAdherence?: number
    workouts7d?: number
    checkins30d?: number
    hydrationAverage?: number
    churnRiskLevel: StudentInsightSummary['churnRisk']['level']
  }
}

async function listRecentSubcollection<T>(uid: string, name: string, maxLimit: number, orderByField: string): Promise<Array<Identified<T>>> {
  const q = query(
    collection(db, COLLECTIONS.USERS, uid, name),
    orderBy(orderByField, 'desc'),
    limit(maxLimit),
  )
  const snap = await getDocs(q)
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as T) }))
}

async function getCurrentWorkout(profile: UserProfile | null) {
  if (!profile?.selectedWorkoutId) return null
  const workoutSnap = await getDoc(doc(db, COLLECTIONS.WORKOUTS, profile.selectedWorkoutId))
  if (!workoutSnap.exists()) return null
  const workout = workoutSnap.data() as Workout
  return {
    id: workoutSnap.id,
    title: workout.title,
    ...(workout.goal ? { goal: workout.goal } : {}),
    ...(workout.level ? { level: workout.level } : {}),
  }
}

async function getCurrentDiet(profile: UserProfile | null) {
  if (!profile?.selectedDietId) return null
  const dietSnap = await getDoc(doc(db, COLLECTIONS.DIETS, profile.selectedDietId))
  if (!dietSnap.exists()) return null
  const diet = dietSnap.data() as Diet
  return {
    id: dietSnap.id,
    title: diet.title,
    ...(typeof diet.calories === 'number' ? { calories: diet.calories } : {}),
    ...(typeof diet.protein === 'number' ? { protein: diet.protein } : {}),
    ...(typeof diet.carbs === 'number' ? { carbs: diet.carbs } : {}),
    ...(typeof diet.fat === 'number' ? { fat: diet.fat } : {}),
  }
}

function computeHydrationAverage(entries: Array<Identified<HydrationDay>>, fallbackGoal?: number) {
  if (!entries.length) return 0
  const values = entries.map((entry) => {
    const goal = typeof entry.goalMl === 'number' && entry.goalMl > 0
      ? entry.goalMl
      : typeof fallbackGoal === 'number' && fallbackGoal > 0
        ? fallbackGoal
        : 2500
    return goal > 0 ? Math.max(0, Math.min(100, Math.round((Number(entry.totalMl || 0) / goal) * 100))) : 0
  })
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export const adminStudentService = {
  async getAdminStudent360(uid: string): Promise<AdminStudent360 | null> {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid))
    if (!userSnap.exists()) return null

    const user = { uid: userSnap.id, ...userSnap.data() } as User

    const [profileSnap, subSnap] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.PROFILES, uid)),
      getDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, uid)),
    ])

    const profile = profileSnap.exists() ? (profileSnap.data() as UserProfile) : null
    const subscription = subSnap.exists() ? (subSnap.data() as Subscription) : null

    const [
      currentWorkout,
      currentDiet,
      recentWorkoutSessions,
      recentDietDays,
      recentDailyCheckins,
      recentWeeklyCheckins,
      recentBodyCheckins,
      recentHydrationDays,
      insightSummary,
      evolutionReport,
    ] = await Promise.all([
      getCurrentWorkout(profile),
      getCurrentDiet(profile),
      listRecentSubcollection<WorkoutSession>(uid, SUB_COLLECTIONS.WORKOUT_SESSIONS, STUDENT_360_LIMITS.WORKOUT_SESSIONS, 'startedAt'),
      listRecentSubcollection<DietDay>(uid, SUB_COLLECTIONS.DIET_DAYS, STUDENT_360_LIMITS.DIET_DAYS, 'dateKey'),
      listRecentSubcollection<DailyCheckin>(uid, SUB_COLLECTIONS.DAILY_CHECKINS, STUDENT_360_LIMITS.DAILY_CHECKINS, 'dateKey'),
      listRecentSubcollection<WeeklyCheckin>(uid, SUB_COLLECTIONS.WEEKLY_CHECKINS, STUDENT_360_LIMITS.WEEKLY_CHECKINS, 'weekKey'),
      listRecentSubcollection<BodyCheckin>(uid, SUB_COLLECTIONS.BODY_CHECKINS, STUDENT_360_LIMITS.BODY_CHECKINS, 'date'),
      listRecentSubcollection<HydrationDay>(uid, SUB_COLLECTIONS.HYDRATION_DAYS, STUDENT_360_LIMITS.HYDRATION_DAYS, 'dateKey'),
      studentInsightService.getStudentInsightSummary(uid),
      studentEvolutionReportService.getStudentEvolutionReport(uid, { periodDays: 15 }),
    ])

    const latestWorkoutSession = recentWorkoutSessions
      .filter((entry) => entry.status === 'completed')
      .sort((a, b) => dateMillis(b.completedAt || b.finishedAt || b.startedAt) - dateMillis(a.completedAt || a.finishedAt || a.startedAt))[0]
    const latestDailyCheckin = recentDailyCheckins[0]

    return {
      user,
      subscription,
      profile,
      currentWorkout,
      currentDiet,
      recentWorkoutSessions,
      recentDietDays,
      recentDailyCheckins,
      recentWeeklyCheckins,
      recentBodyCheckins,
      recentHydrationDays,
      insightSummary,
      evolutionReport,
      summary: {
        ...(latestWorkoutSession ? { lastWorkoutAt: latestWorkoutSession.completedAt || latestWorkoutSession.finishedAt || latestWorkoutSession.startedAt } : {}),
        ...(latestDailyCheckin ? { lastCheckinAt: latestDailyCheckin.createdAt || latestDailyCheckin.dateKey } : {}),
        dietAdherence: insightSummary.adherence.dietAverageAdherencePct,
        workouts7d: insightSummary.adherence.workoutsCompleted,
        checkins30d: recentDailyCheckins.length,
        hydrationAverage: computeHydrationAverage(recentHydrationDays, profile?.waterGoalMl),
        churnRiskLevel: insightSummary.churnRisk.level,
      },
    }
  },

  async assignWorkout(uid: string, workoutId: string | null) {
    const profileRef = doc(db, COLLECTIONS.PROFILES, uid)
    await updateDoc(profileRef, {
      selectedWorkoutId: workoutId,
      updatedAt: nowTimestamp(),
    })
  },

  async assignDiet(uid: string, dietId: string | null) {
    const profileRef = doc(db, COLLECTIONS.PROFILES, uid)
    await updateDoc(profileRef, {
      selectedDietId: dietId,
      updatedAt: nowTimestamp(),
    })
  },
}
