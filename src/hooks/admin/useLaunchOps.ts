import { useState, useEffect } from 'react'
import { adminLaunchService, LaunchDateRange, LaunchOpsMetrics, AffiliateLaunchRow, LaunchAlert } from '../../services/adminLaunchService'

export function useLaunchOps(range: LaunchDateRange) {
  const [metrics, setMetrics] = useState<LaunchOpsMetrics | null>(null)
  const [affiliateRows, setAffiliateRows] = useState<AffiliateLaunchRow[]>([])
  const [alerts, setAlerts] = useState<LaunchAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await adminLaunchService.getLaunchData(range)
        setMetrics(data.metrics)
        setAffiliateRows(data.affiliateRows)
        setAlerts(data.alerts)
      } catch (err: any) {
        console.error('Failed to load launch ops data:', err)
        setError(err.message || 'Error loading dashboard data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [range])

  return { metrics, affiliateRows, alerts, isLoading, error }
}
