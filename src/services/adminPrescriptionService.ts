import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { nowTimestamp } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import { adminAuditLogService } from './adminAuditLogService'
import type { PrescriptionAssignment } from '../types/prescription.types'

const PRESCRIPTION_LIMITS = {
  HISTORY: 50,
}

function effectiveTimestamp(value: Date | undefined, fallback: Timestamp) {
  return value ? Timestamp.fromDate(value) : fallback
}

function assignmentHistoryQuery(studentId: string) {
  return query(
    collection(db, COLLECTIONS.USERS, studentId, 'prescriptionAssignments'),
    orderBy('assignedAt', 'desc'),
    limit(PRESCRIPTION_LIMITS.HISTORY)
  )
}

function getFirestoreErrorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : null
}

function toErrorMessage(action: 'read' | 'write', studentId: string, error: unknown): string {
  const code = getFirestoreErrorCode(error)
  if (code === 'permission-denied') {
    return `Sem permissão para ${action === 'read' ? 'ler' : 'gravar'} prescriptionAssignments de ${studentId}.`
  }
  if (code === 'failed-precondition') {
    return `Consulta de prescriptionAssignments para ${studentId} exige índice ou pré-condição ausente.`
  }
  return error instanceof Error ? error.message : 'Erro desconhecido ao acessar prescriptionAssignments.'
}

function normalizeAssignmentHistory(studentId: string, typeFilter?: 'workout' | 'diet') {
  return async (): Promise<PrescriptionAssignment[]> => {
    try {
      const historySnap = await getDocs(assignmentHistoryQuery(studentId))
      return historySnap.docs
        .map((assignmentDoc) => ({ id: assignmentDoc.id, ...assignmentDoc.data() } as PrescriptionAssignment))
        .filter((assignment) => !typeFilter || assignment.type === typeFilter)
    } catch (error) {
      throw new Error(toErrorMessage('read', studentId, error))
    }
  }
}

export const adminPrescriptionService = {
  /**
   * Assign a workout template to a student with full traceability.
   * Uses a transaction to ensure profile update and assignment record are atomic.
   */
  async assignWorkoutToStudent(params: {
    studentId: string
    workoutId: string
    reason?: string
    notes?: string
    effectiveFrom?: Date
    adminUid?: string
    adminEmail: string
    adminName?: string
  }): Promise<void> {
    const workoutSnap = await getDoc(doc(db, COLLECTIONS.WORKOUTS, params.workoutId))
    if (!workoutSnap.exists()) {
      throw new Error('Template de treino não encontrado.')
    }
    const workoutData = workoutSnap.data()

    const profileRef = doc(db, COLLECTIONS.PROFILES, params.studentId)
    const profileSnap = await getDoc(profileRef)
    const currentProfile = profileSnap.exists() ? profileSnap.data() : null
    const previousWorkoutId = currentProfile?.selectedWorkoutId || null

    let previousTitle: string | null = null
    if (previousWorkoutId) {
      const prevSnap = await getDoc(doc(db, COLLECTIONS.WORKOUTS, previousWorkoutId))
      if (prevSnap.exists()) {
        previousTitle = prevSnap.data().title || null
      }
    }

    const now = nowTimestamp()
    const effectiveFrom = effectiveTimestamp(params.effectiveFrom, now)

    const history = await normalizeAssignmentHistory(params.studentId)()
    const batch = writeBatch(db)

    history
      .filter((assignment) => assignment.type === 'workout' && assignment.status === 'active')
      .forEach((assignment) => {
        batch.update(doc(db, COLLECTIONS.USERS, params.studentId, 'prescriptionAssignments', assignment.id), { status: 'superseded', updatedAt: now })
      })

    const assignmentsCol = collection(db, COLLECTIONS.USERS, params.studentId, 'prescriptionAssignments')
    const newRef = doc(assignmentsCol)
    const assignment = {
      studentId: params.studentId,
      type: 'workout',
      templateId: params.workoutId,
      templateTitle: workoutData.title || '',
      previousTemplateId: previousWorkoutId,
      previousTemplateTitle: previousTitle,
      reason: params.reason || '',
      notes: params.notes || '',
      assignedBy: params.adminEmail,
      assignedByName: params.adminName || params.adminEmail,
      assignedAt: now,
      effectiveFrom,
      status: 'active',
      updatedAt: now,
      snapshot: {
        title: workoutData.title || '',
        goal: workoutData.goal || '',
        level: workoutData.level || '',
      },
    }
    batch.set(newRef, assignment)

    batch.set(profileRef, {
      ...(currentProfile || { uid: params.studentId }),
      selectedWorkoutId: params.workoutId,
      updatedAt: now,
    }, { merge: true })

    try {
      await batch.commit()
    } catch (error) {
      throw new Error(toErrorMessage('write', params.studentId, error))
    }
    await adminAuditLogService.create(
      { uid: params.adminUid, email: params.adminEmail },
      'prescription_assign',
      'prescription_assignment',
      newRef.id,
      null,
      assignment
    )
  },

  /**
   * Assign a diet template to a student with full traceability.
   */
  async assignDietToStudent(params: {
    studentId: string
    dietId: string
    reason?: string
    notes?: string
    effectiveFrom?: Date
    adminUid?: string
    adminEmail: string
    adminName?: string
  }): Promise<void> {
    const dietSnap = await getDoc(doc(db, COLLECTIONS.DIETS, params.dietId))
    if (!dietSnap.exists()) {
      throw new Error('Template de dieta não encontrado.')
    }
    const dietData = dietSnap.data()

    const profileRef = doc(db, COLLECTIONS.PROFILES, params.studentId)
    const profileSnap = await getDoc(profileRef)
    const currentProfile = profileSnap.exists() ? profileSnap.data() : null
    const previousDietId = currentProfile?.selectedDietId || null

    let previousTitle: string | null = null
    if (previousDietId) {
      const prevSnap = await getDoc(doc(db, COLLECTIONS.DIETS, previousDietId))
      if (prevSnap.exists()) {
        previousTitle = prevSnap.data().title || null
      }
    }

    const now = nowTimestamp()
    const effectiveFrom = effectiveTimestamp(params.effectiveFrom, now)

    const history = await normalizeAssignmentHistory(params.studentId)()
    const batch = writeBatch(db)

    history
      .filter((assignment) => assignment.type === 'diet' && assignment.status === 'active')
      .forEach((assignment) => {
        batch.update(doc(db, COLLECTIONS.USERS, params.studentId, 'prescriptionAssignments', assignment.id), { status: 'superseded', updatedAt: now })
      })

    const assignmentsCol = collection(db, COLLECTIONS.USERS, params.studentId, 'prescriptionAssignments')
    const newRef = doc(assignmentsCol)
    const assignment = {
      studentId: params.studentId,
      type: 'diet',
      templateId: params.dietId,
      templateTitle: dietData.title || '',
      previousTemplateId: previousDietId,
      previousTemplateTitle: previousTitle,
      reason: params.reason || '',
      notes: params.notes || '',
      assignedBy: params.adminEmail,
      assignedByName: params.adminName || params.adminEmail,
      assignedAt: now,
      effectiveFrom,
      status: 'active',
      updatedAt: now,
      snapshot: {
        title: dietData.title || '',
        calories: dietData.calories || 0,
        protein: dietData.protein || 0,
        carbs: dietData.carbs || 0,
        fat: dietData.fat || 0,
      },
    }
    batch.set(newRef, assignment)

    batch.set(profileRef, {
      ...(currentProfile || { uid: params.studentId }),
      selectedDietId: params.dietId,
      updatedAt: now,
    }, { merge: true })

    try {
      await batch.commit()
    } catch (error) {
      throw new Error(toErrorMessage('write', params.studentId, error))
    }
    await adminAuditLogService.create(
      { uid: params.adminUid, email: params.adminEmail },
      'prescription_assign',
      'prescription_assignment',
      newRef.id,
      null,
      assignment
    )
  },

  /**
   * List prescription assignment history for a student, ordered by most recent.
   */
  async listPrescriptionAssignments(studentId: string, typeFilter?: 'workout' | 'diet'): Promise<PrescriptionAssignment[]> {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, studentId))
    if (!snap.exists()) return []
    return normalizeAssignmentHistory(studentId, typeFilter)()
  },

  /**
   * Get the active assignment for a student by type.
   */
  async getActiveAssignment(studentId: string, type: 'workout' | 'diet'): Promise<PrescriptionAssignment | null> {
    const history = await this.listPrescriptionAssignments(studentId, type)
    return history.find((assignment) => assignment.status === 'active') || null
  },
}
