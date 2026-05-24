export type FeedbackScheduleStatus = 'active' | 'paused' | 'cancelled'
export type FeedbackRequestStatus = 'pending' | 'submitted'

export interface FeedbackSchedule {
  id: string
  uid: string
  type: 'recurring' | 'one_time'
  intervalDays: number
  startDate: string       // YYYY-MM-DD
  createdBy: 'system' | string
  status: FeedbackScheduleStatus
  createdAt: string
  updatedAt: string
}

export interface FeedbackRequest {
  id: string
  uid: string
  scheduleId?: string     // undefined for ad-hoc
  dueDate: string         // YYYY-MM-DD
  status: FeedbackRequestStatus
  submittedAt?: string
  responseId?: string
  createdAt: string
}

export interface FeedbackResponse {
  id: string
  uid: string
  requestId: string
  dueDate: string
  submittedAt: string
  // Adherence 1–10
  dietAdherence: number
  workoutAdherence: number
  aerobicAdherence: number
  // Wellbeing 1–10
  energyLevel: number
  sleepQuality: number
  moodLevel: number
  stressLevel: number
  // Body
  weightKg?: number
}
