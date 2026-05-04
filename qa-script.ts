import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

// We mock the db into the service
import { dietService } from './src/services/dietService'
import { workoutService } from './src/services/workoutService'
import { foodService } from './src/services/foodService'
import { exerciseService } from './src/services/exerciseService'

async function run() {
  console.log('--- Starting Integration QA Script ---')

  const foods = await foodService.getActiveFoods()
  if (foods.length === 0) throw new Error('No foods found')
  
  console.log('Creating test diet...')
  const dietId = await dietService.create({
    title: 'QA Test Diet',
    goal: 'fat_loss',
    style: 'simple',
    level: 'beginner',
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 60,
    mealsPerDay: 1,
    tags: ['qa', 'test'],
    meals: [
      {
        id: 'meal_1',
        name: 'Café da manhã QA',
        order: 1,
        items: [
          {
            id: 'item_1',
            foodId: foods[0].id,
            foodName: foods[0].name,
            quantity: foods[0].basePortion.amount,
            unit: foods[0].basePortion.unit,
            macros: {
              calories: foods[0].macrosPerBasePortion.calories,
              protein: foods[0].macrosPerBasePortion.protein,
              carbs: foods[0].macrosPerBasePortion.carbs,
              fat: foods[0].macrosPerBasePortion.fat
            }
          }
        ]
      }
    ],
    status: 'draft',
    version: 1
  })
  
  console.log(`Test diet created successfully: ${dietId}`)

  const exercises = await exerciseService.getActiveExercises()
  if (exercises.length === 0) throw new Error('No exercises found')

  console.log('Creating test workout...')
  const workoutId = await workoutService.create({
    title: 'QA Test Workout',
    goal: 'hypertrophy',
    modality: 'bodybuilding',
    level: 'beginner',
    daysPerWeek: 1,
    durationMinutes: 45,
    focus: ['qa'],
    tags: ['qa'],
    days: [
      {
        id: 'day_1',
        name: 'Dia A QA',
        order: 1,
        exercises: [
          {
            id: 'wo_ex_1',
            exerciseId: exercises[0].id,
            exerciseName: exercises[0].name,
            muscleGroups: exercises[0].muscleGroups,
            equipment: exercises[0].equipment || 'none',
            sets: 3,
            reps: '10',
            restSeconds: 60
          }
        ]
      }
    ],
    status: 'draft',
    version: 1
  })

  console.log(`Test workout created successfully: ${workoutId}`)

  console.log('Cleaning up...')
  // Clean up
  const { doc, deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'diets', dietId))
  await deleteDoc(doc(db, 'workouts', workoutId))
  console.log('QA DB script complete.')
  process.exit(0)
}

run().catch(console.error)
