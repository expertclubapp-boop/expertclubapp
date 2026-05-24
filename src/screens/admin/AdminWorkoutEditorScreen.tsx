import { useState, useEffect, useRef } from 'react'
import { toastError } from '../../components/ui/Toast'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Search, Copy, ArrowUp, ArrowDown, Dumbbell, ExternalLink, Zap, ChevronDown, LayoutList, X } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminToolbar, Field, TextInput, TextArea, ConfirmButton } from './AdminShared'
import { workoutService } from '../../services/workoutService'
import { exerciseService } from '../../services/exerciseService'
import { sanitizeTags } from '../../services/adminCrudService'
import { BUILT_IN_TECHNIQUES } from '../../data/workoutTechniques'
import { presetsService } from '../../services/presetsService'
import type {
  Exercise,
  Workout,
  WorkoutDay,
  WorkoutEquipmentProfile,
  WorkoutExercise,
  WorkoutRecommendationGoal,
  WorkoutRecommendationMetadata,
  WorkoutTechnique,
  SeriesPreset,
} from '../../types/domain'

const WORKOUT_GOAL_OPTIONS: Array<{ value: WorkoutRecommendationGoal; label: string }> = [
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'fat_loss', label: 'Emagrecimento' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'performance', label: 'Performance' },
  { value: 'strength', label: 'Força' },
]

const WORKOUT_SEX_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'unisex', label: 'Unissex' },
] as const

const WORKOUT_FREQUENCY_OPTIONS = [3, 4, 5, 6] as const
const WORKOUT_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
] as const

const WORKOUT_LOCATION_OPTIONS = [
  { value: 'gym', label: 'Academia' },
  { value: 'home', label: 'Casa' },
  { value: 'mixed', label: 'Misto' },
] as const

const EQUIPMENT_PROFILE_OPTIONS: Array<{ value: WorkoutEquipmentProfile; label: string }> = [
  { value: 'full_gym', label: 'Academia completa' },
  { value: 'basic_gym', label: 'Academia básica' },
  { value: 'dumbbells', label: 'Halteres' },
  { value: 'bodyweight', label: 'Peso corporal' },
  { value: 'mixed', label: 'Misto' },
]

// ─── Muscle group chips ──────────────────────────────────────
const MUSCLE_GROUPS = [
  { id: 'peito', label: 'Peito', match: ['peito', 'peitoral', 'chest', 'pecs'] },
  { id: 'costas', label: 'Costas', match: ['costas', 'back', 'dorsal', 'lat', 'trapézio', 'trapezio'] },
  { id: 'ombro', label: 'Ombro', match: ['ombro', 'deltóide', 'deltoide', 'shoulder'] },
  { id: 'biceps', label: 'Bíceps', match: ['bíceps', 'biceps', 'bicep'] },
  { id: 'triceps', label: 'Tríceps', match: ['tríceps', 'triceps', 'tricep'] },
  { id: 'pernas', label: 'Pernas', match: ['pernas', 'quadríceps', 'quadriceps', 'femoral', 'glúteo', 'gluteo', 'leg', 'panturrilha'] },
  { id: 'core', label: 'Core', match: ['core', 'abdômen', 'abdomen', 'abdominal', 'lombar'] },
  { id: 'cardio', label: 'Cardio', match: ['cardio'] },
]

// ─── Parameter presets ────────────────────────────────────────
const PARAM_PRESETS = [
  { id: 'hypertrophy', label: 'Hipertrofia', sets: 4, reps: '8-12', rest: 75 },
  { id: 'strength',    label: 'Força',       sets: 5, reps: '3-6',  rest: 180 },
  { id: 'endurance',   label: 'Resistência', sets: 3, reps: '15-20', rest: 40 },
  { id: 'power',       label: 'Potência',    sets: 4, reps: '4-6',  rest: 120 },
] as const

// ─── Protocol templates ──────────────────────────────────────
const PROTOCOL_TEMPLATES: Array<{
  id: string
  label: string
  days: Array<{ name: string; focus: string }>
}> = [
  {
    id: 'abc',
    label: 'ABC (3x)',
    days: [
      { name: 'Dia A', focus: 'Peito e Ombro' },
      { name: 'Dia B', focus: 'Costas e Bíceps' },
      { name: 'Dia C', focus: 'Pernas e Tríceps' },
    ],
  },
  {
    id: 'ppl',
    label: 'PPL (6x)',
    days: [
      { name: 'Push 1', focus: 'Peito, Ombro, Tríceps' },
      { name: 'Pull 1', focus: 'Costas e Bíceps' },
      { name: 'Leg 1',  focus: 'Pernas e Glúteo' },
      { name: 'Push 2', focus: 'Peito, Ombro, Tríceps' },
      { name: 'Pull 2', focus: 'Costas e Bíceps' },
      { name: 'Leg 2',  focus: 'Pernas e Glúteo' },
    ],
  },
  {
    id: 'upper_lower',
    label: 'Upper/Lower',
    days: [
      { name: 'Upper A', focus: 'Peito, Costas, Ombro' },
      { name: 'Lower A', focus: 'Pernas e Glúteo' },
      { name: 'Upper B', focus: 'Bíceps, Tríceps, Costas' },
      { name: 'Lower B', focus: 'Pernas, Panturrilha' },
    ],
  },
  {
    id: 'full_body',
    label: 'Full Body 3x',
    days: [
      { name: 'Full Body A', focus: 'Peito, Costas, Pernas' },
      { name: 'Full Body B', focus: 'Ombro, Costas, Pernas' },
      { name: 'Full Body C', focus: 'Peito, Glúteo, Core' },
    ],
  },
  {
    id: 'ab',
    label: 'A/B (4x)',
    days: [
      { name: 'Dia A', focus: 'Peito, Ombro, Tríceps' },
      { name: 'Dia B', focus: 'Costas, Bíceps, Pernas' },
    ],
  },
]

const emptyWorkout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> = {
  title: '',
  description: '',
  goal: 'hypertrophy',
  modality: 'bodybuilding',
  level: 'beginner',
  daysPerWeek: 0,
  durationMinutes: 60,
  focus: [],
  tags: [],
  recommendationMetadata: {
    goals: ['hypertrophy'],
    sexes: ['unisex'],
    frequencies: [3],
    levels: ['beginner'],
    locations: ['gym'],
    equipmentProfile: 'full_gym',
    tags: [],
  },
  days: [],
  status: 'draft',
  version: 1
}

function toggleStringOption<T extends string>(list: T[] | undefined, value: T): T[] {
  const current = list || []
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function ensureWorkoutMetadata(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): WorkoutRecommendationMetadata {
  return {
    goals: workout.recommendationMetadata?.goals?.length ? workout.recommendationMetadata.goals : [],
    sexes: workout.recommendationMetadata?.sexes?.length ? workout.recommendationMetadata.sexes : ['unisex'],
    frequencies: workout.recommendationMetadata?.frequencies?.length ? workout.recommendationMetadata.frequencies : [],
    levels: workout.recommendationMetadata?.levels?.length ? workout.recommendationMetadata.levels : [],
    locations: workout.recommendationMetadata?.locations?.length ? workout.recommendationMetadata.locations : [],
    equipmentProfile: workout.recommendationMetadata?.equipmentProfile || 'mixed',
    tags: workout.recommendationMetadata?.tags?.length ? workout.recommendationMetadata.tags : [],
  }
}

export function AdminWorkoutEditorScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  
  const [workout, setWorkout] = useState<Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>(emptyWorkout)
  const [isLoading, setIsLoading] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)
  const [techniques, setTechniques] = useState<WorkoutTechnique[]>([])
  const [seriesPresets, setSeriesPresets] = useState<SeriesPreset[]>([])
  const [techniquePickerId, setTechniquePickerId] = useState<string | null>(null)
  const [presetPickerId, setPresetPickerId] = useState<string | null>(null)

  useEffect(() => {
    const close = () => { setTechniquePickerId(null); setPresetPickerId(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    exerciseService.getActiveExercises().then(setAvailableExercises)
    Promise.all([
      presetsService.listCustomTechniques(),
      presetsService.listSeriesPresets(),
    ]).then(([custom, presets]) => {
      setTechniques([...BUILT_IN_TECHNIQUES, ...custom])
      setSeriesPresets(presets)
    }).catch(() => {/* non-critical */})
    
    if (workoutId && workoutId !== 'new') {
      setIsLoading(true)
      workoutService.getById(workoutId)
        .then(found => {
          if (found) {
            setWorkout(found)
            if (found.days.length > 0) setActiveDayId(found.days[0].id)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [workoutId])

  // Recalculate daysPerWeek automatically
  useEffect(() => {
    setWorkout(prev => ({
      ...prev,
      daysPerWeek: prev.days.length
    }))
  }, [workout.days])

  // Close template dropdown on outside click
  useEffect(() => {
    if (!showTemplates) return
    function handleClick(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplates(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTemplates])

  async function save(statusToSave: Workout['status'] = workout.status) {
    if (!workout.title || !workout.goal) return toastError('Título e Objetivo são obrigatórios.')
    if (statusToSave === 'published' && workout.days.length === 0) return toastError('Não é possível publicar sem dias de treinamento.')
    if (statusToSave === 'published' && !workout.days.some(d => d.exercises.length > 0)) return toastError('Não é possível publicar sem exercícios cadastrados.')

    try {
      setIsLoading(true)
      const dataToSave = { ...workout, status: statusToSave }

      if (workoutId && workoutId !== 'new') {
        await workoutService.update(workoutId, dataToSave)
      } else {
        await workoutService.create(dataToSave)
      }
      navigate('/admin/workouts')
    } catch (error) {
      toastError('Erro ao salvar treino.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function duplicateWorkout() {
    if (workoutId === 'new') return
    try {
      setIsLoading(true)
      const copy = { ...workout, title: `${workout.title} (Cópia)`, status: 'draft', version: 1 } as Omit<Workout, 'id'>
      const newId = await workoutService.create(copy)
      navigate(`/admin/workouts/${newId}`)
    } catch (err) {
      toastError('Erro ao duplicar treino')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Protocol templates ---
  function applyProtocolTemplate(template: typeof PROTOCOL_TEMPLATES[number]) {
    const newDays: WorkoutDay[] = template.days.map((t, i) => ({
      id: `day_${Date.now()}_${i}`,
      name: t.name,
      focus: t.focus,
      order: i + 1,
      exercises: [],
    }))
    setWorkout(prev => ({ ...prev, days: newDays }))
    setActiveDayId(newDays[0].id)
    setShowTemplates(false)
  }

  // --- Param preset ---
  function applyParamPreset(preset: typeof PARAM_PRESETS[number], dayId: string) {
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id !== dayId) return d
        return {
          ...d,
          exercises: d.exercises.map(e => ({
            ...e,
            sets: preset.sets,
            reps: preset.reps,
            restSeconds: preset.rest,
          })),
        }
      }),
    }))
  }

  // --- Day Actions ---
  function addDay(templateName?: string) {
    const defaultName = `Dia ${String.fromCharCode(65 + workout.days.length)}`
    const newDay: WorkoutDay = {
      id: `day_${Date.now()}`,
      name: templateName || defaultName,
      order: workout.days.length + 1,
      exercises: []
    }
    setWorkout(prev => ({ ...prev, days: [...prev.days, newDay] }))
    setActiveDayId(newDay.id)
  }

  function duplicateDay(day: WorkoutDay) {
    const copy: WorkoutDay = {
      ...day,
      id: `day_${Date.now()}`,
      name: `${day.name} (Cópia)`,
      order: workout.days.length + 1
    }
    setWorkout(prev => ({ ...prev, days: [...prev.days, copy] }))
    setActiveDayId(copy.id)
  }

  function removeDay(dayId: string) {
    setWorkout(prev => {
      const newDays = prev.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, order: i + 1 }))
      if (activeDayId === dayId) {
        setActiveDayId(newDays.length > 0 ? newDays[0].id : null)
      }
      return { ...prev, days: newDays }
    })
  }

  function moveDay(index: number, direction: -1 | 1) {
    const newDays = [...workout.days]
    if (index + direction < 0 || index + direction >= newDays.length) return
    const temp = newDays[index]
    newDays[index] = newDays[index + direction]
    newDays[index + direction] = temp
    setWorkout(prev => ({ ...prev, days: newDays.map((d, i) => ({ ...d, order: i + 1 })) }))
  }

  // --- Exercise Actions ---
  function addExerciseToDay(dayId: string, exercise: Exercise) {
    const newEx: WorkoutExercise = {
      id: `wo_ex_${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroups: exercise.muscleGroups || [],
      equipment: exercise.equipment,
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
    }
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d)
    }))
  }

  function duplicateExercise(dayId: string, exercise: WorkoutExercise) {
    const copy: WorkoutExercise = { ...exercise, id: `wo_ex_${Date.now()}` }
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, copy] } : d)
    }))
  }

  function removeExerciseFromDay(dayId: string, woExId: string) {
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== woExId) } : d)
    }))
  }

  function moveExercise(dayId: string, index: number, direction: -1 | 1) {
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id !== dayId) return d
        const newExercises = [...d.exercises]
        if (index + direction < 0 || index + direction >= newExercises.length) return d
        const temp = newExercises[index]
        newExercises[index] = newExercises[index + direction]
        newExercises[index + direction] = temp
        return { ...d, exercises: newExercises }
      })
    }))
  }

  function updateWorkoutExercise(dayId: string, woExId: string, field: keyof WorkoutExercise, value: any) {
    setWorkout(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id !== dayId) return d
        return {
          ...d,
          exercises: d.exercises.map(e => e.id === woExId ? { ...e, [field]: value } : e)
        }
      })
    }))
  }

  if (isLoading && !workout.title && workoutId !== 'new') return <PageShell wide><p className="text-white p-5">Carregando...</p></PageShell>

  const activeDay = workout.days.find(d => d.id === activeDayId)
  const filteredExercises = availableExercises.filter(e => {
    const matchesSearch = !exerciseSearch || e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    const matchesMuscle = !muscleFilter || (() => {
      const group = MUSCLE_GROUPS.find(g => g.id === muscleFilter)
      if (!group) return true
      const all = [...(e.muscleGroups || []), e.primaryMuscleGroup || ''].map(s => s.toLowerCase())
      return group.match.some(m => all.some(a => a.includes(m)))
    })()
    return matchesSearch && matchesMuscle
  }).slice(0, 15)

  return (
    <PageShell wide>
      <AdminToolbar 
        title={workout.title || 'Novo Treino'} 
        eyebrow="Workout Builder V2" 
        action={
          <div className="flex flex-wrap gap-2">
            {workoutId !== 'new' && (
              <>
                <Button variant="ghost" onClick={() => window.open(`/app/workouts/${workoutId}`, '_blank')} disabled={isLoading} icon={<ExternalLink className="w-4 h-4"/>}>Ver como Aluno</Button>
                <ConfirmButton variant="ghost" message="Duplicar este treino?" onConfirm={duplicateWorkout}>
                  <Copy className="h-4 w-4 mr-2" /> Duplicar
                </ConfirmButton>
              </>
            )}
            <Button variant="ghost" onClick={() => save('draft')} disabled={isLoading}>Salvar Rascunho</Button>
            <Button onClick={() => save('published')} disabled={isLoading}>Publicar</Button>
          </div>
        } 
      />

      {/* 3-Column Desktop Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left: Structure */}
        <section className="lg:col-span-3 ec-card rounded-2xl p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/10 pb-2 flex justify-between items-center">
            Estrutura
            <span className="text-text-muted">{workout.days.length} dias</span>
          </h3>
          
          <div className="flex flex-col gap-2">
            {workout.days.map((day, index) => (
              <div 
                key={day.id} 
                className={`p-3 rounded-xl border cursor-pointer transition-colors group ${activeDayId === day.id ? 'bg-accent-lime/10 border-accent-lime/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                onClick={() => setActiveDayId(day.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold text-sm ${activeDayId === day.id ? 'text-accent-lime' : 'text-white'}`}>{day.name}</span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); moveDay(index, -1) }}><ArrowUp className="w-3 h-3" /></button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); moveDay(index, 1) }}><ArrowDown className="w-3 h-3" /></button>
                    <button className="p-1 text-text-muted hover:text-white" onClick={(e) => { e.stopPropagation(); duplicateDay(day) }}><Copy className="w-3 h-3" /></button>
                    <button className="p-1 text-accent-red/70 hover:text-accent-red" onClick={(e) => { e.stopPropagation(); removeDay(day.id) }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="text-[10px] text-text-muted flex justify-between">
                  <span className="truncate w-3/4">{day.focus || 'Sem foco específico'}</span>
                  <span className="flex-shrink-0 text-white/50">{day.exercises.length} ex.</span>
                </div>
              </div>
            ))}
            {workout.days.length === 0 && <p className="text-xs text-text-muted text-center py-4">Nenhum dia criado.</p>}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Button variant="ghost" className="text-xs py-2 w-full justify-start" onClick={() => addDay()} icon={<Plus className="w-3 h-3" />}>Novo Dia</Button>

            {/* Protocol templates */}
            <div className="relative" ref={templateRef}>
              <button
                onClick={() => setShowTemplates(v => !v)}
                className="flex items-center justify-between w-full text-[10px] bg-accent-lime/10 hover:bg-accent-lime/20 text-accent-lime border border-accent-lime/20 rounded-lg px-3 py-2 transition-colors font-bold uppercase tracking-widest"
              >
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Templates de protocolo</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
              {showTemplates && (
                <div className="absolute left-0 right-0 bottom-full mb-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                  <p className="text-[9px] text-text-muted uppercase tracking-widest font-black px-3 pt-3 pb-1">
                    {workout.days.length > 0 ? '⚠ Substituirá os dias existentes' : 'Escolha um ponto de partida'}
                  </p>
                  {PROTOCOL_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => applyProtocolTemplate(tpl)}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <p className="text-xs font-bold text-white">{tpl.label}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{tpl.days.map(d => d.name).join(' · ')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Center: Active Day Editor */}
        <section className="lg:col-span-6 ec-card rounded-2xl p-5 min-h-[50vh]">
          {!activeDay ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted py-20">
              <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione ou crie um dia de treino para editar.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-6">
              {/* Day Header */}
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Nome do Dia</label>
                  <input 
                    type="text" 
                    value={activeDay.name} 
                    onChange={e => setWorkout(prev => ({ ...prev, days: prev.days.map(d => d.id === activeDay.id ? { ...d, name: e.target.value } : d) }))}
                    className="w-full bg-transparent border-b border-white/20 text-white font-display font-bold text-2xl focus:outline-none focus:border-accent-lime pb-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 block">Foco Muscular</label>
                  <input 
                    type="text" 
                    value={activeDay.focus || ''} 
                    onChange={e => setWorkout(prev => ({ ...prev, days: prev.days.map(d => d.id === activeDay.id ? { ...d, focus: e.target.value } : d) }))}
                    className="w-full bg-transparent border-b border-white/20 text-accent-lime text-sm focus:outline-none pb-2 mt-2"
                    placeholder="Ex: Peito e Ombro"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="text-[10px] text-text-muted uppercase tracking-widest font-black">Exercícios</h4>
                {activeDay.exercises.map((woEx, index) => (
                  <div key={woEx.id} className="flex flex-col bg-white/5 rounded-xl border border-white/5 group hover:border-white/20 transition-colors relative overflow-hidden">
                    <div className="p-3 flex flex-col xl:flex-row items-start xl:items-center gap-4">
                      
                      {/* Name & Reorder */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="text-text-muted hover:text-white" onClick={() => moveExercise(activeDay.id, index, -1)}><ArrowUp className="w-3 h-3" /></button>
                           <button className="text-text-muted hover:text-white" onClick={() => moveExercise(activeDay.id, index, 1)}><ArrowDown className="w-3 h-3" /></button>
                        </div>
                        <span className="text-xs font-bold text-white/30">{index + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-bold truncate">{woEx.exerciseName}</p>
                          <p className="text-[10px] text-text-muted capitalize truncate">{woEx.muscleGroups.join(', ')} • {woEx.equipment}</p>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full xl:w-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted mb-1 text-center font-bold">Séries</span>
                          <input type="number" value={woEx.sets} onChange={e => updateWorkoutExercise(activeDay.id, woEx.id, 'sets', Number(e.target.value))} className="w-14 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-accent-lime outline-none" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted mb-1 text-center font-bold">Reps</span>
                          <input type="text" value={woEx.reps} onChange={e => updateWorkoutExercise(activeDay.id, woEx.id, 'reps', e.target.value)} className="w-20 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-accent-lime outline-none" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted mb-1 text-center font-bold">Rest (s)</span>
                          <input type="number" value={woEx.restSeconds} onChange={e => updateWorkoutExercise(activeDay.id, woEx.id, 'restSeconds', Number(e.target.value))} className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-accent-lime outline-none" />
                        </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted mb-1 text-center font-bold">RPE/RIR</span>
                          <input type="text" value={woEx.rpeTarget || woEx.rirTarget || ''} onChange={e => {
                            const value = e.target.value
                            updateWorkoutExercise(activeDay.id, woEx.id, 'rpeTarget', value)
                            updateWorkoutExercise(activeDay.id, woEx.id, 'rirTarget', value)
                          }} placeholder="8-9" className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-accent-lime outline-none" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-[120px]">
                          <span className="text-[10px] text-text-muted mb-1 font-bold">Notas</span>
                          <input type="text" value={woEx.notes || ''} onChange={e => updateWorkoutExercise(activeDay.id, woEx.id, 'notes', e.target.value)} placeholder="Ex: Foco na contração..." className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-accent-lime outline-none" />
                        </div>
                        <div className="flex items-center gap-1 mt-4 xl:mt-5 ml-auto">
                          <button onClick={() => duplicateExercise(activeDay.id, woEx)} className="p-2 text-text-muted hover:text-white" title="Duplicar"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => removeExerciseFromDay(activeDay.id, woEx.id)} className="p-2 text-text-muted hover:text-accent-red" title="Remover"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {/* Technique + Series Preset row */}
                      <div className="px-3 pb-3 flex flex-wrap gap-2 border-t border-white/5 pt-2.5">
                        {/* Technique picker */}
                        <div className="relative">
                          {woEx.techniqueId ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              <Zap className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{woEx.techniqueName}</span>
                              <button
                                onClick={() => updateWorkoutExercise(activeDay.id, woEx.id, 'techniqueId', undefined)}
                                className="ml-0.5 hover:text-white"
                                title="Remover técnica"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setTechniquePickerId(techniquePickerId === woEx.id ? null : woEx.id); setPresetPickerId(null) }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-amber-400 hover:bg-amber-500/10 border border-white/8 hover:border-amber-500/30 transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              Técnica
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                          {techniquePickerId === woEx.id && (
                            <div onClick={(e) => e.stopPropagation()} className="absolute left-0 top-full mt-1 z-50 w-64 bg-[#0d1422] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                              {techniques.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    updateWorkoutExercise(activeDay.id, woEx.id, 'techniqueId', t.id)
                                    updateWorkoutExercise(activeDay.id, woEx.id, 'techniqueName', t.name)
                                    updateWorkoutExercise(activeDay.id, woEx.id, 'techniqueDescription', t.description)
                                    updateWorkoutExercise(activeDay.id, woEx.id, 'techniqueInstructions', t.instructions)
                                    setTechniquePickerId(null)
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0"
                                >
                                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                    {t.isBuiltIn && <span className="text-[8px] px-1 py-0.5 rounded bg-accent-lime/10 text-accent-lime border border-accent-lime/20 font-black uppercase">PADRÃO</span>}
                                    {t.name}
                                  </p>
                                  <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{t.description}</p>
                                </button>
                              ))}
                              {techniques.length === 0 && (
                                <p className="text-xs text-text-muted px-3 py-2">Nenhuma técnica disponível.</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Series preset picker */}
                        <div className="relative">
                          {woEx.setGroups?.length ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-lime/10 border border-accent-lime/30 text-accent-lime">
                              <LayoutList className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                {woEx.setGroups.map((g) => `${g.sets}×${g.reps} ${g.label}`).join(' + ')}
                              </span>
                              <button
                                onClick={() => updateWorkoutExercise(activeDay.id, woEx.id, 'setGroups', undefined)}
                                className="ml-0.5 hover:text-white"
                                title="Remover preset"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            seriesPresets.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setPresetPickerId(presetPickerId === woEx.id ? null : woEx.id); setTechniquePickerId(null) }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-accent-lime hover:bg-accent-lime/10 border border-white/8 hover:border-accent-lime/30 transition-all"
                              >
                                <LayoutList className="w-3 h-3" />
                                Preset séries
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            )
                          )}
                          {presetPickerId === woEx.id && (
                            <div onClick={(e) => e.stopPropagation()} className="absolute left-0 top-full mt-1 z-50 w-72 bg-[#0d1422] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                              {seriesPresets.map((p) => {
                                const totalSets = p.groups.reduce((acc, g) => acc + g.sets, 0)
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      updateWorkoutExercise(activeDay.id, woEx.id, 'setGroups', p.groups)
                                      updateWorkoutExercise(activeDay.id, woEx.id, 'sets', totalSets)
                                      updateWorkoutExercise(activeDay.id, woEx.id, 'reps', p.groups.find((g) => g.label.toLowerCase().includes('trabalho'))?.reps || p.groups[0]?.reps || woEx.reps)
                                      setPresetPickerId(null)
                                    }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0"
                                  >
                                    <p className="text-xs font-bold text-white">{p.name}</p>
                                    <p className="text-[10px] text-text-muted font-mono mt-0.5">
                                      {p.groups.map((g) => `${g.sets}×${g.reps} ${g.label}`).join(' + ')}
                                    </p>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
                {activeDay.exercises.length === 0 && <p className="text-xs text-text-muted text-center py-6 border border-dashed border-white/10 rounded-xl">Nenhum exercício neste dia.</p>}
              </div>

              {/* Param presets + Exercise Search */}
              <div className="mt-auto space-y-3">
                {/* Param preset bar */}
                {activeDay.exercises.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mr-1 flex-shrink-0">Aplicar ao dia:</span>
                    {PARAM_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyParamPreset(preset, activeDay.id)}
                        title={`${preset.sets}x ${preset.reps} reps · ${preset.rest}s descanso`}
                        className="text-[10px] px-2.5 py-1.5 bg-white/5 hover:bg-accent-lime/10 hover:text-accent-lime border border-white/10 hover:border-accent-lime/30 rounded-lg text-text-muted font-bold uppercase tracking-widest transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Muscle group chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMuscleFilter(null)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-full border font-bold uppercase tracking-widest transition-all ${!muscleFilter ? 'bg-white/15 border-white/20 text-white' : 'border-white/10 text-text-muted hover:border-white/20'}`}
                  >
                    Todos
                  </button>
                  {MUSCLE_GROUPS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setMuscleFilter(muscleFilter === g.id ? null : g.id)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full border font-bold uppercase tracking-widest transition-all ${muscleFilter === g.id ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime' : 'border-white/10 text-text-muted hover:border-white/20'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Exercise search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder={muscleFilter ? `Buscar em ${MUSCLE_GROUPS.find(g => g.id === muscleFilter)?.label}...` : "Buscar exercício..."}
                      value={exerciseSearch}
                      onChange={e => setExerciseSearch(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime transition-colors"
                    />
                  </div>
                  {(exerciseSearch || muscleFilter) && (
                    <div className="absolute bottom-full mb-2 w-full bg-ec-bg-primary border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                      <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1">
                        {filteredExercises.map(e => (
                          <button
                            key={e.id}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 flex justify-between items-center group transition-colors"
                            onClick={() => { addExerciseToDay(activeDay.id, e); setExerciseSearch('') }}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold group-hover:text-accent-lime transition-colors">{e.name}</span>
                              <span className="text-[10px] text-text-muted capitalize">{e.primaryMuscleGroup || e.muscleGroups[0]}</span>
                            </div>
                            <span className="bg-white/5 px-2 py-1 rounded text-[10px] text-accent-sky">{e.equipment}</span>
                          </button>
                        ))}
                        {filteredExercises.length === 0 && <p className="px-4 py-3 text-sm text-text-muted text-center">Nenhum exercício encontrado.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right: Workout Summary & Meta */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="ec-card rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold uppercase italic text-white mb-4">Resumo do Treino</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1">Frequência Semanal</p>
                <p className="text-4xl font-display font-black text-white">{workout.daysPerWeek} <span className="text-sm text-text-muted">dias</span></p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              <Field label="Título"><TextInput value={workout.title} onChange={e => setWorkout({ ...workout, title: e.target.value })} placeholder="Ex: Hipertrofia Intensa" /></Field>
              
              <div className="grid grid-cols-2 gap-3">
                <Field label="Objetivo">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.goal} onChange={e => setWorkout({ ...workout, goal: e.target.value as Workout['goal'] })}>
                    <option value="hypertrophy">Hipertrofia</option><option value="fat_loss">Emagrecimento</option><option value="recomposition">Recomp</option><option value="conditioning">Condicionamento</option><option value="health">Saúde</option>
                  </select>
                </Field>
                <Field label="Modalidade">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.modality} onChange={e => setWorkout({ ...workout, modality: e.target.value as Workout['modality'] })}>
                    <option value="bodybuilding">Musculação</option><option value="functional">Funcional</option><option value="home">Em Casa</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nível">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.level} onChange={e => setWorkout({ ...workout, level: e.target.value as Workout['level'] })}>
                    <option value="beginner">Iniciante</option><option value="intermediate">Intermédio</option><option value="advanced">Avançado</option>
                  </select>
                </Field>
                <Field label="Duração (min)"><TextInput type="number" value={workout.durationMinutes} onChange={e => setWorkout({ ...workout, durationMinutes: Number(e.target.value) })} /></Field>
              </div>

              <Field label="Foco Muscular"><TextInput value={(workout.focus || []).join(', ')} onChange={e => setWorkout({ ...workout, focus: sanitizeTags(e.target.value) })} placeholder="peito, ombro" /></Field>
              <Field label="Tags"><TextInput value={workout.tags.join(', ')} onChange={e => setWorkout({ ...workout, tags: sanitizeTags(e.target.value) })} placeholder="rapido, hipertrofia" /></Field>
              <Field label="Descrição"><TextArea value={workout.description || ''} onChange={e => setWorkout({ ...workout, description: e.target.value })} className="min-h-20 text-xs" placeholder="Foco em progressão de carga..." /></Field>
              <button
                type="button"
                onClick={() => setWorkout(prev => ({ ...prev, accessTier: prev.accessTier === 'mentoring' ? 'all' : 'mentoring' }))}
                className={`flex items-center gap-3 w-full rounded-xl border px-3 py-2.5 transition-all ${workout.accessTier === 'mentoring' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/20'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">Exclusivo Mentoria 1:1</span>
                <div className={`w-8 h-4 rounded-full transition-all relative ${workout.accessTier === 'mentoring' ? 'bg-amber-500' : 'bg-white/20'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${workout.accessTier === 'mentoring' ? 'left-4' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="ec-card rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold uppercase italic text-white mb-4">Metadata de Recomendação</h2>
            <div className="space-y-4">
              <ToggleGroup
                label="Objetivos compatíveis"
                options={WORKOUT_GOAL_OPTIONS}
                values={ensureWorkoutMetadata(workout).goals || []}
                onToggle={(value) =>
                  setWorkout((prev) => ({
                    ...prev,
                    recommendationMetadata: {
                      ...ensureWorkoutMetadata(prev),
                      goals: toggleStringOption(ensureWorkoutMetadata(prev).goals, value as WorkoutRecommendationGoal),
                    },
                  }))
                }
              />

              <ToggleGroup
                label="Sexo recomendado"
                options={WORKOUT_SEX_OPTIONS}
                values={ensureWorkoutMetadata(workout).sexes || []}
                onToggle={(value) =>
                  setWorkout((prev) => ({
                    ...prev,
                    recommendationMetadata: {
                      ...ensureWorkoutMetadata(prev),
                      sexes: toggleStringOption(ensureWorkoutMetadata(prev).sexes, value as 'male' | 'female' | 'unisex'),
                    },
                  }))
                }
              />

              <ToggleGroup
                label="Frequências"
                options={WORKOUT_FREQUENCY_OPTIONS.map((value) => ({ value: String(value), label: `${value}x/semana` }))}
                values={(ensureWorkoutMetadata(workout).frequencies || []).map(String)}
                onToggle={(value) =>
                  setWorkout((prev) => ({
                    ...prev,
                    recommendationMetadata: {
                      ...ensureWorkoutMetadata(prev),
                      frequencies: toggleStringOption((ensureWorkoutMetadata(prev).frequencies || []).map(String), value)
                        .map(Number)
                        .filter((entry): entry is 3 | 4 | 5 | 6 => [3, 4, 5, 6].includes(entry)),
                    },
                  }))
                }
              />

              <ToggleGroup
                label="Níveis"
                options={WORKOUT_LEVEL_OPTIONS}
                values={ensureWorkoutMetadata(workout).levels || []}
                onToggle={(value) =>
                  setWorkout((prev) => ({
                    ...prev,
                    recommendationMetadata: {
                      ...ensureWorkoutMetadata(prev),
                      levels: toggleStringOption(ensureWorkoutMetadata(prev).levels, value as 'beginner' | 'intermediate' | 'advanced'),
                    },
                  }))
                }
              />

              <ToggleGroup
                label="Locais"
                options={WORKOUT_LOCATION_OPTIONS}
                values={ensureWorkoutMetadata(workout).locations || []}
                onToggle={(value) =>
                  setWorkout((prev) => ({
                    ...prev,
                    recommendationMetadata: {
                      ...ensureWorkoutMetadata(prev),
                      locations: toggleStringOption(ensureWorkoutMetadata(prev).locations, value as 'gym' | 'home' | 'mixed'),
                    },
                  }))
                }
              />

              <Field label="Perfil de equipamento">
                <select
                  className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  value={ensureWorkoutMetadata(workout).equipmentProfile || 'mixed'}
                  onChange={(event) =>
                    setWorkout((prev) => ({
                      ...prev,
                      recommendationMetadata: {
                        ...ensureWorkoutMetadata(prev),
                        equipmentProfile: event.target.value as WorkoutEquipmentProfile,
                      },
                    }))
                  }
                >
                  {EQUIPMENT_PROFILE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Tags de recomendação">
                <TextInput
                  value={(ensureWorkoutMetadata(workout).tags || []).join(', ')}
                  onChange={(event) =>
                    setWorkout((prev) => ({
                      ...prev,
                      recommendationMetadata: {
                        ...ensureWorkoutMetadata(prev),
                        tags: sanitizeTags(event.target.value),
                      },
                    }))
                  }
                  placeholder="força, academia, progressão"
                />
              </Field>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}

function ToggleGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-3 py-2 text-[11px] font-bold transition-colors ${
                selected
                  ? 'border-ec-violet bg-ec-violet/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-text-muted hover:border-white/20'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
