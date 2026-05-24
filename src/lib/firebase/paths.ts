export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  SUBSCRIPTIONS: 'subscriptions',
  DIETS: 'diets',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  CONTENT: 'content',
  CHALLENGES: 'challenges',
  ANNOUNCEMENTS: 'announcements',
  PLANS: 'plans',
  CHECKOUT_SESSIONS: 'checkoutSessions',
  BILLING_EVENTS: 'billingEvents',
  AUDIT_LOGS: 'auditLogs',
  // Legacy affiliate (keep for backward compat)
  AFFILIATE_ACCOUNTS: 'affiliateAccounts',
  REFERRAL_CODES: 'referralCodes',
  REFERRAL_ATTRIBUTIONS: 'referralAttributions',
  COMMISSION_LEDGER: 'commissionLedger',
  AFFILIATE_PAYOUTS: 'affiliatePayouts',
  // Full economy system
  INFLUENCER_ACCOUNTS: 'influencerAccounts',
  STUDENT_REFERRAL_ACCOUNTS: 'studentReferralAccounts',
  REFERRAL_CODES_V2: 'referralCodesV2',
  REFERRALS: 'referrals',
  WALLET_LEDGER: 'walletLedger',
  WALLET_BALANCES: 'walletBalances',
  INFLUENCER_PAYOUTS: 'influencerPayouts',
  STORE_ITEMS: 'storeItems',
  STORE_REDEMPTIONS: 'storeRedemptions',
  WEBHOOK_EVENTS: 'webhookEvents',
  FRAUD_SIGNALS: 'fraudSignals',
  REFERRAL_CHALLENGES: 'referralChallenges',
  REFERRAL_CHALLENGE_PROGRESS: 'referralChallengeProgress',
  // Operational infrastructure
  SYSTEM_CONFIG: 'systemConfig',
  DEAD_LETTER_QUEUE: 'deadLetterQueue',
  RECONCILIATION_REPORTS: 'reconciliationReports',
  FOODS: 'foods',
  BADGES: 'badges',
  MENTOR_STUDENTS: 'mentorStudents',
  WORKOUT_TECHNIQUES: 'workoutTechniques',
  SERIES_PRESETS: 'seriesPresets',
  FEEDBACK_SCHEDULES: 'feedbackSchedules',
} as const

export const SUB_COLLECTIONS = {
  HYDRATION_DAYS: 'hydrationDays',
  WORKOUT_SESSIONS: 'workoutSessions',
  DAILY_CHECKINS: 'dailyCheckins',
  WEEKLY_CHECKINS: 'weeklyCheckins',
  BODY_METRICS: 'bodyMetrics',
  BODY_CHECKINS: 'bodyCheckins',
  DIET_DAYS: 'dietDays',
  CONTENT_PROGRESS: 'contentProgress',
  EARNED_BADGES: 'earnedBadges',
  PLAN_SELECTIONS: 'planSelections',
  PARTICIPANTS: 'participants', // For challenges
  FEEDBACK_REQUESTS: 'feedbackRequests',
  FEEDBACK_RESPONSES: 'feedbackResponses',
} as const

export const getDocPath = (collection: string, docId: string) => `${collection}/${docId}`
export const getSubCollectionPath = (collection: string, docId: string, subCollection: string) => 
  `${collection}/${docId}/${subCollection}`
