import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Timer,
  ArrowLeft,
  ArrowRight,
  X,
  SkipForward,
  Plus,
  Pause,
  PlayCircle,
  AlertTriangle,
  Trophy,
  Share2,
  TrendingUp,
  Dumbbell,
  Zap,
  Clock,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { track } from '../../lib/analytics'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkoutSession } from '../../hooks/useWorkoutSession'
import { useWorkout } from '../../hooks/useWorkouts'
import { exerciseService } from '../../services/exerciseService'
import { workoutProgressionService, type ExerciseProgression } from '../../services/workoutProgressionService'
import { workoutSessionService } from '../../services/workoutSessionService'
import { fromFirestoreDate } from '../../lib/firebase/date'
import type { Exercise, SetLog, WorkoutPR, WorkoutExercise, WorkoutExerciseSubstitution, WorkoutSession } from '../../types/domain'

type ScreenPhase = 'workout' | 'completion'

type SetInput = {
  reps: string
  load: string
}

type SetInputErrors = {
  reps?: string
  load?: string
}

type SetProgressionReference = {
  loadLabel: string
  repsLabel: string
}

function formatDate(value?: any) {
  const date = fromFirestoreDate(value)
  return date ? date.toLocaleDateString('pt-BR') : '-'
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatLoad(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
}

function formatTonnage(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
}

function sanitizeTextList(items?: string[]) {
  return (items || []).map((item) => item.trim()).filter(Boolean)
}

function normalizeVideoUrl(url?: string) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url
    }
    return url
  } catch {
    return null
  }
}

function isValidSetLog(log: Partial<SetLog> | null | undefined) {
  if (!log) return false
  if (!Number.isFinite(log.reps) || !Number.isFinite(log.loadKg)) return false
  if ((log.reps ?? 0) <= 0) return false
  if ((log.loadKg ?? 0) < 0) return false
  return true
}

function computeTotalTonnage(logs: SetLog[]) {
  return logs.reduce((sum, log) => {
    if (!isValidSetLog(log)) return sum
    return sum + log.loadKg * log.reps
  }, 0)
}

function parseNumericInput(raw: string, allowDecimal: boolean) {
  const normalized = raw.replace(',', '.').trim()
  if (!normalized) return null
  const parsed = allowDecimal ? Number.parseFloat(normalized) : Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function getPreviousSetReference(previousSession: WorkoutSession | null, exerciseId: string, setNumber: number, fallbackReps: string): SetProgressionReference {
  const previousLog = previousSession?.logs?.find((log) => log.exerciseId === exerciseId && log.setNumber === setNumber && isValidSetLog(log))
  return {
    loadLabel: previousLog ? previousLog.loadKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '',
    repsLabel: previousLog ? String(previousLog.reps) : fallbackReps,
  }
}

function WorkoutExecutionEmptyState({
  title,
  description,
  onBack,
}: {
  title: string
  description: string
  onBack: () => void
}) {
  return (
    <div className="ec-student-standalone min-h-screen px-5 py-8 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[28px] border border-white/10 bg-[#111a2c] p-6 shadow-2xl shadow-black/30">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-ec-violet/15 text-ec-violet">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-ec-violet">Treino</p>
          <h1 className="mt-2 font-display text-2xl font-black uppercase italic leading-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-text-secondary">
            {description}
          </p>
          <Button variant="primary" className="mt-6 w-full py-4" onClick={onBack}>
            Voltar para treinos
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WorkoutExecutionScreen() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { session, isLoading: sessionLoading } = useWorkoutSession(sessionId)
  const { workout, isLoading: workoutLoading } = useWorkout(session?.workoutId)

  const [previousSession, setPreviousSession] = useState<WorkoutSession | null>(null)
  const [exerciseDetails, setExerciseDetails] = useState<Record<string, Exercise>>({})
  const [exerciseProgression, setExerciseProgression] = useState<Record<string, ExerciseProgression>>({})
  const [contextError, setContextError] = useState<string | null>(null)
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isRestActive, setIsRestActive] = useState(false)
  const [isRestPaused, setIsRestPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [phase, setPhase] = useState<ScreenPhase>('workout')
  const [setInputs, setSetInputs] = useState<Record<string, SetInput>>({})
  const [setInputErrors, setSetInputErrors] = useState<Record<string, SetInputErrors>>({})
  const [savingSetKey, setSavingSetKey] = useState<string | null>(null)
  const [screenError, setScreenError] = useState<string | null>(null)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [completionPrs, setCompletionPrs] = useState<WorkoutPR[]>([])
  const [volumeDeltaPct, setVolumeDeltaPct] = useState<number | null>(null)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false)
  const lastInteraction = useRef(Date.now())

  const currentDay = useMemo(() => workout?.days.find((day) => day.id === session?.dayId), [workout, session])

  useEffect(() => {
    const uid = firebaseUser?.uid ?? ''
    const day = currentDay
    const activeSession = session
    if (!uid || !day) return
    const dayData = day

    let active = true

    async function loadContext() {
      try {
        const [recentSessions, detailEntries, progressionEntries] = await Promise.all([
          sessionId && activeSession?.workoutId
            ? workoutSessionService.getRecentSessions(uid, 30).then((sessions) =>
                sessions.filter((item) => item.id !== sessionId && item.workoutId === activeSession.workoutId && item.status === 'completed')
              )
            : Promise.resolve([]),
          Promise.all(
            dayData.exercises.map(async (item) => {
              const detail = await exerciseService.getExercise(item.exerciseId)
              return [item.exerciseId, detail] as const
            })
          ),
          Promise.all(
            dayData.exercises.map(async (item) => {
              const progression = await workoutProgressionService.getExerciseProgression(uid, item.id)
              return [item.id, progression] as const
            })
          ),
        ])

        if (!active) return

        setPreviousSession(recentSessions[0] || null)
        setExerciseDetails(
          detailEntries.reduce<Record<string, Exercise>>((acc, [exerciseId, detail]) => {
            if (detail) acc[exerciseId] = detail
            return acc
          }, {})
        )
        setExerciseProgression(
          progressionEntries.reduce<Record<string, ExerciseProgression>>((acc, [exerciseId, progression]) => {
            acc[exerciseId] = progression
            return acc
          }, {})
        )
        setContextError(null)
      } catch (error) {
        if (!active) return
        setContextError(error instanceof Error ? error.message : 'Não foi possível carregar o contexto de progressão deste treino.')
      }
    }

    loadContext()

    return () => {
      active = false
    }
  }, [currentDay, firebaseUser?.uid, session?.workoutId, sessionId])

  const originalExercise = currentDay?.exercises[currentExerciseIdx]
  const exercise: WorkoutExercise | undefined = useMemo(() => {
    if (!originalExercise) return undefined

    const substitution = session?.substitutions?.[originalExercise.id]
    const activeExercise = substitution || originalExercise
    const detail = exerciseDetails[activeExercise.exerciseId]

    return {
      ...originalExercise,
      ...activeExercise,
      videoUrl: activeExercise.videoUrl || detail?.videoUrl,
      instructions: activeExercise.instructions || detail?.instructions,
      cues: sanitizeTextList(activeExercise.cues || detail?.cues),
      commonMistakes: sanitizeTextList(activeExercise.commonMistakes || detail?.commonMistakes),
      notes: activeExercise.notes || originalExercise.notes,
      muscleGroups: activeExercise.muscleGroups?.length ? activeExercise.muscleGroups : detail?.muscleGroups || originalExercise.muscleGroups,
      equipment: activeExercise.equipment || detail?.equipment || originalExercise.equipment,
    }
  }, [exerciseDetails, originalExercise, session?.substitutions])

  const currentProgression = exercise ? exerciseProgression[exercise.id] : undefined
  const progress = currentDay ? Math.round((currentExerciseIdx / currentDay.exercises.length) * 100) : 0

  const startedAtMs = useMemo(() => {
    const startedAt = fromFirestoreDate(session?.startedAt)
    return startedAt ? startedAt.getTime() : Date.now()
  }, [session?.startedAt])

  useEffect(() => {
    if (phase !== 'workout') return
    const tick = () => setTotalSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [phase, startedAtMs])

  useEffect(() => {
    if (!isRestActive || isRestPaused || restTimer <= 0) return
    const interval = setInterval(() => {
      setRestTimer((value) => {
        if (value <= 1) {
          setIsRestActive(false)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestActive, isRestPaused, restTimer])

  useEffect(() => {
    if (phase !== 'workout') return
    const check = setInterval(() => {
      const idle = Date.now() - lastInteraction.current
      if (idle > 10 * 60 * 1000 && !showInactivityWarning) {
        setShowInactivityWarning(true)
        if (firebaseUser?.uid && sessionId) {
          workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
            inactiveWarningShownAt: new Date(),
            lastInteractionAt: new Date(lastInteraction.current),
          }).catch(() => undefined)
        }
      }
      if (idle > 20 * 60 * 1000 && firebaseUser?.uid && sessionId) {
        workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
          status: 'inactive',
          lastInteractionAt: new Date(lastInteraction.current),
        }).catch(() => undefined)
      }
    }, 30000)
    return () => clearInterval(check)
  }, [firebaseUser?.uid, phase, sessionId, showInactivityWarning])

  const touchInteraction = useCallback(() => {
    lastInteraction.current = Date.now()
    setShowInactivityWarning(false)
    if (firebaseUser?.uid && sessionId) {
      workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
        status: 'active',
        lastInteractionAt: new Date(),
      }).catch(() => undefined)
    }
  }, [firebaseUser?.uid, sessionId])

  const logs = session?.logs || []
  const totalTonnage = computeTotalTonnage(logs)
  const completedExerciseIds = new Set(logs.map((log) => log.exerciseId))
  const totalSetsCompleted = logs.length

  const bestExercise = useMemo(() => {
    const volumes = new Map<string, number>()
    logs.forEach((log) => {
      if (!isValidSetLog(log)) return
      volumes.set(log.exerciseId, (volumes.get(log.exerciseId) || 0) + log.loadKg * log.reps)
    })
    const best = [...volumes.entries()].sort((a, b) => b[1] - a[1])[0]
    return best ? currentDay?.exercises.find((item) => item.id === best[0])?.exerciseName : null
  }, [currentDay, logs])

  if (sessionLoading || workoutLoading) {
    return (
      <div className="ec-student-standalone min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
      </div>
    )
  }

  if (!currentDay || !session) {
    return (
      <WorkoutExecutionEmptyState
        title="Sessão não encontrada"
        description="Esta sessão não existe para o usuário logado ou ainda não foi iniciada. Abra a biblioteca e inicie um treino real para registrar séries."
        onBack={() => navigate('/app/workouts')}
      />
    )
  }

  if (phase === 'completion') {
    return (
      <div className="ec-student-standalone min-h-screen text-text-primary flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-accent-lime/20 ring-4 ring-accent-lime/10">
              <Trophy className="h-12 w-12 text-accent-lime" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-2 font-display text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl"
          >
            Treino finalizado
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10 max-w-sm text-sm text-text-muted"
          >
            Boa. Você registrou mais uma sessão real e deixou histórico útil para a próxima execução.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-10 grid w-full max-w-sm grid-cols-2 gap-3"
          >
            <StatCard icon={<Clock className="h-4 w-4" />} label="Duração" value={formatTime(totalSeconds)} />
            <StatCard icon={<Dumbbell className="h-4 w-4" />} label="Exercícios" value={`${completedExerciseIds.size}/${currentDay.exercises.length}`} />
            <StatCard icon={<Zap className="h-4 w-4" />} label="Séries" value={String(totalSetsCompleted)} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Tonelagem" value={formatTonnage(totalTonnage)} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left"
          >
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Resumo</p>
            <p className="mt-2 text-sm text-white">
              Tempo de treino: {formatTime(totalSeconds)}. {bestExercise ? `Maior volume em ${bestExercise}.` : 'Esse treino ainda está construindo seu histórico.'}
            </p>
            {volumeDeltaPct !== null && (
              <p className="mt-2 text-sm font-bold text-accent-lime">
                Você fez {volumeDeltaPct >= 0 ? '+' : ''}
                {volumeDeltaPct}% de volume contra a última sessão.
              </p>
            )}
            {completionPrs.length > 0 ? (
              <div className="mt-3 space-y-1">
                {completionPrs.slice(0, 3).map((pr) => (
                  <p key={`${pr.exerciseId}-${pr.type}`} className="text-xs text-accent-lime">
                    Novo PR em {pr.exerciseName}: {pr.type === 'load' ? `${pr.value} kg` : pr.type === 'reps' ? `${pr.value} reps` : `${pr.value} kg de volume`}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-text-muted">Os novos recordes aparecerão aqui quando houver comparação real com sessões anteriores.</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex w-full max-w-sm flex-col gap-3">
            <Button
              variant="primary"
              className="w-full py-5"
              icon={<Share2 className="h-5 w-5" />}
              onClick={() => {
                const text = `Treino finalizado\nTempo: ${formatTime(totalSeconds)}\nSéries: ${totalSetsCompleted}\nVolume: ${formatTonnage(totalTonnage)}`
                if (navigator.share) {
                  navigator.share({ text }).catch(() => undefined)
                  return
                }
                navigator.clipboard.writeText(text)
                setShareFeedback('Resumo copiado para a área de transferência.')
              }}
            >
              Compartilhar resultado
            </Button>
            {shareFeedback && (
              <p className="rounded-xl border border-accent-lime/35 bg-accent-lime/10 px-4 py-3 text-center text-xs font-bold text-accent-lime">
                {shareFeedback}
              </p>
            )}
            <Button variant="ghost" className="w-full border-subtle py-5" onClick={() => navigate('/app/evolution')}>
              Ver evolução
            </Button>
            <Button variant="ghost" className="w-full py-4 text-text-muted" onClick={() => navigate('/app/today')}>
              Voltar para hoje
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!exercise || !originalExercise) {
    return (
      <WorkoutExecutionEmptyState
        title="Exercício não encontrado"
        description="A sessão foi aberta, mas não há exercício válido para registrar. Volte para a biblioteca e escolha um treino publicado."
        onBack={() => navigate('/app/workouts')}
      />
    )
  }

  const activeSession = session
  const activeDay = currentDay
  const activeExercise = exercise
  const baseExercise = originalExercise

  async function handleSetComplete(setNumber: number) {
    if (!firebaseUser?.uid || !sessionId) return

    touchInteraction()
    setScreenError(null)

    const key = `${activeExercise.id}-${setNumber}`
    const input = setInputs[key] || { reps: '', load: '' }
    const reps = parseNumericInput(input.reps, false)
    const load = parseNumericInput(input.load, true)
    const nextErrors: SetInputErrors = {}

    if (reps === null) {
      nextErrors.reps = 'Informe as repetições desta série.'
    } else if (reps <= 0) {
      nextErrors.reps = 'Use um número maior que zero.'
    }

    if (load === null) {
      nextErrors.load = 'Informe a carga desta série.'
    } else if (load < 0) {
      nextErrors.load = 'A carga não pode ser negativa.'
    }

    if (nextErrors.reps || nextErrors.load) {
      setSetInputErrors((prev) => ({ ...prev, [key]: nextErrors }))
      return
    }

    const prescribedRpe = parseNumericInput(activeExercise.rpeTarget || '', true)
    const newLog: SetLog = {
      exerciseId: activeExercise.id,
      setNumber,
      reps: reps as number,
      loadKg: load as number,
      rpe: prescribedRpe ?? undefined,
    }
    const updatedLogs = [...(activeSession.logs || []).filter((log) => !(log.exerciseId === activeExercise.id && log.setNumber === setNumber)), newLog]
      .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber)

    setSavingSetKey(key)
    try {
      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, { logs: updatedLogs })
      setSetInputErrors((prev) => ({ ...prev, [key]: {} }))
      setRestTimer(activeExercise.restSeconds)
      setIsRestActive(true)
      setIsRestPaused(false)
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'Não foi possível salvar esta série agora.')
    } finally {
      setSavingSetKey(null)
    }
  }

  async function handleSubstitute(alternative: WorkoutExerciseSubstitution) {
    if (!firebaseUser?.uid || !sessionId) return

    touchInteraction()
    setScreenError(null)

    const updatedSubstitutions = {
      ...(activeSession.substitutions || {}),
      [baseExercise.id]: {
        ...baseExercise,
        exerciseId: alternative.exerciseId,
        exerciseName: alternative.exerciseName,
        muscleGroups: alternative.muscleGroups || baseExercise.muscleGroups,
        equipment: alternative.equipment || baseExercise.equipment,
        videoUrl: alternative.videoUrl || baseExercise.videoUrl,
        instructions: alternative.instructions || baseExercise.instructions,
        cues: baseExercise.cues,
        commonMistakes: baseExercise.commonMistakes,
      },
    }

    try {
      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, { substitutions: updatedSubstitutions })
      setSubstitutionModalOpen(false)
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'Não foi possível substituir o exercício agora.')
    }
  }

  async function handleFinish() {
    if (!firebaseUser?.uid || !sessionId) return

    setScreenError(null)

    try {
      const recent = await workoutSessionService.getRecentSessions(firebaseUser.uid, 30)
      const previous = recent.find((item) => item.id !== sessionId && item.workoutId === activeSession.workoutId && item.status === 'completed')
      const previousLogs = previous?.logs || []
      const prs: WorkoutPR[] = []

      for (const log of logs.filter((item) => isValidSetLog(item))) {
        const exerciseName = activeDay.exercises.find((item) => item.id === log.exerciseId)?.exerciseName || 'Exercício'
        const previousForExercise = previousLogs.filter((item) => item.exerciseId === log.exerciseId && isValidSetLog(item))
        const previousLoad = Math.max(0, ...previousForExercise.map((item) => item.loadKg || 0))
        const previousReps = Math.max(0, ...previousForExercise.map((item) => item.reps || 0))
        const previousVolume = Math.max(0, ...previousForExercise.map((item) => (item.loadKg || 0) * (item.reps || 0)))
        const currentVolume = log.loadKg * log.reps

        if (log.loadKg > previousLoad) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'load', value: log.loadKg, previousValue: previousLoad })
        if (log.reps > previousReps) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'reps', value: log.reps, previousValue: previousReps })
        if (currentVolume > previousVolume) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'volume', value: currentVolume, previousValue: previousVolume })
      }

      const previousTonnage = computeTotalTonnage(previousLogs)
      setCompletionPrs(prs)
      setVolumeDeltaPct(previousTonnage > 0 ? Math.round(((totalTonnage - previousTonnage) / previousTonnage) * 100) : null)

      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
        status: 'completed',
        completedAt: new Date(),
        finishedAt: new Date(),
        durationSeconds: totalSeconds,
        lastInteractionAt: new Date(),
        totalTonnageKg: totalTonnage,
        exercisesCompleted: completedExerciseIds.size,
        totalSets: totalSetsCompleted,
        prs,
        xpEarned: 150,
      })
      track('workout_session_completed', {
        duration_seconds: totalSeconds,
        total_tonnage_kg: totalTonnage,
        exercises_completed: completedExerciseIds.size,
        total_sets: totalSetsCompleted,
        pr_count: prs.length,
      })
      setPhase('completion')
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'Não foi possível concluir o treino agora.')
    }
  }

  const getInputKey = (exerciseId: string, setNum: number) => `${exerciseId}-${setNum}`
  const getInput = (exerciseId: string, setNum: number) => setInputs[getInputKey(exerciseId, setNum)] || { reps: '', load: '' }
  const updateInput = (exerciseId: string, setNum: number, field: 'reps' | 'load', value: string) => {
    touchInteraction()
    const key = getInputKey(exerciseId, setNum)
    setSetInputs((prev) => ({
      ...prev,
      [key]: { ...getInput(exerciseId, setNum), [field]: value },
    }))
    setSetInputErrors((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: undefined },
    }))
  }

  const embeddedVideoUrl = normalizeVideoUrl(exercise.videoUrl)
  const cues = sanitizeTextList(exercise.cues)
  const commonMistakes = sanitizeTextList(exercise.commonMistakes)

  return (
    <div className="ec-student-standalone ec-app-bg min-h-screen pb-40 text-text-primary" onClick={touchInteraction}>
      <AnimatePresence>
        {showInactivityWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md"
          >
            <div className="ec-card w-full max-w-sm rounded-3xl p-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-accent-yellow" />
              <h2 className="mb-2 font-display text-xl font-black uppercase italic text-white">Seu treino está aberto</h2>
              <p className="mb-6 text-sm text-text-muted">Você ainda está registrando esta sessão?</p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full py-4" onClick={() => touchInteraction()}>
                  Sim, continuar
                </Button>
                <Button variant="ghost" className="w-full border-subtle py-4" onClick={handleFinish}>
                  Finalizar treino
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-4xl items-center justify-between rounded-2xl px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-lime" />
            <span className="font-display text-lg font-black tabular-nums text-white">{formatTime(totalSeconds)}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-3 pt-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold uppercase italic leading-tight">{currentDay.name}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              Exercício {currentExerciseIdx + 1} de {currentDay.exercises.length}
            </p>
          </div>
          <span className="font-display font-bold italic text-accent-lime">{progress}%</span>
        </div>
        <ProgressBar value={progress} color="lime" />
      </section>

      <main className="mx-auto max-w-4xl space-y-4 px-5">
        {screenError && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {screenError}
          </div>
        )}
        {contextError && (
          <div className="rounded-2xl border border-accent-sky/30 bg-accent-sky/10 px-4 py-3 text-sm text-accent-sky">
            {contextError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="ec-card overflow-hidden rounded-2xl"
          >
            <div className="p-5">
              <div className="mb-5 flex justify-between gap-4">
                <div className="flex-1">
                  {session.substitutions?.[originalExercise.id] && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-sky/10 px-2 py-0.5">
                      <Zap className="h-3 w-3 text-accent-sky" />
                      <span className="text-xs font-bold uppercase tracking-widest text-accent-sky">Substituído</span>
                    </div>
                  )}
                  <h2 className="mb-2 font-display text-xl font-bold uppercase italic leading-tight text-text-primary">
                    {exercise.exerciseName}
                  </h2>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(exercise.muscleGroups || []).map((muscleGroup) => (
                      <Badge key={muscleGroup} color="lime" className="px-2.5 py-1 text-xs uppercase">
                        {muscleGroup}
                      </Badge>
                    ))}
                    {exercise.equipment && (
                      <Badge color="violet" className="px-2.5 py-1 text-xs uppercase">
                        {exercise.equipment}
                      </Badge>
                    )}
                    {exercise.rpeTarget !== undefined && (
                      <Badge color="sky" className="px-2.5 py-1 text-xs uppercase">
                        {`RPE ${exercise.rpeTarget}`}
                      </Badge>
                    )}
                    {exercise.rirTarget !== undefined && (
                      <Badge color="sky" className="px-2.5 py-1 text-xs uppercase">
                        {`RIR ${exercise.rirTarget}`}
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                    <ContextLine label="Séries" value={String(exercise.sets)} />
                    <ContextLine label="Repetições" value={exercise.reps} />
                    <ContextLine label="Descanso" value={`${exercise.restSeconds}s`} />
                    <ContextLine label="Vídeo" value={exercise.videoUrl ? 'Disponível' : 'Indisponível'} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${exercise.videoUrl || exercise.instructions || cues.length || commonMistakes.length ? 'border-accent-sky/30 bg-accent-sky/10 text-accent-sky hover:bg-accent-sky/15' : 'border-white/10 bg-white/[0.03] text-text-muted'}`}
                  onClick={() => (exercise.videoUrl || exercise.instructions || cues.length || commonMistakes.length) && setVideoModalOpen(true)}
                  disabled={!exercise.videoUrl && !exercise.instructions && cues.length === 0 && commonMistakes.length === 0}
                >
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    <span className="text-sm font-bold">Ver execução</span>
                  </div>
                  <p className="mt-1 text-xs">
                    Vídeo demonstrativo, instruções e pontos de atenção em uma só tela.
                  </p>
                </button>

                <button
                  type="button"
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${exercise.substitutionOptions?.length ? 'border-white/10 bg-white/[0.03] text-white hover:border-accent-lime/30' : 'border-white/10 bg-white/[0.03] text-text-muted opacity-60'}`}
                  onClick={() => exercise.substitutionOptions?.length && setSubstitutionModalOpen(true)}
                  disabled={!exercise.substitutionOptions?.length}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm font-bold">Substituir exercício</span>
                  </div>
                  <p className="mt-1 text-xs">Troque por uma alternativa aprovada no plano quando fizer sentido.</p>
                </button>
              </div>

              {(exercise.notes || exercise.instructions || cues.length > 0 || commonMistakes.length > 0 || exercise.techniqueName) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {exercise.techniqueName && (
                    <InfoCard title={`Técnica: ${exercise.techniqueName}`} tone="warning">
                      <div className="space-y-1.5">
                        {exercise.techniqueDescription && (
                          <p className="text-sm font-semibold">{exercise.techniqueDescription}</p>
                        )}
                        {exercise.techniqueInstructions && (
                          <p className="text-xs leading-relaxed opacity-90">{exercise.techniqueInstructions}</p>
                        )}
                      </div>
                    </InfoCard>
                  )}
                  {exercise.notes && (
                    <InfoCard title="Nota do treinador" tone="violet">
                      {exercise.notes}
                    </InfoCard>
                  )}
                  {exercise.instructions && (
                    <InfoCard title="Como executar" tone="sky">
                      {exercise.instructions}
                    </InfoCard>
                  )}
                  {cues.length > 0 && (
                    <InfoCard title="Cues do treinador" tone="lime">
                      <ul className="space-y-1 text-sm">
                        {cues.map((cue) => (
                          <li key={cue}>• {cue}</li>
                        ))}
                      </ul>
                    </InfoCard>
                  )}
                  {commonMistakes.length > 0 && (
                    <InfoCard title="Erros comuns" tone="warning">
                      <ul className="space-y-1 text-sm">
                        {commonMistakes.map((mistake) => (
                          <li key={mistake}>• {mistake}</li>
                        ))}
                      </ul>
                    </InfoCard>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <ProgressionCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Última execução"
                  value={
                    currentProgression?.latestDate
                      ? `${formatLoad(currentProgression.latestLoad)} · ${currentProgression.latestReps || 0} reps`
                      : 'Primeira execução registrada deste exercício.'
                  }
                  caption={currentProgression?.latestDate ? `Em ${formatDate(currentProgression.latestDate)}` : 'Ainda sem histórico para comparação.'}
                />
                <ProgressionCard
                  icon={<Trophy className="h-4 w-4" />}
                  label="Melhor marca"
                  value={
                    currentProgression?.bestDate
                      ? `${formatLoad(currentProgression.bestLoad)} · ${currentProgression.bestReps || 0} reps`
                      : 'Ainda sem melhor marca registrada.'
                  }
                  caption={currentProgression?.bestDate ? `Em ${formatDate(currentProgression.bestDate)}` : 'Ela aparece após a primeira sessão válida.'}
                />
                <ProgressionCard
                  icon={<Dumbbell className="h-4 w-4" />}
                  label="Volume recente"
                  value={
                    currentProgression?.recentVolume?.[0]
                      ? formatTonnage(currentProgression.recentVolume[0].tonnage)
                      : 'Sem volume anterior para mostrar.'
                  }
                  caption={
                    currentProgression?.recentVolume?.[0]
                      ? `Sessão anterior em ${formatDate(currentProgression.recentVolume[0].date)}`
                      : 'Primeira execução registrada deste exercício.'
                  }
                />
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="grid grid-cols-12 gap-2 px-1 text-xs font-black uppercase tracking-widest text-text-secondary">
                  <div className="col-span-2">Série</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-4 text-center">Carga</div>
                  <div className="col-span-3 pr-2 text-right">Salvar</div>
                </div>

                {Array.from({ length: exercise.sets }).map((_, index) => {
                  const setNumber = index + 1
                  const isDone = session.logs?.some((log) => log.exerciseId === exercise.id && log.setNumber === setNumber)
                  const previousDone = index === 0 || session.logs?.some((log) => log.exerciseId === exercise.id && log.setNumber === index)
                  const isActive = !isDone && previousDone
                  const input = getInput(exercise.id, setNumber)
                  const key = getInputKey(exercise.id, setNumber)
                  const errors = setInputErrors[key] || {}

                  // Resolve reps from setGroups if present
                  let groupForSet: { label: string; sets: number; reps: string } | undefined
                  let isGroupStart = false
                  if (exercise.setGroups?.length) {
                    let cursor = 0
                    for (const g of exercise.setGroups) {
                      const start = cursor
                      cursor += g.sets
                      if (index >= start && index < cursor) {
                        groupForSet = g
                        isGroupStart = index === start
                        break
                      }
                    }
                  }
                  const repsRef = groupForSet?.reps ?? exercise.reps
                  const previousReference = getPreviousSetReference(previousSession, exercise.id, setNumber, repsRef)

                  return (
                    <div key={setNumber}>
                    {isGroupStart && groupForSet && (
                      <div className="flex items-center gap-2 py-1.5 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent-lime/70 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {groupForSet.label} — {groupForSet.sets}×{groupForSet.reps}
                        </span>
                        <div className="flex-1 h-px bg-accent-lime/15" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl border p-3 transition-all ${
                        isActive
                          ? 'border-accent-lime/30 bg-accent-lime/5 ring-1 ring-accent-lime/20'
                          : isDone
                            ? 'border-white/[0.05] bg-white/[0.03]'
                            : 'border-transparent opacity-45'
                      }`}
                    >
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className={`col-span-2 text-center font-display font-bold ${isActive ? 'text-lg italic text-accent-lime' : 'text-text-muted'}`}>
                          {setNumber}
                        </div>
                        <div className="col-span-3">
                          <input
                            className={`ec-input w-full rounded-xl py-3 text-center text-base font-bold text-text-primary outline-none ${errors.reps ? 'border border-rose-400/60' : ''}`}
                            placeholder={previousReference.repsLabel}
                            type="number"
                            inputMode="numeric"
                            value={input.reps}
                            onChange={(event) => updateInput(exercise.id, setNumber, 'reps', event.target.value)}
                            disabled={isDone || !isActive}
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            className={`ec-input w-full rounded-xl py-3 text-center text-base font-bold text-text-primary outline-none ${errors.load ? 'border border-rose-400/60' : ''}`}
                            placeholder={previousReference.loadLabel || '0'}
                            type="text"
                            inputMode="decimal"
                            value={input.load}
                            onChange={(event) => updateInput(exercise.id, setNumber, 'load', event.target.value)}
                            disabled={isDone || !isActive}
                          />
                        </div>
                        <div className="col-span-3 flex justify-end px-1">
                          <button
                            onClick={() => isActive && handleSetComplete(setNumber)}
                            disabled={!isActive || savingSetKey === key}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
                              isDone
                                ? 'border-accent-lime bg-accent-lime text-bg-primary'
                                : isActive
                                  ? 'border-accent-lime hover:bg-accent-lime/20'
                                  : 'border-white/10'
                            }`}
                          >
                            {savingSetKey === key ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-lime/30 border-t-accent-lime" />
                            ) : isDone ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4 text-accent-lime" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1 text-xs md:grid-cols-2">
                        <span className="text-text-muted">
                          Referência anterior: {previousReference.loadLabel ? `${previousReference.loadLabel} kg` : 'sem carga anterior'} · {previousReference.repsLabel} reps
                        </span>
                        <span className="text-text-muted md:text-right">
                          {isDone ? 'Série salva.' : isActive ? 'Preencha reps e carga para salvar.' : 'Conclua a série anterior para liberar esta.'}
                        </span>
                      </div>
                      {(errors.reps || errors.load) && (
                        <div className="mt-2 space-y-1 text-xs text-rose-300">
                          {errors.reps && <p>{errors.reps}</p>}
                          {errors.load && <p>{errors.load}</p>}
                        </div>
                      )}
                    </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className={`ec-card rounded-2xl p-5 transition-all ${isRestActive ? 'bg-accent-sky/[0.03] ring-1 ring-accent-sky/30' : ''}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className={`h-6 w-6 ${isRestActive ? 'animate-pulse text-accent-sky' : 'text-text-muted'}`} />
              <div>
                <p className="text-sm font-bold text-white">Descanso</p>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Meta: {exercise.restSeconds}s</p>
              </div>
            </div>
            <span className={`font-display text-3xl font-black italic tabular-nums ${isRestActive ? 'text-accent-sky' : 'text-white/80'}`}>
              {formatTime(restTimer)}
            </span>
          </div>

          {isRestActive && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setIsRestPaused((value) => !value)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-white/10"
              >
                {isRestPaused ? <PlayCircle className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isRestPaused ? 'Retomar' : 'Pausar'}
              </button>
              <button
                onClick={() => setRestTimer((value) => value + 30)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-white/10"
              >
                <Plus className="h-4 w-4" /> 30s
              </button>
              <button
                onClick={() => {
                  setRestTimer(0)
                  setIsRestActive(false)
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-accent-lime/20 bg-accent-lime/10 px-4 py-3 text-sm font-bold text-accent-lime transition-all active:scale-95 hover:bg-accent-lime/20"
              >
                <SkipForward className="h-4 w-4" /> Pular
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 border-subtle py-5"
            disabled={currentExerciseIdx === 0}
            onClick={() => {
              setCurrentExerciseIdx((value) => value - 1)
              touchInteraction()
            }}
            icon={<ArrowLeft className="h-5 w-5" />}
          >
            Anterior
          </Button>

          {currentExerciseIdx < currentDay.exercises.length - 1 ? (
            <Button
              variant="ghost"
              className="flex-1 bg-surface-1 py-5"
              onClick={() => {
                setCurrentExerciseIdx((value) => value + 1)
                touchInteraction()
              }}
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Próximo
            </Button>
          ) : (
            <Button variant="primary" className="flex-1 py-5" onClick={handleFinish} icon={<Check className="h-5 w-5" />}>
              Finalizar
            </Button>
          )}
        </div>
      </main>

      <AnimatePresence>
        {videoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-6"
          >
            <div className="ec-card relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl">
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              {embeddedVideoUrl ? (
                <div className="relative aspect-video w-full bg-black">
                  <iframe src={embeddedVideoUrl} className="absolute inset-0 h-full w-full" allowFullScreen title="Vídeo demonstrativo" />
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center bg-black/50 text-text-muted">
                  <PlayCircle className="mb-3 h-12 w-12 opacity-20" />
                  <p className="font-display font-bold uppercase italic">Vídeo indisponível</p>
                  <p className="mt-2 text-xs">Use as instruções abaixo para conduzir a execução.</p>
                </div>
              )}

              <div className="overflow-y-auto p-6">
                <h3 className="mb-4 font-display text-xl font-bold uppercase italic text-white">{exercise.exerciseName}</h3>

                <div className="grid gap-3">
                  <InfoCard title="Como executar" tone="sky">
                    {exercise.instructions || 'Sem instruções detalhadas cadastradas para este exercício.'}
                  </InfoCard>
                  {cues.length > 0 && (
                    <InfoCard title="Cues do treinador" tone="lime">
                      <ul className="space-y-1 text-sm">
                        {cues.map((cue) => (
                          <li key={cue}>• {cue}</li>
                        ))}
                      </ul>
                    </InfoCard>
                  )}
                  {commonMistakes.length > 0 && (
                    <InfoCard title="Erros comuns" tone="warning">
                      <ul className="space-y-1 text-sm">
                        {commonMistakes.map((mistake) => (
                          <li key={mistake}>• {mistake}</li>
                        ))}
                      </ul>
                    </InfoCard>
                  )}
                  {exercise.notes && (
                    <InfoCard title="Nota do treinador" tone="violet">
                      {exercise.notes}
                    </InfoCard>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {substitutionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl border border-white/10 bg-surface-1 p-5 shadow-2xl"
            >
              <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-accent-sky">Substituir exercício</p>
                  <h3 className="mt-1 text-lg font-bold leading-tight text-white">{exercise.exerciseName}</h3>
                </div>
                <button
                  onClick={() => setSubstitutionModalOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent-sky/20 bg-accent-sky/10 p-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" />
                  <p className="text-xs font-medium leading-relaxed text-accent-sky">
                    Estas substituições foram pré-aprovadas no seu plano e mantêm musculatura e estímulo próximos do exercício original.
                  </p>
                </div>

                <div className="space-y-3 pb-4">
                  {exercise.substitutionOptions?.map((alternative, index) => (
                    <button
                      key={`${alternative.exerciseId}-${index}`}
                      onClick={() => handleSubstitute(alternative)}
                      className="group flex w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-accent-lime/40"
                    >
                      <div className="mb-3 flex w-full justify-between">
                        <div>
                          <p className="text-sm font-bold text-white transition-colors group-hover:text-accent-lime">{alternative.exerciseName}</p>
                          <div className="mt-2 flex gap-2">
                            {alternative.muscleGroups?.slice(0, 2).map((muscleGroup) => (
                              <Badge key={muscleGroup} color="lime" className="px-2.5 py-1 text-xs uppercase">
                                {muscleGroup}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {alternative.videoUrl && <PlayCircle className="h-5 w-5 text-accent-sky opacity-70" />}
                      </div>

                      {alternative.equipment && (
                        <div className="mt-2 text-xs font-medium text-text-muted">
                          Equipamento: <span className="text-white">{alternative.equipment}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="ec-card rounded-2xl p-4 text-center">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-text-muted">
        {icon}
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-display text-xl font-black italic text-white">{value}</p>
    </div>
  )
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function ProgressionCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: ReactNode
  label: string
  value: string
  caption: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{caption}</p>
    </div>
  )
}

function InfoCard({
  title,
  children,
  tone,
}: {
  title: string
  children: ReactNode
  tone: 'sky' | 'lime' | 'warning' | 'violet'
}) {
  const tones = {
    sky: 'border-accent-sky/20 bg-accent-sky/10 text-accent-sky',
    lime: 'border-accent-lime/20 bg-accent-lime/10 text-accent-lime',
    warning: 'border-accent-yellow/20 bg-accent-yellow/10 text-accent-yellow',
    violet: 'border-ec-violet/20 bg-ec-violet/10 text-ec-violet',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${tones}`}>
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-white">{children}</div>
    </div>
  )
}
