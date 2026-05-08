import { useParams, useNavigate } from 'react-router-dom'
import { PlayCircle, ChevronRight, Clock, Dumbbell, Target } from 'lucide-react'
import { useWorkout } from '../../hooks/useWorkouts'
import { useProfile } from '../../hooks/useProfile'
import { profileService } from '../../services/profileService'
import { workoutSessionService } from '../../services/workoutSessionService'
import { useAuth } from '../../contexts/AuthContext'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { V2Card, V2Badge, V2Button, cx } from '../../components/v2/ExpertClubV2Base'

export function WorkoutDetailScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { workout, isLoading: workoutLoading } = useWorkout(workoutId)
  const { profile } = useProfile()
  
  const isSelected = profile?.selectedWorkoutId === workoutId

  if (workoutLoading) {
    return (
      <div className="min-h-screen bg-[#050A12] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!workout) return (
    <ExpertClubMobileShell active="Treinos" title="Não encontrado">
       <div className="p-20 text-center text-text-muted font-black uppercase italic">Treino não encontrado</div>
    </ExpertClubMobileShell>
  )

  const handleUseWorkout = async () => {
    if (!firebaseUser || !workoutId) return
    try {
      await profileService.updateProfile(firebaseUser.uid, { selectedWorkoutId: workoutId })
    } catch (error) {
      console.error("Error setting workout:", error)
    }
  }

  const handleStartWorkout = async (dayId?: string) => {
    if (!firebaseUser || !workout) return
    const id = dayId || (workout.days[0]?.id)
    if (id) {
      const sessionId = await workoutSessionService.startSession(firebaseUser.uid, {
        workoutId: workout.id,
        dayId: id,
        xpEarned: 0,
        logs: [],
      })
      navigate(`/app/workouts/session/${sessionId}`)
    }
  }

  return (
    <ExpertClubMobileShell active="Treinos" title="Detalhes" subtitle={workout.title}>
      <div className="flex flex-col gap-8 pb-32">
        
        <div className="relative h-64 -mx-4 -mt-6 overflow-hidden">
          <img 
            src={(workout as any).thumbnailUrl || `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800`} 
            className="w-full h-full object-cover opacity-50" 
            alt={workout.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A12] via-[#050A12]/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
             <div className="flex gap-2 mb-3">
                <V2Badge tone={isSelected ? "success" : "violet"}>{isSelected ? "PLANO ATIVO" : "SUGESTÃO"}</V2Badge>
                <V2Badge tone="violet" className="opacity-80">NÍVEL {workout.level === 'beginner' ? '01' : workout.level === 'intermediate' ? '04' : '08'}</V2Badge>
             </div>
             <h1 className="text-4xl font-black italic text-white uppercase leading-none tracking-tighter">
                {workout.title}
             </h1>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={Dumbbell} label="Modalidade" value={workout.modality === 'bodybuilding' ? 'Gym' : 'Expert'} />
          <StatBox icon={Clock} label="Duração" value={`${workout.durationMinutes}m`} />
          <StatBox icon={Target} label="Frequência" value={`${workout.daysPerWeek}x/sem`} />
        </div>

        {/* DESCRIPTION */}
        <p className="text-xs text-text-muted leading-relaxed font-bold uppercase tracking-widest">
           {workout.description || `Protocolo focado em performance e densidade muscular. Desenvolvido para maximizar a sobrecarga progressiva.`}
        </p>

        {/* DAYS LIST */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Estrutura de Treino</h3>
             {!isSelected && (
               <button onClick={handleUseWorkout} className="text-[10px] font-black italic text-ec-violet uppercase hover:underline">USAR PLANO</button>
             )}
          </div>

          {workout.days?.map((day, idx) => (
            <V2Card 
              key={day.id}
              onClick={() => isSelected && handleStartWorkout(day.id)}
              className={cx(
                "p-4 group transition-all",
                isSelected ? "cursor-pointer hover:border-ec-violet/50" : "opacity-40 grayscale"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-black italic text-ec-violet group-hover:bg-ec-violet/10 group-hover:text-white transition-colors">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black text-ec-violet uppercase block mb-1">DIA {idx + 1}</span>
                  <h4 className="text-sm font-black italic text-white uppercase truncate group-hover:text-ec-violet transition-colors">{day.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-text-muted uppercase">{day.exercises.length} EXERCÍCIOS</p>
                  <p className="text-[9px] font-bold text-text-muted uppercase">
                    {day.exercises.reduce((acc, ex) => acc + (ex.sets || 3), 0)} SÉRIES
                  </p>
                </div>
                {isSelected && <ChevronRight size={18} className="text-text-muted group-hover:translate-x-1 transition-transform" />}
              </div>
            </V2Card>
          ))}
        </div>

      </div>

      {/* FLOATING CTA */}
      <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom,0px))] left-0 right-0 px-6 z-50">
         <div className="max-w-md mx-auto">
            {isSelected ? (
              <V2Button 
                variant="primary" 
                className="w-full h-16 text-lg font-black italic uppercase shadow-2xl shadow-ec-violet/40"
                onClick={() => handleStartWorkout()}
              >
                INICIAR TREINO <PlayCircle size={24} className="ml-2 fill-current" />
              </V2Button>
            ) : (
              <V2Button 
                variant="secondary" 
                className="w-full h-16 text-lg font-black italic uppercase"
                onClick={handleUseWorkout}
              >
                SELECIONAR PROTOCOLO
              </V2Button>
            )}
         </div>
      </div>
    </ExpertClubMobileShell>
  )
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <V2Card className="p-3 text-center flex flex-col items-center gap-2">
      <Icon size={14} className="text-ec-violet" />
      <div>
        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-black italic text-white uppercase">{value}</p>
      </div>
    </V2Card>
  )
}
