import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calculator, ChevronDown, Copy, Plus, Search, Trash2,
  Utensils, Zap,
} from 'lucide-react'
import { dietService } from '../../services/dietService'
import { foodService } from '../../services/foodService'
import { toastError } from '../../components/ui/Toast'
import type { Diet, DietMeal, DietMealItem, Food } from '../../types/domain'

// ─── Consts ───────────────────────────────────────────────────

const MEAL_PRESETS = [
  'Café da Manhã', 'Lanche Manhã', 'Almoço',
  'Lanche Tarde', 'Pré-Treino', 'Pós-Treino', 'Jantar',
]

const FOOD_CATEGORY_CHIPS = [
  { id: 'protein',      label: 'Proteína' },
  { id: 'carbohydrate', label: 'Carbo' },
  { id: 'fat',          label: 'Gordura' },
  { id: 'vegetable',    label: 'Vegetal' },
  { id: 'fruit',        label: 'Fruta' },
  { id: 'dairy',        label: 'Laticínio' },
  { id: 'supplement',   label: 'Suplemento' },
]

const MACRO_PRESETS = [
  { id: 'cutting',      label: 'Cutting',    p: 40, c: 40, f: 20 },
  { id: 'hypertrophy',  label: 'Hipertrofia',p: 30, c: 50, f: 20 },
  { id: 'low_carb',     label: 'Low Carb',   p: 40, c: 20, f: 40 },
  { id: 'maintenance',  label: 'Manutenção', p: 30, c: 45, f: 25 },
] as const

const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Emagrecimento', hypertrophy: 'Hipertrofia',
  recomposition: 'Recomp', maintenance: 'Manutenção', health: 'Saúde',
}

const STYLE_LABELS: Record<string, string> = {
  simple: 'Simples', low_carb: 'Low Carb', intermittent_fasting: 'Jejum',
  vegetarian: 'Vegetariana', economic: 'Econômica',
}

const emptyDiet = (): Omit<Diet, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> => ({
  title: '', description: '', goal: 'fat_loss', style: 'simple',
  level: 'beginner', calories: 0, protein: 0, carbs: 0, fat: 0,
  mealsPerDay: 0, tags: [], meals: [], shoppingList: [], notes: '', status: 'draft', version: 1,
})

// ─── Helpers ─────────────────────────────────────────────────

function calcTotals(meals: DietMeal[]) {
  return meals.reduce(
    (acc, m) => m.items.reduce((a, i) => ({
      calories: a.calories + i.macros.calories,
      protein:  a.protein  + i.macros.protein,
      carbs:    a.carbs    + i.macros.carbs,
      fat:      a.fat      + i.macros.fat,
    }), acc),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// ─── Main screen ──────────────────────────────────────────────

export function MentorDietPrescriptorScreen() {
  const [diets, setDiets] = useState<Diet[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [editing, setEditing] = useState<Omit<Diet, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    dietService.getAll()
      .then(setDiets)
      .finally(() => setIsLoadingList(false))
  }, [])

  function openNew() {
    setEditing(emptyDiet())
    setEditingId(null)
  }

  function openEdit(diet: Diet) {
    const { id, createdAt, updatedAt, publishedAt, ...rest } = diet as any
    setEditing(rest)
    setEditingId(diet.id)
  }

  async function handleSaved(saved: Diet) {
    setDiets(prev => {
      const exists = prev.find(d => d.id === saved.id)
      return exists ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev]
    })
    setEditing(null)
    setEditingId(null)
  }

  if (editing !== null) {
    return (
      <DietEditor
        diet={editing}
        dietId={editingId}
        onBack={() => { setEditing(null); setEditingId(null) }}
        onSaved={handleSaved}
      />
    )
  }

  return (
    <DietList
      diets={diets}
      isLoading={isLoadingList}
      onNew={openNew}
      onEdit={openEdit}
      onStatusChange={(id, status) => setDiets(prev => prev.map(d => d.id === id ? { ...d, status } : d))}
    />
  )
}

// ─── Diet List ───────────────────────────────────────────────

interface DietListProps {
  diets: Diet[]
  isLoading: boolean
  onNew: () => void
  onEdit: (diet: Diet) => void
  onStatusChange: (id: string, status: Diet['status']) => void
}

function DietList({ diets, isLoading, onNew, onEdit, onStatusChange }: DietListProps) {
  const [search, setSearch] = useState('')
  const [goalFilter, setGoalFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => diets.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchGoal = goalFilter === 'all' || d.goal === goalFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchGoal && matchStatus
  }), [diets, search, goalFilter, statusFilter])

  async function duplicate(diet: Diet) {
    try {
      const { id, createdAt, updatedAt, publishedAt, ...rest } = diet as any
      const newId = await dietService.create({ ...rest, title: `${rest.title} (Cópia)`, status: 'draft' })
      const copy = await dietService.getById(newId)
      if (copy) onEdit(copy)
    } catch { toastError('Erro ao duplicar.') }
  }

  async function toggleStatus(diet: Diet) {
    const next = diet.status === 'published' ? 'draft' : 'published'
    try {
      await dietService.update(diet.id, { status: next })
      onStatusChange(diet.id, next)
    } catch { toastError('Erro ao alterar status.') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase mb-1">Prescritor</p>
          <h1 className="text-3xl font-black italic text-white uppercase">Dietas</h1>
          <p className="text-sm text-text-muted mt-1">{diets.length} protocolo{diets.length !== 1 ? 's' : ''} no banco</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-accent-lime text-black font-black uppercase text-xs tracking-widest px-5 py-3 rounded-xl hover:bg-accent-lime/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Dieta
        </button>
      </div>

      {/* Filters */}
      <div className="ec-card rounded-2xl p-4 space-y-3">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime"
            />
          </div>
          <select value={goalFilter} onChange={e => setGoalFilter(e.target.value)} className="ec-input rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none md:w-44">
            <option value="all">Todos objetivos</option>
            {Object.entries(GOAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ec-input rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none md:w-36">
            <option value="all">Todos status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>
        {filtered.length !== diets.length && (
          <p className="text-[10px] text-text-muted">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white/50 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <Utensils className="w-10 h-10 opacity-20 mx-auto mb-3" />
          <p className="text-sm">Nenhuma dieta encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(diet => (
            <div key={diet.id} className="ec-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 group hover:border-white/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold text-white truncate">{diet.title}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${diet.status === 'published' ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime' : 'bg-white/5 border-white/10 text-text-muted'}`}>
                    {diet.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted flex-wrap">
                  <span>{GOAL_LABELS[diet.goal] || diet.goal}</span>
                  <span>·</span>
                  <span>{STYLE_LABELS[diet.style] || diet.style}</span>
                  <span>·</span>
                  <span className="text-white font-bold">{diet.calories} kcal</span>
                  <span>·</span>
                  <span>{diet.mealsPerDay || diet.meals?.length || 0} refeições</span>
                </div>
                <div className="flex gap-3 mt-2 text-[10px] font-mono">
                  <span className="text-accent-sky">{diet.protein}g P</span>
                  <span className="text-accent-lime">{diet.carbs}g C</span>
                  <span className="text-accent-yellow">{diet.fat}g G</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleStatus(diet)}
                  className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 text-text-muted hover:border-white/20 font-bold uppercase tracking-widest transition-colors"
                >
                  {diet.status === 'published' ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={() => duplicate(diet)}
                  title="Duplicar"
                  className="p-2 rounded-lg border border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(diet)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Diet Editor ─────────────────────────────────────────────

interface DietEditorProps {
  diet: Omit<Diet, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
  dietId: string | null
  onBack: () => void
  onSaved: (diet: Diet) => void
}

function DietEditor({ diet: initialDiet, dietId, onBack, onSaved }: DietEditorProps) {
  const [diet, setDiet] = useState(initialDiet)
  const [isSaving, setIsSaving] = useState(false)
  const [availableFoods, setAvailableFoods] = useState<Food[]>([])
  const [activeMealId, setActiveMealId] = useState<string | null>(null)
  const [foodSearch, setFoodSearch] = useState('')
  const [categoryChip, setCategoryChip] = useState<string | null>(null)
  const [targetKcal, setTargetKcal] = useState(diet.calories || 0)
  const [macroPrset, setMacroPreset] = useState<string | null>(null)
  const [showMealPresets, setShowMealPresets] = useState(false)
  const [showVariation, setShowVariation] = useState(false)
  const [variationKcal, setVariationKcal] = useState(0)
  const mealPresetsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    foodService.getActiveFoods().then(setAvailableFoods)
    if (initialDiet.meals.length > 0) setActiveMealId(initialDiet.meals[0].id)
  }, [])

  // Auto-recalc totals
  useEffect(() => {
    const t = calcTotals(diet.meals)
    setDiet(prev => ({
      ...prev,
      calories: Math.round(t.calories),
      protein: Math.round(t.protein),
      carbs: Math.round(t.carbs),
      fat: Math.round(t.fat),
      mealsPerDay: prev.meals.length,
    }))
  }, [diet.meals])

  // Close meal preset dropdown on outside click
  useEffect(() => {
    if (!showMealPresets) return
    function handler(e: MouseEvent) {
      if (mealPresetsRef.current && !mealPresetsRef.current.contains(e.target as Node)) {
        setShowMealPresets(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMealPresets])

  const totals = useMemo(() => calcTotals(diet.meals), [diet.meals])

  const filteredFoods = useMemo(() => availableFoods.filter(f => {
    const matchSearch = !foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase())
    const matchCat = !categoryChip || f.category === categoryChip
    return matchSearch && matchCat
  }).slice(0, 15), [availableFoods, foodSearch, categoryChip])

  const activeMeal = diet.meals.find(m => m.id === activeMealId)

  const activeMealTotals = useMemo(() =>
    activeMeal ? calcTotals([activeMeal]) : null,
  [activeMeal])

  // Macro targets from preset
  const macroTarget = macroPrset
    ? MACRO_PRESETS.find(p => p.id === macroPrset) ?? null
    : null

  function targetGrams(pct: number, kcalPerG: number) {
    if (!targetKcal) return null
    return Math.round((targetKcal * (pct / 100)) / kcalPerG)
  }

  // ── Meal actions ──
  function addMeal(name?: string) {
    const newMeal: DietMeal = {
      id: `meal_${Date.now()}`,
      name: name || `Refeição ${diet.meals.length + 1}`,
      order: diet.meals.length + 1,
      items: [],
    }
    setDiet(prev => ({ ...prev, meals: [...prev.meals, newMeal] }))
    setActiveMealId(newMeal.id)
    setShowMealPresets(false)
  }

  function removeMeal(id: string) {
    setDiet(prev => {
      const meals = prev.meals.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i + 1 }))
      if (activeMealId === id) setActiveMealId(meals[0]?.id ?? null)
      return { ...prev, meals }
    })
  }

  function moveMeal(idx: number, dir: -1 | 1) {
    const meals = [...diet.meals]
    if (idx + dir < 0 || idx + dir >= meals.length) return
    ;[meals[idx], meals[idx + dir]] = [meals[idx + dir], meals[idx]]
    setDiet(prev => ({ ...prev, meals: meals.map((m, i) => ({ ...m, order: i + 1 })) }))
  }

  function duplicateMeal(meal: DietMeal) {
    const copy: DietMeal = { ...meal, id: `meal_${Date.now()}`, name: `${meal.name} (Cópia)`, order: diet.meals.length + 1 }
    setDiet(prev => ({ ...prev, meals: [...prev.meals, copy] }))
    setActiveMealId(copy.id)
  }

  // ── Food actions ──
  function addFood(food: Food) {
    if (!activeMealId) return
    const item: DietMealItem = {
      id: `item_${Date.now()}`,
      foodId: food.id,
      foodName: food.name,
      quantity: food.basePortion.amount,
      unit: food.basePortion.unit,
      macros: { ...food.macrosPerBasePortion },
    }
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === activeMealId ? { ...m, items: [...m.items, item] } : m),
    }))
    setFoodSearch('')
  }

  function removeItem(mealId: string, itemId: string) {
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m),
    }))
  }

  function updateQty(mealId: string, itemId: string, qty: number) {
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id !== mealId) return m
        return {
          ...m,
          items: m.items.map(item => {
            if (item.id !== itemId) return item
            const base = availableFoods.find(f => f.id === item.foodId)
            if (!base || qty <= 0) return { ...item, quantity: qty }
            const ratio = qty / base.basePortion.amount
            return {
              ...item,
              quantity: qty,
              macros: {
                calories: Math.round(base.macrosPerBasePortion.calories * ratio),
                protein:  Math.round(base.macrosPerBasePortion.protein  * ratio),
                carbs:    Math.round(base.macrosPerBasePortion.carbs    * ratio),
                fat:      Math.round(base.macrosPerBasePortion.fat      * ratio),
              },
            }
          }),
        }
      }),
    }))
  }

  // ── Caloric variation ──
  async function applyVariation() {
    if (variationKcal <= 0 || diet.calories <= 0) return
    const ratio = variationKcal / diet.calories
    const newMeals = diet.meals.map(m => ({
      ...m,
      items: m.items.map(item => {
        const base = availableFoods.find(f => f.id === item.foodId)
        if (!base) return item
        const newQty = Number((item.quantity * ratio).toFixed(1))
        const r = newQty / base.basePortion.amount
        return {
          ...item,
          quantity: newQty,
          macros: {
            calories: Math.round(base.macrosPerBasePortion.calories * r),
            protein:  Math.round(base.macrosPerBasePortion.protein  * r),
            carbs:    Math.round(base.macrosPerBasePortion.carbs    * r),
            fat:      Math.round(base.macrosPerBasePortion.fat      * r),
          },
        }
      }),
    }))
    try {
      setIsSaving(true)
      const copy = { ...diet, title: `${diet.title} (${variationKcal}kcal)`, status: 'draft' as const, meals: newMeals }
      const newId = await dietService.create(copy)
      const saved = await dietService.getById(newId)
      if (saved) onSaved(saved)
    } catch { toastError('Erro ao criar variação.') }
    finally { setIsSaving(false) }
  }

  // ── Save ──
  async function save(status: Diet['status']) {
    if (!diet.title) return toastError('Título obrigatório.')
    try {
      setIsSaving(true)
      const data = { ...diet, status }
      let id: string
      if (dietId) {
        await dietService.update(dietId, data)
        id = dietId
      } else {
        id = await dietService.create(data)
      }
      const saved = await dietService.getById(id)
      if (saved) onSaved(saved)
    } catch { toastError('Erro ao salvar dieta.') }
    finally { setIsSaving(false) }
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Editor header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl border border-white/10 text-text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase">Prescritor</p>
            <h1 className="text-xl font-black italic text-white uppercase leading-tight">{diet.title || 'Nova Dieta'}</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {dietId && (
            <button
              onClick={() => setShowVariation(v => !v)}
              disabled={diet.calories === 0 || isSaving}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/10 text-text-muted hover:text-white disabled:opacity-40 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" /> Variação calórica
            </button>
          )}
          <button onClick={() => save('draft')} disabled={isSaving} className="text-xs px-4 py-2 rounded-xl border border-white/10 text-text-muted hover:text-white transition-colors">
            Salvar rascunho
          </button>
          <button onClick={() => save('published')} disabled={isSaving} className="text-xs px-4 py-2 rounded-xl bg-accent-lime text-black font-bold hover:bg-accent-lime/90 transition-colors">
            Publicar
          </button>
        </div>
      </div>

      {/* Caloric variation panel */}
      <AnimatePresence>
        {showVariation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ec-card rounded-2xl p-4 border border-accent-lime/20 bg-accent-lime/5 overflow-hidden"
          >
            <p className="text-xs text-text-muted mb-3">
              Dieta atual: <span className="text-white font-bold">{diet.calories} kcal</span>. Informe a nova meta e o sistema recalcula todas as porções proporcionalmente, gerando uma cópia em rascunho.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number"
                placeholder="Ex: 1800"
                value={variationKcal || ''}
                onChange={e => setVariationKcal(Number(e.target.value))}
                className="w-36 ec-input rounded-xl px-3 py-2 text-sm text-white focus:border-accent-lime focus:outline-none"
              />
              <span className="text-xs text-text-muted">kcal</span>
              <button onClick={applyVariation} disabled={isSaving || variationKcal <= 0} className="text-xs px-4 py-2 rounded-xl bg-accent-lime text-black font-bold disabled:opacity-40">
                Gerar variação
              </button>
              <button onClick={() => setShowVariation(false)} className="text-xs text-text-muted hover:text-white">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-column layout */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">

        {/* Left — Meal structure */}
        <section className="lg:col-span-3 ec-card rounded-2xl p-4 flex flex-col gap-3 max-h-[78vh] overflow-y-auto">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/10 pb-2 flex justify-between">
            Refeições <span className="text-text-muted font-normal">{diet.meals.length}</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            {diet.meals.map((meal, idx) => (
              <div
                key={meal.id}
                onClick={() => setActiveMealId(meal.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors group ${activeMealId === meal.id ? 'bg-accent-lime/10 border-accent-lime/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-sm truncate ${activeMealId === meal.id ? 'text-accent-lime' : 'text-white'}`}>{meal.name}</span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                    <button className="p-1 text-text-muted hover:text-white" onClick={e => { e.stopPropagation(); moveMeal(idx, -1) }}>↑</button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={e => { e.stopPropagation(); moveMeal(idx, 1) }}>↓</button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={e => { e.stopPropagation(); duplicateMeal(meal) }}><Copy className="w-3 h-3" /></button>
                    <button className="p-1 text-red-400/70 hover:text-red-400" onClick={e => { e.stopPropagation(); removeMeal(meal.id) }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-0.5">{meal.items.length} alimentos · {meal.timeSuggestion || 'horário livre'}</p>
              </div>
            ))}
            {diet.meals.length === 0 && <p className="text-xs text-text-muted text-center py-4">Nenhuma refeição ainda.</p>}
          </div>

          <div className="pt-2 border-t border-white/10" ref={mealPresetsRef}>
            <div className="relative">
              <button
                onClick={() => setShowMealPresets(v => !v)}
                className="flex items-center justify-between w-full text-[10px] bg-accent-lime/10 hover:bg-accent-lime/20 text-accent-lime border border-accent-lime/20 rounded-lg px-3 py-2 font-bold uppercase tracking-widest transition-colors"
              >
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Adicionar refeição</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMealPresets ? 'rotate-180' : ''}`} />
              </button>
              {showMealPresets && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                  <button onClick={() => addMeal()} className="w-full text-left px-3 py-2.5 hover:bg-white/10 text-xs text-text-muted border-b border-white/5">
                    + Nome personalizado
                  </button>
                  {MEAL_PRESETS.map(name => (
                    <button key={name} onClick={() => addMeal(name)} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs text-white border-b border-white/5 last:border-b-0">
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Center — Meal editor */}
        <section className="lg:col-span-6 ec-card rounded-2xl p-5 min-h-[50vh]">
          {!activeMeal ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted py-20">
              <Utensils className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Selecione ou adicione uma refeição.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 h-full">
              {/* Meal name + time */}
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Nome</label>
                  <input
                    type="text"
                    value={activeMeal.name}
                    onChange={e => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === activeMeal.id ? { ...m, name: e.target.value } : m) }))}
                    className="w-full bg-transparent border-b border-white/20 text-white font-bold text-xl focus:outline-none focus:border-accent-lime pb-1"
                  />
                </div>
                <div className="w-28 flex-shrink-0">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Horário</label>
                  <input
                    type="time"
                    value={activeMeal.timeSuggestion || ''}
                    onChange={e => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === activeMeal.id ? { ...m, timeSuggestion: e.target.value } : m) }))}
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-accent-lime"
                  />
                </div>
              </div>

              {/* Meal totals */}
              {activeMealTotals && activeMeal.items.length > 0 && (
                <div className="flex gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                  <MacroChip label="kcal" value={activeMealTotals.calories} color="text-white" />
                  <MacroChip label="P" value={activeMealTotals.protein} color="text-accent-sky" unit="g" />
                  <MacroChip label="C" value={activeMealTotals.carbs} color="text-accent-lime" unit="g" />
                  <MacroChip label="G" value={activeMealTotals.fat} color="text-accent-yellow" unit="g" />
                </div>
              )}

              {/* Items */}
              <div className="flex-1 flex flex-col gap-2">
                {activeMeal.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-white/5 px-3 py-2.5 rounded-xl border border-white/5 group hover:border-white/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.foodName}</p>
                      <div className="flex gap-2 text-[10px] mt-0.5">
                        <span className="text-white/50">{item.macros.calories} kcal</span>
                        <span className="text-accent-sky/70">{item.macros.protein}g P</span>
                        <span className="text-accent-lime/70">{item.macros.carbs}g C</span>
                        <span className="text-accent-yellow/70">{item.macros.fat}g G</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-black rounded-lg border border-white/10 overflow-hidden">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateQty(activeMeal.id, item.id, Number(e.target.value))}
                        className="w-14 bg-transparent py-1.5 text-sm text-white text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-text-muted pr-2 bg-white/5 h-full flex items-center">{item.unit}</span>
                    </div>
                    <button onClick={() => removeItem(activeMeal.id, item.id)} className="p-1.5 text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {activeMeal.items.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-6 border border-dashed border-white/10 rounded-xl">Busque um alimento abaixo para adicionar.</p>
                )}
              </div>

              {/* Food search */}
              <div className="mt-auto space-y-2">
                {/* Category chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCategoryChip(null)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest transition-all ${!categoryChip ? 'bg-white/15 border-white/20 text-white' : 'border-white/10 text-text-muted hover:border-white/20'}`}
                  >
                    Todos
                  </button>
                  {FOOD_CATEGORY_CHIPS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryChip(categoryChip === c.id ? null : c.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-widest transition-all ${categoryChip === c.id ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime' : 'border-white/10 text-text-muted hover:border-white/20'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder={categoryChip ? `Buscar em ${FOOD_CATEGORY_CHIPS.find(c => c.id === categoryChip)?.label}...` : 'Buscar alimento...'}
                    value={foodSearch}
                    onChange={e => setFoodSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime transition-colors"
                  />
                  {(foodSearch || categoryChip) && (
                    <div className="absolute bottom-full mb-1 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                      <div className="max-h-52 overflow-y-auto p-1.5 flex flex-col gap-1">
                        {filteredFoods.map(f => (
                          <button
                            key={f.id}
                            onClick={() => addFood(f)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 flex justify-between items-center group transition-colors"
                          >
                            <div>
                              <p className="font-bold group-hover:text-accent-lime transition-colors">{f.name}</p>
                              <p className="text-[10px] text-text-muted">Porção: {f.basePortion.amount}{f.basePortion.unit}</p>
                            </div>
                            <div className="flex gap-1.5 text-[10px] flex-shrink-0">
                              <span className="bg-white/5 px-2 py-0.5 rounded">{f.macrosPerBasePortion.calories}kcal</span>
                              <span className="bg-accent-sky/10 text-accent-sky px-2 py-0.5 rounded">{f.macrosPerBasePortion.protein}g P</span>
                            </div>
                          </button>
                        ))}
                        {filteredFoods.length === 0 && <p className="px-3 py-3 text-sm text-text-muted text-center">Nenhum alimento encontrado.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right — Summary */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Calorie + macro summary */}
          <div className="ec-card rounded-2xl p-5">
            <h2 className="font-bold uppercase italic text-white text-sm mb-4">Totais</h2>

            <div className="mb-4">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Calorias reais</p>
              <p className="text-4xl font-black text-white">{totals.calories} <span className="text-sm text-text-muted font-normal">kcal</span></p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <MacroChip label="Prot" value={totals.protein} unit="g" color="text-accent-sky" big />
              <MacroChip label="Carb" value={totals.carbs} unit="g" color="text-accent-lime" big />
              <MacroChip label="Gord" value={totals.fat} unit="g" color="text-accent-yellow" big />
            </div>

            {/* Target kcal + macro preset */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Meta calórica (guia)</label>
                <input
                  type="number"
                  value={targetKcal || ''}
                  placeholder="Ex: 2000"
                  onChange={e => setTargetKcal(Number(e.target.value))}
                  className="w-full ec-input rounded-xl px-3 py-2 text-sm text-white focus:border-accent-lime focus:outline-none"
                />
              </div>

              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-2">Distribuição macro</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MACRO_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setMacroPreset(macroPrset === p.id ? null : p.id)}
                      className={`text-left p-2 rounded-lg border text-[10px] transition-all ${macroPrset === p.id ? 'bg-accent-lime/10 border-accent-lime/40 text-accent-lime' : 'border-white/10 text-text-muted hover:border-white/20'}`}
                    >
                      <p className="font-black uppercase">{p.label}</p>
                      <p className="opacity-70">{p.p}P / {p.c}C / {p.f}G</p>
                    </button>
                  ))}
                </div>
              </div>

              {macroTarget && targetKcal > 0 && (
                <div className="bg-black/30 rounded-xl p-3 space-y-1.5 border border-white/5">
                  <p className="text-[9px] text-text-muted uppercase tracking-widest font-black mb-2">Metas em gramas</p>
                  <TargetRow label="Proteína" current={totals.protein} target={targetGrams(macroTarget.p, 4)!} color="text-accent-sky" />
                  <TargetRow label="Carbo" current={totals.carbs} target={targetGrams(macroTarget.c, 4)!} color="text-accent-lime" />
                  <TargetRow label="Gordura" current={totals.fat} target={targetGrams(macroTarget.f, 9)!} color="text-accent-yellow" />
                </div>
              )}
            </div>
          </div>

          {/* Diet info */}
          <div className="ec-card rounded-2xl p-5 space-y-3">
            <h2 className="font-bold uppercase italic text-white text-sm">Dados</h2>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Título</label>
              <input
                type="text"
                value={diet.title}
                placeholder="Ex: Protocolo Seca + Massa"
                onChange={e => setDiet(prev => ({ ...prev, title: e.target.value }))}
                className="w-full ec-input rounded-xl px-3 py-2 text-sm text-white focus:border-accent-lime focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Objetivo</label>
                <select value={diet.goal} onChange={e => setDiet(prev => ({ ...prev, goal: e.target.value as any }))} className="w-full ec-input rounded-xl px-2 py-2 text-xs text-white focus:outline-none">
                  {Object.entries(GOAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Estilo</label>
                <select value={diet.style} onChange={e => setDiet(prev => ({ ...prev, style: e.target.value as any }))} className="w-full ec-input rounded-xl px-2 py-2 text-xs text-white focus:outline-none">
                  {Object.entries(STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Observações</label>
              <textarea
                value={diet.notes || ''}
                onChange={e => setDiet(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instruções para o aluno..."
                rows={3}
                className="w-full ec-input rounded-xl px-3 py-2 text-xs text-white focus:border-accent-lime focus:outline-none resize-none"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Small reusable pieces ────────────────────────────────────

function MacroChip({ label, value, unit = '', color, big = false }: { label: string; value: number; unit?: string; color: string; big?: boolean }) {
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-widest font-black mb-0.5 ${color}`}>{label}</p>
      <p className={`font-bold text-white ${big ? 'text-lg' : 'text-sm'}`}>{Math.round(value)}{unit}</p>
    </div>
  )
}

function TargetRow({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0)
  const over = current > target
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-text-muted">{label}</span>
        <span className={over ? 'text-red-400' : 'text-white'}>
          {Math.round(current)}g <span className="text-text-muted">/ {target}g</span>
        </span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
