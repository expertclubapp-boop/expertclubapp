import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Dumbbell, Lock, PlayCircle, Target, Video, Zap } from 'lucide-react'
import { useWorkout } from '../../hooks/useWorkouts'
import { useProfile } from '../../hooks/useProfile'
import { usePlanTier } from '../../hooks/usePlanTier'
import { profileService } from '../../services/profileService'
import { workoutSessionService } from '../../services/workoutSessionService'
import { useAuth } from '../../contexts/AuthContext'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { V2Card, V2Badge, V2Button, cx } from '../../components/v2/ExpertClubV2Base'
import { exerciseService } from '../../services/exerciseService'
import { fromFirestoreDate } from '../../lib/firebase/date'
import { goalPt, levelPt, formatDaysPerWeek } from '../../utils/labels'
import type { Exercise, WorkoutExercise } from '../../types/domain'

type ExerciseDetailMap = Record<string, Exercise | null>

function formatDate(value?: any) {
  const date = fromFirestoreDate(value)
  return date ? date.toLocaleDateString('pt-BR') : '-'
}

function mergeExerciseContext(exercise: WorkoutExercise, detail?: Exercise | null): WorkoutExercise {
  return {
    ...exercise,
    muscleGroups: detail?.muscleGroups?.length ? detail.muscleGroups : exercise.muscleGroups,
    equipment: detail?.equipment || exercise.equipment,
    videoUrl: exercise.videoUrl || detail?.videoUrl,
    instructions: exercise.instructions || detail?.instructions,
    cues: exercise.cues?.length ? exercise.cues : detail?.cues,
    commonMistakes: exercise.commonMistakes?.length ? exercise.commonMistakes : detail?.commonMistakes,
  }
}

export function WorkoutDetailScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { workout, isLoading: workoutLoading } = useWorkout(workoutId)
  const { profile } = useProfile()
  const { isLowTicket } = usePlanTier()
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetailMap>({})
  const [videoExercise, setVideoExercise] = useState<WorkoutExercise | null>(null)

  const isSelected = profile?.selectedWorkoutId === workoutId

  useEffect(() => {
    if (!workout?.days?.length) {
      setExerciseDetails({})
      return
    }

    const exerciseIds = [...new Set(
      workout.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId).filter(Boolean))
    )]

    Promise.all(exerciseIds.map(async (exerciseId) => {
      const detail = await exerciseService.getExercise(exerciseId)
      return [exerciseId, detail] as const
    }))
      .then((entries) => setExerciseDetails(Object.fromEntries(entries)))
      .catch(() => setExerciseDetails({}))
  }, [workout])

  const enrichedDays = useMemo(() => workout?.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => mergeExerciseContext(exercise, exerciseDetails[exercise.exerciseId])),
  })) || [], [exerciseDetails, workout])

  if (workoutLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A12]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
      </div>
    )
  }

  if (!workout) {
    return (
      <ExpertClubMobileShell active="Treinos" title="Não encontrado">
        <div className="p-20 text-center text-text-muted font-black uppercase italic">Treino não encontrado</div>
      </ExpertClubMobileShell>
    )
  }

  if (isLowTicket && workout.accessTier === 'mentoring') {
    return (
      <ExpertClubMobileShell active="Treinos" title="Treinos">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Exclusivo Mentoria 1:1</p>
            <h2 className="text-xl font-black italic uppercase text-white mb-2">{workout.title}</h2>
            <p className="text-sm text-text-muted max-w-xs mx-auto">Este treino faz parte do plano de Mentoria 1:1. Faça upgrade para ter acesso à prescrição personalizada.</p>
          </div>
          <V2Button variant="primary" className="h-12 px-8" onClick={() => navigate('/app/meu-plano')}>
            Ver planos de mentoria
          </V2Button>
          <button onClick={() => navigate(-1)} className="text-xs text-text-muted underline underline-offset-2">Voltar</button>
        </div>
      </ExpertClubMobileShell>
    )
  }

  const handleUseWorkout = async () => {
    if (!firebaseUser || !workoutId) return
    await profileService.updateProfile(firebaseUser.uid, { selectedWorkoutId: workoutId })
  }

  const handleStartWorkout = async (dayId?: string) => {
    if (!firebaseUser || !workout) return
    const selectedDayId = dayId || workout.days[0]?.id
    if (!selectedDayId) return

    const sessionId = await workoutSessionService.startSession(firebaseUser.uid, {
      workoutId: workout.id,
      dayId: selectedDayId,
      xpEarned: 0,
      logs: [],
    })
    navigate(`/app/workouts/session/${sessionId}`)
  }

  const hasExercises = enrichedDays.some((day) => day.exercises.length > 0)

  return (
    <ExpertClubMobileShell active="Treinos" title="Detalhes" subtitle={workout.title}>
      <div className="flex flex-col gap-8 pb-32">
        <div className="relative -mx-4 -mt-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ec-violet/30 via-transparent to-accent-lime/10" />
          <div className="relative p-6 pt-14">
            <div className="flex flex-wrap gap-2">
              <V2Badge tone={isSelected ? 'success' : 'violet'}>{isSelected ? 'Plano atual' : 'Plano disponível'}</V2Badge>
              <V2Badge tone="violet">{goalPt(workout.goal)}</V2Badge>
              <V2Badge tone="neutral">{levelPt(workout.level)}</V2Badge>
            </div>
            <h1 className="mt-5 text-4xl font-black italic uppercase leading-none tracking-tighter text-white">
              {workout.title}
            </h1>
            <p className="mt-3 max-w-lg text-sm text-text-secondary">
              {workout.description || 'Treino estruturado para te dar clareza antes de começar e consistência durante a execução.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest text-text-secondary">
              <span>{formatDaysPerWeek(workout.daysPerWeek)}</span>
              <span>{workout.durationMinutes} min</span>
              <span>Atualizado em {formatDate(workout.updatedAt || workout.publishedAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={Dumbbell} label="Objetivo" value={goalPt(workout.goal)} />
          <StatBox icon={Clock} label="Duração" value={`${workout.durationMinutes} min`} />
          <StatBox icon={Target} label="Dias" value={formatDaysPerWeek(workout.daysPerWeek)} />
        </div>

        {!hasExercises ? (
          <V2Card className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-accent-yellow" />
            <h3 className="text-lg font-black italic uppercase text-white">Treino sem exercícios</h3>
            <p className="mt-2 text-sm text-text-muted">Este plano ainda não recebeu exercícios válidos para execução.</p>
          </V2Card>
        ) : (
          <div className="space-y-5">
            {enrichedDays.map((day, dayIndex) => (
              <V2Card key={day.id} className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-ec-violet">Dia {dayIndex + 1}</p>
                    <h3 className="mt-1 text-lg font-black italic uppercase text-white">{day.name}</h3>
                    <p className="mt-2 text-xs text-text-muted">{day.exercises.length} exercícios</p>
                  </div>
                  {isSelected && (
                    <V2Button variant="secondary" className="h-10 px-4 text-xs" onClick={() => handleStartWorkout(day.id)}>
                      Iniciar treino
                    </V2Button>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {day.exercises.map((exercise) => (
                    <ExercisePreviewCard
                      key={exercise.id}
                      exercise={exercise}
                      onOpenVideo={() => setVideoExercise(exercise)}
                    />
                  ))}
                </div>
              </V2Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 px-6">
        <div className="mx-auto max-w-md">
          {isSelected ? (
            <V2Button
              variant="primary"
              className="h-16 w-full text-lg font-black italic uppercase shadow-2xl shadow-ec-violet/40"
              onClick={() => handleStartWorkout()}
              disabled={!hasExercises}
            >
              Iniciar treino <PlayCircle size={24} className="ml-2 fill-current" />
            </V2Button>
          ) : (
            <V2Button variant="secondary" className="h-16 w-full text-lg font-black italic uppercase" onClick={handleUseWorkout}>
              Selecionar protocolo
            </V2Button>
          )}
        </div>
      </div>

      {videoExercise && (
        <ExerciseVideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      )}
    </ExpertClubMobileShell>
  )
}

function ExercisePreviewCard({
  exercise,
  onOpenVideo,
}: {
  exercise: WorkoutExercise
  onOpenVideo: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-black italic uppercase text-white">{exercise.exerciseName}</h4>
          <p className="mt-2 text-xs text-text-muted">
            {exercise.muscleGroups.join(', ')}{exercise.equipment ? ` · ${exercise.equipment}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenVideo}
          disabled={!exercise.videoUrl && !exercise.instructions}
          className={cx(
            'inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-black uppercase tracking-widest transition-colors',
            exercise.videoUrl || exercise.instructions
              ? 'border-accent-sky/30 text-accent-sky hover:bg-accent-sky/10'
              : 'border-white/10 text-text-muted opacity-50'
          )}
        >
          <Video className="mr-2 h-3.5 w-3.5" />
          Ver execução
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <InfoPill label="Séries" value={`${exercise.sets}`} />
        <InfoPill label="Reps" value={exercise.reps} />
        <InfoPill label="Descanso" value={`${exercise.restSeconds}s`} />
        <InfoPill label="RPE/RIR" value={exercise.rpeTarget || exercise.rirTarget ? `${exercise.rpeTarget ? `RPE ${exercise.rpeTarget}` : ''}${exercise.rpeTarget && exercise.rirTarget ? ' · ' : ''}${exercise.rirTarget ? `RIR ${exercise.rirTarget}` : ''}` : '-'} />
      </div>

      {exercise.setGroups && exercise.setGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exercise.setGroups.map((g, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
              {g.sets}×{g.reps} <span className="text-accent-lime/70">{g.label}</span>
            </span>
          ))}
        </div>
      )}

      {exercise.techniqueName && (
        <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Técnica: {exercise.techniqueName}</span>
          </div>
          {exercise.techniqueDescription && (
            <p className="text-xs text-amber-300/80 leading-relaxed">{exercise.techniqueDescription}</p>
          )}
        </div>
      )}

      {exercise.notes && (
        <SectionBlock title="Nota do treinador" content={exercise.notes} className="mt-4 border-accent-sky/20 bg-accent-sky/10 text-accent-sky/90" />
      )}
      {exercise.instructions && <SectionBlock title="Como executar" content={exercise.instructions} className="mt-4" />}
      {exercise.cues?.length ? <TagSection title="Cues do treinador" items={exercise.cues} /> : null}
      {exercise.commonMistakes?.length ? <TagSection title="Erros comuns" items={exercise.commonMistakes} /> : null}
    </div>
  )
}

function ExerciseVideoModal({
  exercise,
  onClose,
}: {
  exercise: WorkoutExercise
  onClose: () => void
}) {
  const embedUrl = exercise.videoUrl?.includes('watch?v=')
    ? exercise.videoUrl.replace('watch?v=', 'embed/')
    : exercise.videoUrl

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d1422] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-ec-violet">Vídeo demonstrativo</p>
            <h3 className="mt-1 text-lg font-black italic uppercase text-white">{exercise.exerciseName}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-2 min-h-[44px] text-xs font-black uppercase tracking-widest text-text-muted">
            Fechar
          </button>
        </div>
        {embedUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe src={embedUrl} title={exercise.exerciseName} className="h-full w-full" allowFullScreen />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black/40 text-center text-text-muted">
            URL de vídeo indisponível para este exercício.
          </div>
        )}
        <div className="space-y-4 p-5">
          {exercise.instructions && <SectionBlock title="Como executar" content={exercise.instructions} />}
          {exercise.cues?.length ? <TagSection title="Cues do treinador" items={exercise.cues} /> : null}
          {exercise.commonMistakes?.length ? <TagSection title="Erros comuns" items={exercise.commonMistakes} /> : null}
        </div>
      </div>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Dumbbell
  label: string
  value: string
}) {
  return (
    <V2Card className="flex flex-col items-center gap-2 p-3 text-center">
      <Icon size={14} className="text-ec-violet" />
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
        <p className="text-xs font-black italic uppercase text-white">{value}</p>
      </div>
    </V2Card>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/10 p-3">
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function SectionBlock({
  title,
  content,
  className,
}: {
  title: string
  content: string
  className?: string
}) {
  return (
    <div className={cx('rounded-2xl border border-white/8 bg-white/[0.03] p-4', className)}>
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{content}</p>
    </div>
  )
}

function TagSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
