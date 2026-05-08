import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getDefaultRouteForUser,
  getSubscriptionStatus,
  isOnboardingCompleted,
} from '../src/router/utils'
import type { Subscription, User } from '../src/types/domain'

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

const cases = [
  {
    label: 'admin',
    user: user({ role: 'admin', email: 'admin@expertclub.com' }),
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
    subscription: subscription('pending'),
    expectedRoute: '/affiliate/dashboard',
  },
  {
    label: 'mentor',
    user: user({ role: 'mentor', email: 'mentor@expertclub.com.br' }),
    subscription: null,
    expectedRoute: '/mentor/overview',
  },
  {
    label: 'member active',
    user: user({ role: 'member', email: 'aluno.ativo@expertclub.com' }),
    subscription: subscription('active'),
    expectedRoute: '/app/today',
  },
  {
    label: 'member blocked',
    user: user({ role: 'member', email: 'aluno.bloqueado@expertclub.com' }),
    subscription: subscription('past_due'),
    expectedRoute: '/app/billing/lock',
  },
  {
    label: 'new member',
    user: user({ role: 'member', email: 'novo@example.com', onboardingCompleted: false }),
    subscription: subscription('pending'),
    expectedRoute: '/onboarding/goal',
  },
]

for (const smokeCase of cases) {
  const actualRoute = getDefaultRouteForUser(
    smokeCase.user,
    null,
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
const mentorScreenSource = readFileSync(
  resolve(process.cwd(), 'src/screens/mentor/MentorWorkspaceScreens.tsx'),
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

console.log('Role redirect smoke passed.')
