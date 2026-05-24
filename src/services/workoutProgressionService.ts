import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis, fromFirestoreDate, type FirestoreDateInput } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { SetLog, WorkoutPR, WorkoutSession } from '../types/domain'

const WORKOUT_PROGRESS_LIMITS = {
  SESSIONS: 50,
  RECENT_VOLUME: 8,
  TOP_EXERCISES: 3,
  RECENT_PERFORMANCES: 5,
} as const

export interface ExerciseProgression {
  exerciseId: string
  latestLoad?: number
  latestReps?: number
  latestDate?: FirestoreDateInput
  bestLoad?: number
  bestReps?: number
  bestDate?: FirestoreDateInput
  totalTonnage: number
  sessionsCount: number
  recentVolume: Array<{
    date: FirestoreDateInput
    tonnage: number
  }>
}

export interface WorkoutProgressExerciseSummary {
  exerciseId: string
  exerciseName: string
  latestLoad: number
  latestReps: number
  latestDate?: FirestoreDateInput
  bestLoad: number
  bestReps: number
  bestDate?: FirestoreDateInput
  totalTonnage: number
  sessionsCount: number
}

export interface WorkoutProgressSummary {
  totalSessions: number
  totalTonnage: number
  activeStreak: number
  lastSessionDate: FirestoreDateInput | null
  topExercises: WorkoutProgressExerciseSummary[]
  latestPerformances: WorkoutProgressExerciseSummary[]
}

type SessionExerciseMeta = {
  exerciseId: string
  exerciseName: string
}

function isValidSetLog(log: Partial<SetLog> | null | undefined) {
  if (!log) return false
  if (!Number.isFinite(log.reps) || !Number.isFinite(log.loadKg)) return false
  if ((log.reps ?? 0) <= 0) return false
  if ((log.loadKg ?? 0) < 0) return false
  return true
}

function setTonnage(log: Partial<SetLog> | null | undefined) {
  if (!isValidSetLog(log)) return 0
  return (log?.loadKg ?? 0) * (log?.reps ?? 0)
}

function completedSessionsFromSnap(docs: Array<{ data: () => unknown }>) {
  return docs
    .map((doc) => doc.data() as WorkoutSession)
    .filter((session) => session.status === 'completed')
}

function getSessionDate(session: WorkoutSession) {
  return session.completedAt || session.finishedAt || session.startedAt
}

function compareSessionDatesDesc(a: WorkoutSession, b: WorkoutSession) {
  return dateMillis(getSessionDate(b)) - dateMillis(getSessionDate(a))
}

function formatDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function uniqueSessionDays(sessions: WorkoutSession[]) {
  const dayKeys = new Set<string>()
  sessions.forEach((session) => {
    const date = fromFirestoreDate(getSessionDate(session))
    if (!date) return
    dayKeys.add(formatDayKey(date))
  })
  return [...dayKeys].sort().reverse()
}

function calculateActiveStreak(sessions: WorkoutSession[]) {
  const dayKeys = uniqueSessionDays(sessions)
  if (dayKeys.length === 0) return 0

  let streak = 0
  let cursor = new Date(`${dayKeys[0]}T00:00:00`)

  for (const key of dayKeys) {
    const expectedKey = formatDayKey(cursor)
    if (key !== expectedKey) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getExerciseMeta(session: WorkoutSession, exerciseId: string): SessionExerciseMeta {
  const substitution = session.substitutions?.[exerciseId]
  if (substitution) {
    return {
      exerciseId,
      exerciseName: substitution.exerciseName || 'Exercício',
    }
  }

  const pr = session.prs?.find((item: WorkoutPR) => item.exerciseId === exerciseId)
  if (pr) {
    return {
      exerciseId,
      exerciseName: pr.exerciseName || 'Exercício',
    }
  }

  return {
    exerciseId,
    exerciseName: 'Exercício',
  }
}

async function getCompletedSessions(studentId: string, limitCount = WORKOUT_PROGRESS_LIMITS.SESSIONS) {
  const path = getSubCollectionPath(COLLECTIONS.USERS, studentId, SUB_COLLECTIONS.WORKOUT_SESSIONS)
  const sessionsQuery = query(
    collection(db, path),
    orderBy('startedAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(sessionsQuery)
  return completedSessionsFromSnap(snap.docs).sort(compareSessionDatesDesc)
}

export const workoutProgressionService = {
  async getExerciseProgression(studentId: string, exerciseId: string): Promise<ExerciseProgression> {
    const sessions = await getCompletedSessions(studentId)

    let latestLoad = 0
    let latestReps = 0
    let latestDate: FirestoreDateInput | undefined
    let bestLoad = 0
    let bestReps = 0
    let bestDate: FirestoreDateInput | undefined
    let totalTonnage = 0
    let sessionsCount = 0
    const recentVolume: Array<{ date: FirestoreDateInput; tonnage: number }> = []

    sessions.forEach((session) => {
      const matchingLogs = (session.logs || []).filter((log) => log.exerciseId === exerciseId && isValidSetLog(log))
      if (matchingLogs.length === 0) return

      sessionsCount += 1
      const sessionDate = getSessionDate(session)
      const sessionTonnage = matchingLogs.reduce((sum, log) => sum + setTonnage(log), 0)
      totalTonnage += sessionTonnage

      if (recentVolume.length < WORKOUT_PROGRESS_LIMITS.RECENT_VOLUME) {
        recentVolume.push({ date: sessionDate, tonnage: sessionTonnage })
      }

      const latestLog = matchingLogs[matchingLogs.length - 1]
      if (!latestDate) {
        latestDate = sessionDate
        latestLoad = latestLog.loadKg
        latestReps = latestLog.reps
      }

      matchingLogs.forEach((log) => {
        if (log.loadKg > bestLoad || (log.loadKg === bestLoad && log.reps > bestReps)) {
          bestLoad = log.loadKg
          bestReps = log.reps
          bestDate = sessionDate
        }
      })
    })

    return {
      exerciseId,
      latestLoad: latestDate ? latestLoad : undefined,
      latestReps: latestDate ? latestReps : undefined,
      latestDate,
      bestLoad: bestDate ? bestLoad : undefined,
      bestReps: bestDate ? bestReps : undefined,
      bestDate,
      totalTonnage,
      sessionsCount,
      recentVolume,
    }
  },

  async getLatestExercisePerformance(studentId: string, exerciseId: string) {
    const progression = await this.getExerciseProgression(studentId, exerciseId)
    if (!progression.latestDate) return null
    return {
      latestLoad: progression.latestLoad ?? 0,
      latestReps: progression.latestReps ?? 0,
      latestDate: progression.latestDate,
    }
  },

  async getBestExercisePerformance(studentId: string, exerciseId: string) {
    const progression = await this.getExerciseProgression(studentId, exerciseId)
    if (!progression.bestDate) return null
    return {
      bestLoad: progression.bestLoad ?? 0,
      bestReps: progression.bestReps ?? 0,
      bestDate: progression.bestDate,
    }
  },

  async getWorkoutProgressionSummary(studentId: string): Promise<WorkoutProgressSummary> {
    const sessions = await getCompletedSessions(studentId)
    const exerciseMap = new Map<string, WorkoutProgressExerciseSummary>()

    let totalTonnage = 0

    sessions.forEach((session) => {
      const sessionDate = getSessionDate(session)
      const validLogs = (session.logs || []).filter((log) => isValidSetLog(log))
      const sessionTonnage = validLogs.reduce((sum, log) => sum + setTonnage(log), 0)
      totalTonnage += session.totalTonnageKg ?? sessionTonnage ?? 0

      const exerciseBuckets = new Map<string, SetLog[]>()
      validLogs.forEach((log) => {
        exerciseBuckets.set(log.exerciseId, [...(exerciseBuckets.get(log.exerciseId) || []), log])
      })

      exerciseBuckets.forEach((logs, exerciseId) => {
        const meta = getExerciseMeta(session, exerciseId)
        const sessionBest = logs.reduce((best, log) => {
          if (!best) return log
          if (log.loadKg > best.loadKg) return log
          if (log.loadKg === best.loadKg && log.reps > best.reps) return log
          return best
        }, undefined as SetLog | undefined)
        const sessionLatest = logs[logs.length - 1]
        const bucketTonnage = logs.reduce((sum, log) => sum + setTonnage(log), 0)

        const previous = exerciseMap.get(exerciseId)
        if (!previous) {
          exerciseMap.set(exerciseId, {
            exerciseId,
            exerciseName: meta.exerciseName,
            latestLoad: sessionLatest.loadKg,
            latestReps: sessionLatest.reps,
            latestDate: sessionDate,
            bestLoad: sessionBest?.loadKg ?? 0,
            bestReps: sessionBest?.reps ?? 0,
            bestDate: sessionDate,
            totalTonnage: bucketTonnage,
            sessionsCount: 1,
          })
          return
        }

        previous.totalTonnage += bucketTonnage
        previous.sessionsCount += 1

        if (!previous.latestDate) {
          previous.latestDate = sessionDate
          previous.latestLoad = sessionLatest.loadKg
          previous.latestReps = sessionLatest.reps
        }

        if (
          (sessionBest?.loadKg ?? 0) > previous.bestLoad ||
          ((sessionBest?.loadKg ?? 0) === previous.bestLoad && (sessionBest?.reps ?? 0) > previous.bestReps)
        ) {
          previous.bestLoad = sessionBest?.loadKg ?? previous.bestLoad
          previous.bestReps = sessionBest?.reps ?? previous.bestReps
          previous.bestDate = sessionDate
        }
      })
    })

    const exerciseSummaries = [...exerciseMap.values()]

    return {
      totalSessions: sessions.length,
      totalTonnage,
      activeStreak: calculateActiveStreak(sessions),
      lastSessionDate: sessions[0] ? getSessionDate(sessions[0]) : null,
      topExercises: exerciseSummaries
        .slice()
        .sort((a, b) => b.totalTonnage - a.totalTonnage)
        .slice(0, WORKOUT_PROGRESS_LIMITS.TOP_EXERCISES),
      latestPerformances: exerciseSummaries
        .slice()
        .sort((a, b) => dateMillis(b.latestDate) - dateMillis(a.latestDate))
        .slice(0, WORKOUT_PROGRESS_LIMITS.RECENT_PERFORMANCES),
    }
  },

  async getStudentWorkoutProgressSummary(studentId: string): Promise<WorkoutProgressSummary> {
    return this.getWorkoutProgressionSummary(studentId)
  },

  async getRecentWorkoutPerformance(studentId: string, limitCount = 5): Promise<WorkoutSession[]> {
    const sessions = await getCompletedSessions(studentId, WORKOUT_PROGRESS_LIMITS.SESSIONS)
    return sessions.slice(0, limitCount)
  },
}
