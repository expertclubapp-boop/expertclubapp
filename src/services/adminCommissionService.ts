import { collection, doc, getDoc, getDocs, increment, orderBy, query, runTransaction, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AffiliatePayout, CommissionEntry } from '../types/domain'
import { adminAuditLogService, type AdminActor } from './adminAuditLogService'

export const adminCommissionService = {
  async listCommissions() {
    const snap = await getDocs(query(collection(db, COLLECTIONS.COMMISSION_LEDGER), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CommissionEntry)
  },

  async listPayouts() {
    const snap = await getDocs(query(collection(db, COLLECTIONS.AFFILIATE_PAYOUTS), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AffiliatePayout)
  },

  async updateCommissionStatus(actor: AdminActor, id: string, status: CommissionEntry['status']) {
    await updateDoc(doc(db, COLLECTIONS.COMMISSION_LEDGER, id), { status, updatedAt: new Date().toISOString() })
    await adminAuditLogService.create(actor, 'alterar_comissao', 'commission', id, null, { status })
  },

  async createPayout(actor: AdminActor, affiliateId: string, ledgerEntryIds: string[]) {
    if (ledgerEntryIds.length === 0) throw new Error('Selecione pelo menos uma comissão.')

    const payoutId = `payout_${Date.now()}`
    const payoutRef = doc(db, COLLECTIONS.AFFILIATE_PAYOUTS, payoutId)
    const ledgerRefs = ledgerEntryIds.map(id => doc(db, COLLECTIONS.COMMISSION_LEDGER, id))
    const affiliateRef = doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, affiliateId)
    let amount = 0

    await runTransaction(db, async transaction => {
      const snaps = await Promise.all(ledgerRefs.map(ref => transaction.get(ref)))
      const entries = snaps.map(snap => {
        if (!snap.exists()) throw new Error('Uma das comissões selecionadas não existe.')
        return { id: snap.id, ...snap.data() } as CommissionEntry
      })

      if (entries.some(entry => entry.affiliateId !== affiliateId)) {
        throw new Error('Selecione apenas comissões da mesma afiliada.')
      }
      if (entries.some(entry => !['approved', 'pending'].includes(entry.status))) {
        throw new Error('Somente comissões pendentes ou aprovadas podem entrar em payout.')
      }

      amount = entries.reduce((sum, entry) => sum + entry.commissionAmount, 0)
      if (amount <= 0) throw new Error('O valor do payout precisa ser maior que zero.')

      transaction.set(payoutRef, {
        id: payoutId,
        affiliateId,
        amount,
        currency: 'BRL',
        status: 'pending',
        ledgerEntryIds,
        payoutMethod: 'manual',
        createdAt: new Date().toISOString(),
      })
      ledgerRefs.forEach(ref => transaction.update(ref, { status: 'paid', paidAt: new Date().toISOString() }))
      transaction.update(affiliateRef, {
        totalCommissionPaid: increment(amount),
        pendingCommission: increment(-amount),
        updatedAt: new Date().toISOString(),
      })
    })

    const payoutSnap = await getDoc(payoutRef)
    await adminAuditLogService.create(actor, 'criar_payout', 'payout', payoutId, null, payoutSnap.data())
    return { payoutId, amount }
  },
}
