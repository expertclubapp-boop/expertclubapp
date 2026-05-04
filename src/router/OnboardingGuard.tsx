import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserRole, isOnboardingCompleted } from './utils'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (user && getUserRole(user) === 'member' && !isOnboardingCompleted(user)) {
    // Only redirect if not already in the onboarding flow
    if (!location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/onboarding/goal" replace />
    }
  }

  return <>{children}</>
}
