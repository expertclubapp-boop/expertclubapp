/**
 * walletService — Append-only ledger for internal credits (students) and BRL commissions (influencers).
 *
 * RULES:
 * - NEVER update a ledger entry. Append new entries only.
 * - Balance is the sum of all CONFIRMED entries for a user.
 * - PENDING entries are counted separately (pendingBalance).
 * - Use walletBalances collection as a materialized view, updated after each write.
 * - All debit operations check available balance BEFORE writing.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type {
  AffiliateAccountType,
  WalletBalance,
  WalletCurrency,
  WalletEntryStatus,
  WalletEntryType,
  WalletLedgerEntry,
} from '../types/domain'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function balanceDocRef(userId: string) {
  return doc(db, COLLECTIONS.WALLET_BALANCES, userId)
}

function ledgerCol() {
  return collection(db, COLLECTIONS.WALLET_LEDGER)
}

async function getBalance(userId: string): Promise<WalletBalance | null> {
  const snap = await getDoc(balanceDocRef(userId))
  return snap.exists() ? (snap.data() as WalletBalance) : null
}

async function ensureBalance(
  userId: string,
  accountType: AffiliateAccountType,
  currency: WalletCurrency
): Promise<WalletBalance> {
  const existing = await getBalance(userId)
  if (existing) return existing
  const initial: WalletBalance = {
    userId,
    accountType,
    currency,
    availableBalance: 0,
    pendingBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    lastUpdated: new Date().toISOString(),
  }
  await setDoc(balanceDocRef(userId), initial)
  return initial
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const walletService = {
  // ── Read ──────────────────────────────────────────────────────────────────

  async getBalance(userId: string): Promise<WalletBalance | null> {
    return getBalance(userId)
  },

  async getLedger(userId: string, maxEntries = 50): Promise<WalletLedgerEntry[]> {
    const q = query(
      ledgerCol(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxEntries)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
  },

  async getLedgerByStatus(userId: string, status: WalletEntryStatus): Promise<WalletLedgerEntry[]> {
    const q = query(
      ledgerCol(),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletLedgerEntry))
  },

  // ── Write — Credit (PENDING until hold expires) ───────────────────────────

  async creditPending(params: {
    userId: string
    accountType: AffiliateAccountType
    currency: WalletCurrency
    entryType: WalletEntryType
    amount: number
    holdUntil: Date
    description: string
    correlationId?: string
    referralId?: string
    subscriptionId?: string
    paymentId?: string
    createdBy?: string
    metadata?: Record<string, unknown>
  }): Promise<string> {
    const { userId, accountType, currency, entryType, amount, holdUntil, description } = params
    if (amount <= 0) throw new Error('Credit amount must be positive')

    await ensureBalance(userId, accountType, currency)

    const entry: Omit<WalletLedgerEntry, 'id'> = {
      userId,
      accountType,
      currency,
      entryType,
      amount,
      status: 'PENDING',
      holdUntil: holdUntil.toISOString(),
      description,
      correlationId: params.correlationId,
      referralId: params.referralId,
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy ?? 'system',
    }

    const ref = await addDoc(ledgerCol(), entry)

    // Update materialized balance — pending only
    await updateDoc(balanceDocRef(userId), {
      pendingBalance: increment(amount),
      lastUpdated: new Date().toISOString(),
    })

    return ref.id
  },

  // ── Write — Release hold (PENDING → CONFIRMED) ────────────────────────────

  async releaseHold(entryId: string, releasedBy = 'system'): Promise<void> {
    await runTransaction(db, async (tx) => {
      const entryRef = doc(db, COLLECTIONS.WALLET_LEDGER, entryId)
      const entrySnap = await tx.get(entryRef)
      if (!entrySnap.exists()) throw new Error(`Ledger entry ${entryId} not found`)

      const entry = entrySnap.data() as WalletLedgerEntry
      if (entry.status !== 'PENDING') {
        throw new Error(`Entry ${entryId} is not PENDING (status: ${entry.status})`)
      }

      // Mark original entry as CONFIRMED
      tx.update(entryRef, { status: 'CONFIRMED' })

      // Append a RELEASE_HOLD entry for auditability
      const releaseRef = doc(ledgerCol())
      tx.set(releaseRef, {
        userId: entry.userId,
        accountType: entry.accountType,
        currency: entry.currency,
        entryType: 'RELEASE_HOLD' as WalletEntryType,
        amount: 0, // no monetary value; it's a state change record
        status: 'CONFIRMED' as WalletEntryStatus,
        relatedEntryId: entryId,
        description: `Hold liberado: ${entry.description}`,
        createdAt: new Date().toISOString(),
        createdBy: releasedBy,
      })

      // Update balance: move from pending → available
      tx.update(balanceDocRef(entry.userId), {
        availableBalance: increment(entry.amount),
        pendingBalance: increment(-entry.amount),
        lifetimeEarned: increment(entry.amount),
        lastUpdated: new Date().toISOString(),
      })
    })
  },

  // ── Write — Direct credit (CONFIRMED immediately, no hold) ────────────────

  async creditDirect(params: {
    userId: string
    accountType: AffiliateAccountType
    currency: WalletCurrency
    entryType: WalletEntryType
    amount: number
    description: string
    correlationId?: string
    referralId?: string
    payoutId?: string
    createdBy?: string
    metadata?: Record<string, unknown>
  }): Promise<string> {
    const { userId, accountType, currency, entryType, amount, description } = params
    if (amount <= 0) throw new Error('Credit amount must be positive')

    await ensureBalance(userId, accountType, currency)

    const entry: Omit<WalletLedgerEntry, 'id'> = {
      userId,
      accountType,
      currency,
      entryType,
      amount,
      status: 'CONFIRMED',
      description,
      correlationId: params.correlationId,
      referralId: params.referralId,
      payoutId: params.payoutId,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy ?? 'system',
    }

    const ref = await addDoc(ledgerCol(), entry)

    await updateDoc(balanceDocRef(userId), {
      availableBalance: increment(amount),
      lifetimeEarned: increment(amount),
      lastUpdated: new Date().toISOString(),
    })

    return ref.id
  },

  // ── Write — Debit (checks available balance first) ────────────────────────

  async debit(params: {
    userId: string
    accountType: AffiliateAccountType
    currency: WalletCurrency
    entryType: WalletEntryType
    amount: number
    description: string
    correlationId?: string
    storeRedemptionId?: string
    payoutId?: string
    createdBy?: string
    metadata?: Record<string, unknown>
  }): Promise<string> {
    const { userId, accountType, currency, entryType, amount, description } = params
    if (amount <= 0) throw new Error('Debit amount must be positive')

    let entryId = ''

    await runTransaction(db, async (tx) => {
      const balSnap = await tx.get(balanceDocRef(userId))
      if (!balSnap.exists()) throw new Error('Wallet not found')

      const bal = balSnap.data() as WalletBalance
      if (bal.availableBalance < amount) {
        throw new Error(`Insufficient balance: ${bal.availableBalance} < ${amount}`)
      }

      const entryRef = doc(ledgerCol())
      entryId = entryRef.id

      tx.set(entryRef, {
        userId,
        accountType,
        currency,
        entryType,
        amount: -amount, // negative = debit
        status: 'CONFIRMED' as WalletEntryStatus,
        description,
        correlationId: params.correlationId,
        storeRedemptionId: params.storeRedemptionId,
        payoutId: params.payoutId,
        metadata: params.metadata,
        createdAt: new Date().toISOString(),
        createdBy: params.createdBy ?? 'system',
      })

      tx.update(balanceDocRef(userId), {
        availableBalance: increment(-amount),
        lifetimeSpent: increment(amount),
        lastUpdated: new Date().toISOString(),
      })
    })

    return entryId
  },

  // ── Write — Reverse a ledger entry (chargeback / cancel) ──────────────────

  async reverse(params: {
    originalEntryId: string
    reason: string
    reversedBy?: string
  }): Promise<void> {
    await runTransaction(db, async (tx) => {
      const origRef = doc(db, COLLECTIONS.WALLET_LEDGER, params.originalEntryId)
      const origSnap = await tx.get(origRef)
      if (!origSnap.exists()) throw new Error('Original entry not found')

      const orig = origSnap.data() as WalletLedgerEntry
      if (orig.status === 'REVERSED') return // idempotent

      // Mark original as reversed
      tx.update(origRef, {
        status: 'REVERSED' as WalletEntryStatus,
        reversedAt: new Date().toISOString(),
        reversedBy: params.reversedBy ?? 'system',
      })

      // Write reversal entry (opposite sign)
      const reversalRef = doc(ledgerCol())
      tx.set(reversalRef, {
        userId: orig.userId,
        accountType: orig.accountType,
        currency: orig.currency,
        entryType: orig.amount > 0 ? 'REVERSE_REFERRAL' : 'REVERSE_STORE',
        amount: -orig.amount,
        status: 'CONFIRMED' as WalletEntryStatus,
        relatedEntryId: params.originalEntryId,
        description: `Estorno: ${params.reason}`,
        createdAt: new Date().toISOString(),
        createdBy: params.reversedBy ?? 'system',
      })

      // Update balance
      const balUpdate: Record<string, unknown> = {
        lastUpdated: new Date().toISOString(),
      }

      if (orig.status === 'PENDING') {
        // Was pending: remove from pending
        balUpdate.pendingBalance = increment(-orig.amount)
      } else if (orig.status === 'CONFIRMED' && orig.amount > 0) {
        // Was confirmed credit: remove from available
        balUpdate.availableBalance = increment(-orig.amount)
        balUpdate.lifetimeEarned = increment(-orig.amount)
      }

      tx.update(balanceDocRef(orig.userId), balUpdate)
    })
  },

  // ── Write — Expire old credits ─────────────────────────────────────────────

  async expireEntry(entryId: string): Promise<void> {
    await runTransaction(db, async (tx) => {
      const entryRef = doc(db, COLLECTIONS.WALLET_LEDGER, entryId)
      const entrySnap = await tx.get(entryRef)
      if (!entrySnap.exists()) return

      const entry = entrySnap.data() as WalletLedgerEntry
      if (entry.status !== 'CONFIRMED' || entry.amount <= 0) return

      tx.update(entryRef, { status: 'EXPIRED' as WalletEntryStatus })

      tx.update(balanceDocRef(entry.userId), {
        availableBalance: increment(-entry.amount),
        lastUpdated: new Date().toISOString(),
      })
    })
  },

  // ── Admin: manual credit/debit ─────────────────────────────────────────────

  async adminCredit(params: {
    userId: string
    accountType: AffiliateAccountType
    currency: WalletCurrency
    amount: number
    reason: string
    adminUid: string
  }): Promise<string> {
    return walletService.creditDirect({
      ...params,
      entryType: 'ADMIN_CREDIT',
      description: `Crédito manual: ${params.reason}`,
      createdBy: params.adminUid,
    })
  },

  async adminDebit(params: {
    userId: string
    accountType: AffiliateAccountType
    currency: WalletCurrency
    amount: number
    reason: string
    adminUid: string
  }): Promise<string> {
    return walletService.debit({
      ...params,
      entryType: 'ADMIN_DEBIT',
      description: `Débito manual: ${params.reason}`,
      createdBy: params.adminUid,
    })
  },
}
