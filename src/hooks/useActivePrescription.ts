import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import { useAuth } from '../contexts/AuthContext'
import type { PrescriptionAssignment } from '../types/prescription.types'

export function useActivePrescription(type: 'workout' | 'diet') {
  const { firebaseUser } = useAuth()
  const [assignment, setAssignment] = useState<PrescriptionAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser || !db) {
      setAssignment(null)
      setIsLoading(false)
      return
    }

    const uid = firebaseUser.uid
    const col = collection(db, COLLECTIONS.USERS, uid, 'prescriptionAssignments')
    const q = query(
      col,
      where('type', '==', type),
      where('status', '==', 'active'),
      orderBy('assignedAt', 'desc'),
      limit(1),
    )

    getDocs(q)
      .then(snap => {
        if (!snap.empty) {
          setAssignment({ id: snap.docs[0].id, ...snap.docs[0].data() } as PrescriptionAssignment)
        } else {
          setAssignment(null)
        }
      })
      .catch(() => setAssignment(null))
      .finally(() => setIsLoading(false))
  }, [firebaseUser, type])

  return { assignment, isLoading }
}
