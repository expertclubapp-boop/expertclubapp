import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'expertcoaching-b91e2' })
const uid = '2GI57LeVLcWtyFqPdhUBlVeDJ202'
const today = new Date().toISOString().slice(0, 10)

async function run() {
  const db = admin.firestore()
  const dietSnap = await db.collection('diets').doc('qa-diet').get()
  const diet = dietSnap.data()
  
  // buildFromDiet logic
  const meals = (diet.meals || []).map(meal => ({
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

  const dietDay = {
    uid,
    dateKey: today,
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
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  }

  const ref = db.collection('users').doc(uid).collection('dietDays').doc(today)
  await ref.set(dietDay)
  console.log('--- DIET DAY DATA CREATED ---')
  console.log('Meals count:', dietDay.meals.length)
  console.log('Total Kcal Planned:', dietDay.totalCaloriesPlanned)
  console.log('Items in Meal 1:', dietDay.meals[0].foods.length)
  console.log('Status of Item 1 in Meal 1:', dietDay.meals[0].foods[0].completed)

  // Simulate marking first item as completed
  const updatedMeals = [...dietDay.meals]
  updatedMeals[0].foods[0].completed = true

  let kcal = 0, protein = 0, carbs = 0, fat = 0, completed = 0, total = 0, completedMeals = 0
  for (const meal of updatedMeals) {
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

  const adherencePercent = total > 0 ? Math.round((completed / total) * 100) : 0

  await ref.update({
    meals: updatedMeals,
    totalCaloriesConsumed: kcal,
    totalProteinConsumed: protein,
    totalCarbsConsumed: carbs,
    totalFatConsumed: fat,
    completedItemsCount: completed,
    completedMealsCount: completedMeals,
    adherencePercent,
    updatedAt: admin.firestore.Timestamp.now()
  })

  console.log('--- DIET DAY DATA AFTER ---')
  const snap2 = await ref.get()
  const data2 = snap2.data()
  console.log('Total Kcal Consumed:', data2.totalCaloriesConsumed)
  console.log('Adherence Percent:', data2.adherencePercent)
  console.log('CreatedAt type:', data2.createdAt?.constructor?.name)
  console.log('UpdatedAt type:', data2.updatedAt?.constructor?.name)
  
  process.exit(0)
}

run().catch(console.error)
