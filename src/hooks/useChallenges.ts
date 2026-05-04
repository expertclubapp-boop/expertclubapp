import { useState, useEffect } from 'react'
import { challengeService } from '../services/challengeService'
import type { Badge, Challenge, ChallengeParticipant } from '../types/domain'

export function useActiveChallenge(uid: string | undefined, challengeId?: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [participant, setParticipant] = useState<ChallengeParticipant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const target = challengeId 
          ? await challengeService.getChallengeById(challengeId)
          : await challengeService.getActiveChallenge()
        setChallenge(target)
        
        if (target && uid) {
          const part = await challengeService.getParticipant(target.id, uid)
          setParticipant(part)
        }
      } catch (error) {
        console.error("Error loading challenge data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [uid, challengeId])

  return { challenge, participant, isLoading }
}

export function useLeaderboard(challengeId: string | undefined) {
  const [leaderboard, setLeaderboard] = useState<ChallengeParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!challengeId) {
      setIsLoading(false)
      return
    }

    async function load() {
      if (!challengeId) return
      try {
        const data = await challengeService.getLeaderboard(challengeId)
        setLeaderboard(data)
      } catch (error) {
        console.error("Error loading leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [challengeId])

  return { leaderboard, isLoading }
}

export function useUserBadges(uid: string | undefined) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setIsLoading(false)
      return
    }

    async function load() {
      if (!uid) return
      try {
        const data = await challengeService.getEarnedBadges(uid)
        setBadges(data)
      } catch (error) {
        console.error("Error loading badges:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [uid])

  return { badges, isLoading }
}
