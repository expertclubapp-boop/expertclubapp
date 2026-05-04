import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, PlayCircle, Zap, ChevronRight, Moon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { GlassCard, PageShell } from '../../components/ui/Premium'
import { useWorkout } from '../../hooks/useWorkouts'
import { useProfile } from '../../hooks/useProfile'
import { profileService } from '../../services/profileService'
import { workoutSessionService } from '../../services/workoutSessionService'
import { useAuth } from '../../contexts/AuthContext'

export function WorkoutDetailScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { workout, isLoading: workoutLoading } = useWorkout(workoutId)
  const { profile } = useProfile()
  
  const isSelected = profile?.selectedWorkoutId === workoutId

  if (workoutLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!workout) return <div className="p-10 text-center text-text-muted font-display uppercase italic">Treino não encontrado</div>

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
    <PageShell className="pb-40">
      {/* Header & Hero */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        <div className="md:col-span-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-accent-lime transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-display text-sm font-bold uppercase tracking-widest">Biblioteca</span>
          </button>

          <div className="flex items-center gap-2 mb-4">
            {isSelected ? (
              <Badge color="lime" className="uppercase animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Plano Ativo
              </Badge>
            ) : (
              <Badge color="violet" className="uppercase">Sugestão</Badge>
            )}
            <Badge color="sky" className="uppercase">Nível {workout.level === 'beginner' ? '01' : workout.level === 'intermediate' ? '04' : '08'}</Badge>
            {workout.version && <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">v{workout.version}</span>}
          </div>
          
          <h1 className="font-display text-heading-1 text-text-primary mb-4 uppercase italic tracking-tighter leading-none">
            {workout.title}
          </h1>
          <p className="text-text-secondary text-body-lg mb-8 max-w-2xl leading-relaxed font-medium">
            Protocolo desenvolvido para atletas que buscam {workout.goal === 'hypertrophy' ? 'hipertrofia máxima e densidade muscular' : 'queima calórica otimizada e definição'}. Foco em balanceamento estrutural e sobrecarga progressiva.
          </p>

          <div className="flex flex-wrap gap-10">
            <OverviewItem label="Modalidade" value={workout.modality === 'bodybuilding' ? 'Musculação' : workout.modality} />
            <div className="w-px h-12 bg-white/10" />
            <OverviewItem label="Duração" value={`${workout.durationMinutes} min`} />
            <div className="w-px h-12 bg-white/10" />
            <OverviewItem label="Frequência" value={`${workout.daysPerWeek}x Semana`} />
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="ec-card rounded-2xl overflow-hidden aspect-square md:aspect-auto h-full relative group">
            <img 
              src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800`} 
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              alt={workout.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end">
                <div>
                <span className="block font-display text-[10px] font-bold text-ec-violet uppercase tracking-widest">Fase Atual</span>
                <h2 className="font-display text-h2 text-text-primary uppercase italic leading-none">{workout.title}</h2>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-ec-violet/10 flex items-center justify-center border border-ec-violet/20">
                <Zap className="w-8 h-8 text-ec-violet" />
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Structure */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-heading-2 text-text-primary uppercase italic">Estrutura Semanal</h2>
          {!isSelected && (
            <Button variant="ghost" onClick={handleUseWorkout} className="border-ec-violet/30 text-ec-violet hover:bg-ec-violet/5">
              Usar esse treino
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {workout.days && workout.days.length > 0 ? workout.days.map((day, idx) => (
            <motion.div 
              key={day.id}
              whileHover={{ x: 4 }}
              onClick={() => isSelected && handleStartWorkout(day.id)}
              className={`
                ec-card rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between group transition-all duration-300
                ${isSelected ? 'cursor-pointer hover:border-ec-violet/30 shadow-sm' : 'opacity-60'}
              `}
            >
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className="w-14 h-14 rounded-xl bg-bg-primary border border-subtle flex items-center justify-center font-display text-heading-3 text-ec-violet uppercase italic">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-ec-violet font-display text-[10px] font-bold tracking-widest uppercase">DIA {idx + 1}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-text-muted font-display text-[10px] font-bold tracking-widest uppercase">Foco Principal</span>
                  </div>
                  <h3 className="font-display text-heading-3 text-text-primary group-hover:text-ec-violet transition-colors uppercase italic">
                    {day.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="flex gap-6">
                  <div className="text-right">
                    <span className="block text-text-muted text-[10px] uppercase font-bold tracking-widest">Exercícios</span>
                    <span className="text-text-primary font-display font-bold uppercase italic">{day.exercises.length.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-text-muted text-[10px] uppercase font-bold tracking-widest">Séries</span>
                    <span className="text-text-primary font-display font-bold uppercase italic">
                      {day.exercises.reduce((acc, ex) => acc + ex.sets, 0).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-text-disabled group-hover:text-ec-violet transition-all ${isSelected ? '' : 'hidden'}`} />
              </div>
            </motion.div>
          )) : (
            <GlassCard className="rounded-xl p-10 flex flex-col items-center justify-center text-text-muted">
              <Moon className="w-8 h-8 mb-4 opacity-20" />
              <p className="font-display text-sm font-bold uppercase tracking-widest">Dias de descanso programados</p>
            </GlassCard>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      {isSelected && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-6">
          <button 
            onClick={() => handleStartWorkout()}
            className="w-full bg-ec-violet text-white font-display text-heading-3 uppercase italic py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(91,75,255,0.2)] active:scale-95 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
            <span className="relative z-10">Iniciar Treino</span>
            <PlayCircle className="w-6 h-6 relative z-10 fill-current" />
          </button>
        </div>
      )}

      {!isSelected && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-6">
          <Button variant="primary" onClick={handleUseWorkout} className="py-5 rounded-2xl shadow-xl">
            Selecionar este plano
          </Button>
        </div>
      )}
    </PageShell>
  )
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-text-muted font-display text-[10px] font-bold uppercase tracking-widest mb-1">{label}</span>
      <span className="font-display text-heading-3 text-text-primary uppercase italic">{value}</span>
    </div>
  )
}
