import type {
  PlanTier,
  Subscription,
  SubscriptionStatus,
  User,
  UserProfile,
  UserRole,
} from '../types/domain'

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['active', 'trialing']

export function getUserRole(user: User | null): UserRole {
  return user?.role ?? 'member'
}

export function isOnboardingCompleted(user: User | null, profile?: UserProfile | null): boolean {
  if (!user) return false

  const legacyProfile = profile as (UserProfile & { onboardingCompleted?: boolean; onboardingComplete?: boolean }) | null | undefined
  return Boolean(
    user.onboardingCompleted ??
      user.onboardingComplete ??
      legacyProfile?.onboardingCompleted ??
      legacyProfile?.onboardingComplete ??
      false,
  )
}

export function getSubscriptionStatus(
  user: User | null,
  subscription?: Subscription | null,
): SubscriptionStatus {
  return subscription?.status ?? user?.subscriptionStatus ?? 'pending'
}

export function hasActiveSubscriptionStatus(status: SubscriptionStatus): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status)
}

export function needsRecommendationRefresh(profile?: UserProfile | null): boolean {
  return Boolean(profile?.recommendationsNeedRefresh)
}

export function needsPlanSelection(profile?: UserProfile | null): boolean {
  if (!profile) return true
  return Boolean(!profile.selectedWorkoutId || !profile.selectedDietId)
}

const MENTORING_NAME_PATTERNS = [/mentor/i, /1:1/i, /trimestral/i, /semestral/i, /anual/i]

export function getPlanTier(subscription: Subscription | null | undefined): PlanTier {
  if (!subscription) return 'low_ticket'
  if (subscription.planTier) return subscription.planTier
  const name = subscription.planName?.toLowerCase() ?? ''
  if (name.includes('anual') || name.includes('annual')) return 'mentoring_annual'
  if (name.includes('semestral') || name.includes('semester')) return 'mentoring_semester'
  if (name.includes('trimestral') || name.includes('quarterly')) return 'mentoring_quarterly'
  if (MENTORING_NAME_PATTERNS.some(p => p.test(name))) return 'mentoring_quarterly'
  return 'low_ticket'
}

export function isMentoringPlan(tier: PlanTier): boolean {
  return tier === 'mentoring_quarterly' || tier === 'mentoring_semester' || tier === 'mentoring_annual'
}

export function isLowTicket(tier: PlanTier): boolean {
  return tier === 'low_ticket'
}

// ─── Capability helpers ────────────────────────────────────────────────────────
// These express WHAT a user can do, not WHICH paths they're allowed to visit.
// The router uses these to decide whether to gate or allow access.

/** User has an active subscription and has completed onboarding. */
export function canUseApp(user: User | null, profile?: UserProfile | null, subscription?: Subscription | null): boolean {
  if (!user) return false
  return hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription)) && isOnboardingCompleted(user, profile)
}

/** User has selected both a workout and a diet (plan is configured). */
export function hasPlanConfigured(profile?: UserProfile | null): boolean {
  return Boolean(profile?.selectedWorkoutId && profile?.selectedDietId)
}

/** Paths that are accessible even when no plan has been configured yet.
 *  These are "browse-mode" routes — the user can explore but cannot
 *  start a specific workout session or log a diet day without a plan.
 *  Prefer startsWith() so nested routes (e.g. /app/workouts/123) are covered.
 */
export function isAccessibleWithoutPlan(pathname: string): boolean {
  const OPEN_PREFIXES = [
    '/app/recommendations',
    '/app/anamnese-mentoria',
    '/app/today',
    '/app/workouts',
    '/app/diets',
    '/app/challenges',
    '/app/community',
    '/app/evolution',
    '/app/billing',
    '/app/indicar',
    '/app/carteira',
    '/app/profile',
    '/app/checkin',
    '/app/hydration',
    '/app/store',
    '/app/content',
  ] as const
  return OPEN_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function getDefaultRouteForUser(
  user: User | null,
  profile?: UserProfile | null,
  subscription?: Subscription | null,
): string {
  if (!user) return '/login'

  const role = getUserRole(user)

  if (role === 'admin') return '/admin/dashboard'
  if (role === 'mentor') return '/mentor/overview'
  if (role === 'affiliate') return '/affiliate/dashboard'

  if (!hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))) {
    return '/app/billing/lock'
  }

  if (!isOnboardingCompleted(user, profile)) return '/onboarding'

  if (needsPlanSelection(profile)) return '/app/recommendations'

  return '/app/today'
}
