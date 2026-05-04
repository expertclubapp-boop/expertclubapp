import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/AppRouter'
import { AuthProvider } from './contexts/AuthContext'
import { AppMockProvider } from './contexts/AppMockContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppMockProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true } as any} />
      </AppMockProvider>
    </AuthProvider>
  </React.StrictMode>,
)
