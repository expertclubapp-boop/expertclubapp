import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, firebaseEnvReady } from '../lib/firebase/firebase'
import {
  createAccountWithEmail,
  ensureUserExists,
  logout as firebaseLogout,
  sendResetPasswordEmail,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/firebase/auth'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { User } from '../types/domain'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
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
      unsubscribeDoc?.()
      unsubscribeDoc = undefined
      setFirebaseUser(fUser)
      
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

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const signupWithEmail = async (email: string, password: string, displayName: string) => {
    setIsLoading(true)
    try {
      await createAccountWithEmail(email, password, displayName)
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    await sendResetPasswordEmail(email)
  }

  const logout = async () => {
    try {
      await firebaseLogout()
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!firebaseUser,
        isLoading,
        isFirebaseConfigured: firebaseEnvReady,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        logout,
      }}
    >
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
