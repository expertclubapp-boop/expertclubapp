import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS, SUB_COLLECTIONS } from '../lib/firebase/paths'
import type { FeedbackSchedule, FeedbackRequest, FeedbackResponse } from '../types/feedback'

// ─── Date helpers ────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ─── Collection refs ──────────────────────────────────────────────────────────

const schedulesCol = () => collection(db, COLLECTIONS.FEEDBACK_SCHEDULES)
const requestsCol = (uid: string) =>
  collection(db, 'users', uid, SUB_COLLECTIONS.FEEDBACK_REQUESTS)
const responsesCol = (uid: string) =>
  collection(db, 'users', uid, SUB_COLLECTIONS.FEEDBACK_RESPONSES)

// ─── Service ─────────────────────────────────────────────────────────────────

export const feedbackService = {
  // Check if any active schedule exists for a student; if not, create the default
  async ensureDefaultSchedule(uid: string): Promise<void> {
    const q = query(schedulesCol(), where('uid', '==', uid), where('status', '==', 'active'))
    const snap = await getDocs(q)
    if (!snap.empty) return
    await feedbackService.createSchedule(uid, {
      type: 'recurring',
      intervalDays: 15,
      startDate: todayKey(),
      createdBy: 'system',
    })
  },

  // Create a schedule and pre-generate the next N request documents
  async createSchedule(
    uid: string,
    data: {
      type: 'recurring' | 'one_time'
      intervalDays: number
      startDate: string
      createdBy: 'system' | string
    },
    occurrences = 8
  ): Promise<string> {
    const now = new Date().toISOString()
    const schedRef = await addDoc(schedulesCol(), {
      uid,
      type: data.type,
      intervalDays: data.intervalDays,
      startDate: data.startDate,
      createdBy: data.createdBy,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })

    // Pre-generate request documents
    const batch = writeBatch(db)
    const today = todayKey()
    for (let i = 0; i < (data.type === 'recurring' ? occurrences : 1); i++) {
      const dueDate = addDays(data.startDate, i * data.intervalDays)
      const reqRef = doc(requestsCol(uid))
      batch.set(reqRef, {
        uid,
        scheduleId: schedRef.id,
        dueDate,
        status: dueDate <= today ? 'pending' : 'pending',
        createdAt: now,
      })
    }
    await batch.commit()
    return schedRef.id
  },

  async listSchedulesForStudent(uid: string): Promise<FeedbackSchedule[]> {
    const q = query(schedulesCol(), where('uid', '==', uid), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackSchedule))
  },

  async updateSchedule(
    id: string,
    data: Partial<Pick<FeedbackSchedule, 'status' | 'intervalDays' | 'startDate'>>
  ): Promise<void> {
    await updateDoc(doc(schedulesCol(), id), { ...data, updatedAt: new Date().toISOString() })
  },

  async deleteSchedule(uid: string, scheduleId: string): Promise<void> {
    // Delete all unsubmitted requests for this schedule
    const q = query(
      requestsCol(uid),
      where('scheduleId', '==', scheduleId),
      where('status', '==', 'pending')
    )
    const snap = await getDocs(q)
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    batch.delete(doc(schedulesCol(), scheduleId))
    await batch.commit()
  },

  // ─── Requests ──────────────────────────────────────────────────────────────

  async listRequestsForStudent(uid: string): Promise<FeedbackRequest[]> {
    const q = query(requestsCol(uid), orderBy('dueDate', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackRequest))
  },

  async getPendingRequestForToday(uid: string): Promise<FeedbackRequest | null> {
    const today = todayKey()
    const q = query(
      requestsCol(uid),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'asc'),
      limit(5)
    )
    const snap = await getDocs(q)
    const due = snap.docs.find((d) => d.data().dueDate <= today)
    if (!due) return null
    return { id: due.id, ...due.data() } as FeedbackRequest
  },

  async addOneTimeRequest(
    uid: string,
    dueDate: string,
    createdBy: string
  ): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(requestsCol(uid), {
      uid,
      dueDate,
      status: 'pending',
      createdAt: now,
      createdBy,
    })
    return ref.id
  },

  async deleteRequest(uid: string, requestId: string): Promise<void> {
    await deleteDoc(doc(requestsCol(uid), requestId))
  },

  async updateRequestDate(uid: string, requestId: string, newDate: string): Promise<void> {
    await updateDoc(doc(requestsCol(uid), requestId), { dueDate: newDate })
  },

  // ─── Submit feedback ────────────────────────────────────────────────────────

  async submitFeedback(
    uid: string,
    requestId: string,
    scheduleId: string | undefined,
    dueDate: string,
    responseData: Omit<FeedbackResponse, 'id' | 'uid' | 'requestId' | 'dueDate' | 'submittedAt'>
  ): Promise<void> {
    const now = new Date().toISOString()

    // Save response
    const respRef = doc(responsesCol(uid))
    await setDoc(respRef, {
      ...responseData,
      uid,
      requestId,
      dueDate,
      submittedAt: now,
    })

    // Mark request submitted
    await updateDoc(doc(requestsCol(uid), requestId), {
      status: 'submitted',
      submittedAt: now,
      responseId: respRef.id,
    })

    // If recurring: extend by generating one more request
    if (scheduleId) {
      const schedDoc = await getDoc(doc(schedulesCol(), scheduleId))
      const sched = schedDoc.data() as Omit<FeedbackSchedule, 'id'> | undefined
      if (sched && sched.status === 'active' && sched.type === 'recurring') {
        // Find the furthest existing request for this schedule
        const futureQ = query(
          requestsCol(uid),
          where('scheduleId', '==', scheduleId),
          orderBy('dueDate', 'desc'),
          limit(1)
        )
        const futureSnap = await getDocs(futureQ)
        const lastDue = futureSnap.docs[0]?.data()?.dueDate as string | undefined
        if (lastDue) {
          const nextDue = addDays(lastDue, sched.intervalDays)
          await addDoc(requestsCol(uid), {
            uid,
            scheduleId,
            dueDate: nextDue,
            status: 'pending',
            createdAt: now,
          })
        }
      }
    }
  },

  // ─── History ────────────────────────────────────────────────────────────────

  async listResponsesForStudent(
    uid: string,
    maxResults = 24
  ): Promise<FeedbackResponse[]> {
    const q = query(
      responsesCol(uid),
      orderBy('submittedAt', 'desc'),
      limit(maxResults)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackResponse))
  },
}
