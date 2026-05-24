import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Search, Copy, ArrowUp, ArrowDown, Dumbbell, ExternalLink } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { toastError } from '../../components/ui/Toast'
import { AdminToolbar, Field, TextInput, TextArea } from './AdminShared'
import { workoutService } from '../../services/workoutService'
import { exerciseService } from '../../services/exerciseService'
import { sanitizeTags } from '../../services/adminCrudService'
import type { Workout, WorkoutDay, WorkoutExercise, Exercise } from '../../types/domain'

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
  days: [],
  status: 'draft',
  version: 1
}

export function AdminWorkoutEditorScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  
  const [workout, setWorkout] = useState<Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>(emptyWorkout)
  const [isLoading, setIsLoading] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')

  useEffect(() => {
    exerciseService.getActiveExercises().then(setAvailableExercises)
    
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

  async function save(statusToSave: Workout['status'] = workout.status) {
    if (!workout.title || !workout.goal) return toastError('Título e objetivo são obrigatórios.')
    if (statusToSave === 'published' && workout.days.length === 0) return toastError('Não é possível publicar sem dias de treinamento.')
    if (statusToSave === 'published' && !workout.days.some(d => d.exercises.length > 0)) return toastError('Não é possível publicar sem exercícios cadastrados.')

    try {
      setIsLoading(true)
      const dataToSave = { ...workout, status: statusToSave }
      if (statusToSave === 'published' && workout.status !== 'published') {
        (dataToSave as any).publishedAt = new Date().toISOString()
      }

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
      toastError('Erro ao duplicar treino.')
    } finally {
      setIsLoading(false)
    }
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
  const filteredExercises = availableExercises.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase())).slice(0, 10)

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
                <Button variant="ghost" onClick={duplicateWorkout} disabled={isLoading} icon={<Copy className="w-4 h-4"/>}>Duplicar</Button>
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
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => addDay('Dia A (Peito)')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Dia A (Peito)</button>
              <button onClick={() => addDay('Dia B (Costas)')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Dia B (Costas)</button>
              <button onClick={() => addDay('Dia C (Pernas)')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Dia C (Pernas)</button>
              <button onClick={() => addDay('Full Body')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-muted rounded p-1 transition-colors">Full Body</button>
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
                        <div className="flex items-center gap-1 mt-4 xl:mt-5 ml-auto">
                          <button onClick={() => duplicateExercise(activeDay.id, woEx)} className="p-2 text-text-muted hover:text-white" title="Duplicar"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => removeExerciseFromDay(activeDay.id, woEx.id)} className="p-2 text-text-muted hover:text-accent-red" title="Remover"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
                {activeDay.exercises.length === 0 && <p className="text-xs text-text-muted text-center py-6 border border-dashed border-white/10 rounded-xl">Nenhum exercício neste dia.</p>}
              </div>

              {/* Exercise Search */}
              <div className="mt-auto relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Buscar exercício (ex: supino, agachamento)..." 
                    value={exerciseSearch}
                    onChange={e => setExerciseSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-lime transition-colors"
                  />
                </div>
                {exerciseSearch && (
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
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.goal} onChange={e => setWorkout({ ...workout, goal: e.target.value as any })}>
                    <option value="hypertrophy">Hipertrofia</option><option value="fat_loss">Emagrecimento</option><option value="recomposition">Recomp</option><option value="conditioning">Condicionamento</option><option value="health">Saúde</option>
                  </select>
                </Field>
                <Field label="Modalidade">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.modality} onChange={e => setWorkout({ ...workout, modality: e.target.value as any })}>
                    <option value="bodybuilding">Musculação</option><option value="functional">Funcional</option><option value="home">Em Casa</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nível">
                  <select className="ec-input w-full rounded-xl px-3 py-2 text-xs text-white focus:outline-none" value={workout.level} onChange={e => setWorkout({ ...workout, level: e.target.value as any })}>
                    <option value="beginner">Iniciante</option><option value="intermediate">Intermédio</option><option value="advanced">Avançado</option>
                  </select>
                </Field>
                <Field label="Duração (min)"><TextInput type="number" value={workout.durationMinutes} onChange={e => setWorkout({ ...workout, durationMinutes: Number(e.target.value) })} /></Field>
              </div>

              <Field label="Foco Muscular"><TextInput value={(workout.focus || []).join(', ')} onChange={e => setWorkout({ ...workout, focus: sanitizeTags(e.target.value) })} placeholder="peito, ombro" /></Field>
              <Field label="Tags"><TextInput value={workout.tags.join(', ')} onChange={e => setWorkout({ ...workout, tags: sanitizeTags(e.target.value) })} placeholder="rapido, hipertrofia" /></Field>
              <Field label="Descrição"><TextArea value={workout.description || ''} onChange={e => setWorkout({ ...workout, description: e.target.value })} className="min-h-20 text-xs" placeholder="Foco em progressão de carga..." /></Field>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
