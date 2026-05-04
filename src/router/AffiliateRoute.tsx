import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole } from './utils'
import { RouteLoader } from './RouteLoader'

interface AffiliateRouteProps {
  children: React.ReactNode
}

export function AffiliateRoute({ children }: AffiliateRouteProps) {
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

  if (getUserRole(user) !== 'affiliate') {
    if (getUserRole(user) === 'member' && isSubscriptionLoading) {
      return <RouteLoader />
    }

    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  return <>{children}</>
}
