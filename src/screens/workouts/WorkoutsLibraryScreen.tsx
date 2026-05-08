import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useWorkouts } from '../../hooks/useWorkouts'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { ExpertClubWorkoutCard } from '../../components/v2/ExpertClubWorkoutCard'
import { V2Card, V2IconBubble, cx } from '../../components/v2/ExpertClubV2Base'

export function WorkoutsLibraryScreen() {
  const navigate = useNavigate()
  const { workouts, isLoading } = useWorkouts()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
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
    <ExpertClubMobileShell active="Treinos" title="Biblioteca" subtitle="Protocolos de performance">
      <div className="flex flex-col gap-6">
        
        {/* SEARCH BAR */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-ec-violet transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white font-bold placeholder:text-text-muted outline-none focus:border-ec-violet/50 transition-all"
            placeholder="Buscar treino..."
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
              showFilters ? "bg-ec-violet text-white" : "bg-white/5 text-text-muted hover:text-white"
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* FILTERS AREA */}
        {showFilters && (
          <V2Card className="p-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <FilterRow label="Objetivo" options={[
              ['all', 'Todos'], ['fat_loss', 'Perda Peso'], ['hypertrophy', 'Músculo'], ['health', 'Saúde'], ['endurance', 'Condição'], ['strength', 'Força'],
            ]} value={filters.objective} onChange={value => setFilter('objective', value)} />
            
            <FilterRow label="Nível" options={[
              ['all', 'Todos'], ['beginner', 'Iniciante'], ['intermediate', 'Interm.'], ['advanced', 'Expert'],
            ]} value={filters.level} onChange={value => setFilter('level', value)} />
            
            <FilterRow label="Modalidade" options={[
              ['all', 'Todas'], ['gym', 'Academia'], ['functional', 'Funcional'], ['home', 'Casa'],
            ]} value={filters.modality} onChange={value => setFilter('modality', value)} />
          </V2Card>
        )}

        {/* RESULTS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="ec-v2-card h-64 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-8">
            {filteredWorkouts.length > 0 ? (
              filteredWorkouts.map((workout) => (
                <ExpertClubWorkoutCard 
                  key={workout.id} 
                  workout={workout} 
                  onClick={(id) => navigate(`/app/workouts/${id}`)}
                />
              ))
            ) : (
              <div className="py-20 text-center">
                 <V2IconBubble icon={Search} tone="neutral" className="mx-auto mb-4" />
                 <p className="text-text-muted font-bold">Nenhum treino encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ExpertClubMobileShell>
  )
}

function FilterRow({ label, options, value, onChange }: { label: string; options: string[][]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cx(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              value === id 
                ? "bg-ec-violet text-white shadow-lg shadow-ec-violet/20" 
                : "bg-white/5 text-text-muted hover:text-white"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
