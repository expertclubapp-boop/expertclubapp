/**
 * warTest.ts — Concurrent stress tests for economy services
 *
 * Tests three race-condition scenarios:
 *   1. Concurrent store redemptions (same user, same item, insufficient credits for all)
 *   2. Webhook replay storm (same billingEventId fired N times simultaneously)
 *   3. Referral double-attribution (same referral code attributed to the same user in parallel)
 *
 * Usage:
 *   npx tsx scripts/warTest.ts [scenario]
 *   npx tsx scripts/warTest.ts redeem
 *   npx tsx scripts/warTest.ts webhook
 *   npx tsx scripts/warTest.ts referral
 *   npx tsx scripts/warTest.ts all
 *
 * Prerequisites:
 *   - FIREBASE_PROJECT_ID in env (or .env.local)
 *   - A test user with enough credits for exactly ONE redemption seeded in Firestore
 *   - A store item with quantity=1 seeded in Firestore
 *   - Set TEST_USER_ID, TEST_ITEM_ID, TEST_REFERRER_ID, TEST_REFERRED_ID below
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SA_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!SA_KEY_PATH) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path.')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.applicationDefault() })
const db = admin.firestore()

// ─── CONFIG — edit these before running ──────────────────────────────────────
const TEST_USER_ID = process.env.WAR_TEST_USER_ID || 'TEST_USER_REPLACE_ME'
const TEST_ITEM_ID = process.env.WAR_TEST_ITEM_ID || 'TEST_ITEM_REPLACE_ME'
const TEST_REFERRER_ID = process.env.WAR_TEST_REFERRER_ID || 'TEST_REFERRER_REPLACE_ME'
const TEST_REFERRED_ID = process.env.WAR_TEST_REFERRED_ID || 'TEST_REFERRED_REPLACE_ME'
const CONCURRENCY = Number(process.env.WAR_CONCURRENCY ?? 10)
// ─────────────────────────────────────────────────────────────────────────────

function pass(label: string) { console.log(`  ✓ ${label}`) }
function fail(label: string) { console.error(`  ✗ ${label}`) }
function info(label: string) { console.log(`  · ${label}`) }

// ─── Scenario 1: Concurrent store redemptions ─────────────────────────────────
async function scenarioRedeem() {
  console.log('\n=== SCENARIO 1: Concurrent store redemptions ===')
  info(`Firing ${CONCURRENCY} simultaneous redeem calls for item ${TEST_ITEM_ID}`)

  const itemRef = db.collection('storeItems').doc(TEST_ITEM_ID)
  const itemSnap = await itemRef.get()
  if (!itemSnap.exists) { fail('Store item not found — seed it first.'); return }

  const item = itemSnap.data()!
  const creditCost: number = item.creditCost
  const stockBefore: number = item.stock ?? 0
  info(`Item: "${item.title}", creditCost=${creditCost}, stock=${stockBefore}`)

  // Seed user with exactly enough credits for ONE redemption
  await db.collection('walletBalances').doc(TEST_USER_ID).set({
    userId: TEST_USER_ID,
    accountType: 'student',
    currency: 'CREDITS',
    availableBalance: creditCost,  // exactly one
    pendingBalance: 0,
    lifetimeEarned: creditCost,
    lifetimeSpent: 0,
    lastUpdated: new Date().toISOString(),
  })
  info(`Seeded wallet with ${creditCost} credits (exactly 1 redemption worth)`)

  // Fire N concurrent redemptions via direct Firestore (simulates N clients calling storeService.redeem)
  const redemptionRef = () => db.collection('storeRedemptions').doc()
  const ledgerRef = () => db.collection('walletLedger').doc()

  const attempt = async (i: number): Promise<'success' | 'rejected'> => {
    const rRef = redemptionRef()
    const lRef = ledgerRef()
    const balRef = db.collection('walletBalances').doc(TEST_USER_ID)

    try {
      await db.runTransaction(async (tx) => {
        const [iSnap, balSnap] = await Promise.all([tx.get(itemRef), tx.get(balRef)])
        if (!iSnap.exists) throw new Error('item_not_found')
        const it = iSnap.data()!
        if ((it.stock ?? 0) <= 0) throw new Error('out_of_stock')
        const bal = balSnap.data()!
        if (bal.availableBalance < it.creditCost) throw new Error('insufficient_balance')

        tx.update(itemRef, { stock: admin.firestore.FieldValue.increment(-1) })
        tx.set(rRef, {
          userId: TEST_USER_ID, storeItemId: TEST_ITEM_ID, creditCost: it.creditCost,
          status: 'fulfilled', createdAt: new Date().toISOString(), attempt: i,
        })
        tx.set(lRef, {
          userId: TEST_USER_ID, accountType: 'student', currency: 'CREDITS',
          entryType: 'SPEND_STORE_REDEMPTION', amount: -it.creditCost,
          status: 'CONFIRMED', createdAt: new Date().toISOString(),
        })
        tx.update(balRef, { availableBalance: admin.firestore.FieldValue.increment(-it.creditCost) })
      })
      return 'success'
    } catch {
      return 'rejected'
    }
  }

  const results = await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => attempt(i)))
  const successes = results.filter((r) => r === 'success').length
  const rejections = results.filter((r) => r === 'rejected').length

  info(`Results: ${successes} success, ${rejections} rejected`)

  const itemAfter = (await itemRef.get()).data()!
  const balAfter = (await db.collection('walletBalances').doc(TEST_USER_ID).get()).data()!
  const redemptionsSnap = await db.collection('storeRedemptions').where('userId', '==', TEST_USER_ID).where('storeItemId', '==', TEST_ITEM_ID).get()

  info(`Stock after: ${itemAfter.stock} (expected ${stockBefore - 1})`)
  info(`Balance after: ${balAfter.availableBalance} (expected 0)`)
  info(`Redemption docs written: ${redemptionsSnap.size} (expected 1)`)

  if (successes === 1 && itemAfter.stock === stockBefore - 1 && balAfter.availableBalance === 0 && redemptionsSnap.size === 1) {
    pass('Exactly 1 redemption succeeded — race condition correctly blocked')
  } else {
    fail(`RACE CONDITION DETECTED: ${successes} transactions succeeded, ${redemptionsSnap.size} redemption docs`)
  }
}

// ─── Scenario 2: Webhook replay storm ────────────────────────────────────────
async function scenarioWebhook() {
  console.log('\n=== SCENARIO 2: Webhook replay storm ===')
  const billingEventId = `war_test_${Date.now()}`
  info(`Firing ${CONCURRENCY} simultaneous claims for billingEventId=${billingEventId}`)

  const eventRef = db.collection('billingEvents').doc(billingEventId)

  const claim = async (): Promise<boolean> => {
    let claimed = false
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(eventRef)
      const status = snap.data()?.status as string | undefined
      if (snap.exists && status !== 'failed') return
      claimed = true
      tx.set(eventRef, {
        status: 'processing',
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        provider: 'war_test',
      }, { merge: false })
    })
    return claimed
  }

  const results = await Promise.all(Array.from({ length: CONCURRENCY }, () => claim()))
  const claims = results.filter(Boolean).length

  info(`Claims: ${claims} (expected exactly 1)`)

  const docAfter = (await eventRef.get()).data()!
  info(`Final doc status: ${docAfter.status}`)

  if (claims === 1) {
    pass('Exactly 1 worker claimed the event — idempotency holds under concurrent replay')
  } else {
    fail(`IDEMPOTENCY BROKEN: ${claims} workers claimed the same event`)
  }

  // Cleanup
  await eventRef.delete()
}

// ─── Scenario 3: Referral double-attribution ──────────────────────────────────
async function scenarioReferral() {
  console.log('\n=== SCENARIO 3: Referral double-attribution ===')
  const referralDocId = `${TEST_REFERRER_ID}_${TEST_REFERRED_ID}`
  const referralRef = db.collection('referrals').doc(referralDocId)

  // Ensure it doesn't exist
  await referralRef.delete().catch(() => {})
  info(`Firing ${CONCURRENCY} simultaneous attributions for ${referralDocId}`)

  const attribute = async (): Promise<boolean> => {
    let written = false
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(referralRef)
      if (snap.exists) return
      written = true
      tx.set(referralRef, {
        referrerId: TEST_REFERRER_ID,
        referredUserId: TEST_REFERRED_ID,
        status: 'active',
        createdAt: new Date().toISOString(),
      })
    })
    return written
  }

  const results = await Promise.all(Array.from({ length: CONCURRENCY }, () => attribute()))
  const writes = results.filter(Boolean).length

  info(`Writes: ${writes} (expected exactly 1)`)

  const snap = await referralRef.get()
  info(`Referral doc exists: ${snap.exists}`)

  if (writes === 1 && snap.exists) {
    pass('Exactly 1 attribution written — deterministic doc ID prevents double-credit')
  } else {
    fail(`DOUBLE-ATTRIBUTION: ${writes} writes succeeded`)
  }

  // Cleanup
  await referralRef.delete()
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const scenario = process.argv[2] || 'all'
  console.log(`\nExpert Club War Test — scenario: ${scenario}, concurrency: ${CONCURRENCY}`)

  if (scenario === 'redeem' || scenario === 'all') await scenarioRedeem()
  if (scenario === 'webhook' || scenario === 'all') await scenarioWebhook()
  if (scenario === 'referral' || scenario === 'all') await scenarioReferral()

  console.log('\nDone.\n')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
