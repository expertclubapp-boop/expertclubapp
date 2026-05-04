import { collection, doc, getDocs, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { createAdminCrudService, nowIso, makeId } from './adminCrudService'
import type { Diet, DietSummary, Food } from '../types/domain'
import { COLLECTIONS } from '../lib/firebase/paths'

const baseDietService = createAdminCrudService<Diet>(COLLECTIONS.DIETS, 'diet')
export const adminFoodService = createAdminCrudService<Food>('foods', 'food')

export const adminDietService = {
  ...baseDietService,

  async publish(actor: any, diet: Diet): Promise<void> {
    const batch = writeBatch(db)
    const dietRef = doc(db, COLLECTIONS.DIETS, diet.id)
    const versionId = `v${diet.version + 1}_${Date.now()}`
    const versionRef = doc(db, COLLECTIONS.DIETS, diet.id, 'versions', versionId)

    const summary = calculateDietSummary(diet)
    const publishedPlan: Diet = {
      ...diet,
      status: 'published',
      version: diet.version + 1,
      publishedAt: nowIso(),
      publishedBy: actor.email,
      updatedAt: nowIso(),
      summary
    }

    // Update main doc (the "active" published version)
    batch.set(dietRef, publishedPlan, { merge: true })
    
    // Save to history
    batch.set(versionRef, { ...publishedPlan, isCurrentVersion: true })

    await batch.commit()
  },

  async getVersions(dietId: string): Promise<Diet[]> {
    const versionsRef = collection(db, COLLECTIONS.DIETS, dietId, 'versions')
    const q = query(versionsRef, orderBy('version', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Diet)
  },

  async rollback(actor: any, dietId: string, version: Diet): Promise<void> {
    const dietRef = doc(db, COLLECTIONS.DIETS, dietId)
    const rollbackDraft: Diet = {
      ...version,
      status: 'draft',
      updatedAt: nowIso(),
      updatedBy: actor.email
    }
    delete (rollbackDraft as any).isCurrentVersion
    delete rollbackDraft.publishedAt
    delete rollbackDraft.publishedBy

    await setDoc(dietRef, rollbackDraft, { merge: true })
  }
}

function calculateDietSummary(diet: Diet): DietSummary {
  const items = diet.meals.flatMap(m => m.items)
  return {
    totalKcal: items.reduce((acc, i) => acc + (i.macros?.calories || 0), 0),
    totalProtein: items.reduce((acc, i) => acc + (i.macros?.protein || 0), 0),
    totalCarbs: items.reduce((acc, i) => acc + (i.macros?.carbs || 0), 0),
    totalFat: items.reduce((acc, i) => acc + (i.macros?.fat || 0), 0),
    mealsCount: diet.meals.length,
    itemsCount: items.length
  }
}

export function createEmptyDiet(): Diet {
  return {
    id: makeId('diet'),
    title: '',
    goal: 'fat_loss',
    style: 'simple',
    calories: 1800,
    protein: 140,
    carbs: 180,
    fat: 55,
    mealsPerDay: 4,
    meals: [],
    tags: [],
    level: 'beginner',
    status: 'draft',
    shoppingList: [],
    notes: '',
    version: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createEmptyFood() {
  return {
    id: makeId('food'),
    name: '',
    category: 'protein',
    basePortion: { amount: 100, unit: 'g', label: '100g' },
    macrosPerBasePortion: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    tags: [],
    substitutionGroups: [],
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}
