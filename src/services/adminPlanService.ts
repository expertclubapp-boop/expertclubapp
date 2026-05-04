import type { Plan } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'
import { createAdminCrudService, makeId } from './adminCrudService'

export const adminPlanService = createAdminCrudService<Plan>(COLLECTIONS.PLANS, 'plan')

export function createEmptyPlan(): Plan {
  return {
    id: makeId('plan'),
    name: '',
    slug: '',
    description: '',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    status: 'inactive',
    features: [],
    isFounderPlan: false,
    mercadoPagoPlanId: '',
    mercadoPagoPreapprovalPlanId: '',
    trialDays: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
