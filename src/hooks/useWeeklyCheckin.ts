import { useState, useEffect } from 'react'
import { checkinService } from '../services/checkinService'
import type { WeeklyCheckin } from '../types/domain'

export function useWeeklyCheckin(uid: string | undefined, weekKey: string) {
  const [checkin, setCheckin] = useState<WeeklyCheckin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    async function load() {
      try {
        const data = await checkinService.getWeeklyCheckin(uid!, weekKey)
        setCheckin(data)
      } catch (error) {
        console.error("Error loading weekly checkin:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [uid, weekKey])

  return { checkin, isLoading }
}

export function useWeeklyHistory(uid: string | undefined, limit = 12) {
  const [history, setHistory] = useState<WeeklyCheckin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    async function load() {
      try {
        const data = await checkinService.getWeeklyCheckinHistory(uid!, limit)
        setHistory(data)
      } catch (error) {
        console.error("Error loading weekly history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [uid, limit])

  return { history, isLoading }
}
