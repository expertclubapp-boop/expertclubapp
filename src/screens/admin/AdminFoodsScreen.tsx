import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Archive, Edit2, Copy } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminState, AdminToolbar, ConfirmButton } from './AdminShared'
import { foodService } from '../../services/foodService'
import type { Food } from '../../types/domain'

export function AdminFoodsScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Food[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadFoods = async () => {
    setIsLoading(true)
    try {
      const data = await foodService.getFoods()
      setItems(data)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar alimentos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFoods()
  }, [])

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  }), [items, search, categoryFilter, statusFilter])

  async function duplicateFood(item: Food) {
    if (!window.confirm('Duplicar este alimento?')) return
    try {
      const clone = { ...item, name: `${item.name} (cópia)`, status: 'inactive' as const }
      delete (clone as any).id
      delete (clone as any).createdAt
      delete (clone as any).updatedAt
      const newId = await foodService.createFood(clone)
      navigate(`/admin/foods/${newId}`)
    } catch (err) {
      alert('Erro ao duplicar.')
    }
  }

  async function toggleStatus(id: string, current: string) {
    try {
      await foodService.updateFood(id, { status: current === 'active' ? 'inactive' : 'active' })
      loadFoods()
    } catch (err) {
      alert('Erro ao alterar status.')
    }
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title="Banco de Alimentos" 
        eyebrow="Nutrição" 
        action={<Button className="md:w-auto" onClick={() => navigate('/admin/foods/new')} icon={<Plus className="h-4 w-4" />}>Novo Alimento</Button>} 
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 ec-card p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-ec-violet"
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-ec-violet md:w-48"
        >
          <option value="all">Todas categorias</option>
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
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-ec-violet md:w-40"
        >
          <option value="all">Todos status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Categoria</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Porção Base</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Macros</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-text-muted">{item.tags?.join(', ') || 'Sem tags'}</p>
                    </td>
                    <td className="p-4 text-xs text-text-secondary capitalize">{item.category}</td>
                    <td className="p-4 text-xs text-text-muted">{item.basePortion.amount}{item.basePortion.unit} ({item.basePortion.label})</td>
                    <td className="p-4">
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-accent-blue">{item.macrosPerBasePortion.protein}g P</span>
                        <span className="text-ec-violet font-bold">{item.macrosPerBasePortion.carbs}g C</span>
                        <span className="text-accent-yellow">{item.macrosPerBasePortion.fat}g G</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(item.id, item.status)}
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${item.status === 'active' ? 'bg-ec-violet/10 border-ec-violet/30 text-ec-violet hover:bg-ec-violet/20' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'}`}
                      >
                        {item.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10" onClick={() => navigate(`/admin/foods/${item.id}`)}><Edit2 className="h-4 w-4" /></button>
                      <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10" onClick={() => duplicateFood(item)}><Copy className="h-4 w-4" /></button>
                      <ConfirmButton variant="destructive" message="Arquivar alimento?" onConfirm={async () => { await foodService.archiveFood(item.id); loadFoods() }}>
                        <Archive className="h-4 w-4" />
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
    </PageShell>
  )
}
