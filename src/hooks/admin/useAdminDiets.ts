import { useEffect, useState } from 'react'
import { adminDietService, adminFoodService } from '../../services/adminDietService'
import type { Diet, Food } from '../../types/domain'

export function useAdminDiets() {
  const [items, setItems] = useState<Diet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminDietService.list()) } catch { setError('Não foi possível carregar dietas.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}

export function useAdminFoods() {
  const [items, setItems] = useState<Food[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminFoodService.list()) } catch { setError('Não foi possível carregar alimentos.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
