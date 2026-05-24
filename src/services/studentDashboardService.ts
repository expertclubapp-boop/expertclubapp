import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { fromFirestoreDate, safeDateKey } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type {
  DietDay,
  HydrationDay,
  StudentTodayDashboard,
  StudentTodayDashboardAlert,
} from '../types/domain'
import { bodyCheckinService } from './bodyCheckinService'
import { checkinService } from './checkinService'
import { dietService } from './dietService'
import { hydrationService } from './hydrationService'
import { profileService } from './profileService'
import { workoutService } from './workoutService'
import { workoutSessionService } from './workoutSessionService'

const DASHBOARD_HISTORY_LIMIT = 14
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

function startOfTodayMs() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}

function startOfWindowMs(days: number) {
  return startOfTodayMs() - (days - 1) * 24 * 60 * 60 * 1000
}

function toMillis(value: unknown) {
  return fromFirestoreDate(value as Parameters<typeof fromFirestoreDate>[0])?.getTime() ?? 0
}

function roundPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function getRecentDateKeys(days: number) {
  const today = new Date()
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    return safeDateKey(date)
  })
}

async function getRecentDietDays(uid: string, limitCount = DASHBOARD_HISTORY_LIMIT): Promise<DietDay[]> {
  const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.DIET_DAYS)
  const colRef = collection(db, path)
  const snap = await getDocs(query(colRef, orderBy('dateKey', 'desc'), limit(limitCount)))
  return snap.docs.map((entry) => entry.data() as DietDay)
}

function buildAlerts(data: Omit<StudentTodayDashboard, 'alerts' | 'nextAction'>): StudentTodayDashboardAlert[] {
  const alerts: StudentTodayDashboardAlert[] = []

  if (data.profile.recommendationsNeedRefresh) {
    alerts.push({
      type: 'info',
      title: 'Recomendações desatualizadas',
      message: 'Suas preferências mudaram. Atualize seus planos para manter o app alinhado com sua rotina atual.',
      actionLabel: 'Atualizar planos',
      actionTo: '/app/recommendations',
    })
  }

  if (!data.workout || !data.diet) {
    alerts.push({
      type: 'warning',
      title: 'Planos incompletos',
      message: 'Escolha treino e dieta para destravar seu acompanhamento diário completo.',
      actionLabel: 'Escolher planos',
      actionTo: '/app/recommendations',
    })
  }

  if (data.hydration.percentage < 50) {
    alerts.push({
      type: 'warning',
      title: 'Água abaixo da meta',
      message: 'Sua hidratação ainda está baixa hoje. Some mais alguns copos para não perder ritmo.',
      actionLabel: 'Registrar água',
      actionTo: '/app/hydration',
    })
  }

  if (data.weeklyAdherence.dietAverage > 0 && data.weeklyAdherence.dietAverage < 60) {
    alerts.push({
      type: 'info',
      title: 'Aderência alimentar baixa',
      message: 'Você registrou pouca dieta nesta semana. Volte a marcar as refeições para acompanhar melhor sua evolução.',
      actionLabel: 'Ver dieta de hoje',
      actionTo: '/app/diets/today',
    })
  }

  if (data.evolutionCheckin.isDue) {
    alerts.push({
      type: 'warning',
      title: 'Check-in de evolução pendente',
      message: 'Atualize peso e fotos para manter sua evolução acompanhada no ciclo atual.',
      actionLabel: 'Enviar evolução',
      actionTo: '/app/evolution/checkin',
    })
  }

  if (!alerts.length) {
    alerts.push({
      type: 'success',
      title: 'Rotina em dia',
      message: 'Seu painel diário está pronto para guiar o próximo passo sem depender de intervenção manual.',
    })
  }

  return alerts.slice(0, 3)
}

function buildNextAction(data: Omit<StudentTodayDashboard, 'alerts' | 'nextAction'>): StudentTodayDashboard['nextAction'] {
  if (data.profile.recommendationsNeedRefresh) {
    return {
      title: 'Atualizar meus planos',
      description: 'Suas preferências mudaram. Gere recomendações mais alinhadas com sua rotina atual.',
      ctaLabel: 'Atualizar planos',
      to: '/app/recommendations',
    }
  }

  if (!data.workout || !data.diet) {
    return {
      title: 'Escolher meus planos',
      description: 'Selecione treino e dieta para destravar seu fluxo diário completo.',
      ctaLabel: 'Escolher planos',
      to: '/app/recommendations',
    }
  }

  if (!data.dailyCheckin.completedToday) {
    return {
      title: 'Fazer check-in diário',
      description: 'Leva menos de 1 minuto e mantém sua evolução acompanhada.',
      ctaLabel: 'Fazer check-in',
      to: '/app/checkin/daily',
    }
  }

  if (!data.workout.completedToday && data.workout.selectedWorkoutId) {
    return {
      title: 'Iniciar treino',
      description: 'Seu treino do dia já está pronto para execução.',
      ctaLabel: 'Iniciar treino',
      to: `/app/workouts/${data.workout.selectedWorkoutId}`,
    }
  }

  if (data.diet.selectedDietId && data.diet.completedMealsToday < data.diet.totalMealsToday) {
    return {
      title: 'Registrar dieta',
      description: 'Atualize suas refeições de hoje para acompanhar melhor sua aderência.',
      ctaLabel: 'Registrar dieta',
      to: '/app/diets/today',
    }
  }

  if (data.hydration.percentage < 100) {
    return {
      title: 'Registrar água',
      description: 'Sua hidratação ainda não bateu a meta diária.',
      ctaLabel: 'Registrar água',
      to: '/app/hydration',
    }
  }

  if (data.evolutionCheckin.isDue) {
    return {
      title: 'Enviar evolução',
      description: 'Seu check-in quinzenal já está disponível para atualização.',
      ctaLabel: 'Enviar evolução',
      to: '/app/evolution/checkin',
    }
  }

  return {
    title: 'Ver minha evolução',
    description: 'Tudo certo por hoje. Agora vale acompanhar como sua consistência está evoluindo.',
    ctaLabel: 'Ver evolução',
    to: '/app/evolution',
  }
}

export const studentDashboardService = {
  async getStudentTodayDashboard(uid: string): Promise<StudentTodayDashboard> {
    const profile = await profileService.getProfile(uid)
    const todayKey = safeDateKey()
    const weekStartMs = startOfWindowMs(7)
    const recentDateKeys = new Set(getRecentDateKeys(7))

    const [
      todayHydration,
      todayDailyCheckin,
      recentDailyCheckins,
      recentBodyCheckins,
      recentHydrationHistory,
      recentSessions,
      recentDietDays,
      workout,
      diet,
    ] = await Promise.all([
      hydrationService.getToday(uid),
      checkinService.getDailyCheckin(uid, todayKey),
      checkinService.getRecentDailyCheckins(uid, DASHBOARD_HISTORY_LIMIT),
      bodyCheckinService.getRecent(uid, 4),
      hydrationService.getRecentHistory(uid, DASHBOARD_HISTORY_LIMIT),
      workoutSessionService.getRecentSessions(uid, DASHBOARD_HISTORY_LIMIT),
      getRecentDietDays(uid, DASHBOARD_HISTORY_LIMIT),
      profile?.selectedWorkoutId ? workoutService.getById(profile.selectedWorkoutId) : Promise.resolve(null),
      profile?.selectedDietId ? dietService.getById(profile.selectedDietId) : Promise.resolve(null),
    ])

    const completedSessionsThisWeek = recentSessions.filter((session) => {
      const startedAtMs = toMillis(session.startedAt)
      return session.status === 'completed' && startedAtMs >= weekStartMs
    })

    const completedToday = completedSessionsThisWeek.some((session) => {
      const completedAtMs = toMillis(session.completedAt || session.finishedAt || session.startedAt)
      return completedAtMs >= startOfTodayMs()
    })

    const todayDietDay = recentDietDays.find((entry) => entry.dateKey === todayKey) ?? null
    const workoutTarget = workout?.daysPerWeek || profile?.trainingFrequency || 0
    const lastBodyCheckin = recentBodyCheckins[0] ?? null
    const lastBodyCheckinMs = lastBodyCheckin ? Date.parse(lastBodyCheckin.date) : 0
    const nextDueMs = lastBodyCheckinMs > 0 ? lastBodyCheckinMs + FIFTEEN_DAYS_MS : Date.now()
    const daysRemaining = Math.max(0, Math.ceil((nextDueMs - Date.now()) / (24 * 60 * 60 * 1000)))
    const isDue = !lastBodyCheckin || nextDueMs <= Date.now()

    const hydrationGoal = Number(todayHydration?.goalMl || profile?.waterGoalMl || 2500)
    const hydrationConsumed = Number(todayHydration?.totalMl || 0)
    const hydrationPercentage = hydrationGoal > 0 ? roundPercentage((hydrationConsumed / hydrationGoal) * 100) : 0

    const weekDietDays = recentDietDays.filter((entry) => recentDateKeys.has(entry.dateKey))
    const weekHydration = (recentHydrationHistory as HydrationDay[]).filter((entry) => recentDateKeys.has(entry.dateKey))
    const weekCheckins = recentDailyCheckins.filter((entry) => recentDateKeys.has(entry.dateKey))

    const weeklyDietAverage = average(weekDietDays.map((entry) => Number(entry.adherencePercent || 0)))
    const weeklyWaterAverage = average(
      weekHydration.map((entry) => {
        const goal = Number(entry.goalMl || profile?.waterGoalMl || 2500)
        const total = Number(entry.totalMl || 0)
        return goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
      }),
    )

    const dashboardBase: Omit<StudentTodayDashboard, 'alerts' | 'nextAction'> = {
      profile: {
        goal: profile?.goal,
        weightKg: profile?.weightKg || profile?.weight,
        waterGoalMl: hydrationGoal,
        recommendationsNeedRefresh: Boolean(profile?.recommendationsNeedRefresh),
      },
      workout: workout
        ? {
            selectedWorkoutId: workout.id,
            title: workout.title,
            goal: workout.goal,
            nextWorkoutLabel: completedToday
              ? 'Treino concluído hoje'
              : completedSessionsThisWeek.length > 0
                ? `${completedSessionsThisWeek.length} sessões nesta semana`
                : 'Nenhuma sessão concluída nesta semana',
            completedToday,
            sessionsThisWeek: completedSessionsThisWeek.length,
            lastSessionAt: recentSessions[0]?.completedAt || recentSessions[0]?.startedAt,
          }
        : null,
      diet: diet
        ? {
            selectedDietId: diet.id,
            title: diet.title,
            calories: diet.calories,
            adherenceToday: Number(todayDietDay?.adherencePercent || 0),
            completedMealsToday: Number(todayDietDay?.completedMealsCount || 0),
            totalMealsToday: diet.meals.length,
            hasDietDayRecord: Boolean(todayDietDay),
          }
        : null,
      hydration: {
        goalMl: hydrationGoal,
        consumedMl: hydrationConsumed,
        percentage: hydrationPercentage,
      },
      dailyCheckin: {
        completedToday: Boolean(todayDailyCheckin),
        lastSubmittedAt: todayDailyCheckin?.updatedAt || todayDailyCheckin?.createdAt,
        mood: todayDailyCheckin?.mood,
        energy: todayDailyCheckin?.energy,
        sleepQuality: todayDailyCheckin?.sleep,
      },
      evolutionCheckin: {
        nextDueAt: nextDueMs > 0 ? new Date(nextDueMs) : undefined,
        daysRemaining,
        isDue,
        lastSubmittedAt: lastBodyCheckin?.updatedAt || lastBodyCheckin?.createdAt || lastBodyCheckin?.date,
      },
      weeklyAdherence: {
        workoutsCompleted: completedSessionsThisWeek.length,
        workoutTarget,
        dietAverage: weeklyDietAverage,
        waterAverage: weeklyWaterAverage,
        checkinsCompleted: weekCheckins.length,
      },
    }

    return {
      ...dashboardBase,
      alerts: buildAlerts(dashboardBase),
      nextAction: buildNextAction(dashboardBase),
    }
  },
}
