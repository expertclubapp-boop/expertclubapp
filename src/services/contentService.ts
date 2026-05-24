import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  setDoc,
  deleteDoc,
  query, 
  where
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { dateMillis, normalizeFirestoreWriteData } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { ExpertContent, ContentProgress } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

export const contentService = {
  // Admin Methods
  async getAllContent() {
    const colRef = collection(db, COLLECTIONS.CONTENT)
    const snap = await getDocs(colRef)
    const items = snap.docs.map(d => d.data()) as ExpertContent[]
    return items.sort((a, b) => dateMillis(b.createdAt) - dateMillis(a.createdAt))
  },

  async getContentById(id: string) {
    const docRef = doc(db, COLLECTIONS.CONTENT, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as ExpertContent) : null
  },

  async saveContent(content: ExpertContent) {
    const docRef = doc(db, COLLECTIONS.CONTENT, content.id)
    await setDoc(docRef, normalizeFirestoreWriteData(content))
  },

  async deleteContent(id: string) {
    const docRef = doc(db, COLLECTIONS.CONTENT, id)
    await deleteDoc(docRef)
  },

  // Student Methods
  async getAllPublished() {
    const colRef = collection(db, COLLECTIONS.CONTENT)
    const q = query(colRef, where('status', '==', 'published'))
    const snap = await getDocs(q)
    const items = snap.docs.map(d => d.data()) as ExpertContent[]
    return items.sort((a, b) => {
      const dateA = a.publishedAt ? dateMillis(a.publishedAt) : dateMillis(a.createdAt)
      const dateB = b.publishedAt ? dateMillis(b.publishedAt) : dateMillis(b.createdAt)
      return dateB - dateA
    })
  },

  async getByCategory(category: string) {
    const colRef = collection(db, COLLECTIONS.CONTENT)
    const q = query(
      colRef, 
      where('status', '==', 'published'), 
      where('category', '==', category)
    )
    const snap = await getDocs(q)
    const items = snap.docs.map(d => d.data()) as ExpertContent[]
    return items.sort((a, b) => {
      const dateA = a.publishedAt ? dateMillis(a.publishedAt) : dateMillis(a.createdAt)
      const dateB = b.publishedAt ? dateMillis(b.publishedAt) : dateMillis(b.createdAt)
      return dateB - dateA
    })
  },

  // Progress Methods
  async getUserProgress(uid: string) {
    const colRef = collection(db, getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.CONTENT_PROGRESS))
    const snap = await getDocs(colRef)
    return snap.docs.map(d => d.data()) as ContentProgress[]
  },

  async saveProgress(uid: string, progress: ContentProgress) {
    const docRef = doc(db, getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.CONTENT_PROGRESS), progress.contentId)
    await setDoc(docRef, normalizeFirestoreWriteData(progress), { merge: true })

    if (progress.status === 'completed') {
      challengeScoringService.processUserAction({
        uid,
        sourceType: 'content_completed',
        sourceId: progress.contentId
      }).catch(console.error)
    }
  }
}
