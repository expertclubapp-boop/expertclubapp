import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import { useAuth } from '../contexts/AuthContext'
import type { Subscription } from '../types/domain'

export function useSubscription() {
  const { firebaseUser } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, firebaseUser.uid)
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSubscription(snap.data() as Subscription)
      } else {
        setSubscription(null)
      }
      setIsLoading(false)
    }, (error) => {
      console.error("Error listening to subscription:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseUser])

  return { subscription, isLoading }
}
