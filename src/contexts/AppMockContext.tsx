import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile, Workout, Diet, WorkoutSession } from '../types/domain'
import { mockWorkouts } from '../data/mockWorkouts'
import { mockDiets } from '../data/mockDiets'

interface AppState {
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile) => void
  selectedWorkout: Workout | null
  setSelectedWorkout: (workoutId: string) => void
  selectedDiet: Diet | null
  setSelectedDiet: (dietId: string) => void
  currentSession: WorkoutSession | null
  setCurrentSession: (session: WorkoutSession | null) => void
  updateWaterProgress: (ml: number) => void
  workouts: Workout[]
  diets: Diet[]
}

const AppMockContext = createContext<AppState | undefined>(undefined)

export function AppMockProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('expert_club_profile')
    return saved ? JSON.parse(saved) : null
  })
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)

  const selectedWorkout = mockWorkouts.find(w => w.id === userProfile?.selectedWorkoutId) || null
  const selectedDiet = mockDiets.find(d => d.id === userProfile?.selectedDietId) || null

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('expert_club_profile', JSON.stringify(userProfile))
    }
  }, [userProfile])

  const handleSetSelectedWorkout = (id: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, selectedWorkoutId: id })
    }
  }

  const handleSetSelectedDiet = (id: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, selectedDietId: id })
    }
  }

  const handleUpdateWaterProgress = (ml: number) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, waterProgressMl: (userProfile.waterProgressMl || 0) + ml })
    }
  }

  const value: AppState = {
    userProfile,
    setUserProfile,
    selectedWorkout,
    setSelectedWorkout: handleSetSelectedWorkout,
    selectedDiet,
    setSelectedDiet: handleSetSelectedDiet,
    currentSession,
    setCurrentSession,
    updateWaterProgress: handleUpdateWaterProgress,
    workouts: mockWorkouts,
    diets: mockDiets
  }

  return <AppMockContext.Provider value={value}>{children}</AppMockContext.Provider>
}

export function useAppMock() {
  const context = useContext(AppMockContext)
  if (context === undefined) {
    throw new Error('useAppMock must be used within an AppMockProvider')
  }
  return context
}
