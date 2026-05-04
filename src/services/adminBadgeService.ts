import type { Badge } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'
import { createAdminCrudService, makeId } from './adminCrudService'

export const adminBadgeService = createAdminCrudService<Badge>(COLLECTIONS.BADGES, 'badge')

export function createEmptyBadge(): Badge {
  return {
    id: makeId('badge'),
    title: '',
    description: '',
    icon: '🏆',
    rarity: 'common',
    criteriaType: 'manual',
    criteriaValue: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
