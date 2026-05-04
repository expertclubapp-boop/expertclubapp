import { useEffect, useState } from 'react'
import { adminContentService } from '../../services/adminContentService'
import type { ExpertContent } from '../../types/domain'

export function useAdminContent() {
  const [items, setItems] = useState<ExpertContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setItems(await adminContentService.list()) } catch { setError('Não foi possível carregar conteúdos.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { items, isLoading, error, reload }
}
