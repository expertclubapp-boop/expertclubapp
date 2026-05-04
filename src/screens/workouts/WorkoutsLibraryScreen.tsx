import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { FilterChip } from '../../components/ui/FilterChip'
import { WorkoutCard } from '../../components/ui/WorkoutCard'
import { PageShell, SectionHeader } from '../../components/ui/Premium'
import { useWorkouts } from '../../hooks/useWorkouts'

export function WorkoutsLibraryScreen() {
  const navigate = useNavigate()
  const { workouts, isLoading } = useWorkouts()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    objective: 'all',
    modality: 'all',
    level: 'all',
    frequency: 'all',
    duration: 'all',
    focus: 'all',
  })

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.title.toLowerCase().includes(search.toLowerCase())
    const matchesObjective = filters.objective === 'all' || workout.goal === filters.objective
    const matchesModality = filters.modality === 'all' || workout.modality === filters.modality || workout.tags?.includes(filters.modality)
    const matchesLevel = filters.level === 'all' || workout.level === filters.level
    const matchesFrequency = filters.frequency === 'all' || workout.daysPerWeek === Number(filters.frequency)
    const matchesDuration = filters.duration === 'all' || workout.durationMinutes <= Number(filters.duration)
    const matchesFocus = filters.focus === 'all' || workout.focus?.includes(filters.focus) || workout.tags?.includes(filters.focus)
    return matchesSearch && matchesObjective && matchesModality && matchesLevel && matchesFrequency && matchesDuration && matchesFocus
  })

  const setFilter = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }))

  return (
    <PageShell wide>
      {/* Search & Header Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <SectionHeader
            eyebrow="Biblioteca Expert"
            title="Treinos"
            description="Protocolos de treinamento de alta performance."
            tone="violet"
          />
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-ec-violet transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ec-input w-full rounded-xl py-4 pl-12 pr-4 text-text-primary outline-none transition-all placeholder:text-text-disabled"
              placeholder="Buscar treino..."
            />
          </div>
        </div>

        <div className="ec-card rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <SlidersHorizontal className="h-4 w-4 text-ec-violet" />
            Encontrar treino compatível
          </div>
          <FilterRow label="Objetivo" options={[
            ['all', 'Todos'], ['fat_loss', 'Emagrecimento'], ['hypertrophy', 'Hipertrofia'], ['health', 'Saúde'], ['endurance', 'Condicionamento'], ['strength', 'Performance'],
          ]} value={filters.objective} onChange={value => setFilter('objective', value)} />
          <FilterRow label="Modalidade" options={[
            ['all', 'Todas'], ['gym', 'Musculação'], ['crossfit', 'Crossfit'], ['running', 'Corrida'], ['martial_arts', 'Jiu-jitsu'], ['functional', 'Funcional'], ['home', 'Casa'],
          ]} value={filters.modality} onChange={value => setFilter('modality', value)} />
          <FilterRow label="Nível" options={[
            ['all', 'Todos'], ['beginner', 'Iniciante'], ['intermediate', 'Intermediário'], ['advanced', 'Avançado'],
          ]} value={filters.level} onChange={value => setFilter('level', value)} />
          <FilterRow label="Dias por semana" options={[
            ['all', 'Todos'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'],
          ]} value={filters.frequency} onChange={value => setFilter('frequency', value)} />
          <FilterRow label="Tempo por treino" options={[
            ['all', 'Todos'], ['30', '30min'], ['45', '45min'], ['60', '60min'], ['90', '90min'],
          ]} value={filters.duration} onChange={value => setFilter('duration', value)} />
          <FilterRow label="Foco" options={[
            ['all', 'Todos'], ['full_body', 'Corpo todo'], ['glutes', 'Glúteos'], ['lower', 'Inferiores'], ['upper', 'Superiores'], ['strength', 'Força'], ['endurance', 'Resistência'],
          ]} value={filters.focus} onChange={value => setFilter('focus', value)} />
        </div>
      </div>

      {/* Workout Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="ec-card h-80 rounded-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              workout={workout} 
              onClick={(id) => navigate(`/app/workouts/${id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function FilterRow({ label, options, value, onChange }: { label: string; options: string[][]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="border-t border-white/5 py-3 first:border-t-0">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map(([id, text]) => (
          <FilterChip key={id} label={text} isSelected={value === id} onClick={() => onChange(id)} />
        ))}
      </div>
    </div>
  )
}
