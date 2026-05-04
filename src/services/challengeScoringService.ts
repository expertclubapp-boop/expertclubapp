import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import { challengeService } from './challengeService'
import type { ChallengeParticipant } from '../types/domain'

interface ScoreActionParams {
  uid: string
  sourceType: 
    | "daily_checkin"
    | "weekly_checkin"
    | "body_checkin"
    | "workout_completed"
    | "diet_adherence"
    | "hydration_goal"
    | "content_completed"
  sourceId: string // Unique identifier for idempotency (e.g. dateKey, sessionId)
  additionalData?: any // e.g. adherencePercent
}

export const challengeScoringService = {
  async processUserAction({ uid, sourceType, sourceId, additionalData }: ScoreActionParams) {
    try {
      // 1. Get active challenge
      const activeChallenge = await challengeService.getActiveChallenge()
      if (!activeChallenge) return // No active challenge

      // 2. Get participant
      const participantRef = doc(db, getSubCollectionPath(COLLECTIONS.CHALLENGES, activeChallenge.id, SUB_COLLECTIONS.PARTICIPANTS), uid)
      const snap = await getDoc(participantRef)
      if (!snap.exists()) return // User is not participating in the challenge

      const participant = snap.data() as ChallengeParticipant

      // 3. Find matching missions
      const matchingMissions = activeChallenge.missions.filter(m => m.active && m.type === sourceType)
      if (matchingMissions.length === 0) return

      let hasUpdates = false
      let pointsEarned = 0

      for (const mission of matchingMissions) {
        // Idempotency check: Ensure this mission hasn't been scored for this specific sourceId
        const alreadyScored = participant.completedMissions.some(
          cm => cm.missionId === mission.id && cm.sourceId === sourceId
        )

        if (alreadyScored) continue

        // Specific condition checks based on sourceType
        if (sourceType === 'diet_adherence') {
          const adherence = additionalData?.adherencePercent || 0
          const required = mission.minAdherencePercent || 0
          if (adherence < required) continue
        }

        // Add points
        pointsEarned += mission.points
        participant.completedMissions.push({
          missionId: mission.id,
          completedAt: new Date().toISOString(),
          points: mission.points,
          sourceType: sourceType,
          sourceId: sourceId
        })
        hasUpdates = true
      }

      // 4. Update participant if there are changes
      if (hasUpdates) {
        participant.points += pointsEarned
        participant.updatedAt = new Date().toISOString()
        await setDoc(participantRef, participant)
      }

    } catch (error) {
      console.error('Error in challengeScoringService:', error)
      // We don't throw here to avoid breaking the main user flow
    }
  }
}
