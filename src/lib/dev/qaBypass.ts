import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '../../types/domain'

const QA_BYPASS_STORAGE_KEY = 'expert_club_qa_user'

// DEV ONLY: this bypass does not create Firebase Auth sessions and must never be used to validate Firestore permissions.
export type QaBypassSession = {
  user: User
  firebaseUser: FirebaseUser
}

export function getQaBypassSession(): QaBypassSession | null {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_QA_BYPASS !== 'true') {
    return null
  }

  const rawUser = localStorage.getItem(QA_BYPASS_STORAGE_KEY)
  if (!rawUser) return null

  const parsedUser = JSON.parse(rawUser) as User

  return {
    user: parsedUser,
    firebaseUser: {
      uid: parsedUser.uid,
      email: parsedUser.email,
      displayName: parsedUser.displayName,
      photoURL: parsedUser.photoURL || null,
    } as FirebaseUser,
  }
}
