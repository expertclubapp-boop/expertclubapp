import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

export const analyticsReady = Boolean(POSTHOG_KEY)

export function initAnalytics() {
  if (!POSTHOG_KEY) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  })
}

export function identifyUser(uid: string, props: { email?: string; role?: string; displayName?: string }) {
  if (!analyticsReady) return
  posthog.identify(uid, {
    email: props.email,
    role: props.role,
    name: props.displayName,
  })
}

export function resetAnalyticsUser() {
  if (!analyticsReady) return
  posthog.reset()
}

export function trackPageView(path: string) {
  if (!analyticsReady) return
  posthog.capture('$pageview', { $current_url: window.location.origin + path })
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (!analyticsReady) return
  posthog.capture(event, properties)
}

export type AnalyticsEvent =
  // Auth
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'password_reset_requested'
  // Onboarding
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_back_navigation'
  // Plan selection (critical funnel step)
  | 'recommendations_viewed'
  | 'plan_workout_selected'
  | 'plan_diet_selected'
  | 'plan_confirmed'
  // Workout
  | 'workout_session_started'
  | 'workout_set_completed'
  | 'workout_session_completed'
  | 'workout_session_abandoned'
  | 'workout_exercise_substituted'
  // Diet
  | 'diet_day_logged'
  | 'diet_meal_checked'
  | 'diet_food_substitution_used'
  | 'diet_adherence_milestone'
  // Hydration
  | 'hydration_logged'
  | 'hydration_goal_reached'
  // Check-in
  | 'daily_checkin_submitted'
  | 'weekly_checkin_submitted'
  | 'body_checkin_submitted'
  // Community
  | 'community_post_created'
  | 'community_post_liked'
  | 'community_comment_added'
  | 'community_feed_load_error'
  // Subscription + billing funnel
  | 'billing_lock_reached'
  | 'subscription_plan_viewed'
  | 'subscription_checkout_started'
  // Gamification
  | 'challenge_joined'
  | 'badge_earned'
  | 'streak_milestone'
  // Push notifications
  | 'push_notification_granted'
  | 'push_notification_denied'
  // Profile
  | 'profile_updated'
  | 'profile_photo_uploaded'
  // Errors (for observability)
  | 'error_wallet_load'
  | 'error_referral_load'
