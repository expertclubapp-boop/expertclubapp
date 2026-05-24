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
  hasPlanConfigured,
  isAccessibleWithoutPlan,
} from './utils'
import { RouteLoader } from './RouteLoader'

interface AppRouteProps {
  children: React.ReactNode
}

const BILLING_PATHS_PREFIX = '/app/billing'

export function AppRoute({ children }: AppRouteProps) {
  const { firebaseUser, user, isLoading } = useAuth()
  const { profile, isLoading: isProfileLoading } = useProfile()
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription()
  const location = useLocation()
  const pathname = location.pathname

  // ── 1. Auth loading ─────────────────────────────────────────────────────────
  if (isLoading) return <RouteLoader />
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />
  if (!user) return <RouteLoader />

  const role = getUserRole(user)

  // ── 2. Role redirect — non-member roles don't belong in /app/* ───────────────
  if (role === 'admin') return <>{children}</>
  if (role === 'affiliate') return <Navigate to="/affiliate/dashboard" replace />
  if (role === 'mentor') return <Navigate to="/mentor/overview" replace />

  // ── 3. Wait for subscription + profile ──────────────────────────────────────
  if (isSubscriptionLoading) return <RouteLoader />
  if (isProfileLoading) return <RouteLoader />

  // ── 4. Subscription gate ─────────────────────────────────────────────────────
  const hasActiveSub = hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))
  if (!hasActiveSub) {
    if (!pathname.startsWith(BILLING_PATHS_PREFIX)) {
      return <Navigate to="/app/billing/lock" replace />
    }
    // Billing pages render without further checks to prevent circular redirects.
    return <>{children}</>
  }

  // ── 5. Onboarding gate ───────────────────────────────────────────────────────
  if (!isOnboardingCompleted(user, profile)) {
    return <Navigate to="/onboarding" replace />
  }

  // ── 6. Mentoring anamnesis gate ──────────────────────────────────────────────
  // Must run BEFORE plan-configuration gate so /app/anamnese-mentoria is reachable.
  if (
    isMentoringPlan(getPlanTier(subscription)) &&
    !profile?.mentoringAnamnesisCompleted &&
    !pathname.startsWith('/app/anamnese-mentoria')
  ) {
    return <Navigate to="/app/anamnese-mentoria" replace />
  }

  // ── 7. Plan-configuration nudge ──────────────────────────────────────────────
  // Users without a selected workout + diet are guided to recommendations,
  // but they can still browse most of the app in read-only mode.
  if (!hasPlanConfigured(profile) && !isAccessibleWithoutPlan(pathname)) {
    return <Navigate to="/app/recommendations" replace />
  }

  return <>{children}</>
}
