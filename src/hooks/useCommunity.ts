import { useState, useEffect } from 'react'
import { communityService, CommunitySettings } from '../services/communityService'

export function useCommunity() {
  const [settings, setSettings] = useState<CommunitySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await communityService.getSettings()
        setSettings(data)
      } catch (error) {
        console.error("Error loading community settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { settings, isLoading }
}
