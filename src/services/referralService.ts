/**
 * referralService — Manages referral codes, attribution, and commission flows.
 *
 * Anti-fraud rules enforced:
 * - No self-referral (same userId)
 * - Max 5 pending referrals per referrer
 * - Duplicate referred user blocked
 * - Velocity check: max 10 new referrals/day per referrer
 * - Hold period before credits/commission become available
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  runTransaction,
  updateDoc,
  where,
  increment,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type {
  AffiliateAccountType,
  CommissionTier,
  FraudFlag,
  InfluencerAccount,
  PlanTier,
  Referral,
  ReferralCodeV2,
  StudentReferralAccount,
  WalletCurrency,
} from '../types/domain'
import { walletService } from './walletService'
import { economyConfigService } from './economyConfigService'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PENDING_REFERRALS = 5
const STUDENT_HOLD_DAYS = 7
const INFLUENCER_HOLD_DAYS = 15
const VELOCITY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24h
const VELOCITY_MAX = 10 // max new referrals per 24h per referrer

const PLAN_TIERS: Record<PlanTier, CommissionTier> = {
  low_ticket:            { planTier: 'low_ticket',            discountPercent: 5,  commissionPercent: 5  },
  mentoring_quarterly:   { planTier: 'mentoring_quarterly',   discountPercent: 10, commissionPercent: 10 },
  mentoring_semester:    { planTier: 'mentoring_semester',    discountPercent: 15, commissionPercent: 15 },
  mentoring_annual:      { planTier: 'mentoring_annual',      discountPercent: 20, commissionPercent: 20 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSuffix(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I,O,0,1 to avoid confusion
  return Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function buildSlug(displayName: string): string {
  const parts = displayName.trim().toUpperCase().split(/\s+/)
  const first = parts[0]?.replace(/[^A-Z]/g, '') ?? 'USER'
  const lastInitial = parts[1]?.[0]?.replace(/[^A-Z]/g, '') ?? ''
  return (first + lastInitial).slice(0, 8) // max 8 chars
}

async function isCodeTaken(code: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTIONS.REFERRAL_CODES_V2),
    where('code', '==', code)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

function calcRiskScore(flags: FraudFlag[]): number {
  const weights: Record<FraudFlag, number> = {
    SELF_REFERRAL: 100,
    SAME_IP_AS_REFERRER: 60,
    SAME_DEVICE_AS_REFERRER: 80,
    MULTIPLE_REFERRALS_SAME_IP: 40,
    RAPID_SIGNUP_AFTER_CLICK: 30,
    FAKE_EMAIL_PATTERN: 50,
    EXCESSIVE_PENDING_REFERRALS: 35,
    CHARGEBACK_HISTORY: 70,
    VELOCITY_LIMIT_HIT: 45,
    SUSPICIOUS_PAYOUT_PATTERN: 55,
  }
  return Math.min(100, flags.reduce((s, f) => s + (weights[f] ?? 10), 0))
}

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', 'fakeinbox.com',
]

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return DISPOSABLE_DOMAINS.includes(domain)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const referralService = {
  // ── Code management ───────────────────────────────────────────────────────

  async generateCode(params: {
    ownerUid: string
    ownerType: AffiliateAccountType
    ownerDisplayName: string
    campaignId?: string
  }): Promise<ReferralCodeV2> {
    const slug = buildSlug(params.ownerDisplayName)
    let suffix = generateSuffix()
    let code = `${slug}-${suffix}`
    let attempts = 0

    // Ensure uniqueness (up to 10 attempts)
    while ((await isCodeTaken(code)) && attempts < 10) {
      suffix = generateSuffix()
      code = `${slug}-${suffix}`
      attempts++
    }
    if (attempts >= 10) throw new Error('Failed to generate unique referral code')

    const codeDoc: Omit<ReferralCodeV2, 'id'> = {
      code,
      slug,
      suffix,
      ownerUid: params.ownerUid,
      ownerType: params.ownerType,
      ownerDisplayName: params.ownerDisplayName,
      status: 'active',
      totalClicks: 0,
      uniqueClicks: 0,
      totalConversions: 0,
      totalRevenueBrl: 0,
      ...(params.campaignId !== undefined && { campaignId: params.campaignId }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const ref = await addDoc(collection(db, COLLECTIONS.REFERRAL_CODES_V2), codeDoc)
    return { id: ref.id, ...codeDoc }
  },

  async getCodeByOwner(ownerUid: string): Promise<ReferralCodeV2 | null> {
    const q = query(
      collection(db, COLLECTIONS.REFERRAL_CODES_V2),
      where('ownerUid', '==', ownerUid),
      where('status', '==', 'active')
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ReferralCodeV2
  },

  async getCodeByCode(code: string): Promise<ReferralCodeV2 | null> {
    const q = query(
      collection(db, COLLECTIONS.REFERRAL_CODES_V2),
      where('code', '==', code.toUpperCase()),
      where('status', '==', 'active')
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ReferralCodeV2
  },

  async recordClick(codeId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.REFERRAL_CODES_V2, codeId), {
      totalClicks: increment(1),
      updatedAt: new Date().toISOString(),
    })
  },

  // ── Student account ────────────────────────────────────────────────────────

  async getOrCreateStudentAccount(uid: string, displayName: string): Promise<StudentReferralAccount> {
    const existingQ = query(
      collection(db, COLLECTIONS.STUDENT_REFERRAL_ACCOUNTS),
      where('uid', '==', uid)
    )
    const snap = await getDocs(existingQ)
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as StudentReferralAccount

    // Create code for this student
    const codeDoc = await referralService.generateCode({ ownerUid: uid, ownerType: 'student', ownerDisplayName: displayName })

    const account: Omit<StudentReferralAccount, 'id'> = {
      uid,
      displayName,
      referralCode: codeDoc.code,
      referralCodeSlug: codeDoc.slug,
      status: 'active',
      totalReferrals: 0,
      activeReferrals: 0,
      pendingCredits: 0,
      availableCredits: 0,
      lifetimeCreditsEarned: 0,
      lifetimeCreditsSpent: 0,
      pendingReferralCount: 0,
      fraudScore: 0,
      lastFraudCheck: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const ref = await addDoc(collection(db, COLLECTIONS.STUDENT_REFERRAL_ACCOUNTS), account)
    return { id: ref.id, ...account }
  },

  async getStudentAccount(uid: string): Promise<StudentReferralAccount | null> {
    const q = query(collection(db, COLLECTIONS.STUDENT_REFERRAL_ACCOUNTS), where('uid', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as StudentReferralAccount
  },

  // ── Attribution (when a referred user converts to paying subscriber) ───────

  async attributeConversion(params: {
    referralCode: string
    referredUserId: string
    referredEmail: string
    planTier: PlanTier
    planId: string
    subscriptionId: string
    paymentId: string
    grossAmountBrl: number
    referrerIp?: string
    referredIp?: string
    deviceFingerprint?: string
  }): Promise<{ referral: Referral; discountPercent: number; discountAmountBrl: number } | null> {
    await economyConfigService.assertEnabled('referralsEnabled')

    const code = await referralService.getCodeByCode(params.referralCode)
    if (!code) return null

    // ── Anti-fraud checks ─────────────────────────────────────────────────
    const fraudFlags: FraudFlag[] = []

    // Self-referral
    if (code.ownerUid === params.referredUserId) {
      fraudFlags.push('SELF_REFERRAL')
    }

    // Same IP
    if (params.referrerIp && params.referredIp && params.referrerIp === params.referredIp) {
      fraudFlags.push('SAME_IP_AS_REFERRER')
    }

    // Same device
    if (params.deviceFingerprint) {
      fraudFlags.push('SAME_DEVICE_AS_REFERRER')
    }

    // Disposable email
    if (isDisposableEmail(params.referredEmail)) {
      fraudFlags.push('FAKE_EMAIL_PATTERN')
    }

    // Velocity check: referrer's pending count
    const pendingQ = query(
      collection(db, COLLECTIONS.REFERRALS),
      where('referrerId', '==', code.ownerUid),
      where('status', '==', 'pending')
    )
    const pendingSnap = await getDocs(pendingQ)
    if (pendingSnap.size >= MAX_PENDING_REFERRALS) {
      fraudFlags.push('EXCESSIVE_PENDING_REFERRALS')
    }

    // Velocity: last 24h
    const since = new Date(Date.now() - VELOCITY_WINDOW_MS).toISOString()
    const recentQ = query(
      collection(db, COLLECTIONS.REFERRALS),
      where('referrerId', '==', code.ownerUid),
      where('createdAt', '>=', since)
    )
    const recentSnap = await getDocs(recentQ)
    if (recentSnap.size >= VELOCITY_MAX) {
      fraudFlags.push('VELOCITY_LIMIT_HIT')
    }

    const riskScore = calcRiskScore(fraudFlags)
    const isFraudBlocked = fraudFlags.includes('SELF_REFERRAL') || riskScore >= 80

    // Commission tiers
    const tier = PLAN_TIERS[params.planTier]
    const discountAmountBrl = Math.round(params.grossAmountBrl * (tier.discountPercent / 100) * 100) / 100
    const commissionAmountBrl = Math.round(params.grossAmountBrl * (tier.commissionPercent / 100) * 100) / 100

    const holdDays = code.ownerType === 'influencer' ? INFLUENCER_HOLD_DAYS : STUDENT_HOLD_DAYS
    const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000)
    const now = new Date().toISOString()

    // Deterministic doc ID = composite key — prevents duplicate attribution in concurrent calls
    const referralDocId = `${code.ownerUid}_${params.referredUserId}`
    const referralRef = doc(db, COLLECTIONS.REFERRALS, referralDocId)

    const referralDoc: Omit<Referral, 'id'> = {
      referralCodeId: code.id,
      referralCode: params.referralCode,
      referrerId: code.ownerUid,
      referrerType: code.ownerType,
      referrerId_referredId: referralDocId,
      referredUserId: params.referredUserId,
      referredEmail: params.referredEmail,
      status: isFraudBlocked ? 'fraud_hold' : 'pending',
      discountPercent: tier.discountPercent,
      discountAmountBrl,
      commissionPercent: tier.commissionPercent,
      commissionAmountBrl,
      planTier: params.planTier,
      planId: params.planId,
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      grossAmountBrl: params.grossAmountBrl,
      holdUntil: holdUntil.toISOString(),
      riskScore,
      fraudFlags,
      deviceFingerprint: params.deviceFingerprint,
      referrerIp: params.referrerIp,
      referredIp: params.referredIp,
      attributedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    // Atomic check-and-create: if referral already exists, abort silently (idempotent)
    const alreadyAttributed = await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(referralRef)
      if (existingSnap.exists()) return true
      tx.set(referralRef, referralDoc)
      return false
    })

    if (alreadyAttributed) return null

    const referral = { id: referralDocId, ...referralDoc }

    // Write wallet credit after confirmed atomic write (if attributed fails, credit is never issued)
    if (!isFraudBlocked) {
      const currency: WalletCurrency = code.ownerType === 'influencer' ? 'BRL' : 'CREDITS'
      const ledgerEntryId = await walletService.creditPending({
        userId: code.ownerUid,
        accountType: code.ownerType,
        currency,
        entryType: code.ownerType === 'influencer' ? 'EARN_INFLUENCER_COMMISSION' : 'EARN_REFERRAL_COMMISSION',
        amount: commissionAmountBrl,
        holdUntil,
        description: `Comissão por indicação — ${params.planTier}`,
        referralId: referralDocId,
        subscriptionId: params.subscriptionId,
        paymentId: params.paymentId,
        createdBy: 'system',
      })

      await updateDoc(referralRef, { ledgerEntryId, updatedAt: new Date().toISOString() })

      // Update code analytics (best-effort; non-critical)
      await updateDoc(doc(db, COLLECTIONS.REFERRAL_CODES_V2, code.id), {
        totalConversions: increment(1),
        totalRevenueBrl: increment(params.grossAmountBrl),
        updatedAt: new Date().toISOString(),
      })
    }

    return { referral, discountPercent: tier.discountPercent, discountAmountBrl }
  },

  // ── Confirm conversion (payment confirmed by MP webhook) ──────────────────

  async confirmConversion(referralId: string): Promise<void> {
    const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId)
    const snap = await getDoc(referralRef)
    if (!snap.exists()) return

    const referral = snap.data() as Referral
    if (referral.status !== 'pending') return

    await updateDoc(referralRef, {
      status: 'active',
      convertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  },

  // ── Release commissions after hold period ──────────────────────────────────

  async releaseMaturedHolds(): Promise<number> {
    const now = new Date().toISOString()
    const q = query(
      collection(db, COLLECTIONS.REFERRALS),
      where('status', '==', 'active'),
      where('holdUntil', '<=', now)
    )
    const snap = await getDocs(q)
    let released = 0

    for (const d of snap.docs) {
      const referral = d.data() as Referral
      if (referral.ledgerEntryId) {
        try {
          await walletService.releaseHold(referral.ledgerEntryId)
          await updateDoc(d.ref, { updatedAt: now })
          released++
        } catch (e) {
          console.error('Failed to release hold for referral', d.id, e)
        }
      }
    }

    return released
  },

  // ── Reverse referral (chargeback / subscription cancelled) ────────────────

  async reverseReferral(referralId: string, reason: string): Promise<void> {
    const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId)
    const snap = await getDoc(referralRef)
    if (!snap.exists()) return

    const referral = snap.data() as Referral
    if (referral.status === 'reversed') return // idempotent

    if (referral.ledgerEntryId) {
      await walletService.reverse({
        originalEntryId: referral.ledgerEntryId,
        reason,
        reversedBy: 'system',
      })
    }

    await updateDoc(referralRef, {
      status: 'reversed',
      reversedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  },

  // ── List referrals by referrer ─────────────────────────────────────────────

  async getReferralsByReferrer(referrerUid: string): Promise<Referral[]> {
    const q = query(
      collection(db, COLLECTIONS.REFERRALS),
      where('referrerId', '==', referrerUid),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Referral))
  },

  // ── Influencer account ─────────────────────────────────────────────────────

  async getInfluencerByUid(uid: string): Promise<InfluencerAccount | null> {
    const q = query(
      collection(db, COLLECTIONS.INFLUENCER_ACCOUNTS),
      where('uid', '==', uid),
      where('status', '==', 'active')
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as InfluencerAccount
  },
}
