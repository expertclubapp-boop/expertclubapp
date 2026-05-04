import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole, isOnboardingCompleted } from './utils'
import { RouteLoader } from './RouteLoader'

export function OnboardingRoute() {
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

  if (role !== 'member') {
    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  if (isOnboardingCompleted(user)) {
    if (isSubscriptionLoading) {
      return <RouteLoader />
    }

    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  return <Outlet />
}
