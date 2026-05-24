import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { auth, db, firebaseEnvReady } from './firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from './paths'

const googleProvider = new GoogleAuthProvider()

function getFirebaseServices() {
  if (!firebaseEnvReady || !auth || !db) {
    throw new Error('O ambiente de producao esta sem configuracao do Firebase. Configure as variaveis VITE_FIREBASE_* antes de usar login.')
  }

  return { auth, db }
}

export const signInWithGoogle = async () => {
  const { auth } = getFirebaseServices()
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export const createAccountWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const { auth } = getFirebaseServices()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() })
  }
  return result.user
}

export const signInWithEmail = async (email: string, password: string) => {
  const { auth } = getFirebaseServices()
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export const sendResetPasswordEmail = async (email: string) => {
  const { auth } = getFirebaseServices()
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw error
  }
}

export const logout = () => {
  const { auth } = getFirebaseServices()
  return signOut(auth)
}

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  const { auth } = getFirebaseServices()
  return onAuthStateChanged(auth, callback)
}

export async function ensureUserExists(user: FirebaseUser, fallbackDisplayName = '') {
  const { db } = getFirebaseServices()
  const userRef = doc(db, COLLECTIONS.USERS, user.uid)
  const userSnap = await getDoc(userRef)
  const displayName = user.displayName || fallbackDisplayName || ''

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName,
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: 'member',
      onboardingCompleted: false,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    })
  } else {
    const existingUser = userSnap.data()
    const safeUpdates: Record<string, unknown> = {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    if (displayName && displayName !== existingUser.displayName) {
      safeUpdates.displayName = displayName
    }

    if ((user.photoURL || '') !== (existingUser.photoURL || '')) {
      safeUpdates.photoURL = user.photoURL || ''
    }

    await setDoc(userRef, safeUpdates, { merge: true })
  }

  const profileRef = doc(db, COLLECTIONS.PROFILES, user.uid)
  const profileSnap = await getDoc(profileRef)
  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      displayName,
      email: user.email || '',
      onboardingDraft: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  // Subscriptions are created by the payment webhook or admin — never client-side
}
