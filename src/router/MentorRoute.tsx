import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole } from './utils'
import { RouteLoader } from './RouteLoader'

interface MentorRouteProps {
  children: React.ReactNode
}

export function MentorRoute({ children }: MentorRouteProps) {
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

  if (role === 'member' && isSubscriptionLoading) {
    return <RouteLoader />
  }

  if (role !== 'admin' && role !== 'mentor') {
    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  return <>{children}</>
}
