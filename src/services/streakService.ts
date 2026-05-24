import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { nowTimestamp, safeDateKey } from '../lib/firebase/date'
import { COLLECTIONS } from '../lib/firebase/paths'
import { track } from '../lib/analytics'

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365]

function todayKey() {
  return safeDateKey(new Date())
}

function yesterdayKey() {
  return safeDateKey(new Date(Date.now() - 86_400_000))
}

function computeNewStreak(
  current: number,
  longest: number,
  lastDate: string | undefined,
  today: string,
): { newStreak: number; newLongest: number; changed: boolean; milestone: number | null } {
  if (lastDate === today) {
    return { newStreak: current, newLongest: longest, changed: false, milestone: null }
  }

  const newStreak = lastDate === yesterdayKey() ? current + 1 : 1
  const newLongest = Math.max(longest, newStreak)
  const milestone = STREAK_MILESTONES.includes(newStreak) ? newStreak : null

  return { newStreak, newLongest, changed: true, milestone }
}

export const streakService = {
  async recordActivity(uid: string): Promise<{ currentStreak: number; milestone: number | null }> {
    const profileRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(profileRef)

    const data = snap.exists() ? snap.data() : {}
    const current: number = typeof data.currentStreak === 'number' ? data.currentStreak : 0
    const longest: number = typeof data.longestStreak === 'number' ? data.longestStreak : 0
    const lastDate: string | undefined = data.lastStreakActivityDate

    const today = todayKey()
    const { newStreak, newLongest, changed, milestone } = computeNewStreak(current, longest, lastDate, today)

    if (changed) {
      await setDoc(
        profileRef,
        {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastStreakActivityDate: today,
          updatedAt: nowTimestamp(),
        },
        { merge: true },
      )

      if (milestone) {
        track('streak_milestone', { days: milestone })
      }
    }

    return { currentStreak: newStreak, milestone }
  },

  async getStreak(uid: string): Promise<{ currentStreak: number; longestStreak: number; lastDate: string | undefined }> {
    const profileRef = doc(db, COLLECTIONS.PROFILES, uid)
    const snap = await getDoc(profileRef)
    const data = snap.exists() ? snap.data() : {}
    return {
      currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 0,
      longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : 0,
      lastDate: data.lastStreakActivityDate,
    }
  },
}
