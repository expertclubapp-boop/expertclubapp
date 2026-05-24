/**
 * antifraudService — Centralized risk scoring and fraud signal management.
 *
 * Risk score 0–100. Threshold ≥80 or SELF_REFERRAL presence → block.
 * Signals are stored in Firestore for admin review and audit.
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { FraudFlag, FraudSignal } from '../types/domain'

// ─── Risk weights ─────────────────────────────────────────────────────────────

const FLAG_WEIGHTS: Record<FraudFlag, number> = {
  SELF_REFERRAL:                100,
  SAME_DEVICE_AS_REFERRER:       80,
  CHARGEBACK_HISTORY:            70,
  SAME_IP_AS_REFERRER:           60,
  MULTIPLE_REFERRALS_SAME_IP:    50,
  VELOCITY_LIMIT_HIT:            40,
  EXCESSIVE_PENDING_REFERRALS:   30,
  RAPID_SIGNUP_AFTER_CLICK:      20,
  FAKE_EMAIL_PATTERN:            20,
  SUSPICIOUS_PAYOUT_PATTERN:     40,
}

export const FRAUD_BLOCK_THRESHOLD = 80

// Known disposable email domains (extend as needed)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com',
  'throwaway.email', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'dispostable.com', 'maildrop.cc', 'tempmail.com',
  'temp-mail.org', 'fakeinbox.com', 'getairmail.com', 'mailnesia.com',
  'mailnull.com', 'spamgourmet.com', 'trashmail.at', 'trashmail.io',
])

function fraudSignalsCol() {
  return collection(db, COLLECTIONS.FRAUD_SIGNALS)
}

export const antifraudService = {
  // ── Score calculation ─────────────────────────────────────────────────────

  calculateRiskScore(flags: FraudFlag[]): number {
    if (flags.length === 0) return 0
    const total = flags.reduce((sum, flag) => sum + (FLAG_WEIGHTS[flag] ?? 0), 0)
    return Math.min(100, total)
  },

  isBlocked(flags: FraudFlag[], riskScore: number): boolean {
    return riskScore >= FRAUD_BLOCK_THRESHOLD || flags.includes('SELF_REFERRAL')
  },

  // ── Email heuristics ──────────────────────────────────────────────────────

  isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    return DISPOSABLE_DOMAINS.has(domain)
  },

  hasSuspiciousEmailPattern(email: string): boolean {
    // Long random-looking local part (> 20 chars, > 4 consecutive digits)
    const local = email.split('@')[0] ?? ''
    const hasLongDigitRun = /\d{5,}/.test(local)
    const isVeryLong = local.length > 24
    return hasLongDigitRun || isVeryLong
  },

  // ── Signal storage ─────────────────────────────────────────────────────────

  async recordSignal(params: {
    userId: string
    flags: FraudFlag[]
    riskScore: number
    referralId?: string
    payoutId?: string
    notes?: string
  }): Promise<string> {
    const signal: Omit<FraudSignal, 'id'> = {
      userId: params.userId,
      flags: params.flags,
      riskScore: params.riskScore,
      referralId: params.referralId,
      payoutId: params.payoutId,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    }
    const ref = await addDoc(fraudSignalsCol(), signal)
    return ref.id
  },

  async getSignals(userId: string): Promise<FraudSignal[]> {
    const q = query(
      fraudSignalsCol(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FraudSignal))
  },

  async getUnresolvedSignals(): Promise<FraudSignal[]> {
    const q = query(
      fraudSignalsCol(),
      where('resolvedAt', '==', null),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FraudSignal))
  },

  async resolveSignal(
    signalId: string,
    resolution: FraudSignal['resolution'],
    resolvedBy: string,
    notes?: string
  ): Promise<void> {
    await updateDoc(doc(fraudSignalsCol(), signalId), {
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      resolution,
      ...(notes ? { notes } : {}),
    })
  },

  // ── Payout pattern checks ─────────────────────────────────────────────────

  async checkPayoutPattern(influencerId: string): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = []

    // Check if multiple payouts requested within 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { INFLUENCER_PAYOUTS } = (await import('../lib/firebase/paths')).COLLECTIONS
    const q = query(
      collection(db, INFLUENCER_PAYOUTS),
      where('influencerId', '==', influencerId),
      where('createdAt', '>=', yesterday)
    )
    const recent = await getDocs(q)
    if (recent.size >= 3) {
      flags.push('SUSPICIOUS_PAYOUT_PATTERN')
    }

    return flags
  },
}
