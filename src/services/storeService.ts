/**
 * storeService — Internal credits store for students.
 *
 * RULES:
 * - Stock is tracked with reservedStock to prevent over-redemption.
 * - Redemptions debit the wallet via walletService (which checks balance atomically).
 * - fulfillmentType='automatic' marks fulfilled immediately; 'manual_review' stays pending.
 * - Cancellation releases stock reservation and credits the wallet back.
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
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type {
  AffiliateAccountType,
  StoreItem,
  StoreRedemption,
  WalletBalance,
  WalletCurrency,
  WalletEntryStatus,
  WalletEntryType,
} from '../types/domain'
import { walletService } from './walletService'
import { economyConfigService } from './economyConfigService'

function itemsCol() {
  return collection(db, COLLECTIONS.STORE_ITEMS)
}

function itemRef(itemId: string) {
  return doc(db, COLLECTIONS.STORE_ITEMS, itemId)
}

function redemptionsCol() {
  return collection(db, COLLECTIONS.STORE_REDEMPTIONS)
}

function redemptionRef(id: string) {
  return doc(db, COLLECTIONS.STORE_REDEMPTIONS, id)
}

export const storeService = {
  // ── Catalog ───────────────────────────────────────────────────────────────

  async getActiveItems(): Promise<StoreItem[]> {
    const now = new Date().toISOString()
    const q = query(
      itemsCol(),
      where('isActive', '==', true),
      orderBy('creditCost', 'asc')
    )
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as StoreItem))
      .filter((item) => {
        if (item.validFrom && item.validFrom > now) return false
        if (item.validUntil && item.validUntil < now) return false
        return true
      })
  },

  async getItem(itemId: string): Promise<StoreItem | null> {
    const snap = await getDoc(itemRef(itemId))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as StoreItem) : null
  },

  // ── Admin catalog management ──────────────────────────────────────────────

  async createItem(
    data: Omit<StoreItem, 'id' | 'reservedStock' | 'createdAt' | 'updatedAt'>,
    adminUid: string
  ): Promise<string> {
    const ref = await addDoc(itemsCol(), {
      ...data,
      reservedStock: 0,
      createdBy: adminUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return ref.id
  },

  async updateItem(
    itemId: string,
    updates: Partial<Omit<StoreItem, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(itemRef(itemId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  },

  async deactivateItem(itemId: string): Promise<void> {
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(itemRef(itemId), {
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
  },

  // ── Redemptions ───────────────────────────────────────────────────────────

  async redeem(params: {
    userId: string
    storeItemId: string
    accountType?: AffiliateAccountType
  }): Promise<{ redemptionId: string; ledgerEntryId: string }> {
    await economyConfigService.assertEnabled('storeEnabled')

    const { userId, storeItemId } = params
    const accountType = params.accountType ?? 'student'

    // Pre-check per-user limit (non-transactional; acceptable since it's a product cap,
    // not a financial integrity guard — stock + balance are enforced atomically below)
    let redemptionId = ''
    let ledgerEntryId = ''
    const balRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId)

    await runTransaction(db, async (tx) => {
      const [iSnap, balSnap] = await Promise.all([
        tx.get(itemRef(storeItemId)),
        tx.get(balRef),
      ])

      if (!iSnap.exists()) throw new Error('Item not found')
      const item = { id: iSnap.id, ...iSnap.data() } as StoreItem

      if (!item.isActive) throw new Error('Item is not available')
      const now = new Date().toISOString()
      if (item.validFrom && item.validFrom > now) throw new Error('Item not yet available')
      if (item.validUntil && item.validUntil < now) throw new Error('Item has expired')

      // Stock check
      const availableStock = item.stock === -1 ? Infinity : item.stock - item.reservedStock
      if (availableStock <= 0) throw new Error('Out of stock')

      // Balance check — atomic with stock reservation
      if (!balSnap.exists()) throw new Error('Carteira não inicializada. Conclua uma atividade primeiro.')
      const bal = balSnap.data() as WalletBalance
      if (bal.availableBalance < item.creditCost) {
        throw new Error(`Créditos insuficientes: você tem ${bal.availableBalance}, precisa de ${item.creditCost}`)
      }

      // Generate IDs deterministically before writes
      const rRef = doc(redemptionsCol())
      redemptionId = rRef.id
      const ledgerRef = doc(collection(db, COLLECTIONS.WALLET_LEDGER))
      ledgerEntryId = ledgerRef.id

      // Reserve stock
      if (item.stock !== -1) {
        tx.update(itemRef(storeItemId), { reservedStock: increment(1), updatedAt: now })
      }

      // Create redemption
      tx.set(rRef, {
        userId,
        storeItemId,
        storeItemTitle: item.title,
        creditCost: item.creditCost,
        status: item.fulfillmentType === 'automatic' ? 'fulfilled' : 'pending_fulfillment',
        ledgerEntryId,
        createdAt: now,
        ...(item.fulfillmentType === 'automatic' ? { fulfilledAt: now } : {}),
      })

      // Debit wallet — same transaction as stock reservation (fully atomic)
      tx.set(ledgerRef, {
        userId,
        accountType,
        currency: 'CREDITS' as WalletCurrency,
        entryType: 'SPEND_STORE_REDEMPTION' as WalletEntryType,
        amount: -item.creditCost,
        status: 'CONFIRMED' as WalletEntryStatus,
        description: `Resgate: ${item.title}`,
        storeRedemptionId: rRef.id,
        createdAt: now,
        createdBy: userId,
      })

      tx.update(balRef, {
        availableBalance: increment(-item.creditCost),
        lifetimeSpent: increment(item.creditCost),
        lastUpdated: now,
      })
    })

    return { redemptionId, ledgerEntryId }
  },

  async getUserRedemptions(userId: string, maxEntries = 20): Promise<StoreRedemption[]> {
    const q = query(
      redemptionsCol(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxEntries)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoreRedemption))
  },

  // ── Admin fulfillment ─────────────────────────────────────────────────────

  async getPendingRedemptions(): Promise<StoreRedemption[]> {
    const q = query(
      redemptionsCol(),
      where('status', '==', 'pending_fulfillment'),
      orderBy('createdAt', 'asc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoreRedemption))
  },

  async fulfillRedemption(redemptionId: string, adminUid: string, notes?: string): Promise<void> {
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(redemptionRef(redemptionId), {
      status: 'fulfilled',
      fulfilledBy: adminUid,
      fulfilledAt: new Date().toISOString(),
      ...(notes ? { fulfillmentNotes: notes } : {}),
    })
  },

  async cancelRedemption(redemptionId: string, cancelledBy: string): Promise<void> {
    await runTransaction(db, async (tx) => {
      const rSnap = await tx.get(redemptionRef(redemptionId))
      if (!rSnap.exists()) throw new Error('Redemption not found')
      const r = { id: rSnap.id, ...rSnap.data() } as StoreRedemption

      if (r.status === 'cancelled' || r.status === 'reversed') return

      tx.update(redemptionRef(redemptionId), {
        status: 'cancelled',
        cancelledBy,
        cancelledAt: new Date().toISOString(),
      })

      // Release stock reservation
      const iSnap = await tx.get(itemRef(r.storeItemId))
      if (iSnap.exists()) {
        const item = iSnap.data() as StoreItem
        if (item.stock !== -1) {
          tx.update(itemRef(r.storeItemId), {
            reservedStock: increment(-1),
            updatedAt: new Date().toISOString(),
          })
        }
      }
    })

    // Reverse the wallet debit
    const rSnap = await getDoc(redemptionRef(redemptionId))
    const r = { id: rSnap.id, ...rSnap.data() } as StoreRedemption
    if (r.ledgerEntryId) {
      await walletService.reverse({
        originalEntryId: r.ledgerEntryId,
        reason: `Cancelamento de resgate ${redemptionId}`,
        reversedBy: cancelledBy,
      })
    }
  },

  // ── Admin: list all items including inactive ───────────────────────────────

  async getAllItems(): Promise<StoreItem[]> {
    const q = query(itemsCol(), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoreItem))
  },

  async seedDefaultItems(adminUid: string): Promise<void> {
    const existing = await storeService.getAllItems()
    if (existing.length > 0) return

    const defaults: Array<Omit<StoreItem, 'id' | 'reservedStock' | 'createdAt' | 'updatedAt'>> = [
      {
        title: '5% de desconto no próximo plano',
        description: 'Aplique um desconto de 5% na renovação ou upgrade do seu plano.',
        category: 'plan_discount',
        creditCost: 50,
        stock: -1,
        isActive: true,
        maxPerUser: 1,
        discountPercent: 5,
        fulfillmentType: 'manual_review',
        createdBy: adminUid,
      },
      {
        title: 'Sessão de mentoria individual (30 min)',
        description: 'Uma sessão 1:1 de 30 minutos com seu mentor.',
        category: 'consultation',
        creditCost: 200,
        stock: 10,
        isActive: true,
        maxPerUser: 2,
        fulfillmentType: 'manual_review',
        createdBy: adminUid,
      },
      {
        title: 'Acesso VIP por 30 dias',
        description: 'Acesso à comunidade VIP com conteúdos exclusivos por 30 dias.',
        category: 'vip_access',
        creditCost: 150,
        stock: -1,
        isActive: true,
        maxPerUser: 3,
        fulfillmentType: 'automatic',
        createdBy: adminUid,
      },
    ]

    await Promise.all(defaults.map((item) => storeService.createItem(item, adminUid)))
  },
}
