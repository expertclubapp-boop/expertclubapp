import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { dateMillis, nowTimestamp, safeDateKey, type FirestoreDateInput } from '../lib/firebase/date'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { BodyCheckin, DailyCheckin, DietDay, HydrationDay, SetLog, UserProfile, Workout, WorkoutSession } from '../types/domain'
import { profileService } from './profileService'
import { workoutSessionService } from './workoutSessionService'

const DEFAULT_PERIOD_DAYS = 7
const MAX_PERIOD_DAYS = 30
const EMPTY_FEEDBACK_TITLE = 'Dados insuficientes para análise'
const EMPTY_FEEDBACK_MESSAGE = 'Ainda não temos dados suficientes para gerar uma análise. Comece registrando treino, dieta, água e check-in diário por alguns dias.'

type InsightPeriodDays = 7 | 15 | 30

export type StudentChurnRisk = {
  level: 'low' | 'medium' | 'high'
  score: number
  reasons: string[]
}

export type StudentCycleInsight = {
  periodDays: InsightPeriodDays
  generatedAt: Timestamp
  headline: string
  summary: string
  highlights: string[]
  operationalAlerts: string[]
  empty: boolean
}

export type StudentInsightSummary = {
  periodDays: number
  adherence: {
    workoutsCompleted: number
    workoutTarget?: number
    workoutAdherencePct: number
    dietDaysLogged: number
    dietAverageAdherencePct: number
    hydrationAveragePct: number
    dailyCheckinsCompleted: number
    dailyCheckinAdherencePct: number
  }
  evolution: {
    latestWeightKg?: number
    previousWeightKg?: number
    weightDeltaKg?: number
    latestBodyFatPct?: number
    previousBodyFatPct?: number
    bodyFatDeltaPct?: number
  }
  performance: {
    totalSessions: number
    totalTonnage: number
    bestProgressHighlights: Array<{
      exerciseName: string
      previousBest?: number
      currentBest?: number
      delta?: number
    }>
  }
  churnRisk: StudentChurnRisk
  automatedFeedback: {
    title: string
    message: string
    bullets: string[]
    ctaLabel?: string
    ctaTo?: string
  }
  generatedAt: Timestamp
}

type SessionExerciseProgress = {
  exerciseName: string
  previousBest?: number
  currentBest?: number
  delta?: number
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function normalizePeriodDays(days?: number): InsightPeriodDays {
  if (days === 15 || days === 30) return days
  return DEFAULT_PERIOD_DAYS
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function startOfPeriod(days: number) {
  const start = startOfToday()
  start.setDate(start.getDate() - (days - 1))
  return start
}

function createDateKeys(days: number) {
  const today = startOfToday()
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    return safeDateKey(date)
  })
}

function resolveWorkoutFrequency(profile: UserProfile | null, workout: Workout | null) {
  const workoutFrequency = typeof workout?.daysPerWeek === 'number' ? workout.daysPerWeek : 0
  if (workoutFrequency > 0) return workoutFrequency
  const profileFrequency = typeof profile?.trainingFrequency === 'number' ? profile.trainingFrequency : 0
  return profileFrequency > 0 ? profileFrequency : 0
}

function computeWorkoutTarget(periodDays: number, weeklyTarget: number) {
  if (weeklyTarget <= 0) return 0
  return Math.round((weeklyTarget * periodDays) / 7)
}

function sessionDate(session: WorkoutSession) {
  return session.completedAt || session.finishedAt || session.startedAt
}

function isCompletedSession(session: WorkoutSession) {
  return session.status === 'completed'
}

function setPerformanceValue(log: SetLog) {
  const load = typeof log.loadKg === 'number' ? log.loadKg : 0
  const reps = typeof log.reps === 'number' ? log.reps : 0
  return load * reps
}

function getExerciseName(session: WorkoutSession, exerciseId: string) {
  const substitution = session.substitutions?.[exerciseId]
  if (substitution?.exerciseName) return substitution.exerciseName
  const matchingPr = session.prs?.find((entry) => entry.exerciseId === exerciseId)
  if (matchingPr?.exerciseName) return matchingPr.exerciseName
  return 'Exercício'
}

function readNumberField(input: unknown, key: string) {
  if (!input || typeof input !== 'object') return null
  const value = (input as Record<string, unknown>)[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function bodyFatPct(checkin: BodyCheckin) {
  return readNumberField(checkin, 'bodyFatPct') ?? readNumberField(checkin, 'bodyFat')
}

function weightDelta(current?: number, previous?: number) {
  if (typeof current !== 'number' || !Number.isFinite(current)) return null
  if (typeof previous !== 'number' || !Number.isFinite(previous)) return null
  return Number((current - previous).toFixed(1))
}

function daysSince(value: FirestoreDateInput) {
  const millis = dateMillis(value)
  if (!millis) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - millis) / (24 * 60 * 60 * 1000))
}

function buildPerformanceHighlights(sessions: WorkoutSession[]) {
  const latestByExercise = new Map<string, { value: number; exerciseName: string; sessionMs: number }>()
  const previousByExercise = new Map<string, { value: number; exerciseName: string; sessionMs: number }>()

  sessions
    .filter(isCompletedSession)
    .slice()
    .sort((a, b) => dateMillis(sessionDate(b)) - dateMillis(sessionDate(a)))
    .forEach((session) => {
      const grouped = new Map<string, SetLog[]>()

      ;(session.logs || []).forEach((log) => {
        if (!Number.isFinite(log.loadKg) || !Number.isFinite(log.reps)) return
        if (log.reps <= 0 || log.loadKg < 0) return
        grouped.set(log.exerciseId, [...(grouped.get(log.exerciseId) || []), log])
      })

      grouped.forEach((logs, exerciseId) => {
        const sessionBest = logs.reduce((best, log) => Math.max(best, setPerformanceValue(log)), 0)
        if (sessionBest <= 0) return
        const exerciseName = getExerciseName(session, exerciseId)
        const current = latestByExercise.get(exerciseId)

        if (!current) {
          latestByExercise.set(exerciseId, {
            value: sessionBest,
            exerciseName,
            sessionMs: dateMillis(sessionDate(session)),
          })
          return
        }

        const previous = previousByExercise.get(exerciseId)
        if (!previous) {
          previousByExercise.set(exerciseId, {
            value: sessionBest,
            exerciseName,
            sessionMs: dateMillis(sessionDate(session)),
          })
        }
      })
    })

  return [...latestByExercise.entries()]
    .map(([exerciseId, latest]) => {
      const previous = previousByExercise.get(exerciseId)
      const delta = previous ? latest.value - previous.value : null
      const result: SessionExerciseProgress = {
        exerciseName: latest.exerciseName,
      }

      if (previous) result.previousBest = previous.value
      result.currentBest = latest.value
      if (delta && delta > 0) result.delta = Number(delta.toFixed(1))
      return result
    })
    .filter((entry) => Number.isFinite(entry.currentBest) && (entry.delta ?? 0) > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 3)
    .map((entry) => ({
      exerciseName: entry.exerciseName,
      ...(entry.previousBest !== undefined ? { previousBest: entry.previousBest } : {}),
      ...(entry.currentBest !== undefined ? { currentBest: entry.currentBest } : {}),
      ...(entry.delta !== undefined ? { delta: entry.delta } : {}),
    }))
}

function calculateDietAdherence(entry: DietDay) {
  if (typeof entry.adherencePercent === 'number' && Number.isFinite(entry.adherencePercent)) {
    return clampPercentage(entry.adherencePercent)
  }

  const totalItems = typeof entry.totalItemsCount === 'number' ? entry.totalItemsCount : 0
  const completedItems = typeof entry.completedItemsCount === 'number' ? entry.completedItemsCount : 0
  if (totalItems <= 0) return 0
  return clampPercentage((completedItems / totalItems) * 100)
}

function buildAutomatedFeedback(input: {
  periodDays: number
  workoutsCompleted: number
  workoutTarget: number
  dietDaysLogged: number
  dietAverageAdherencePct: number
  hydrationAveragePct: number
  dailyCheckinsCompleted: number
  churnRisk: StudentChurnRisk
  hasAnyData: boolean
  hasEnoughData: boolean
  performanceHighlightsCount: number
}) {
  if (!input.hasAnyData || !input.hasEnoughData) {
    return {
      title: EMPTY_FEEDBACK_TITLE,
      message: EMPTY_FEEDBACK_MESSAGE,
      bullets: [
        'Registre seu treino, dieta, água e check-in diário para destravar sua análise.',
      ],
      ctaLabel: 'Registrar check-in',
      ctaTo: '/app/checkin/daily',
    }
  }

  if (input.churnRisk.level === 'high') {
    return {
      title: 'Sua consistência caiu nos últimos dias',
      message: 'Você ficou alguns dias sem registrar check-in e sua hidratação ficou abaixo da meta. Volte ao básico hoje: registre água, complete seu treino e marque suas refeições.',
      bullets: [
        `Check-ins no período: ${input.dailyCheckinsCompleted}/${input.periodDays}`,
        `Água média: ${input.hydrationAveragePct}%`,
        `Dieta média: ${input.dietAverageAdherencePct}%`,
      ],
      ctaLabel: 'Registrar check-in',
      ctaTo: '/app/checkin/daily',
    }
  }

  if (input.churnRisk.level === 'medium') {
    return {
      title: 'Sua rotina merece atenção',
      message: 'Houve queda de consistência nos últimos dias. Retomar treino, água e registros simples hoje já ajuda a recuperar ritmo.',
      bullets: [
        `Treinos: ${input.workoutsCompleted}/${input.workoutTarget}`,
        `Dieta média: ${input.dietAverageAdherencePct}%`,
        `Água média: ${input.hydrationAveragePct}%`,
      ],
      ctaLabel: 'Ver evolução',
      ctaTo: '/app/evolution',
    }
  }

  return {
    title: 'Boa consistência no período',
    message: `Você manteve uma boa consistência nos últimos ${input.periodDays} dias. Continue registrando cargas para melhorar sua análise de evolução.`,
    bullets: [
      `Treinos concluídos: ${input.workoutsCompleted}/${input.workoutTarget}`,
      `Dieta registrada em ${input.dietDaysLogged} dia(s) com média de ${input.dietAverageAdherencePct}%`,
      input.performanceHighlightsCount > 0
        ? 'Já existem sinais de evolução nas cargas registradas.'
        : 'Registre cargas e repetições para liberar mais highlights de performance.',
    ],
    ctaLabel: 'Ver evolução',
    ctaTo: '/app/evolution',
  }
}

function hasEnoughInsightData(input: {
  workoutsCompleted: number
  dailyCheckinsCompleted: number
  dietDaysLogged: number
  hydrationDaysLogged: number
  bodyCheckinsCount: number
}) {
  if (input.workoutsCompleted > 0) return true
  return false
}

async function listRecentSubcollection<T>(uid: string, subcollection: string, orderField: string, maxLimit: number): Promise<T[]> {
  const path = getSubCollectionPath(COLLECTIONS.USERS, uid, subcollection)
  const snap = await getDocs(query(collection(db, path), orderBy(orderField, 'desc'), limit(maxLimit)))
  return snap.docs.map((item) => item.data() as T)
}

async function getSelectedWorkout(profile: UserProfile | null) {
  if (!profile?.selectedWorkoutId) return null
  const workoutRef = doc(db, COLLECTIONS.WORKOUTS, profile.selectedWorkoutId)
  const workoutSnap = await getDoc(workoutRef)
  return workoutSnap.exists() ? (workoutSnap.data() as Workout) : null
}

async function getInsightDataset(uid: string, periodDays: InsightPeriodDays) {
  const windowStart = startOfPeriod(periodDays)
  const windowStartMs = windowStart.getTime()
  const dateKeys = new Set(createDateKeys(periodDays))
  const maxLimit = Math.max(MAX_PERIOD_DAYS, periodDays)

  const profile = await profileService.getProfile(uid)
  const workoutPromise = getSelectedWorkout(profile)

  const [
    workout,
    dailyCheckins,
    weeklyCheckins,
    bodyCheckins,
    dietDays,
    hydrationDays,
    workoutSessions,
  ] = await Promise.all([
    workoutPromise,
    listRecentSubcollection<DailyCheckin>(uid, SUB_COLLECTIONS.DAILY_CHECKINS, 'dateKey', maxLimit),
    listRecentSubcollection(uid, SUB_COLLECTIONS.WEEKLY_CHECKINS, 'weekKey', 12),
    listRecentSubcollection<BodyCheckin>(uid, SUB_COLLECTIONS.BODY_CHECKINS, 'date', 12),
    listRecentSubcollection<DietDay>(uid, SUB_COLLECTIONS.DIET_DAYS, 'dateKey', maxLimit),
    listRecentSubcollection<HydrationDay>(uid, SUB_COLLECTIONS.HYDRATION_DAYS, 'dateKey', maxLimit),
    workoutSessionService.getRecentSessions(uid, 50),
  ])

  const periodDailyCheckins = dailyCheckins.filter((entry) => dateKeys.has(entry.dateKey))
  const periodDietDays = dietDays.filter((entry) => dateKeys.has(entry.dateKey))
  const periodHydrationDays = hydrationDays.filter((entry) => dateKeys.has(entry.dateKey))
  const completedSessions = workoutSessions.filter(isCompletedSession)
  const periodWorkoutSessions = completedSessions.filter((session) => dateMillis(sessionDate(session)) >= windowStartMs)

  return {
    uid,
    periodDays,
    profile,
    workout,
    dailyCheckins,
    weeklyCheckins,
    bodyCheckins,
    dietDays,
    hydrationDays,
    workoutSessions: completedSessions,
    periodDailyCheckins,
    periodDietDays,
    periodHydrationDays,
    periodWorkoutSessions,
  }
}

function buildChurnRisk(dataset: Awaited<ReturnType<typeof getInsightDataset>>): StudentChurnRisk {
  let score = 0
  const reasons: string[] = []

  const latestDailyCheckin = dataset.dailyCheckins[0]
  const latestWorkout = dataset.workoutSessions[0]
  const lastCheckinGap = latestDailyCheckin ? daysSince(latestDailyCheckin.dateKey) : Number.POSITIVE_INFINITY
  const lastWorkoutGap = latestWorkout ? daysSince(sessionDate(latestWorkout)) : Number.POSITIVE_INFINITY

  if (lastCheckinGap >= 3) {
    score += 30
    reasons.push(`Sem check-in diário nos últimos ${Number.isFinite(lastCheckinGap) ? lastCheckinGap : 3} dias`)
  }

  if (lastWorkoutGap >= 5) {
    score += 25
    reasons.push(`Sem treino registrado nos últimos ${Number.isFinite(lastWorkoutGap) ? lastWorkoutGap : 5} dias`)
  }

  const dietAverage = average(dataset.periodDietDays.map(calculateDietAdherence))
  if (dataset.periodDietDays.length === 0 || dietAverage < 40) {
    score += 20
    reasons.push('Aderência de dieta abaixo de 40%')
  }

  const hydrationAverage = average(
    dataset.periodHydrationDays.map((entry) => {
      const goal = typeof entry.goalMl === 'number' && entry.goalMl > 0
        ? entry.goalMl
        : typeof dataset.profile?.waterGoalMl === 'number' && dataset.profile.waterGoalMl > 0
          ? dataset.profile.waterGoalMl
          : 2500
      return goal > 0 ? clampPercentage((Number(entry.totalMl || 0) / goal) * 100) : 0
    }),
  )

  if (dataset.periodHydrationDays.length === 0 || hydrationAverage < 40) {
    score += 15
    reasons.push('Hidratação abaixo da meta')
  }

  if (dataset.profile?.recommendationsNeedRefresh) {
    score += 10
    reasons.push('Recomendações desatualizadas')
  }

  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
  return { level, score, reasons }
}

function buildCycleInsight(summary: StudentInsightSummary): StudentCycleInsight {
  const empty = summary.automatedFeedback.title === EMPTY_FEEDBACK_TITLE
  const highlights = [
    `Treinos: ${summary.adherence.workoutsCompleted}/${summary.adherence.workoutTarget || 0}`,
    `Dieta: ${summary.adherence.dietAverageAdherencePct}%`,
    `Água: ${summary.adherence.hydrationAveragePct}%`,
    `Check-ins: ${summary.adherence.dailyCheckinsCompleted}/${summary.periodDays}`,
  ]

  const operationalAlerts = summary.churnRisk.reasons.length > 0
    ? summary.churnRisk.reasons
    : ['Sem alertas operacionais relevantes no momento']

  return {
    periodDays: normalizePeriodDays(summary.periodDays),
    generatedAt: summary.generatedAt,
    headline: summary.automatedFeedback.title,
    summary: summary.automatedFeedback.message,
    highlights,
    operationalAlerts,
    empty,
  }
}

export const studentInsightService = {
  async getStudentInsightSummary(uid: string): Promise<StudentInsightSummary> {
    const dataset = await getInsightDataset(uid, DEFAULT_PERIOD_DAYS)
    const generatedAt = nowTimestamp()
    const workoutTarget = computeWorkoutTarget(dataset.periodDays, resolveWorkoutFrequency(dataset.profile, dataset.workout))
    const workoutsCompleted = dataset.periodWorkoutSessions.length
    const workoutAdherencePct = workoutTarget > 0 ? clampPercentage((workoutsCompleted / workoutTarget) * 100) : 0
    const dietAverageAdherencePct = average(dataset.periodDietDays.map(calculateDietAdherence))
    const hydrationAveragePct = average(
      dataset.periodHydrationDays.map((entry) => {
        const goal = typeof entry.goalMl === 'number' && entry.goalMl > 0
          ? entry.goalMl
          : typeof dataset.profile?.waterGoalMl === 'number' && dataset.profile.waterGoalMl > 0
            ? dataset.profile.waterGoalMl
            : 2500
        return goal > 0 ? clampPercentage((Number(entry.totalMl || 0) / goal) * 100) : 0
      }),
    )
    const dailyCheckinsCompleted = dataset.periodDailyCheckins.length
    const dailyCheckinAdherencePct = clampPercentage((dailyCheckinsCompleted / dataset.periodDays) * 100)

    const latestBodyCheckin = dataset.bodyCheckins[0]
    const previousBodyCheckin = dataset.bodyCheckins[1]
    const latestWeightKg = latestBodyCheckin?.weightKg
    const previousWeightKg = previousBodyCheckin?.weightKg
    const latestBodyFatPct = latestBodyCheckin ? bodyFatPct(latestBodyCheckin) ?? undefined : undefined
    const previousBodyFatPct = previousBodyCheckin ? bodyFatPct(previousBodyCheckin) ?? undefined : undefined
    const weightDeltaKg = weightDelta(latestWeightKg, previousWeightKg) ?? undefined
    const bodyFatDeltaPct = weightDelta(latestBodyFatPct, previousBodyFatPct) ?? undefined

    const totalTonnage = Math.round(
      dataset.periodWorkoutSessions.reduce((sum, session) => {
        const sessionTonnage = typeof session.totalTonnageKg === 'number'
          ? session.totalTonnageKg
          : (session.logs || []).reduce((logSum, log) => logSum + setPerformanceValue(log), 0)
        return sum + sessionTonnage
      }, 0),
    )

    const bestProgressHighlights = buildPerformanceHighlights(dataset.periodWorkoutSessions)
    const churnRisk = buildChurnRisk(dataset)

    const hasAnyData =
      workoutsCompleted > 0 ||
      dataset.periodDietDays.length > 0 ||
      dataset.periodHydrationDays.length > 0 ||
      dataset.periodDailyCheckins.length > 0 ||
      dataset.bodyCheckins.length > 0
    const hasEnoughData = hasEnoughInsightData({
      workoutsCompleted,
      dailyCheckinsCompleted,
      dietDaysLogged: dataset.periodDietDays.length,
      hydrationDaysLogged: dataset.periodHydrationDays.length,
      bodyCheckinsCount: dataset.bodyCheckins.length,
    })

    const automatedFeedback = buildAutomatedFeedback({
      periodDays: dataset.periodDays,
      workoutsCompleted,
      workoutTarget,
      dietDaysLogged: dataset.periodDietDays.length,
      dietAverageAdherencePct,
      hydrationAveragePct,
      dailyCheckinsCompleted,
      churnRisk,
      hasAnyData,
      hasEnoughData,
      performanceHighlightsCount: bestProgressHighlights.length,
    })

    return {
      periodDays: dataset.periodDays,
      adherence: {
        workoutsCompleted,
        ...(workoutTarget > 0 ? { workoutTarget } : {}),
        workoutAdherencePct,
        dietDaysLogged: dataset.periodDietDays.length,
        dietAverageAdherencePct,
        hydrationAveragePct,
        dailyCheckinsCompleted,
        dailyCheckinAdherencePct,
      },
      evolution: {
        ...(latestWeightKg !== undefined ? { latestWeightKg } : {}),
        ...(previousWeightKg !== undefined ? { previousWeightKg } : {}),
        ...(weightDeltaKg !== undefined ? { weightDeltaKg } : {}),
        ...(latestBodyFatPct !== undefined ? { latestBodyFatPct } : {}),
        ...(previousBodyFatPct !== undefined ? { previousBodyFatPct } : {}),
        ...(bodyFatDeltaPct !== undefined ? { bodyFatDeltaPct } : {}),
      },
      performance: {
        totalSessions: workoutsCompleted,
        totalTonnage,
        bestProgressHighlights,
      },
      churnRisk,
      automatedFeedback,
      generatedAt,
    }
  },

  async generateCycleInsight(uid: string, options?: { days?: InsightPeriodDays }): Promise<StudentCycleInsight> {
    const summary = await this.getStudentInsightSummary(uid)
    if (!options?.days || options.days === summary.periodDays) {
      return buildCycleInsight(summary)
    }

    const dataset = await getInsightDataset(uid, normalizePeriodDays(options.days))
    const customSummary = await this.buildCustomSummaryFromDataset(dataset)
    return buildCycleInsight(customSummary)
  },

  async getChurnRisk(uid: string): Promise<StudentChurnRisk> {
    const dataset = await getInsightDataset(uid, DEFAULT_PERIOD_DAYS)
    return buildChurnRisk(dataset)
  },

  async buildCustomSummaryFromDataset(dataset: Awaited<ReturnType<typeof getInsightDataset>>): Promise<StudentInsightSummary> {
    const workoutTarget = computeWorkoutTarget(dataset.periodDays, resolveWorkoutFrequency(dataset.profile, dataset.workout))
    const workoutsCompleted = dataset.periodWorkoutSessions.length
    const summary = await this.getStudentInsightSummary(dataset.uid)
    if (dataset.periodDays === DEFAULT_PERIOD_DAYS) return summary

    const dietAverageAdherencePct = average(dataset.periodDietDays.map(calculateDietAdherence))
    const hydrationAveragePct = average(
      dataset.periodHydrationDays.map((entry) => {
        const goal = typeof entry.goalMl === 'number' && entry.goalMl > 0
          ? entry.goalMl
          : typeof dataset.profile?.waterGoalMl === 'number' && dataset.profile.waterGoalMl > 0
            ? dataset.profile.waterGoalMl
            : 2500
        return goal > 0 ? clampPercentage((Number(entry.totalMl || 0) / goal) * 100) : 0
      }),
    )
    const dailyCheckinsCompleted = dataset.periodDailyCheckins.length
    const churnRisk = buildChurnRisk(dataset)
    const bestProgressHighlights = buildPerformanceHighlights(dataset.periodWorkoutSessions)
    const hasAnyData =
      workoutsCompleted > 0 ||
      dataset.periodDietDays.length > 0 ||
      dataset.periodHydrationDays.length > 0 ||
      dataset.periodDailyCheckins.length > 0 ||
      dataset.bodyCheckins.length > 0
    const hasEnoughData = hasEnoughInsightData({
      workoutsCompleted,
      dailyCheckinsCompleted,
      dietDaysLogged: dataset.periodDietDays.length,
      hydrationDaysLogged: dataset.periodHydrationDays.length,
      bodyCheckinsCount: dataset.bodyCheckins.length,
    })

    return {
      ...summary,
      periodDays: dataset.periodDays,
      adherence: {
        workoutsCompleted,
        ...(workoutTarget > 0 ? { workoutTarget } : {}),
        workoutAdherencePct: workoutTarget > 0 ? clampPercentage((workoutsCompleted / workoutTarget) * 100) : 0,
        dietDaysLogged: dataset.periodDietDays.length,
        dietAverageAdherencePct,
        hydrationAveragePct,
        dailyCheckinsCompleted,
        dailyCheckinAdherencePct: clampPercentage((dailyCheckinsCompleted / dataset.periodDays) * 100),
      },
      performance: {
        totalSessions: workoutsCompleted,
        totalTonnage: Math.round(
          dataset.periodWorkoutSessions.reduce((sum, session) => {
            const sessionTonnage = typeof session.totalTonnageKg === 'number'
              ? session.totalTonnageKg
              : (session.logs || []).reduce((logSum, log) => logSum + setPerformanceValue(log), 0)
            return sum + sessionTonnage
          }, 0),
        ),
        bestProgressHighlights,
      },
      churnRisk,
      automatedFeedback: buildAutomatedFeedback({
        periodDays: dataset.periodDays,
        workoutsCompleted,
        workoutTarget,
        dietDaysLogged: dataset.periodDietDays.length,
        dietAverageAdherencePct,
        hydrationAveragePct,
        dailyCheckinsCompleted,
        churnRisk,
        hasAnyData,
        hasEnoughData,
        performanceHighlightsCount: bestProgressHighlights.length,
      }),
      generatedAt: nowTimestamp(),
    }
  },
}
