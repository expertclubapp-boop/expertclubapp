import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSubscription } from '../hooks/useSubscription'
import {
  getSubscriptionStatus,
  getPlanTier,
  getUserRole,
  hasActiveSubscriptionStatus,
  isMentoringPlan,
  isOnboardingCompleted,
  needsPlanSelection,
} from './utils'
import { RouteLoader } from './RouteLoader'

interface AppRouteProps {
  children: React.ReactNode
}

const BILLING_FALLBACK_PATHS = new Set(['/app/billing/lock', '/app/billing/plans'])
const PLAN_SETUP_ALLOWED_PATHS = new Set(['/app/today', '/app/recommendations', '/app/profile'])

export function AppRoute({ children }: AppRouteProps) {
  const { firebaseUser, user, isLoading } = useAuth()
  const { profile, isLoading: isProfileLoading } = useProfile()
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription()
  const location = useLocation()

  if (isLoading) {
    return <RouteLoader />
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!user) {
    return <RouteLoader />
  }

  const role = getUserRole(user)

  if (role === 'admin') {
    return <>{children}</>
  }

  // P0: affiliate must not access /app/* — redirect to affiliate dashboard
  if (role === 'affiliate') {
    return <Navigate to="/affiliate/dashboard" replace />
  }

  // mentor should also not land inside /app/* student routes
  if (role === 'mentor') {
    return <Navigate to="/mentor/overview" replace />
  }

  if (isSubscriptionLoading) {
    return <RouteLoader />
  }

  if (isProfileLoading && role === 'member') {
    return <RouteLoader />
  }

  const hasActiveSub = hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))

  if (role === 'member' && !hasActiveSub) {
    if (!BILLING_FALLBACK_PATHS.has(location.pathname)) {
      return <Navigate to="/app/billing/lock" replace />
    }
    // On billing pages with no active subscription: render immediately.
    // Must not fall through — the onboarding/anamnesis checks would loop with OnboardingRoute.
    return <>{children}</>
  }

  if (role === 'member' && !isOnboardingCompleted(user, profile)) {
    return <Navigate to="/onboarding" replace />
  }

  if (role === 'member' && needsPlanSelection(profile)) {
    if (!PLAN_SETUP_ALLOWED_PATHS.has(location.pathname)) {
      return <Navigate to="/app/recommendations" replace />
    }
  }

  // 1:1 mentoring members must complete the extended anamnesis before accessing the app
  if (
    role === 'member' &&
    isMentoringPlan(getPlanTier(subscription)) &&
    !profile?.mentoringAnamnesisCompleted &&
    !location.pathname.startsWith('/app/anamnese-mentoria')
  ) {
    return <Navigate to="/app/anamnese-mentoria" replace />
  }

  return <>{children}</>
}
