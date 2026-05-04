export interface Workout {
  id: string
  title: string
  objective: 'hypertrophy' | 'fat_loss' | 'endurance' | 'strength'
  level: 'beginner' | 'intermediate' | 'advanced'
  durationMinutes: number
  estimatedKcal: number
  exerciseCount: number
  description: string
  tags: string[]
}

export interface Diet {
  id: string
  title: string
  objective: 'hypertrophy' | 'fat_loss' | 'maintenance'
  totalKcal: number
  macros: {
    carbs: number
    protein: number
    fat: number
  }
  macroTargets: {
    carbs: number
    protein: number
    fat: number
  }
  tags: string[]
}

export interface HydrationData {
  currentMl: number
  goalMl: number
  percentage: number
}

export interface DailyCheckInStatus {
  completed: boolean
  date: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'weekly' | 'monthly'
  xpReward: number
  progress: number
  participantCount: number
  daysLeft: number
}

export interface LiveEvent {
  id: string
  title: string
  topic: string
  time: string
  speaker: string
  speakerRole: string
  isLive: boolean
  label: string
}

export interface WeeklyMission {
  title: string
  description: string
  participantCount: number
}

export interface CommunityData {
  memberCount: number
  whatsappLink: string
}

export interface TodayDashboardData {
  userName: string
  greeting: string
  date: string
  streak: number
  workout: Workout
  diet: Diet
  hydration: HydrationData
  checkIn: DailyCheckInStatus
  weeklyMission: WeeklyMission
  challenge: Challenge
  liveEvent: LiveEvent
  community: CommunityData
}
