import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { BodyCheckin } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

type ProgressPhotoType = keyof BodyCheckin['photoUrls']

export const bodyCheckinService = {
  async save(uid: string, checkin: Omit<BodyCheckin, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.BODY_CHECKINS)
    const docRef = doc(db, path, checkin.id)
    await setDoc(
      docRef,
      {
        ...checkin,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    // Non-blocking scoring
    challengeScoringService.processUserAction({
      uid,
      sourceType: 'body_checkin',
      sourceId: checkin.id
    }).catch(console.error)
  },

  async uploadProgressPhoto(uid: string, checkinId: string, type: ProgressPhotoType, file: File): Promise<string> {
    const safeType = type.replace(/[^a-z]/gi, '')
    const photoRef = ref(storage, `users/${uid}/progressPhotos/${checkinId}/${safeType}.jpg`)
    await uploadBytes(photoRef, file, { contentType: file.type || 'image/jpeg' })
    return getDownloadURL(photoRef)
  },

  async getRecent(uid: string, limitCount = 12): Promise<BodyCheckin[]> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.BODY_CHECKINS)
    const colRef = collection(db, path)
    const q = query(colRef, orderBy('date', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as BodyCheckin)
  },
}
