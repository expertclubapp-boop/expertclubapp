import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coffee, Utensils, Zap, Flame, ShoppingCart, Repeat, AlertTriangle, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useDiet } from '../../hooks/useDiets'
import { useProfile } from '../../hooks/useProfile'
import { profileService } from '../../services/profileService'
import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'

export function DietDetailScreen() {
  const { dietId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { diet, isLoading } = useDiet(dietId)
  const { profile } = useProfile()
  
  const isSelected = profile?.selectedDietId === dietId

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!diet) return <div className="p-10 text-center text-text-muted font-display uppercase italic">Dieta não encontrada</div>

  const handleUseDiet = async () => {
    if (!firebaseUser || !dietId) return
    try {
      await profileService.updateProfile(firebaseUser.uid, { selectedDietId: dietId })
    } catch (error) {
      console.error("Error setting diet:", error)
    }
  }

  return (
    <PageShell className="pb-40">
      {/* Header */}
      <section className="mb-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-accent-lime transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-display text-sm font-bold uppercase tracking-widest">Voltar</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-lime/10 border border-accent-lime/20 rounded-full mb-4">
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-accent-lime animate-pulse' : 'bg-text-muted'}`}></span>
              <span className="text-[10px] font-bold text-accent-lime uppercase tracking-widest">
                {isSelected ? 'Plano Ativo' : 'Sugestão Expert'}
              </span>
            </div>
            <h1 className="font-display text-heading-1 text-text-primary mb-2 uppercase italic leading-tight">
              {diet.title}
            </h1>
            <p className="text-text-secondary text-body-lg max-w-2xl font-medium">
              {diet.notes || diet.description || 'Protocolo focado em densidade nutricional e performance.'}
            </p>
          </div>

          {!isSelected && (
            <Button 
              variant="primary" 
              onClick={handleUseDiet}
              className="md:w-auto px-8 py-4 rounded-xl shadow-lg"
              icon={<Check className="w-5 h-5" />}
            >
              Usar essa dieta
            </Button>
          )}
        </div>
      </section>

      {/* Macros Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-1 ec-card p-6 rounded-xl flex flex-col justify-center items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none"></div>
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2">Calorias</span>
          <span className="text-heading-2 font-display text-accent-lime uppercase italic leading-none">{diet.calories}</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2">kcal/dia</span>
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <MacroTile label="Proteína" value={`${diet.protein}g`} color="sky" icon={<Zap className="w-4 h-4" />} percent={45} />
          <MacroTile label="Carbo" value={`${diet.carbs}g`} color="lime" icon={<Flame className="w-4 h-4" />} percent={35} />
          <MacroTile label="Gordura" value={`${diet.fat}g`} color="purple" icon={<Utensils className="w-4 h-4" />} percent={20} />
        </div>
      </section>

      {/* Meals List */}
      <section className="space-y-4 mb-10">
        <h3 className="font-display text-heading-3 text-text-primary px-2 uppercase italic">Refeições do Dia</h3>
        
        {diet.meals && diet.meals.length > 0 ? diet.meals.map((meal) => (
          <div key={meal.id} className="ec-card rounded-xl overflow-hidden group">
            <div className="p-6 flex justify-between items-center bg-white/[0.02] border-b border-subtle">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-accent-sky/10 text-accent-sky`}>
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-text-primary font-bold font-display uppercase italic">{meal.name}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {meal.timeSuggestion || ''} • {meal.items.reduce((acc: number, f: any) => acc + (f.macros?.calories || 0), 0)} kcal
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {meal.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center group/item">
                  <div>
                    <span className="text-text-secondary font-medium">{item.foodName}</span>
                    {item.substitutionOptions && item.substitutionOptions.length > 0 && (
                      <p className="text-[10px] text-text-muted uppercase mt-1">Substituições: {item.substitutionOptions.map((s: any) => s.foodName).join(', ')}</p>
                    )}
                  </div>
                  <span className="font-display text-sm font-bold text-text-primary uppercase italic">{item.quantity}{item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="p-12 border border-dashed border-subtle rounded-xl text-center text-text-muted font-display uppercase italic">
            Cardápio detalhado em breve para este plano.
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Button variant="ghost" className="bg-surface-1 py-6" icon={<ShoppingCart className="w-5 h-5" />}>
          Lista de compras
        </Button>
        <Button variant="ghost" className="bg-surface-1 py-6" icon={<Repeat className="w-5 h-5" />}>
          Substituições
        </Button>
      </section>

      {/* Warning Footer */}
      <footer className="ec-card p-8 rounded-xl text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-accent-yellow" />
        </div>
        <p className="text-text-secondary text-sm leading-relaxed max-w-xl mx-auto font-medium">
          Este plano alimentar é uma sugestão baseada em perfis médios. Consulte sempre um nutricionista antes de iniciar qualquer mudança drástica em sua dieta.
        </p>
      </footer>
    </PageShell>
  )
}

function MacroTile({ label, value, color, icon, percent }: { label: string; value: string; color: 'lime' | 'sky' | 'purple'; icon: React.ReactNode; percent: number }) {
  const colorMap = {
    lime: 'text-accent-lime bg-accent-lime',
    sky: 'text-accent-sky bg-accent-sky',
    purple: 'text-accent-purple bg-accent-purple'
  }

  return (
    <div className="ec-card p-5 rounded-xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-text-muted font-display text-[10px] font-bold uppercase tracking-widest">{label}</span>
        <div className={`p-1 rounded-md bg-opacity-10 ${colorMap[color].split(' ')[0]}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-heading-3 font-display text-text-primary uppercase italic leading-none">{value}</div>
        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className={`${colorMap[color].split(' ')[1]} h-full transition-all duration-700`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    </div>
  )
}
