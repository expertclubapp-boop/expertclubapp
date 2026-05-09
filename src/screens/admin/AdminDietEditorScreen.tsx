import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Search, Copy, ArrowUp, ArrowDown, Calculator, Utensils, ExternalLink } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { toastError } from '../../components/ui/Toast'
import { AdminToolbar, Field, TextInput, TextArea } from './AdminShared'
import { dietService } from '../../services/dietService'
import { foodService } from '../../services/foodService'
import { sanitizeTags } from '../../services/adminCrudService'
import type { Diet, DietMeal, DietMealItem, Food } from '../../types/domain'

const emptyDiet: Omit<Diet, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> = {
  title: '',
  description: '',
  goal: 'fat_loss',
  style: 'simple',
  level: 'beginner',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  mealsPerDay: 0,
  tags: [],
  meals: [],
  shoppingList: [],
  notes: '',
  status: 'draft',
  version: 1
}

export function AdminDietEditorScreen() {
  const { dietId } = useParams()
  const navigate = useNavigate()
  
  const [diet, setDiet] = useState<Omit<Diet, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>(emptyDiet)
  const [isLoading, setIsLoading] = useState(false)
  const [availableFoods, setAvailableFoods] = useState<Food[]>([])
  
  const [activeMealId, setActiveMealId] = useState<string | null>(null)
  const [foodSearch, setFoodSearch] = useState('')
  const [showCaloricVariation, setShowCaloricVariation] = useState(false)
  const [targetCalories, setTargetCalories] = useState(0)

  useEffect(() => {
    foodService.getActiveFoods().then(setAvailableFoods)
    
    if (dietId && dietId !== 'new') {
      setIsLoading(true)
      dietService.getById(dietId)
        .then(found => {
          if (found) {
            setDiet(found)
            if (found.meals.length > 0) setActiveMealId(found.meals[0].id)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [dietId])

  // Auto-calculate macros
  useEffect(() => {
    let totalCals = 0, totalP = 0, totalC = 0, totalF = 0
    diet.meals.forEach(meal => {
      meal.items.forEach(item => {
        totalCals += item.macros.calories
        totalP += item.macros.protein
        totalC += item.macros.carbs
        totalF += item.macros.fat
      })
    })
    setDiet(prev => ({
      ...prev,
      calories: Math.round(totalCals),
      protein: Math.round(totalP),
      carbs: Math.round(totalC),
      fat: Math.round(totalF),
      mealsPerDay: prev.meals.length
    }))
  }, [diet.meals])

  async function save(statusToSave: Diet['status'] = diet.status) {
    if (!diet.title || !diet.goal) return toastError('Título e objetivo são obrigatórios.')
    if (statusToSave === 'published' && diet.meals.length === 0) return toastError('Não é possível publicar sem refeições.')
    
    // Add simple validation rule: published requires at least 1 food
    if (statusToSave === 'published' && !diet.meals.some(m => m.items.length > 0)) {
      return toastError('Não é possível publicar uma dieta sem alimentos.')
    }

    try {
      setIsLoading(true)
      const dataToSave = { ...diet, status: statusToSave }
      if (statusToSave === 'published' && diet.status !== 'published') {
        (dataToSave as any).publishedAt = new Date().toISOString()
      }

      if (dietId && dietId !== 'new') {
        await dietService.update(dietId, dataToSave)
      } else {
        await dietService.create(dataToSave)
      }
      navigate('/admin/diets')
    } catch (error) {
      toastError('Erro ao salvar dieta.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function duplicateDiet() {
    if (dietId === 'new') return
    try {
      setIsLoading(true)
      const copy = { ...diet, title: `${diet.title} (Cópia)`, status: 'draft', version: 1 } as Omit<Diet, 'id'>
      const newId = await dietService.create(copy)
      navigate(`/admin/diets/${newId}`)
    } catch (err) {
      toastError('Erro ao duplicar dieta.')
    } finally {
      setIsLoading(false)
    }
  }

  async function applyCaloricVariation() {
    if (targetCalories <= 0 || diet.calories <= 0) return
    const ratio = targetCalories / diet.calories
    
    const newMeals = diet.meals.map(meal => ({
      ...meal,
      items: meal.items.map(item => {
        const baseFood = availableFoods.find(f => f.id === item.foodId)
        if (!baseFood) return item
        
        const newQuantity = Number((item.quantity * ratio).toFixed(1))
        const macroRatio = newQuantity / baseFood.basePortion.amount
        
        return {
          ...item,
          quantity: newQuantity,
          macros: {
            calories: Math.round(baseFood.macrosPerBasePortion.calories * macroRatio),
            protein: Math.round(baseFood.macrosPerBasePortion.protein * macroRatio),
            carbs: Math.round(baseFood.macrosPerBasePortion.carbs * macroRatio),
            fat: Math.round(baseFood.macrosPerBasePortion.fat * macroRatio),
          }
        }
      })
    }))
    
    try {
      setIsLoading(true)
      const copy = { 
        ...diet, 
        title: `${diet.title} (${targetCalories}kcal)`, 
        status: 'draft', 
        version: 1,
        meals: newMeals
      } as Omit<Diet, 'id'>
      const newId = await dietService.create(copy)
      setShowCaloricVariation(false)
      navigate(`/admin/diets/${newId}`)
    } catch (err) {
      toastError('Erro ao criar variação.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Meal Actions ---
  function addMeal(templateName?: string) {
    const name = templateName || `Refeição ${diet.meals.length + 1}`
    const newMeal: DietMeal = {
      id: `meal_${Date.now()}`,
      name,
      order: diet.meals.length + 1,
      items: []
    }
    setDiet(prev => ({ ...prev, meals: [...prev.meals, newMeal] }))
    setActiveMealId(newMeal.id)
  }

  function duplicateMeal(meal: DietMeal) {
    const copy: DietMeal = {
      ...meal,
      id: `meal_${Date.now()}`,
      name: `${meal.name} (Cópia)`,
      order: diet.meals.length + 1
    }
    setDiet(prev => ({ ...prev, meals: [...prev.meals, copy] }))
    setActiveMealId(copy.id)
  }

  function removeMeal(mealId: string) {
    setDiet(prev => {
      const newMeals = prev.meals.filter(m => m.id !== mealId).map((m, i) => ({ ...m, order: i + 1 }))
      if (activeMealId === mealId) {
        setActiveMealId(newMeals.length > 0 ? newMeals[0].id : null)
      }
      return { ...prev, meals: newMeals }
    })
  }

  function moveMeal(index: number, direction: -1 | 1) {
    const newMeals = [...diet.meals]
    if (index + direction < 0 || index + direction >= newMeals.length) return
    const temp = newMeals[index]
    newMeals[index] = newMeals[index + direction]
    newMeals[index + direction] = temp
    setDiet(prev => ({ ...prev, meals: newMeals.map((m, i) => ({ ...m, order: i + 1 })) }))
  }

  // --- Item Actions ---
  function addFoodToMeal(mealId: string, food: Food) {
    const newItem: DietMealItem = {
      id: `item_${Date.now()}`,
      foodId: food.id,
      foodName: food.name,
      quantity: food.basePortion.amount,
      unit: food.basePortion.unit,
      macros: { ...food.macrosPerBasePortion }
    }
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, items: [...m.items, newItem] } : m)
    }))
  }

  function duplicateItem(mealId: string, item: DietMealItem) {
    const copy: DietMealItem = { ...item, id: `item_${Date.now()}` }
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, items: [...m.items, copy] } : m)
    }))
  }

  function removeItemFromMeal(mealId: string, itemId: string) {
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m)
    }))
  }

  function updateItemQuantity(mealId: string, itemId: string, newQuantity: number) {
    setDiet(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id !== mealId) return m
        return {
          ...m,
          items: m.items.map(item => {
            if (item.id !== itemId) return item
            const baseFood = availableFoods.find(f => f.id === item.foodId)
            if (baseFood && newQuantity > 0) {
              const ratio = newQuantity / baseFood.basePortion.amount
              return {
                ...item,
                quantity: newQuantity,
                macros: {
                  calories: Math.round(baseFood.macrosPerBasePortion.calories * ratio),
                  protein: Math.round(baseFood.macrosPerBasePortion.protein * ratio),
                  carbs: Math.round(baseFood.macrosPerBasePortion.carbs * ratio),
                  fat: Math.round(baseFood.macrosPerBasePortion.fat * ratio),
                }
              }
            }
            return { ...item, quantity: newQuantity }
          })
        }
      })
    }))
  }

  if (isLoading && !diet.title && dietId !== 'new') return <PageShell wide><p className="text-white p-5">Carregando...</p></PageShell>

  const activeMeal = diet.meals.find(m => m.id === activeMealId)
  const filteredFoods = availableFoods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 10)

  // Meal Macros Calc
  const activeMealMacros = activeMeal ? activeMeal.items.reduce((acc, item) => ({
    calories: acc.calories + item.macros.calories,
    protein: acc.protein + item.macros.protein,
    carbs: acc.carbs + item.macros.carbs,
    fat: acc.fat + item.macros.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) : null

  return (
    <PageShell wide>
      <AdminToolbar 
        title={diet.title || 'Nova Dieta'} 
        eyebrow="Diet Builder V2" 
        action={
          <div className="flex flex-wrap gap-2">
            {dietId !== 'new' && (
              <>
                <Button variant="ghost" onClick={() => window.open(`/app/diets/${dietId}`, '_blank')} disabled={isLoading} icon={<ExternalLink className="w-4 h-4"/>}>Ver como Aluno</Button>
                <Button variant="ghost" onClick={duplicateDiet} disabled={isLoading} icon={<Copy className="w-4 h-4"/>}>Duplicar</Button>
                <Button variant="ghost" onClick={() => setShowCaloricVariation(true)} disabled={isLoading} icon={<Calculator className="w-4 h-4"/>}>Variação Calórica</Button>
              </>
            )}
            <Button variant="ghost" onClick={() => save('draft')} disabled={isLoading}>Salvar Rascunho</Button>
            <Button onClick={() => save('published')} disabled={isLoading}>Publicar</Button>
          </div>
        } 
      />

      {showCaloricVariation && (
        <div className="ec-card rounded-2xl p-5 mb-6 border border-accent-lime/30 bg-accent-lime/5">
          <h3 className="text-white font-bold mb-2">Criar Variação Calórica</h3>
          <p className="text-xs text-text-muted mb-4">A dieta atual tem {diet.calories} kcal. Informe a nova meta e o sistema recalculará todas as porções proporcionalmente.</p>
          <div className="flex gap-3 items-end">
            <Field label="Nova Meta (kcal)">
              <TextInput type="number" value={targetCalories} onChange={e => setTargetCalories(Number(e.target.value))} />
            </Field>
            <Button onClick={applyCaloricVariation}>Gerar Variação</Button>
            <Button variant="ghost" onClick={() => setShowCaloricVariation(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* 3-Column Desktop Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left: Structure */}
        <section className="lg:col-span-3 ec-card rounded-2xl p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/10 pb-2 flex justify-between items-center">
            Estrutura
            <span className="text-text-muted">{diet.meals.length} refeições</span>
          </h3>
          
          <div className="flex flex-col gap-2">
            {diet.meals.map((meal, index) => (
              <div 
                key={meal.id} 
                className={`p-3 rounded-xl border cursor-pointer transition-colors group ${activeMealId === meal.id ? 'bg-accent-lime/10 border-accent-lime/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                onClick={() => setActiveMealId(meal.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold text-sm ${activeMealId === meal.id ? 'text-accent-lime' : 'text-white'}`}>{meal.name}</span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); moveMeal(index, -1) }}><ArrowUp className="w-3 h-3" /></button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); moveMeal(index, 1) }}><ArrowDown className="w-3 h-3" /></button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); duplicateMeal(meal) }}><Copy className="w-3 h-3" /></button>
                    <button className="p-1 text-accent-red/70 hover:text-accent-red" onClick={(e) => { e.stopPropagation(); removeMeal(meal.id) }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="text-[10px] text-text-muted flex justify-between">
                  <span>{meal.items.length} itens</span>
                  <span>{meal.timeSuggestion || 'Horário livre'}</span>
                </div>
              </div>
            ))}
            {diet.meals.length === 0 && <p className="text-xs text-text-muted text-center py-4">Nenhuma refeição criada.</p>}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Button variant="ghost" className="text-xs py-2 w-full justify-start" onClick={() => addMeal()} icon={<Plus className="w-3 h-3" />}>Nova Refeição</Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => addMeal('Café da Manhã')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Café da Manhã</button>
              <button onClick={() => addMeal('Almoço')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Almoço</button>
              <button onClick={() => addMeal('Lanche')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Lanche</button>
              <button onClick={() => addMeal('Jantar')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Jantar</button>
            </div>
          </div>
        </section>

        {/* Center: Active Meal Editor */}
        <section className="lg:col-span-6 ec-card rounded-2xl p-5 min-h-[50vh]">
          {!activeMeal ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted py-20">
              <Utensils className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione ou crie uma refeição para editar.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-6">
              {/* Meal Header */}
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Nome da Refeição</label>
                  <input 
                    type="text" 
                    value={activeMeal.name} 
                    onChange={e => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === activeMeal.id ? { ...m, name: e.target.value } : m) }))}
                    className="w-full bg-transparent border-b border-white/20 text-white font-display font-bold text-2xl focus:outline-none focus:border-accent-lime pb-1"
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Horário</label>
                  <input 
                    type="time" 
                    value={activeMeal.timeSuggestion || ''} 
                    onChange={e => setDiet(prev => ({ ...prev, meals: prev.meals.map(m => m.id === activeMeal.id ? { ...m, timeSuggestion: e.target.value } : m) }))}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-lime"
                  />
                </div>
              </div>

              {/* Meal Macros Mini-Summary */}
              {activeMealMacros && (
                <div className="flex gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex-1"><p className="text-[10px] text-text-muted uppercase">Kcal</p><p className="text-sm font-bold text-white">{activeMealMacros.calories}</p></div>
                  <div className="flex-1"><p className="text-[10px] text-text-muted uppercase">Prot</p><p className="text-sm font-bold text-accent-sky">{activeMealMacros.protein}g</p></div>
                  <div className="flex-1"><p className="text-[10px] text-text-muted uppercase">Carb</p><p className="text-sm font-bold text-accent-lime">{activeMealMacros.carbs}g</p></div>
                  <div className="flex-1"><p className="text-[10px] text-text-muted uppercase">Gord</p><p className="text-sm font-bold text-accent-purple">{activeMealMacros.fat}g</p></div>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="text-[10px] text-text-muted uppercase tracking-widest font-black">Alimentos</h4>
                {activeMeal.items.map(item => (
                  <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-white/20 transition-colors">
                    <div className="flex-1 min-w-0 w-full">
                      <p className="text-sm text-white font-bold truncate">{item.foodName}</p>
                      <div className="flex gap-3 text-[10px] mt-1">
                        <span className="text-white/60">{item.macros.calories} kcal</span>
                        <span className="text-accent-sky/70">P: {item.macros.protein}g</span>
                        <span className="text-accent-lime/70">C: {item.macros.carbs}g</span>
                        <span className="text-accent-purple/70">G: {item.macros.fat}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="flex items-center bg-black rounded-lg border border-white/10 overflow-hidden flex-1 md:flex-none">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={e => updateItemQuantity(activeMeal.id, item.id, Number(e.target.value))} 
                          className="w-16 bg-transparent border-none py-2 text-sm text-white text-center focus:outline-none" 
                        />
                        <span className="text-xs text-text-muted pr-3 bg-white/5 h-full flex items-center">{item.unit}</span>
                      </div>
                      <button onClick={() => duplicateItem(activeMeal.id, item)} className="p-2 text-text-muted hover:text-white" title="Duplicar"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => removeItemFromMeal(activeMeal.id, item.id)} className="p-2 text-text-muted hover:text-accent-red" title="Remover"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {activeMeal.items.length === 0 && <p className="text-xs text-text-muted text-center py-6 border border-dashed border-white/10 rounded-xl">Nenhum alimento nesta refeição.</p>}
              </div>

              {/* Food Search */}
              <div className="mt-auto relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Buscar alimento (ex: frango, arroz)..." 
                    value={foodSearch}
                    onChange={e => setFoodSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime transition-colors"
                  />
                </div>
                {foodSearch && (
                  <div className="absolute bottom-full mb-2 w-full bg-ec-bg-primary border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                    <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1">
                      {filteredFoods.map(f => (
                        <button 
                          key={f.id} 
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 flex justify-between items-center group transition-colors"
                          onClick={() => { addFoodToMeal(activeMeal.id, f); setFoodSearch('') }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold group-hover:text-accent-lime transition-colors">{f.name}</span>
                            <span className="text-[10px] text-text-muted">Porção: {f.basePortion.amount}{f.basePortion.unit}</span>
                          </div>
                          <div className="flex gap-2 text-[10px]">
                            <span className="bg-white/5 px-2 py-1 rounded">{f.macrosPerBasePortion.calories}kcal</span>
                            <span className="bg-white/5 px-2 py-1 rounded text-accent-sky">{f.macrosPerBasePortion.protein}g</span>
                          </div>
                        </button>
                      ))}
                      {filteredFoods.length === 0 && <p className="px-4 py-3 text-sm text-text-muted text-center">Nenhum alimento encontrado.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right: Diet Summary & Meta */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="ec-card rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold uppercase italic text-white mb-4">Resumo da Dieta</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Calorias Totais</p>
                <p className="text-4xl font-display font-black text-white">{diet.calories} <span className="text-sm text-text-muted">kcal</span></p>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] text-accent-sky uppercase tracking-widest font-black mb-1">Prot</p>
                  <p className="text-lg font-bold text-white">{diet.protein}g</p>
                </div>
                <div>
                  <p className="text-[10px] text-accent-lime uppercase tracking-widest font-black mb-1">Carb</p>
                  <p className="text-lg font-bold text-white">{diet.carbs}g</p>
                </div>
                <div>
                  <p className="text-[10px] text-accent-purple uppercase tracking-widest font-black mb-1">Gord</p>
                  <p className="text-lg font-bold text-white">{diet.fat}g</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              <Field label="Título"><TextInput value={diet.title} onChange={e => setDiet({ ...diet, title: e.target.value })} placeholder="Ex: Protocolo Seca Barriga" /></Field>
              
              <div className="grid grid-cols-2 gap-3">
                <Field label="Objetivo">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={diet.goal} onChange={e => setDiet({ ...diet, goal: e.target.value as any })}>
                    <option value="fat_loss">Emagrecimento</option><option value="hypertrophy">Hipertrofia</option><option value="recomposition">Recomp</option><option value="health">Saúde</option>
                  </select>
                </Field>
                <Field label="Estilo">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={diet.style} onChange={e => setDiet({ ...diet, style: e.target.value as any })}>
                    <option value="simple">Simples</option><option value="low_carb">Low Carb</option><option value="intermittent_fasting">Jejum</option><option value="vegetarian">Veg</option><option value="economic">Econômica</option>
                  </select>
                </Field>
              </div>

              <Field label="Nível">
                <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={diet.level} onChange={e => setDiet({ ...diet, level: e.target.value as any })}>
                  <option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option>
                </select>
              </Field>

              <Field label="Tags"><TextInput value={diet.tags.join(', ')} onChange={e => setDiet({ ...diet, tags: sanitizeTags(e.target.value) })} placeholder="barato, pratico" /></Field>
              <Field label="Observações"><TextArea value={diet.notes || ''} onChange={e => setDiet({ ...diet, notes: e.target.value })} className="min-h-20 text-xs" placeholder="Beber muita água..." /></Field>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
