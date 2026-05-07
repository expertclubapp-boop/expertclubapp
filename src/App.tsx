import { useEffect, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './router/AppRouter'
import { referralUtils } from './utils/referral'
import { RouteLoader } from './router/RouteLoader'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

function App() {
  useEffect(() => {
    referralUtils.captureReferralParams()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<RouteLoader />}>
          <RouterProvider router={router} future={{ v7_startTransition: true } as any} />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
