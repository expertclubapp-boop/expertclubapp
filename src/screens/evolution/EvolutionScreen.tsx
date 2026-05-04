import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  Ruler, 
  Accessibility,
  Camera,
  Activity,
  Utensils,
  TrendingUp
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useProgress } from '../../hooks/useProgress'
import { PageShell, SectionHeader } from '../../components/ui/Premium'

export function EvolutionScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { 
    weeklyHistory, 
    dailyHistory, 
    recentSessions, 
    bodyCheckins,
    dietDays,
    isLoading 
  } = useProgress(firebaseUser?.uid)

  // Aggregated Stats
  const currentWeight = bodyCheckins[0]?.weightKg || weeklyHistory[0]?.weightKg || 0
  const prevWeight = bodyCheckins[1]?.weightKg || weeklyHistory[1]?.weightKg || 0
  const weightDiff = currentWeight && prevWeight ? (currentWeight - prevWeight).toFixed(1) : '0.0'
  const isWeightDown = Number(weightDiff) <= 0

  const totalSessions = recentSessions.length
  const dietAdherence = dietDays.length > 0
    ? Math.round(dietDays.reduce((sum, item) => sum + item.adherencePercent, 0) / dietDays.length)
    : dailyHistory.length > 0 
    ? Math.round((dailyHistory.filter(d => d.followedDiet).length / dailyHistory.length) * 100)
    : 0

  const hasPhotos = bodyCheckins.some(b => Object.keys(b.photoUrls || {}).length > 0)

  // Timeline items
  const timeline = [
    ...bodyCheckins.map(b => ({ type: 'checkin', date: new Date(b.date), title: 'Check-in Evolutivo', data: `${b.weightKg}kg` })),
    ...recentSessions.map(s => ({ type: 'workout', date: new Date(s.startedAt as any), title: 'Treino Concluído', data: `${Math.floor((s.durationSeconds || 0) / 60)}min` })),
    ...dietDays.map(d => ({ type: 'diet', date: new Date(d.dateKey), title: 'Dieta Registrada', data: `${d.adherencePercent}% aderência` }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell wide>
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Dados de progresso"
            title="Evolução"
            description="Sua jornada de alta performance documentada em dados."
            tone="violet"
          />
          <div className="flex gap-4">
            <div className="ec-card p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-ec-violet/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-ec-violet" />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Streak Check-ins</p>
                <p className="font-display text-h3 text-text-primary">{dailyHistory.length} Total</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => navigate('/app/evolution/checkin')} className="flex-1 md:flex-none px-8">
              Novo Check-in
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Curva de Peso */}
          <div className="ec-card md:col-span-2 rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="font-display text-white uppercase text-lg italic font-bold">Curva de Peso</h3>
                <p className="text-text-muted text-sm font-body-md mt-1 max-w-sm">Peso sobe e desce diariamente devido à hidratação e sono. Olhe a tendência de longo prazo.</p>
              </div>
              <div className="text-right">
                <p className={`font-display text-h2 italic font-black ${isWeightDown ? 'text-accent-lime' : 'text-red-500'}`}>
                  {isWeightDown ? '' : '+'}{weightDiff}kg
                </p>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Diferença Total</p>
              </div>
            </div>
            
            <div className="h-48 w-full flex items-end gap-1.5 relative z-10">
              {[80, 78, 82, 75, 72, 70, 68, 65, 62].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className={`
                    flex-1 rounded-t-sm relative group/bar transition-all 
                    ${i > 5 ? 'bg-ec-violet/40' : 'bg-white/5'}
                    ${i === 8 ? 'bg-ec-violet shadow-[0_-4px_12px_rgba(91,75,255,0.3)]' : ''}
                  `}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="ec-card flex-1 rounded-2xl p-6 hover:border-accent-lime/30 transition-colors">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-4">Treinos concluídos</p>
              <div className="flex items-end justify-between">
                <span className="font-display text-h1 text-text-primary italic leading-none">{totalSessions}</span>
                <Dumbbell className="text-accent-lime w-6 h-6" />
              </div>
              <p className="mt-2 text-text-muted text-[11px]">Sua consistência na musculação constrói o resultado.</p>
            </div>
            <div className="ec-card flex-1 rounded-2xl p-6 hover:border-accent-sky/30 transition-colors">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-4">Adesão à dieta</p>
              <div className="flex items-end justify-between">
                <span className="font-display text-h1 text-text-primary italic leading-none">{dietAdherence}%</span>
                <Utensils className="text-accent-sky w-6 h-6" />
              </div>
              <p className="mt-2 text-text-muted text-[11px]">Aderência mostra o quanto você conseguiu seguir o plano. Não precisa ser perfeito, 80% já traz resultado.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LADO ESQUERDO: TIMELINE */}
          <div className="lg:col-span-5 ec-card rounded-2xl p-8">
            <h3 className="font-display text-white uppercase text-lg italic font-bold mb-6">Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-text-muted p-4 border border-white/10 border-dashed rounded-xl text-center">
                Você ainda não tem registros. Faça treinos ou check-ins para vê-los aqui.
              </p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {timeline.map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-bg-primary text-text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {item.type === 'checkin' && <Activity className="w-4 h-4 text-accent-purple" />}
                      {item.type === 'workout' && <Dumbbell className="w-4 h-4 text-accent-lime" />}
                      {item.type === 'diet' && <Utensils className="w-4 h-4 text-accent-sky" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/5 bg-white/[0.02] shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <time className="text-[10px] uppercase font-bold text-text-muted">{item.date.toLocaleDateString('pt-BR')}</time>
                      </div>
                      <div className="text-xs text-text-secondary">{item.data}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LADO DIREITO: FOTOS E MEDIDAS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="ec-card rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-white uppercase text-lg italic font-bold">Registro Visual</h3>
              </div>
              
              {!hasPhotos ? (
                <div className="bg-black/40 border border-white/10 border-dashed rounded-xl p-8 text-center flex flex-col items-center">
                  <Camera className="w-12 h-12 text-text-muted mb-4 opacity-50" />
                  <p className="text-white font-bold mb-2">Sem fotos registradas</p>
                  <p className="text-sm text-text-muted max-w-sm mb-6">Adicione fotos no próximo check-in evolutivo para comparar sua evolução ao longo do tempo.</p>
                  <Button variant="ghost" className="border-subtle" onClick={() => navigate('/app/evolution/checkin')}>Adicionar Fotos</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 h-64 relative group">
                  <div className="relative overflow-hidden rounded-xl border border-subtle">
                    <img 
                      src={bodyCheckins[1]?.photoUrls?.front || bodyCheckins[0]?.photoUrls?.front || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400"} 
                      alt="Foto de evolução anterior" 
                      className="w-full h-full object-cover grayscale opacity-60" 
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {bodyCheckins[1]?.date ? new Date(bodyCheckins[1].date).toLocaleDateString('pt-BR') : 'Anterior'}
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-accent-lime/30 shadow-[0_0_20px_rgba(183,255,60,0.1)]">
                    <img 
                      src={bodyCheckins[0]?.photoUrls?.front || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400"} 
                      alt="Foto de evolução atual" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-4 right-4 bg-accent-lime px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-bg-primary">
                      {bodyCheckins[0]?.date ? new Date(bodyCheckins[0].date).toLocaleDateString('pt-BR') : 'Atual'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ec-card rounded-2xl p-8">
              <h3 className="font-display text-white uppercase text-lg italic font-bold mb-6">Métricas Corporais</h3>
              <div className="space-y-6">
                <MeasurementRow icon={<Ruler className="w-5 h-5" />} label="Cintura" value={bodyCheckins[0]?.measurements?.waistCm ? `${bodyCheckins[0].measurements.waistCm} cm` : weeklyHistory[0]?.waistCm ? `${weeklyHistory[0].waistCm} cm` : '--'} delta="" />
                <MeasurementRow icon={<Dumbbell className="w-5 h-5" />} label="Braço" value={bodyCheckins[0]?.measurements?.armCm ? `${bodyCheckins[0].measurements.armCm} cm` : '--'} delta="" />
                <MeasurementRow icon={<Accessibility className="w-5 h-5" />} label="Abdômen" value={bodyCheckins[0]?.measurements?.abdomenCm ? `${bodyCheckins[0].measurements.abdomenCm} cm` : '--'} delta="" />
                <MeasurementRow icon={<Accessibility className="w-5 h-5" />} label="Quadril" value={bodyCheckins[0]?.measurements?.hipsCm ? `${bodyCheckins[0].measurements.hipsCm} cm` : '--'} delta="" />
              </div>
            </div>

          </div>
        </div>
      </PageShell>
  )
}

function MeasurementRow({ icon, label, value, delta, isDown }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-4">
        <div className="text-text-muted/30">{icon}</div>
        <span className="font-body-md text-text-primary/80 font-medium">{label}</span>
      </div>
      <div className="text-right">
        <p className="font-display font-bold text-text-primary text-sm">{value}</p>
        <p className={`text-[10px] font-bold ${isDown ? 'text-red-400' : 'text-accent-lime'}`}>{delta}</p>
      </div>
    </div>
  )
}
