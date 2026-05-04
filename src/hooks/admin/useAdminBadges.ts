import { useEffect, useState } from 'react'
import { adminBadgeService } from '../../services/adminBadgeService'
import type { Badge } from '../../types/domain'

export function useAdminBadges() {
  const [items, setItems] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminBadgeService.list()) } catch { setError('Não foi possível carregar badges.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
