import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Star, 
  Trophy, 
  Zap, 
  Share2, 
  Dumbbell, 
  Utensils, 
  CheckCircle2,
  Award,
  Lock,
  TrendingUp,
  Droplets,
  Video
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useActiveChallenge, useLeaderboard, useUserBadges } from '../../hooks/useChallenges'
import { challengeService } from '../../services/challengeService'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import type { ChallengeMission } from '../../types/domain'

export function ChallengesScreen() {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { challenge, participant, isLoading: isChallengeLoading } = useActiveChallenge(firebaseUser?.uid, challengeId)
  const { leaderboard, isLoading: isLeaderboardLoading } = useLeaderboard(challenge?.id)
  const { badges } = useUserBadges(firebaseUser?.uid)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<'missions' | 'ranking' | 'badges'>('missions')

  const handleJoin = async () => {
    if (!challenge || !firebaseUser) return
    setIsJoining(true)
    try {
      await challengeService.joinChallenge(
        challenge.id, 
        firebaseUser.uid, 
        firebaseUser.displayName || 'Expert',
        firebaseUser.photoURL || undefined
      )
      window.location.reload()
    } catch (error) {
      console.error("Error joining challenge:", error)
    } finally {
      setIsJoining(false)
    }
  }

  const timeLeft = useMemo(() => {
    if (!challenge) return null
    const end = new Date(challenge.endsAt).getTime()
    const now = new Date().getTime()
    const diff = end - now
    if (diff <= 0) return { d: 0, h: 0, m: 0 }
    
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    }
  }, [challenge])

  if (isChallengeLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Award className="w-16 h-16 text-text-muted/20 mx-auto mb-6" />
        <h2 className="font-display text-h2 text-text-primary mb-4 italic uppercase">Nenhum desafio ativo</h2>
        <p className="text-text-muted mb-8 text-sm">Nenhum desafio ativo no momento. Quando o próximo desafio abrir, ele aparecerá aqui.</p>
        <Button variant="ghost" onClick={() => navigate('/app/today')}>Voltar ao Início</Button>
      </div>
    )
  }

  return (
    <PageShell wide>
      {/* Challenge Hero Banner */}
      <section className="ec-hero-shell relative w-full rounded-3xl overflow-hidden mb-12 group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200" 
          alt="Challenge" 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-1000"
        />
        <div className="relative z-20 flex flex-col justify-center p-8 md:p-12 min-h-[320px]">
          <div className="flex items-center gap-2 text-ec-violet mb-4">
            <Star className="w-5 h-5 fill-ec-violet" />
            <span className="font-display text-[10px] font-black uppercase tracking-[0.2em]">{challenge.monthKey} • Desafio Ativo</span>
          </div>
          <h2 className="font-display text-h2 md:text-h1 text-text-primary mb-2 leading-none uppercase italic max-w-2xl">
            {challenge.title}
          </h2>
          <p className="text-text-secondary text-sm md:text-base max-w-xl mb-8 font-body-md line-clamp-2">{challenge.description}</p>
          
          <div className="flex flex-wrap gap-8 items-end">
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-3">Encerramento em</p>
              <div className="flex gap-4">
                <TimeUnit value={timeLeft?.d || 0} label="Dias" />
                <span className="text-ec-violet/30 text-2xl font-black">:</span>
                <TimeUnit value={timeLeft?.h || 0} label="Horas" />
                <span className="text-ec-violet/30 text-2xl font-black">:</span>
                <TimeUnit value={timeLeft?.m || 0} label="Min" />
              </div>
            </div>
            <div className="border-l border-white/10 pl-8 hidden md:block">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-3">Recompensas</p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-accent-sky/20 border border-accent-sky/30 flex items-center justify-center"><Award className="w-4 h-4 text-accent-sky" /></div>
                   <div className="w-8 h-8 rounded-full bg-accent-yellow/20 border border-accent-yellow/30 flex items-center justify-center"><Zap className="w-4 h-4 text-accent-yellow" /></div>
                </div>
                <span className="font-display text-sm text-text-primary italic font-bold uppercase tracking-widest">Badges & XP</span>
              </div>
            </div>
            {!participant && (
              <div className="ml-auto">
                <Button variant="primary" className="px-10 h-14 font-black uppercase italic shadow-xl" onClick={handleJoin} isLoading={isJoining}>
                  Quero Participar
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
        <TabButton active={activeTab === 'missions'} onClick={() => setActiveTab('missions')} label="Missões" icon={<Zap className="w-3.5 h-3.5" />} />
        <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} label="Ranking" icon={<Trophy className="w-3.5 h-3.5" />} />
        <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} label="Badges" icon={<Award className="w-3.5 h-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          {activeTab === 'missions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-h3 text-white uppercase italic font-bold">Objetivos</h3>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{challenge.missions.length} Missões Disponíveis</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenge.missions.map(mission => (
                  <MissionCard 
                    key={mission.id} 
                    mission={mission} 
                    completed={participant?.completedMissions?.some(m => m.missionId === mission.id)}
                    locked={!participant}
                  />
                ))}
              </div>
              
              {!participant && (
                <div className="ec-card p-10 rounded-3xl text-center border-dashed">
                  <Lock className="w-10 h-10 text-white/10 mx-auto mb-4" />
                  <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">Você precisa entrar no desafio para começar a completar as missões e ganhar pontos.</p>
                  <Button variant="ghost" onClick={handleJoin} isLoading={isJoining} className="uppercase tracking-widest text-xs font-black">Entrar Agora</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="ec-card rounded-3xl overflow-hidden">
               <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-display text-h3 text-white uppercase italic font-bold">Ranking de Performance</h3>
                  <TrendingUp className="w-5 h-5 text-ec-violet opacity-50" />
               </div>
               <div className="divide-y divide-white/5">
                  {isLeaderboardLoading ? (
                    <div className="p-20 text-center text-text-muted text-sm">Carregando ranking...</div>
                  ) : leaderboard.length === 0 ? (
                    <div className="p-20 text-center text-text-muted text-sm italic">Nenhum competidor ainda.</div>
                  ) : leaderboard.map((p, idx) => (
                    <LeaderboardRow key={p.uid} participant={p} rank={idx + 1} isMe={p.uid === firebaseUser?.uid} />
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
                {/* Potenciais Badges do Desafio (Locked) */}
                {challenge.badges.map(badgeId => (
                  <BadgeCard key={badgeId} badgeId={badgeId} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: User Progress */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            {participant && (
              <div className="ec-card rounded-3xl p-8 relative overflow-hidden ec-highlight-ring">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="w-24 h-24 text-ec-violet" />
                </div>
                <h3 className="font-display text-sm text-ec-violet mb-6 uppercase font-black tracking-widest">Seu Progresso</h3>
                
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-text-muted text-[9px] uppercase font-black tracking-[0.2em] mb-1">XP Points</p>
                    <span className="font-display text-h1 text-text-primary italic font-black leading-none">{participant.points}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted text-[9px] uppercase font-black tracking-[0.2em] mb-1">Rank</p>
                    <span className="font-display text-h2 italic font-bold text-white">#{leaderboard.findIndex(p => p.uid === firebaseUser?.uid) + 1 || '---'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[9px] font-black uppercase text-text-muted tracking-widest">
                    <span>Missões: {participant.completedMissions?.length || 0} / {challenge.missions.length}</span>
                    <span className="text-ec-violet">{Math.round(((participant.completedMissions?.length || 0) / challenge.missions.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-ec-violet h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${((participant.completedMissions?.length || 0) / challenge.missions.length) * 100}%` }} 
                    />
                  </div>
                </div>

                <button className="w-full mt-10 bg-white/5 border border-white/5 text-text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <Share2 className="w-4 h-4 text-ec-violet" /> Compartilhar Ranking
                </button>
              </div>
            )}

            <div className="ec-card rounded-3xl p-8">
               <h4 className="font-display text-xs text-white mb-6 uppercase font-black tracking-widest">Regras & Premiação</h4>
               <ul className="space-y-4">
                 {challenge.rules.map((rule, idx) => (
                   <li key={idx} className="flex gap-3 text-xs text-text-muted font-body-md">
                     <span className="text-ec-violet font-black">0{idx + 1}.</span>
                     <span>{rule}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function TimeUnit({ value, label }: any) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-h3 md:text-h2 text-text-primary italic font-black tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[8px] text-text-muted uppercase font-bold tracking-widest">{label}</span>
    </div>
  )
}

function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-ec-violet text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  )
}

function MissionCard({ mission, completed, locked }: { mission: ChallengeMission, completed?: boolean, locked?: boolean }) {
  const Icon = useMemo(() => {
    switch (mission.type) {
      case 'workout_completed': return Dumbbell
      case 'diet_adherence': return Utensils
      case 'hydration_goal': return Droplets
      case 'daily_checkin':
      case 'weekly_checkin':
      case 'body_checkin': return CheckCircle2
      case 'content_completed': return Video
      default: return Zap
    }
  }, [mission.type])

  return (
    <div className={`p-6 rounded-2xl border transition-all relative group ${completed ? 'bg-accent-lime/[0.03] border-accent-lime/20' : 'ec-card hover:bg-white/[0.03]'} ${locked ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${completed ? 'bg-accent-lime/10 text-accent-lime' : 'bg-surface-2 text-text-muted'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <div className={`px-2 py-1 rounded text-[8px] font-black tracking-widest mb-1 ${completed ? 'bg-accent-lime/20 text-accent-lime' : 'bg-white/5 text-text-muted'}`}>
            {completed ? 'COMPLETA' : mission.type.toUpperCase()}
          </div>
          <div className="flex items-center gap-1">
            <Zap className={`w-3 h-3 ${completed ? 'text-accent-lime' : 'text-accent-yellow'}`} />
            <span className="text-[10px] font-black text-white italic">+{mission.points}</span>
          </div>
        </div>
      </div>
      <h4 className={`font-display text-base italic font-black mb-1 uppercase ${completed ? 'text-text-primary/50' : 'text-text-primary'}`}>{mission.title}</h4>
      <p className={`text-xs font-body-md ${completed ? 'text-text-muted/50' : 'text-text-muted'}`}>{mission.description}</p>
      
      {completed && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-5 h-5 text-accent-lime" />
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({ participant, rank, isMe }: any) {
  const isTop3 = rank <= 3
  const rankColors = {
    1: 'text-accent-yellow',
    2: 'text-text-secondary',
    3: 'text-orange-400'
  } as Record<number, string>

  return (
    <div className={`flex items-center justify-between p-5 transition-all ${isMe ? 'bg-accent-lime/5' : 'hover:bg-white/[0.02]'}`}>
      <div className="flex items-center gap-5">
        <div className="flex items-center justify-center w-8">
          {isTop3 ? (
            <Trophy className={`w-5 h-5 ${rankColors[rank]}`} />
          ) : (
            <span className="font-display font-black text-lg italic text-text-muted/30">{rank}</span>
          )}
        </div>
        <div className="w-12 h-12 rounded-full border border-white/5 bg-surface-2 overflow-hidden">
           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.uid}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-bold">{isMe ? 'Você' : `Expert #${participant.uid.slice(0, 4)}`}</p>
            {isMe && <span className="bg-ec-violet/10 text-ec-violet text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Eu</span>}
          </div>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Nível {Math.floor(participant.points / 500) + 1}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display font-black text-lg italic text-white leading-none">{participant.points}</p>
        <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest mt-1">XP Points</p>
      </div>
    </div>
  )
}

function BadgeCard({ badge, badgeId, earned }: { badge?: any, badgeId?: string, earned?: boolean }) {
  if (!badge && !badgeId) return null
  
  // Raridade colors
  const rarityColors = {
    common: 'from-text-muted/20 to-text-muted/5 border-white/5 text-text-muted',
    rare: 'from-accent-sky/20 to-accent-sky/5 border-accent-sky/20 text-accent-sky',
    epic: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    legendary: 'from-accent-yellow/20 to-accent-yellow/5 border-accent-yellow/20 text-accent-yellow'
  } as Record<string, string>

  const b = badge || { title: 'Badge Bloqueado', icon: '🔒', rarity: 'common' }
  const isEarned = earned || false

  return (
    <div className={`ec-card p-6 rounded-3xl text-center flex flex-col items-center group transition-all ${isEarned ? 'ec-highlight-ring' : 'opacity-40 grayscale'}`}>
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-4xl mb-4 border ${rarityColors[b.rarity || 'common']}`}>
        {b.icon}
      </div>
      <h5 className="text-white text-[10px] font-black uppercase tracking-widest mb-1">{b.title}</h5>
      <span className={`text-[8px] font-bold uppercase tracking-tighter ${rarityColors[b.rarity || 'common'].split(' ').pop()}`}>
        {b.rarity?.toUpperCase() || 'COMUM'}
      </span>
    </div>
  )
}
