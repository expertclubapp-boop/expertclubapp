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
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Check if user exists in Firestore, if not create
    await ensureUserExists(user)
    
    return user
  } catch (error) {
    throw error
  }
}

export const createAccountWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const { auth } = getFirebaseServices()
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() })
    }

    await ensureUserExists(result.user, displayName.trim())
    return result.user
  } catch (error) {
    throw error
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { auth } = getFirebaseServices()
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await ensureUserExists(result.user)
    return result.user
  } catch (error) {
    throw error
  }
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
  const nowIso = new Date().toISOString()

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

  const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, user.uid)
  const subscriptionSnap = await getDoc(subscriptionRef)
  if (!subscriptionSnap.exists()) {
    await setDoc(subscriptionRef, {
      uid: user.uid,
      planId: 'founder',
      planName: 'Expert Club Fundador',
      status: 'active', // Set to active for testing purposes
      provider: 'manual',
      price: 49,
      currency: 'BRL',
      interval: 'monthly',
      startedAt: nowIso,
      currentPeriodStart: nowIso,
      currentPeriodEnd: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  } else {
    // For testing: Force any pending subscription to active
    const subData = subscriptionSnap.data()
    if (subData.status === 'pending') {
      await setDoc(subscriptionRef, { status: 'active', updatedAt: nowIso }, { merge: true })
    }
  }
}
