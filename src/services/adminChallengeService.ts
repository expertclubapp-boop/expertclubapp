import type { Challenge } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'
import { createAdminCrudService, makeId } from './adminCrudService'

export const adminChallengeService = createAdminCrudService<Challenge>(COLLECTIONS.CHALLENGES, 'challenge')

export function createEmptyChallenge(): Challenge {
  const now = new Date()
  const month = now.toISOString().slice(0, 7) // YYYY-MM
  
  return {
    id: makeId('challenge'),
    title: '',
    description: '',
    monthKey: month,
    startsAt: now.toISOString(),
    endsAt: now.toISOString(),
    status: 'draft',
    theme: 'consistency',
    rules: [],
    missions: [],
    badges: [],
    rankingEnabled: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}
