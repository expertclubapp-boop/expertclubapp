import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Timer, ArrowLeft, ArrowRight, X,
  SkipForward, Plus, Pause, PlayCircle, AlertTriangle,
  Trophy, Share2, TrendingUp, Dumbbell, Zap, Clock, RefreshCw
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkoutSession } from '../../hooks/useWorkoutSession'
import { useWorkout } from '../../hooks/useWorkouts'
import { workoutSessionService } from '../../services/workoutSessionService'
import type { SetLog, WorkoutPR, WorkoutExercise } from '../../types/domain'

type ScreenPhase = 'workout' | 'completion'

export function WorkoutExecutionScreen() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { session, isLoading: sessionLoading } = useWorkoutSession(sessionId)
  const { workout, isLoading: workoutLoading } = useWorkout(session?.workoutId)

  const currentDay = useMemo(() => workout?.days.find(d => d.id === session?.dayId), [workout, session])

  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isRestActive, setIsRestActive] = useState(false)
  const [isRestPaused, setIsRestPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [phase, setPhase] = useState<ScreenPhase>('workout')
  const [setInputs, setSetInputs] = useState<Record<string, { reps: string; load: string }>>({})
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [completionPrs, setCompletionPrs] = useState<WorkoutPR[]>([])
  const [volumeDeltaPct, setVolumeDeltaPct] = useState<number | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false)
  const lastInteraction = useRef(Date.now())

  const originalExercise = currentDay?.exercises[currentExerciseIdx]
  const exercise = originalExercise ? (session?.substitutions?.[originalExercise.id] || originalExercise) : undefined
  const progress = currentDay ? Math.round(((currentExerciseIdx) / currentDay.exercises.length) * 100) : 0

  const startedAtMs = useMemo(() => {
    const raw = session?.startedAt as any
    if (!raw) return Date.now()
    if (typeof raw === 'string') return new Date(raw).getTime()
    if (typeof raw?.toDate === 'function') return raw.toDate().getTime()
    return Date.now()
  }, [session?.startedAt])

  // Total workout timer persisted from startedAt
  useEffect(() => {
    if (phase !== 'workout') return
    const tick = () => setTotalSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [phase, startedAtMs])

  // Rest countdown
  useEffect(() => {
    if (!isRestActive || isRestPaused || restTimer <= 0) return
    const interval = setInterval(() => {
      setRestTimer(t => {
        if (t <= 1) {
          setIsRestActive(false)
          // Vibrate if available
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestActive, isRestPaused, restTimer])

  // Inactivity detection
  useEffect(() => {
    if (phase !== 'workout') return
    const check = setInterval(() => {
      const idle = Date.now() - lastInteraction.current
      if (idle > 10 * 60 * 1000 && !showInactivityWarning) {
        setShowInactivityWarning(true)
        if (firebaseUser && sessionId) {
          workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
            inactiveWarningShownAt: new Date().toISOString(),
            lastInteractionAt: new Date(lastInteraction.current).toISOString(),
          }).catch(() => {})
        }
      }
      if (idle > 20 * 60 * 1000 && firebaseUser && sessionId) {
        workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
          status: 'inactive',
          lastInteractionAt: new Date(lastInteraction.current).toISOString(),
        }).catch(() => {})
      }
    }, 30000)
    return () => clearInterval(check)
  }, [phase, showInactivityWarning, firebaseUser, sessionId])

  const touchInteraction = useCallback(() => {
    lastInteraction.current = Date.now()
    setShowInactivityWarning(false)
    if (firebaseUser && sessionId) {
      workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
        status: 'active',
        lastInteractionAt: new Date().toISOString(),
      }).catch(() => {})
    }
  }, [firebaseUser, sessionId])

  // --- Computed stats ---
  const logs = session?.logs || []
  const totalTonnage = logs.reduce((sum, l) => sum + l.loadKg * l.reps, 0)
  const completedExerciseIds = new Set(logs.map(l => l.exerciseId))
  const totalSetsCompleted = logs.length
  const bestExercise = useMemo(() => {
    const volumes = new Map<string, number>()
    logs.forEach(log => volumes.set(log.exerciseId, (volumes.get(log.exerciseId) || 0) + log.loadKg * log.reps))
    const best = [...volumes.entries()].sort((a, b) => b[1] - a[1])[0]
    return best ? currentDay?.exercises.find(ex => ex.id === best[0])?.exerciseName : null
  }, [logs, currentDay])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (sessionLoading || workoutLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentDay || !session) return <div className="p-10 text-center text-text-muted">Sessão não encontrada</div>

  // ============ COMPLETION SCREEN ============
  if (phase === 'completion') {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
            <div className="w-24 h-24 rounded-full bg-accent-lime/20 flex items-center justify-center mb-8 mx-auto ring-4 ring-accent-lime/10">
              <Trophy className="w-12 h-12 text-accent-lime" />
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-display text-3xl sm:text-4xl text-white uppercase italic font-black mb-2 tracking-tight"
          >
            Treino Finalizado!
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-text-muted text-sm mb-10 max-w-sm"
          >
            Boa. Você registrou mais um treino. É isso que constrói constância.
          </motion.p>

          {/* Stats Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3 w-full max-w-sm mb-10"
          >
            <StatCard icon={<Clock className="w-4 h-4" />} label="Duração" value={formatTime(totalSeconds)} />
            <StatCard icon={<Dumbbell className="w-4 h-4" />} label="Exercícios" value={`${completedExerciseIds.size}/${currentDay.exercises.length}`} />
            <StatCard icon={<Zap className="w-4 h-4" />} label="Séries" value={totalSetsCompleted.toString()} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Tonelagem" value={`${(totalTonnage / 1000).toFixed(1)}t`} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="w-full max-w-sm mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Resumo</p>
            <p className="mt-2 text-sm text-white">
              Tempo de treino: {formatTime(totalSeconds)}. {bestExercise ? `Melhor exercício: ${bestExercise}.` : 'Este é seu primeiro registro desse treino.'}
            </p>
            {volumeDeltaPct !== null && (
              <p className="mt-2 text-sm font-bold text-accent-lime">
                Você fez {volumeDeltaPct >= 0 ? '+' : ''}{volumeDeltaPct}% de volume contra a última sessão.
              </p>
            )}
            {completionPrs.length > 0 ? (
              <div className="mt-3 space-y-1">
                {completionPrs.slice(0, 3).map(pr => (
                  <p key={`${pr.exerciseId}-${pr.type}`} className="text-xs text-accent-lime">
                    Novo PR em {pr.exerciseName}: {pr.type === 'load' ? `${pr.value}kg` : pr.type === 'reps' ? `${pr.value} reps` : `${pr.value}kg de volume`}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-text-muted">PRs aparecerão aqui conforme você registrar cargas e repetições.</p>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 w-full max-w-sm"
          >
            <Button variant="primary" className="w-full py-5" icon={<Share2 className="w-5 h-5" />}
              onClick={() => {
                const text = `🏋️ Treino finalizado!\n⏱ ${formatTime(totalSeconds)}\n💪 ${totalSetsCompleted} séries\n🔥 ${(totalTonnage / 1000).toFixed(1)}t de volume\n\n#ExpertClub`
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Resultado copiado!')
                }
              }}
            >
              Compartilhar
            </Button>
            <Button variant="ghost" className="w-full py-5 border-subtle" onClick={() => navigate('/app/evolution')}>
              Ver Evolução
            </Button>
            <Button variant="ghost" className="w-full py-4 text-text-muted" onClick={() => navigate('/app/today')}>
              Voltar para Hoje
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ============ WORKOUT SCREEN ============
  if (!exercise) return <div className="p-10 text-center text-text-muted">Exercício não encontrado</div>

  const handleSetComplete = async (setNumber: number) => {
    if (!firebaseUser || !sessionId) return
    touchInteraction()

    const key = `${exercise.id}-${setNumber}`
    const input = setInputs[key]
    const reps = parseInt(input?.reps || exercise.reps) || 0
    const load = parseFloat(input?.load || '0') || 0

    const newLog: SetLog = { exerciseId: exercise.id, setNumber, reps, loadKg: load, rpe: 8 }
    const updatedLogs = [...(session.logs || []), newLog]

    try {
      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, { logs: updatedLogs })
      setRestTimer(exercise.restSeconds)
      setIsRestActive(true)
      setIsRestPaused(false)
    } catch (error) {
      console.error('Error updating session logs:', error)
    }
  }

  const handleSubstitute = async (alternative: any) => {
    if (!firebaseUser || !sessionId || !originalExercise) return
    touchInteraction()
    
    const updatedSubstitutions = {
      ...(session.substitutions || {}),
      [originalExercise.id]: {
        ...originalExercise,
        exerciseId: alternative.exerciseId,
        exerciseName: alternative.exerciseName,
        muscleGroups: alternative.muscleGroups || originalExercise.muscleGroups,
        equipment: alternative.equipment || originalExercise.equipment,
        videoUrl: alternative.videoUrl || originalExercise.videoUrl,
        instructions: alternative.instructions || originalExercise.instructions,
      } as WorkoutExercise
    }

    try {
      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, { substitutions: updatedSubstitutions })
      setSubstitutionModalOpen(false)
    } catch (error) {
      console.error('Error substituting exercise:', error)
    }
  }

  const handleFinish = async () => {
    if (!firebaseUser || !sessionId) return
    try {
      const recent = await workoutSessionService.getRecentSessions(firebaseUser.uid, 30)
      const previous = recent.find(item => item.id !== sessionId && item.workoutId === session.workoutId && item.status === 'completed')
      const previousLogs = previous?.logs || []
      const prs: WorkoutPR[] = []

      for (const log of logs) {
        const exerciseName = currentDay.exercises.find(item => item.id === log.exerciseId)?.exerciseName || 'exercício'
        const previousForExercise = previousLogs.filter(item => item.exerciseId === log.exerciseId)
        const previousLoad = Math.max(0, ...previousForExercise.map(item => item.loadKg || 0))
        const previousReps = Math.max(0, ...previousForExercise.map(item => item.reps || 0))
        const previousVolume = Math.max(0, ...previousForExercise.map(item => (item.loadKg || 0) * (item.reps || 0)))
        const currentVolume = log.loadKg * log.reps
        if (log.loadKg > previousLoad) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'load', value: log.loadKg, previousValue: previousLoad || undefined })
        if (log.reps > previousReps) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'reps', value: log.reps, previousValue: previousReps || undefined })
        if (currentVolume > previousVolume) prs.push({ exerciseId: log.exerciseId, exerciseName, type: 'volume', value: currentVolume, previousValue: previousVolume || undefined })
      }
      const previousTonnage = previousLogs.reduce((sum, item) => sum + item.loadKg * item.reps, 0)
      setCompletionPrs(prs)
      setVolumeDeltaPct(previousTonnage > 0 ? Math.round(((totalTonnage - previousTonnage) / previousTonnage) * 100) : null)
      await workoutSessionService.updateSession(firebaseUser.uid, sessionId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationSeconds: totalSeconds,
        lastInteractionAt: new Date().toISOString(),
        totalTonnageKg: totalTonnage,
        exercisesCompleted: completedExerciseIds.size,
        totalSets: totalSetsCompleted,
        prs,
        xpEarned: 150,
      })
      setPhase('completion')
    } catch (error) {
      console.error('Error finishing session:', error)
    }
  }

  const getInputKey = (exId: string, setNum: number) => `${exId}-${setNum}`
  const getInput = (exId: string, setNum: number) => setInputs[getInputKey(exId, setNum)] || { reps: '', load: '' }
  const updateInput = (exId: string, setNum: number, field: 'reps' | 'load', val: string) => {
    touchInteraction()
    setSetInputs(prev => ({
      ...prev,
      [getInputKey(exId, setNum)]: { ...getInput(exId, setNum), [field]: val },
    }))
  }

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary text-text-primary pb-40" onClick={touchInteraction}>
      {/* Inactivity Warning */}
      <AnimatePresence>
        {showInactivityWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center px-6"
          >
            <div className="ec-card rounded-3xl p-8 max-w-sm w-full text-center">
              <AlertTriangle className="w-12 h-12 text-accent-yellow mx-auto mb-4" />
              <h2 className="font-display text-xl text-white uppercase italic font-black mb-2">Seu treino está aberto</h2>
              <p className="text-text-muted text-sm mb-6">Você ainda está treinando?</p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full py-4" onClick={() => { touchInteraction() }}>Sim, continuar</Button>
                <Button variant="ghost" className="w-full py-4 border-subtle" onClick={handleFinish}>Finalizar treino</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-4xl items-center justify-between rounded-2xl px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          {/* Total Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-lime" />
            <span className="font-display text-lg font-black text-white tabular-nums">{formatTime(totalSeconds)}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress */}
      <section className="mx-auto max-w-4xl px-5 pt-4 pb-3">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="font-display text-xl uppercase italic leading-tight font-bold">{currentDay.name}</h2>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Exercício {currentExerciseIdx + 1} de {currentDay.exercises.length}</p>
          </div>
          <span className="text-accent-lime font-display font-bold italic">{progress}%</span>
        </div>
        <ProgressBar value={progress} color="lime" />
      </section>

      <main className="mx-auto max-w-4xl px-5 space-y-4">
        {/* Exercise Card */}
        <AnimatePresence mode="wait">
          <motion.div key={exercise.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="ec-card rounded-2xl overflow-hidden"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {session?.substitutions?.[originalExercise!.id] && (
                    <div className="inline-flex items-center gap-1 bg-accent-sky/10 px-2 py-0.5 rounded-full mb-2">
                      <Zap className="w-3 h-3 text-accent-sky" />
                      <span className="text-[9px] font-bold text-accent-sky uppercase tracking-widest">Substituído</span>
                    </div>
                  )}
                  <h2 className="font-display text-xl text-text-primary mb-2 uppercase italic leading-tight font-bold">{exercise.exerciseName}</h2>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {exercise.muscleGroups.map(mg => (
                      <Badge key={mg} color="lime" className="text-[9px] uppercase">{mg}</Badge>
                    ))}
                    {exercise.equipment && <Badge color="violet" className="text-[9px] uppercase">{exercise.equipment}</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      className={`text-xs py-2 px-4 ${exercise.videoUrl || exercise.instructions ? 'border-accent-sky/30 text-accent-sky hover:bg-accent-sky/10' : 'border-white/10 text-text-muted opacity-50'}`}
                      icon={<PlayCircle className="w-4 h-4" />}
                      onClick={() => (exercise.videoUrl || exercise.instructions) && setVideoModalOpen(true)}
                      disabled={!exercise.videoUrl && !exercise.instructions}
                    >
                      Instruções
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className={`text-xs py-2 px-4 ${exercise.substitutionOptions?.length ? 'border-subtle text-white' : 'border-white/10 text-text-muted opacity-50'}`}
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => exercise.substitutionOptions?.length && setSubstitutionModalOpen(true)}
                      disabled={!exercise.substitutionOptions?.length}
                    >
                      Substituir
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sets */}
              <div className="space-y-2.5 mt-4">
                <div className="grid grid-cols-12 gap-2 text-text-muted text-[9px] font-black uppercase tracking-widest px-1">
                  <div className="col-span-2">Série</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-4 text-center">Kg</div>
                  <div className="col-span-3 text-right pr-2">OK</div>
                </div>

                {Array.from({ length: exercise.sets }).map((_, i) => {
                  const setNum = i + 1
                  const isDone = session.logs?.some(l => l.exerciseId === exercise.id && l.setNumber === setNum)
                  const prevDone = i === 0 || session.logs?.some(l => l.exerciseId === exercise.id && l.setNumber === i)
                  const isActive = !isDone && prevDone
                  const inp = getInput(exercise.id, setNum)

                  return (
                    <div key={setNum}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                        isActive ? 'bg-accent-lime/5 border-accent-lime/30 ring-1 ring-accent-lime/20' :
                        isDone ? 'bg-white/[0.03] border-white/[0.05]' : 'opacity-40 border-transparent'
                      }`}
                    >
                      <div className={`col-span-2 font-display text-center font-bold ${isActive ? 'text-accent-lime text-lg italic' : 'text-text-muted'}`}>
                        {setNum}
                      </div>
                      <div className="col-span-3">
                        <input
                          className="ec-input w-full rounded-lg text-center font-bold text-text-primary py-2.5 outline-none text-sm"
                          placeholder={exercise.reps}
                          type="number"
                          inputMode="numeric"
                          value={inp.reps}
                          onChange={e => updateInput(exercise.id, setNum, 'reps', e.target.value)}
                          disabled={isDone || !isActive}
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          className="ec-input w-full rounded-lg text-center font-bold text-text-primary py-2.5 outline-none text-sm"
                          placeholder="--"
                          type="number"
                          inputMode="decimal"
                          value={inp.load}
                          onChange={e => updateInput(exercise.id, setNum, 'load', e.target.value)}
                          disabled={isDone || !isActive}
                        />
                      </div>
                      <div className="col-span-3 flex justify-end px-1">
                        <button
                          onClick={() => isActive && handleSetComplete(setNum)}
                          disabled={!isActive}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                            isDone ? 'bg-accent-lime border-accent-lime text-bg-primary' :
                            isActive ? 'border-accent-lime hover:bg-accent-lime/20' : 'border-white/10'
                          }`}
                        >
                          {isDone && <Check className="w-4 h-4 font-black" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Rest Timer V2 */}
        <div className={`ec-card rounded-2xl p-5 transition-all ${isRestActive ? 'ring-1 ring-accent-sky/30 bg-accent-sky/[0.03]' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Timer className={`w-6 h-6 ${isRestActive ? 'text-accent-sky animate-pulse' : 'text-text-muted'}`} />
              <div>
                <p className="text-sm font-bold text-white">Descanso</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Meta: {exercise.restSeconds}s</p>
              </div>
            </div>
            <span className={`text-3xl font-display font-black tabular-nums italic ${isRestActive ? 'text-accent-sky' : 'text-text-muted/40'}`}>
              {formatTime(restTimer)}
            </span>
          </div>

          {isRestActive && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => setIsRestPaused(p => !p)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95"
              >
                {isRestPaused ? <PlayCircle className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isRestPaused ? 'Retomar' : 'Pausar'}
              </button>
              <button onClick={() => setRestTimer(t => t + 30)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> 30s
              </button>
              <button onClick={() => { setRestTimer(0); setIsRestActive(false) }}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-accent-lime/10 border border-accent-lime/20 text-sm font-bold text-accent-lime hover:bg-accent-lime/20 transition-all active:scale-95"
              >
                <SkipForward className="w-4 h-4" /> Pular
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border-subtle py-5" disabled={currentExerciseIdx === 0}
            onClick={() => { setCurrentExerciseIdx(i => i - 1); touchInteraction() }}
            icon={<ArrowLeft className="w-5 h-5" />}
          >
            Anterior
          </Button>

          {currentExerciseIdx < currentDay.exercises.length - 1 ? (
            <Button variant="ghost" className="flex-1 bg-surface-1 py-5"
              onClick={() => { setCurrentExerciseIdx(i => i + 1); touchInteraction() }}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Próximo
            </Button>
          ) : (
            <Button variant="primary" className="flex-1 py-5" onClick={handleFinish} icon={<Check className="w-5 h-5" />}>
              Finalizar
            </Button>
          )}
        </div>
      </main>

      {/* Video Modal */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <div className="ec-card rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col relative">
              <button onClick={() => setVideoModalOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
              
              {exercise.videoUrl ? (
                <div className="aspect-video bg-black w-full relative">
                  <iframe 
                    src={exercise.videoUrl.replace('watch?v=', 'embed/')} 
                    className="w-full h-full absolute inset-0" 
                    allowFullScreen 
                    title="Vídeo de execução"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-black/50 w-full flex flex-col items-center justify-center text-text-muted">
                  <PlayCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-display uppercase italic font-bold">Sem vídeo disponível</p>
                </div>
              )}
              
              <div className="p-6 overflow-y-auto">
                <h3 className="font-display text-xl text-white uppercase italic font-bold mb-4">{exercise.exerciseName}</h3>
                
                {exercise.instructions && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-ec-violet uppercase tracking-widest mb-2">Instruções de Execução</p>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{exercise.instructions}</p>
                  </div>
                )}
                
                {exercise.notes && (
                  <div className="bg-accent-sky/10 border border-accent-sky/20 rounded-xl p-4">
                    <p className="text-[10px] font-black text-accent-sky uppercase tracking-widest mb-1">Dica do Mentor</p>
                    <p className="text-sm text-accent-sky/90">{exercise.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Substitution Modal */}
      <AnimatePresence>
        {substitutionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-1 p-5 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="mb-4 flex items-start justify-between gap-4 shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-sky">Substituir Exercício</p>
                  <h3 className="mt-1 text-lg font-bold text-white leading-tight">{exercise.exerciseName}</h3>
                </div>
                <button
                  onClick={() => setSubstitutionModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2">
                <div className="bg-accent-sky/10 border border-accent-sky/20 rounded-xl p-3 mb-4 flex gap-3 items-start">
                  <Check className="w-4 h-4 text-accent-sky shrink-0 mt-0.5" />
                  <p className="text-xs text-accent-sky font-medium leading-relaxed">Estas substituições foram pré-aprovadas no seu plano e trabalham a mesma musculatura alvo com estímulos semelhantes.</p>
                </div>

                <div className="space-y-3 pb-4">
                  {exercise.substitutionOptions?.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubstitute(alt)}
                      className="flex w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-accent-lime/40 transition-colors group"
                    >
                      <div className="flex justify-between w-full mb-3">
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-accent-lime transition-colors">{alt.exerciseName}</p>
                          <div className="flex gap-2 mt-2">
                            {alt.muscleGroups?.slice(0, 2).map(mg => <Badge key={mg} color="lime" className="text-[9px] uppercase">{mg}</Badge>)}
                          </div>
                        </div>
                        {alt.videoUrl && <PlayCircle className="w-5 h-5 text-accent-sky opacity-70" />}
                      </div>
                      
                      {alt.equipment && (
                        <div className="mt-2 text-xs text-text-muted font-medium">
                          Equipamento: <span className="text-white">{alt.equipment}</span>
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="ec-card rounded-2xl p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2 text-text-muted">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
      <p className="font-display text-xl font-black text-white italic">{value}</p>
    </div>
  )
}
