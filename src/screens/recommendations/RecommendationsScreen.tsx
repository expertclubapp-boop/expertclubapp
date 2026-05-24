import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Dumbbell, RefreshCcw, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { V2Badge, V2Button, V2Card } from '../../components/v2/ExpertClubV2Base'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { recommendationService } from '../../services/recommendationService'
import type { RecommendedDiet, RecommendedWorkout, StudentRecommendations } from '../../types/domain'
import {
  dietPreferencePt,
  dietComplexityPt,
  formatDaysPerWeek,
  goalPt,
  levelPt,
  recommendationBadgePt,
  trainingLocationPt,
} from '../../utils/labels'

type SelectionState = {
  workoutId?: string
  dietId?: string
}

export function RecommendationsScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const [data, setData] = useState<StudentRecommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectionState, setSelectionState] = useState<SelectionState>({})
  const [savingWorkoutId, setSavingWorkoutId] = useState<string | null>(null)
  const [savingDietId, setSavingDietId] = useState<string | null>(null)
  const [completedSelectionFlow, setCompletedSelectionFlow] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    recommendationService
      .getStudentRecommendations(firebaseUser.uid)
      .then((response) => {
        if (!isMounted) return
        setData(response)
        setSelectionState(
          profile?.recommendationsNeedRefresh
            ? {}
            : {
                workoutId: profile?.selectedWorkoutId,
                dietId: profile?.selectedDietId,
              },
        )
      })
      .catch((loadError) => {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível gerar suas recomendações agora.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [firebaseUser, profile?.selectedDietId, profile?.selectedWorkoutId])

  const hasSelections = Boolean(selectionState.workoutId && selectionState.dietId)
  const isProfileIncomplete = Boolean(error?.includes('Perfil incompleto'))

  useEffect(() => {
    if (completedSelectionFlow && hasSelections) {
      const timeout = window.setTimeout(() => navigate('/app/today', { replace: true }), 900)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [completedSelectionFlow, hasSelections, navigate])

  const topWorkout = data?.workouts[0] ?? null
  const topDiet = data?.diets[0] ?? null
  const headerSubtitle = useMemo(() => {
    if (profile?.recommendationsNeedRefresh) return 'Preferências atualizadas'
    return 'Próxima etapa'
  }, [profile?.recommendationsNeedRefresh])

  async function handleWorkoutSelect(item: RecommendedWorkout) {
    if (!firebaseUser) return
    setSavingWorkoutId(item.template.id)
    setError(null)
    try {
      await recommendationService.selectWorkout({
        uid: firebaseUser.uid,
        workoutId: item.template.id,
        score: item.score,
        reasons: item.reasons,
      })
      setSelectionState((prev) => {
        const next = { ...prev, workoutId: item.template.id }
        if (next.workoutId && next.dietId) setCompletedSelectionFlow(true)
        return next
      })
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : 'Não foi possível escolher este treino agora.')
    } finally {
      setSavingWorkoutId(null)
    }
  }

  async function handleDietSelect(item: RecommendedDiet) {
    if (!firebaseUser) return
    setSavingDietId(item.template.id)
    setError(null)
    try {
      await recommendationService.selectDiet({
        uid: firebaseUser.uid,
        dietId: item.template.id,
        score: item.score,
        reasons: item.reasons,
      })
      setSelectionState((prev) => {
        const next = { ...prev, dietId: item.template.id }
        if (next.workoutId && next.dietId) setCompletedSelectionFlow(true)
        return next
      })
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : 'Não foi possível escolher esta dieta agora.')
    } finally {
      setSavingDietId(null)
    }
  }

  return (
    <ExpertClubMobileShell active="Início" title="Recomendações" subtitle={headerSubtitle}>
      <div className="flex flex-col gap-5 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-ec-violet/20 bg-gradient-to-br from-ec-violet/12 via-[#101827] to-[#0d1422] p-6"
        >
          <V2Badge tone="violet">
            {profile?.recommendationsNeedRefresh ? 'Atualizadas para você' : 'Sugestões prontas'}
          </V2Badge>
          <h1 className="mt-4 text-3xl font-black uppercase italic leading-tight text-white">
            {isLoading ? 'Buscando os melhores planos para você...' : 'Escolha os planos que mais combinam com sua rotina.'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {isLoading
              ? 'Cruzando objetivo, frequência, nível, local e preferência alimentar para sugerir opções explicáveis.'
              : 'Você pode seguir a melhor recomendação ou comparar alternativas próximas antes de decidir.'}
          </p>
          <div className="mt-5 flex items-center gap-3 text-ec-violet">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {topWorkout || topDiet ? 'Baseado no seu perfil atual' : 'Sem mock de recomendação'}
            </span>
          </div>
        </motion.div>

        {isLoading && (
          <div className="grid gap-4">
            <LoadingCard title="Treinos recomendados" />
            <LoadingCard title="Dietas recomendadas" />
          </div>
        )}

        {!isLoading && error && (
          <V2Card className="space-y-4 p-5">
            <p className="text-sm font-bold text-white">{error}</p>
            <p className="text-xs leading-relaxed text-text-muted">
              {isProfileIncomplete
                ? 'Complete seu onboarding para liberar sugestões de treino e dieta.'
                : 'Tente novamente em instantes ou siga para o dashboard enquanto finalizamos seus dados.'}
            </p>
            <div className="grid gap-3">
              {isProfileIncomplete ? (
                <V2Button className="h-12 w-full" variant="primary" onClick={() => navigate('/onboarding')}>
                  VOLTAR AO ONBOARDING
                </V2Button>
              ) : (
                <V2Button className="h-12 w-full" variant="secondary" onClick={() => navigate('/app/today')}>
                  IR PARA O DASHBOARD
                </V2Button>
              )}
            </div>
          </V2Card>
        )}

        {!isLoading && !error && data && (
          <>
            <RecommendationSection
              title="Treinos recomendados"
              eyebrow="Treino"
              emptyText="Nenhum treino publicado disponível para recomendar agora."
              items={data.workouts}
              selectedId={selectionState.workoutId}
              savingId={savingWorkoutId}
              onSelect={handleWorkoutSelect}
              renderMeta={(item) => (
                <>
                  <MetaPill label={goalPt(item.template.goal)} />
                  <MetaPill label={formatDaysPerWeek(item.template.daysPerWeek)} />
                  <MetaPill label={levelPt(item.template.level)} />
                  {item.template.recommendationMetadata?.locations?.[0] && (
                    <MetaPill label={trainingLocationPt(item.template.recommendationMetadata.locations[0])} />
                  )}
                </>
              )}
              renderIcon={() => <Dumbbell className="h-5 w-5" />}
            />

            <RecommendationSection
              title="Dietas recomendadas"
              eyebrow="Dieta"
              emptyText="Nenhuma dieta publicada disponível para recomendar agora."
              items={data.diets}
              selectedId={selectionState.dietId}
              savingId={savingDietId}
              onSelect={handleDietSelect}
              renderMeta={(item) => (
                <>
                  <MetaPill label={`${item.template.calories} kcal`} />
                  <MetaPill label={goalPt(item.template.goal)} />
                  <MetaPill label={dietPreferencePt(item.template.recommendationMetadata?.preferences?.[0] || item.template.style)} />
                  {item.template.recommendationMetadata?.complexity && (
                    <MetaPill label={dietComplexityPt(item.template.recommendationMetadata.complexity)} />
                  )}
                </>
              )}
              renderIcon={() => <UtensilsCrossed className="h-5 w-5" />}
            />
          </>
        )}

        {!isLoading && !error && (
          <V2Card className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/5 p-3 text-ec-violet">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Quando suas preferências mudarem</p>
                <p className="text-xs text-text-muted">O perfil marca suas recomendações para atualização, sem perder o histórico da escolha.</p>
              </div>
            </div>
          </V2Card>
        )}

        {hasSelections && (
          <V2Card className="border-accent-lime/25 bg-accent-lime/10 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent-lime" />
              <div>
                <p className="text-sm font-bold text-white">Planos escolhidos com sucesso.</p>
                <p className="mt-1 text-xs text-text-secondary">Redirecionando você para o dashboard diário.</p>
              </div>
            </div>
          </V2Card>
        )}
      </div>
    </ExpertClubMobileShell>
  )
}

function LoadingCard({ title }: { title: string }) {
  return (
    <V2Card className="overflow-hidden p-5">
      <div className="animate-pulse space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">{title}</p>
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-5/6 rounded bg-white/10" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-8 rounded-xl bg-white/10" />
          <div className="h-8 rounded-xl bg-white/10" />
          <div className="h-8 rounded-xl bg-white/10" />
        </div>
      </div>
    </V2Card>
  )
}

function RecommendationSection<T extends RecommendedWorkout | RecommendedDiet>({
  title,
  eyebrow,
  emptyText,
  items,
  selectedId,
  savingId,
  onSelect,
  renderMeta,
  renderIcon,
}: {
  title: string
  eyebrow: string
  emptyText: string
  items: T[]
  selectedId?: string
  savingId: string | null
  onSelect: (item: T) => void
  renderMeta: (item: T) => React.ReactNode
  renderIcon: () => React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-ec-violet">{eyebrow}</p>
          <h2 className="mt-2 text-lg font-black uppercase italic text-white">{title}</h2>
        </div>
        {items[0] && (
          <V2Badge tone="violet">{recommendationBadgePt(items[0].badge)}</V2Badge>
        )}
      </div>

      {items.length === 0 ? (
        <V2Card className="p-5">
          <p className="text-sm font-bold text-white">{emptyText}</p>
        </V2Card>
      ) : (
        items.map((item) => {
          const templateId = item.template.id
          const isSelected = selectedId === templateId
          const isSaving = savingId === templateId
          return (
            <V2Card key={templateId} className={`space-y-4 p-5 ${isSelected ? 'border-accent-lime/25 bg-accent-lime/10' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/5 p-3 text-ec-violet">
                    {renderIcon()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black uppercase italic text-white">{item.template.title}</p>
                      <V2Badge tone={item.badge === 'best_match' ? 'violet' : item.badge === 'good_option' ? 'info' : 'neutral'}>
                        {recommendationBadgePt(item.badge)}
                      </V2Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {item.template.description || 'Plano publicado e pronto para seguir no app.'}
                    </p>
                  </div>
                </div>
                {isSelected && <V2Badge tone="success">Escolhido</V2Badge>}
              </div>

              <div className="flex flex-wrap gap-2">
                {renderMeta(item)}
              </div>

              <div className="space-y-2">
                {item.reasons.map((reason) => (
                  <div key={reason} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white">
                    {reason}
                  </div>
                ))}
                {item.warnings?.map((warning) => (
                  <div key={warning} className="rounded-2xl border border-accent-yellow/20 bg-accent-yellow/10 px-4 py-3 text-xs text-accent-yellow">
                    {warning}
                  </div>
                ))}
              </div>

              <V2Button
                className="h-12 w-full"
                variant={isSelected ? 'secondary' : 'primary'}
                onClick={() => onSelect(item)}
                disabled={isSelected}
              >
                {isSaving
                  ? 'SALVANDO...'
                  : isSelected
                    ? 'PLANO SELECIONADO'
                    : eyebrow === 'Dieta'
                      ? 'ESCOLHER ESTA DIETA'
                      : `ESCOLHER ESTE ${eyebrow.toUpperCase()}`}
              </V2Button>
            </V2Card>
          )
        })
      )}
    </section>
  )
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary">
      {label}
    </span>
  )
}
