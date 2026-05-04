import { Navigate, useLocation } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { getSubscriptionStatus, getUserRole, hasActiveSubscriptionStatus } from './utils'
import { RouteLoader } from './RouteLoader'

interface SubscriptionGuardProps {
  children: React.ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user } = useAuth()
  const { subscription, isLoading } = useSubscription()
  const location = useLocation()

  if (user && getUserRole(user) !== 'member') {
    return <>{children}</>
  }

  if (isLoading) {
    return <RouteLoader />
  }

  if (!hasActiveSubscriptionStatus(getSubscriptionStatus(user, subscription))) {
    if (location.pathname !== '/app/billing/lock') {
      return <Navigate to="/app/billing/lock" replace />
    }
  }

  return <>{children}</>
}
