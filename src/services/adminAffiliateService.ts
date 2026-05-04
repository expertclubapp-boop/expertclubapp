import { collection, doc, getDoc, getDocs, increment, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AffiliateAccount, ReferralCode } from '../types/domain'
import { adminAuditLogService, type AdminActor } from './adminAuditLogService'

export const adminAffiliateService = {
  async list() {
    const snap = await getDocs(query(collection(db, COLLECTIONS.AFFILIATE_ACCOUNTS), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AffiliateAccount)
  },

  async create(actor: AdminActor, input: Pick<AffiliateAccount, 'name' | 'email'> & Partial<AffiliateAccount>) {
    const id = input.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const affiliate: AffiliateAccount = {
      id,
      name: input.name,
      email: input.email,
      instagram: input.instagram || '',
      pixKey: input.pixKey || '',
      status: input.status || 'active',
      commissionRate: input.commissionRate ?? 0.2,
      payoutMethod: input.payoutMethod || 'pix',
      totalCommissionPaid: 0,
      pendingCommission: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const code = `${input.name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`
    await setDoc(doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, id), affiliate)
    await setDoc(doc(db, COLLECTIONS.REFERRAL_CODES, code), {
      code,
      affiliateId: id,
      affiliateName: input.name,
      status: 'active',
      discountType: 'none',
      discountValue: 0,
      commissionRate: affiliate.commissionRate,
      usageCount: 0,
      activeSubscriptionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies ReferralCode)
    await adminAuditLogService.create(actor, 'criar_afiliada', 'affiliate', id, null, affiliate)
    return { affiliate, code }
  },

  async updateStatus(actor: AdminActor, affiliateId: string, status: AffiliateAccount['status']) {
    const before = await getDoc(doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, affiliateId))
    await updateDoc(doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, affiliateId), { status, updatedAt: new Date().toISOString() })
    if (status === 'blocked') {
      const codes = await getDocs(query(collection(db, COLLECTIONS.REFERRAL_CODES), where('affiliateId', '==', affiliateId)))
      await Promise.all(codes.docs.map(code => updateDoc(code.ref, { status: 'inactive', updatedAt: new Date().toISOString() })))
    }
    await adminAuditLogService.create(actor, 'alterar_status_afiliada', 'affiliate', affiliateId, before.exists() ? before.data() : null, { status })
  },

  async createReferralCode(actor: AdminActor, affiliate: AffiliateAccount) {
    const code = `${affiliate.name.split(' ')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`
    await setDoc(doc(db, COLLECTIONS.REFERRAL_CODES, code), {
      code,
      affiliateId: affiliate.id,
      affiliateName: affiliate.name,
      status: 'active',
      discountType: 'none',
      discountValue: 0,
      commissionRate: affiliate.commissionRate,
      usageCount: 0,
      activeSubscriptionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await adminAuditLogService.create(actor, 'gerar_codigo_afiliada', 'referralCode', code, null, { affiliateId: affiliate.id })
    return code
  },

  async markPayoutPaid(actor: AdminActor, payoutId: string) {
    const payoutRef = doc(db, COLLECTIONS.AFFILIATE_PAYOUTS, payoutId)
    const snap = await getDoc(payoutRef)
    if (!snap.exists()) return
    await updateDoc(payoutRef, { status: 'paid', paidAt: new Date().toISOString() })
    await adminAuditLogService.create(actor, 'marcar_payout_pago', 'payout', payoutId, snap.data(), { status: 'paid' })
  },

  async createPayout(actor: AdminActor, affiliateId: string, ledgerEntryIds: string[], amount: number) {
    const batch = writeBatch(db)
    const payoutId = `payout_${Date.now()}`
    batch.set(doc(db, COLLECTIONS.AFFILIATE_PAYOUTS, payoutId), {
      id: payoutId,
      affiliateId,
      amount,
      currency: 'BRL',
      status: 'pending',
      ledgerEntryIds,
      payoutMethod: 'manual',
      createdAt: new Date().toISOString(),
    })
    ledgerEntryIds.forEach(id => batch.update(doc(db, COLLECTIONS.COMMISSION_LEDGER, id), { status: 'paid', paidAt: new Date().toISOString() }))
    batch.update(doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, affiliateId), {
      totalCommissionPaid: increment(amount),
      pendingCommission: increment(-amount),
      updatedAt: new Date().toISOString(),
    })
    await batch.commit()
    await adminAuditLogService.create(actor, 'criar_payout', 'payout', payoutId, null, { affiliateId, amount, ledgerEntryIds })
  },
}
