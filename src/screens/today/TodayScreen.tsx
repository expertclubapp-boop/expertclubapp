import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Play, 
  ArrowRight, Flame, CheckCircle2, Trophy, Award, Zap, Star, Video
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import {
  PageShell,
} from '../../components/ui/Premium'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useProgress } from '../../hooks/useProgress'
import { useActiveChallenge, useLeaderboard, useUserBadges } from '../../hooks/useChallenges'
import { useContent } from '../../hooks/useContent'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function TodayScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { recentSessions, dailyHistory, dietDays, isLoading: progressLoading } = useProgress(firebaseUser?.uid)
  
  // Retention Hooks
  const { challenge, participant, isLoading: challengeLoading } = useActiveChallenge(firebaseUser?.uid)
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard(challenge?.id)
  const { badges, isLoading: badgesLoading } = useUserBadges(firebaseUser?.uid)
  const { items: contents, progress: contentProgress, isLoading: contentLoading } = useContent()

  const isLoading = profileLoading || progressLoading || challengeLoading || contentLoading || leaderboardLoading || badgesLoading

  const featuredContent = contents.find(c => c.featured && c.status === 'published') || contents[0]
  
  // Today's Date Key
  const todayKey = new Date().toISOString().split('T')[0]

  // Status checks for today
  const hasCheckedInToday = dailyHistory.some(d => d.dateKey === todayKey)
  const hasTrainedToday = recentSessions.some(s => s.status === 'completed' && s.startedAt && new Date(s.startedAt as any).toISOString().split('T')[0] === todayKey)
  const hasDietToday = dietDays.some(d => d.dateKey === todayKey && d.completedItemsCount > 0)

  // Streaks calculation
  const streakCheckins = useMemo(() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (dailyHistory.some(h => h.dateKey === key)) streak++
      else if (i > 0) break // stop at first missed day (allow missing today)
    }
    return streak
  }, [dailyHistory])

  // Next Action Logic
  const nextAction = useMemo(() => {
    if (featuredContent && !contentProgress[featuredContent.id]?.completedAt) {
      return { text: "Aula da Semana", desc: "Novo conteúdo disponível: " + featuredContent.title, action: () => navigate('/app/content') }
    }
    if (challenge && !participant) {
      return { text: "Entrar no Desafio", desc: "Participe do " + challenge.title, action: () => navigate('/app/challenges') }
    }
    if (!hasTrainedToday && profile?.selectedWorkoutId) return { text: "Concluir Missão: Treino", desc: "Mantenha sua sequência ativa.", action: () => navigate(`/app/workouts/${profile.selectedWorkoutId}`) }
    if (!hasDietToday && profile?.selectedDietId) return { text: "Concluir Missão: Dieta", desc: "Alimente seu corpo e suba no ranking.", action: () => navigate('/app/diets/today') }
    if (!hasCheckedInToday) return { text: "Fazer Check-in Diário", desc: "Marque sua participação na comunidade.", action: () => navigate('/app/checkin/daily') }
    return { text: "Comunidade Expert", desc: "Veja o que os outros membros estão fazendo.", action: () => navigate('/app/community') }
  }, [featuredContent, contentProgress, challenge, participant, hasDietToday, hasTrainedToday, hasCheckedInToday, profile, navigate])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  // Determine user rank
  const userRankIndex = leaderboard.findIndex(p => p.uid === firebaseUser?.uid)
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null
  const top3 = leaderboard.slice(0, 3)

  return (
    <PageShell wide className="space-y-6 pt-4 pb-12">
      {/* Header Profile & Streak */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-ec-violet overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser?.uid}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-display text-xl font-black italic uppercase text-white leading-none">Olá, {firebaseUser?.displayName?.split(' ')[0] || 'Atleta'}!</h2>
            <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">Mais um dia fora do achismo.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-ec-violet">
              <Flame className="w-5 h-5" />
              <span className="font-display text-2xl font-black italic leading-none">{streakCheckins}</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">Sequência Ativa</span>
          </div>
          {participant && (
            <div className="flex flex-col items-end border-l border-white/10 pl-4">
              <div className="flex items-center gap-2 text-accent-yellow">
                <Zap className="w-5 h-5" />
                <span className="font-display text-2xl font-black italic leading-none">{participant.points}</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">XP Points</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO ESQUERDO: Próxima Ação e Desafio */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Próxima Ação recomendada */}
          <motion.div {...fadeUp} className="ec-premium-cta rounded-3xl p-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-[0_8px_30px_rgba(91,75,255,0.2)]" onClick={nextAction.action}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Ação Recomendada
              </span>
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="font-display text-3xl font-black italic uppercase leading-none mb-2">{nextAction.text}</h3>
            <p className="text-sm font-medium opacity-90">{nextAction.desc}</p>
          </motion.div>

          {/* Desafio do Mês */}
          {challenge && (
            <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="ec-card rounded-3xl overflow-hidden relative group cursor-pointer" onClick={() => navigate('/app/challenges')}>
              <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/90 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800" 
                alt="Challenge" 
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:opacity-40 transition-opacity duration-700"
              />
              <div className="relative z-20 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-accent-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-yellow">Desafio do Mês</span>
                  </div>
                  <h3 className="font-display text-h3 text-white uppercase italic font-bold mb-2">{challenge.title}</h3>
                  <p className="text-sm text-text-muted max-w-md line-clamp-2">{challenge.description}</p>
                </div>
                
                {participant ? (
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-5 shrink-0 w-full md:w-48 text-center backdrop-blur-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-2">Seu Progresso</p>
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className="font-display text-3xl italic font-black text-white leading-none">{participant.completedMissions.length}</span>
                      <span className="text-sm text-text-muted font-bold pb-1">/ {challenge.missions.length}</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-ec-violet h-full rounded-full" style={{ width: `${(participant.completedMissions.length / challenge.missions.length) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <Button variant="primary" className="shrink-0 uppercase italic tracking-widest font-black text-xs px-6">Entrar no Desafio</Button>
                )}
              </div>
            </motion.section>
          )}

          {/* Aula da Semana (Conteúdo Novo) */}
          {featuredContent && (
            <motion.section {...fadeUp} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="ec-card p-6 rounded-3xl cursor-pointer hover:border-ec-violet/30 transition-colors" onClick={() => navigate('/app/content')}>
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-4 h-4 text-ec-violet" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet">Aula da Semana</span>
                </div>
                <div className="aspect-video bg-surface-2 rounded-xl mb-4 overflow-hidden relative">
                  {featuredContent.thumbnailUrl ? (
                    <img src={featuredContent.thumbnailUrl} alt={featuredContent.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/40"><Play className="w-8 h-8 text-white/50" /></div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">{featuredContent.category}</div>
                </div>
                <h4 className="font-display text-lg text-white uppercase italic font-bold line-clamp-1">{featuredContent.title}</h4>
              </div>

              {/* Badges Recentes */}
              <div className="ec-card p-6 rounded-3xl" onClick={() => navigate('/app/challenges')}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Suas Conquistas</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {badges.slice(0, 4).map(badge => (
                    <div key={badge.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-primary line-clamp-1">{badge.title}</p>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <div className="col-span-2 text-center p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                      <Award className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-xs text-text-muted">Complete missões para ganhar badges.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

        </div>

        {/* LADO DIREITO: Ranking & Comunidade */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Ranking da Comunidade */}
          <motion.section {...fadeUp} transition={{ delay: 0.2 }} className="ec-card p-6 rounded-3xl flex-1 cursor-pointer hover:border-white/10 transition-colors" onClick={() => navigate('/app/challenges')}>
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <h3 className="font-display text-xl text-white uppercase italic font-bold">Ranking</h3>
              <Trophy className="w-5 h-5 text-accent-yellow" />
            </div>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-4">
                {top3.map((p, idx) => (
                  <div key={p.uid} className={`flex items-center justify-between p-3 rounded-xl border ${p.uid === firebaseUser?.uid ? 'bg-ec-violet/10 border-ec-violet/30' : 'bg-surface-2 border-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-display text-lg italic font-black ${idx === 0 ? 'text-accent-yellow' : idx === 1 ? 'text-text-secondary' : 'text-orange-400'}`}>{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-white">{p.uid === firebaseUser?.uid ? 'Você' : `Expert #${p.uid.slice(0,4)}`}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{p.points} XP</span>
                  </div>
                ))}
                
                {userRank && userRank > 3 && participant && (
                  <>
                    <div className="flex justify-center text-white/20 text-xs py-1">...</div>
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-ec-violet/10 border-ec-violet/30">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg italic font-black text-ec-violet">{userRank}</span>
                        <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser?.uid}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-white">Você</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{participant.points} XP</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-10 italic">Nenhum ranking disponível no momento.</p>
            )}
            
            <Button variant="ghost" className="w-full border-subtle mt-6 text-xs" onClick={(e) => { e.stopPropagation(); navigate('/app/challenges')}}>Ver Ranking Completo</Button>
          </motion.section>

          {/* Quick Routine Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/app/workouts')} className="ec-card p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.03] transition-colors border border-white/5">
              <CheckCircle2 className={`w-6 h-6 ${hasTrainedToday ? 'text-accent-lime' : 'text-text-muted/30'}`} />
              <span className="text-[10px] uppercase font-black tracking-widest text-text-primary">Treino</span>
            </button>
            <button onClick={() => navigate('/app/diets/today')} className="ec-card p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.03] transition-colors border border-white/5">
              <CheckCircle2 className={`w-6 h-6 ${hasDietToday ? 'text-accent-lime' : 'text-text-muted/30'}`} />
              <span className="text-[10px] uppercase font-black tracking-widest text-text-primary">Dieta</span>
            </button>
          </div>

        </div>
      </div>
    </PageShell>
  )
}
