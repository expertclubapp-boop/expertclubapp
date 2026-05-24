import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  setDoc,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { COLLECTIONS } from '../lib/firebase/paths'
import { dietService } from './dietService'
import { profileService } from './profileService'
import { workoutService } from './workoutService'
import type {
  Diet,
  DietRecommendationGoal,
  DietRecommendationMetadata,
  PlanSelection,
  RecommendationDietPreference,
  RecommendationScore,
  RecommendedDiet,
  RecommendedWorkout,
  StudentPreferences,
  StudentRecommendations,
  UserGoal,
  Workout,
  WorkoutRecommendationGoal,
  WorkoutRecommendationMetadata,
} from '../types/domain'

const MAX_RECOMMENDATIONS = 3

function hasValue<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

function toWorkoutGoal(goal?: Workout['goal'] | UserGoal): WorkoutRecommendationGoal | null {
  switch (goal) {
    case 'hypertrophy':
    case 'fat_loss':
    case 'maintenance':
    case 'performance':
    case 'strength':
      return goal
    case 'recomposition':
      return 'maintenance'
    case 'conditioning':
    case 'health':
    case 'endurance':
      return 'performance'
    default:
      return null
  }
}

function toDietGoal(goal?: Diet['goal'] | UserGoal): DietRecommendationGoal | null {
  switch (goal) {
    case 'hypertrophy':
    case 'fat_loss':
    case 'maintenance':
    case 'performance':
      return goal
    case 'recomposition':
      return 'maintenance'
    case 'health':
    case 'strength':
    case 'endurance':
      return 'performance'
    default:
      return null
  }
}

function getWorkoutMetadata(template: Workout): WorkoutRecommendationMetadata {
  const metadata = template.recommendationMetadata ?? {}
  return {
    goals: metadata.goals?.length ? metadata.goals : [toWorkoutGoal(template.goal)].filter(hasValue),
    sexes: metadata.sexes?.length ? metadata.sexes : ['unisex'],
    frequencies: metadata.frequencies?.length ? metadata.frequencies : [template.daysPerWeek].filter((value): value is 3 | 4 | 5 | 6 => [3, 4, 5, 6].includes(value)),
    levels: metadata.levels?.length ? metadata.levels : [template.level],
    locations: metadata.locations?.length
      ? metadata.locations
      : template.modality === 'home'
        ? ['home', 'mixed']
        : ['gym', 'mixed'],
    equipmentProfile: metadata.equipmentProfile ?? (template.modality === 'home' ? 'bodyweight' : 'full_gym'),
    tags: metadata.tags?.length ? metadata.tags : template.tags,
  }
}

function getDietMetadata(template: Diet): DietRecommendationMetadata {
  const metadata = template.recommendationMetadata ?? {}
  const fallbackPreferences: RecommendationDietPreference[] = []
  if (template.style === 'low_carb') fallbackPreferences.push('low_carb')
  if (template.style === 'vegetarian') fallbackPreferences.push('vegetarian')
  if (template.style === 'carnivore') fallbackPreferences.push('carnivore')
  if (template.style === 'economic') fallbackPreferences.push('economic')
  if (template.style === 'simple' && fallbackPreferences.length === 0) fallbackPreferences.push('flexible')

  return {
    goals: metadata.goals?.length ? metadata.goals : [toDietGoal(template.goal)].filter(hasValue),
    sexes: metadata.sexes?.length ? metadata.sexes : ['unisex'],
    preferences: metadata.preferences?.length ? metadata.preferences : fallbackPreferences,
    caloriesRange: metadata.caloriesRange ?? {
      min: Math.max(1200, template.calories - 150),
      max: template.calories + 150,
    },
    proteinLevel: metadata.proteinLevel ?? (template.protein >= 150 ? 'high' : 'standard'),
    complexity: metadata.complexity ?? (template.level === 'advanced' ? 'advanced' : template.level === 'intermediate' ? 'medium' : 'easy'),
    tags: metadata.tags?.length ? metadata.tags : template.tags,
  }
}

function estimateDietCalories(profile: StudentPreferences): number | null {
  if (!profile.weightKg || !profile.heightCm || !profile.sex) return null
  const weight = profile.weightKg
  const height = profile.heightCm
  const age = 30
  const sexFactor = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + sexFactor
  const activityFactor = profile.trainingFrequency && profile.trainingFrequency >= 5 ? 1.6 : profile.trainingFrequency === 4 ? 1.5 : 1.4
  const maintenance = Math.round(bmr * activityFactor)
  if (profile.goal === 'fat_loss') return maintenance - 300
  if (profile.goal === 'hypertrophy') return maintenance + 200
  if (profile.goal === 'performance') return maintenance + 100
  return maintenance
}

function badgeForIndex(index: number): 'best_match' | 'good_option' | 'alternative' {
  if (index === 0) return 'best_match'
  if (index === 1) return 'good_option'
  return 'alternative'
}

export function isProfileReadyForRecommendations(profile: StudentPreferences | null | undefined): profile is StudentPreferences {
  return Boolean(
    profile?.sex &&
      profile.weightKg &&
      profile.heightCm &&
      profile.goal &&
      profile.trainingFrequency &&
      profile.trainingLevel &&
      profile.trainingLocation &&
      profile.dietPreference &&
      profile.waterGoalMl,
  )
}

export function scoreWorkout(template: Workout, profile: StudentPreferences): RecommendationScore {
  const metadata = getWorkoutMetadata(template)
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0

  const profileGoal = toWorkoutGoal(profile.goal)
  if (profileGoal && metadata.goals?.includes(profileGoal)) {
    score += 40
    reasons.push(`Combina com seu objetivo de ${profileGoal === 'fat_loss' ? 'emagrecimento' : profileGoal === 'hypertrophy' ? 'hipertrofia' : profileGoal === 'maintenance' ? 'manutenção' : profileGoal === 'performance' ? 'performance' : 'força'}`)
  } else {
    warnings.push('Objetivo do plano não é o encaixe mais forte para você agora')
  }

  if (profile.trainingFrequency && metadata.frequencies?.includes(profile.trainingFrequency as 3 | 4 | 5 | 6)) {
    score += 25
    reasons.push(`Compatível com treino ${profile.trainingFrequency}x por semana`)
  } else {
    warnings.push('Frequência do plano pode fugir da sua rotina semanal')
  }

  if (profile.trainingLevel && metadata.levels?.includes(profile.trainingLevel)) {
    score += 15
    reasons.push(`Plano indicado para nível ${profile.trainingLevel === 'beginner' ? 'iniciante' : profile.trainingLevel === 'intermediate' ? 'intermediário' : 'avançado'}`)
  }

  if (profile.sex && metadata.sexes?.includes(profile.sex === 'male' || profile.sex === 'female' ? profile.sex : 'unisex') || metadata.sexes?.includes('unisex')) {
    score += 10
    reasons.push('Plano compatível com seu perfil')
  }

  if (profile.trainingLocation && metadata.locations?.includes(profile.trainingLocation === 'outdoor' ? 'mixed' : profile.trainingLocation)) {
    score += 10
    reasons.push(`Pensado para treinar em ${profile.trainingLocation === 'gym' ? 'academia' : profile.trainingLocation === 'home' ? 'casa' : 'formato misto'}`)
  } else {
    warnings.push('Local de treino pode exigir adaptação')
  }

  if (score < 40) {
    warnings.push('Plano com encaixe parcial. Vale revisar antes de escolher.')
  }

  return { score, reasons, warnings: warnings.length ? warnings : undefined }
}

export function scoreDiet(template: Diet, profile: StudentPreferences): RecommendationScore {
  const metadata = getDietMetadata(template)
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0

  const profileGoal = toDietGoal(profile.goal)
  if (profileGoal && metadata.goals?.includes(profileGoal)) {
    score += 35
    reasons.push(`Combina com seu objetivo de ${profileGoal === 'fat_loss' ? 'emagrecimento' : profileGoal === 'hypertrophy' ? 'hipertrofia' : profileGoal === 'maintenance' ? 'manutenção' : 'performance'}`)
  } else {
    warnings.push('Objetivo da dieta não é o encaixe principal para seu momento')
  }

  if (profile.dietPreference && metadata.preferences?.includes(profile.dietPreference as RecommendationDietPreference)) {
    score += 30
    reasons.push(`Dieta ${profile.dietPreference === 'economic' ? 'econômica' : profile.dietPreference === 'flexible' ? 'flexível' : profile.dietPreference === 'low_carb' ? 'low carb' : profile.dietPreference === 'vegetarian' ? 'vegetariana' : 'carnívora'} alinhada à sua preferência`)
  } else if (!metadata.preferences?.length) {
    score += 10
    reasons.push('Dieta com proposta ampla para diferentes preferências')
  } else {
    warnings.push('Preferência alimentar pode pedir ajustes')
  }

  const estimatedCalories = estimateDietCalories(profile)
  if (estimatedCalories && metadata.caloriesRange && estimatedCalories >= metadata.caloriesRange.min && estimatedCalories <= metadata.caloriesRange.max) {
    score += 20
    reasons.push(`Faixa calórica próxima da sua necessidade atual`)
  } else if (estimatedCalories) {
    warnings.push('Faixa calórica é uma aproximação, não o encaixe ideal')
  }

  if (profile.sex && (metadata.sexes?.includes(profile.sex === 'male' || profile.sex === 'female' ? profile.sex : 'unisex') || metadata.sexes?.includes('unisex'))) {
    score += 10
    reasons.push('Plano alimentar compatível com seu perfil')
  }

  if (profile.trainingLevel) {
    const preferredComplexity =
      profile.trainingLevel === 'beginner'
        ? 'easy'
        : profile.trainingLevel === 'intermediate'
          ? 'medium'
          : 'advanced'
    if (metadata.complexity === preferredComplexity) {
      score += 5
      reasons.push('Complexidade alinhada ao seu momento atual')
    }
  }

  if (score < 35) {
    warnings.push('Dieta com encaixe parcial. Você pode preferir outra opção primeiro.')
  }

  return { score, reasons, warnings: warnings.length ? warnings : undefined }
}

function toRecommendedWorkouts(workouts: Workout[], profile: StudentPreferences): RecommendedWorkout[] {
  return workouts
    .map((template) => {
      const result = scoreWorkout(template, profile)
      return {
        template,
        score: result.score,
        reasons: result.reasons,
        warnings: result.warnings,
        badge: 'alternative' as const,
      }
    })
    .sort((left, right) => right.score - left.score || left.template.title.localeCompare(right.template.title))
    .slice(0, MAX_RECOMMENDATIONS)
    .map((item, index) => ({ ...item, badge: badgeForIndex(index) }))
}

function toRecommendedDiets(diets: Diet[], profile: StudentPreferences): RecommendedDiet[] {
  return diets
    .map((template) => {
      const result = scoreDiet(template, profile)
      return {
        template,
        score: result.score,
        reasons: result.reasons,
        warnings: result.warnings,
        badge: 'alternative' as const,
      }
    })
    .sort((left, right) => right.score - left.score || left.template.title.localeCompare(right.template.title))
    .slice(0, MAX_RECOMMENDATIONS)
    .map((item, index) => ({ ...item, badge: badgeForIndex(index) }))
}

async function writePlanSelection(params: {
  uid: string
  type: 'workout' | 'diet'
  templateId: string
  score: number
  reasons: string[]
}): Promise<void> {
  const selectionsRef = collection(db, 'users', params.uid, 'planSelections')
  const selectionRef = doc(selectionsRef)

  try {
    await setDoc(selectionRef, {
      id: selectionRef.id,
      uid: params.uid,
      type: params.type,
      templateId: params.templateId,
      selectedBy: 'student',
      selectedAt: serverTimestamp(),
      source: 'recommendation',
      score: params.score,
      reasons: params.reasons,
    })
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'permission-denied') {
      return
    }
    throw error
  }
}

export const recommendationService = {
  async getStudentRecommendations(uid: string): Promise<StudentRecommendations> {
    const profile = await profileService.getProfile(uid)
    if (!isProfileReadyForRecommendations(profile)) {
      throw new Error('Perfil incompleto para gerar recomendações.')
    }

    const [workouts, diets] = await Promise.all([
      workoutService.getAllPublished(),
      dietService.getAllPublished(),
    ])

    return {
      workouts: toRecommendedWorkouts(workouts, profile),
      diets: toRecommendedDiets(diets, profile),
      profile,
      generatedAt: Timestamp.now(),
    }
  },

  async selectWorkout(params: {
    uid: string
    workoutId: string
    score: number
    reasons: string[]
  }): Promise<void> {
    const profileRef = doc(db, COLLECTIONS.PROFILES, params.uid)
    const profileSnap = await getDoc(profileRef)
    const existingProfile = profileSnap.exists() ? profileSnap.data() : null

    await setDoc(
      profileRef,
      {
        uid: params.uid,
        selectedWorkoutId: params.workoutId,
        recommendationsNeedRefresh: false,
        updatedAt: serverTimestamp(),
        ...(existingProfile?.createdAt ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    )

    await writePlanSelection({
      uid: params.uid,
      type: 'workout',
      templateId: params.workoutId,
      score: params.score,
      reasons: params.reasons,
    })
  },

  async selectDiet(params: {
    uid: string
    dietId: string
    score: number
    reasons: string[]
  }): Promise<void> {
    const profileRef = doc(db, COLLECTIONS.PROFILES, params.uid)
    const profileSnap = await getDoc(profileRef)
    const existingProfile = profileSnap.exists() ? profileSnap.data() : null

    await setDoc(
      profileRef,
      {
        uid: params.uid,
        selectedDietId: params.dietId,
        recommendationsNeedRefresh: false,
        updatedAt: serverTimestamp(),
        ...(existingProfile?.createdAt ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    )

    await writePlanSelection({
      uid: params.uid,
      type: 'diet',
      templateId: params.dietId,
      score: params.score,
      reasons: params.reasons,
    })
  },

  async listPlanSelections(uid: string): Promise<PlanSelection[]> {
    const selectionsRef = collection(db, 'users', uid, 'planSelections')
    const selectionsQuery = query(selectionsRef, orderBy('selectedAt', 'desc'), limit(20))
    const snap = await getDocs(selectionsQuery)
    return snap.docs.map((entry) => entry.data() as PlanSelection)
  },
}
