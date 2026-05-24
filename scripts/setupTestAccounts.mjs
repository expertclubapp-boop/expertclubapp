import 'dotenv/config'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'expertcoaching-b91e2' })
const db = admin.firestore()
const now = () => admin.firestore.Timestamp.now()
const nextMonth = () => admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

const ACCOUNTS = [
  {
    uid: 'i1S5rR5CZOfrryvnrf5lBaZJyt52',
    email: 'expertclubapp@gmail.com',
    displayName: 'Expert Club Admin',
    role: 'admin',
  },
  {
    uid: 'r24Rlr83kggubuyGl4eQnYbNack2',
    email: 'coachrubenjunior@gmail.com',
    displayName: 'Coach Ruben Junior',
    role: 'mentor',
  },
  {
    uid: 'nZGxBX9ng9bfFQpBLEbJqz64kCU2',
    email: 'rubensoaresnutri@gmail.com',
    displayName: 'Ruben Soares',
    role: 'member',
    subscription: { planId: 'mentoring_quarterly', planName: 'Mentoria Expert 1:1', planTier: 'mentoring_quarterly' },
  },
  {
    uid: 'ulaXtFhmHxX6Ded60SUposm9q9b2',
    email: 'rubenalcateia@gmail.com',
    displayName: 'Ruben Alcateia',
    role: 'member',
    subscription: { planId: 'founder', planName: 'Expert Club Fundador', planTier: 'low_ticket' },
  },
]

async function run() {
  for (const acct of ACCOUNTS) {
    console.log(`\n→ ${acct.email} (${acct.role})`)

    // Upsert users doc
    const userRef = db.collection('users').doc(acct.uid)
    const userSnap = await userRef.get()
    if (userSnap.exists) {
      await userRef.update({ role: acct.role, updatedAt: now() })
      console.log(`  users: role → ${acct.role}`)
    } else {
      await userRef.set({
        uid: acct.uid,
        email: acct.email,
        displayName: acct.displayName,
        role: acct.role,
        onboardingCompleted: acct.role !== 'member',
        onboardingComplete: acct.role !== 'member',
        createdAt: now(),
        updatedAt: now(),
        lastLoginAt: now(),
      })
      console.log(`  users: created with role ${acct.role}`)
    }

    // Upsert profiles doc
    const profileRef = db.collection('profiles').doc(acct.uid)
    const profileSnap = await profileRef.get()
    const profileUpdates = { updatedAt: now() }
    if (acct.role === 'mentor') {
      profileUpdates.mentorOnboardingCompleted = true
    }
    if (profileSnap.exists) {
      await profileRef.update(profileUpdates)
    } else {
      await profileRef.set({
        uid: acct.uid,
        email: acct.email,
        displayName: acct.displayName,
        onboardingDraft: acct.role === 'member',
        createdAt: now(),
        ...profileUpdates,
      })
    }
    console.log(`  profiles: updated`)

    // Activate subscription for aluno accounts
    if (acct.subscription) {
      const subRef = db.collection('subscriptions').doc(acct.uid)
      const t = now()
      await subRef.set({
        uid: acct.uid,
        planId: acct.subscription.planId,
        planName: acct.subscription.planName,
        planTier: acct.subscription.planTier,
        status: 'trialing',
        provider: 'manual',
        price: acct.subscription.planTier === 'low_ticket' ? 49 : 497,
        currency: 'BRL',
        interval: 'monthly',
        startedAt: t,
        currentPeriodStart: t,
        currentPeriodEnd: nextMonth(),
        createdAt: t,
        updatedAt: t,
      }, { merge: true })
      console.log(`  subscriptions: status → trialing (${acct.subscription.planName})`)
    }
  }

  console.log('\n✅ All accounts configured.')
  process.exit(0)
}

run().catch(err => { console.error('FAILED:', err); process.exit(1) })
