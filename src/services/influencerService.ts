/**
 * influencerService — Admin CRUD for influencer accounts + payout lifecycle.
 *
 * Influencers earn real BRL commissions (not credits).
 * Payouts go through a review → approved → processing → paid flow.
 * All balance mutations go through walletService (append-only ledger).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
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
  CommissionTier,
  InfluencerAccount,
  InfluencerPayout,
  PlanTier,
  WalletBalance,
  WalletCurrency,
  WalletEntryStatus,
  WalletEntryType,
} from '../types/domain'
import { DEFAULT_COMMISSION_TIERS } from '../types/domain'
import { walletService } from './walletService'
import { economyConfigService } from './economyConfigService'

function accountsCol() {
  return collection(db, COLLECTIONS.INFLUENCER_ACCOUNTS)
}

function accountRef(uid: string) {
  return doc(db, COLLECTIONS.INFLUENCER_ACCOUNTS, uid)
}

function payoutsCol() {
  return collection(db, COLLECTIONS.INFLUENCER_PAYOUTS)
}

function payoutRef(id: string) {
  return doc(db, COLLECTIONS.INFLUENCER_PAYOUTS, id)
}

export const influencerService = {
  // ── Accounts ─────────────────────────────────────────────────────────────

  async getAccount(uid: string): Promise<InfluencerAccount | null> {
    const snap = await getDoc(accountRef(uid))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as InfluencerAccount) : null
  },

  async listAccounts(statusFilter?: InfluencerAccount['status']): Promise<InfluencerAccount[]> {
    const q = statusFilter
      ? query(accountsCol(), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
      : query(accountsCol(), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InfluencerAccount))
  },

  async createAccount(
    data: Omit<
      InfluencerAccount,
      | 'id'
      | 'totalReferrals'
      | 'activeReferrals'
      | 'pendingCommissionBrl'
      | 'approvedCommissionBrl'
      | 'paidCommissionBrl'
      | 'totalRevenueBrl'
      | 'conversionRate'
      | 'totalClicks'
      | 'createdAt'
      | 'updatedAt'
      | 'createdBy'
    >,
    adminUid: string
  ): Promise<string> {
    const account: Omit<InfluencerAccount, 'id'> = {
      ...data,
      totalReferrals: 0,
      activeReferrals: 0,
      pendingCommissionBrl: 0,
      approvedCommissionBrl: 0,
      paidCommissionBrl: 0,
      totalRevenueBrl: 0,
      conversionRate: 0,
      totalClicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminUid,
    }
    // Use uid as document ID so we can look up by UID directly
    await setDoc(accountRef(data.uid), account)
    return data.uid
  },

  async updateAccount(
    uid: string,
    updates: Partial<Omit<InfluencerAccount, 'id' | 'uid' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    await updateDoc(accountRef(uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  },

  async blockAccount(uid: string, adminUid: string, reason?: string): Promise<void> {
    await updateDoc(accountRef(uid), {
      status: 'blocked',
      updatedAt: new Date().toISOString(),
      ...(reason ? { notes: `${reason} [bloqueado por ${adminUid}]` } : { notes: `Bloqueado por ${adminUid}` }),
    })
  },

  // ── Commission tier resolution ─────────────────────────────────────────────

  getCommissionTier(account: InfluencerAccount, planTier: PlanTier): CommissionTier {
    const tiers = account.customCommissionTiers ?? DEFAULT_COMMISSION_TIERS
    return tiers.find((t) => t.planTier === planTier) ?? DEFAULT_COMMISSION_TIERS[0]
  },

  // ── Payout requests ────────────────────────────────────────────────────────

  async requestPayout(params: {
    influencerId: string
    amount: number
  }): Promise<string> {
    await economyConfigService.assertEnabled('payoutsEnabled')

    const { influencerId, amount } = params
    if (amount <= 0) throw new Error('Payout amount must be positive')

    const account = await influencerService.getAccount(influencerId)
    if (!account) throw new Error('Influencer account not found')
    if (account.status !== 'active') throw new Error('Account is not active')
    if (amount < account.minPayoutAmount) {
      throw new Error(`Minimum payout is R$${account.minPayoutAmount.toFixed(2)}`)
    }

    // Hard cap from economy config (admin-adjustable)
    const cfg = await economyConfigService.getConfig()
    if (amount > cfg.maxSinglePayoutBrl) {
      throw new Error(`Valor máximo por saque: R$${cfg.maxSinglePayoutBrl.toFixed(2)}. Entre em contato com o suporte para saques acima deste limite.`)
    }

    // Pre-allocate document IDs so they're known before the transaction
    const payoutDocRef = doc(payoutsCol())
    const ledgerRef = doc(collection(db, COLLECTIONS.WALLET_LEDGER))
    const balRef = doc(db, COLLECTIONS.WALLET_BALANCES, influencerId)

    await runTransaction(db, async (tx) => {
      // Balance check INSIDE transaction — prevents TOCTOU race condition
      const balSnap = await tx.get(balRef)
      if (!balSnap.exists()) throw new Error('Carteira não encontrada')
      const bal = balSnap.data() as WalletBalance
      if (bal.availableBalance < amount) {
        throw new Error(`Saldo insuficiente: disponível R$${bal.availableBalance.toFixed(2)}, solicitado R$${amount.toFixed(2)}`)
      }

      const now = new Date().toISOString()

      // Create payout record
      tx.set(payoutDocRef, {
        influencerId,
        requestedBy: influencerId,
        amount,
        currency: 'BRL',
        status: 'pending_review',
        ledgerEntryIds: [ledgerRef.id],
        payoutMethod: account.payoutMethod,
        pixKey: account.pixKey,
        pixKeyType: account.pixKeyType,
        earliestPayoutDate: now,
        createdAt: now,
      } satisfies Omit<InfluencerPayout, 'id'>)

      // Debit wallet atomically with payout creation
      tx.set(ledgerRef, {
        userId: influencerId,
        accountType: 'influencer' as AffiliateAccountType,
        currency: 'BRL' as WalletCurrency,
        entryType: 'PAYOUT_REQUEST' as WalletEntryType,
        amount: -amount,
        status: 'CONFIRMED' as WalletEntryStatus,
        description: `Solicitação de saque R$${amount.toFixed(2)}`,
        payoutId: payoutDocRef.id,
        createdAt: now,
        createdBy: influencerId,
      })

      tx.update(balRef, {
        availableBalance: increment(-amount),
        lifetimeSpent: increment(amount),
        lastUpdated: now,
      })
    })

    return payoutDocRef.id
  },

  async getPayout(payoutId: string): Promise<InfluencerPayout | null> {
    const snap = await getDoc(payoutRef(payoutId))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as InfluencerPayout) : null
  },

  async listPayouts(
    influencerId?: string,
    statusFilter?: InfluencerPayout['status']
  ): Promise<InfluencerPayout[]> {
    let q
    if (influencerId && statusFilter) {
      q = query(
        payoutsCol(),
        where('influencerId', '==', influencerId),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      )
    } else if (influencerId) {
      q = query(payoutsCol(), where('influencerId', '==', influencerId), orderBy('createdAt', 'desc'))
    } else if (statusFilter) {
      q = query(payoutsCol(), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
    } else {
      q = query(payoutsCol(), orderBy('createdAt', 'desc'))
    }
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InfluencerPayout))
  },

  // ── Admin payout lifecycle ─────────────────────────────────────────────────

  async approvePayoutRequest(payoutId: string, adminUid: string, notes?: string): Promise<void> {
    const p = await influencerService.getPayout(payoutId)
    if (!p) throw new Error('Payout not found')
    if (p.status !== 'pending_review') throw new Error(`Cannot approve payout in status: ${p.status}`)

    await updateDoc(payoutRef(payoutId), {
      status: 'approved',
      reviewedBy: adminUid,
      reviewedAt: new Date().toISOString(),
      ...(notes ? { adminNotes: notes } : {}),
    })

    // Record approval in ledger (informational, $0 amount)
    await walletService.creditDirect({
      userId: p.influencerId,
      accountType: 'influencer',
      currency: 'BRL',
      entryType: 'PAYOUT_APPROVED',
      amount: 0.01, // nominal — just for audit trail
      description: `Saque aprovado: R$${p.amount.toFixed(2)}`,
      payoutId,
      createdBy: adminUid,
    })
  },

  async markPayoutPaid(
    payoutId: string,
    adminUid: string,
    params: { transactionId?: string; receiptUrl?: string; notes?: string }
  ): Promise<void> {
    const p = await influencerService.getPayout(payoutId)
    if (!p) throw new Error('Payout not found')
    if (p.status !== 'approved' && p.status !== 'processing') {
      throw new Error(`Cannot mark as paid: status is ${p.status}`)
    }

    await updateDoc(payoutRef(payoutId), {
      status: 'paid',
      paidAt: new Date().toISOString(),
      reviewedBy: adminUid,
      transactionId: params.transactionId,
      receiptUrl: params.receiptUrl,
      adminNotes: params.notes,
    })

    // Update account stats
    await updateDoc(accountRef(p.influencerId), {
      paidCommissionBrl: increment(p.amount),
      updatedAt: new Date().toISOString(),
    })
  },

  async rejectPayoutRequest(payoutId: string, adminUid: string, reason: string): Promise<void> {
    const p = await influencerService.getPayout(payoutId)
    if (!p) throw new Error('Payout not found')
    if (p.status !== 'pending_review' && p.status !== 'approved') {
      throw new Error(`Cannot reject payout in status: ${p.status}`)
    }

    await updateDoc(payoutRef(payoutId), {
      status: 'rejected',
      reviewedBy: adminUid,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    })

    // Reverse the PAYOUT_REQUEST debit so balance returns to available
    if (p.ledgerEntryIds.length > 0) {
      await walletService.reverse({
        originalEntryId: p.ledgerEntryIds[0],
        reason: `Saque rejeitado: ${reason}`,
        reversedBy: adminUid,
      })
    }
  },

  // ── Stats helpers ──────────────────────────────────────────────────────────

  async refreshAccountStats(uid: string): Promise<void> {
    const balance = await walletService.getBalance(uid)
    if (!balance) return

    await updateDoc(accountRef(uid), {
      pendingCommissionBrl: balance.pendingBalance,
      approvedCommissionBrl: balance.availableBalance,
      updatedAt: new Date().toISOString(),
    })
  },
}
