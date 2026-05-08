import { collection, deleteField, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { nowTimestamp } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { AuditLog, BodyCheckin, DietDay, Subscription, User, UserProfile, WorkoutSession } from '../types/domain'
import { adminAuditLogService, type AdminActor } from './adminAuditLogService'
import { mentorAssignmentService } from './mentorAssignmentService'

export interface AdminUserRow {
  user: User
  subscription?: Subscription | null
}

export interface AdminUserDetail extends AdminUserRow {
  profile?: UserProfile | null
  mentor?: User | null
  dietDays: DietDay[]
  workoutSessions: WorkoutSession[]
  bodyCheckins: BodyCheckin[]
  auditLogs: AuditLog[]
}

async function listSubcollection<T>(uid: string, name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS, uid, name))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
}

export const adminUserService = {
  async list(): Promise<AdminUserRow[]> {
    const [usersSnap, subsSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS)),
    ])
    const subs = Object.fromEntries(subsSnap.docs.map(d => [d.id, d.data() as Subscription]))
    return usersSnap.docs.map(d => {
      const user = { uid: d.id, ...d.data() } as User
      return { user, subscription: subs[user.uid] || null }
    })
  },

  async get(uid: string): Promise<AdminUserDetail | null> {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid))
    if (!userSnap.exists()) return null
    const [profileSnap, subSnap, dietDays, workoutSessions, bodyCheckins, auditLogs] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.PROFILES, uid)),
      getDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, uid)),
      listSubcollection<DietDay>(uid, 'dietDays'),
      listSubcollection<WorkoutSession>(uid, 'workoutSessions'),
      listSubcollection<BodyCheckin>(uid, 'bodyCheckins'),
      adminAuditLogService.list(),
    ])
    const user = { uid: userSnap.id, ...userSnap.data() } as User
    const mentor = user.mentorId ? await getDoc(doc(db, COLLECTIONS.USERS, user.mentorId)) : null
    return {
      user,
      subscription: subSnap.exists() ? (subSnap.data() as Subscription) : null,
      profile: profileSnap.exists() ? (profileSnap.data() as UserProfile) : null,
      mentor: mentor?.exists() ? ({ uid: mentor.id, ...mentor.data() } as User) : null,
      dietDays,
      workoutSessions,
      bodyCheckins,
      auditLogs: auditLogs.filter(log => log.targetId === uid),
    }
  },

  async updateRole(actor: AdminActor, uid: string, role: User['role']) {
    const before = await getDoc(doc(db, COLLECTIONS.USERS, uid))
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { role, updatedAt: nowTimestamp() })
    await adminAuditLogService.create(actor, 'alterar_role', 'user', uid, before.exists() ? before.data() : null, { role })
  },

  async listMentors() {
    return mentorAssignmentService.listMentors()
  },

  async assignMentor(actor: AdminActor, uid: string, mentorId: string | null) {
    const ref = doc(db, COLLECTIONS.USERS, uid)
    const before = await getDoc(ref)
    await updateDoc(ref, {
      mentorId: mentorId || deleteField(),
      updatedAt: nowTimestamp(),
    })
    await adminAuditLogService.create(actor, 'atribuir_mentor', 'user', uid, before.exists() ? before.data() : null, { mentorId })
  },

  async updateSubscription(actor: AdminActor, uid: string, data: Partial<Subscription>) {
    const ref = doc(db, COLLECTIONS.SUBSCRIPTIONS, uid)
    const before = await getDoc(ref)
    const current = before.exists() ? before.data() : {}
    await setDoc(ref, { ...current, ...data, uid, updatedAt: nowTimestamp() }, { merge: true })
    await adminAuditLogService.create(actor, 'alterar_assinatura', 'subscription', uid, current, data)
  },

  async softDelete(actor: AdminActor, uid: string) {
    const before = await getDoc(doc(db, COLLECTIONS.USERS, uid))
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { disabled: true, updatedAt: nowTimestamp() })
    await adminAuditLogService.create(actor, 'desativar_usuario', 'user', uid, before.exists() ? before.data() : null, { disabled: true })
  },
}
