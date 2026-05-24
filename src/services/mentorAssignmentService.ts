import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { normalizeFirestoreWriteData, nowTimestamp } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import type { MentorAssignment, User } from '../types/domain'

export const mentorAssignmentService = {
  async listStudentIds(mentorId: string): Promise<string[]> {
    const usersSnap = await getDocs(
      query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', 'member'),
        where('mentorId', '==', mentorId),
      ),
    )

    return usersSnap.docs.map((userDoc) => userDoc.id)
  },

  async listMentors(): Promise<User[]> {
    const mentorsSnap = await getDocs(
      query(collection(db, COLLECTIONS.USERS), where('role', '==', 'mentor')),
    )

    return mentorsSnap.docs
      .map((mentorDoc) => ({ uid: mentorDoc.id, ...mentorDoc.data() }) as User)
      .sort((left, right) => (left.displayName || left.email).localeCompare(right.displayName || right.email))
  },

  async getAssignment(studentId: string): Promise<MentorAssignment | null> {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, studentId))
    if (!userSnap.exists()) return null

    const user = { uid: userSnap.id, ...userSnap.data() } as User
    if (!user.mentorId) return null

    return {
      mentorId: user.mentorId,
      studentId,
      assignedAt: typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString(),
    }
  },

  async assignStudent(studentId: string, mentorId: string | null) {
    const userRef = doc(db, COLLECTIONS.USERS, studentId)
    await updateDoc(userRef, normalizeFirestoreWriteData({
      mentorId,
      updatedAt: nowTimestamp(),
    }))
  },
}
