import { collectionGroup, doc, getDoc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import { nowTimestamp } from '../lib/firebase/date'

const ADMIN_CHECKIN_LIMITS = {
  PENDING_CHECKINS: 100,
}

export interface AdminCheckinRow {
  id: string
  type: 'daily' | 'weekly'
  studentId: string
  studentName?: string
  studentEmail?: string
  createdAt?: any
  submittedAt?: any
  reviewStatus?: 'pending' | 'reviewed' | 'rejected'
  weight?: number
  mood?: string
  summary?: string
}

export interface AdminCheckinDetail extends AdminCheckinRow {
  notes?: string
  photos?: string[]
  adminFeedback?: string
  reviewedAt?: any
  reviewedBy?: string
}

export const adminCheckinService = {
  async listCheckins(options?: { status?: string }): Promise<{ rows: AdminCheckinRow[]; isPartial: boolean }> {
    try {
      const qDaily = query(
        collectionGroup(db, 'dailyCheckins'),
        orderBy('createdAt', 'desc'),
        limit(ADMIN_CHECKIN_LIMITS.PENDING_CHECKINS)
      )
      const qWeekly = query(
        collectionGroup(db, 'weeklyCheckins'),
        orderBy('createdAt', 'desc'),
        limit(ADMIN_CHECKIN_LIMITS.PENDING_CHECKINS)
      )
      
      const [snapDaily, snapWeekly] = await Promise.all([getDocs(qDaily), getDocs(qWeekly)])
      
      const dailyRows = snapDaily.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          type: 'daily' as const,
          studentId: data.uid, // Assumindo que o uid é salvo no documento
          studentName: data.studentName || 'Aluno(a)',
          createdAt: data.createdAt,
          submittedAt: data.createdAt,
          reviewStatus: data.reviewStatus || 'pending',
          weight: data.weight,
          mood: data.mood,
          summary: data.notes?.substring(0, 50)
        }
      })
      
      const weeklyRows = snapWeekly.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          type: 'weekly' as const,
          studentId: data.uid,
          studentName: data.studentName || 'Aluno(a)',
          createdAt: data.createdAt,
          submittedAt: data.createdAt,
          reviewStatus: data.reviewStatus || 'pending',
          weight: data.weight,
          summary: data.notes?.substring(0, 50)
        }
      })
      
      let rows = [...dailyRows, ...weeklyRows]

      if (options?.status) {
        rows = rows.filter(r => r.reviewStatus === options.status)
      }

      rows = rows.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0
          const tB = b.createdAt?.toMillis?.() || 0
          return tB - tA
        })
        .slice(0, ADMIN_CHECKIN_LIMITS.PENDING_CHECKINS)

      return { rows, isPartial: true }
    } catch (error) {
      console.error('Error listing pending checkins', error)
      return { rows: [], isPartial: true }
    }
  },

  async getCheckinDetail({ studentId, checkinId, type }: { studentId: string; checkinId: string; type: 'daily' | 'weekly' }): Promise<AdminCheckinDetail | null> {
    const colName = type === 'daily' ? 'dailyCheckins' : 'weeklyCheckins'
    const docRef = doc(db, COLLECTIONS.USERS, studentId, colName, checkinId)
    const snap = await getDoc(docRef)
    
    if (!snap.exists()) return null
    
    const data = snap.data()
    return {
      id: snap.id,
      type,
      studentId,
      studentName: data.studentName || 'Aluno(a)',
      createdAt: data.createdAt,
      submittedAt: data.createdAt,
      reviewStatus: data.reviewStatus || 'pending',
      weight: data.weight,
      mood: data.mood,
      notes: data.notes,
      photos: data.photos || [],
      adminFeedback: data.adminFeedback,
      reviewedAt: data.reviewedAt,
      reviewedBy: data.reviewedBy
    }
  },

  async reviewCheckin({ studentId, checkinId, type, feedback, status, adminEmail }: { studentId: string; checkinId: string; type: 'daily' | 'weekly'; feedback: string; status: 'reviewed' | 'rejected'; adminEmail: string }): Promise<void> {
    const colName = type === 'daily' ? 'dailyCheckins' : 'weeklyCheckins'
    const docRef = doc(db, COLLECTIONS.USERS, studentId, colName, checkinId)
    
    await updateDoc(docRef, {
      reviewStatus: status,
      adminFeedback: feedback,
      reviewedAt: nowTimestamp(),
      reviewedBy: adminEmail,
      updatedAt: nowTimestamp()
    })
  }
}
