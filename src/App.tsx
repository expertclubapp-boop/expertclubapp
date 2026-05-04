import { useEffect, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './router/AppRouter'
import { referralUtils } from './utils/referral'
import { RouteLoader } from './router/RouteLoader'

function App() {
  useEffect(() => {
    referralUtils.captureReferralParams()
  }, [])

  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  )
}

export default App
