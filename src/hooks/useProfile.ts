import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import { useAuth } from '../contexts/AuthContext'
import type { UserProfile } from '../types/domain'

export function useProfile() {
  const { firebaseUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    const docRef = doc(db, COLLECTIONS.PROFILES, firebaseUser.uid)
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    }, (error) => {
      console.error("Error listening to profile:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseUser])

  return { profile, isLoading }
}
