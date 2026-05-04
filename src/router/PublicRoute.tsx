import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole } from './utils'
import { RouteLoader } from './RouteLoader'

interface PublicRouteProps {
  children: React.ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { firebaseUser, user, isLoading } = useAuth()
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription()
  const shouldWaitForSubscription =
    Boolean(firebaseUser && user && getUserRole(user) === 'member' && isSubscriptionLoading)

  if (isLoading || shouldWaitForSubscription) {
    return <RouteLoader />
  }

  if (firebaseUser && user) {
    return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
  }

  return <>{children}</>
}
