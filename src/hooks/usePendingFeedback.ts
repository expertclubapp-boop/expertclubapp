import { useState, useEffect } from 'react'
import { feedbackService } from '../services/feedbackService'
import type { FeedbackRequest } from '../types/feedback'

export function usePendingFeedback(uid: string | null, onboardingCompleted: boolean) {
  const [pending, setPending] = useState<FeedbackRequest | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!uid || !onboardingCompleted) return
    let cancelled = false

    feedbackService.ensureDefaultSchedule(uid)
      .then(() => feedbackService.getPendingRequestForToday(uid))
      .then((req) => { if (!cancelled) { setPending(req); setChecked(true) } })
      .catch(() => { if (!cancelled) setChecked(true) })

    return () => { cancelled = true }
  }, [uid, onboardingCompleted])

  return { pending, checked }
}
