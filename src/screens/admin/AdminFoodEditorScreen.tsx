import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { toastError } from '../../components/ui/Toast'
import { AdminToolbar, Field, TextInput, StatusSelect } from './AdminShared'
import { foodService } from '../../services/foodService'
import { sanitizeTags } from '../../services/adminCrudService'
import type { Food } from '../../types/domain'

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

        <Field label="Calorias (kcal)">
          <TextInput type="number" value={food.macrosPerBasePortion.calories} onChange={e => setFood({ ...food, macrosPerBasePortion: { ...food.macrosPerBasePortion, calories: Number(e.target.value) } })} />
        </Field>
        <Field label="Proteína (g)">
          <TextInput type="number" value={food.macrosPerBasePortion.protein} onChange={e => setFood({ ...food, macrosPerBasePortion: { ...food.macrosPerBasePortion, protein: Number(e.target.value) } })} />
        </Field>
        <Field label="Carboidratos (g)">
          <TextInput type="number" value={food.macrosPerBasePortion.carbs} onChange={e => setFood({ ...food, macrosPerBasePortion: { ...food.macrosPerBasePortion, carbs: Number(e.target.value) } })} />
        </Field>
        <Field label="Gorduras (g)">
          <TextInput type="number" value={food.macrosPerBasePortion.fat} onChange={e => setFood({ ...food, macrosPerBasePortion: { ...food.macrosPerBasePortion, fat: Number(e.target.value) } })} />
        </Field>

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
