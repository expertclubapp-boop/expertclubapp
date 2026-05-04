export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'pending'
  | 'past_due'
  | 'cancelled'
  | 'expired'

export type SubscriptionPlan = 'pro' | 'basic' | 'founder'

export type BillingProvider = 'mercadopago' | 'manual' | 'stripe'

export interface Plan {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: 'BRL'
  interval: 'monthly'
  status: 'active' | 'inactive'
  features: string[]
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
  | 'endurance'
  | 'health'
  | 'strength'

export type Sex = 'male' | 'female' | 'other'

export type TrainingLocation = 'gym' | 'home' | 'outdoor'

export type DietPreference = 'everything' | 'vegetarian' | 'vegan' | 'paleo' | 'low_carb'

export type UserRole = 'admin' | 'member' | 'affiliate'

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  role: UserRole
  createdAt: string
  onboardingCompleted?: boolean
  onboardingComplete?: boolean
  subscriptionStatus?: SubscriptionStatus
  subscriptionPlan?: SubscriptionPlan
  subscriptionRenewAt?: string
  affiliateId?: string
  referralCode?: string
}

export interface UserProfile {
  uid: string
  sex: Sex
  age: number
  height: number
  weight: number
  birthDate: string
  city?: string
  experienceLevel: ExperienceLevel
  goal: UserGoal
  trainingFrequency: number // days per week
  trainingLocation: TrainingLocation
  equipmentAvailable: string[]
  dietPreference: DietPreference
  mainDifficulty: string
  selectedWorkoutId?: string
  selectedDietId?: string
  waterGoalMl: number
  waterProgressMl: number
  notificationsEnabled: Record<string, boolean>
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
  equipment: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "kettlebell" | "elastic" | "cardio_machine" | "none" | "other"
  level: "beginner" | "intermediate" | "advanced"
  instructions?: string
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
  notes?: string
  videoUrl?: string
  instructions?: string
  substitutionOptions?: WorkoutExerciseSubstitution[]
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
  startedAt: string
  completedAt?: string
  logs: SetLog[]
  status: 'in_progress' | 'active' | 'paused' | 'inactive' | 'completed' | 'cancelled' | 'abandoned'
  xpEarned: number
  durationSeconds?: number
  lastInteractionAt?: string
  inactiveWarningShownAt?: string
  finishedAt?: string
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
  createdAt: string
  updatedAt: string
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
  createdAt: string
  updatedAt: string
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

// Phase 6 â€” Diet Day Tracking
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
  createdAt: string
  updatedAt: string
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
