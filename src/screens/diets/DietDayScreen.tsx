import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChefHat,
  Droplets,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react'
import { useDietDay } from '../../hooks/useDietDay'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { V2Card, V2IconBubble, V2ProgressBar, V2Button, V2Badge, cx } from '../../components/v2/ExpertClubV2Base'

export function DietDayScreen() {
  const navigate = useNavigate()
  const { dietDay, diet, isLoading, toggleFood } = useDietDay()
  const [substitutionTarget, setSubstitutionTarget] = useState<{ mealId: string; food: { foodId: string; foodName: string } } | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})

  const toggleMeal = (mealId: string) => setExpandedMeals(prev => ({ ...prev, [mealId]: prev[mealId] === false ? true : false }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050A12] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!dietDay || !diet) {
    return (
      <ExpertClubMobileShell active="Dieta" title="Dieta">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <V2IconBubble icon={ChefHat} tone="neutral" className="mb-6 scale-150" />
          <h2 className="text-xl font-black italic text-white uppercase mb-2">Plano Inativo</h2>
          <p className="text-text-muted text-xs mb-8 max-w-xs mx-auto">Você ainda não selecionou uma dieta ativa na biblioteca.</p>
          <V2Button variant="primary" onClick={() => navigate('/app/diets')}>BIBLIOTECA DE DIETAS</V2Button>
        </div>
      </ExpertClubMobileShell>
    )
  }

  const adherence = dietDay.adherencePercent || 0
  const adherenceTone = adherence >= 80 ? 'success' : adherence >= 50 ? 'info' : 'violet'
  type DietMeal = NonNullable<typeof diet.meals>[number] & {
    mealId?: string
    mealName?: string
    time?: string
  }
  type MealLog = typeof dietDay.meals[number]['foods'][number] & {
    consumed?: boolean
    quantity?: string | number
    unit?: string
  }

  return (
    <ExpertClubMobileShell active="Dieta" title="Hoje" subtitle={diet.title}>
      <div className="flex flex-col gap-8 pb-32">
        
        {/* PROGRESS CARD */}
        <V2Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-mono font-black uppercase tracking-[0.15em] text-text-muted">Adesão do dia</p>
            <V2Badge tone={adherenceTone}>{adherence}%</V2Badge>
          </div>
          <V2ProgressBar value={adherence} tone={adherenceTone} className="h-1.5 mb-4" />

          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'KCAL', v: dietDay.totalCaloriesConsumed ?? 0, t: dietDay.totalCaloriesPlanned ?? diet.calories ?? 0, unit: '' },
              { l: 'P', v: dietDay.totalProteinConsumed ?? 0, t: dietDay.totalProteinPlanned ?? (diet as any).protein ?? 0, unit: 'g' },
              { l: 'C', v: dietDay.totalCarbsConsumed ?? 0, t: dietDay.totalCarbsPlanned ?? (diet as any).carbs ?? 0, unit: 'g' },
              { l: 'G', v: dietDay.totalFatConsumed ?? 0, t: dietDay.totalFatPlanned ?? (diet as any).fat ?? 0, unit: 'g' },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-black/20 border border-white/6 p-2 text-center">
                <p className="font-mono text-[9px] text-text-muted mb-1">{m.l}</p>
                <p className="font-mono text-sm font-bold text-white leading-none">{m.v}{m.unit}</p>
                <p className="font-mono text-[9px] text-text-muted mt-0.5">/{m.t}{m.unit}</p>
              </div>
            ))}
          </div>
        </V2Card>

        {/* MEALS LIST */}
        <div className="space-y-4">
          {diet.meals.length === 0 && (
            <V2Card className="p-6">
              <V2IconBubble icon={ChefHat} tone="warning" size={18} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-yellow">REFEIÇÕES</p>
              <h3 className="mt-2 text-lg font-black italic text-white uppercase">Dieta sem refeições configuradas</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-secondary">
                O plano tem meta de calorias e macros, mas ainda não possui refeições cadastradas. Abra a biblioteca para escolher outro plano ou aguarde a prescrição completa.
              </p>
              <V2Button variant="secondary" className="mt-5 w-full" onClick={() => navigate('/app/diets')}>
                VER DIETAS
              </V2Button>
            </V2Card>
          )}
          {diet.meals.map((meal: DietMeal) => {
            const resolvedMealId = meal.id ?? meal.mealId ?? meal.name
            const mealLogs: MealLog[] = (dietDay.meals.find(m => m.mealId === resolvedMealId)?.foods ?? []) as MealLog[]
            const mealDone = mealLogs.length > 0 && mealLogs.every((f) => f.completed || f.consumed)
            const mealTotal = mealLogs.length
            const mealCompleted = mealLogs.filter((f) => f.completed || f.consumed).length
            const mealId = resolvedMealId
            const isExpanded = expandedMeals[resolvedMealId] !== false
            const mealTime = meal.timeSuggestion || meal.time

            return (
              <V2Card key={mealId} className="p-0 overflow-hidden">
                <button 
                  onClick={() => toggleMeal(mealId)}
                  className={cx(
                    "w-full p-4 flex items-center justify-between transition-colors",
                    mealDone ? "bg-ec-violet/5" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <V2IconBubble 
                      icon={mealDone ? Check : ChefHat} 
                      tone={mealDone ? "success" : "neutral"} 
                      size={16} 
                    />
                    <div className="text-left">
                      <h3 className="text-sm font-black italic text-white uppercase">{meal.name || meal.mealName}</h3>
                      <div className="flex items-center gap-2">
                        {mealTime && <span className="text-xs font-bold uppercase text-ec-violet">{mealTime}</span>}
                        <span className="text-xs font-bold uppercase text-text-secondary">{mealCompleted}/{mealTotal} ITENS</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-300">
                    {mealLogs.map((log: MealLog) => (
                      <div key={log.foodId} className="flex items-center justify-between py-2 border-t border-white/5 first:border-t-0">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => toggleFood(mealId, log.foodId)}
                             className={cx(
                               "w-5 h-5 rounded flex items-center justify-center border transition-all",
                               (log.completed || log.consumed) ? "bg-ec-violet border-ec-violet text-white" : "bg-white/5 border-white/10"
                             )}
                           >
                             {(log.completed || log.consumed) && <Check size={12} />}
                           </button>
                           <div>
                              <p className={cx("text-xs font-bold", (log.completed || log.consumed) ? "text-text-muted line-through" : "text-white")}>
                                {log.foodName}
                              </p>
                              <p className="text-xs text-text-secondary">{log.amount || log.quantity} {log.unit}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setSubstitutionTarget({ mealId, food: log })}
                          className="p-2 text-text-muted hover:text-ec-violet transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </V2Card>
            )
          })}
        </div>

        {/* HYDRATION SHORTCUT */}
        <V2Card 
          className="p-5 flex items-center justify-between group cursor-pointer"
          onClick={() => navigate('/app/hydration')}
        >
          <div className="flex items-center gap-4">
             <V2IconBubble icon={Droplets} tone="info" size={16} />
             <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-sky">HIDRATAÇÃO</p>
                <h4 className="text-sm font-black italic text-white uppercase group-hover:text-accent-sky transition-colors">Atingir Meta de Água</h4>
             </div>
          </div>
          <ChevronRight size={18} className="text-text-muted group-hover:text-accent-sky" />
        </V2Card>

      </div>

      {/* SUBSTITUTION MODAL — honest empty state (P0 cleanup) */}
      {substitutionTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <V2Card className="w-full max-w-md p-6 animate-in slide-in-from-bottom-8 duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic text-white uppercase">Substituir</h3>
                <button onClick={() => setSubstitutionTarget(null)} className="text-text-muted"><X size={24} /></button>
             </div>
             
             <p className="text-sm text-text-muted mb-4">Substitua <span className="text-white font-bold">{substitutionTarget.food.foodName}</span> por uma opção equivalente em macronutrientes.</p>

             <div className="rounded-2xl bg-white/5 border border-white/5 p-5 mb-6">
                <V2IconBubble icon={RefreshCw} tone="neutral" size={14} className="mb-3 opacity-50" />
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Substituições indisponíveis</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Seu mentor ainda não cadastrou alternativas aprovadas para este alimento. Quando disponíveis, as opções aparecerão aqui com macros equivalentes.
                </p>
             </div>
             
             <V2Button variant="secondary" className="w-full" onClick={() => setSubstitutionTarget(null)}>FECHAR</V2Button>
          </V2Card>
        </div>
      )}
    </ExpertClubMobileShell>
  )
}
