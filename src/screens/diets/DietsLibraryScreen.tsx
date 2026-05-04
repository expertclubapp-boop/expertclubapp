import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { FilterChip } from '../../components/ui/FilterChip'
import { DietCard } from '../../components/ui/DietCard'
import { PageShell, SectionHeader } from '../../components/ui/Premium'
import { useDiets } from '../../hooks/useDiets'

export function DietsLibraryScreen() {
  const navigate = useNavigate()
  const { diets, isLoading } = useDiets()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    objective: 'all',
    style: 'all',
    calories: 'all',
    mealsPerDay: 'all',
    restriction: 'all',
  })

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
    <PageShell wide>
      {/* Search & Header Section */}
      <section className="mb-10">
        <SectionHeader
          eyebrow="Nutrição"
          title="Dietas Expert"
          description="Planos alimentares com macros, refeições e substituições para sustentar o treino."
          tone="sky"
          className="mb-6"
        />
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-text-muted group-focus-within:text-accent-lime transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ec-input w-full rounded-xl py-4 pl-12 pr-4 text-text-primary outline-none transition-all placeholder:text-text-disabled"
            placeholder="Buscar por nome, alimento ou objetivo..."
          />
        </div>

        <div className="ec-card mt-6 rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <SlidersHorizontal className="h-4 w-4 text-accent-sky" />
            Encontrar dieta compatível
          </div>
          <FilterRow label="Objetivo" options={[
            ['all', 'Todos'], ['fat_loss', 'Emagrecimento'], ['hypertrophy', 'Hipertrofia'], ['health', 'Manutenção'],
          ]} value={filters.objective} onChange={value => setFilter('objective', value)} />
          <FilterRow label="Estilo" options={[
            ['all', 'Todos'], ['simple', 'Simples'], ['low_carb', 'Low carb'], ['fasting', 'Jejum'], ['vegetarian', 'Vegetariana'], ['budget', 'Econômica'], ['meal_prep', 'Marmitas'], ['busy', 'Rotina corrida'],
          ]} value={filters.style} onChange={value => setFilter('style', value)} />
          <FilterRow label="Calorias" options={[
            ['all', 'Todas'], ['1200', '1200'], ['1500', '1500'], ['1600', '1600'], ['1800', '1800'], ['2000', '2000'], ['2300', '2300'], ['2700', '2700'], ['3100', '3100'],
          ]} value={filters.calories} onChange={value => setFilter('calories', value)} />
          <FilterRow label="Refeições por dia" options={[
            ['all', 'Todas'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'],
          ]} value={filters.mealsPerDay} onChange={value => setFilter('mealsPerDay', value)} />
          <FilterRow label="Preferências" options={[
            ['all', 'Todas'], ['no_whey', 'Sem whey'], ['with_whey', 'Com whey'], ['no_lactose', 'Sem lactose'], ['cheap_foods', 'Alimentos baratos'],
          ]} value={filters.restriction} onChange={value => setFilter('restriction', value)} />
        </div>
      </section>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="ec-card h-64 rounded-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiets.map((diet, index) => (
            <DietCard 
              key={diet.id} 
              diet={diet} 
              isFeatured={index === 0} 
              onView={(id) => navigate(`/app/diets/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Promotion Card / CTA */}
      <div className="mt-12 lg:col-span-2 ec-hero-shell rounded-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="font-display text-heading-2 text-text-primary mb-4 uppercase italic">Coaching de macros</h2>
          <p className="text-text-secondary max-w-md mb-8 font-medium">Ajuste dieta, água e treino em um protocolo coerente com sua rotina.</p>
          <button className="ec-premium-cta px-8 py-4 rounded-xl font-bold font-display uppercase italic tracking-widest hover:scale-[1.02] transition-transform">Desbloquear acesso</button>
        </div>
        <div className="relative z-10 w-full md:w-1/3 flex justify-center">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/[0.045] p-4 rounded-2xl backdrop-blur-sm border border-white/[0.08]">
                <div className="w-6 h-6 rounded-full bg-accent-lime/20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
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
