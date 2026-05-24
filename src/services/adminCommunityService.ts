import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { normalizeFirestoreWriteData, nowTimestamp } from '../lib/firebase/date'
import { adminAuditLogService, type AdminActor } from './adminAuditLogService'

export interface AdminCommunitySettings {
  id: 'community'
  whatsappGroupUrl: string
  supportUrl: string
  instagramUrl: string
  rules: string[]
  welcomeText: string
  status: 'active' | 'inactive'
  updatedAt: string
}

const fallback: AdminCommunitySettings = {
  id: 'community',
  whatsappGroupUrl: '',
  supportUrl: '',
  instagramUrl: '',
  rules: [],
  welcomeText: '',
  status: 'active',
  updatedAt: '',
}

export const adminCommunityService = {
  async get(): Promise<AdminCommunitySettings> {
    const snap = await getDoc(doc(db, 'settings', 'community'))
    return snap.exists() ? ({ ...fallback, ...snap.data() } as AdminCommunitySettings) : fallback
  },

  async save(actor: AdminActor, data: AdminCommunitySettings) {
    const previous = await this.get()
    await setDoc(doc(db, 'settings', 'community'), normalizeFirestoreWriteData({ ...data, updatedAt: nowTimestamp() }), { merge: true })
    await adminAuditLogService.create(actor, 'admin_update', 'community', 'community', previous, data)
  },
}
