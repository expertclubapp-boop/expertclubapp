import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  // Configurações do Firebase — Injetadas via Vercel Env Vars
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

export const firebaseEnvIssues = missingVars
export const firebaseEnvReady = missingVars.length === 0

if (!firebaseEnvReady) {
  console.warn('Missing Firebase environment variables:', missingVars.join(', '))
}

const fallbackFirebaseConfig = {
  apiKey: firebaseConfig.apiKey || 'missing-api-key',
  authDomain: firebaseConfig.authDomain || 'missing-auth-domain.firebaseapp.com',
  projectId: firebaseConfig.projectId || 'missing-project-id',
  storageBucket: firebaseConfig.storageBucket || 'missing-storage-bucket.appspot.com',
  messagingSenderId: firebaseConfig.messagingSenderId || '000000000000',
  appId: firebaseConfig.appId || '1:000000000000:web:missingappid',
}

const app = initializeApp(firebaseEnvReady ? firebaseConfig : fallbackFirebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'southamerica-east1')

export default app
