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
  AFFILIATE_ACCOUNTS: 'affiliateAccounts',
  REFERRAL_CODES: 'referralCodes',
  REFERRAL_ATTRIBUTIONS: 'referralAttributions',
  COMMISSION_LEDGER: 'commissionLedger',
  AFFILIATE_PAYOUTS: 'affiliatePayouts',
  FOODS: 'foods',
  BADGES: 'badges',
  MENTOR_STUDENTS: 'mentorStudents',
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
  PARTICIPANTS: 'participants', // For challenges
} as const

export const getDocPath = (collection: string, docId: string) => `${collection}/${docId}`
export const getSubCollectionPath = (collection: string, docId: string, subCollection: string) => 
  `${collection}/${docId}/${subCollection}`
