import { useEffect, useState } from 'react'
import { adminPlanService } from '../../services/adminPlanService'
import type { Plan } from '../../types/domain'

export function useAdminPlans() {
  const [items, setItems] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminPlanService.list()) } catch { setError('Não foi possível carregar planos.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
