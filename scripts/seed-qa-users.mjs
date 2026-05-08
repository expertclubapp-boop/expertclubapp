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
  console.error('Refusing to seed QA users while EXPERT_CLUB_FIREBASE_ENV/FIREBASE_ENV is production.')
  process.exit(1)
}

if (projectId === 'expertcoaching-b91e2' && !confirmQaProject) {
  console.error('Refusing to write QA seed data to expertcoaching-b91e2 without explicit confirmation.')
  console.error('This project is tied to Vercel Production. Use a separate staging project for QA seeds.')
  process.exit(1)
}

const qaPassword = process.env.QA_TEST_PASSWORD || 'ExpertClubQA@123'

if (!admin.apps.length) {
  admin.initializeApp({ projectId })
}

const auth = admin.auth()
const db = admin.firestore()

const nowTimestamp = () => admin.firestore.Timestamp.now()
const dateKey = () => new Date().toISOString().slice(0, 10)
const nextMonthTimestamp = () => admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

const qaUsers = [
  {
    key: 'admin',
    email: 'admin@expertclub.test',
    displayName: 'Admin QA',
    role: 'admin',
  },
  {
    key: 'mentor',
    email: 'mentor@expertclub.test',
    displayName: 'Mentor QA',
    role: 'mentor',
  },
  {
    key: 'student',
    email: 'student@expertclub.test',
    displayName: 'Aluno QA',
    role: 'member',
    subscriptionStatus: 'active',
  },
  {
    key: 'student2',
    email: 'student2@expertclub.test',
    displayName: 'Aluno Sem Mentor QA',
    role: 'member',
    subscriptionStatus: 'active',
  },
]

async function upsertAuthUser({ email, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email)
    await auth.updateUser(existing.uid, {
      displayName,
      password: qaPassword,
      emailVerified: true,
      disabled: false,
    })
    return auth.getUser(existing.uid)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error
    return auth.createUser({
      email,
      password: qaPassword,
      displayName,
      emailVerified: true,
      disabled: false,
    })
  }
}

function userDoc(config, uid, mentorUid = null) {
  return {
    uid,
    email: config.email,
    displayName: config.displayName,
    role: config.role,
    status: 'active',
    photoURL: '',
    onboardingCompleted: true,
    onboardingComplete: true,
    subscriptionStatus: config.subscriptionStatus || 'active',
    subscriptionPlan: 'founder',
    ...(mentorUid ? { mentorId: mentorUid } : {}),
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }
}

function profileDoc(config, uid) {
  return {
    uid,
    email: config.email,
    displayName: config.displayName,
    sex: 'other',
    age: 30,
    height: 175,
    weight: 78,
    birthDate: '1996-01-01',
    city: 'Sao Paulo, SP',
    experienceLevel: 'intermediate',
    goal: 'hypertrophy',
    trainingFrequency: 4,
    trainingLocation: 'gym',
    equipmentAvailable: ['halteres', 'banco'],
    dietPreference: 'everything',
    mainDifficulty: 'Consistencia',
    selectedWorkoutId: 'qa-workout',
    selectedDietId: 'qa-diet',
    waterGoalMl: 2600,
    waterProgressMl: 1200,
    notificationsEnabled: { push: true, email: true },
    onboardingDraft: false,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }
}

function subscriptionDoc(uid) {
  return {
    uid,
    planId: 'founder',
    planName: 'Expert Club Fundador',
    status: 'active',
    provider: 'manual',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    startedAt: nowTimestamp(),
    currentPeriodStart: nowTimestamp(),
    currentPeriodEnd: nextMonthTimestamp(),
    renewalDate: nextMonthTimestamp(),
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }
}

async function seedCatalog() {
  await db.collection('plans').doc('founder').set({
    id: 'founder',
    name: 'Expert Club Fundador',
    slug: 'founder-plan',
    description: 'Plano QA para validacao interna.',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    status: 'active',
    features: ['Treinos', 'Dietas', 'Check-ins'],
    isFounderPlan: true,
    trialDays: 0,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('workouts').doc('qa-workout').set({
    id: 'qa-workout',
    title: 'Treino QA Full Body',
    description: 'Treino minimo para validar fluxo real de execucao no QA interno.',
    objective: 'hypertrophy',
    goal: 'hypertrophy',
    modality: 'bodybuilding',
    level: 'intermediate',
    status: 'published',
    durationMinutes: 45,
    estimatedKcal: 350,
    frequency: 4,
    daysPerWeek: 4,
    location: 'gym',
    tags: ['qa'],
    version: 1,
    isCurrentVersion: true,
    days: [
      {
        id: 'qa-day-1',
        name: 'Treino A',
        order: 1,
        focus: 'Full body',
        exercises: [
          {
            id: 'qa-ex-1',
            exerciseId: 'qa-ex-1',
            exerciseName: 'Agachamento QA',
            muscleGroups: ['Pernas'],
            equipment: 'Barra',
            sets: 3,
            reps: '10',
            restSeconds: 60,
            notes: 'Carga confortavel para validar registro de serie.',
          },
        ],
      },
    ],
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })

  await db.collection('diets').doc('qa-diet').set({
    id: 'qa-diet',
    title: 'Dieta QA Base',
    objective: 'hypertrophy',
    totalKcal: 2200,
    macros: { carbs: 220, protein: 170, fat: 70 },
    status: 'published',
    meals: [],
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }, { merge: true })
}

async function seedStudentActivity(uid) {
  const today = dateKey()
  const base = {
    uid,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  }

  await Promise.all([
    db.collection(`users/${uid}/workoutSessions`).doc('qa-session').set({
      ...base,
      id: 'qa-session',
      workoutId: 'qa-workout',
      dayId: 'qa-day-1',
      status: 'active',
      startedAt: nowTimestamp(),
      logs: [],
      xpEarned: 0,
      durationSeconds: 0,
      lastInteractionAt: nowTimestamp(),
    }, { merge: true }),
    db.collection(`users/${uid}/dietDays`).doc(today).set({
      ...base,
      dateKey: today,
      adherencePercent: 92,
      completedItemsCount: 4,
    }, { merge: true }),
    db.collection(`users/${uid}/dailyCheckins`).doc(today).set({
      ...base,
      dateKey: today,
      trained: true,
      followedDiet: true,
      hitWaterGoal: true,
      mood: 4,
      energy: 'Moderada',
      sleep: 7,
      hunger: 5,
      soreness: 2,
      notes: 'Check-in QA seeded.',
    }, { merge: true }),
    db.collection(`users/${uid}/weeklyCheckins`).doc('qa-week').set({
      ...base,
      weekKey: 'qa-week',
      dietAdherenceDays: 5,
      trainingDays: 4,
    }, { merge: true }),
    db.collection(`users/${uid}/bodyCheckins`).doc('qa-body').set({
      ...base,
      date: today,
      weight: 78,
      waist: 86,
    }, { merge: true }),
    db.collection(`users/${uid}/hydrationDays`).doc(today).set({
      ...base,
      dateKey: today,
      currentMl: 1800,
      goalMl: 2600,
    }, { merge: true }),
    db.collection(`users/${uid}/contentProgress`).doc('qa-intro').set({
      ...base,
      contentId: 'qa-intro',
      completed: true,
    }, { merge: true }),
  ])
}

async function seedQaUsers() {
  const created = {}

  for (const config of qaUsers) {
    const authUser = await upsertAuthUser(config)
    created[config.key] = authUser
  }

  for (const config of qaUsers) {
    const authUser = created[config.key]
    const mentorUid = config.key === 'student' ? created.mentor.uid : null

    await auth.setCustomUserClaims(authUser.uid, {
      role: config.role,
      qa: true,
    })

    await db.collection('users').doc(authUser.uid).set(
      userDoc(config, authUser.uid, mentorUid),
      { merge: true },
    )
    await db.collection('profiles').doc(authUser.uid).set(
      profileDoc(config, authUser.uid),
      { merge: true },
    )
    await db.collection('subscriptions').doc(authUser.uid).set(
      subscriptionDoc(authUser.uid),
      { merge: true },
    )
  }

  await Promise.all([
    seedStudentActivity(created.student.uid),
    seedStudentActivity(created.student2.uid),
  ])

  return created
}

async function main() {
  console.log(`Project: ${projectId}`)
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log('QA users:')
  for (const config of qaUsers) {
    console.log(`- ${config.email} (${config.role})`)
  }

  if (dryRun) return

  await seedCatalog()
  const created = await seedQaUsers()

  console.log('\nSeed QA users completed.')
  console.log('Password: use QA_TEST_PASSWORD or default ExpertClubQA@123 in local/staging only.')
  console.table(qaUsers.map((config) => ({
    email: config.email,
    uid: created[config.key].uid,
    roleClaim: config.role,
    roleFirestore: config.role,
    status: 'active',
  })))
}

main().catch((error) => {
  console.error('Seed QA users failed.')
  console.error(error?.message || error)
  process.exit(1)
})
