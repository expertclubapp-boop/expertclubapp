export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'pending'
  | 'past_due'
  | 'cancelled'
  | 'expired'

export type SubscriptionPlan = 'pro' | 'basic'
export type UserRole = 'admin' | 'mentor' | 'member' | 'affiliate'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type UserGoal =
  | 'hypertrophy'
  | 'fat_loss'
  | 'endurance'
  | 'health'
  | 'strength'

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  role: UserRole
  createdAt: string
  onboardingCompleted?: boolean
  onboardingComplete: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  subscriptionRenewAt?: string
}

export interface UserProfile {
  uid: string
  birthDate: string
  height: number
  initialWeight: number
  city?: string
  experienceLevel: ExperienceLevel
  goal: UserGoal
  selectedWorkoutId?: string
  selectedDietId?: string
  waterGoalMl: number
  notificationsEnabled: Record<string, boolean>
}

export interface UserStats {
  uid: string
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  totalCheckIns: number
  totalXP: number
  level: number
  challengesCompleted: number
}
