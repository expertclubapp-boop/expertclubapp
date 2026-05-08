import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const staging = args.has('--staging')
const confirmQaProject = args.has('--confirm-qa-project') || process.env.EXPERT_CLUB_CONFIRM_QA_PROJECT === 'true'
const projectIdArg = process.argv.find((arg) => arg.startsWith('--project='))
const projectId =
  projectIdArg?.split('=')[1] ||
  (staging ? process.env.EXPERT_CLUB_STAGING_PROJECT_ID || 'expertclub-staging' : null) ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID

const environment = process.env.EXPERT_CLUB_FIREBASE_ENV || process.env.FIREBASE_ENV || (staging ? 'staging' : 'unconfirmed')

if (!projectId) {
  console.error('Missing Firebase project. Run with --project=<projectId> or set FIREBASE_PROJECT_ID/GCLOUD_PROJECT.')
  process.exit(1)
}

if (environment === 'production') {
  console.error('Refusing to seed prescriptors while EXPERT_CLUB_FIREBASE_ENV/FIREBASE_ENV is production.')
  process.exit(1)
}

if (projectId === 'expertcoaching-b91e2' && !confirmQaProject) {
  console.error('Refusing to write prescriptor seed data to expertcoaching-b91e2 without --confirm-qa-project.')
  console.error('This project is tied to Vercel Production. Use a separate staging project for prescriptor seeds.')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId })
}

const db = admin.firestore()

const nowTimestamp = () => admin.firestore.Timestamp.now()

const foodsSeed = [
  // Proteins
  { id: 'frango', name: 'Peito de Frango', category: 'protein', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 120, protein: 23, carbs: 0, fat: 2 }, tags: ['magro'], substitutionGroup: 'carnes_magras', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'patinho', name: 'Patinho Moido', category: 'protein', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 133, protein: 21, carbs: 0, fat: 5 }, tags: ['magro'], substitutionGroup: 'carnes_magras', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'ovo', name: 'Ovos', category: 'protein', basePortion: { amount: 1, unit: 'unit' }, macrosPerBasePortion: { calories: 70, protein: 6, carbs: 0.5, fat: 5 }, tags: ['pratico'], substitutionGroup: 'ovos', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'tilapia', name: 'Tilapia', category: 'protein', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 96, protein: 20, carbs: 0, fat: 1.7 }, tags: ['magro', 'peixe'], substitutionGroup: 'carnes_magras', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'whey', name: 'Whey Protein', category: 'protein', basePortion: { amount: 30, unit: 'g' }, macrosPerBasePortion: { calories: 120, protein: 24, carbs: 3, fat: 1 }, tags: ['suplemento'], substitutionGroup: 'whey', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'iogurte', name: 'Iogurte Natural', category: 'protein', basePortion: { amount: 170, unit: 'g' }, macrosPerBasePortion: { calories: 90, protein: 8, carbs: 10, fat: 0 }, tags: ['laticinio'], substitutionGroup: 'laticinios', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'tofu', name: 'Tofu', category: 'protein', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 76, protein: 8, carbs: 2, fat: 4 }, tags: ['vegano'], substitutionGroup: 'proteina_vegetal', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },

  // Carbs
  { id: 'arroz-branco', name: 'Arroz Branco', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 130, protein: 2.5, carbs: 28, fat: 0.2 }, tags: ['limpo'], substitutionGroup: 'arroz', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'arroz-integral', name: 'Arroz Integral', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 110, protein: 2.5, carbs: 23, fat: 1 }, tags: ['fibra'], substitutionGroup: 'arroz', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'batata-inglesa', name: 'Batata Inglesa', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 86, protein: 1.7, carbs: 20, fat: 0 }, tags: ['tuberculo'], substitutionGroup: 'tuberculo', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'batata-doce', name: 'Batata Doce', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 86, protein: 1.6, carbs: 20, fat: 0 }, tags: ['tuberculo'], substitutionGroup: 'tuberculo', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'mandioca', name: 'Mandioca', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 160, protein: 1.3, carbs: 38, fat: 0.2 }, tags: ['tuberculo'], substitutionGroup: 'tuberculo', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'macarrao', name: 'Macarrao', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 157, protein: 5.7, carbs: 30, fat: 1 }, tags: ['massa'], substitutionGroup: 'massa', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'aveia', name: 'Aveia', category: 'carbs', basePortion: { amount: 30, unit: 'g' }, macrosPerBasePortion: { calories: 118, protein: 4.5, carbs: 20, fat: 2 }, tags: ['fibra'], substitutionGroup: 'aveia', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'tapioca', name: 'Tapioca', category: 'carbs', basePortion: { amount: 50, unit: 'g' }, macrosPerBasePortion: { calories: 165, protein: 0, carbs: 41, fat: 0 }, tags: ['sem_gluten'], substitutionGroup: 'tapioca', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'pao-frances', name: 'Pao Frances', category: 'carbs', basePortion: { amount: 50, unit: 'g' }, macrosPerBasePortion: { calories: 140, protein: 4.5, carbs: 29, fat: 0 }, tags: ['pao'], substitutionGroup: 'pao', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'banana', name: 'Banana', category: 'carbs', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 89, protein: 1, carbs: 23, fat: 0.3 }, tags: ['fruta'], substitutionGroup: 'fruta', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },

  // Fats
  { id: 'azeite', name: 'Azeite', category: 'fat', basePortion: { amount: 13, unit: 'ml' }, macrosPerBasePortion: { calories: 108, protein: 0, carbs: 0, fat: 12 }, tags: ['oleo'], substitutionGroup: 'oleo', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'pasta-amendoim', name: 'Pasta de Amendoim', category: 'fat', basePortion: { amount: 15, unit: 'g' }, macrosPerBasePortion: { calories: 88, protein: 4, carbs: 3, fat: 7 }, tags: ['castanha'], substitutionGroup: 'pasta', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'castanhas', name: 'Castanhas', category: 'fat', basePortion: { amount: 15, unit: 'g' }, macrosPerBasePortion: { calories: 100, protein: 2, carbs: 3, fat: 9 }, tags: ['castanha'], substitutionGroup: 'castanha', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'abacate', name: 'Abacate', category: 'fat', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 160, protein: 2, carbs: 8, fat: 14 }, tags: ['fruta'], substitutionGroup: 'abacate', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },

  // Veggies
  { id: 'brocolis', name: 'Brocolis', category: 'free', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.3 }, tags: ['vegetal'], substitutionGroup: 'vegetal', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'alface', name: 'Alface', category: 'free', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 15, protein: 1.3, carbs: 2.8, fat: 0.1 }, tags: ['vegetal'], substitutionGroup: 'vegetal', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'tomate', name: 'Tomate', category: 'free', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 18, protein: 0.8, carbs: 3.9, fat: 0.2 }, tags: ['vegetal'], substitutionGroup: 'vegetal', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'mamao', name: 'Mamao', category: 'free', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 43, protein: 0.5, carbs: 11, fat: 0.1 }, tags: ['fruta'], substitutionGroup: 'fruta', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'maca', name: 'Maca', category: 'free', basePortion: { amount: 100, unit: 'g' }, macrosPerBasePortion: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }, tags: ['fruta'], substitutionGroup: 'fruta', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
].map(i => ({ ...i, createdAt: nowTimestamp(), updatedAt: nowTimestamp() }))

const exercisesSeed = [
  { id: 'agachamento-livre', name: 'Agachamento Livre', modality: 'bodybuilding', muscleGroups: ['Quadriceps', 'Gluteos'], primaryMuscleGroup: 'Quadriceps', equipment: 'Barra', level: 'intermediate', instructions: 'Mantenha as costas retas', videoUrl: '', tags: ['composto'], substitutionGroup: 'agachamento', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'leg-press', name: 'Leg Press', modality: 'bodybuilding', muscleGroups: ['Quadriceps'], primaryMuscleGroup: 'Quadriceps', equipment: 'Maquina', level: 'beginner', instructions: '', videoUrl: '', tags: [], substitutionGroup: 'agachamento', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'cadeira-extensora', name: 'Cadeira Extensora', modality: 'bodybuilding', muscleGroups: ['Quadriceps'], primaryMuscleGroup: 'Quadriceps', equipment: 'Maquina', level: 'beginner', instructions: '', videoUrl: '', tags: ['isolado'], substitutionGroup: 'extensao', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'supino-reto', name: 'Supino Reto', modality: 'bodybuilding', muscleGroups: ['Peito', 'Triceps'], primaryMuscleGroup: 'Peito', equipment: 'Barra', level: 'intermediate', instructions: '', videoUrl: '', tags: ['composto'], substitutionGroup: 'supino', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'supino-inclinado', name: 'Supino Inclinado', modality: 'bodybuilding', muscleGroups: ['Peito'], primaryMuscleGroup: 'Peito', equipment: 'Halteres', level: 'intermediate', instructions: '', videoUrl: '', tags: ['composto'], substitutionGroup: 'supino', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'remada-curvada', name: 'Remada Curvada', modality: 'bodybuilding', muscleGroups: ['Costas', 'Biceps'], primaryMuscleGroup: 'Costas', equipment: 'Barra', level: 'intermediate', instructions: '', videoUrl: '', tags: ['composto'], substitutionGroup: 'remada', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'puxada-alta', name: 'Puxada Alta', modality: 'bodybuilding', muscleGroups: ['Costas'], primaryMuscleGroup: 'Costas', equipment: 'Maquina', level: 'beginner', instructions: '', videoUrl: '', tags: [], substitutionGroup: 'puxada', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'desenvolvimento', name: 'Desenvolvimento', modality: 'bodybuilding', muscleGroups: ['Ombros'], primaryMuscleGroup: 'Ombros', equipment: 'Halteres', level: 'intermediate', instructions: '', videoUrl: '', tags: ['composto'], substitutionGroup: 'desenvolvimento', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'rosca-direta', name: 'Rosca Direta', modality: 'bodybuilding', muscleGroups: ['Biceps'], primaryMuscleGroup: 'Biceps', equipment: 'Halteres', level: 'beginner', instructions: '', videoUrl: '', tags: ['isolado'], substitutionGroup: 'rosca', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'triceps-pulley', name: 'Triceps Pulley', modality: 'bodybuilding', muscleGroups: ['Triceps'], primaryMuscleGroup: 'Triceps', equipment: 'Polia', level: 'beginner', instructions: '', videoUrl: '', tags: ['isolado'], substitutionGroup: 'triceps', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'stiff', name: 'Stiff', modality: 'bodybuilding', muscleGroups: ['Posterior'], primaryMuscleGroup: 'Posterior', equipment: 'Barra', level: 'intermediate', instructions: '', videoUrl: '', tags: [], substitutionGroup: 'posterior', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'levantamento-terra', name: 'Levantamento Terra', modality: 'bodybuilding', muscleGroups: ['Posterior', 'Gluteos', 'Costas'], primaryMuscleGroup: 'Posterior', equipment: 'Barra', level: 'advanced', instructions: '', videoUrl: '', tags: ['composto'], substitutionGroup: 'terra', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'prancha', name: 'Prancha', modality: 'home', muscleGroups: ['Core'], primaryMuscleGroup: 'Core', equipment: 'Peso Corporal', level: 'beginner', instructions: '', videoUrl: '', tags: ['isometrico'], substitutionGroup: 'core', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'corrida-leve', name: 'Corrida Leve', modality: 'running', muscleGroups: ['Cardio'], primaryMuscleGroup: 'Cardio', equipment: 'Nenhum', level: 'beginner', instructions: '', videoUrl: '', tags: ['cardio'], substitutionGroup: 'cardio', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'tiro-intervalado', name: 'Tiro Intervalado', modality: 'running', muscleGroups: ['Cardio'], primaryMuscleGroup: 'Cardio', equipment: 'Nenhum', level: 'advanced', instructions: '', videoUrl: '', tags: ['hiit'], substitutionGroup: 'cardio', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'burpee', name: 'Burpee', modality: 'functional', muscleGroups: ['Corpo Todo'], primaryMuscleGroup: 'Cardio', equipment: 'Peso Corporal', level: 'intermediate', instructions: '', videoUrl: '', tags: ['hiit'], substitutionGroup: 'hiit', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', modality: 'functional', muscleGroups: ['Posterior', 'Gluteos'], primaryMuscleGroup: 'Gluteos', equipment: 'Kettlebell', level: 'intermediate', instructions: '', videoUrl: '', tags: ['potencia'], substitutionGroup: 'potencia', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' },
  { id: 'mobilidade-quadril', name: 'Mobilidade de Quadril', modality: 'home', muscleGroups: ['Quadril'], primaryMuscleGroup: 'Quadril', equipment: 'Peso Corporal', level: 'beginner', instructions: '', videoUrl: '', tags: ['mobilidade'], substitutionGroup: 'mobilidade', status: 'active', isSeed: true, source: 'admin-prescriptors-v1' }
].map(i => ({ ...i, createdAt: nowTimestamp(), updatedAt: nowTimestamp() }))

const dietsSeed = [
  {
    id: 'emagrecimento-1600', title: 'Emagrecimento Simples 1600 kcal', goal: 'fat_loss', style: 'simple', calories: 1600, protein: 140, carbs: 120, fat: 55, level: 'beginner', mealsPerDay: 4,
    tags: ['Simples', 'Deficit Leve'], status: 'published',
    meals: [
      { id: 'm1', name: 'Cafe da Manha', timeSuggestion: '08:00', order: 1, items: [
        { id: 'i1', foodId: 'ovo', foodName: 'Ovos', quantity: 2, unit: 'unit', macros: { calories: 140, protein: 12, carbs: 1, fat: 10 } },
        { id: 'i2', foodId: 'pao-frances', foodName: 'Pao Frances', quantity: 50, unit: 'g', macros: { calories: 140, protein: 4.5, carbs: 29, fat: 0 } }
      ]},
      { id: 'm2', name: 'Almoco', timeSuggestion: '13:00', order: 2, items: [
        { id: 'i3', foodId: 'frango', foodName: 'Peito de Frango', quantity: 150, unit: 'g', macros: { calories: 180, protein: 34.5, carbs: 0, fat: 3 } },
        { id: 'i4', foodId: 'arroz-branco', foodName: 'Arroz Branco', quantity: 100, unit: 'g', macros: { calories: 130, protein: 2.5, carbs: 28, fat: 0.2 } },
        { id: 'i5', foodId: 'alface', foodName: 'Alface', quantity: 100, unit: 'g', macros: { calories: 15, protein: 1.3, carbs: 2.8, fat: 0.1 } }
      ]}
    ]
  },
  {
    id: 'emagrecimento-lowcarb', title: 'Emagrecimento Low Carb 1800 kcal', goal: 'fat_loss', style: 'low_carb', calories: 1800, protein: 160, carbs: 80, fat: 85, level: 'intermediate', mealsPerDay: 4,
    tags: ['Low Carb', 'Gorduras Boas'], status: 'published', meals: []
  },
  {
    id: 'hipertrofia-2300', title: 'Hipertrofia Simples 2300 kcal', goal: 'hypertrophy', style: 'simple', calories: 2300, protein: 160, carbs: 280, fat: 60, level: 'beginner', mealsPerDay: 5,
    tags: ['Bulking Limpo'], status: 'published', meals: []
  },
  {
    id: 'hipertrofia-2700', title: 'Hipertrofia 2700 kcal', goal: 'hypertrophy', style: 'simple', calories: 2700, protein: 180, carbs: 340, fat: 70, level: 'intermediate', mealsPerDay: 5,
    tags: ['Bulking', 'Alta Energia'], status: 'published', meals: []
  },
  {
    id: 'recomposicao-2000', title: 'Recomposicao 2000 kcal', goal: 'recomposition', style: 'simple', calories: 2000, protein: 160, carbs: 200, fat: 66, level: 'intermediate', mealsPerDay: 4,
    tags: ['Equilibrio'], status: 'published', meals: []
  }
].map(i => ({ ...i, version: 1, createdAt: nowTimestamp(), updatedAt: nowTimestamp() }))

const workoutsSeed = [
  {
    id: 'iniciante-full-body-3x', title: 'Iniciante Full Body 3x', goal: 'health', modality: 'bodybuilding', level: 'beginner', durationMinutes: 45, daysPerWeek: 3,
    tags: ['Iniciante', 'Corpo Todo'], status: 'published', focus: ['Corpo Todo'],
    days: [
      { id: 'd1', name: 'Treino A', order: 1, exercises: [
        { id: 'e1', exerciseId: 'agachamento-livre', exerciseName: 'Agachamento Livre', sets: 3, reps: '10-12', restSeconds: 60, muscleGroups: ['Quadriceps'] },
        { id: 'e2', exerciseId: 'supino-reto', exerciseName: 'Supino Reto', sets: 3, reps: '10-12', restSeconds: 60, muscleGroups: ['Peito'] }
      ]}
    ]
  },
  {
    id: 'hipertrofia-abc-3x', title: 'Hipertrofia ABC 3x', goal: 'hypertrophy', modality: 'bodybuilding', level: 'intermediate', durationMinutes: 60, daysPerWeek: 3,
    tags: ['Hipertrofia', 'ABC'], status: 'published', focus: ['Hipertrofia'], days: []
  },
  {
    id: 'upper-lower-4x', title: 'Upper Lower 4x', goal: 'hypertrophy', modality: 'bodybuilding', level: 'advanced', durationMinutes: 70, daysPerWeek: 4,
    tags: ['Powerbuilding'], status: 'published', focus: ['Forca'], days: []
  },
  {
    id: 'emagrecimento-3x-cardio', title: 'Emagrecimento 3x + Cardio', goal: 'fat_loss', modality: 'bodybuilding', level: 'beginner', durationMinutes: 50, daysPerWeek: 3,
    tags: ['Circuito', 'Gasto Calorico'], status: 'published', focus: ['Emagrecimento'], days: []
  },
  {
    id: 'treino-casa-3x', title: 'Treino em Casa 3x', goal: 'health', modality: 'home', level: 'beginner', durationMinutes: 30, daysPerWeek: 3,
    tags: ['Sem Equipamento'], status: 'published', focus: ['Condicionamento'], days: []
  }
].map(i => ({ ...i, version: 1, createdAt: nowTimestamp(), updatedAt: nowTimestamp() }))

async function main() {
  if (dryRun) {
    console.log('Dry run enabled. Would seed:')
    console.log(`Foods: ${foodsSeed.length}`)
    console.log(`Exercises: ${exercisesSeed.length}`)
    console.log(`Diets: ${dietsSeed.length}`)
    console.log(`Workouts: ${workoutsSeed.length}`)
    return
  }

  const batch = db.batch()
  let count = 0

  const commitBatchIfNeeded = async () => {
    if (count > 0 && count % 500 === 0) {
      await batch.commit()
    }
  }

  for (const item of foodsSeed) {
    batch.set(db.collection('foods').doc(item.id), item, { merge: true })
    count++
    await commitBatchIfNeeded()
  }

  for (const item of exercisesSeed) {
    batch.set(db.collection('exercises').doc(item.id), item, { merge: true })
    count++
    await commitBatchIfNeeded()
  }

  for (const item of dietsSeed) {
    batch.set(db.collection('diets').doc(item.id), item, { merge: true })
    count++
    await commitBatchIfNeeded()
  }

  for (const item of workoutsSeed) {
    batch.set(db.collection('workouts').doc(item.id), item, { merge: true })
    count++
    await commitBatchIfNeeded()
  }

  if (count % 500 !== 0) {
    await batch.commit()
  }

  console.log(`Seed completed successfully: ${count} items seeded.`)
  console.log(`Foods: ${foodsSeed.length}`)
  console.log(`Exercises: ${exercisesSeed.length}`)
  console.log(`Diets: ${dietsSeed.length}`)
  console.log(`Workouts: ${workoutsSeed.length}`)
}

main().catch(console.error)
