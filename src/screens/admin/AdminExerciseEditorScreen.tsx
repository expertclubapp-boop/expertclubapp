import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminToolbar, Field, TextInput, StatusSelect, TextArea } from './AdminShared'
import { exerciseService } from '../../services/exerciseService'
import { sanitizeTags } from '../../services/adminCrudService'
import type { Exercise } from '../../types/domain'

const emptyExercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  modality: 'bodybuilding',
  muscleGroups: [],
  equipment: 'none',
  level: 'beginner',
  tags: [],
  substitutionGroups: [],
  status: 'active',
}

export function AdminExerciseEditorScreen() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>(emptyExercise)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (exerciseId && exerciseId !== 'new') {
      setIsLoading(true)
      exerciseService.getExercise(exerciseId)
        .then(found => {
          if (found) setExercise(found)
        })
        .finally(() => setIsLoading(false))
    }
  }, [exerciseId])

  async function save() {
    try {
      setIsLoading(true)
      if (exerciseId && exerciseId !== 'new') {
        await exerciseService.updateExercise(exerciseId, exercise)
      } else {
        await exerciseService.createExercise(exercise)
      }
      navigate('/admin/exercises')
    } catch (error) {
      alert('Erro ao salvar exercício.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <PageShell wide><p className="text-white p-5">Carregando...</p></PageShell>

  return (
    <PageShell wide>
      <AdminToolbar 
        title={exercise.name || 'Novo Exercício'} 
        eyebrow="Editor de Exercício" 
        action={<Button onClick={save} disabled={isLoading}>{exerciseId === 'new' ? 'Criar' : 'Salvar'}</Button>} 
      />

      <section className="ec-card rounded-2xl p-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3"><h3 className="font-bold text-white uppercase italic tracking-wider">Informações Básicas</h3></div>
        
        <Field label="Nome do Exercício">
          <TextInput value={exercise.name} onChange={e => setExercise({ ...exercise, name: e.target.value })} placeholder="Ex: Supino Reto" />
        </Field>
        <Field label="Modalidade">
          <select 
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white focus:border-accent-lime focus:outline-none" 
            value={exercise.modality} 
            onChange={e => setExercise({ ...exercise, modality: e.target.value as any })}
          >
            <option value="bodybuilding">Musculação</option>
            <option value="crossfit">Crossfit</option>
            <option value="running">Corrida</option>
            <option value="jiu_jitsu">Jiu Jitsu</option>
            <option value="martial_arts">Artes Marciais</option>
            <option value="functional">Funcional</option>
            <option value="home">Em Casa</option>
            <option value="mobility">Mobilidade</option>
            <option value="cardio">Cardio</option>
            <option value="mixed">Misto</option>
          </select>
        </Field>
        <Field label="Nível">
          <select 
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white focus:border-accent-lime focus:outline-none" 
            value={exercise.level} 
            onChange={e => setExercise({ ...exercise, level: e.target.value as any })}
          >
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>
        </Field>

        <Field label="Equipamento">
          <select 
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white focus:border-accent-lime focus:outline-none" 
            value={exercise.equipment} 
            onChange={e => setExercise({ ...exercise, equipment: e.target.value as any })}
          >
            <option value="barbell">Barra</option><option value="dumbbell">Halter</option><option value="machine">Máquina</option><option value="cable">Polia</option><option value="bodyweight">Peso Corporal</option><option value="kettlebell">Kettlebell</option><option value="elastic">Elástico</option><option value="cardio_machine">Máquina de Cardio</option><option value="none">Nenhum</option><option value="other">Outro</option>
          </select>
        </Field>
        <Field label="Grupos Musculares (separados por vírgula)">
          <TextInput value={exercise.muscleGroups.join(', ')} onChange={e => setExercise({ ...exercise, muscleGroups: sanitizeTags(e.target.value) })} placeholder="peito, triceps" />
        </Field>
        <Field label="Grupo Muscular Principal">
          <TextInput value={exercise.primaryMuscleGroup || ''} onChange={e => setExercise({ ...exercise, primaryMuscleGroup: e.target.value })} placeholder="peito" />
        </Field>

        <div className="md:col-span-2 lg:col-span-3 mt-4"><h3 className="font-bold text-white uppercase italic tracking-wider">Mídia & Instruções</h3></div>
        
        <Field label="URL do Vídeo (YouTube/Vimeo)">
          <TextInput value={exercise.videoUrl || ''} onChange={e => setExercise({ ...exercise, videoUrl: e.target.value })} placeholder="https://..." />
        </Field>
        <Field label="URL da Thumbnail">
          <TextInput value={exercise.thumbnailUrl || ''} onChange={e => setExercise({ ...exercise, thumbnailUrl: e.target.value })} placeholder="https://..." />
        </Field>
        <Field label="Status">
          <StatusSelect value={exercise.status} onChange={val => setExercise({ ...exercise, status: val as any })} />
        </Field>
        <div className="md:col-span-2 lg:col-span-3">
          <Field label="Instruções de Execução">
            <TextArea value={exercise.instructions || ''} onChange={e => setExercise({ ...exercise, instructions: e.target.value })} className="min-h-24" placeholder="1. Deite no banco..." />
          </Field>
        </div>

        <div className="md:col-span-2 lg:col-span-3 mt-4"><h3 className="font-bold text-white uppercase italic tracking-wider">Organização</h3></div>
        
        <div className="md:col-span-2">
          <Field label="Tags (separadas por vírgula)">
            <TextInput value={exercise.tags.join(', ')} onChange={e => setExercise({ ...exercise, tags: sanitizeTags(e.target.value) })} placeholder="força, peitoral" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Grupos de Substituição (separados por vírgula)">
            <TextInput value={(exercise.substitutionGroups || []).join(', ')} onChange={e => setExercise({ ...exercise, substitutionGroups: sanitizeTags(e.target.value) })} placeholder="supinos, peito-maquinas" />
          </Field>
        </div>
      </section>
    </PageShell>
  )
}
