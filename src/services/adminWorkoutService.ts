import { collection, doc, getDocs, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { createAdminCrudService, makeId, nowFirestoreTimestamp } from './adminCrudService'
import { normalizeFirestoreWriteData, toFirestoreDate } from '../lib/firebase/date'
import type { Exercise, Workout, WorkoutSummary } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'

const baseWorkoutService = createAdminCrudService<Workout>(COLLECTIONS.WORKOUTS, 'workout')
export const adminExerciseService = createAdminCrudService<Exercise>(COLLECTIONS.EXERCISES, 'exercise')

export const adminWorkoutService = {
  ...baseWorkoutService,

  async publish(actor: any, workout: Workout): Promise<void> {
    const batch = writeBatch(db)
    const workoutRef = doc(db, COLLECTIONS.WORKOUTS, workout.id)
    const versionId = `v${workout.version + 1}_${Date.now()}`
    const versionRef = doc(db, COLLECTIONS.WORKOUTS, workout.id, 'versions', versionId)

    const summary = calculateWorkoutSummary(workout)
    const now = nowFirestoreTimestamp()
    const publishedPlan = normalizeFirestoreWriteData({
      ...workout,
      createdAt: toFirestoreDate(workout.createdAt) ?? now,
      status: 'published',
      version: workout.version + 1,
      publishedAt: now,
      publishedBy: actor.email,
      updatedAt: now,
      summary
    })

    batch.set(workoutRef, publishedPlan, { merge: true })
    batch.set(versionRef, { ...publishedPlan, isCurrentVersion: true })

    await batch.commit()
  },

  async getVersions(workoutId: string): Promise<Workout[]> {
    const versionsRef = collection(db, COLLECTIONS.WORKOUTS, workoutId, 'versions')
    const q = query(versionsRef, orderBy('version', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Workout)
  },

  async rollback(actor: any, workoutId: string, version: Workout): Promise<void> {
    const workoutRef = doc(db, COLLECTIONS.WORKOUTS, workoutId)
    const now = nowFirestoreTimestamp()
    const { isCurrentVersion: _isCurrentVersion, publishedAt: _publishedAt, publishedBy: _publishedBy, ...rollbackVersion } = version as Workout & {
      isCurrentVersion?: boolean
    }
    const rollbackDraft = normalizeFirestoreWriteData({
      ...rollbackVersion,
      createdAt: toFirestoreDate(version.createdAt) ?? now,
      status: 'draft',
      updatedAt: now,
      updatedBy: actor.email
    })

    await setDoc(workoutRef, rollbackDraft, { merge: true })
  }
}

function calculateWorkoutSummary(workout: Workout): WorkoutSummary {
  const exercises = workout.days.flatMap(d => d.exercises)
  const muscleGroups = Array.from(new Set(exercises.flatMap(e => e.muscleGroups)))
  
  return {
    workoutsCount: workout.days.length,
    exercisesCount: exercises.length,
    totalSets: exercises.reduce((acc, e) => acc + (e.sets || 0), 0),
    muscleGroups,
    hasVideosCount: exercises.length // Simplification as videoUrl is on the base Exercise not WorkoutExercise
  }
}

export function createEmptyWorkout(): Workout {
  return {
    id: makeId('workout'),
    title: '',
    goal: 'hypertrophy',
    modality: 'bodybuilding',
    level: 'beginner',
    durationMinutes: 60,
    daysPerWeek: 3,
    focus: [],
    tags: [],
    recommendationMetadata: {
      goals: ['hypertrophy'],
      sexes: ['unisex'],
      frequencies: [3],
      levels: ['beginner'],
      locations: ['gym'],
      equipmentProfile: 'full_gym',
      tags: [],
    },
    status: 'draft',
    days: [],
    version: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function createEmptyExercise(): Exercise {
  return {
    id: makeId('exercise'),
    name: '',
    modality: 'bodybuilding',
    muscleGroups: [],
    equipment: 'none',
    level: 'beginner',
    tags: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
