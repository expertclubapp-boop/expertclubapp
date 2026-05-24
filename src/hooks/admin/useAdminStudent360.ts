import { useEffect, useState } from 'react'
import { adminStudentService, type AdminStudent360 } from '../../services/adminStudentService'

export function useAdminStudent360(uid?: string) {
  const [data, setData] = useState<AdminStudent360 | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    if (!uid) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminStudentService.getAdminStudent360(uid)
      setData(result)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar o prontuário 360 do aluno.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [uid])

  return { data, isLoading, error, reload }
}
