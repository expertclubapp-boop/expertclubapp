import { useState, useEffect, useMemo } from 'react'
import { toastError } from '../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Archive, Edit2, Copy } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminState, AdminToolbar, ConfirmButton } from './AdminShared'
import { workoutService } from '../../services/workoutService'
import type { Workout } from '../../types/domain'

export function AdminWorkoutsScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [goalFilter, setGoalFilter] = useState('all')
  const [modalityFilter, setModalityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadWorkouts = async () => {
    setIsLoading(true)
    try {
      const data = await workoutService.getAll()
      setItems(data)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar treinos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase())
    const matchGoal = goalFilter === 'all' || item.goal === goalFilter
    const matchModality = modalityFilter === 'all' || item.modality === modalityFilter
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchGoal && matchModality && matchStatus
  }), [items, search, goalFilter, modalityFilter, statusFilter])

  async function duplicateWorkout(item: Workout) {
    try {
      const clone = { ...item, title: `${item.title} (cópia)`, status: 'draft' as const, version: 1 }
      delete (clone as any).id
      delete (clone as any).createdAt
      delete (clone as any).updatedAt
      delete (clone as any).publishedAt
      const newId = await workoutService.create(clone)
      navigate(`/admin/workouts/${newId}`)
    } catch (err) {
      toastError('Erro ao duplicar.')
    }
  }

  async function archiveWorkout(id: string) {
    try {
      await workoutService.update(id, { status: 'archived' })
      loadWorkouts()
    } catch (err) {
      toastError('Erro ao arquivar treino.')
    }
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title="Treinos Prescritos" 
        eyebrow="Treinamento Estruturado" 
        action={<Button className="md:w-auto" onClick={() => navigate('/admin/workouts/new')} icon={<Plus className="h-4 w-4" />}>Novo Treino</Button>} 
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 ec-card p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar treino por título..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime"
          />
        </div>
        <select 
          value={goalFilter} 
          onChange={e => setGoalFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-lime md:w-40"
        >
          <option value="all">Todos os Objetivos</option>
          <option value="hypertrophy">Hipertrofia</option>
          <option value="fat_loss">Emagrecimento</option>
          <option value="recomposition">Recomposição</option>
          <option value="conditioning">Condicionamento</option>
          <option value="performance">Performance</option>
          <option value="health">Saúde</option>
        </select>
        <select 
          value={modalityFilter} 
          onChange={e => setModalityFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-lime md:w-40"
        >
          <option value="all">Todas as Modalidades</option>
          <option value="bodybuilding">Musculação</option>
          <option value="crossfit">Crossfit</option>
          <option value="functional">Funcional</option>
          <option value="home">Em Casa</option>
          <option value="mixed">Misto</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-lime md:w-36"
        >
          <option value="all">Todos status</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>

      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Título do Treino</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Objetivo</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Estrutura</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-[10px] text-text-muted">v{item.version} • {item.modality} • Nível: {item.level}</p>
                    </td>
                    <td className="p-4 text-xs text-text-secondary capitalize">{item.goal.replace('_', ' ')}</td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-white">{item.daysPerWeek} dias/semana</p>
                      <p className="text-[10px] text-text-muted mt-1">{item.durationMinutes} min/sessão</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${item.status === 'published' ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime' : item.status === 'draft' ? 'bg-white/5 border-white/10 text-white' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10" onClick={() => navigate(`/admin/workouts/${item.id}`)}><Edit2 className="h-4 w-4" /></button>
                      <ConfirmButton message="Duplicar treino?" onConfirm={() => duplicateWorkout(item)}>
                        <Copy className="h-4 w-4" />
                      </ConfirmButton>
                      {item.status !== 'archived' && (
                        <ConfirmButton variant="destructive" message="Arquivar treino?" onConfirm={async () => archiveWorkout(item.id)}>
                          <Archive className="h-4 w-4" />
                        </ConfirmButton>
                      )}
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
