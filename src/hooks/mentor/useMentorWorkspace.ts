import { useEffect, useState } from 'react'
import {
  mentorDashboardService,
  type MentorAgendaItem,
  type MentorCheckinRow,
  type MentorFinanceData,
  type MentorOverviewData,
  type MentorReportsData,
  type MentorStudentRow,
} from '../../services/mentorDashboardService'

function useAsyncResource<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

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
  return useAsyncResource<MentorOverviewData>(() => mentorDashboardService.getOverview(), [])
}

export function useMentorStudents() {
  return useAsyncResource<MentorStudentRow[]>(() => mentorDashboardService.listStudents(), [])
}

export function useMentorCheckins() {
  return useAsyncResource<MentorCheckinRow[]>(() => mentorDashboardService.listCheckins(), [])
}

export function useMentorAgenda() {
  return useAsyncResource<MentorAgendaItem[]>(() => mentorDashboardService.getAgenda(), [])
}

export function useMentorFinance() {
  return useAsyncResource<MentorFinanceData>(() => mentorDashboardService.getFinance(), [])
}

export function useMentorReports() {
  return useAsyncResource<MentorReportsData>(() => mentorDashboardService.getReports(), [])
}
