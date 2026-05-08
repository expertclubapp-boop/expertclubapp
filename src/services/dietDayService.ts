import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { nowTimestamp, toFirestoreDate } from '../lib/firebase/date'
import { COLLECTIONS, SUB_COLLECTIONS, getSubCollectionPath } from '../lib/firebase/paths'
import type { DietDay, DietDayMealLog, Diet } from '../types/domain'
import { challengeScoringService } from './challengeScoringService'

export const dietDayService = {
  async getToday(uid: string, dateKey: string): Promise<DietDay | null> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.DIET_DAYS)
    const docRef = doc(db, path, dateKey)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as DietDay) : null
  },

  async saveDay(uid: string, dietDay: DietDay): Promise<void> {
    const path = getSubCollectionPath(COLLECTIONS.USERS, uid, SUB_COLLECTIONS.DIET_DAYS)
    const docRef = doc(db, path, dietDay.dateKey)
    await setDoc(docRef, {
      ...dietDay,
      createdAt: toFirestoreDate(dietDay.createdAt as any) ?? nowTimestamp(),
      updatedAt: nowTimestamp(),
    }, { merge: true })

    // Non-blocking scoring
    challengeScoringService.processUserAction({
      uid,
      sourceType: 'diet_adherence',
      sourceId: dietDay.dateKey,
      additionalData: { adherencePercent: dietDay.adherencePercent }
    }).catch(console.error)
  },

  /** Build a fresh DietDay from a Diet template */
  buildFromDiet(uid: string, diet: Diet, dateKey: string): DietDay {
    const meals: DietDayMealLog[] = (diet.meals || []).map(meal => ({
      mealId: meal.id,
      mealName: meal.name,
      foods: meal.items.map(item => ({
        foodId: item.foodId,
        foodName: item.foodName,
        amount: `${item.quantity}${item.unit}`,
        completed: false,
        kcal: item.macros?.calories ?? 0,
        macros: {
          carbs: item.macros?.carbs ?? 0,
          protein: item.macros?.protein ?? 0,
          fat: item.macros?.fat ?? 0,
        },
      })),
    }))

    const totalItems = meals.reduce((sum, m) => sum + m.foods.length, 0)

    return {
      uid,
      dateKey,
      dietId: diet.id,
      meals,
      totalCaloriesPlanned: diet.calories ?? 0,
      totalCaloriesConsumed: 0,
      totalProteinPlanned: diet.protein ?? 0,
      totalProteinConsumed: 0,
      totalCarbsPlanned: diet.carbs ?? 0,
      totalCarbsConsumed: 0,
      totalFatPlanned: diet.fat ?? 0,
      totalFatConsumed: 0,
      adherencePercent: 0,
      completedMealsCount: 0,
      completedItemsCount: 0,
      totalItemsCount: totalItems,
      createdAt: nowTimestamp() as any,
      updatedAt: nowTimestamp() as any,
    }
  },

  /** Recalculate consumed macros and adherence from meal logs */
  recalculate(day: DietDay): DietDay {
    let kcal = 0, protein = 0, carbs = 0, fat = 0, completed = 0, total = 0, completedMeals = 0

    for (const meal of day.meals) {
      let mealCompleted = 0
      for (const food of meal.foods) {
        total++
        if (food.completed) {
          completed++
          mealCompleted++
          kcal += food.kcal
          protein += food.macros.protein
          carbs += food.macros.carbs
          fat += food.macros.fat
        }
      }
      if (meal.foods.length > 0 && mealCompleted === meal.foods.length) completedMeals++
    }

    return {
      ...day,
      totalCaloriesConsumed: kcal,
      totalProteinConsumed: protein,
      totalCarbsConsumed: carbs,
      totalFatConsumed: fat,
      completedItemsCount: completed,
      completedMealsCount: completedMeals,
      totalItemsCount: total,
      adherencePercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  },
}
