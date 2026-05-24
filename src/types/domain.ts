import type { FirestoreDateInput } from '../lib/firebase/date'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'pending'
  | 'past_due'
  | 'cancelled'
  | 'expired'

export type SubscriptionPlan = 'pro' | 'basic' | 'founder'

export type PlanTier = 'low_ticket' | 'mentoring_quarterly' | 'mentoring_semester' | 'mentoring_annual'

export type BillingProvider = 'mercadopago' | 'manual' | 'stripe'

export interface Plan {
  id: string
  name: string
  slug: string
  description: string
  subtitle?: string
  price: number
  currency: 'BRL'
  interval: 'monthly' | 'quarterly' | 'semester' | 'annual'
  durationMonths?: number // 1, 3, 6, 12
  status: 'active' | 'inactive' | 'draft'
  tier?: PlanTier
  features: string[]
  badge?: string // e.g. "Mais popular"
  highlighted?: boolean
  isFounderPlan: boolean
  mercadoPagoPlanId?: string
  mercadoPagoPreapprovalPlanId?: string
  trialDays: number
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  uid: string
  planId: string
  planName: string
  planTier?: PlanTier
  status: SubscriptionStatus
  provider: BillingProvider
  providerCustomerId?: string
  providerSubscriptionId?: string
  providerPreapprovalId?: string
  checkoutSessionId?: string
  price: number
  currency: string
  interval: string
  startedAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  renewalDate?: string
  cancelledAt?: string
  expiresAt?: string
  referralCode?: string
  couponCode?: string
  source?: string
  campaign?: string
  createdAt: string
  updatedAt: string
}

export interface CheckoutSession {
  id: string
  uid: string
  planId: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  provider: 'mercadopago'
  amount: number
  currency: string
  checkoutUrl: string
  providerPreferenceId?: string
  providerPreapprovalId?: string
  referralCode?: string
  couponCode?: string
  source?: string
  campaign?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface BillingEvent {
  id: string
  provider: 'mercadopago'
  providerEventId: string
  providerPaymentId?: string
  providerPreapprovalId?: string
  eventType: string
  uid: string
  planId: string
  subscriptionId?: string
  checkoutSessionId?: string
  rawStatus: string
  normalizedStatus: SubscriptionStatus
  amount: number
  currency: string
  isDuplicate: boolean
  processedAt: string
  createdAt: string
  rawPayload: any
}

export interface AuditLog {
  id: string
  actorUid: string
  actorEmail: string
  action: string
  targetType: string
  targetId: string
  before?: any
  after?: any
  createdAt: string
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type UserGoal =
  | 'hypertrophy'
  | 'fat_loss'
  | 'maintenance'
  | 'performance'
  | 'endurance'
  | 'health'
  | 'strength'

export type Sex = 'male' | 'female' | 'other'

export type TrainingLocation = 'gym' | 'home' | 'mixed' | 'outdoor'

export type DietPreference =
  | 'flexible'
  | 'economic'
  | 'low_carb'
  | 'vegetarian'
  | 'carnivore'
  | 'everything'
  | 'vegan'
  | 'paleo'

export type RecommendationSex = 'male' | 'female' | 'unisex'
export type WorkoutRecommendationGoal = 'hypertrophy' | 'fat_loss' | 'maintenance' | 'performance' | 'strength'
export type DietRecommendationGoal = 'hypertrophy' | 'fat_loss' | 'maintenance' | 'performance'
export type RecommendationTrainingFrequency = 3 | 4 | 5 | 6
export type RecommendationTrainingLevel = 'beginner' | 'intermediate' | 'advanced'
export type RecommendationTrainingLocation = 'gym' | 'home' | 'mixed'
export type RecommendationDietPreference = 'flexible' | 'economic' | 'low_carb' | 'vegetarian' | 'carnivore'
export type WorkoutEquipmentProfile = 'full_gym' | 'basic_gym' | 'dumbbells' | 'bodyweight' | 'mixed'
export type DietProteinLevel = 'standard' | 'high'
export type DietComplexity = 'easy' | 'medium' | 'advanced'

export interface WorkoutRecommendationMetadata {
  goals?: WorkoutRecommendationGoal[]
  sexes?: RecommendationSex[]
  frequencies?: RecommendationTrainingFrequency[]
  levels?: RecommendationTrainingLevel[]
  locations?: RecommendationTrainingLocation[]
  equipmentProfile?: WorkoutEquipmentProfile
  tags?: string[]
}

export interface DietRecommendationMetadata {
  goals?: DietRecommendationGoal[]
  sexes?: RecommendationSex[]
  preferences?: RecommendationDietPreference[]
  caloriesRange?: {
    min: number
    max: number
  }
  proteinLevel?: DietProteinLevel
  complexity?: DietComplexity
  tags?: string[]
}

export interface StudentPreferences {
  sex?: Sex
  weightKg?: number
  heightCm?: number
  goal?: UserGoal
  trainingFrequency?: number
  trainingLevel?: 'beginner' | 'intermediate' | 'advanced'
  trainingLocation?: TrainingLocation
  dietPreference?: DietPreference
  waterGoalMl?: number
  onboardingCompleted?: boolean
  onboardingCompletedAt?: FirestoreDateInput
  recommendationsNeedRefresh?: boolean
  updatedAt?: FirestoreDateInput
}

export type RecommendationScore = {
  score: number
  reasons: string[]
  warnings?: string[]
}

export type RecommendedWorkout = {
  template: Workout
  score: number
  reasons: string[]
  warnings?: string[]
  badge: 'best_match' | 'good_option' | 'alternative'
}

export type RecommendedDiet = {
  template: Diet
  score: number
  reasons: string[]
  warnings?: string[]
  badge: 'best_match' | 'good_option' | 'alternative'
}

export interface StudentRecommendations {
  workouts: RecommendedWorkout[]
  diets: RecommendedDiet[]
  profile: StudentPreferences
  generatedAt: FirestoreDateInput
}

export interface PlanSelection {
  id: string
  uid: string
  type: 'workout' | 'diet'
  templateId: string
  selectedBy: 'student'
  selectedAt: FirestoreDateInput
  source: 'recommendation'
  score: number
  reasons: string[]
}

export type UserRole = 'admin' | 'mentor' | 'member' | 'affiliate'

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  role: UserRole
  mentorId?: string
  createdAt: string
  onboardingCompleted?: boolean
  onboardingComplete?: boolean
  subscriptionStatus?: SubscriptionStatus
  subscriptionPlan?: SubscriptionPlan
  subscriptionRenewAt?: string
  affiliateId?: string
  referralCode?: string
  planTier?: PlanTier
}

export interface MentorAssignment {
  mentorId: string
  studentId: string
  assignedAt: string
  assignedBy?: string
}

export interface UserProfile extends StudentPreferences {
  uid: string
  sex?: Sex
  age?: number
  height?: number
  heightCm?: number
  weight?: number
  weightKg?: number
  birthDate?: string
  city?: string
  experienceLevel?: ExperienceLevel
  trainingLevel?: ExperienceLevel
  goal?: UserGoal
  trainingFrequency?: number // days per week
  trainingLocation?: TrainingLocation
  equipmentAvailable?: string[]
  dietPreference?: DietPreference
  mainDifficulty?: string
  selectedWorkoutId?: string
  selectedDietId?: string
  waterGoalMl?: number
  waterProgressMl?: number
  notificationsEnabled?: Record<string, boolean>
  onboardingDraft?: boolean
  // Streaks
  currentStreak?: number
  longestStreak?: number
  lastStreakActivityDate?: string // ISO date 'YYYY-MM-DD'
  // Mentor onboarding
  mentorOnboardingCompleted?: boolean
  // Mentoring 1:1 anamnesis
  mentoringAnamnesisCompleted?: boolean
  mentoringAnamnesis?: {
    goal: string
    goalDeadline: string
    experienceLevel: string
    availableDays: string[]
    trainingLocation: string
    weightKg: number
    heightCm: number
    measurements: {
      waistCm?: number
      abdomenCm?: number
      hipsCm?: number
      armCm?: number
      thighCm?: number
    }
    allergies: string
    foodLikes: string
    foodDislikes: string
    dietRestrictions: string[]
    injuries: string
    motivation: string
    photoUrls: {
      front: string | null
      side: string | null
      back: string | null
      extra: string | null
    }
    completedAt: string
  }
  createdAt?: FirestoreDateInput
  updatedAt?: FirestoreDateInput
}

export interface StudentTodayDashboardAlert {
  type: 'info' | 'warning' | 'success'
  title: string
  message: string
  actionLabel?: string
  actionTo?: string
}

export interface StudentTodayDashboard {
  profile: {
    name?: string
    goal?: string
    weightKg?: number
    waterGoalMl: number
    recommendationsNeedRefresh: boolean
  }
  workout: {
    selectedWorkoutId?: string
    title?: string
    goal?: string
    nextWorkoutLabel?: string
    completedToday: boolean
    sessionsThisWeek: number
    lastSessionAt?: FirestoreDateInput
  } | null
  diet: {
    selectedDietId?: string
    title?: string
    calories?: number
    adherenceToday: number
    completedMealsToday: number
    totalMealsToday: number
    hasDietDayRecord: boolean
  } | null
  hydration: {
    goalMl: number
    consumedMl: number
    percentage: number
  }
  dailyCheckin: {
    completedToday: boolean
    lastSubmittedAt?: FirestoreDateInput
    mood?: number
    energy?: string
    sleepQuality?: number
  }
  evolutionCheckin: {
    nextDueAt?: FirestoreDateInput
    daysRemaining: number
    isDue: boolean
    lastSubmittedAt?: FirestoreDateInput
  }
  weeklyAdherence: {
    workoutsCompleted: number
    workoutTarget: number
    dietAverage: number
    waterAverage: number
    checkinsCompleted: number
  }
  alerts: StudentTodayDashboardAlert[]
  nextAction: {
    title: string
    description: string
    ctaLabel: string
    to: string
  }
}

// Diet Types
export interface Food {
  id: string
  name: string
  category: "protein" | "carbohydrate" | "fat" | "fruit" | "vegetable" | "dairy" | "supplement" | "drink" | "other"
  basePortion: {
    amount: number
    unit: "g" | "ml" | "unit" | "slice" | "scoop" | "cup" | "tbsp" | "tsp"
    label: string
  }
  macrosPerBasePortion: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sodium?: number
  }
  tags: string[]
  substitutionGroups: string[]
  commonUnits?: Array<{
    amount: number
    unit: string
    gramsEquivalent?: number
    label: string
  }>
  status: "active" | "inactive"
  isSeed?: boolean
  source?: string
  createdAt: string
  updatedAt: string
}

export interface DietSubstitutionOption {
  foodId: string
  foodName: string
  quantity: number
  unit: string
  gramsEquivalent?: number
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface DietMealItem {
  id: string
  foodId: string
  foodName: string
  quantity: number
  unit: string
  gramsEquivalent?: number
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  substitutionOptions?: DietSubstitutionOption[]
  notes?: string
}

export interface DietMeal {
  id: string
  name: string
  timeSuggestion?: string
  order: number
  items: DietMealItem[]
}

export interface Diet {
  id: string
  title: string
  description?: string
  goal: "fat_loss" | "hypertrophy" | "recomposition" | "maintenance" | "health"
  style: "simple" | "low_carb" | "intermittent_fasting" | "vegetarian" | "carnivore" | "economic" | "meal_prep" | "busy_routine" | "with_whey" | "without_whey"
  level?: "beginner" | "intermediate" | "advanced"
  calories: number
  protein: number
  carbs: number
  fat: number
  mealsPerDay: number
  tags: string[]
  meals: DietMeal[]
  shoppingList?: string[]
  notes?: string
  accessTier?: 'all' | 'mentoring'
  status: "draft" | "published" | "archived"
  version: number
  isCurrentVersion?: boolean
  parentPlanId?: string
  createdBy?: string
  updatedBy?: string
  publishedBy?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  summary?: DietSummary
  recommendationMetadata?: DietRecommendationMetadata
}

export interface DietSummary {
  totalKcal: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealsCount: number
  itemsCount: number
}

// Workout Types
export interface Exercise {
  id: string
  name: string
  modality: "bodybuilding" | "crossfit" | "running" | "jiu_jitsu" | "martial_arts" | "functional" | "home" | "mobility" | "cardio" | "mixed"
  muscleGroups: string[]
  primaryMuscleGroup?: string
  secondaryMuscles?: string[]
  equipment: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "kettlebell" | "elastic" | "cardio_machine" | "none" | "other"
  level: "beginner" | "intermediate" | "advanced"
  instructions?: string
  commonMistakes?: string[]
  cues?: string[]
  videoUrl?: string
  thumbnailUrl?: string
  tags: string[]
  substitutionGroups?: string[]
  status: "active" | "inactive"
  isSeed?: boolean
  source?: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutTechnique {
  id: string
  name: string
  description: string
  instructions: string
  isBuiltIn: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WorkoutSetGroup {
  label: string
  sets: number
  reps: string
  description?: string
}

export interface SeriesPreset {
  id: string
  name: string
  groups: WorkoutSetGroup[]
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutExerciseSubstitution {
  exerciseId: string
  exerciseName: string
  notes?: string
  videoUrl?: string
  muscleGroups?: string[]
  equipment?: string
  instructions?: string
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  exerciseName: string
  muscleGroups: string[]
  equipment?: string
  sets: number
  reps: string
  restSeconds: number
  tempo?: string
  rpeTarget?: string
  rirTarget?: string
  notes?: string
  videoUrl?: string
  instructions?: string
  cues?: string[]
  commonMistakes?: string[]
  substitutionOptions?: WorkoutExerciseSubstitution[]
  // Technique
  techniqueId?: string
  techniqueName?: string
  techniqueDescription?: string
  techniqueInstructions?: string
  // Set groups (from series presets)
  setGroups?: WorkoutSetGroup[]
}

export interface WorkoutDay {
  id: string
  name: string
  order: number
  focus?: string
  exercises: WorkoutExercise[]
}

export interface Workout {
  id: string
  title: string
  description?: string
  goal: "fat_loss" | "hypertrophy" | "recomposition" | "conditioning" | "performance" | "health"
  modality: "bodybuilding" | "crossfit" | "running" | "jiu_jitsu" | "martial_arts" | "functional" | "home" | "mixed"
  level: "beginner" | "intermediate" | "advanced"
  daysPerWeek: number
  durationMinutes: number
  focus?: string[]
  tags: string[]
  days: WorkoutDay[]
  accessTier?: 'all' | 'mentoring'
  status: "draft" | "published" | "archived"
  version: number
  isCurrentVersion?: boolean
  parentPlanId?: string
  createdBy?: string
  updatedBy?: string
  publishedBy?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  summary?: WorkoutSummary
  recommendationMetadata?: WorkoutRecommendationMetadata
}

export interface WorkoutSummary {
  workoutsCount: number
  exercisesCount: number
  totalSets: number
  muscleGroups: string[]
  hasVideosCount: number
}

// Session Types
export interface SetLog {
  exerciseId: string
  setNumber: number
  reps: number
  loadKg: number
  rpe?: number
}

export interface WorkoutSession {
  id: string
  uid: string
  workoutId: string
  dayId: string
  startedAt: FirestoreDateInput
  completedAt?: FirestoreDateInput
  logs: SetLog[]
  status: 'in_progress' | 'active' | 'paused' | 'inactive' | 'completed' | 'cancelled' | 'abandoned'
  xpEarned: number
  durationSeconds?: number
  lastInteractionAt?: FirestoreDateInput
  inactiveWarningShownAt?: FirestoreDateInput
  finishedAt?: FirestoreDateInput
  totalTonnageKg?: number
  exercisesCompleted?: number
  totalSets?: number
  prs?: WorkoutPR[]
  substitutions?: Record<string, WorkoutExercise>
}

// Phase 4 - Retention & Evolution Types
export interface DailyCheckin {
  uid: string
  dateKey: string // YYYY-MM-DD
  trained: boolean
  followedDiet: boolean
  hitWaterGoal: boolean
  sleep: number // 1-10
  mood: number // 1-10
  energy: string // 'Baixa' | 'Moderada' | 'Alta' | 'Elite'
  hunger: number // 1-10
  soreness: number // 1-10
  notes?: string
  createdAt: FirestoreDateInput
  updatedAt: FirestoreDateInput
}

export interface WeeklyCheckin {
  uid: string
  weekKey: string // YYYY-WXX
  weightKg: number
  waistCm: number
  abdomenCm: number
  hipCm: number
  completedWorkouts: number
  dietAdherenceDays: number
  waterGoalDays: number
  cardioSessions: number
  averageSleep: number
  averageHunger: number
  mainDifficulty: string
  weeklyWin?: string
  notes?: string
  photoUrls: string[]
  createdAt: FirestoreDateInput
  updatedAt: FirestoreDateInput
}

export interface HydrationDay {
  uid: string
  dateKey: string
  goalMl: number
  totalMl: number
  goalReached: boolean
  createdAt: string
  updatedAt: string
}

export type ChallengeMission = {
  id: string;
  title: string;
  description: string;

  type:
    | "daily_checkin"
    | "weekly_checkin"
    | "body_checkin"
    | "workout_completed"
    | "diet_adherence"
    | "hydration_goal"
    | "content_completed"
    | "manual";

  points: number;

  targetCount?: number;
  minAdherencePercent?: number;

  frequency: "daily" | "weekly" | "once" | "monthly";

  active: boolean;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  monthKey: string; // YYYY-MM
  startsAt: string;
  endsAt: string;

  status: "draft" | "active" | "completed" | "archived";

  theme:
    | "consistency"
    | "fat_loss"
    | "hypertrophy"
    | "hydration"
    | "training"
    | "nutrition"
    | "beginner";

  rules: string[];

  missions: ChallengeMission[];

  badges: string[]; // badgeIds

  rankingEnabled: boolean;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type ChallengeParticipant = {
  uid: string;
  challengeId: string;
  displayName: string;
  photoURL?: string;

  points: number;
  rank?: number;

  completedMissions: Array<{
    missionId: string;
    completedAt: string;
    points: number;
    sourceType: string;
    sourceId?: string;
  }>;

  joinedAt: string;
  updatedAt: string;
};

export type ExpertContent = {
  id: string;
  title: string;
  description: string;
  category:
    | "nutrition"
    | "training"
    | "mindset"
    | "hormones"
    | "supplements"
    | "beginner"
    | "challenge"
    | "live"
    | "guide";

  type:
    | "youtube"
    | "video"
    | "article"
    | "pdf"
    | "live"
    | "external_link";

  youtubeUrl?: string;
  embedUrl?: string;
  externalUrl?: string;
  thumbnailUrl?: string;

  durationMinutes?: number;
  tags: string[];

  accessTier?: 'all' | 'mentoring';
  status: "draft" | "published" | "archived";
  featured: boolean;

  publishedAt?: string;
  createdAt: string;
  updatedAt: string;

  createdBy?: string;
  isSeed?: boolean;
  source?: string;
};

export type ContentProgress = {
  uid: string;
  contentId: string;
  status: "started" | "completed";
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  criteriaType:
    | "challenge_points"
    | "streak"
    | "workout_count"
    | "diet_adherence"
    | "content_completed"
    | "manual";
  criteriaValue: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

// Phase 5B - Affiliate & Commission Types
export interface AffiliateAccount {
  id: string
  uid?: string
  name: string
  email: string
  phone?: string
  instagram?: string
  status: 'active' | 'inactive' | 'blocked' | 'pending'
  commissionRate: number // default 0.20
  payoutMethod: 'pix' | 'bank_transfer' | 'manual'
  pixKey?: string
  notes?: string
  totalCommissionPaid: number
  pendingCommission: number
  createdAt: string
  updatedAt: string
}

export interface ReferralCode {
  code: string
  affiliateId: string
  affiliateName: string
  status: 'active' | 'inactive'
  discountType: 'none' | 'percent' | 'fixed'
  discountValue: number
  commissionRate: number
  usageCount: number
  activeSubscriptionsCount: number
  createdAt: string
  updatedAt: string
}

export interface ReferralAttribution {
  id: string
  uid: string
  affiliateId: string
  referralCode: string
  couponCode?: string
  source?: string
  campaign?: string
  firstSeenAt: string
  attributedAt?: string
  checkoutSessionId?: string
  subscriptionId?: string
  status: 'pending' | 'converted' | 'cancelled' | 'expired'
  createdAt: string
  updatedAt: string
}

export interface CommissionEntry {
  id: string
  affiliateId: string
  affiliateName: string
  uid: string
  userEmail: string
  subscriptionId: string
  checkoutSessionId?: string
  billingEventId: string
  planId: string
  planName: string
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  currency: 'BRL'
  periodStart?: string
  periodEnd?: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled' | 'reversed'
  reason?: string
  isDemo: boolean
  createdAt: string
  approvedAt?: string
  paidAt?: string
  reversedAt?: string
}

export interface AffiliatePayout {
  id: string
  affiliateId: string
  amount: number
  currency: 'BRL'
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  ledgerEntryIds: string[]
  payoutMethod: 'pix' | 'bank_transfer' | 'manual'
  pixKey?: string
  notes?: string
  createdAt: string
  paidAt?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE & INTERNAL ECONOMY — Full System
// ─────────────────────────────────────────────────────────────────────────────

// Account type distinguishes cash-earning influencers from credit-earning students
export type AffiliateAccountType = 'influencer' | 'student'

// Commission tiers per plan tier
export type CommissionTier = {
  planTier: PlanTier
  discountPercent: number   // discount given to referred user
  commissionPercent: number // reward to referrer
}

export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  { planTier: 'low_ticket',            discountPercent: 5,  commissionPercent: 5  },
  { planTier: 'mentoring_quarterly',   discountPercent: 10, commissionPercent: 10 },
  { planTier: 'mentoring_semester',    discountPercent: 15, commissionPercent: 15 },
  { planTier: 'mentoring_annual',      discountPercent: 20, commissionPercent: 20 },
]

// Influencer account — earns real BRL, can request payouts
export interface InfluencerAccount {
  id: string
  uid: string                          // Firebase UID (influencer is also an app user)
  displayName: string
  email: string
  phone?: string
  instagram?: string
  youtubeChannel?: string
  status: 'active' | 'inactive' | 'blocked' | 'pending_review'
  tier: 'nano' | 'micro' | 'macro' | 'mega' // follower tier, for future rate adjustments
  customCommissionTiers?: CommissionTier[]   // override defaults per influencer
  payoutMethod: 'pix' | 'bank_transfer' | 'manual'
  pixKey?: string
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random'
  bankName?: string
  bankAgency?: string
  bankAccount?: string
  minPayoutAmount: number              // minimum to request payout (default: R$50)
  holdDays: number                     // days to hold commission (default: 15)
  notes?: string
  // Materialized counters (kept in sync by service, not source of truth)
  totalReferrals: number
  activeReferrals: number
  pendingCommissionBrl: number
  approvedCommissionBrl: number
  paidCommissionBrl: number
  totalRevenueBrl: number
  conversionRate: number               // conversions / clicks
  totalClicks: number
  createdAt: string
  updatedAt: string
  createdBy: string                    // admin uid who created
}

// Student referral account — earns internal credits, no payout
export interface StudentReferralAccount {
  id: string
  uid: string
  displayName: string
  referralCode: string                 // e.g. “RUBENM-K7X”
  referralCodeSlug: string             // e.g. “RUBENM” (display version)
  status: 'active' | 'blocked'
  // Materialized counters
  totalReferrals: number
  activeReferrals: number
  pendingCredits: number               // credits not yet confirmed
  availableCredits: number             // credits available to spend
  lifetimeCreditsEarned: number
  lifetimeCreditsSpent: number
  // Anti-fraud
  pendingReferralCount: number         // max 5 pending at once
  fraudScore: number                   // 0–100, higher = more suspicious
  lastFraudCheck: string
  createdAt: string
  updatedAt: string
}

// ─── WALLET LEDGER (append-only) ─────────────────────────────────────────────

export type WalletCurrency = 'CREDITS' | 'BRL'

export type WalletEntryType =
  | 'EARN_REFERRAL_COMMISSION'         // student earns credits for referral
  | 'EARN_REFERRAL_BONUS'              // student earns bonus for reaching milestone
  | 'EARN_INFLUENCER_COMMISSION'       // influencer earns BRL for referral
  | 'SPEND_STORE_REDEMPTION'           // student spends credits at store
  | 'SPEND_PLAN_DISCOUNT'              // credits applied as plan discount
  | 'HOLD_PENDING'                     // amount reserved while payment settles
  | 'RELEASE_HOLD'                     // hold released, becomes available
  | 'EXPIRE'                           // credits expired
  | 'REVERSE_REFERRAL'                 // referral reversed (chargeback / cancel)
  | 'REVERSE_STORE'                    // store redemption reversed
  | 'PAYOUT_REQUEST'                   // influencer requests payout
  | 'PAYOUT_APPROVED'                  // payout approved by admin
  | 'PAYOUT_PAID'                      // payout sent to influencer
  | 'PAYOUT_REJECTED'                  // payout rejected
  | 'ADMIN_CREDIT'                     // manual credit by admin
  | 'ADMIN_DEBIT'                      // manual debit by admin

export type WalletEntryStatus =
  | 'PENDING'                          // awaiting payment confirmation or hold period
  | 'CONFIRMED'                        // available / processed
  | 'REVERSED'                         // reversed due to chargeback/cancel
  | 'EXPIRED'                          // credits expired

export interface WalletLedgerEntry {
  id: string
  userId: string
  accountType: AffiliateAccountType
  currency: WalletCurrency
  entryType: WalletEntryType
  amount: number                       // positive = credit, negative = debit
  status: WalletEntryStatus
  // References
  referralId?: string
  subscriptionId?: string
  paymentId?: string                   // Mercado Pago payment ID
  storeRedemptionId?: string
  payoutId?: string
  relatedEntryId?: string              // for RELEASE_HOLD, REVERSE_* — links to original
  // Hold mechanics
  holdUntil?: string                   // ISO date; entry counts as PENDING until this date
  // Metadata
  description: string                  // human-readable e.g. “Comissão por CARLOSA”
  correlationId?: string               // traces a financial operation across multiple ledger entries (e.g. same store redemption debit + hold release)
  metadata?: Record<string, unknown>
  // Audit
  createdAt: string
  createdBy: string                    // 'system' | admin uid
  reversedAt?: string
  reversedBy?: string
}

// Materialized balance view (kept in sync, NOT source of truth)
export interface WalletBalance {
  userId: string
  accountType: AffiliateAccountType
  currency: WalletCurrency
  availableBalance: number             // sum of CONFIRMED entries
  pendingBalance: number               // sum of PENDING entries
  lifetimeEarned: number
  lifetimeSpent: number
  lastUpdated: string
}

// ─── REFERRAL CODES ─────────────────────────────────────────────────────────

export interface ReferralCodeV2 {
  id: string
  code: string                         // full code e.g. “RUBENM-K7X”
  slug: string                         // display slug e.g. “RUBENM”
  suffix: string                       // random suffix e.g. “K7X”
  ownerUid: string
  ownerType: AffiliateAccountType
  ownerDisplayName: string
  status: 'active' | 'paused' | 'banned'
  customDiscountPercent?: number       // override default tier discount
  customCommissionPercent?: number     // override default tier commission
  // Analytics (materialized)
  totalClicks: number
  uniqueClicks: number
  totalConversions: number
  totalRevenueBrl: number
  // Campaign tagging
  campaignId?: string
  utmSource?: string
  utmMedium?: string
  utmContent?: string
  createdAt: string
  updatedAt: string
}

// ─── REFERRALS (one per referred user) ─────────────────────────────────────

export interface Referral {
  id: string
  referralCodeId: string
  referralCode: string
  referrerId: string
  referrerType: AffiliateAccountType
  referrerId_referredId: string        // compound for dedup: `${referrerId}_${referredId}`
  referredUserId: string
  referredEmail: string
  // Status lifecycle: pending → converted → active | cancelled | reversed
  status: 'pending' | 'converted' | 'active' | 'cancelled' | 'reversed' | 'fraud_hold'
  // Discount applied
  discountPercent: number
  discountAmountBrl: number
  // Commission
  commissionPercent: number
  commissionAmountBrl: number          // calculated at conversion time
  // Payment tracking
  planTier: PlanTier
  planId: string
  subscriptionId?: string
  paymentId?: string
  grossAmountBrl: number
  // Hold
  holdUntil?: string
  ledgerEntryId?: string
  // Anti-fraud
  riskScore: number                    // 0–100
  fraudFlags: FraudFlag[]
  deviceFingerprint?: string
  referrerIp?: string
  referredIp?: string
  // Attribution
  attributedAt?: string
  convertedAt?: string
  cancelledAt?: string
  reversedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── ANTI-FRAUD ────────────────────────────────────────────────────────────

export type FraudFlag =
  | 'SELF_REFERRAL'                    // same device/IP as referrer
  | 'SAME_IP_AS_REFERRER'
  | 'SAME_DEVICE_AS_REFERRER'
  | 'MULTIPLE_REFERRALS_SAME_IP'
  | 'RAPID_SIGNUP_AFTER_CLICK'         // < 60 seconds between click and signup
  | 'FAKE_EMAIL_PATTERN'               // disposable email domain
  | 'EXCESSIVE_PENDING_REFERRALS'      // referrer has > 5 pending
  | 'CHARGEBACK_HISTORY'
  | 'VELOCITY_LIMIT_HIT'
  | 'SUSPICIOUS_PAYOUT_PATTERN'

export interface FraudSignal {
  id: string
  userId: string
  referralId?: string
  payoutId?: string
  flags: FraudFlag[]
  riskScore: number
  resolvedAt?: string
  resolvedBy?: string
  resolution?: 'false_positive' | 'confirmed_fraud' | 'manual_override'
  notes?: string
  createdAt: string
}

// ─── PAYOUTS (influencer cash) ──────────────────────────────────────────────

export interface InfluencerPayout {
  id: string
  influencerId: string
  requestedBy: string                  // usually same as influencerId
  amount: number
  currency: 'BRL'
  status: 'pending_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled'
  ledgerEntryIds: string[]
  payoutMethod: 'pix' | 'bank_transfer' | 'manual'
  pixKey?: string
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random'
  transactionId?: string               // bank/pix transaction ref
  receiptUrl?: string
  notes?: string
  adminNotes?: string
  rejectionReason?: string
  // Anti-fraud: payout hold (15 days from last qualifying commission)
  earliestPayoutDate: string
  reviewedBy?: string
  createdAt: string
  reviewedAt?: string
  paidAt?: string
}

// ─── INTERNAL STORE ─────────────────────────────────────────────────────────

export type StoreItemCategory =
  | 'plan_discount'                    // % off next plan renewal
  | 'plan_upgrade'                     // upgrade to next tier for N months
  | 'digital_product'                  // ebook, template, etc.
  | 'physical_product'                 // supplement, merchandise
  | 'consultation'                     // 1:1 session with mentor
  | 'vip_access'                       // VIP community access
  | 'challenge_entry'                  // entry to paid challenge
  | 'custom'

export interface StoreItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  category: StoreItemCategory
  creditCost: number                   // credits required
  stock: number                        // -1 = unlimited
  reservedStock: number                // stock held for pending redemptions
  isActive: boolean
  maxPerUser: number                   // max redemptions per user (-1 = unlimited)
  validFrom?: string
  validUntil?: string
  // For plan discounts
  discountPercent?: number
  discountMonths?: number
  targetPlanTier?: PlanTier
  // Fulfillment
  fulfillmentType: 'automatic' | 'manual_review'
  fulfillmentInstructions?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface StoreRedemption {
  id: string
  userId: string
  storeItemId: string
  storeItemTitle: string
  creditCost: number
  status: 'pending_fulfillment' | 'fulfilled' | 'cancelled' | 'reversed'
  ledgerEntryId: string
  fulfillmentNotes?: string
  fulfilledBy?: string
  cancelledBy?: string
  createdAt: string
  fulfilledAt?: string
  cancelledAt?: string
}

// ─── WEBHOOK EVENTS (idempotency) ────────────────────────────────────────────

export interface WebhookEvent {
  id: string                           // use MP's payment ID or event ID
  provider: 'mercadopago'
  eventType: string                    // e.g. “payment.approved”
  payload: Record<string, unknown>
  status: 'received' | 'processing' | 'processed' | 'failed' | 'skipped'
  processingAttempts: number
  error?: string
  processedAt?: string
  createdAt: string
}

// ─── REFERRAL CHALLENGES (gamification) ──────────────────────────────────────

export interface ReferralChallenge {
  id: string
  title: string
  description: string
  targetCount: number                  // e.g. “Indique 5 amigos”
  rewardCredits: number
  rewardBadgeId?: string
  isActive: boolean
  startsAt: string
  endsAt?: string
  createdAt: string
}

export interface ReferralChallengeProgress {
  id: string
  userId: string
  challengeId: string
  currentCount: number
  completed: boolean
  completedAt?: string
  rewardClaimedAt?: string
  createdAt: string
}

// Phase 6 — Diet Day Tracking
export interface DietDayFoodLog {
  foodId: string
  foodName: string
  amount?: string
  completed: boolean
  substitutedWith?: string
  alternatives?: Food[]
  kcal: number
  macros: { carbs: number; protein: number; fat: number }
}

export interface DietDayMealLog {
  mealId: string
  mealName: string
  foods: DietDayFoodLog[]
}

export interface DietDay {
  uid: string
  dateKey: string
  dietId: string
  meals: DietDayMealLog[]
  totalCaloriesPlanned: number
  totalCaloriesConsumed: number
  totalProteinPlanned: number
  totalProteinConsumed: number
  totalCarbsPlanned: number
  totalCarbsConsumed: number
  totalFatPlanned: number
  totalFatConsumed: number
  adherencePercent: number
  completedMealsCount?: number
  completedItemsCount: number
  totalItemsCount: number
  createdAt: FirestoreDateInput
  updatedAt: FirestoreDateInput
}

// Phase 6 â€” Workout Session V2
export type WorkoutSessionStatus = 'in_progress' | 'active' | 'paused' | 'inactive' | 'completed' | 'abandoned'

export interface WorkoutSessionV2 extends Omit<WorkoutSession, 'status'> {
  status: WorkoutSessionStatus
  durationSeconds: number
  lastInteractionAt: string
  totalTonnageKg: number
  exercisesCompleted: number
  totalSets: number
  prs: WorkoutPR[]
}

export interface WorkoutPR {
  exerciseId: string
  exerciseName: string
  type: 'load' | 'reps' | 'volume'
  value: number
  previousValue?: number
}

// Phase 6 â€” Evolution / Checkin Mensal
export interface BodyCheckin {
  id: string
  uid: string
  date: string
  weightKg: number
  measurements: {
    waistCm?: number
    abdomenCm?: number
    hipsCm?: number
    armCm?: number
    thighCm?: number
  }
  photoUrls: {
    front?: string
    side?: string
    back?: string
    extra?: string
  }
  routineEvaluation?: string
  mainDifficulty?: string
  mainEvolution?: string
  nextMonthGoal?: string
  notes?: string
  createdAt: string
  updatedAt: string;
}
export type CommunityPost = {
  id: string
  authorId: string
  authorName: string
  authorPhoto?: string
  content: string
  type: 'announcement' | 'discussion' | 'achievement'
  createdAt: string
  likesCount: number
  commentsCount: number
  isPinned: boolean
  isOfficial: boolean
  imageUrl?: string
  likedBy: string[]
  status: 'published' | 'hidden' | 'archived' | 'deleted'
  reportCount?: number
}

export type CommunityComment = {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorPhoto?: string
  content: string
  createdAt: string
  status: 'published' | 'hidden' | 'deleted'
  reportCount?: number
}

export type Notification = {
  id: string
  uid: string
  type: 'badge_unlocked' | 'xp_earned' | 'content_published' | 'challenge_published' | 'challenge_mission_completed' | 'ranking_updated' | 'official_post' | 'comment_reply' | 'system'
  title: string
  body: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}
