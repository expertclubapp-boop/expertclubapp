import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getDefaultRouteForUser,
  getSubscriptionStatus,
  isOnboardingCompleted,
} from '../src/router/utils'
import type { Subscription, User, UserProfile } from '../src/types/domain'

function user(overrides: Partial<User>): User {
  return {
    uid: overrides.uid ?? 'uid-smoke',
    displayName: overrides.displayName ?? 'Smoke User',
    email: overrides.email ?? 'smoke@example.com',
    role: overrides.role ?? 'member',
    createdAt: '2026-05-01T00:00:00.000Z',
    onboardingCompleted: overrides.onboardingCompleted ?? true,
    subscriptionStatus: overrides.subscriptionStatus,
    subscriptionPlan: overrides.subscriptionPlan,
    affiliateId: overrides.affiliateId,
    referralCode: overrides.referralCode,
  }
}

function subscription(status: Subscription['status']): Subscription {
  return {
    uid: 'uid-smoke',
    planId: 'founder',
    planName: 'Expert Club Fundador',
    status,
    provider: 'manual',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    startedAt: '2026-05-01T00:00:00.000Z',
    currentPeriodStart: '2026-05-01T00:00:00.000Z',
    currentPeriodEnd: '2026-06-01T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  }
}

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: overrides.uid ?? 'uid-smoke',
    goal: overrides.goal ?? 'hypertrophy',
    trainingFrequency: overrides.trainingFrequency ?? 4,
    trainingLevel: overrides.trainingLevel ?? 'intermediate',
    trainingLocation: overrides.trainingLocation ?? 'gym',
    dietPreference: overrides.dietPreference ?? 'flexible',
    sex: overrides.sex ?? 'male',
    weightKg: overrides.weightKg ?? 80,
    heightCm: overrides.heightCm ?? 175,
    waterGoalMl: overrides.waterGoalMl ?? 2800,
    onboardingCompleted: overrides.onboardingCompleted ?? true,
    selectedWorkoutId: 'selectedWorkoutId' in overrides ? overrides.selectedWorkoutId : 'qa-workout',
    selectedDietId: 'selectedDietId' in overrides ? overrides.selectedDietId : 'qa-diet',
    recommendationsNeedRefresh: overrides.recommendationsNeedRefresh ?? false,
  }
}

const cases = [
  {
    label: 'admin',
    user: user({ role: 'admin', email: 'admin@expertclub.com' }),
    profile: null,
    subscription: null,
    expectedRoute: '/admin/dashboard',
  },
  {
    label: 'affiliate',
    user: user({
      role: 'affiliate',
      email: 'influencer@expertclub.com',
      affiliateId: 'mari_smoke',
      referralCode: 'MARI384',
    }),
    profile: null,
    subscription: subscription('pending'),
    expectedRoute: '/affiliate/dashboard',
  },
  {
    label: 'affiliate with active subscription (still not a student)',
    user: user({
      role: 'affiliate',
      email: 'influencer2@expertclub.com',
      affiliateId: 'ana_smoke',
      referralCode: 'ANA999',
    }),
    profile: null,
    subscription: subscription('active'),
    expectedRoute: '/affiliate/dashboard',
  },
  {
    label: 'mentor',
    user: user({ role: 'mentor', email: 'mentor@expertclub.com.br' }),
    profile: null,
    subscription: null,
    expectedRoute: '/mentor/overview',
  },
  {
    label: 'member active',
    user: user({ role: 'member', email: 'aluno.ativo@expertclub.com' }),
    profile: profile(),
    subscription: subscription('active'),
    expectedRoute: '/app/today',
  },
  {
    label: 'member blocked',
    user: user({ role: 'member', email: 'aluno.bloqueado@expertclub.com' }),
    profile: profile(),
    subscription: subscription('past_due'),
    expectedRoute: '/app/billing/lock',
  },
  {
    label: 'new member active',
    user: user({ role: 'member', email: 'novo@example.com', onboardingCompleted: false }),
    profile: profile({ onboardingCompleted: false, selectedWorkoutId: undefined, selectedDietId: undefined }),
    subscription: subscription('active'),
    expectedRoute: '/onboarding',
  },
  {
    label: 'new member blocked',
    user: user({ role: 'member', email: 'novo.bloqueado@example.com', onboardingCompleted: false }),
    profile: profile({ onboardingCompleted: false, selectedWorkoutId: undefined, selectedDietId: undefined }),
    subscription: subscription('pending'),
    expectedRoute: '/app/billing/lock',
  },
  {
    label: 'member active without selections',
    user: user({ role: 'member', email: 'sem.plano@expertclub.com' }),
    profile: profile({ selectedWorkoutId: undefined, selectedDietId: undefined }),
    subscription: subscription('active'),
    expectedRoute: '/app/recommendations',
  },
  {
    label: 'member active with refresh pending',
    user: user({ role: 'member', email: 'refresh@expertclub.com' }),
    profile: profile({ recommendationsNeedRefresh: true }),
    subscription: subscription('active'),
    expectedRoute: '/app/today',
  },
]

for (const smokeCase of cases) {
  const actualRoute = getDefaultRouteForUser(
    smokeCase.user,
    smokeCase.profile,
    smokeCase.subscription,
  )

  if (actualRoute !== smokeCase.expectedRoute) {
    throw new Error(
      `${smokeCase.label}: expected ${smokeCase.expectedRoute}, got ${actualRoute}`,
    )
  }

  console.log(
    `${smokeCase.label}: route=${actualRoute}; onboarding=${isOnboardingCompleted(
      smokeCase.user,
    )}; subscription=${getSubscriptionStatus(smokeCase.user, smokeCase.subscription)}`,
  )
}

const routerSource = readFileSync(resolve(process.cwd(), 'src/router/AppRouter.tsx'), 'utf8')
const appRouteSource = readFileSync(resolve(process.cwd(), 'src/router/AppRoute.tsx'), 'utf8')
const mentorScreenSource = readFileSync(
  resolve(process.cwd(), 'src/screens/mentor/MentorWorkspaceScreens.tsx'),
  'utf8',
)
const dietDaySource = readFileSync(
  resolve(process.cwd(), 'src/screens/diets/DietDayScreen.tsx'),
  'utf8',
)

const requiredRedirects = [
  "path: '/student/dashboard', element: <Navigate to=\"/app/today\" replace />",
  "path: '/student/workout', element: <Navigate to=\"/app/workouts\" replace />",
  "path: '/student/workout/session', element: <Navigate to=\"/app/workouts\" replace />",
  "path: '/student/diet', element: <Navigate to=\"/app/diets/today\" replace />",
  "path: '/student/profile', element: <Navigate to=\"/app/profile\" replace />",
  "path: '/student/ranking', element: <Navigate to=\"/app/challenges\" replace />",
]

for (const redirectSnippet of requiredRedirects) {
  if (!routerSource.includes(redirectSnippet)) {
    throw new Error(`Missing student alias redirect: ${redirectSnippet}`)
  }
}

if (routerSource.includes('ExpertClubV2Screens')) {
  throw new Error('AppRouter still references ExpertClubV2Screens.')
}

if (mentorScreenSource.includes('ExpertClubV2Screens')) {
  throw new Error('Mentor workspace screens still reference ExpertClubV2Screens.')
}

// P0: AppRoute must block affiliate from /app/*
if (!appRouteSource.includes("role === 'affiliate'")) {
  throw new Error('AppRoute does not contain affiliate gate check.')
}
if (!appRouteSource.includes('/affiliate/dashboard')) {
  throw new Error('AppRoute does not redirect affiliate to /affiliate/dashboard.')
}

// P0: DietDayScreen must not contain mock substitution options
if (dietDaySource.includes('Opção A') || dietDaySource.includes('Opção B')) {
  throw new Error('DietDayScreen still contains mock substitution options (Opção A/B).')
}
// Check specifically for the dangerous substitution payload cast pattern
if (dietDaySource.includes('} as any)') || dietDaySource.includes('substituteFood(')) {
  throw new Error('DietDayScreen still contains unsafe substitution payload cast or active substituteFood call.')
}

console.log('Role redirect smoke passed.')
console.log('P0 flow integrity guards passed.')
