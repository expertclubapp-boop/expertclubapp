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
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { ExpertContent, ContentProgress } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

export const contentService = {
  // Admin Methods
  async getAllContent() {
    const colRef = collection(db, COLLECTIONS.CONTENT)
    const snap = await getDocs(colRef)
    const items = snap.docs.map(d => d.data()) as ExpertContent[]
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getContentById(id: string) {
    const docRef = doc(db, COLLECTIONS.CONTENT, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as ExpertContent) : null
  },

  async saveContent(content: ExpertContent) {
    const docRef = doc(db, COLLECTIONS.CONTENT, content.id)
    await setDoc(docRef, content)
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
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime()
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
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime()
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
    await setDoc(docRef, progress, { merge: true })

    if (progress.status === 'completed') {
      challengeScoringService.processUserAction({
        uid,
        sourceType: 'content_completed',
        sourceId: progress.contentId
      }).catch(console.error)
    }
  }
}
