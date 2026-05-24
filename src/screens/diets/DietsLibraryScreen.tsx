import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Search, SlidersHorizontal, UtensilsCrossed, Crown } from 'lucide-react'
import { useDiets } from '../../hooks/useDiets'
import { useProfile } from '../../hooks/useProfile'
import { useActivePrescription } from '../../hooks/useActivePrescription'
import { usePlanTier } from '../../hooks/usePlanTier'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { ExpertClubDietCard } from '../../components/v2/ExpertClubDietCard'
import { V2Card, V2Badge, V2IconBubble, cx } from '../../components/v2/ExpertClubV2Base'

export function DietsLibraryScreen() {
  const navigate = useNavigate()
  const { diets, isLoading } = useDiets()
  const { profile } = useProfile()
  const { assignment: prescribedDiet } = useActivePrescription('diet')
  const { isLowTicket } = usePlanTier()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    objective: 'all',
    style: 'all',
    calories: 'all',
    mealsPerDay: 'all',
    restriction: 'all',
  })

  const currentDiet = useMemo(
    () => diets.find(d => d.id === profile?.selectedDietId) || null,
    [diets, profile?.selectedDietId],
  )

  const filteredDiets = diets.filter(diet => {
    const matchesSearch = diet.title.toLowerCase().includes(search.toLowerCase())
    const matchesObjective = filters.objective === 'all' || diet.goal === filters.objective
    const matchesStyle = filters.style === 'all' || diet.style === filters.style || diet.tags?.includes(filters.style)
    const matchesCalories = filters.calories === 'all' || diet.calories <= Number(filters.calories)
    const matchesMeals = filters.mealsPerDay === 'all' || diet.meals?.length === Number(filters.mealsPerDay) || diet.mealsPerDay === Number(filters.mealsPerDay)
    const matchesRestriction = filters.restriction === 'all' || diet.tags?.includes(filters.restriction)
    return matchesSearch && matchesObjective && matchesStyle && matchesCalories && matchesMeals && matchesRestriction
  })

  const setFilter = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }))

  return (
    <ExpertClubMobileShell active="Dieta" title="Nutrição" subtitle="Planos de performance">
      <div className="flex flex-col gap-6">

        {/* CURRENT DIET CARD */}
        {currentDiet && (
          <V2Card className="overflow-hidden border border-ec-violet/25 bg-gradient-to-br from-ec-violet/12 via-[#101827] to-[#0d1422] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <V2Badge tone="success">Dieta atual</V2Badge>
                  {prescribedDiet && <V2Badge tone="warning">Prescrita pelo mentor</V2Badge>}
                </div>
                <h2 className="mt-4 text-2xl font-black italic uppercase leading-tight text-white">
                  {currentDiet.title}
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {currentDiet.goal} · {currentDiet.calories} kcal · {currentDiet.mealsPerDay} refeições
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-ec-violet">
                {prescribedDiet ? <Crown size={22} /> : <UtensilsCrossed size={22} />}
              </div>
            </div>
            {prescribedDiet && (
              <p className="mt-4 text-[10px] text-text-muted">
                prescrita por {prescribedDiet.assignedByName}
              </p>
            )}
          </V2Card>
        )}

        {/* SEARCH BAR */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-ec-violet transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white font-bold placeholder:text-text-muted outline-none focus:border-ec-violet/50 transition-all"
            placeholder="Buscar dieta..."
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
              ['all', 'Todos'], ['fat_loss', 'Perda Peso'], ['hypertrophy', 'Músculo'], ['health', 'Saúde'],
            ]} value={filters.objective} onChange={value => setFilter('objective', value)} />
            
            <FilterRow label="Estilo" options={[
              ['all', 'Todos'], ['simple', 'Simples'], ['low_carb', 'Low carb'], ['vegetarian', 'Veggie'],
            ]} value={filters.style} onChange={value => setFilter('style', value)} />
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
            {filteredDiets.length > 0 ? (
              filteredDiets.map((diet) => {
                const locked = isLowTicket && diet.accessTier === 'mentoring'
                return locked ? (
                  <div key={diet.id} className="relative">
                    <div className="pointer-events-none opacity-50 select-none">
                      <ExpertClubDietCard diet={diet} onClick={() => {}} />
                    </div>
                    <button
                      onClick={() => navigate('/app/meu-plano')}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-black/70 backdrop-blur-[2px]"
                    >
                      <Lock className="w-7 h-7 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">Exclusivo Mentoria 1:1</span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Fazer upgrade →</span>
                    </button>
                  </div>
                ) : (
                  <ExpertClubDietCard
                    key={diet.id}
                    diet={diet}
                    onClick={(id) => navigate(`/app/diets/${id}`)}
                  />
                )
              })
            ) : (
              <div className="py-20 text-center">
                 <V2IconBubble icon={Search} tone="neutral" className="mx-auto mb-4" />
                 <p className="text-text-muted font-bold">Nenhuma dieta encontrada.</p>
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
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cx(
              "whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
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
