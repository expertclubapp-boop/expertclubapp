import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Copy, Plus, Repeat, Search, Trash2, X, Zap, Eye } from 'lucide-react'
import { PlanPreviewModal } from './PlanPreviewModal'
import { motion, AnimatePresence } from 'framer-motion'
import { foodService } from '../../../services/foodService'
import type { Food, Diet, DietMeal, DietMealItem, DietSubstitutionOption } from '../../../types/domain'
import { Button } from '../../../components/ui/Button'

interface DietPrescriptorProps {
  diet: Diet
  onChange: (updatedDiet: Diet) => void
}

type MacroTotals = {
  protein: number
  carbs: number
  fat: number
  calories: number
}

function makeLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function cleanNumber(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

function roundMacro(value: number) {
  return Number(cleanNumber(value).toFixed(1))
}

function calculateMacros(food: Food, quantity: number): MacroTotals {
  const baseAmount = cleanNumber(food.basePortion?.amount) || 100
  const ratio = cleanNumber(quantity) / baseAmount
  const macros = food.macrosPerBasePortion || { protein: 0, carbs: 0, fat: 0, calories: 0 }

  return {
    protein: roundMacro(cleanNumber(macros.protein) * ratio),
    carbs: roundMacro(cleanNumber(macros.carbs) * ratio),
    fat: roundMacro(cleanNumber(macros.fat) * ratio),
    calories: Math.round(cleanNumber(macros.calories) * ratio),
  }
}

function totalItems(items: DietMealItem[] = []): MacroTotals {
  return items.reduce(
    (acc, item) => ({
      protein: acc.protein + cleanNumber(item.macros?.protein),
      carbs: acc.carbs + cleanNumber(item.macros?.carbs),
      fat: acc.fat + cleanNumber(item.macros?.fat),
      calories: acc.calories + cleanNumber(item.macros?.calories),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 },
  )
}

function cloneMeals(meals: DietMeal[] = []): DietMeal[] {
  return meals.map(meal => ({
    ...meal,
    items: (meal.items || []).map(item => ({
      ...item,
      macros: { ...item.macros },
      substitutionOptions: (item.substitutionOptions || []).map(sub => ({
        ...sub,
        macros: { ...sub.macros },
      })),
    })),
  }))
}

export function DietPrescriptor({ diet, onChange }: DietPrescriptorProps) {
  const [foods, setFoods] = useState<Food[]>([])
  const [isSearching, setIsSearching] = useState<{ mealIndex: number, itemIndex: number, subIndex?: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSubstitutions, setEditingSubstitutions] = useState<{ mealIndex: number, itemIndex: number } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    foodService.getFoods().then(setFoods).catch(() => setFoods([]))
  }, [])

  const filteredFoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const source = term ? foods.filter(food => food.name.toLowerCase().includes(term)) : foods
    return source.slice(0, term ? 15 : 10)
  }, [foods, searchTerm])

  const addMeal = () => {
    const meals = cloneMeals(diet.meals)
    const newMeal: DietMeal = {
      id: makeLocalId('meal'),
      name: `Refeição ${meals.length + 1}`,
      timeSuggestion: '08:00',
      order: meals.length,
      items: [],
    }
    onChange({ ...diet, meals: [...meals, newMeal], mealsPerDay: meals.length + 1 })
  }

  const removeMeal = (index: number) => {
    const meals = cloneMeals(diet.meals)
      .filter((_, mealIndex) => mealIndex !== index)
      .map((meal, order) => ({ ...meal, order }))
    onChange({ ...diet, meals, mealsPerDay: meals.length })
  }

  const addItem = (mealIndex: number) => {
    const meals = cloneMeals(diet.meals)
    const newItem: DietMealItem = {
      id: makeLocalId('food_item'),
      foodId: '',
      foodName: 'Novo Alimento',
      quantity: 100,
      unit: 'g',
      macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      substitutionOptions: [],
    }
    meals[mealIndex].items = [...(meals[mealIndex].items || []), newItem]
    onChange({ ...diet, meals })
  }

  const removeItem = (mealIndex: number, itemIndex: number) => {
    const meals = cloneMeals(diet.meals)
    meals[mealIndex].items = meals[mealIndex].items.filter((_, index) => index !== itemIndex)
    onChange({ ...diet, meals })
  }

  const duplicateItem = (mealIndex: number, itemIndex: number) => {
    const meals = cloneMeals(diet.meals)
    const original = meals[mealIndex].items[itemIndex]
    meals[mealIndex].items.splice(itemIndex + 1, 0, {
      ...original,
      id: makeLocalId('food_item'),
      macros: { ...original.macros },
      substitutionOptions: (original.substitutionOptions || []).map(sub => ({ ...sub, macros: { ...sub.macros } })),
    })
    onChange({ ...diet, meals })
  }

  const selectFood = (mealIndex: number, itemIndex: number, food: Food, isSubstitution = false) => {
    const meals = cloneMeals(diet.meals)
    const item = meals[mealIndex].items[itemIndex]

    if (!isSubstitution) {
      item.foodId = food.id
      item.foodName = food.name
      item.unit = food.basePortion?.unit || 'g'
      item.macros = calculateMacros(food, item.quantity)
    } else {
      const quantity = cleanNumber(food.basePortion?.amount) || 100
      const subOption: DietSubstitutionOption = {
        foodId: food.id,
        foodName: food.name,
        quantity,
        unit: food.basePortion?.unit || 'g',
        macros: calculateMacros(food, quantity),
      }
      item.substitutionOptions = [...(item.substitutionOptions || []), subOption]
    }

    onChange({ ...diet, meals })
    setIsSearching(null)
    setSearchTerm('')
  }

  const updateQuantity = (mealIndex: number, itemIndex: number, quantity: number, subIndex?: number) => {
    const meals = cloneMeals(diet.meals)
    const item = meals[mealIndex].items[itemIndex]
    const safeQuantity = cleanNumber(quantity)

    if (subIndex === undefined) {
      const food = foods.find(candidate => candidate.id === item.foodId)
      item.quantity = safeQuantity
      item.macros = food ? calculateMacros(food, safeQuantity) : {
        protein: roundMacro(item.macros?.protein),
        carbs: roundMacro(item.macros?.carbs),
        fat: roundMacro(item.macros?.fat),
        calories: Math.round(cleanNumber(item.macros?.calories)),
      }
    } else {
      const sub = item.substitutionOptions?.[subIndex]
      if (!sub) return
      const food = foods.find(candidate => candidate.id === sub.foodId)
      sub.quantity = safeQuantity
      sub.macros = food ? calculateMacros(food, safeQuantity) : {
        protein: roundMacro(sub.macros?.protein),
        carbs: roundMacro(sub.macros?.carbs),
        fat: roundMacro(sub.macros?.fat),
        calories: Math.round(cleanNumber(sub.macros?.calories)),
      }
    }

    onChange({ ...diet, meals })
  }

  const removeSubstitution = (mealIndex: number, itemIndex: number, subIndex: number) => {
    const meals = cloneMeals(diet.meals)
    const item = meals[mealIndex].items[itemIndex]
    item.substitutionOptions = (item.substitutionOptions || []).filter((_, index) => index !== subIndex)
    onChange({ ...diet, meals })
  }

  const swapWithSubstitution = (mealIndex: number, itemIndex: number, subIndex: number) => {
    const meals = cloneMeals(diet.meals)
    const item = meals[mealIndex].items[itemIndex]
    const sub = item.substitutionOptions?.[subIndex]
    if (!sub) return

    const previousMain: DietSubstitutionOption = {
      foodId: item.foodId,
      foodName: item.foodName,
      quantity: item.quantity,
      unit: item.unit,
      gramsEquivalent: item.gramsEquivalent,
      macros: { ...item.macros },
    }

    item.foodId = sub.foodId
    item.foodName = sub.foodName
    item.quantity = sub.quantity
    item.unit = sub.unit
    item.gramsEquivalent = sub.gramsEquivalent
    item.macros = { ...sub.macros }
    item.substitutionOptions = item.substitutionOptions?.map((option, index) => index === subIndex ? previousMain : option)
    onChange({ ...diet, meals })
  }

  const updateMeal = (mealIndex: number, patch: Partial<DietMeal>) => {
    const meals = cloneMeals(diet.meals)
    meals[mealIndex] = { ...meals[mealIndex], ...patch }
    onChange({ ...diet, meals })
  }

  const totals = useMemo(() => totalItems((diet.meals || []).flatMap(meal => meal.items || [])), [diet.meals])

  return (
    <div className="space-y-6">
      <div className="ec-card bg-ec-violet/10 border-ec-violet/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-[0_8px_32px_rgba(91,75,255,0.15)]">
        <div>
          <h3 className="font-display text-xl font-black uppercase italic text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-ec-violet fill-current" />
            VGV da Dieta
          </h3>
          <p className="text-xs text-text-muted">Totais diários calculados automaticamente</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-8 mr-6">
            <Stat label="Proteína" value={`${totals.protein.toFixed(0)}g`} color="sky" />
            <Stat label="Carbos" value={`${totals.carbs.toFixed(0)}g`} color="lime" />
            <Stat label="Gordura" value={`${totals.fat.toFixed(0)}g`} color="purple" />
            <Stat label="Calorias" value={`${totals.calories.toFixed(0)} kcal`} color="white" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setIsPreviewOpen(true)}
            className="w-auto h-12 px-6 border-ec-violet/20 text-ec-violet hover:bg-ec-violet/5 rounded-xl flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Pré-visualizar
          </Button>
        </div>
      </div>

      <PlanPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        type="diet" 
        data={diet} 
      />

      <div className="space-y-4">
        {(diet.meals || []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="font-display text-lg font-black uppercase italic text-white">Nenhuma refeição criada</p>
            <p className="mt-2 text-sm text-text-muted">Adicione refeições para montar o plano alimentar com cálculo automático.</p>
          </div>
        )}

        {(diet.meals || []).map((meal, mealIndex) => {
          const mealTotals = totalItems(meal.items)

          return (
            <div key={meal.id} className="ec-card rounded-2xl overflow-visible border border-white/5 bg-surface-1/40">
              <div className="bg-white/5 p-4 flex flex-col gap-3 border-b border-white/5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-ec-violet" />
                    <input
                      value={meal.timeSuggestion || ''}
                      onChange={event => updateMeal(mealIndex, { timeSuggestion: event.target.value })}
                      className="bg-bg-primary border border-white/10 rounded-lg px-2 py-1 text-xs text-white w-20 font-mono text-center"
                      type="time"
                    />
                  </div>
                  <input
                    value={meal.name}
                    onChange={event => updateMeal(mealIndex, { name: event.target.value })}
                    className="min-w-[220px] bg-transparent font-display text-lg font-black uppercase italic text-white focus:outline-none hover:bg-white/5 px-2 py-1 rounded transition-colors"
                    placeholder="Nome da refeição"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {mealTotals.calories} kcal • {mealTotals.protein.toFixed(0)}P {mealTotals.carbs.toFixed(0)}C {mealTotals.fat.toFixed(0)}G
                  </p>
                  <button onClick={() => removeMeal(mealIndex)} className="text-text-disabled hover:text-accent-red transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {(meal.items || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-text-muted">
                    Refeição vazia. Use o catálogo global para adicionar alimentos.
                  </div>
                )}

                {(meal.items || []).map((item, itemIndex) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:border-ec-violet/30 transition-all relative group">
                      {isSearching?.mealIndex === mealIndex && isSearching?.itemIndex === itemIndex && !isSearching.subIndex ? (
                        <FoodSearchBox
                          searchTerm={searchTerm}
                          onSearchTerm={setSearchTerm}
                          filteredFoods={filteredFoods}
                          onSelect={food => selectFood(mealIndex, itemIndex, food)}
                        />
                      ) : (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <button
                            onClick={() => setIsSearching({ mealIndex, itemIndex })}
                            className="text-left flex-1 min-w-0"
                          >
                            <p className="text-base font-black text-white uppercase italic group-hover:text-ec-violet transition-colors truncate">{item.foodName}</p>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                              <MacroPill label="P" value={`${roundMacro(item.macros?.protein)}g`} color="sky" />
                              <MacroPill label="C" value={`${roundMacro(item.macros?.carbs)}g`} color="violet" />
                              <MacroPill label="G" value={`${roundMacro(item.macros?.fat)}g`} color="purple" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center">{Math.round(cleanNumber(item.macros?.calories))} kcal</span>
                            </div>
                          </button>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <input
                              type="number"
                              min={0}
                              step="0.1"
                              value={item.quantity}
                              onChange={event => updateQuantity(mealIndex, itemIndex, Number(event.target.value))}
                              className="w-20 bg-bg-primary border border-white/10 rounded-xl px-2 py-2 text-sm text-white text-center font-black focus:border-ec-violet transition-colors"
                            />
                            <span className="text-xs font-bold text-text-muted uppercase w-8">{item.unit}</span>
                            <IconButton label="Duplicar alimento" onClick={() => duplicateItem(mealIndex, itemIndex)}>
                              <Copy className="w-4 h-4" />
                            </IconButton>
                            <IconButton
                              label="Substituições"
                              active={Boolean(item.substitutionOptions?.length)}
                              onClick={() => setEditingSubstitutions(editingSubstitutions?.mealIndex === mealIndex && editingSubstitutions?.itemIndex === itemIndex ? null : { mealIndex, itemIndex })}
                            >
                              <Repeat className="w-4 h-4" />
                            </IconButton>
                            <button onClick={() => removeItem(mealIndex, itemIndex)} className="p-2.5 text-text-disabled hover:text-accent-red">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {editingSubstitutions?.mealIndex === mealIndex && editingSubstitutions?.itemIndex === itemIndex && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-visible"
                          >
                            <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-ec-violet">Opções de Substituição</h4>
                                <button
                                  onClick={() => setIsSearching({ mealIndex, itemIndex, subIndex: 999 })}
                                  className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg"
                                >
                                  <Plus className="w-3 h-3" /> Add Opção
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(item.substitutionOptions || []).length === 0 && (
                                  <p className="rounded-xl bg-black/20 p-3 text-xs text-text-muted">Nenhum substituto adicionado.</p>
                                )}
                                {(item.substitutionOptions || []).map((sub, subIndex) => (
                                  <div key={`${sub.foodId}-${subIndex}`} className="flex flex-col gap-3 bg-black/20 rounded-xl p-3 border border-white/5 md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{sub.foodName}</p>
                                      <p className="text-[9px] text-text-muted uppercase font-mono">{Math.round(cleanNumber(sub.macros?.calories))}kcal • {roundMacro(sub.macros?.protein)}P {roundMacro(sub.macros?.carbs)}C {roundMacro(sub.macros?.fat)}G</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.1"
                                        value={sub.quantity}
                                        onChange={event => updateQuantity(mealIndex, itemIndex, Number(event.target.value), subIndex)}
                                        className="w-16 bg-bg-primary border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white text-center font-bold"
                                      />
                                      <span className="text-[10px] text-text-muted w-6 uppercase">{sub.unit}</span>
                                      <IconButton label="Usar como principal" onClick={() => swapWithSubstitution(mealIndex, itemIndex, subIndex)}>
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                      </IconButton>
                                      <button onClick={() => removeSubstitution(mealIndex, itemIndex, subIndex)} className="text-text-disabled hover:text-accent-red p-1">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {isSearching?.mealIndex === mealIndex && isSearching?.itemIndex === itemIndex && isSearching.subIndex === 999 && (
                                  <FoodSearchBox
                                    compact
                                    searchTerm={searchTerm}
                                    onSearchTerm={setSearchTerm}
                                    filteredFoods={filteredFoods}
                                    onSelect={food => selectFood(mealIndex, itemIndex, food, true)}
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addItem(mealIndex)}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-text-muted hover:text-ec-violet hover:border-ec-violet/30 hover:bg-ec-violet/5 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Alimento
                </button>
              </div>
            </div>
          )
        })}

        <Button
          variant="ghost"
          onClick={addMeal}
          className="w-full py-8 border-white/10 rounded-3xl text-white font-display italic font-black uppercase text-xl tracking-widest hover:bg-white/5"
          icon={<Plus className="w-6 h-6" />}
        >
          Adicionar Nova Refeição
        </Button>
      </div>
    </div>
  )
}

function FoodSearchBox({ searchTerm, onSearchTerm, filteredFoods, onSelect, compact = false }: {
  searchTerm: string
  onSearchTerm: (value: string) => void
  filteredFoods: Food[]
  onSelect: (food: Food) => void
  compact?: boolean
}) {
  return (
    <div className="relative">
      {!compact && <Search className="absolute left-3 top-[21px] -translate-y-1/2 w-4 h-4 text-text-muted" />}
      <input
        autoFocus
        placeholder={compact ? 'Pesquisar substituto...' : 'Buscar no banco global de alimentos...'}
        value={searchTerm}
        onChange={event => onSearchTerm(event.target.value)}
        className={`w-full bg-bg-primary border border-ec-violet/50 rounded-xl py-2.5 pr-4 text-sm text-white shadow-[0_0_15px_rgba(91,75,255,0.1)] ${compact ? 'pl-4 text-xs' : 'pl-10'}`}
      />
      <div className="absolute top-full left-0 right-0 z-[120] mt-2 max-h-60 overflow-y-auto ec-glass rounded-xl border border-white/10 shadow-2xl">
        {filteredFoods.length > 0 ? filteredFoods.map(food => (
          <button
            key={food.id}
            onClick={() => onSelect(food)}
            className="w-full text-left p-4 hover:bg-ec-violet/20 border-b border-white/5 last:border-0 flex justify-between items-center gap-3 group/btn"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-white group-hover/btn:text-ec-violet transition-colors truncate">{food.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">{food.category || 'sem categoria'}</p>
            </div>
            <div className="shrink-0 text-[10px] text-ec-violet font-mono bg-ec-violet/10 px-2 py-1 rounded">
              {Math.round(cleanNumber(food.macrosPerBasePortion?.calories))}kcal / {cleanNumber(food.basePortion?.amount) || 100}{food.basePortion?.unit || 'g'}
            </div>
          </button>
        )) : (
          <div className="p-4 text-sm text-text-muted">Nenhum alimento encontrado.</div>
        )}
      </div>
    </div>
  )
}

function IconButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`p-2.5 rounded-xl border transition-all ${active ? 'bg-ec-violet text-white border-ec-violet' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, color }: { label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    sky: 'text-accent-sky',
    violet: 'text-ec-violet',
    purple: 'text-accent-purple',
    white: 'text-white',
  }
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-display font-black italic ${colorMap[color]} drop-shadow-[0_0_12px_rgba(91,75,255,0.3)]`}>{value}</span>
      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mt-1">{label}</span>
    </div>
  )
}

function MacroPill({ label, value, color }: { label: string, value: string, color: 'sky' | 'violet' | 'purple' }) {
  const colors = {
    sky: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20',
    violet: 'text-ec-violet bg-ec-violet/10 border-ec-violet/20',
    purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
  }
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${colors[color]}`}>
      <span className="text-[9px] font-black uppercase">{label}</span>
      <span className="text-[10px] font-bold font-mono">{value}</span>
    </div>
  )
}
