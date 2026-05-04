import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole } from './utils'
import { RouteLoader } from './RouteLoader'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
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

  if (getUserRole(user) === 'member' && isSubscriptionLoading) {
    return <RouteLoader />
  }

  if (getUserRole(user) !== 'admin') {
    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  return <>{children}</>
}
