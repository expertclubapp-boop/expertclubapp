import { useSubscription } from './useSubscription'
import { getPlanTier, isMentoringPlan, isLowTicket } from '../router/utils'
import type { PlanTier } from '../types/domain'

export function usePlanTier(): {
  tier: PlanTier
  isMentoring: boolean
  isLowTicket: boolean
  isLoading: boolean
} {
  const { subscription, isLoading } = useSubscription()
  const tier = getPlanTier(subscription)
  return {
    tier,
    isMentoring: isMentoringPlan(tier),
    isLowTicket: isLowTicket(tier),
    isLoading,
  }
}
