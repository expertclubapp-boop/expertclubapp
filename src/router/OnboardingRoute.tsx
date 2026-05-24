import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSubscription } from '../hooks/useSubscription'
import {
  getDefaultRouteForUser,
  getSubscriptionStatus,
  getUserRole,
  hasActiveSubscriptionStatus,
  isOnboardingCompleted,
} from './utils'
import { RouteLoader } from './RouteLoader'

export function OnboardingRoute() {
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

  if (role !== 'member') {
    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  if (isSubscriptionLoading) {
    return <RouteLoader />
  }

  if (isProfileLoading) {
    return <RouteLoader />
  }

  if (!hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))) {
    return <Navigate to="/app/billing/lock" replace />
  }

  if (isOnboardingCompleted(user, profile)) {
    return <Navigate to={getDefaultRouteForUser(user, profile, subscription)} replace />
  }

  return <Outlet />
}
