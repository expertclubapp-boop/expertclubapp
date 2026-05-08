import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis, nowTimestamp } from '../lib/firebase/date'
import { adminAuditLogService, type AdminActor } from './adminAuditLogService'

export type AdminStatus = 'draft' | 'published' | 'archived' | 'active' | 'inactive'

export interface AdminListOptions {
  orderField?: string
}

export function nowIso() {
  return new Date().toISOString()
}

export function nowFirestoreTimestamp() {
  return nowTimestamp()
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}`
}

export function sanitizeTags(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean)
  return (value || '').split(',').map(v => v.trim()).filter(Boolean)
}

export function createAdminCrudService<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  collectionName: string,
  targetType: string,
  defaultOrderField = 'updatedAt',
) {
  return {
    async list(options?: AdminListOptions): Promise<T[]> {
      const colRef = collection(db, collectionName)
      const orderField = options?.orderField || defaultOrderField
      const snap = await getDocs(colRef)
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as T)
        .sort((a, b) => {
          const leftValue = (a as Record<string, unknown>)[orderField] ?? a.updatedAt ?? a.createdAt
          const rightValue = (b as Record<string, unknown>)[orderField] ?? b.updatedAt ?? b.createdAt
          const leftMillis = dateMillis(leftValue as any)
          const rightMillis = dateMillis(rightValue as any)
          if (leftMillis || rightMillis) return rightMillis - leftMillis
          return String(rightValue ?? '').localeCompare(String(leftValue ?? ''))
        })
    },

    async get(id: string): Promise<T | null> {
      const snap = await getDoc(doc(db, collectionName, id))
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null
    },

    async save(actor: AdminActor, item: T): Promise<void> {
      const previous = await this.get(item.id)
      await setDoc(doc(db, collectionName, item.id), {
        ...item,
        updatedAt: nowFirestoreTimestamp(),
        createdAt: item.createdAt || previous?.createdAt || nowFirestoreTimestamp(),
      }, { merge: true })
      await adminAuditLogService.create(actor, previous ? 'admin_update' : 'admin_create', targetType, item.id, previous, item)
    },

    async patch(actor: AdminActor, id: string, data: Partial<T>): Promise<void> {
      const previous = await this.get(id)
      await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: nowFirestoreTimestamp() })
      await adminAuditLogService.create(actor, 'admin_update', targetType, id, previous, data)
    },

    async archive(actor: AdminActor, id: string): Promise<void> {
      const previous = await this.get(id)
      await updateDoc(doc(db, collectionName, id), { status: 'archived', updatedAt: nowFirestoreTimestamp() })
      await adminAuditLogService.create(actor, 'admin_archive', targetType, id, previous, { status: 'archived' })
    },

    async remove(actor: AdminActor, id: string): Promise<void> {
      const previous = await this.get(id)
      await deleteDoc(doc(db, collectionName, id))
      await adminAuditLogService.create(actor, 'admin_delete', targetType, id, previous, null)
    },
  }
}
