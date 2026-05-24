import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  setDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis, normalizeFirestoreWriteData, nowTimestamp } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { Challenge, ChallengeParticipant, Badge } from '../types/domain'

export const challengeService = {
  // --- Admin Methods ---
  async getAllChallenges() {
    const colRef = collection(db, COLLECTIONS.CHALLENGES)
    const snap = await getDocs(colRef)
    const challenges = snap.docs.map(d => d.data() as Challenge)
    return challenges.sort((a, b) => dateMillis(b.createdAt) - dateMillis(a.createdAt))
  },

  async getChallengeById(id: string) {
    const docRef = doc(db, COLLECTIONS.CHALLENGES, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as Challenge) : null
  },

  async saveChallenge(challenge: Challenge) {
    const docRef = doc(db, COLLECTIONS.CHALLENGES, challenge.id)
    await setDoc(docRef, normalizeFirestoreWriteData(challenge))
  },

  async deleteChallenge(id: string) {
    const docRef = doc(db, COLLECTIONS.CHALLENGES, id)
    await deleteDoc(docRef)
  },

  // --- Badge Admin Methods ---
  async getAllBadges() {
    const colRef = collection(db, COLLECTIONS.BADGES)
    const snap = await getDocs(colRef)
    const items = snap.docs.map(d => d.data() as Badge)
    return items.sort((a, b) => dateMillis(b.createdAt) - dateMillis(a.createdAt))
  },

  async getBadgeById(id: string) {
    const docRef = doc(db, COLLECTIONS.BADGES, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as Badge) : null
  },

  async saveBadge(badge: Badge) {
    const docRef = doc(db, COLLECTIONS.BADGES, badge.id)
    await setDoc(docRef, normalizeFirestoreWriteData(badge))
  },

  async deleteBadge(id: string) {
    const docRef = doc(db, COLLECTIONS.BADGES, id)
    await deleteDoc(docRef)
  },

  // --- Student Methods ---
  async getActiveChallenge() {
    const colRef = collection(db, COLLECTIONS.CHALLENGES)
    const q = query(colRef, where('status', '==', 'active'))
    const snap = await getDocs(q)
    if (snap.docs.length === 0) return null
    const challenges = snap.docs.map(d => d.data() as Challenge)
    challenges.sort((a, b) => dateMillis(a.endsAt) - dateMillis(b.endsAt))
    return challenges[0] // Return the one ending soonest
  },

  async joinChallenge(challengeId: string, uid: string, displayName: string, photoURL?: string) {
    const participantRef = doc(db, getSubCollectionPath(COLLECTIONS.CHALLENGES, challengeId, SUB_COLLECTIONS.PARTICIPANTS), uid)
    const snap = await getDoc(participantRef)
    
    if (snap.exists()) return // Already joined
    
    const now = nowTimestamp()
    const nowIso = now.toDate().toISOString()
    const participant: ChallengeParticipant = {
      uid,
      challengeId,
      displayName,
      points: 0,
      rank: 0,
      completedMissions: [],
      joinedAt: nowIso,
      updatedAt: nowIso
    }
    if (photoURL) participant.photoURL = photoURL
    
    await setDoc(participantRef, normalizeFirestoreWriteData(participant))
  },

  async getParticipant(challengeId: string, uid: string) {
    const docRef = doc(db, getSubCollectionPath(COLLECTIONS.CHALLENGES, challengeId, SUB_COLLECTIONS.PARTICIPANTS), uid)
    const snap = await getDoc(docRef)
    return snap.exists() ? snap.data() as ChallengeParticipant : null
  },

  async getLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    const path = getSubCollectionPath(COLLECTIONS.CHALLENGES, challengeId, SUB_COLLECTIONS.PARTICIPANTS)
    const colRef = collection(db, path)
    const q = query(colRef, orderBy('points', 'desc'), limit(30))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as ChallengeParticipant)
  },

  async getEarnedBadges(uid: string) {
    const colRef = collection(db, getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.EARNED_BADGES))
    const snap = await getDocs(colRef)
    return snap.docs.map(d => d.data() as Badge)
  },

  async awardBadge(uid: string, badge: Badge) {
    const docRef = doc(db, getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.EARNED_BADGES), badge.id)
    await setDoc(docRef, normalizeFirestoreWriteData(badge))
  }
}
