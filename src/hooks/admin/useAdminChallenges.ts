import { useEffect, useState } from 'react'
import { adminChallengeService } from '../../services/adminChallengeService'
import type { Challenge } from '../../types/domain'

export function useAdminChallenges() {
  const [items, setItems] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminChallengeService.list()) } catch { setError('Não foi possível carregar desafios.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
