import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const staging = args.has('--staging')
const confirmQaProject = args.has('--confirm-qa-project') || process.env.EXPERT_CLUB_CONFIRM_QA_PROJECT === 'true'
const projectIdArg = process.argv.find((arg) => arg.startsWith('--project='))
const projectId =
  projectIdArg?.split('=')[1] ||
  (staging ? process.env.EXPERT_CLUB_STAGING_PROJECT_ID || 'expertclub-staging' : null) ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID

const environment = process.env.EXPERT_CLUB_FIREBASE_ENV || process.env.FIREBASE_ENV || (staging ? 'staging' : 'unconfirmed')

if (!projectId) {
  console.error('Missing Firebase project. Run with --project=<projectId> or set FIREBASE_PROJECT_ID/GCLOUD_PROJECT.')
  process.exit(1)
}

if (environment === 'production') {
  console.error('Refusing to write smoke setup data while EXPERT_CLUB_FIREBASE_ENV/FIREBASE_ENV is production.')
  process.exit(1)
}

if (projectId === 'expertcoaching-b91e2' && !confirmQaProject) {
  console.error('Refusing to write smoke setup data to expertcoaching-b91e2 without explicit confirmation.')
  console.error('This project is tied to Vercel Production. Use a separate staging project for QA smoke data.')
  process.exit(1)
}

const smokePassword = process.env.SMOKE_TEST_PASSWORD

if (!dryRun && !smokePassword) {
  console.error('Set SMOKE_TEST_PASSWORD before running this setup.')
  console.error('Example: $env:SMOKE_TEST_PASSWORD="Use-a-strong-temp-password"; npm run smoke:setup')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId })
}

const db = admin.firestore()
const auth = admin.auth()

const nowTimestamp = () => admin.firestore.Timestamp.now()
const nextMonthTimestamp = () => admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

const qaUsers = [
  {
    key: 'admin',
    email: 'admin@expertclub.com',
    displayName: 'Admin Expert Club',
    role: 'admin',
    subscriptionStatus: 'active',
  },
  {
    key: 'influencer',
    email: 'influencer@expertclub.com',
    displayName: 'Mari Smoke',
    role: 'affiliate',
    subscriptionStatus: 'pending',
    affiliateId: 'mari_smoke',
    referralCode: 'MARI384',
  },
  {
    key: 'studentActive',
    email: 'aluno.ativo@expertclub.com',
    displayName: 'Aluno Ativo QA',
    role: 'member',
    subscriptionStatus: 'active',
  },
  {
    key: 'studentBlocked',
    email: 'aluno.bloqueado@expertclub.com',
    displayName: 'Aluno Bloqueado QA',
    role: 'member',
    subscriptionStatus: 'past_due',
  },
]

const founderPlan = {
  id: 'founder',
  name: 'Expert Club Fundador',
  slug: 'founder-plan',
  description: 'Acesso fundador ao Expert Club por R$49/mes.',
  price: 49,
  currency: 'BRL',
  interval: 'monthly',
  status: 'active',
  features: [
    'Treinos por objetivo',
    'Dietas por objetivo',
    'Check-ins',
    'Controle de agua',
    'Desafios',
    'Grupo no WhatsApp',
  ],
  isFounderPlan: true,
  trialDays: 0,
}

const smokeWorkout = {
  id: 'iniciante-full-body',
  title: 'Iniciante Full Body 3x',
  objective: 'health',
  level: 'beginner',
  durationMinutes: 45,
  estimatedKcal: 350,
  frequency: 3,
  location: 'gym',
  equipmentRequired: ['Halteres', 'Bancos'],
  tags: ['Iniciante', 'Corpo todo', 'Adaptacao'],
  status: 'published',
  days: [
    {
      id: 'dia-1',
      label: 'Treino A - Full Body',
      exercises: [
        {
          id: 'agachamento-taca',
          name: 'Agachamento Taca',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          muscleGroups: ['Pernas'],
        },
        {
          id: 'supino-halteres',
          name: 'Supino com Halteres',
          sets: 3,
          reps: '10',
          restSeconds: 60,
          muscleGroups: ['Peito'],
        },
      ],
    },
  ],
}

const smokeDiet = {
  id: 'emagrecimento-1600',
  title: 'Emagrecimento Base 1600 kcal',
  objective: 'fat_loss',
  totalKcal: 1600,
  macros: { carbs: 120, protein: 160, fat: 53 },
  level: 'beginner',
  tags: ['Pratica', 'Proteica'],
  status: 'published',
  meals: [
    {
      id: 'cafe-da-manha',
      name: 'Cafe da manha',
      timeLabel: '08:00',
      foods: [
        {
          id: 'ovo',
          name: 'Ovos mexidos',
          amount: '3 unidades',
          kcal: 210,
          macros: { carbs: 1, protein: 18, fat: 15 },
        },
      ],
    },
  ],
}

async function upsertAuthUser(userConfig) {
  try {
    const existing = await auth.getUserByEmail(userConfig.email)
    await auth.updateUser(existing.uid, {
      displayName: userConfig.displayName,
      password: smokePassword,
      disabled: false,
    })
    return existing
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error
    return auth.createUser({
      email: userConfig.email,
      password: smokePassword,
      displayName: userConfig.displayName,
      emailVerified: true,
      disabled: false,
    })
  }
}

function profileFor(uid, displayName) {
  return {
    uid,
    displayName,
    sex: 'other',
    age: 30,
    height: 170,
    weight: 75,
    birthDate: '1996-01-01',
    city: 'Sao Paulo, SP',
    experienceLevel: 'beginner',
    goal: 'fat_loss',
    trainingFrequency: 3,
    trainingLocation: 'gym',
    equipmentAvailable: [],
    dietPreference: 'everything',
    mainDifficulty: 'Constancia',
    selectedWorkoutId: smokeWorkout.id,
    selectedDietId: smokeDiet.id,
    waterGoalMl: 2600,
    waterProgressMl: 0,
    notificationsEnabled: { push: true, email: true },
    onboardingDraft: false,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }
}

function subscriptionFor(uid, status, referralCode = null) {
  return {
    uid,
    planId: founderPlan.id,
    planName: founderPlan.name,
    status,
    provider: 'manual',
    price: founderPlan.price,
    currency: 'BRL',
    interval: 'monthly',
    currentPeriodStart: nowTimestamp(),
    currentPeriodEnd: nextMonthTimestamp(),
    renewalDate: status === 'active' ? nextMonthTimestamp() : null,
    referralCode,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }
}

async function seedCatalog() {
  await db.collection('plans').doc(founderPlan.id).set({
    ...founderPlan,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('workouts').doc(smokeWorkout.id).set({
    ...smokeWorkout,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('diets').doc(smokeDiet.id).set({
    ...smokeDiet,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('content').doc('smoke-intro').set({
    id: 'smoke-intro',
    title: 'Como usar o Expert Club na primeira semana',
    type: 'video',
    category: 'Comece aqui',
    status: 'published',
    isFeatured: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800',
    duration: '08:00',
    author: 'Expert Club',
    publishedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('challenges').doc('smoke-constancia').set({
    id: 'smoke-constancia',
    title: 'Desafio Constancia',
    objective: 'Completar check-ins e manter a rotina por 7 dias.',
    status: 'active',
    type: 'constancy',
    startsAt: nowTimestamp(),
    endsAt: nextMonthTimestamp(),
    points: 700,
    missions: [
      { id: 'm1', title: 'Fazer check-in diario', points: 100, type: 'daily' },
      { id: 'm2', title: 'Registrar agua', points: 100, type: 'daily' },
    ],
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('settings').doc('community').set({
    whatsappGroupUrl: 'https://chat.whatsapp.com/expert-club-smoke',
    supportUrl: 'https://wa.me/5511999999999',
    instagramUrl: 'https://instagram.com/expertclub',
    rules: [
      'Respeite os outros membros.',
      'Compartilhe rotina, duvidas gerais e evolucao.',
      'Nao compartilhe spam.',
    ],
    updatedAt: nowTimestamp(),
  }, { merge: true })
}

async function seedAffiliate(influencerUser, activeStudentUser) {
  const affiliateId = 'mari_smoke'
  const referralCode = 'MARI384'

  await db.collection('affiliateAccounts').doc(affiliateId).set({
    id: affiliateId,
    uid: influencerUser.uid,
    name: 'Mari Smoke',
    email: influencerUser.email,
    instagram: '@mari.smoke',
    status: 'active',
    commissionRate: 0.20,
    payoutMethod: 'pix',
    pixKey: 'mari-smoke@example.com',
    totalCommissionPaid: 0,
    pendingCommission: 9.8,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('referralCodes').doc(referralCode).set({
    code: referralCode,
    affiliateId,
    affiliateName: 'Mari Smoke',
    status: 'active',
    discountType: 'none',
    discountValue: 0,
    commissionRate: 0.20,
    usageCount: 1,
    activeSubscriptionsCount: 1,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('referralAttributions').doc('smoke_attr_mari384').set({
    id: 'smoke_attr_mari384',
    uid: activeStudentUser.uid,
    affiliateId,
    referralCode,
    source: 'affiliate',
    campaign: 'stories',
    status: 'converted',
    firstSeenAt: nowTimestamp(),
    attributedAt: nowTimestamp(),
    subscriptionId: activeStudentUser.uid,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('commissionLedger').doc('smoke_commission_mari384').set({
    id: 'smoke_commission_mari384',
    affiliateId,
    affiliateName: 'Mari Smoke',
    uid: activeStudentUser.uid,
    userEmail: activeStudentUser.email,
    subscriptionId: activeStudentUser.uid,
    billingEventId: 'smoke_billing_event_mari384',
    planId: founderPlan.id,
    planName: founderPlan.name,
    grossAmount: 49,
    commissionRate: 0.20,
    commissionAmount: 9.8,
    currency: 'BRL',
    status: 'approved',
    isDemo: true,
    createdAt: nowTimestamp(),
    approvedAt: nowTimestamp(),
  }, { merge: true })
}

async function seedUsers() {
  const created = {}

  for (const qaUser of qaUsers) {
    const authUser = await upsertAuthUser(qaUser)
    created[qaUser.key] = authUser

    await db.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      displayName: qaUser.displayName,
      email: qaUser.email,
      photoURL: '',
      role: qaUser.role,
      onboardingCompleted: true,
      onboardingComplete: true,
      ...(qaUser.affiliateId ? { affiliateId: qaUser.affiliateId } : {}),
      ...(qaUser.referralCode ? { referralCode: qaUser.referralCode } : {}),
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      lastLoginAt: nowTimestamp(),
    }, { merge: true })

    await db.collection('profiles').doc(authUser.uid).set(
      profileFor(authUser.uid, qaUser.displayName),
      { merge: true }
    )

    const referralCode = qaUser.key === 'studentActive' ? 'MARI384' : null
    await db.collection('subscriptions').doc(authUser.uid).set(
      subscriptionFor(authUser.uid, qaUser.subscriptionStatus, referralCode),
      { merge: true }
    )
  }

  await seedAffiliate(created.influencer, created.studentActive)
  return created
}

async function main() {
  console.log(`Project: ${projectId}`)
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log('Smoke users:')
  for (const user of qaUsers) {
    console.log(`- ${user.key}: ${user.email} (${user.role}, ${user.subscriptionStatus})`)
  }

  if (dryRun) return

  await seedCatalog()
  await seedUsers()
  console.log('Operational smoke setup completed.')
}

main().catch((error) => {
  console.error('Operational smoke setup failed.')
  console.error(error?.message || error)
  process.exit(1)
})
