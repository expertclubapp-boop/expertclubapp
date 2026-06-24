import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  Droplets,
  GlassWater,
  RefreshCcw,
  Target,
  Utensils,
  Flame,
  Zap,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { fromFirestoreDate } from '../../lib/firebase/date'
import { hydrationService } from '../../services/hydrationService'
import { studentDashboardService } from '../../services/studentDashboardService'
import { studentInsightService, type StudentInsightSummary } from '../../services/studentInsightService'
import type { StudentTodayDashboard } from '../../types/domain'
import { usePendingFeedback } from '../../hooks/usePendingFeedback'

function formatDate(value?: unknown) {
  const date = fromFirestoreDate(value as Parameters<typeof fromFirestoreDate>[0])
  return date ? date.toLocaleDateString('pt-BR') : '-'
}

function firstNameFromDisplayName(value?: string | null) {
  if (!value) return 'Aluno'
  return value.split(' ')[0] || 'Aluno'
}

export function TodayScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const { shouldPrompt, requestPermission } = usePushNotifications()
  const onboardingCompleted = !!(profile?.onboardingCompleted ?? profile?.onboardingDraft === false)
  const { pending: pendingFeedback } = usePendingFeedback(firebaseUser?.uid ?? null, onboardingCompleted)
  const [dashboard, setDashboard] = useState<StudentTodayDashboard | null>(null)
  const [insightSummary, setInsightSummary] = useState<StudentInsightSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingWater, setIsAddingWater] = useState<number | null>(null)
  const [customWaterMl, setCustomWaterMl] = useState('300')

  async function loadDashboard() {
    if (!firebaseUser?.uid) {
      setDashboard(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [dashboardData, insightData] = await Promise.all([
        studentDashboardService.getStudentTodayDashboard(firebaseUser.uid),
        studentInsightService.getStudentInsightSummary(firebaseUser.uid),
      ])
      setDashboard(dashboardData)
      setInsightSummary(insightData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu painel diário agora.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [firebaseUser?.uid])

  const firstName = useMemo(() => firstNameFromDisplayName(firebaseUser?.displayName), [firebaseUser?.displayName])

  async function handleAddWater(amount: number) {
    if (!firebaseUser?.uid || !dashboard || amount <= 0) return
    setIsAddingWater(amount)
    try {
      await hydrationService.addWater(firebaseUser.uid, amount, dashboard.profile.waterGoalMl)
      await loadDashboard()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível registrar água agora.')
    } finally {
      setIsAddingWater(null)
    }
  }

  async function handleAddCustomWater() {
    const amount = Number(customWaterMl.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido de água em ml.')
      return
    }
    await handleAddWater(amount)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-volt-600/30 border-t-volt-600" />
      </div>
    )
  }

  if (error || !dashboard || !insightSummary) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <div className="rounded-2xl border border-white/8 bg-ink-700 p-6">
          <p className="font-mono text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Painel diário</p>
          <h1 className="text-2xl font-display font-bold text-white">Não deu para abrir o painel agora.</h1>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">{error || 'Tente novamente em instantes.'}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="sm:w-auto" onClick={() => void loadDashboard()}>Tentar novamente</Button>
            <Button variant="ghost" className="sm:w-auto" onClick={() => navigate('/app/recommendations')}>Ver recomendações</Button>
          </div>
        </div>
      </div>
    )
  }

  const hydrationRemaining = Math.max(dashboard.hydration.goalMl - dashboard.hydration.consumedMl, 0)
  const summaryCtaTo = insightSummary.automatedFeedback.ctaTo || '/app/evolution'
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()

  const todayHabits = [
    { label: 'Treino do dia', done: !!dashboard.workout?.completedToday, to: dashboard.workout?.selectedWorkoutId ? `/app/workouts/${dashboard.workout.selectedWorkoutId}` : '/app/recommendations' },
    { label: `Água: ${dashboard.hydration.consumedMl}/${dashboard.hydration.goalMl} ml`, done: dashboard.hydration.percentage >= 80, to: '/app/hydration' },
    { label: 'Dieta: refeições registradas', done: !!dashboard.diet && dashboard.diet.adherenceToday >= 70, to: '/app/diets/today' },
    { label: 'Check-in diário', done: !!dashboard.dailyCheckin.completedToday, to: '/app/checkin/daily' },
  ]

  return (
    <div className="pb-4">
      {/* ── Greeting header ── */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-text-muted tracking-[0.18em] uppercase">{todayLabel}</p>
          <h1 className="font-display text-[22px] font-bold leading-tight mt-0.5 text-white">Oi, {firstName}.</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#FF3D6E]/30 bg-[#FF3D6E]/10 text-[#FF3D6E]">
            <Flame className="h-3 w-3" />
            <span className="font-mono text-[11px] font-bold">{profile?.currentStreak ?? 0}d</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-ink-700 border border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-text-muted">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {shouldPrompt && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-volt-600/20 bg-volt-600/5 px-4 py-3">
          <p className="text-xs text-text-secondary">Ative notificações para não perder treinos.</p>
          <Button variant="primary" onClick={() => void requestPermission()}>Ativar</Button>
        </div>
      )}

      <div className="px-4 space-y-3">
        {/* ── Hero workout card ── */}
        <div
          className="rounded-2xl border border-volt-600/30 bg-volt-600/8 p-4 cursor-pointer active:opacity-80 transition-opacity"
          onClick={() => navigate(dashboard.workout?.selectedWorkoutId ? `/app/workouts/${dashboard.workout.selectedWorkoutId}` : '/app/recommendations')}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] text-volt-400 tracking-[0.12em] uppercase">
              {dashboard.workout?.completedToday ? 'CONCLUÍDO HOJE' : 'PRÓXIMO TREINO'}
            </p>
            {!dashboard.workout?.completedToday && (
              <span className="px-2 py-0.5 rounded-full bg-volt-600/20 border border-volt-600/30 text-volt-400 font-mono text-[9px] font-bold">INICIAR RÁPIDO</span>
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-white leading-tight">
            {dashboard.workout?.title || 'Escolher treino'}
          </h2>
          <p className="font-mono text-[10px] text-text-muted mt-0.5">
            {dashboard.workout
              ? `${dashboard.weeklyAdherence.workoutsCompleted}/${dashboard.weeklyAdherence.workoutTarget || 0} sessões esta semana`
              : 'Nenhum plano selecionado'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-volt-600 py-2.5 text-white">
            <Zap className="h-4 w-4" />
            <span className="font-display text-sm font-bold">
              {dashboard.workout?.completedToday ? 'Ver treino' : (dashboard.workout ? 'Começar treino →' : 'Escolher treino →')}
            </span>
          </div>
        </div>

        {/* ── 3-ring stat row ── */}
        <div className="grid grid-cols-3 gap-2">
          <StatRing
            label="ÁGUA"
            value={dashboard.hydration.consumedMl}
            max={dashboard.hydration.goalMl}
            display={`${(dashboard.hydration.consumedMl / 1000).toFixed(1)}L`}
            sub={`/${(dashboard.hydration.goalMl / 1000).toFixed(1)}L`}
            color="#5DDCFF"
            onClick={() => navigate('/app/hydration')}
          />
          <StatRing
            label="DIETA"
            value={dashboard.diet?.adherenceToday ?? 0}
            max={100}
            display={dashboard.diet ? `${dashboard.diet.completedMealsToday}/${dashboard.diet.totalMealsToday}` : '0/0'}
            sub="ref."
            color="#5B3DF5"
            onClick={() => navigate('/app/diets/today')}
          />
          <StatRing
            label="CHECK-IN"
            value={dashboard.dailyCheckin.completedToday ? 100 : 0}
            max={100}
            display={dashboard.dailyCheckin.completedToday ? '✓' : '–'}
            sub={dashboard.dailyCheckin.completedToday ? 'feito' : 'pendente'}
            color="#1F8A5B"
            onClick={() => navigate('/app/checkin/daily')}
          />
        </div>

        {/* ── Today habits ── */}
        <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm font-bold text-white">Hábitos · hoje</span>
            <span className="font-mono text-[10px] text-text-muted">{todayHabits.filter(h => h.done).length} / {todayHabits.length}</span>
          </div>
          <div className="space-y-2.5">
            {todayHabits.map((habit) => (
              <button
                key={habit.label}
                type="button"
                onClick={() => navigate(habit.to)}
                className="w-full flex items-center gap-3 text-left min-h-[44px] py-1"
              >
                <div className={`w-5 h-5 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                  habit.done
                    ? 'border-volt-600 bg-volt-600 text-white'
                    : 'border-white/20 bg-transparent'
                }`}>
                  {habit.done && <span className="text-[10px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-sm font-body flex-1 ${habit.done ? 'text-text-muted line-through' : 'text-white'}`}>
                  {habit.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Coach nudge / pending feedback ── */}
        {pendingFeedback ? (
          <div
            className="rounded-2xl border border-volt-600/30 bg-ink-700 p-4 flex items-start gap-3 cursor-pointer active:opacity-80"
            onClick={() => navigate(`/app/feedback/${pendingFeedback.id}`)}
          >
            <div className="w-9 h-9 rounded-full border border-volt-600/50 bg-volt-600/15 flex items-center justify-center shrink-0">
              <Flame className="h-4 w-4 text-volt-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] text-text-muted tracking-[0.12em] uppercase">FEEDBACK DISPONÍVEL</p>
              <p className="text-sm text-white font-semibold mt-0.5">Responder leva menos de 2 minutos e ajusta sua programação.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-volt-400 shrink-0 mt-0.5" />
          </div>
        ) : dashboard.alerts.length > 0 ? (
          <div
            className="rounded-2xl border border-volt-600/25 bg-ink-700 p-4 flex items-start gap-3 cursor-pointer active:opacity-80"
            onClick={() => dashboard.alerts[0]?.actionTo ? navigate(dashboard.alerts[0].actionTo as string) : undefined}
          >
            <div className="w-9 h-9 rounded-full border border-volt-600/40 bg-volt-600/10 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-volt-400">EC</div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] text-text-muted tracking-[0.12em] uppercase">{dashboard.alerts[0]?.title || 'ALERTA'}</p>
              <p className="text-sm text-white mt-0.5">{dashboard.alerts[0]?.message || ''}</p>
            </div>
          </div>
        ) : null}

        {/* ── Refresh recommendations banner ── */}
        {dashboard.profile.recommendationsNeedRefresh && (
          <div className="rounded-2xl border border-accent-sky/20 bg-accent-sky/8 p-4 flex items-center gap-3">
            <RefreshCcw className="h-4 w-4 text-accent-sky shrink-0" />
            <p className="flex-1 text-sm text-text-secondary">Suas preferências mudaram. Novos planos disponíveis.</p>
            <button type="button" onClick={() => navigate('/app/recommendations')} className="min-h-[44px] px-2 text-xs font-bold text-accent-sky whitespace-nowrap flex items-center">Ver planos</button>
          </div>
        )}

        {/* ── Diet card ── */}
        {dashboard.diet ? (
          <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-mono text-[10px] text-text-muted tracking-[0.12em] uppercase">Dieta de hoje</p>
                <h3 className="font-display text-base font-bold text-white mt-0.5">{dashboard.diet.title}</h3>
              </div>
              <div className="rounded-xl bg-volt-600/10 p-2 text-volt-400 shrink-0">
                <Utensils className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-black/20 p-2 text-center">
                <p className="font-mono text-sm font-bold text-white">{dashboard.diet.calories || 0}</p>
                <p className="font-mono text-[9px] text-text-muted mt-0.5">KCAL</p>
              </div>
              <div className="rounded-xl bg-black/20 p-2 text-center">
                <p className="font-mono text-sm font-bold text-white">{dashboard.diet.completedMealsToday}</p>
                <p className="font-mono text-[9px] text-text-muted mt-0.5">FEITAS</p>
              </div>
              <div className="rounded-xl bg-black/20 p-2 text-center">
                <p className="font-mono text-sm font-bold text-white">{dashboard.diet.adherenceToday}%</p>
                <p className="font-mono text-[9px] text-text-muted mt-0.5">ADESÃO</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/app/diets/today')}>Ver dieta completa</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-ink-700 p-4 flex items-center gap-3">
            <Utensils className="h-5 w-5 text-text-muted" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Nenhuma dieta ativa</p>
              <p className="text-xs text-text-muted mt-0.5">Escolha um plano para acompanhar refeições</p>
            </div>
            <button type="button" onClick={() => navigate('/app/recommendations')} className="min-h-[44px] px-2 flex items-center text-xs font-bold text-volt-400">Escolher</button>
          </div>
        )}

        {/* ── Water quick add ── */}
        <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-accent-sky" />
              <span className="font-display text-sm font-bold text-white">Água</span>
            </div>
            <span className="font-mono text-xs text-accent-sky">{dashboard.hydration.consumedMl.toLocaleString('pt-BR')} / {dashboard.hydration.goalMl.toLocaleString('pt-BR')} ml</span>
          </div>
          <ProgressBar value={dashboard.hydration.percentage} color="sky" height={8} />
          <p className="text-xs text-text-muted mt-2 mb-3">
            {hydrationRemaining > 0 ? `Faltam ${hydrationRemaining.toLocaleString('pt-BR')} ml para a meta` : 'Meta batida! Bom trabalho.'}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button variant="ghost" isLoading={isAddingWater === 250} onClick={() => void handleAddWater(250)} icon={<GlassWater className="h-3.5 w-3.5" />}>+250 ml</Button>
            <Button variant="ghost" isLoading={isAddingWater === 500} onClick={() => void handleAddWater(500)} icon={<GlassWater className="h-3.5 w-3.5" />}>+500 ml</Button>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="number"
              min="1"
              value={customWaterMl}
              onChange={(e) => setCustomWaterMl(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-accent-sky"
              placeholder="ml personalizado"
            />
            <Button isLoading={isAddingWater !== null && isAddingWater !== 250 && isAddingWater !== 500} onClick={() => void handleAddCustomWater()}>Salvar</Button>
          </div>
        </div>

        {/* ── Evolution check-in & weekly summary ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-mono text-[10px] text-accent-yellow tracking-[0.12em] uppercase">Check-in Evolução</p>
              <CalendarClock className="h-4 w-4 text-accent-yellow" />
            </div>
            <h3 className="font-display text-base font-bold text-white">
              {dashboard.evolutionCheckin.isDue ? 'Disponível agora' : `${dashboard.evolutionCheckin.daysRemaining}d restantes`}
            </h3>
            <p className="text-xs text-text-muted mt-1">
              {dashboard.evolutionCheckin.isDue ? 'Envie peso e fotos.' : `Próxima janela: ${formatDate(dashboard.evolutionCheckin.nextDueAt)}`}
            </p>
            <button type="button" onClick={() => navigate('/app/evolution/checkin')} className="mt-1 min-h-[44px] flex items-center text-xs font-bold text-volt-400">Enviar evolução →</button>
          </div>

          <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-mono text-[10px] text-accent-lime tracking-[0.12em] uppercase">Semana</p>
              <Target className="h-4 w-4 text-accent-lime" />
            </div>
            <h3 className="font-display text-base font-bold text-white">{insightSummary.automatedFeedback.title}</h3>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-black/20 p-1.5 text-center">
                <p className="font-mono text-sm font-bold text-white">{insightSummary.adherence.workoutsCompleted}/{insightSummary.adherence.workoutTarget || 0}</p>
                <p className="font-mono text-[9px] text-text-muted">TREINOS</p>
              </div>
              <div className="rounded-lg bg-black/20 p-1.5 text-center">
                <p className="font-mono text-sm font-bold text-white">{insightSummary.adherence.hydrationAveragePct}%</p>
                <p className="font-mono text-[9px] text-text-muted">ÁGUA</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate(summaryCtaTo)} className="mt-1 min-h-[44px] flex items-center text-xs font-bold text-volt-400">Ver detalhe →</button>
          </div>
        </div>

        {/* ── Quick shortcuts ── */}
        <div className="rounded-2xl border border-white/8 bg-ink-700 p-4">
          <p className="font-mono text-[10px] text-text-muted tracking-[0.12em] uppercase mb-3">Atalhos rápidos</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Atualizar planos', to: '/app/recommendations' },
              { label: 'Evolução', to: '/app/evolution' },
              { label: 'Comunidade', to: '/app/community' },
              { label: 'Perfil', to: '/app/profile' },
            ].map((s) => (
              <button
                key={s.to}
                type="button"
                onClick={() => navigate(s.to)}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/6 bg-black/20 px-3 min-h-[44px] text-left active:opacity-70 transition-opacity"
              >
                <span className="text-xs font-bold text-white">{s.label}</span>
                <ArrowRight className="h-3 w-3 text-text-muted shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRing({
  label, value, max, display, sub, color, onClick,
}: {
  label: string; value: number; max: number; display: string; sub: string; color: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/8 bg-ink-700 p-3 flex flex-col items-center gap-1 active:opacity-70 transition-opacity"
    >
      <ProgressRing value={value} max={max} size={54} strokeWidth={5} color={color}>
        <span className="font-mono text-[9px] font-bold text-white leading-none">{display}</span>
      </ProgressRing>
      <p className="font-mono text-[9px] text-text-muted tracking-[0.1em] uppercase">{label}</p>
      <p className="font-mono text-[9px] text-text-muted">{sub}</p>
    </button>
  )
}

