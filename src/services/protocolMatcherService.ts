import type { Diet, Workout, UserGoal } from '../types/domain'

export interface ProtocolAnswers {
  goal: UserGoal
  dietStyle?: string
  modality?: string
  trainingDays?: number
  durationMinutes?: number
}

function scoreWorkout(workout: Workout, answers: ProtocolAnswers) {
  let score = 0
  if (workout.goal === answers.goal) score += 5
  if (answers.modality && (workout.modality === answers.modality || workout.tags?.includes(answers.modality))) score += 3
  if (answers.trainingDays && workout.daysPerWeek === answers.trainingDays) score += 2
  if (answers.durationMinutes && Math.abs(workout.durationMinutes - answers.durationMinutes) <= 15) score += 2
  return score
}

function scoreDiet(diet: Diet, answers: ProtocolAnswers) {
  let score = 0
  if (diet.goal === answers.goal) score += 5
  if (answers.dietStyle && (diet.style === answers.dietStyle || diet.tags?.includes(answers.dietStyle))) score += 3
  return score
}

export const protocolMatcherService = {
  match(workouts: Workout[], diets: Diet[], answers: ProtocolAnswers) {
    const recommendedWorkouts = [...workouts]
      .sort((a, b) => scoreWorkout(b, answers) - scoreWorkout(a, answers))
      .slice(0, 3)

    const recommendedDiets = [...diets]
      .sort((a, b) => scoreDiet(b, answers) - scoreDiet(a, answers))
      .slice(0, 3)

    return { recommendedWorkouts, recommendedDiets }
  },
}
