import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import {
  getSubscriptionStatus,
  getUserRole,
  hasActiveSubscriptionStatus,
  isOnboardingCompleted,
} from './utils'
import { RouteLoader } from './RouteLoader'

interface AppRouteProps {
  children: React.ReactNode
}

const BILLING_FALLBACK_PATHS = new Set(['/app/billing/lock', '/app/billing/plans'])

export function AppRoute({ children }: AppRouteProps) {
  const { firebaseUser, user, isLoading } = useAuth()
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

  if ((role === 'member' || role === 'affiliate') && !isOnboardingCompleted(user)) {
    return <Navigate to="/onboarding/goal" replace />
  }

  if (isSubscriptionLoading) {
    return <RouteLoader />
  }

  if (role === 'member' && !hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))) {
    if (!BILLING_FALLBACK_PATHS.has(location.pathname)) {
      return <Navigate to="/app/billing/lock" replace />
    }
  }

  return <>{children}</>
}
