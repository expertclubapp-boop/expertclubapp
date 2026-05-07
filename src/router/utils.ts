import type {
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

export function getDefaultRouteForUser(
  user: User | null,
  profile?: UserProfile | null,
  subscription?: Subscription | null,
): string {
  if (!user) return '/login'

  const role = getUserRole(user)

  if (role === 'admin') return '/admin/dashboard'
  if (role === 'affiliate') return '/affiliate/dashboard'
  
  if (!isOnboardingCompleted(user, profile)) return '/onboarding/goal'
  
  if (!hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))) {
    return '/app/billing/lock'
  }
  
  return '/student/dashboard'
}
