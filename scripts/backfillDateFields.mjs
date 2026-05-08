import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

const rawArgs = process.argv.slice(2)
const args = new Set(rawArgs)
const apply = args.has('--apply')
const dryRun = !apply || args.has('--dry-run')
const staging = args.has('--staging')
const confirmApply = args.has('--confirm-apply') || process.env.EXPERT_CLUB_CONFIRM_DATE_BACKFILL === 'true'
const confirmQaProject = args.has('--confirm-qa-project') || process.env.EXPERT_CLUB_CONFIRM_QA_PROJECT === 'true'
const projectIdArg = rawArgs.find((arg) => arg.startsWith('--project='))
const collectionGroupArg = rawArgs.find((arg) => arg.startsWith('--collection-group='))
const collectionGroupFilter = collectionGroupArg?.split('=')[1]

const projectId =
  projectIdArg?.split('=')[1] ||
  (staging ? process.env.EXPERT_CLUB_STAGING_PROJECT_ID || 'expertclub-staging' : null) ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'expertcoaching-b91e2'

const environment = process.env.EXPERT_CLUB_FIREBASE_ENV || process.env.FIREBASE_ENV || (staging ? 'staging' : 'prelaunch-qa')

if (environment === 'production') {
  console.error('Refusing date backfill while EXPERT_CLUB_FIREBASE_ENV/FIREBASE_ENV is production.')
  process.exit(1)
}

if (apply && !confirmApply) {
  console.error('Refusing to apply date backfill without explicit confirmation.')
  console.error('Use --confirm-apply or set EXPERT_CLUB_CONFIRM_DATE_BACKFILL=true.')
  process.exit(1)
}

if (apply && projectId === 'expertcoaching-b91e2' && !confirmQaProject) {
  console.error('Refusing to write date backfill to expertcoaching-b91e2 without --confirm-qa-project.')
  console.error('This project is allowed only as pre-launch QA while there are no real users.')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId })
}

const db = admin.firestore()

const targets = [
  {
    scope: 'collectionGroup',
    name: 'workoutSessions',
    fields: ['startedAt', 'completedAt', 'finishedAt', 'lastInteractionAt', 'inactiveWarningShownAt', 'createdAt', 'updatedAt'],
  },
  {
    scope: 'collectionGroup',
    name: 'dietDays',
    fields: ['createdAt', 'updatedAt'],
  },
  {
    scope: 'collectionGroup',
    name: 'dailyCheckins',
    fields: ['createdAt', 'updatedAt'],
  },
  {
    scope: 'collectionGroup',
    name: 'bodyCheckins',
    fields: ['createdAt', 'updatedAt'],
  },
  {
    scope: 'collectionGroup',
    name: 'hydrationDays',
    fields: ['createdAt', 'updatedAt'],
  },
  {
    scope: 'collection',
    name: 'users',
    fields: ['createdAt', 'updatedAt', 'lastLoginAt'],
  },
  {
    scope: 'collection',
    name: 'subscriptions',
    fields: ['startedAt', 'currentPeriodStart', 'currentPeriodEnd', 'renewalDate', 'cancelledAt', 'expiresAt', 'createdAt', 'updatedAt'],
  },
  {
    scope: 'collection',
    name: 'billingEvents',
    fields: ['createdAt', 'updatedAt', 'processedAt', 'paidAt'],
  },
]

function isTimestamp(value) {
  return value instanceof admin.firestore.Timestamp
}

function convertToTimestamp(value) {
  if (value == null || value === '') return { status: 'missing' }
  if (isTimestamp(value)) return { status: 'ok' }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { status: 'convert', value: admin.firestore.Timestamp.fromDate(value) }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return { status: 'convert', value: admin.firestore.Timestamp.fromDate(date) }
    }
  }
  return { status: 'invalid' }
}

async function scanTarget(target) {
  const snap = target.scope === 'collectionGroup'
    ? await db.collectionGroup(target.name).get()
    : await db.collection(target.name).get()

  const stats = { scanned: snap.size, wouldUpdate: 0, updated: 0, ok: 0, missing: 0, invalid: 0 }
  let batch = db.batch()
  let batchCount = 0

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const patch = {}
    const changedFields = []

    for (const field of target.fields) {
      const result = convertToTimestamp(data[field])
      if (result.status === 'ok') stats.ok++
      if (result.status === 'missing') stats.missing++
      if (result.status === 'invalid') stats.invalid++
      if (result.status === 'convert') {
        patch[field] = result.value
        changedFields.push(field)
      }
    }

    if (!changedFields.length) continue

    stats.wouldUpdate++
    console.log(`[${dryRun ? 'DRY-RUN' : 'APPLY'}] ${docSnap.ref.path}: ${changedFields.join(', ')}`)

    if (!dryRun) {
      batch.update(docSnap.ref, patch)
      batchCount++
      stats.updated++
      if (batchCount === 450) {
        await batch.commit()
        batch = db.batch()
        batchCount = 0
      }
    }
  }

  if (!dryRun && batchCount > 0) await batch.commit()
  return stats
}

const selectedTargets = collectionGroupFilter
  ? targets.filter((target) => target.scope === 'collectionGroup' && target.name === collectionGroupFilter)
  : targets

if (collectionGroupFilter && selectedTargets.length === 0) {
  console.error(`Unknown collection group target: ${collectionGroupFilter}`)
  process.exit(1)
}

console.log(`Date backfill project=${projectId} environment=${environment} mode=${dryRun ? 'dry-run' : 'apply'}`)

const totals = { scanned: 0, wouldUpdate: 0, updated: 0, ok: 0, missing: 0, invalid: 0 }

for (const target of selectedTargets) {
  const stats = await scanTarget(target)
  Object.keys(totals).forEach((key) => {
    totals[key] += stats[key]
  })
  console.log(`${target.scope}:${target.name}`, stats)
}

console.log('Date backfill summary', totals)
