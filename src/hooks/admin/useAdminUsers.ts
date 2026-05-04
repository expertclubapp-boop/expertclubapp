import { useEffect, useState } from 'react'
import { adminUserService, type AdminUserDetail, type AdminUserRow } from '../../services/adminUserService'

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => {
    setIsLoading(true)
    setError(null)
    try { setUsers(await adminUserService.list()) } catch { setError('Não foi possível carregar usuários.') } finally { setIsLoading(false) }
  }
  useEffect(() => { reload() }, [])
  return { users, isLoading, error, reload }
}

export function useAdminUser(uid?: string) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => {
    if (!uid) return
    setIsLoading(true)
    setError(null)
    try { setDetail(await adminUserService.get(uid)) } catch { setError('Não foi possível carregar o usuário.') } finally { setIsLoading(false) }
  }
  useEffect(() => { reload() }, [uid])
  return { detail, isLoading, error, reload }
}
