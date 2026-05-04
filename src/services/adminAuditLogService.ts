import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
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
    const constraints = [orderBy('createdAt', 'desc')]
    if (filters?.action) constraints.unshift(where('action', '==', filters.action) as never)
    if (filters?.targetType) constraints.unshift(where('targetType', '==', filters.targetType) as never)
    const snap = await getDocs(query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints))
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AuditLog)
    return filters?.actor
      ? logs.filter(log => log.actorEmail?.toLowerCase().includes(filters.actor!.toLowerCase()) || log.actorUid.includes(filters.actor!))
      : logs
  },
}
