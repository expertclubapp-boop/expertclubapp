import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, firebaseEnvReady } from '../lib/firebase/firebase'
import { getQaBypassSession } from '../lib/dev/qaBypass'
import {
  createAccountWithEmail,
  ensureUserExists,
  logout as firebaseLogout,
  sendResetPasswordEmail,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/firebase/auth'
import { identifyUser, resetAnalyticsUser, track } from '../lib/analytics'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { User } from '../types/domain'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isQaBypass: boolean
  isFirebaseConfigured: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isQaBypass, setIsQaBypass] = useState(false)

  useEffect(() => {
    if (!firebaseEnvReady || !auth || !db) {
      setUser(null)
      setFirebaseUser(null)
      setIsLoading(false)
      return
    }

    let unsubscribeDoc: (() => void) | undefined
    let isActive = true

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      const qaBypass = getQaBypassSession()
      if (qaBypass) {
        setIsQaBypass(true)
        setUser(qaBypass.user)
        setFirebaseUser(qaBypass.firebaseUser)
        setIsLoading(false)
        return
      }

      unsubscribeDoc?.()
      unsubscribeDoc = undefined
      setFirebaseUser(fUser)
      setIsQaBypass(false)
      
      if (!fUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        await ensureUserExists(fUser)
      } catch (error) {
        console.error('Error ensuring user documents:', error)
        if (isActive) setIsLoading(false)
        return
      }

      if (!isActive) return

      const userRef = doc(db, COLLECTIONS.USERS, fUser.uid)
      unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = {
            uid: fUser.uid,
            role: 'member',
            ...docSnap.data(),
          } as User
          setUser(userData)
          identifyUser(userData.uid, {
            email: userData.email,
            role: userData.role,
            displayName: userData.displayName,
          })
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }, (error) => {
        console.error("Error fetching user doc:", error)
        setIsLoading(false)
      })
    })

    return () => {
      isActive = false
      unsubscribeDoc?.()
      unsubscribeAuth()
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      track('user_signed_in', { method: 'google' })
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signInWithEmail(email, password)
      track('user_signed_in', { method: 'email' })
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const signupWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true)
    try {
      await createAccountWithEmail(email, password, displayName)
      track('user_signed_up', { method: 'email' })
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendResetPasswordEmail(email)
  }, [])

  const logout = useCallback(async () => {
    try {
      track('user_signed_out')
      resetAnalyticsUser()
      await firebaseLogout()
    } catch (error) {
      throw error
    }
  }, [])

  const contextValue = useMemo(() => ({
    user,
    firebaseUser,
    isAuthenticated: !!firebaseUser,
    isLoading,
    isQaBypass,
    isFirebaseConfigured: firebaseEnvReady,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    resetPassword,
    logout,
  }), [user, firebaseUser, isLoading, isQaBypass, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, logout])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
