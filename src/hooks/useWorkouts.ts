import { useState, useEffect } from 'react'
import { workoutService } from '../services/workoutService'
import type { Workout } from '../types/domain'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await workoutService.getAllPublished()
        setWorkouts(data)
      } catch (err) {
        setError('Falha ao carregar treinos')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { workouts, isLoading, error }
}

export function useWorkout(id?: string) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }
    
    const workoutId = id
    async function load() {
      try {
        const data = await workoutService.getById(workoutId)
        setWorkout(data)
      } catch (err) {
        setError('Falha ao carregar detalhes do treino')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  return { workout, isLoading, error }
}
