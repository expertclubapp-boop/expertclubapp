import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChefHat, Flame, Zap, Drumstick, Droplets, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useDietDay } from '../../hooks/useDietDay'
import type { DietDayFoodLog, Food } from '../../types/domain'

export function DietDayScreen() {
  const navigate = useNavigate()
  const { dietDay, diet, isLoading, toggleFood, substituteFood } = useDietDay()
  const [substitutionTarget, setSubstitutionTarget] = useState<{ mealId: string; food: DietDayFoodLog } | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})

  const toggleMeal = (mealId: string) => setExpandedMeals(prev => ({ ...prev, [mealId]: prev[mealId] === false ? true : false }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!dietDay || !diet) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
        <ChefHat className="w-16 h-16 text-text-muted mb-6" />
        <h1 className="font-display text-2xl text-white uppercase italic font-black mb-3">Nenhuma dieta selecionada</h1>
        <p className="text-text-muted text-sm mb-8 max-w-xs">Escolha uma dieta na biblioteca para começar a registrar sua alimentação diária.</p>
        <Button variant="primary" onClick={() => navigate('/app/diets')}>Ver Dietas</Button>
      </div>
    )
  }

  const adherence = dietDay.adherencePercent
  const adherenceColor = adherence >= 80 ? 'lime' : adherence >= 50 ? 'sky' : 'purple'

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-2xl items-center justify-between rounded-2xl px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse"></span>
              Plano Ativo {diet.version ? `v${diet.version}` : ''}
            </p>
            <p className="text-xs font-bold text-white">{diet.title}</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 space-y-5 pt-4">
        {/* Adherence Summary */}
        <section className="ec-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Aderência do dia</span>
            <span className={`font-display text-2xl font-black italic text-accent-${adherenceColor}`}>{adherence}%</span>
          </div>
          <ProgressBar value={adherence} color={adherenceColor as any} height={8} />
          <div className="flex justify-between mt-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>{dietDay.completedItemsCount} de {dietDay.totalItemsCount} alimentos</span>
            <span>{dietDay.totalCaloriesConsumed} / {dietDay.totalCaloriesPlanned} kcal</span>
          </div>
        </section>

        {/* Macro Bars */}
        <section className="grid grid-cols-3 gap-3">
          <MacroBar label="Proteína" consumed={dietDay.totalProteinConsumed} planned={dietDay.totalProteinPlanned} unit="g" icon={<Drumstick className="w-3.5 h-3.5" />} color="sky" />
          <MacroBar label="Carbo" consumed={dietDay.totalCarbsConsumed} planned={dietDay.totalCarbsPlanned} unit="g" icon={<Flame className="w-3.5 h-3.5" />} color="lime" />
          <MacroBar label="Gordura" consumed={dietDay.totalFatConsumed} planned={dietDay.totalFatPlanned} unit="g" icon={<Droplets className="w-3.5 h-3.5" />} color="purple" />
        </section>

        {/* Meals */}
        {dietDay.meals.map(meal => {
          const mealCompleted = meal.foods.filter(f => f.completed).length
          const mealTotal = meal.foods.length
          const mealDone = mealCompleted === mealTotal && mealTotal > 0
          const isExpanded = expandedMeals[meal.mealId] !== false

          // Encontrar o horário da refeição no diet original
          const originalMeal = diet.meals?.find(m => m.id === meal.mealId)
          const mealTime = originalMeal?.timeSuggestion || ''

          return (
            <section key={meal.mealId} className="ec-card rounded-2xl overflow-hidden">
              <button 
                onClick={() => toggleMeal(meal.mealId)}
                className={`w-full p-4 flex items-center justify-between border-b border-white/5 transition-colors ${mealDone ? 'bg-accent-lime/5' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mealDone ? 'bg-accent-lime/20 text-accent-lime' : 'bg-white/5 text-text-muted'}`}>
                    {mealDone ? <Check className="w-5 h-5" /> : <ChefHat className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {meal.mealName}
                      {mealTime && <span className="text-[10px] font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{mealTime}</span>}
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{mealCompleted}/{mealTotal} itens</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
              </button>

              {isExpanded && (
                <div className="divide-y divide-white/[0.04]">
                  {meal.foods.map(food => (
                    <div
                      key={food.foodId}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${food.completed ? 'bg-white/[0.02]' : ''}`}
                    >
                      <button
                        onClick={() => toggleFood(meal.mealId, food.foodId)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        food.completed ? 'bg-accent-lime border-accent-lime text-bg-primary' : 'border-white/20'
                      }`}
                        aria-label={food.completed ? `Desmarcar ${food.foodName}` : `Marcar ${food.foodName} como comi`}
                      >
                        {food.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => toggleFood(meal.mealId, food.foodId)} className="flex-1 min-w-0 text-left">
                        <span className={`text-sm font-medium block truncate ${food.completed ? 'text-text-muted line-through' : 'text-white'}`}>
                          {food.foodName}
                        </span>
                        {food.amount && <span className="text-[10px] text-text-muted">{food.amount}</span>}
                      </button>
                      <span className="text-[10px] font-bold text-text-muted tabular-nums shrink-0">{food.kcal} kcal</span>
                      <button
                        onClick={() => setSubstitutionTarget({ mealId: meal.mealId, food })}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-text-muted hover:border-accent-sky/40 hover:text-accent-sky transition-colors"
                        aria-label={`Substituir ${food.foodName}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {meal.foods.length === 0 && (
                    <div className="p-4 text-center text-sm text-text-muted">Nenhum alimento registrado.</div>
                  )}
                </div>
              )}
            </section>
          )
        })}

        {/* Completion CTA */}
        {dietDay.completedItemsCount > 0 && (
          <section className={`ec-card rounded-2xl p-6 text-center border ${adherence >= 80 ? 'bg-accent-lime/5 border-accent-lime/20' : 'bg-white/[0.02] border-white/10'}`}>
            <Zap className={`w-8 h-8 mx-auto mb-3 ${adherence >= 80 ? 'text-accent-lime' : 'text-white'}`} />
            <h3 className="font-display text-lg text-white uppercase italic font-black mb-2">Dieta registrada!</h3>
            <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
              Aderência: <span className={adherence >= 80 ? 'text-accent-lime font-bold' : 'text-white font-bold'}>{adherence}%</span>. 
              Não precisa bater 100% todos os dias. O importante é saber como foi para ajustar melhor.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" className="border-subtle text-xs py-4 flex-1" onClick={() => navigate('/app/evolution')}>Ver Evolução</Button>
              <Button variant="primary" className="text-xs py-4 flex-1" onClick={() => navigate('/app/today')}>Voltar para Hoje</Button>
            </div>
          </section>
        )}
      </main>

      {substitutionTarget && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-1 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-sky">Substituir alimento</p>
                <h3 className="mt-1 text-lg font-bold text-white">{substitutionTarget.food.foodName}</h3>
              </div>
              <button
                onClick={() => setSubstitutionTarget(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white"
                aria-label="Fechar substituições"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {substitutionTarget.food.alternatives?.length ? (
              <div className="space-y-3">
                <div className="bg-accent-sky/10 border border-accent-sky/20 rounded-xl p-3 mb-2 flex gap-3 items-start">
                  <Check className="w-4 h-4 text-accent-sky shrink-0 mt-0.5" />
                  <p className="text-xs text-accent-sky font-medium leading-relaxed">Estas substituições foram pré-aprovadas no seu plano publicado e mantêm o equilíbrio dos macronutrientes.</p>
                </div>
                {substitutionTarget.food.alternatives.map((alternative: Food) => (
                  <button
                    key={alternative.id}
                    onClick={() => {
                      substituteFood(substitutionTarget.mealId, substitutionTarget.food.foodId, alternative as any)
                      setSubstitutionTarget(null)
                    }}
                    className="flex w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-accent-lime/40 transition-colors group"
                  >
                    <div className="flex justify-between w-full mb-3">
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-accent-lime transition-colors">{alternative.name}</p>
                        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{alternative.basePortion?.amount}{alternative.basePortion?.unit}</p>
                      </div>
                      <span className="text-xs font-bold text-white tabular-nums bg-white/5 px-2 py-1 rounded-lg h-fit">{alternative.macrosPerBasePortion?.calories} kcal</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1"><Drumstick className="w-3 h-3 text-accent-sky" /><span className="text-[10px] text-text-muted">{alternative.macrosPerBasePortion?.protein}g</span></div>
                      <div className="flex items-center gap-1"><Flame className="w-3 h-3 text-accent-lime" /><span className="text-[10px] text-text-muted">{alternative.macrosPerBasePortion?.carbs}g</span></div>
                      <div className="flex items-center gap-1"><Droplets className="w-3 h-3 text-accent-purple" /><span className="text-[10px] text-text-muted">{alternative.macrosPerBasePortion?.fat}g</span></div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6 text-center">
                <RefreshCw className="w-8 h-8 text-text-muted/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Sem substituições</p>
                <p className="text-xs text-text-muted">Este alimento ainda não possui alternativas cadastradas.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MacroBar({ label, consumed, planned, unit, icon, color }: {
  label: string; consumed: number; planned: number; unit: string; icon: React.ReactNode; color: string
}) {
  const pct = planned > 0 ? Math.min(100, Math.round((consumed / planned) * 100)) : 0
  return (
    <div className="ec-card rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-accent-${color}`}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <p className="text-sm font-bold text-white mb-1">{consumed}<span className="text-text-muted font-normal">/{planned}{unit}</span></p>
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
        <div className={`bg-accent-${color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
