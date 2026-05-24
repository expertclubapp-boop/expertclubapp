import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { safeDateKey } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import { useAuth } from '../contexts/AuthContext'

export function useHydrationToday() {
  const { firebaseUser } = useAuth()
  const [hydration, setHydration] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) {
      setHydration(null)
      setIsLoading(false)
      return
    }

    const dateKey = safeDateKey()
    const path = getSubCollectionPath(COLLECTIONS.USERS, firebaseUser.uid, SUB_COLLECTIONS.HYDRATION_DAYS)
    const docRef = doc(db, path, dateKey)
    
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setHydration(snap.data())
      } else {
        setHydration(null)
      }
      setIsLoading(false)
    }, (error) => {
      console.error("Error listening to hydration:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseUser])

  return { hydration, isLoading }
}
