import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  mentorDashboardService,
  type MentorAgendaItem,
  type MentorCheckinRow,
  type MentorFinanceData,
  type MentorInfluencerRow,
  type MentorOverviewData,
  type MentorReportsData,
  type MentorStudentRow,
} from '../../services/mentorDashboardService'

function useAsyncResource<T>(loader: (() => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!loader) {
      setData(null)
      setError('Nao foi possivel identificar a sessao do mentor.')
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    setIsLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (isMounted) {
          setData(result)
        }
      })
      .catch((loaderError) => {
        console.error(loaderError)
        if (isMounted) {
          setError('Nao foi possivel carregar os dados do mentor.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, deps)

  return { data, isLoading, error }
}

export function useMentorOverview() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.getOverview({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<MentorOverviewData>(loader, [user?.uid, user?.role])
}

export function useMentorStudents() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.listStudents({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<{ rows: MentorStudentRow[]; isPartial?: boolean }>(loader, [user?.uid, user?.role])
}

export function useMentorCheckins() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.listCheckins({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<{ rows: MentorCheckinRow[]; isPartial?: boolean }>(loader, [user?.uid, user?.role])
}

export function useMentorAgenda() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.getAgenda({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<MentorAgendaItem[]>(loader, [user?.uid, user?.role])
}

export function useMentorFinance() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.getFinance({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<MentorFinanceData>(loader, [user?.uid, user?.role])
}

export function useMentorReports() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.getReports({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<MentorReportsData>(loader, [user?.uid, user?.role])
}

export function useMentorInfluencers() {
  const { user } = useAuth()
  const loader = user ? () => mentorDashboardService.listInfluencers({ uid: user.uid, role: user.role === 'mentor' ? 'mentor' : 'admin' }) : null
  return useAsyncResource<{ rows: MentorInfluencerRow[]; isPartial?: boolean }>(loader, [user?.uid, user?.role])
}
