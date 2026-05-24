import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AuditLog } from '../types/domain'

export interface AdminActor {
  uid?: string
  email?: string | null
}

export const adminAuditLogService = {
  async create(actor: AdminActor, action: string, targetType: string, targetId: string, before?: unknown, after?: unknown) {
    const ref = doc(collection(db, COLLECTIONS.AUDIT_LOGS))
    await setDoc(ref, {
      id: ref.id,
      actorUid: actor.uid || 'unknown',
      actorEmail: actor.email || 'unknown',
      action,
      targetType,
      targetId,
      before: before ?? null,
      after: after ?? null,
      createdAt: serverTimestamp(),
    })
  },

  async list(filters?: { actor?: string; action?: string; targetType?: string }) {
    const snap = await getDocs(query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('createdAt', 'desc')))
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AuditLog)
    return logs.filter((log) => {
      if (filters?.action && log.action !== filters.action) return false
      if (filters?.targetType && log.targetType !== filters.targetType) return false
      if (filters?.actor) {
        return log.actorEmail?.toLowerCase().includes(filters.actor.toLowerCase()) || log.actorUid.includes(filters.actor)
      }
      return true
    })
  },
}
