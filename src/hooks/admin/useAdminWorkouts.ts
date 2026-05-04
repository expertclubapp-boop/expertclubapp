import { useEffect, useState } from 'react'
import { adminExerciseService, adminWorkoutService } from '../../services/adminWorkoutService'
import type { Exercise, Workout } from '../../types/domain'

export function useAdminWorkouts() {
  const [items, setItems] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminWorkoutService.list()) } catch { setError('Não foi possível carregar treinos.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}

export function useAdminExercises() {
  const [items, setItems] = useState<(Exercise & { createdAt?: string; updatedAt?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminExerciseService.list()) } catch { setError('Não foi possível carregar exercícios.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
