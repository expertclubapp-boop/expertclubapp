import { collection, doc, getDocs, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { createAdminCrudService, nowIso, makeId } from './adminCrudService'
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
    const publishedPlan: Workout = {
      ...workout,
      status: 'published',
      version: workout.version + 1,
      publishedAt: nowIso(),
      publishedBy: actor.email,
      updatedAt: nowIso(),
      summary
    }

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
    const rollbackDraft: Workout = {
      ...version,
      status: 'draft',
      updatedAt: nowIso(),
      updatedBy: actor.email
    }
    delete (rollbackDraft as any).isCurrentVersion
    delete rollbackDraft.publishedAt
    delete rollbackDraft.publishedBy

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
    status: 'draft',
    days: [],
    version: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
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
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}
