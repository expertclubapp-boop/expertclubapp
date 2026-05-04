import { useEffect, useState } from 'react'
import { adminCommunityService, type AdminCommunitySettings } from '../../services/adminCommunityService'

export function useAdminCommunity() {
  const [settings, setSettings] = useState<AdminCommunitySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => { setIsLoading(true); try { setSettings(await adminCommunityService.get()) } catch { setError('Não foi possível carregar comunidade.') } finally { setIsLoading(false) } }
  useEffect(() => { reload() }, [])
  return { settings, isLoading, error, reload }
}
