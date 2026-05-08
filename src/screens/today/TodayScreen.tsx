import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle2,
  Activity,
  Play,
  ChevronRight,
  Utensils,
  Droplets,
  CalendarCheck2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useDiets } from '../../hooks/useDiets'
import { useDailyCheckin } from '../../hooks/useDailyCheckin'
import { useSubscription } from '../../hooks/useSubscription'
import { ExpertClubMobileShell } from '../../components/v2/ExpertClubMobileShell'
import { V2Card, V2Avatar, V2ProgressBar, V2Button, V2Badge, cx } from '../../components/v2/ExpertClubV2Base'

export function TodayScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const { workouts } = useWorkouts()
  const { diets } = useDiets()
  const { subscription } = useSubscription()
  const todayKey = new Date().toISOString().split('T')[0]
  const { checkin } = useDailyCheckin(firebaseUser?.uid, todayKey)

  const user = firebaseUser
  const selectedWorkout = workouts.find(w => w.id === profile?.selectedWorkoutId) || workouts[0]
  const selectedDiet = diets.find(d => d.id === profile?.selectedDietId) || diets[0]
  const firstName = user?.displayName && !/admin/i.test(user.displayName)
    ? user.displayName.split(' ')[0]
    : 'Aluno'
  const completedMissions = [!!checkin, !!selectedWorkout, !!selectedDiet].filter(Boolean).length
  const dayProgress = Math.round((completedMissions / 4) * 100)

  return (
    <ExpertClubMobileShell active="Início" title="Hoje" subtitle={`Bom treino, ${firstName}`}>
      <div className="flex flex-col gap-6 pb-32">
        
        <V2Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ec-violet/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <V2Avatar uid={user?.uid} name={user?.displayName || ''} size="md" className="border-2 border-ec-violet shadow-lg shadow-ec-violet/20" />
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase">ALUNO</p>
                <h2 className="text-xl font-black italic text-white uppercase leading-tight">{firstName}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">PLANO</p>
              <p className="text-sm font-black italic text-white uppercase">{subscription?.status || 'ativo'}</p>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
              <span>PROGRESSO DO DIA</span>
              <span>{dayProgress}%</span>
            </div>
            <V2ProgressBar value={dayProgress} tone="violet" className="h-2" />
          </div>
        </V2Card>

        <div className="grid grid-cols-3 gap-3">
          <StatMini icon={CalendarCheck2} value={checkin ? 'OK' : '--'} label="CHECK-IN" tone={checkin ? 'success' : 'violet'} />
          <StatMini icon={Activity} value={selectedWorkout ? '1' : '--'} label="TREINO" tone="violet" />
          <StatMini icon={Utensils} value={selectedDiet ? '1' : '--'} label="DIETA" tone="warning" />
        </div>

        <section>
          <div className="flex justify-between items-end mb-4">
             <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Missão do Dia</h3>
             <span className="text-[10px] font-bold text-ec-violet">{completedMissions}/4 CONCLUÍDO</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <MissionItem 
              icon={CheckCircle2} 
              title="Check-in Diário" 
              done={!!checkin} 
              onClick={() => navigate('/app/checkin/daily')} 
            />
            <MissionItem 
              icon={Activity} 
              title={selectedWorkout ? selectedWorkout.title : 'Escolher treino'}
              done={!!selectedWorkout}
              onClick={() => navigate(selectedWorkout ? `/app/workouts/${selectedWorkout.id}` : '/app/workouts')}
            />
            <MissionItem
              icon={Utensils}
              title={selectedDiet ? selectedDiet.title : 'Escolher dieta'}
              done={!!selectedDiet}
              onClick={() => navigate(selectedDiet ? '/app/diets/today' : '/app/diets')}
            />
            <MissionItem 
              icon={Droplets} 
              title="Meta de Hidratação" 
              done={false} 
              onClick={() => navigate('/app/hydration')} 
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4">
          {selectedWorkout && (
            <V2Card 
              className="p-5 flex items-center justify-between group hover:border-ec-violet/30 transition-all cursor-pointer"
              onClick={() => navigate(`/app/workouts/${selectedWorkout.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-ec-violet group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase">PRÓXIMO TREINO</p>
                  <h4 className="text-lg font-black italic text-white uppercase group-hover:text-ec-violet transition-colors line-clamp-1">{selectedWorkout.title}</h4>
                </div>
              </div>
              <V2Button variant="ghost" className="p-2 min-w-0 h-auto">
                <Play className="text-ec-violet" size={20} fill="currentColor" />
              </V2Button>
            </V2Card>
          )}

          {!selectedWorkout && (
            <V2Card className="p-5">
              <p className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase">TREINO</p>
              <h4 className="mt-2 text-lg font-black italic text-white uppercase">Nenhum treino selecionado</h4>
              <p className="mt-2 text-sm text-text-muted">Abra a biblioteca e escolha um protocolo para começar.</p>
              <V2Button variant="primary" className="mt-4 w-full" onClick={() => navigate('/app/workouts')}>VER TREINOS</V2Button>
            </V2Card>
          )}

          {selectedDiet && (
            <V2Card 
              className="p-5 flex items-center justify-between group hover:border-ec-violet/30 transition-all cursor-pointer"
              onClick={() => navigate('/app/diets/today')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent-sky group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-accent-sky uppercase">DIETA DO DIA</p>
                  <h4 className="text-lg font-black italic text-white uppercase group-hover:text-accent-sky transition-colors line-clamp-1">{selectedDiet.title}</h4>
                </div>
              </div>
              <ChevronRight className="text-text-muted group-hover:text-accent-sky transition-colors" size={20} />
            </V2Card>
          )}

          {!selectedDiet && (
            <V2Card className="p-5">
              <p className="text-[10px] font-black tracking-[0.2em] text-accent-sky uppercase">DIETA</p>
              <h4 className="mt-2 text-lg font-black italic text-white uppercase">Nenhuma dieta ativa</h4>
              <p className="mt-2 text-sm text-text-muted">Escolha uma dieta para liberar o acompanhamento do dia.</p>
              <V2Button variant="primary" className="mt-4 w-full" onClick={() => navigate('/app/diets')}>VER DIETAS</V2Button>
            </V2Card>
          )}
        </div>

      </div>
    </ExpertClubMobileShell>
  )
}

function StatMini({ icon: Icon, value, label, tone }: { icon: any; value: string; label: string; tone: string }) {
  return (
    <V2Card className="p-3 flex flex-col items-center justify-center border-white/5">
      <Icon size={16} className={cx(
        tone === 'warning' && "text-accent-yellow",
        tone === 'violet' && "text-ec-violet",
        tone === 'success' && "text-accent-lime"
      )} />
      <span className="text-sm font-black italic text-white mt-1">{value}</span>
      <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{label}</span>
    </V2Card>
  )
}

function MissionItem({ icon: Icon, title, done, onClick }: { icon: any; title: string; done: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cx(
        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
        done ? "bg-accent-lime/5 border-accent-lime/20" : "bg-white/5 border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cx(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          done ? "bg-accent-lime text-black" : "bg-white/5 text-text-muted"
        )}>
          <Icon size={18} />
        </div>
        <span className={cx(
          "text-xs font-black italic uppercase",
          done ? "text-accent-lime" : "text-white"
        )}>{title}</span>
      </div>
      {done ? (
        <V2Badge tone="success" className="text-[8px]">CONCLUÍDO</V2Badge>
      ) : (
        <ChevronRight size={16} className="text-text-muted" />
      )}
    </div>
  )
}
