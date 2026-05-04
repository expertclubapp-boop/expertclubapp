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
    expectedRoute: '/admin',
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

console.log('Role redirect smoke passed.')
