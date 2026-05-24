import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { safeDateKey } from '../lib/firebase/date'
import { dietDayService } from '../services/dietDayService'
import { useDiet } from './useDiets'
import { useProfile } from './useProfile'
import type { DietDay, Food } from '../types/domain'

export function useDietDay() {
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const { diet } = useDiet(profile?.selectedDietId)
  const [dietDay, setDietDay] = useState<DietDay | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const dateKey = safeDateKey()

  useEffect(() => {
    setIsLoading(true)

    if (!firebaseUser || !diet) {
      setDietDay(null)
      setIsLoading(false)
      return
    }

    async function load() {
      const activeDiet = diet
      if (!activeDiet) {
        setDietDay(null)
        return
      }
      try {
        let existing = await dietDayService.getToday(firebaseUser!.uid, dateKey)
        if (!existing || dietDayService.needsRebuild(existing, activeDiet)) {
          existing = dietDayService.buildFromDiet(firebaseUser!.uid, activeDiet, dateKey)
          await dietDayService.saveDay(firebaseUser!.uid, existing)
        }
        setDietDay(existing)
      } catch (err) {
        console.error('Error loading diet day:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [firebaseUser, diet, dateKey])

  const toggleFood = useCallback(async (mealId: string, foodId: string) => {
    if (!firebaseUser || !dietDay) return

    const updated = {
      ...dietDay,
      meals: dietDay.meals.map(meal => {
        if (meal.mealId !== mealId) return meal
        return {
          ...meal,
          foods: meal.foods.map(food => {
            if (food.foodId !== foodId) return food
            return { ...food, completed: !food.completed }
          }),
        }
      }),
    }

    const recalculated = dietDayService.recalculate(updated)
    setDietDay(recalculated)

    try {
      await dietDayService.saveDay(firebaseUser.uid, recalculated)
    } catch (err) {
      console.error('Error saving diet day:', err)
    }
  }, [firebaseUser, dietDay])

  const substituteFood = useCallback(async (mealId: string, foodId: string, alternative: Food) => {
    if (!firebaseUser || !dietDay) return

    const updated = {
      ...dietDay,
      meals: dietDay.meals.map(meal => {
        if (meal.mealId !== mealId) return meal
        return {
          ...meal,
          foods: meal.foods.map(food => {
            if (food.foodId !== foodId) return food
            return {
              ...food,
              foodId: alternative.id,
              foodName: alternative.name,
              amount: `${alternative.basePortion?.amount || ''}${alternative.basePortion?.unit || ''}`,
              substitutedWith: alternative.name,
              kcal: alternative.macrosPerBasePortion?.calories || 0,
              macros: {
                carbs: alternative.macrosPerBasePortion?.carbs || 0,
                protein: alternative.macrosPerBasePortion?.protein || 0,
                fat: alternative.macrosPerBasePortion?.fat || 0,
              },
              completed: false,
            }
          }),
        }
      }),
    }

    const recalculated = dietDayService.recalculate(updated)
    setDietDay(recalculated)

    try {
      await dietDayService.saveDay(firebaseUser.uid, recalculated)
    } catch (err) {
      console.error('Error saving substituted food:', err)
    }
  }, [firebaseUser, dietDay])

  return { dietDay, diet, isLoading, toggleFood, substituteFood, dateKey }
}
