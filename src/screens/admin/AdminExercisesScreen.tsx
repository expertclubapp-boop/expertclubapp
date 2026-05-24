import { useState, useEffect, useMemo } from 'react'
import { toastError } from '../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Archive, Edit2, Copy } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminState, AdminToolbar, ConfirmButton } from './AdminShared'
import { exerciseService } from '../../services/exerciseService'
import type { Exercise } from '../../types/domain'

const EXERCISE_MUSCLE_CHIPS = [
  { id: 'peito',   label: 'Peito',   match: ['peito', 'peitoral', 'chest'] },
  { id: 'costas',  label: 'Costas',  match: ['costas', 'back', 'dorsal', 'lat', 'trapézio', 'trapezio'] },
  { id: 'ombro',   label: 'Ombro',   match: ['ombro', 'deltóide', 'deltoide', 'shoulder'] },
  { id: 'biceps',  label: 'Bíceps',  match: ['bíceps', 'biceps', 'bicep'] },
  { id: 'triceps', label: 'Tríceps', match: ['tríceps', 'triceps', 'tricep'] },
  { id: 'pernas',  label: 'Pernas',  match: ['pernas', 'quadríceps', 'quadriceps', 'femoral', 'glúteo', 'gluteo', 'panturrilha'] },
  { id: 'core',    label: 'Core',    match: ['core', 'abdômen', 'abdomen', 'abdominal', 'lombar'] },
]

function matchesMuscleChip(item: Exercise, chipId: string) {
  const chip = EXERCISE_MUSCLE_CHIPS.find(c => c.id === chipId)
  if (!chip) return true
  const all = [...(item.muscleGroups || []), item.primaryMuscleGroup || ''].map(s => s.toLowerCase())
  return chip.match.some(m => all.some(a => a.includes(m)))
}

export function AdminExercisesScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [muscleChip, setMuscleChip] = useState<string | null>(null)
  const [modalityFilter, setModalityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadExercises = async () => {
    setIsLoading(true)
    try {
      const data = await exerciseService.getExercises()
      setItems(data)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar exercícios.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchModality = modalityFilter === 'all' || item.modality === modalityFilter
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    const matchMuscle = !muscleChip || matchesMuscleChip(item, muscleChip)
    return matchSearch && matchModality && matchStatus && matchMuscle
  }), [items, search, modalityFilter, statusFilter, muscleChip])

  async function duplicateExercise(item: Exercise) {
    try {
      const clone = { ...item, name: `${item.name} (cópia)`, status: 'inactive' as const }
      delete (clone as any).id
      delete (clone as any).createdAt
      delete (clone as any).updatedAt
      const newId = await exerciseService.createExercise(clone)
      navigate(`/admin/exercises/${newId}`)
    } catch (err) {
      toastError('Erro ao duplicar.')
    }
  }

  async function toggleStatus(id: string, current: string) {
    try {
      await exerciseService.updateExercise(id, { status: current === 'active' ? 'inactive' : 'active' })
      loadExercises()
    } catch (err) {
      toastError('Erro ao alterar status.')
    }
  }

  return (
    <PageShell wide>
      <AdminToolbar 
        title="Banco de Exercícios" 
        eyebrow="Treinamento" 
        action={<Button className="md:w-auto" onClick={() => navigate('/admin/exercises/new')} icon={<Plus className="h-4 w-4" />}>Novo Exercício</Button>} 
      />
      
      <div className="flex flex-col gap-3 mb-6 ec-card p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime"
            />
          </div>
          <select
            value={modalityFilter}
            onChange={e => setModalityFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-lime md:w-48"
          >
            <option value="all">Todas modalidades</option>
            <option value="bodybuilding">Musculação</option>
            <option value="crossfit">Crossfit</option>
            <option value="functional">Funcional</option>
            <option value="home">Em Casa</option>
            <option value="mobility">Mobilidade</option>
            <option value="cardio">Cardio</option>
            <option value="mixed">Misto</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-lime md:w-40"
          >
            <option value="all">Todos status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {/* Muscle group chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMuscleChip(null)}
            className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase tracking-widest transition-all ${!muscleChip ? 'bg-white/15 border-white/20 text-white' : 'border-white/10 text-text-muted hover:border-white/20'}`}
          >
            Todos
          </button>
          {EXERCISE_MUSCLE_CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => setMuscleChip(muscleChip === chip.id ? null : chip.id)}
              className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase tracking-widest transition-all ${muscleChip === chip.id ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime' : 'border-white/10 text-text-muted hover:border-white/20'}`}
            >
              {chip.label}
            </button>
          ))}
          {(muscleChip || search || modalityFilter !== 'all' || statusFilter !== 'all') && (
            <span className="ml-auto text-[10px] text-text-muted">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Modalidade</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Grupo Muscular</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Equipamento</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-text-muted">{item.level === 'beginner' ? 'Iniciante' : item.level === 'intermediate' ? 'Intermediário' : 'Avançado'}</p>
                    </td>
                    <td className="p-4 text-xs text-text-secondary capitalize">{item.modality}</td>
                    <td className="p-4 text-xs text-text-muted">{item.primaryMuscleGroup || item.muscleGroups?.join(', ') || '-'}</td>
                    <td className="p-4 text-xs text-text-muted capitalize">{item.equipment}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(item.id, item.status)}
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${item.status === 'active' ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime hover:bg-accent-lime/20' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'}`}
                      >
                        {item.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10" onClick={() => navigate(`/admin/exercises/${item.id}`)}><Edit2 className="h-4 w-4" /></button>
                      <ConfirmButton message="Duplicar exercício?" onConfirm={() => duplicateExercise(item)}>
                        <Copy className="h-4 w-4" />
                      </ConfirmButton>
                      <ConfirmButton variant="destructive" message="Arquivar exercício?" onConfirm={async () => { await exerciseService.archiveExercise(item.id); loadExercises() }}>
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
