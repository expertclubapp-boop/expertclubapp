import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { dateMillis, fromFirestoreDate, nowTimestamp, type FirestoreDateInput } from '../lib/firebase/date'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { BodyCheckin, DailyCheckin, DietDay, HydrationDay, UserProfile, WeeklyCheckin, Workout, WorkoutSession } from '../types/domain'
import { profileService } from './profileService'
import { studentInsightService } from './studentInsightService'
import { workoutSessionService } from './workoutSessionService'

type EvolutionPeriodDays = 15 | 30
type ConsistencyLevel = 'low' | 'medium' | 'high'
type PhotoType = 'front' | 'side' | 'back' | 'other'

export type StudentEvolutionReport = {
  periodDays: EvolutionPeriodDays
  period: {
    startAt: Timestamp
    endAt: Timestamp
  }
  body: {
    latestWeightKg?: number
    previousWeightKg?: number
    weightDeltaKg?: number
    latestBodyFatPct?: number
    previousBodyFatPct?: number
    bodyFatDeltaPct?: number
    latestPhotos?: Array<{
      url: string
      type?: PhotoType
      createdAt?: Timestamp
    }>
    hasEnoughBodyData: boolean
  }
  training: {
    completedSessions: number
    totalTonnage: number
    lastWorkoutAt?: Timestamp
    bestHighlights: Array<{
      exerciseName: string
      metric: string
      value: string
    }>
  }
  diet: {
    loggedDays: number
    averageAdherencePct: number
    bestDayPct?: number
  }
  hydration: {
    averagePct: number
    averageMl?: number
    goalMl?: number
  }
  checkins: {
    dailyCompleted: number
    dailyExpected: number
    weeklyCompleted: number
    latestMood?: string
    latestEnergy?: string
  }
  consistency: {
    score: number
    level: ConsistencyLevel
    label: string
    reasons: string[]
  }
  automatedSummary: {
    title: string
    message: string
    bullets: string[]
    ctaLabel?: string
    ctaTo?: string
  }
  generatedAt: Timestamp
  isPartial?: boolean
  warnings?: string[]
}

type SessionHighlightCandidate = {
  exerciseName: string
  metric: string
  score: number
  value: string
}

function normalizePeriodDays(days?: number): EvolutionPeriodDays {
  return days === 30 ? 30 : 15
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function round1(value: number) {
  return Number(value.toFixed(1))
}

function formatSigned(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfPeriod(days: EvolutionPeriodDays) {
  const date = startOfToday()
  date.setDate(date.getDate() - (days - 1))
  return date
}

function safeTimestamp(value: unknown) {
  const date = fromFirestoreDate(value as FirestoreDateInput)
  return date ? Timestamp.fromDate(date) : undefined
}

function isCompletedSession(session: WorkoutSession) {
  return session.status === 'completed'
}

function sessionDate(session: WorkoutSession) {
  return session.completedAt || session.finishedAt || session.startedAt
}

function readNumberField(input: unknown, key: string) {
  if (!input || typeof input !== 'object') return null
  const raw = (input as Record<string, unknown>)[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const parsed = Number(raw.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function bodyFatPct(checkin: BodyCheckin) {
  return readNumberField(checkin, 'bodyFatPct') ?? readNumberField(checkin, 'bodyFat')
}

function dateDelta(current?: number, previous?: number) {
  if (typeof current !== 'number' || typeof previous !== 'number') return undefined
  return round1(current - previous)
}

function calculateDietAdherence(entry: DietDay) {
  if (typeof entry.adherencePercent === 'number' && Number.isFinite(entry.adherencePercent)) {
    return clampPct(entry.adherencePercent)
  }

  const totalItems = typeof entry.totalItemsCount === 'number' ? entry.totalItemsCount : 0
  const completedItems = typeof entry.completedItemsCount === 'number' ? entry.completedItemsCount : 0
  if (totalItems <= 0) return 0
  return clampPct((completedItems / totalItems) * 100)
}

function getHydrationGoal(entry: HydrationDay, profile: UserProfile | null) {
  if (typeof entry.goalMl === 'number' && entry.goalMl > 0) return entry.goalMl
  if (typeof profile?.waterGoalMl === 'number' && profile.waterGoalMl > 0) return profile.waterGoalMl
  if (typeof profile?.weightKg === 'number' && profile.weightKg > 0) return Math.round(profile.weightKg * 35)
  if (typeof profile?.weight === 'number' && profile.weight > 0) return Math.round(profile.weight * 35)
  return 2500
}

function resolveWorkoutFrequency(profile: UserProfile | null, workout: Workout | null) {
  const workoutFrequency = typeof workout?.daysPerWeek === 'number' ? workout.daysPerWeek : 0
  if (workoutFrequency > 0) return workoutFrequency
  const profileFrequency = typeof profile?.trainingFrequency === 'number' ? profile.trainingFrequency : 0
  return profileFrequency > 0 ? profileFrequency : 0
}

function computeWorkoutTarget(periodDays: EvolutionPeriodDays, weeklyTarget: number) {
  if (weeklyTarget <= 0) return 0
  return Math.round((weeklyTarget * periodDays) / 7)
}

function getExerciseName(session: WorkoutSession, exerciseId: string) {
  const substitution = session.substitutions?.[exerciseId]
  if (substitution?.exerciseName) return substitution.exerciseName
  const matchingPr = session.prs?.find((entry) => entry.exerciseId === exerciseId)
  if (matchingPr?.exerciseName) return matchingPr.exerciseName
  return 'Exercício'
}

function buildTrainingHighlights(sessions: WorkoutSession[]) {
  const byExercise = new Map<string, { exerciseName: string; loads: number[]; volumes: number[] }>()

  sessions.forEach((session) => {
    const grouped = new Map<string, Array<{ loadKg: number; reps: number }>>()
    ;(session.logs || []).forEach((log) => {
      if (!Number.isFinite(log.loadKg) || !Number.isFinite(log.reps)) return
      if (log.loadKg < 0 || log.reps <= 0) return
      grouped.set(log.exerciseId, [...(grouped.get(log.exerciseId) || []), { loadKg: log.loadKg, reps: log.reps }])
    })

    grouped.forEach((logs, exerciseId) => {
      const exerciseName = getExerciseName(session, exerciseId)
      const maxLoad = logs.reduce((best, log) => Math.max(best, log.loadKg), 0)
      const totalVolume = logs.reduce((sum, log) => sum + (log.loadKg * log.reps), 0)
      const current = byExercise.get(exerciseId)

      if (!current) {
        byExercise.set(exerciseId, { exerciseName, loads: [maxLoad], volumes: [totalVolume] })
        return
      }

      current.loads.push(maxLoad)
      current.volumes.push(totalVolume)
    })
  })

  const candidates: SessionHighlightCandidate[] = []

  byExercise.forEach((entry) => {
    const orderedLoads = entry.loads.filter((value) => value > 0).sort((a, b) => b - a)
    const orderedVolumes = entry.volumes.filter((value) => value > 0).sort((a, b) => b - a)

    if (orderedLoads.length > 0) {
      candidates.push({
        exerciseName: entry.exerciseName,
        metric: 'Melhor carga registrada',
        score: orderedLoads[0],
        value: `${orderedLoads[0].toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`,
      })
    }

    if (orderedVolumes.length > 0) {
      candidates.push({
        exerciseName: entry.exerciseName,
        metric: 'Maior volume do período',
        score: orderedVolumes[0],
        value: `${Math.round(orderedVolumes[0]).toLocaleString('pt-BR')} kg`,
      })
    }
  })

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => ({
      exerciseName: entry.exerciseName,
      metric: entry.metric,
      value: entry.value,
    }))
}

function buildLatestPhotos(checkin?: BodyCheckin) {
  if (!checkin) return undefined

  const createdAt = safeTimestamp(checkin.createdAt) || safeTimestamp(checkin.date)
  const photoEntries: Array<{ key: keyof BodyCheckin['photoUrls']; type: PhotoType }> = [
    { key: 'front', type: 'front' },
    { key: 'side', type: 'side' },
    { key: 'back', type: 'back' },
    { key: 'extra', type: 'other' },
  ]

  const photos = photoEntries
    .map(({ key, type }) => {
      const url = checkin.photoUrls?.[key]
      if (!url) return null

      return {
        url,
        type,
        ...(createdAt ? { createdAt } : {}),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return photos.length > 0 ? photos : undefined
}

function buildConsistency(input: {
  workoutAdherencePct: number
  dietAverageAdherencePct: number
  hydrationAveragePct: number
  dailyCheckinAdherencePct: number
}) {
  const workoutPoints = Math.round((input.workoutAdherencePct / 100) * 30)
  const dietPoints = Math.round((input.dietAverageAdherencePct / 100) * 30)
  const hydrationPoints = Math.round((input.hydrationAveragePct / 100) * 20)
  const checkinPoints = Math.round((input.dailyCheckinAdherencePct / 100) * 20)
  const score = Math.max(0, Math.min(100, workoutPoints + dietPoints + hydrationPoints + checkinPoints))

  const reasons: string[] = []

  if (input.workoutAdherencePct >= 70) reasons.push('Boa frequência de treinos no período')
  else reasons.push('Frequência de treinos abaixo do esperado')

  if (input.dietAverageAdherencePct >= 70) reasons.push('Dieta registrada com boa aderência')
  else if (input.dietAverageAdherencePct > 0) reasons.push('Dieta registrada em poucos dias')
  else reasons.push('Ainda faltam registros de dieta no período')

  if (input.hydrationAveragePct >= 80) reasons.push('Hidratação próxima da meta')
  else reasons.push('Hidratação abaixo da meta')

  if (input.dailyCheckinAdherencePct >= 70) reasons.push('Check-ins diários consistentes')
  else reasons.push('Poucos check-ins diários no período')

  const level: ConsistencyLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const label = level === 'high' ? 'Alta consistência' : level === 'medium' ? 'Consistência média' : 'Baixa consistência'

  return { score, level, label, reasons }
}

function buildAutomatedSummary(input: {
  periodDays: EvolutionPeriodDays
  hasAnyData: boolean
  bodyDataCount: number
  weightDeltaKg?: number
  completedSessions: number
  workoutTarget: number
  dietLoggedDays: number
  dietAverageAdherencePct: number
  hydrationAveragePct: number
  dailyCompleted: number
  consistency: ReturnType<typeof buildConsistency>
}) {
  if (!input.hasAnyData) {
    return {
      title: 'Dados insuficientes para evolução',
      message: 'Ainda não temos dados suficientes para avaliar sua evolução com precisão. Volte ao básico: registre treino, dieta, água e check-in diário pelos próximos dias.',
      bullets: [
        'Registre seu treino para destravar volume e highlights reais.',
        'Registre refeições e água por alguns dias para criar sua linha de base.',
      ],
      ctaLabel: 'Continuar plano',
      ctaTo: '/app/today',
    }
  }

  if (input.consistency.level === 'low') {
    return {
      title: 'Seu ciclo teve poucos registros',
      message: 'Ainda faltam dados para avaliar sua evolução com segurança. Volte ao básico hoje: registre treino, dieta, água e check-in diário.',
      bullets: [
        `Treinos concluídos: ${input.completedSessions}${input.workoutTarget > 0 ? ` de ${input.workoutTarget}` : ''}`,
        `Check-ins diários: ${input.dailyCompleted}/${input.periodDays}`,
        `Hidratação média: ${input.hydrationAveragePct}% da meta`,
      ],
      ctaLabel: 'Registrar check-in',
      ctaTo: '/app/checkin/daily',
    }
  }

  if (typeof input.weightDeltaKg === 'number' && input.bodyDataCount >= 2) {
    return {
      title: 'Sua evolução corporal já começou a aparecer',
      message: `Seu peso mudou ${formatSigned(input.weightDeltaKg)} kg desde o último check-in. Combine esse dado com fotos, treino e aderência para entender melhor sua evolução.`,
      bullets: [
        `Treinos concluídos no período: ${input.completedSessions}${input.workoutTarget > 0 ? ` de ${input.workoutTarget}` : ''}`,
        `Aderência média da dieta: ${input.dietAverageAdherencePct}%`,
        `Hidratação média: ${input.hydrationAveragePct}% da meta`,
      ],
      ctaLabel: 'Fazer check-in de evolução',
      ctaTo: '/app/evolution/checkin',
    }
  }

  return {
    title: 'Você manteve uma boa consistência neste ciclo',
    message: `Completou ${input.completedSessions} treino(s), registrou sua dieta em ${input.dietLoggedDays} dia(s) e manteve seus check-ins ativos. Continue registrando cargas e água para deixar sua próxima análise mais precisa.`,
    bullets: [
      `${input.consistency.label} nos últimos ${input.periodDays} dias`,
      `Dieta média: ${input.dietAverageAdherencePct}%`,
      `Água média: ${input.hydrationAveragePct}% da meta`,
    ],
    ctaLabel: 'Ver dieta de hoje',
    ctaTo: '/app/diets/today',
  }
}

async function listRecentSubcollection<T>(uid: string, subcollection: string, orderField: string, maxLimit: number) {
  const path = getSubCollectionPath(COLLECTIONS.USERS, uid, subcollection)
  const snapshot = await getDocs(query(collection(db, path), orderBy(orderField, 'desc'), limit(maxLimit)))
  return snapshot.docs.map((item) => item.data() as T)
}

async function getSelectedWorkout(profile: UserProfile | null) {
  if (!profile?.selectedWorkoutId) return null
  const workoutRef = doc(db, COLLECTIONS.WORKOUTS, profile.selectedWorkoutId)
  const workoutSnap = await getDoc(workoutRef)
  return workoutSnap.exists() ? (workoutSnap.data() as Workout) : null
}

async function getDataset(uid: string, periodDays: EvolutionPeriodDays) {
  const startAt = startOfPeriod(periodDays)
  const endAt = new Date()
  const startAtMs = startAt.getTime()
  const maxLimit = periodDays === 30 ? 30 : 15

  const profile = await profileService.getProfile(uid)
  const workoutPromise = getSelectedWorkout(profile)

  const [
    workout,
    bodyCheckins,
    dailyCheckins,
    weeklyCheckins,
    dietDays,
    hydrationDays,
    workoutSessions,
    insightSummary,
  ] = await Promise.all([
    workoutPromise,
    listRecentSubcollection<BodyCheckin>(uid, SUB_COLLECTIONS.BODY_CHECKINS, 'date', 12),
    listRecentSubcollection<DailyCheckin>(uid, SUB_COLLECTIONS.DAILY_CHECKINS, 'dateKey', maxLimit),
    listRecentSubcollection<WeeklyCheckin>(uid, SUB_COLLECTIONS.WEEKLY_CHECKINS, 'weekKey', 8),
    listRecentSubcollection<DietDay>(uid, SUB_COLLECTIONS.DIET_DAYS, 'dateKey', maxLimit),
    listRecentSubcollection<HydrationDay>(uid, SUB_COLLECTIONS.HYDRATION_DAYS, 'dateKey', maxLimit),
    workoutSessionService.getRecentSessions(uid, 60),
    studentInsightService.getStudentInsightSummary(uid),
  ])

  const completedSessions = workoutSessions.filter(isCompletedSession)
  const periodSessions = completedSessions.filter((session) => dateMillis(sessionDate(session)) >= startAtMs)
  const periodWeeklyCheckins = weeklyCheckins.filter((entry) => dateMillis(entry.createdAt) >= startAtMs)

  return {
    periodDays,
    period: {
      startAt: Timestamp.fromDate(startAt),
      endAt: Timestamp.fromDate(endAt),
    },
    profile,
    workout,
    bodyCheckins,
    dailyCheckins,
    weeklyCheckins: periodWeeklyCheckins,
    dietDays,
    hydrationDays,
    workoutSessions: periodSessions,
    insightSummary,
  }
}

export const studentEvolutionReportService = {
  async getStudentEvolutionReport(
    uid: string,
    options?: {
      periodDays?: EvolutionPeriodDays
    },
  ): Promise<StudentEvolutionReport> {
    const periodDays = normalizePeriodDays(options?.periodDays)
    const dataset = await getDataset(uid, periodDays)
    const warnings: string[] = []

    const latestBodyCheckin = dataset.bodyCheckins[0]
    const previousBodyCheckin = dataset.bodyCheckins[1]
    const latestWeightKg = latestBodyCheckin?.weightKg
    const previousWeightKg = previousBodyCheckin?.weightKg
    const latestBodyFatPct = latestBodyCheckin ? bodyFatPct(latestBodyCheckin) ?? undefined : undefined
    const previousBodyFatPct = previousBodyCheckin ? bodyFatPct(previousBodyCheckin) ?? undefined : undefined
    const weightDeltaKg = dateDelta(latestWeightKg, previousWeightKg)
    const bodyFatDeltaPct = dateDelta(latestBodyFatPct, previousBodyFatPct)
    const latestPhotos = buildLatestPhotos(latestBodyCheckin)
    const hasEnoughBodyData = dataset.bodyCheckins.length >= 2

    if (dataset.bodyCheckins.length === 0) {
      warnings.push('Ainda não há check-in corporal para gerar comparativo de evolução.')
    } else if (!hasEnoughBodyData) {
      warnings.push('Ainda precisamos de pelo menos dois check-ins de evolução para comparar seu progresso corporal.')
    }

    const totalTonnage = Math.round(dataset.workoutSessions.reduce((sum, session) => {
      const sessionTonnage = typeof session.totalTonnageKg === 'number'
        ? session.totalTonnageKg
        : (session.logs || []).reduce((logSum, log) => logSum + (log.loadKg * log.reps), 0)
      return sum + sessionTonnage
    }, 0))
    const lastWorkoutAt = dataset.workoutSessions[0] ? safeTimestamp(sessionDate(dataset.workoutSessions[0])) : undefined
    const bestHighlights = buildTrainingHighlights(dataset.workoutSessions)

    if (dataset.workoutSessions.length === 0) {
      warnings.push('Sem treino concluído no período selecionado.')
    }

    const dietAdherenceValues = dataset.dietDays.map(calculateDietAdherence)
    const averageDietAdherencePct = average(dietAdherenceValues)
    const bestDayPct = dietAdherenceValues.length > 0 ? Math.max(...dietAdherenceValues) : undefined
    if (dataset.dietDays.length === 0) {
      warnings.push('Registre suas refeições por alguns dias para gerar uma análise de dieta.')
    }

    const hydrationPctValues = dataset.hydrationDays.map((entry) => {
      const goal = getHydrationGoal(entry, dataset.profile)
      return goal > 0 ? clampPct((Number(entry.totalMl || 0) / goal) * 100) : 0
    })
    const hydrationMlValues = dataset.hydrationDays
      .map((entry) => Number(entry.totalMl || 0))
      .filter((value) => Number.isFinite(value) && value >= 0)
    const averageHydrationPct = average(hydrationPctValues)
    const averageHydrationMl = hydrationMlValues.length > 0
      ? Math.round(hydrationMlValues.reduce((sum, value) => sum + value, 0) / hydrationMlValues.length)
      : undefined
    const hydrationGoalMl = dataset.hydrationDays[0]
      ? getHydrationGoal(dataset.hydrationDays[0], dataset.profile)
      : typeof dataset.profile?.waterGoalMl === 'number' && dataset.profile.waterGoalMl > 0
        ? dataset.profile.waterGoalMl
        : undefined

    if (dataset.hydrationDays.length === 0) {
      warnings.push('Ainda faltam registros de hidratação neste período.')
    }

    const dailyCompleted = dataset.dailyCheckins.length
    const dailyExpected = periodDays
    const weeklyCompleted = dataset.weeklyCheckins.length
    const latestDailyCheckin = dataset.dailyCheckins[0]
    const latestMood = latestDailyCheckin && Number.isFinite(latestDailyCheckin.mood)
      ? `${latestDailyCheckin.mood}/10`
      : undefined
    const latestEnergy = latestDailyCheckin?.energy || undefined
    if (dailyCompleted === 0) {
      warnings.push('Sem check-ins diários recentes para compor humor e energia.')
    }

    const workoutTarget = computeWorkoutTarget(periodDays, resolveWorkoutFrequency(dataset.profile, dataset.workout))
    const workoutAdherencePct = workoutTarget > 0
      ? clampPct((dataset.workoutSessions.length / workoutTarget) * 100)
      : clampPct((dataset.workoutSessions.length / Math.max(1, Math.ceil(periodDays / 7))) * 100)
    const dailyCheckinAdherencePct = clampPct((dailyCompleted / dailyExpected) * 100)

    const consistency = buildConsistency({
      workoutAdherencePct,
      dietAverageAdherencePct: averageDietAdherencePct,
      hydrationAveragePct: averageHydrationPct,
      dailyCheckinAdherencePct,
    })

    const hasAnyData =
      dataset.bodyCheckins.length > 0 ||
      dataset.workoutSessions.length > 0 ||
      dataset.dietDays.length > 0 ||
      dataset.hydrationDays.length > 0 ||
      dataset.dailyCheckins.length > 0

    const automatedSummary = buildAutomatedSummary({
      periodDays,
      hasAnyData,
      bodyDataCount: dataset.bodyCheckins.length,
      ...(typeof weightDeltaKg === 'number' ? { weightDeltaKg } : {}),
      completedSessions: dataset.workoutSessions.length,
      workoutTarget,
      dietLoggedDays: dataset.dietDays.length,
      dietAverageAdherencePct: averageDietAdherencePct,
      hydrationAveragePct: averageHydrationPct,
      dailyCompleted,
      consistency,
    })

    const report: StudentEvolutionReport = {
      periodDays,
      period: dataset.period,
      body: {
        ...(typeof latestWeightKg === 'number' ? { latestWeightKg } : {}),
        ...(typeof previousWeightKg === 'number' ? { previousWeightKg } : {}),
        ...(typeof weightDeltaKg === 'number' ? { weightDeltaKg } : {}),
        ...(typeof latestBodyFatPct === 'number' ? { latestBodyFatPct } : {}),
        ...(typeof previousBodyFatPct === 'number' ? { previousBodyFatPct } : {}),
        ...(typeof bodyFatDeltaPct === 'number' ? { bodyFatDeltaPct } : {}),
        ...(latestPhotos ? { latestPhotos } : {}),
        hasEnoughBodyData,
      },
      training: {
        completedSessions: dataset.workoutSessions.length,
        totalTonnage,
        ...(lastWorkoutAt ? { lastWorkoutAt } : {}),
        bestHighlights,
      },
      diet: {
        loggedDays: dataset.dietDays.length,
        averageAdherencePct: averageDietAdherencePct,
        ...(typeof bestDayPct === 'number' ? { bestDayPct } : {}),
      },
      hydration: {
        averagePct: averageHydrationPct,
        ...(typeof averageHydrationMl === 'number' ? { averageMl: averageHydrationMl } : {}),
        ...(typeof hydrationGoalMl === 'number' ? { goalMl: hydrationGoalMl } : {}),
      },
      checkins: {
        dailyCompleted,
        dailyExpected,
        weeklyCompleted,
        ...(latestMood ? { latestMood } : {}),
        ...(latestEnergy ? { latestEnergy } : {}),
      },
      consistency,
      automatedSummary,
      generatedAt: nowTimestamp(),
      ...(warnings.length > 0 ? { warnings } : {}),
    }

    if (!hasEnoughBodyData || !hasAnyData) {
      report.isPartial = true
    }

    return report
  },
}
