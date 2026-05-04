import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import { useAuth } from '../contexts/AuthContext'
import type { WorkoutSession } from '../types/domain'

export function useWorkoutSession(sessionId?: string) {
  const { firebaseUser } = useAuth()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser || !sessionId) {
      setSession(null)
      setIsLoading(false)
      return
    }

    const path = getSubCollectionPath(COLLECTIONS.USERS, firebaseUser.uid, SUB_COLLECTIONS.WORKOUT_SESSIONS)
    const docRef = doc(db, path, sessionId)
    
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSession(snap.data() as WorkoutSession)
      } else {
        setSession(null)
      }
      setIsLoading(false)
    }, (error) => {
      console.error("Error listening to session:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseUser, sessionId])

  return { session, isLoading }
}
