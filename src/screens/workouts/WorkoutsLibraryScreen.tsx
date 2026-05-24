import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, Dumbbell, Lock, PlayCircle, Search, SlidersHorizontal, Target, TrendingUp } from 'lucide-react'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useProfile } from '../../hooks/useProfile'
import { useActivePrescription } from '../../hooks/useActivePrescription'
import { usePlanTier } from '../../hooks/usePlanTier'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { ExpertClubWorkoutCard } from '../../components/v2/ExpertClubWorkoutCard'
import { V2Badge, V2Button, V2Card, V2IconBubble, cx } from '../../components/v2/ExpertClubV2Base'
import { workoutProgressionService, type WorkoutProgressSummary } from '../../services/workoutProgressionService'
import { fromFirestoreDate } from '../../lib/firebase/date'
import { goalPt, levelPt, formatDaysPerWeek } from '../../utils/labels'
import { useAuth } from '../../contexts/AuthContext'

function formatDate(value?: any) {
  const date = fromFirestoreDate(value)
  return date ? date.toLocaleDateString('pt-BR') : '-'
}

export function WorkoutsLibraryScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { workouts, isLoading } = useWorkouts()
  const { profile } = useProfile()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [progressSummary, setProgressSummary] = useState<WorkoutProgressSummary | null>(null)
  const { assignment: prescribedWorkout } = useActivePrescription('workout')
  const { isLowTicket } = usePlanTier()
  const [filters, setFilters] = useState({
    objective: 'all',
    modality: 'all',
    level: 'all',
  })

  useEffect(() => {
    if (!firebaseUser?.uid) return
    workoutProgressionService.getWorkoutProgressionSummary(firebaseUser.uid)
      .then(setProgressSummary)
      .catch(() => setProgressSummary(null))
  }, [firebaseUser?.uid])

  const currentWorkout = useMemo(
    () => workouts.find((workout) => workout.id === profile?.selectedWorkoutId) || null,
    [profile?.selectedWorkoutId, workouts]
  )

  const filteredWorkouts = useMemo(() => workouts.filter((workout) => {
    const matchesSearch = workout.title.toLowerCase().includes(search.toLowerCase())
    const matchesObjective = filters.objective === 'all' || workout.goal === filters.objective
    const matchesModality = filters.modality === 'all' || workout.modality === filters.modality
    const matchesLevel = filters.level === 'all' || workout.level === filters.level
    return matchesSearch && matchesObjective && matchesModality && matchesLevel
  }), [filters.level, filters.modality, filters.objective, search, workouts])

  const suggestedWorkouts = filteredWorkouts.filter((workout) => workout.id !== currentWorkout?.id)

  const setFilter = (key: keyof typeof filters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))

  return (
    <ExpertClubMobileShell active="Treinos" title="Treinos" subtitle="Seu plano e sua evolução">
      <div className="flex flex-col gap-6 pb-10">
        {currentWorkout ? (
          <V2Card className="overflow-hidden border border-ec-violet/25 bg-gradient-to-br from-ec-violet/12 via-[#101827] to-[#0d1422] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <V2Badge tone="success">Plano atual</V2Badge>
                  <V2Badge tone="violet">{levelPt(currentWorkout.level)}</V2Badge>
                  {prescribedWorkout && (
                    <V2Badge tone="warning">Prescrito pelo mentor</V2Badge>
                  )}
                </div>
                <h2 className="mt-4 text-2xl font-black italic uppercase leading-tight text-white">
                  {currentWorkout.title}
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {goalPt(currentWorkout.goal)} · {formatDaysPerWeek(currentWorkout.daysPerWeek)} · Atualizado em {formatDate(currentWorkout.updatedAt || currentWorkout.publishedAt)}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-ec-violet">
                <Dumbbell size={22} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricChip icon={Target} label="Objetivo" value={goalPt(currentWorkout.goal)} />
              <MetricChip icon={CalendarClock} label="Dias" value={formatDaysPerWeek(currentWorkout.daysPerWeek)} />
              <MetricChip icon={TrendingUp} label="Sessões" value={progressSummary?.totalSessions ? `${progressSummary.totalSessions}` : '0'} />
              <MetricChip
                icon={TrendingUp}
                label="Volume"
                value={progressSummary ? `${(progressSummary.totalTonnage / 1000).toFixed(1)}t` : '0.0t'}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <V2Button className="h-12 w-full" variant="primary" onClick={() => navigate(`/app/workouts/${currentWorkout.id}`)}>
                Abrir treino <ArrowRight className="ml-2 h-4 w-4" />
              </V2Button>
              <V2Button className="h-12 w-full" variant="secondary" onClick={() => navigate(`/app/workouts/${currentWorkout.id}`)}>
                Iniciar treino <PlayCircle className="ml-2 h-4 w-4" />
              </V2Button>
            </div>
          </V2Card>
        ) : (
          <V2Card className="p-6">
            <V2IconBubble icon={Dumbbell} tone="neutral" className="mb-4" />
            <h2 className="text-lg font-black italic uppercase text-white">Nenhum treino atual</h2>
            <p className="mt-2 text-sm text-text-muted">
              Seu plano ainda não foi atribuído. Assim que um treino estiver disponível, ele aparece aqui como plano atual.
            </p>
          </V2Card>
        )}

        {currentWorkout && <WeekPlanRow workout={currentWorkout} />}

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-ec-violet transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-white/5 py-4 pl-12 pr-12 text-white font-bold placeholder:text-text-muted outline-none focus:border-ec-violet/50 transition-all"
            placeholder="Buscar treino..."
          />
          <button
            onClick={() => setShowFilters((value) => !value)}
            className={cx(
              'absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all',
              showFilters ? 'bg-ec-violet text-white' : 'bg-white/5 text-text-muted hover:text-white'
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {showFilters && (
          <V2Card className="space-y-4 p-4 animate-in slide-in-from-top-4 duration-300">
            <FilterRow
              label="Objetivo"
              options={[
                ['all', 'Todos'],
                ['hypertrophy', 'Hipertrofia'],
                ['fat_loss', 'Emagrecimento'],
                ['strength', 'Força'],
                ['health', 'Saúde'],
              ]}
              value={filters.objective}
              onChange={(value) => setFilter('objective', value)}
            />
            <FilterRow
              label="Nível"
              options={[
                ['all', 'Todos'],
                ['beginner', 'Iniciante'],
                ['intermediate', 'Intermediário'],
                ['advanced', 'Avançado'],
              ]}
              value={filters.level}
              onChange={(value) => setFilter('level', value)}
            />
            <FilterRow
              label="Modalidade"
              options={[
                ['all', 'Todas'],
                ['bodybuilding', 'Musculação'],
                ['functional', 'Funcional'],
                ['home', 'Casa'],
              ]}
              value={filters.modality}
              onChange={(value) => setFilter('modality', value)}
            />
          </V2Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Biblioteca publicada</h3>
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              {filteredWorkouts.length} plano{filteredWorkouts.length === 1 ? '' : 's'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-64 rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : suggestedWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {suggestedWorkouts.map((workout) => {
                const locked = isLowTicket && workout.accessTier === 'mentoring'
                return locked ? (
                  <div key={workout.id} className="relative">
                    <div className="pointer-events-none opacity-50 select-none">
                      <ExpertClubWorkoutCard workout={workout} onClick={() => {}} />
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
                  <ExpertClubWorkoutCard
                    key={workout.id}
                    workout={workout}
                    onClick={(id) => navigate(`/app/workouts/${id}`)}
                  />
                )
              })}
            </div>
          ) : (
            <V2Card className="py-16 text-center">
              <V2IconBubble icon={Search} tone="neutral" className="mx-auto mb-4" />
              <p className="font-bold text-text-muted">
                {workouts.length === 0 ? 'Nenhum treino publicado no momento.' : 'Nenhum treino encontrado com esses filtros.'}
              </p>
            </V2Card>
          )}
        </div>
      </div>
    </ExpertClubMobileShell>
  )
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[][]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cx(
              'whitespace-nowrap rounded-xl px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest transition-all',
              value === id ? 'bg-ec-violet text-white shadow-lg shadow-ec-violet/20' : 'bg-white/5 text-text-muted hover:text-white'
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function MetricChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary">
        <Icon className="h-3.5 w-3.5 text-ec-violet" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const DEFAULT_WORKOUT_DAYS: Record<number, number[]> = {
  2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5],
}

function WeekPlanRow({ workout }: { workout: { title: string; daysPerWeek?: number } }) {
  const todayDow = (new Date().getDay() + 6) % 7 // 0=Mon..6=Sun
  const workoutDays = new Set(DEFAULT_WORKOUT_DAYS[workout.daysPerWeek ?? 4] ?? [0, 1, 3, 4])
  const shortTitle = workout.title.length > 14 ? workout.title.slice(0, 13) + '…' : workout.title

  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <p className="font-mono text-[9px] text-text-muted tracking-[0.15em] uppercase">Esta semana</p>
        <span className="font-mono text-[9px] text-volt-400">{workout.daysPerWeek ?? 4}×/SEM</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((day, i) => {
          const isToday = i === todayDow
          const isWorkout = workoutDays.has(i)
          const isPast = i < todayDow
          return (
            <div key={day} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors ${
              isToday && isWorkout ? 'bg-volt-600/20 border border-volt-600/40' :
              isToday ? 'bg-white/5' : ''
            }`}>
              <span className={`font-mono text-[8px] ${isToday ? 'text-volt-400 font-bold' : 'text-text-muted'}`}>{day}</span>
              <span className={`font-mono text-[11px] font-bold ${
                isWorkout && isPast ? 'text-lime-ok' :
                isWorkout && isToday ? 'text-volt-400' :
                isWorkout ? 'text-text-secondary' :
                'text-text-muted'
              }`}>
                {isWorkout && isPast ? '✓' : isWorkout && isToday ? '▶' : isWorkout ? '○' : '–'}
              </span>
              {isToday && isWorkout && (
                <span className="font-mono text-[6px] text-volt-400 leading-none text-center px-0.5 truncate w-full text-center">{shortTitle}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
