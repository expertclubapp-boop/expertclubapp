import type { Timestamp } from 'firebase/firestore'

export interface PrescriptionAssignment {
  id: string
  studentId: string
  type: 'workout' | 'diet'

  templateId: string
  templateTitle: string

  previousTemplateId: string | null
  previousTemplateTitle: string | null

  reason: string
  notes: string

  assignedBy: string
  assignedByName: string

  assignedAt: Timestamp
  effectiveFrom: Timestamp

  status: 'active' | 'superseded'

  snapshot: {
    title: string
    goal?: string
    level?: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    daysCount?: number
    mealsCount?: number
  }
}
