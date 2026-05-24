import { useState, useEffect } from 'react'
import { toastError } from '../../components/ui/Toast'
import { useNavigate, useParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminToolbar, Field, TextInput, StatusSelect } from './AdminShared'
import { foodService } from '../../services/foodService'
import { sanitizeTags } from '../../services/adminCrudService'
import type { Food } from '../../types/domain'

function calcCalories(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}

const emptyFood: Omit<Food, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'other',
  basePortion: { amount: 100, unit: 'g', label: '100g' },
  macrosPerBasePortion: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  tags: [],
  substitutionGroups: [],
  status: 'active',
}

export function AdminFoodEditorScreen() {
  const { foodId } = useParams()
  const navigate = useNavigate()
  const [food, setFood] = useState<Omit<Food, 'id' | 'createdAt' | 'updatedAt'>>(emptyFood)
  const [isLoading, setIsLoading] = useState(false)
  const [autoCalc, setAutoCalc] = useState(true)

  useEffect(() => {
    if (foodId && foodId !== 'new') {
      setIsLoading(true)
      foodService.getFood(foodId)
        .then(found => {
          if (found) setFood(found)
        })
        .finally(() => setIsLoading(false))
    }
  }, [foodId])

  async function save() {
    try {
      setIsLoading(true)
      if (foodId && foodId !== 'new') {
        await foodService.updateFood(foodId, food)
      } else {
        await foodService.createFood(food)
      }
      navigate('/admin/foods')
    } catch (error) {
      toastError('Erro ao salvar alimento.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageShell wide><p className="text-white p-5">Carregando...</p></PageShell>

  return (
    <PageShell wide>
      <AdminToolbar 
        title={food.name || 'Novo Alimento'} 
        eyebrow="Editor de Alimento" 
        action={<Button onClick={save} disabled={isLoading}>{foodId === 'new' ? 'Criar' : 'Salvar'}</Button>} 
      />

      <section className="ec-card rounded-2xl p-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3"><h3 className="font-bold text-white uppercase italic tracking-wider">Informações Básicas</h3></div>
        
        <Field label="Nome do Alimento">
          <TextInput value={food.name} onChange={e => setFood({ ...food, name: e.target.value })} placeholder="Ex: Peito de Frango" />
        </Field>
        <Field label="Categoria">
          <select 
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white focus:border-accent-lime focus:outline-none" 
            value={food.category} 
            onChange={e => setFood({ ...food, category: e.target.value as any })}
          >
            <option value="protein">Proteína</option>
            <option value="carbohydrate">Carboidrato</option>
            <option value="fat">Gordura</option>
            <option value="fruit">Fruta</option>
            <option value="vegetable">Vegetal</option>
            <option value="dairy">Laticínio</option>
            <option value="supplement">Suplemento</option>
            <option value="drink">Bebida</option>
            <option value="other">Outro</option>
          </select>
        </Field>
        <Field label="Status">
          <StatusSelect value={food.status} onChange={val => setFood({ ...food, status: val as any })} />
        </Field>

        <div className="md:col-span-2 lg:col-span-3 mt-4"><h3 className="font-bold text-white uppercase italic tracking-wider">Porção Base & Macros</h3></div>
        
        <div className="grid grid-cols-3 gap-2">
          <Field label="Qtd">
            <TextInput type="number" value={food.basePortion.amount} onChange={e => setFood({ ...food, basePortion: { ...food.basePortion, amount: Number(e.target.value) } })} />
          </Field>
          <Field label="Unidade">
            <select 
              className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white focus:border-accent-lime focus:outline-none" 
              value={food.basePortion.unit} 
              onChange={e => setFood({ ...food, basePortion: { ...food.basePortion, unit: e.target.value as any } })}
            >
              <option value="g">g</option><option value="ml">ml</option><option value="unit">un</option><option value="slice">fatia</option><option value="scoop">scoop</option><option value="cup">xícara</option><option value="tbsp">col. sopa</option><option value="tsp">col. chá</option>
            </select>
          </Field>
          <Field label="Label">
            <TextInput value={food.basePortion.label} onChange={e => setFood({ ...food, basePortion: { ...food.basePortion, label: e.target.value } })} placeholder="Ex: 100g" />
          </Field>
        </div>

        {/* Macros — protein/carbs/fat first, calories auto or manual */}
        <Field label="Proteína (g)">
          <TextInput
            type="number"
            value={food.macrosPerBasePortion.protein}
            onChange={e => {
              const protein = Number(e.target.value)
              setFood(prev => ({
                ...prev,
                macrosPerBasePortion: {
                  ...prev.macrosPerBasePortion,
                  protein,
                  calories: autoCalc ? calcCalories(protein, prev.macrosPerBasePortion.carbs, prev.macrosPerBasePortion.fat) : prev.macrosPerBasePortion.calories,
                },
              }))
            }}
          />
        </Field>
        <Field label="Carboidratos (g)">
          <TextInput
            type="number"
            value={food.macrosPerBasePortion.carbs}
            onChange={e => {
              const carbs = Number(e.target.value)
              setFood(prev => ({
                ...prev,
                macrosPerBasePortion: {
                  ...prev.macrosPerBasePortion,
                  carbs,
                  calories: autoCalc ? calcCalories(prev.macrosPerBasePortion.protein, carbs, prev.macrosPerBasePortion.fat) : prev.macrosPerBasePortion.calories,
                },
              }))
            }}
          />
        </Field>
        <Field label="Gorduras (g)">
          <TextInput
            type="number"
            value={food.macrosPerBasePortion.fat}
            onChange={e => {
              const fat = Number(e.target.value)
              setFood(prev => ({
                ...prev,
                macrosPerBasePortion: {
                  ...prev.macrosPerBasePortion,
                  fat,
                  calories: autoCalc ? calcCalories(prev.macrosPerBasePortion.protein, prev.macrosPerBasePortion.carbs, fat) : prev.macrosPerBasePortion.calories,
                },
              }))
            }}
          />
        </Field>
        <Field label="Fibras (g) — opcional">
          <TextInput
            type="number"
            value={food.macrosPerBasePortion.fiber ?? ''}
            onChange={e => setFood(prev => ({ ...prev, macrosPerBasePortion: { ...prev.macrosPerBasePortion, fiber: e.target.value === '' ? undefined : Number(e.target.value) } }))}
            placeholder="0"
          />
        </Field>

        {/* Calories — auto-calculated or manual override */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Field label="Calorias (kcal)">
                <TextInput
                  type="number"
                  value={food.macrosPerBasePortion.calories}
                  onChange={e => { setAutoCalc(false); setFood(prev => ({ ...prev, macrosPerBasePortion: { ...prev.macrosPerBasePortion, calories: Number(e.target.value) } })) }}
                  className={autoCalc ? 'opacity-70' : ''}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  setAutoCalc(true)
                  setFood(prev => ({
                    ...prev,
                    macrosPerBasePortion: {
                      ...prev.macrosPerBasePortion,
                      calories: calcCalories(prev.macrosPerBasePortion.protein, prev.macrosPerBasePortion.carbs, prev.macrosPerBasePortion.fat),
                    },
                  }))
                }}
                className={`flex items-center gap-1.5 text-[10px] px-3 py-2 rounded-lg border font-bold uppercase tracking-widest transition-all ${autoCalc ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime' : 'border-white/10 text-text-muted hover:border-accent-lime/30 hover:text-accent-lime'}`}
              >
                <Zap className="w-3 h-3" /> {autoCalc ? 'Auto (ativo)' : 'Recalcular'}
              </button>
              {autoCalc && (
                <span className="text-[10px] text-text-muted">
                  {food.macrosPerBasePortion.protein}P × 4 + {food.macrosPerBasePortion.carbs}C × 4 + {food.macrosPerBasePortion.fat}G × 9
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 mt-4"><h3 className="font-bold text-white uppercase italic tracking-wider">Organização & Substituição</h3></div>
        
        <div className="md:col-span-2">
          <Field label="Tags (separadas por vírgula)">
            <TextInput value={food.tags.join(', ')} onChange={e => setFood({ ...food, tags: sanitizeTags(e.target.value) })} placeholder="magro, frango, assado" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Grupos de Substituição (separados por vírgula)">
            <TextInput value={food.substitutionGroups.join(', ')} onChange={e => setFood({ ...food, substitutionGroups: sanitizeTags(e.target.value) })} placeholder="proteina-magra, frango" />
          </Field>
        </div>
      </section>
    </PageShell>
  )
}
