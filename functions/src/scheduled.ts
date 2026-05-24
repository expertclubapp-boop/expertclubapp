import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

// Collection names — must stay in sync with src/lib/firebase/paths.ts
const COL = {
  REFERRALS: 'referrals',
  WALLET_LEDGER: 'walletLedger',
  WALLET_BALANCES: 'walletBalances',
  INFLUENCER_PAYOUTS: 'influencerPayouts',
  FRAUD_SIGNALS: 'fraudSignals',
  RECONCILIATION_REPORTS: 'reconciliationReports',
  DEAD_LETTER_QUEUE: 'deadLetterQueue',
  SYSTEM_CONFIG: 'systemConfig',
}

/**
 * dailyEconomyReconcile — runs every day at 6am Brasília time.
 *
 * Jobs:
 * 1. Release matured referral holds (holdUntil <= now, status === 'active')
 * 2. Flag walletBalance discrepancies vs actual ledger sum
 * 3. Alert on high-value pending payouts (> R$2000 pending for >48h)
 * 4. Log a reconciliation report
 */
export const dailyEconomyReconcile = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 6 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const now = new Date()
    const report: Record<string, unknown> = {
      runAt: now.toISOString(),
      holdsReleased: 0,
      balanceDiscrepancies: [] as string[],
      stalePayouts: [] as string[],
      errors: [] as string[],
    }

    // ── 1. Release matured holds ──────────────────────────────────────────────
    try {
      const matureQ = await db
        .collection(COL.REFERRALS)
        .where('status', '==', 'active')
        .where('holdUntil', '<=', now.toISOString())
        .get()

      let released = 0
      for (const snap of matureQ.docs) {
        const referral = snap.data()
        if (!referral.ledgerEntryId) continue
        try {
          await releaseHold(referral.ledgerEntryId)
          await snap.ref.update({ updatedAt: now.toISOString() })
          released++
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          ;(report.errors as string[]).push(`hold_release:${snap.id}:${msg}`)
          await enqueueDeadLetter('hold_release', { referralId: snap.id, ledgerEntryId: referral.ledgerEntryId }, msg)
        }
      }
      report.holdsReleased = released
    } catch (e: unknown) {
      ;(report.errors as string[]).push(`hold_release_query:${e instanceof Error ? e.message : String(e)}`)
    }

    // ── 2. Spot-check walletBalance vs ledger sum (sample 50 users) ──────────
    try {
      const balanceDocs = await db.collection(COL.WALLET_BALANCES).limit(50).get()
      for (const balSnap of balanceDocs.docs) {
        const bal = balSnap.data()
        const ledgerQ = await db
          .collection(COL.WALLET_LEDGER)
          .where('userId', '==', balSnap.id)
          .where('status', '==', 'CONFIRMED')
          .get()

        const ledgerSum = ledgerQ.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)
        const reported = bal.availableBalance ?? 0

        // Allow 1 unit tolerance for floating-point
        if (Math.abs(ledgerSum - reported) > 1) {
          ;(report.balanceDiscrepancies as string[]).push(
            `uid:${balSnap.id} balance:${reported} ledger:${ledgerSum.toFixed(4)}`
          )
          await db.collection(COL.FRAUD_SIGNALS).add({
            flagType: 'BALANCE_DISCREPANCY',
            userId: balSnap.id,
            context: { reported, ledgerSum },
            riskScore: 60,
            status: 'pending',
            createdAt: now.toISOString(),
          })
        }
      }
    } catch (e: unknown) {
      ;(report.errors as string[]).push(`balance_check:${e instanceof Error ? e.message : String(e)}`)
    }

    // ── 3. Flag stale pending payouts (pending_review > 48h) ─────────────────
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const staleQ = await db
        .collection(COL.INFLUENCER_PAYOUTS)
        .where('status', '==', 'pending_review')
        .where('createdAt', '<=', fortyEightHoursAgo)
        .get()

      staleQ.docs.forEach((d) => {
        ;(report.stalePayouts as string[]).push(`${d.id} amount:${d.data().amount}`)
      })
    } catch (e: unknown) {
      ;(report.errors as string[]).push(`stale_payouts:${e instanceof Error ? e.message : String(e)}`)
    }

    // ── 4. Write reconciliation report ────────────────────────────────────────
    await db.collection(COL.RECONCILIATION_REPORTS).add(report)

    if ((report.errors as string[]).length > 0) {
      console.error('dailyEconomyReconcile completed with errors', report)
    } else {
      console.log('dailyEconomyReconcile OK', report)
    }
  })

// ── Helpers ───────────────────────────────────────────────────────────────────

async function releaseHold(entryId: string): Promise<void> {
  const entryRef = db.collection(COL.WALLET_LEDGER).doc(entryId)

  await db.runTransaction(async (tx) => {
    const entrySnap = await tx.get(entryRef)
    if (!entrySnap.exists) throw new Error(`Ledger entry ${entryId} not found`)

    const entry = entrySnap.data()!
    if (entry.status !== 'PENDING') return // already released or reversed

    const balRef = db.collection(COL.WALLET_BALANCES).doc(entry.userId)
    const balSnap = await tx.get(balRef)
    if (!balSnap.exists) throw new Error(`WalletBalance not found for ${entry.userId}`)

    tx.update(entryRef, { status: 'CONFIRMED' })

    // Append RELEASE_HOLD audit entry
    const releaseRef = db.collection(COL.WALLET_LEDGER).doc()
    tx.set(releaseRef, {
      userId: entry.userId,
      accountType: entry.accountType,
      currency: entry.currency,
      entryType: 'RELEASE_HOLD',
      amount: 0,
      status: 'CONFIRMED',
      relatedEntryId: entryId,
      description: `Hold liberado automaticamente: ${entry.description}`,
      createdAt: new Date().toISOString(),
      createdBy: 'reconcile_job',
    })

    tx.update(balRef, {
      availableBalance: admin.firestore.FieldValue.increment(entry.amount),
      pendingBalance: admin.firestore.FieldValue.increment(-entry.amount),
      lifetimeEarned: admin.firestore.FieldValue.increment(entry.amount),
      lastUpdated: new Date().toISOString(),
    })
  })
}

async function enqueueDeadLetter(operation: string, context: unknown, error: string): Promise<void> {
  await db.collection(COL.DEAD_LETTER_QUEUE).add({
    operation,
    context,
    error,
    status: 'pending',
    attempts: 1,
    createdAt: new Date().toISOString(),
    nextRetryAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // retry after 1h
  })
}
