import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Search, Dumbbell, Zap, Clock, Repeat, ListChecks, X, Eye, Video } from 'lucide-react'
import { PlanPreviewModal } from './PlanPreviewModal'
import { exerciseService } from '../../../services/exerciseService'
import type { Exercise, Workout, WorkoutDay, WorkoutExercise, WorkoutExerciseSubstitution } from '../../../types/domain'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkoutPrescriptorProps {
  workout: Workout
  onChange: (updatedWorkout: Workout) => void
}

export function WorkoutPrescriptor({ workout, onChange }: WorkoutPrescriptorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isSearching, setIsSearching] = useState<{ dayIndex: number, exIndex: number, subIndex?: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSubstitutions, setEditingSubstitutions] = useState<{ dayIndex: number, exIndex: number } | null>(null)
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    exerciseService.getExercises().then(setExercises)
  }, [])

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return exercises.slice(0, 10)
    return exercises.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 15)
  }, [exercises, searchTerm])

  const addDay = () => {
    const newDay: WorkoutDay = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Treino ${String.fromCharCode(65 + (workout.days?.length || 0))}`,
      order: workout.days?.length || 0,
      exercises: [],
      focus: ''
    }
    onChange({ ...workout, days: [...(workout.days || []), newDay] })
  }

  const removeDay = (index: number) => {
    const newDays = [...(workout.days || [])]
    newDays.splice(index, 1)
    onChange({ ...workout, days: newDays })
  }

  const addExerciseItem = (dayIndex: number) => {
    const newDays = [...(workout.days || [])]
    const newEx: WorkoutExercise = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: '',
      exerciseName: 'Novo Exercício',
      muscleGroups: [],
      sets: 3,
      reps: '12',
      restSeconds: 60,
      notes: '',
      substitutionOptions: []
    }
    newDays[dayIndex].exercises.push(newEx)
    onChange({ ...workout, days: newDays })
  }

  const removeExerciseItem = (dayIndex: number, exIndex: number) => {
    const newDays = [...(workout.days || [])]
    newDays[dayIndex].exercises.splice(exIndex, 1)
    onChange({ ...workout, days: newDays })
  }

  const selectExercise = (dayIndex: number, exIndex: number, ex: Exercise, isSubstitution: boolean = false) => {
    const newDays = [...(workout.days || [])]
    
    if (!isSubstitution) {
      const target = newDays[dayIndex].exercises[exIndex]
      target.exerciseId = ex.id
      target.exerciseName = ex.name
      target.muscleGroups = ex.muscleGroups
      target.equipment = ex.equipment
      target.notes = ex.instructions?.slice(0, 100) || ''
    } else {
      const target = newDays[dayIndex].exercises[exIndex]
      const sub: WorkoutExerciseSubstitution = {
        exerciseId: ex.id,
        exerciseName: ex.name,
        notes: ''
      }
      target.substitutionOptions = [...(target.substitutionOptions || []), sub]
    }
    
    onChange({ ...workout, days: newDays })
    setIsSearching(null)
    setSearchTerm('')
  }

  const removeSubstitution = (dayIndex: number, exIndex: number, subIndex: number) => {
    const newDays = [...(workout.days || [])]
    newDays[dayIndex].exercises[exIndex].substitutionOptions?.splice(subIndex, 1)
    onChange({ ...workout, days: newDays })
  }

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="ec-card bg-ec-violet/10 border-ec-violet/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-[0_8px_32px_rgba(91,75,255,0.15)]">
        <div>
          <h3 className="font-display text-xl font-black uppercase italic text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-ec-violet" />
            VGV de Volume (Volume Geral)
          </h3>
          <p className="text-xs text-text-muted">Planejamento de carga e frequência</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-8 mr-6">
            <Stat label="Total Dias" value={String(workout.days?.length || 0)} color="violet" />
            <Stat label="Minutos Médios" value={`${workout.durationMinutes || '--'} min`} color="sky" />
            <Stat label="Nível" value={workout.level || '--'} color="white" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setIsPreviewOpen(true)}
            className="w-auto h-12 px-6 border-ec-violet/20 text-ec-violet hover:bg-ec-violet/5 rounded-xl flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Pré-visualizar
          </Button>
        </div>
      </div>

      <PlanPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        type="workout" 
        data={workout} 
      />

      {/* Days List */}
      <div className="space-y-4">
        {(workout.days || []).map((day, dIdx) => (
          <div key={day.id} className="ec-card rounded-2xl overflow-hidden border border-white/5 bg-surface-1/40">
            <div className="bg-white/5 p-4 flex items-center justify-between gap-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <Dumbbell className="w-4 h-4 text-ec-violet" />
                <input 
                  value={day.name} 
                  onChange={e => {
                    const newDays = [...workout.days]
                    newDays[dIdx].name = e.target.value
                    onChange({ ...workout, days: newDays })
                  }}
                  className="bg-transparent font-display text-lg font-black uppercase italic text-white focus:outline-none hover:bg-white/5 px-2 py-1 rounded transition-colors"
                  placeholder="Ex: Treino A - Inferiores"
                />
              </div>
              <button onClick={() => removeDay(dIdx)} className="text-text-disabled hover:text-accent-red transition-colors p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {day.exercises.map((ex, eIdx) => (
                <div key={ex.id} className="space-y-3">
                  <div className="flex flex-col gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:border-ec-violet/30 transition-all relative group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {isSearching?.dayIndex === dIdx && isSearching?.exIndex === eIdx && !isSearching.subIndex ? (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input 
                              autoFocus
                              placeholder="Buscar no banco de exercícios..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full bg-bg-primary border border-ec-violet/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white shadow-[0_0_15px_rgba(91,75,255,0.1)]"
                            />
                            <div className="absolute top-full left-0 right-0 z-[100] mt-2 max-h-60 overflow-y-auto ec-glass rounded-xl border border-white/10 shadow-2xl">
                              {filteredExercises.map(exercise => (
                                <button 
                                  key={exercise.id} 
                                  onClick={() => selectExercise(dIdx, eIdx, exercise)}
                                  className="w-full text-left p-4 hover:bg-ec-violet/20 border-b border-white/5 last:border-0 flex justify-between items-center group/btn"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-white group-hover/btn:text-ec-violet transition-colors">{exercise.name}</p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{exercise.muscleGroups?.join(', ')}</p>
                                  </div>
                                  {exercise.videoUrl && <Video className="w-3.5 h-3.5 text-ec-violet opacity-50" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <button 
                                onClick={() => setIsSearching({ dayIndex: dIdx, exIndex: eIdx })}
                                className="text-left flex-1"
                              >
                                <p className="text-base font-black text-white uppercase italic group-hover:text-ec-violet transition-colors">{ex.exerciseName}</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">{ex.muscleGroups?.join(' • ')}</p>
                              </button>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const fullEx = exercises.find(e => e.id === ex.exerciseId)
                                    if (fullEx) setPreviewExercise(fullEx)
                                  }}
                                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white transition-all"
                                >
                                  <Video className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingSubstitutions(editingSubstitutions?.exIndex === eIdx ? null : { dayIndex: dIdx, exIndex: eIdx })}
                                  className={`p-2.5 rounded-xl border transition-all ${ex.substitutionOptions?.length ? 'bg-ec-violet text-white border-ec-violet' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}
                                >
                                  <Repeat className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeExerciseItem(dIdx, eIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 text-text-disabled hover:text-accent-red">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                 <Repeat className="w-3.5 h-3.5 text-ec-violet" />
                                 <input 
                                   type="number" value={ex.sets} 
                                   onChange={e => {
                                     const newDays = [...workout.days]; newDays[dIdx].exercises[eIdx].sets = Number(e.target.value); onChange({...workout, days: newDays})
                                   }}
                                   className="w-12 bg-bg-primary border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center font-black focus:border-ec-violet" 
                                 />
                                 <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Séries</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Zap className="w-3.5 h-3.5 text-accent-sky" />
                                 <input 
                                   type="text" value={ex.reps} 
                                   onChange={e => {
                                     const newDays = [...workout.days]; newDays[dIdx].exercises[eIdx].reps = e.target.value; onChange({...workout, days: newDays})
                                   }}
                                   className="w-16 bg-bg-primary border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center font-black focus:border-ec-violet" 
                                 />
                                 <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Reps</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5 text-accent-purple" />
                                 <input 
                                   type="number" value={ex.restSeconds} 
                                   onChange={e => {
                                     const newDays = [...workout.days]; newDays[dIdx].exercises[eIdx].restSeconds = Number(e.target.value); onChange({...workout, days: newDays})
                                   }}
                                   className="w-16 bg-bg-primary border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center font-black focus:border-ec-violet" 
                                 />
                                 <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Descanso</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Substitutions Editor */}
                    <AnimatePresence>
                      {editingSubstitutions?.dayIndex === dIdx && editingSubstitutions?.exIndex === eIdx && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-ec-violet flex items-center gap-2">
                                <ListChecks className="w-3.5 h-3.5" />
                                Opções de Substituição
                              </h4>
                              <button 
                                onClick={() => setIsSearching({ dayIndex: dIdx, exIndex: eIdx, subIndex: 999 })}
                                className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg"
                              >
                                <Plus className="w-3 h-3" /> Add Opção
                              </button>
                            </div>

                            <div className="space-y-2">
                              {ex.substitutionOptions?.map((sub, sIdx) => (
                                <div key={sIdx} className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/5">
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-white">{sub.exerciseName}</p>
                                  </div>
                                  <button onClick={() => removeSubstitution(dIdx, eIdx, sIdx)} className="text-text-disabled hover:text-accent-red p-1">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {isSearching?.dayIndex === dIdx && isSearching?.exIndex === eIdx && isSearching.subIndex === 999 && (
                                <div className="relative mt-2">
                                  <input 
                                    autoFocus
                                    placeholder="Pesquisar exercício substituto..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-bg-primary border border-ec-violet/30 rounded-xl py-2 pl-4 pr-4 text-xs text-white"
                                  />
                                  <div className="absolute top-full left-0 right-0 z-[101] mt-2 max-h-40 overflow-y-auto ec-glass rounded-xl border border-white/10 shadow-2xl">
                                    {filteredExercises.map(exercise => (
                                      <button 
                                        key={exercise.id} 
                                        onClick={() => selectExercise(dIdx, eIdx, exercise, true)}
                                        className="w-full text-left p-3 hover:bg-ec-violet/20 border-b border-white/5 last:border-0"
                                      >
                                        <p className="text-xs font-bold text-white">{exercise.name}</p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => addExerciseItem(dIdx)}
                className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-text-muted hover:text-ec-violet hover:border-ec-violet/30 hover:bg-ec-violet/5 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Adicionar Exercício
              </button>
            </div>
          </div>
        ))}

        <Button 
          variant="ghost" 
          onClick={addDay}
          className="w-full py-8 border-white/10 rounded-3xl text-white font-display italic font-black uppercase text-xl tracking-widest hover:bg-white/5"
          icon={<Plus className="w-6 h-6" />}
        >
          Adicionar Novo Dia de Treino
        </Button>
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {previewExercise && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="ec-card max-w-4xl w-full p-0 overflow-hidden rounded-3xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-xl font-black uppercase italic text-white">{previewExercise.name}</h3>
                <button onClick={() => setPreviewExercise(null)} className="p-2 text-text-muted hover:text-white"><X /></button>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                {previewExercise.videoUrl ? (
                   <iframe 
                    src={previewExercise.videoUrl.replace('watch?v=', 'embed/')} 
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-text-muted italic">Vídeo não disponível</div>
                )}
              </div>
              <div className="p-6">
                <p className="text-sm text-text-secondary leading-relaxed">{previewExercise.instructions || 'Sem instruções detalhadas.'}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value, color }: { label: string, value: string, color: string }) {
  const colorMap: any = {
    sky: 'text-accent-sky',
    violet: 'text-ec-violet',
    purple: 'text-accent-purple',
    white: 'text-white'
  }
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-display font-black italic ${colorMap[color]} drop-shadow-[0_0_12px_rgba(91,75,255,0.3)]`}>{value}</span>
      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mt-1">{label}</span>
    </div>
  )
}
