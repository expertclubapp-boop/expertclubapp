import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'

export interface CommunitySettings {
  whatsappGroupUrl: string
  rules: string[]
  supportUrl: string
  instagramUrl: string
  announcementText?: string
  updatedAt: string
}

export const communityService = {
  async getSettings() {
    const docRef = doc(db, 'settings', 'community')
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() as CommunitySettings : null
  }
}
