import { useState, useEffect } from 'react'
import { checkinService } from '../services/checkinService'
import { workoutSessionService } from '../services/workoutSessionService'
import { hydrationService } from '../services/hydrationService'
import { bodyCheckinService } from '../services/bodyCheckinService'
import { dietDayService } from '../services/dietDayService'
import type { WeeklyCheckin, WorkoutSession, HydrationDay, DailyCheckin, BodyCheckin, DietDay } from '../types/domain'

export function useProgress(uid: string | undefined) {
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyCheckin[]>([])
  const [dailyHistory, setDailyHistory] = useState<DailyCheckin[]>([])
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([])
  const [recentHydration, setRecentHydration] = useState<HydrationDay[]>([])
  const [bodyCheckins, setBodyCheckins] = useState<BodyCheckin[]>([])
  const [dietDays, setDietDays] = useState<DietDay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    async function loadAll() {
      try {
        const today = new Date()
        const recentDateKeys = Array.from({ length: 14 }).map((_, index) => {
          const d = new Date(today)
          d.setDate(today.getDate() - index)
          return d.toISOString().split('T')[0]
        })

        const [weekly, daily, sessions, hydration, body, dietHistory] = await Promise.all([
          checkinService.getWeeklyCheckinHistory(uid!),
          checkinService.getRecentDailyCheckins(uid!),
          workoutSessionService.getRecentSessions(uid!),
          hydrationService.getRecentHistory(uid!),
          bodyCheckinService.getRecent(uid!),
          Promise.all(recentDateKeys.map(key => dietDayService.getToday(uid!, key))),
        ])
        
        setWeeklyHistory(weekly)
        setDailyHistory(daily)
        setRecentSessions(sessions)
        setRecentHydration(hydration)
        setBodyCheckins(body)
        setDietDays(dietHistory.filter(Boolean) as DietDay[])
      } catch (error) {
        console.error("Error loading progress data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAll()
  }, [uid])

  return {
    weeklyHistory,
    dailyHistory,
    recentSessions,
    recentHydration,
    bodyCheckins,
    dietDays,
    isLoading
  }
}
