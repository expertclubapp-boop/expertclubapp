import { useState, useEffect } from 'react'
import { checkinService } from '../services/checkinService'
import type { DailyCheckin } from '../types/domain'

export function useDailyCheckin(uid: string | undefined, dateKey: string) {
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    async function load() {
      try {
        const data = await checkinService.getDailyCheckin(uid!, dateKey)
        setCheckin(data)
      } catch (error) {
        console.error("Error loading daily checkin:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [uid, dateKey])

  return { checkin, isLoading }
}
