import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Dumbbell, UtensilsCrossed, Crown, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { workoutService } from '../../services/workoutService'
import { dietService } from '../../services/dietService'
import { adminPrescriptionService } from '../../services/adminPrescriptionService'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { cx } from '../../components/v2/ExpertClubV2Base'
import type { Workout, Diet } from '../../types/domain'
import type { PrescriptionAssignment } from '../../types/prescription.types'

interface Props {
  studentId: string
  studentName: string
  onClose: () => void
}

type Tab = 'workout' | 'diet'

function fromTimestamp(ts: any): string {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return ''
  }
}

export function PrescriptionDrawer({ studentId, studentName, onClose }: Props) {
  const { firebaseUser, user } = useAuth()
  const [tab, setTab] = useState<Tab>('workout')
  const [search, setSearch] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [diets, setDiets] = useState<Diet[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [activeWorkout, setActiveWorkout] = useState<PrescriptionAssignment | null>(null)
  const [activeDiet, setActiveDiet] = useState<PrescriptionAssignment | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    setLoadingTemplates(true)
    Promise.all([
      workoutService.getAllPublished(),
      dietService.getAllPublished(),
      adminPrescriptionService.getActiveAssignment(studentId, 'workout'),
      adminPrescriptionService.getActiveAssignment(studentId, 'diet'),
    ]).then(([ws, ds, aw, ad]) => {
      setWorkouts(ws)
      setDiets(ds)
      setActiveWorkout(aw)
      setActiveDiet(ad)
    }).catch(console.error).finally(() => setLoadingTemplates(false))
  }, [studentId])

  const filteredWorkouts = useMemo(
    () => workouts.filter(w => w.title.toLowerCase().includes(search.toLowerCase())),
    [workouts, search],
  )

  const filteredDiets = useMemo(
    () => diets.filter(d => d.title.toLowerCase().includes(search.toLowerCase())),
    [diets, search],
  )

  async function assignWorkout(workoutId: string) {
    if (!firebaseUser) return
    setAssigning(workoutId)
    try {
      await adminPrescriptionService.assignWorkoutToStudent({
        studentId,
        workoutId,
        adminUid: firebaseUser.uid,
        adminEmail: firebaseUser.email ?? '',
        adminName: user?.displayName ?? firebaseUser.email ?? '',
      })
      const updated = await adminPrescriptionService.getActiveAssignment(studentId, 'workout')
      setActiveWorkout(updated)
      toastSuccess(`Treino prescrito para ${studentName}`)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao prescrever treino.')
    } finally {
      setAssigning(null)
    }
  }

  async function assignDiet(dietId: string) {
    if (!firebaseUser) return
    setAssigning(dietId)
    try {
      await adminPrescriptionService.assignDietToStudent({
        studentId,
        dietId,
        adminUid: firebaseUser.uid,
        adminEmail: firebaseUser.email ?? '',
        adminName: user?.displayName ?? firebaseUser.email ?? '',
      })
      const updated = await adminPrescriptionService.getActiveAssignment(studentId, 'diet')
      setActiveDiet(updated)
      toastSuccess(`Dieta prescrita para ${studentName}`)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao prescrever dieta.')
    } finally {
      setAssigning(null)
    }
  }

  const activeAssignment = tab === 'workout' ? activeWorkout : activeDiet

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 inset-y-0 z-[71] w-full max-w-md bg-surface-1 border-l border-white/[0.08] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet">Prescrição</p>
            <h2 className="text-base font-black italic text-white uppercase">{studentName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active prescription banner */}
        <AnimatePresence mode="wait">
          {activeAssignment && (
            <motion.div
              key={activeAssignment.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mt-4 rounded-2xl border border-accent-lime/20 bg-accent-lime/5 p-3 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-accent-lime/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="w-3.5 h-3.5 text-accent-lime" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">
                  {tab === 'workout' ? 'Treino atual' : 'Dieta atual'}
                </p>
                <p className="text-sm font-bold text-white truncate">{activeAssignment.templateTitle}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  por {activeAssignment.assignedByName} · {fromTimestamp(activeAssignment.assignedAt)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mx-4 mt-4 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {(['workout', 'diet'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch('') }}
              className={cx(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                tab === t
                  ? 'bg-ec-violet text-white shadow-[0_4px_16px_rgba(91,75,255,0.3)]'
                  : 'text-text-muted hover:text-white',
              )}
            >
              {t === 'workout' ? <Dumbbell className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
              {t === 'workout' ? 'Treino' : 'Dieta'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mx-4 mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={tab === 'workout' ? 'Buscar treino...' : 'Buscar dieta...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-ec-violet placeholder:text-text-muted"
          />
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loadingTemplates ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-ec-violet animate-spin" />
            </div>
          ) : tab === 'workout' ? (
            filteredWorkouts.map(w => (
              <WorkoutRow
                key={w.id}
                workout={w}
                isActive={activeWorkout?.templateId === w.id}
                isAssigning={assigning === w.id}
                onAssign={() => assignWorkout(w.id)}
              />
            ))
          ) : (
            filteredDiets.map(d => (
              <DietRow
                key={d.id}
                diet={d}
                isActive={activeDiet?.templateId === d.id}
                isAssigning={assigning === d.id}
                onAssign={() => assignDiet(d.id)}
              />
            ))
          )}
          {!loadingTemplates && tab === 'workout' && filteredWorkouts.length === 0 && (
            <p className="text-text-muted text-sm text-center py-10">Nenhum treino publicado.</p>
          )}
          {!loadingTemplates && tab === 'diet' && filteredDiets.length === 0 && (
            <p className="text-text-muted text-sm text-center py-10">Nenhuma dieta publicada.</p>
          )}
        </div>
      </motion.div>
    </>
  )
}

function WorkoutRow({ workout, isActive, isAssigning, onAssign }: {
  workout: Workout
  isActive: boolean
  isAssigning: boolean
  onAssign: () => void
}) {
  return (
    <button
      onClick={onAssign}
      disabled={isAssigning || isActive}
      className={cx(
        'w-full flex items-center gap-3 rounded-2xl border p-3 transition-all text-left',
        isActive
          ? 'border-accent-lime/30 bg-accent-lime/5 cursor-default'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-ec-violet/40 hover:bg-ec-violet/5 active:scale-[0.98]',
      )}
    >
      <div className={cx(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        isActive ? 'bg-accent-lime/15 text-accent-lime' : 'bg-ec-violet/10 text-ec-violet',
      )}>
        {isActive ? <Check className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{workout.title}</p>
        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
          {workout.goal} · {workout.level} · {workout.daysPerWeek}x/sem
        </p>
      </div>
      {isAssigning ? (
        <Loader2 className="w-4 h-4 text-ec-violet animate-spin flex-shrink-0" />
      ) : isActive ? (
        <span className="text-[9px] font-black uppercase tracking-widest text-accent-lime bg-accent-lime/10 px-2 py-0.5 rounded-full">Ativo</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      )}
    </button>
  )
}

function DietRow({ diet, isActive, isAssigning, onAssign }: {
  diet: Diet
  isActive: boolean
  isAssigning: boolean
  onAssign: () => void
}) {
  return (
    <button
      onClick={onAssign}
      disabled={isAssigning || isActive}
      className={cx(
        'w-full flex items-center gap-3 rounded-2xl border p-3 transition-all text-left',
        isActive
          ? 'border-accent-lime/30 bg-accent-lime/5 cursor-default'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-ec-violet/40 hover:bg-ec-violet/5 active:scale-[0.98]',
      )}
    >
      <div className={cx(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        isActive ? 'bg-accent-lime/15 text-accent-lime' : 'bg-ec-violet/10 text-ec-violet',
      )}>
        {isActive ? <Check className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{diet.title}</p>
        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
          {diet.goal} · {diet.calories} kcal · {diet.mealsPerDay} refeições
        </p>
      </div>
      {isAssigning ? (
        <Loader2 className="w-4 h-4 text-ec-violet animate-spin flex-shrink-0" />
      ) : isActive ? (
        <span className="text-[9px] font-black uppercase tracking-widest text-accent-lime bg-accent-lime/10 px-2 py-0.5 rounded-full">Ativo</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      )}
    </button>
  )
}
