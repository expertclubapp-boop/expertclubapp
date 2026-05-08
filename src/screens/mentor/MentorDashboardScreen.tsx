import {
  Activity,
  AlertCircle,
  Calendar,
  ClipboardCheck,
  Droplets,
  Dumbbell,
  Search,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react'
import { V2Card, V2IconBubble, V2Badge, V2Button, cx } from '../../components/v2/ExpertClubV2Base'
import { V2StatCard } from '../../components/v2/ExpertClubStatCard'

export function MentorDashboardScreen() {
  // Mock KPIs for the mentor
  const mentorKpis = [
    { label: 'Alunos Ativos', value: '42', icon: Users, tone: 'violet' },
    { label: 'Adesão Média', value: '88%', icon: Activity, tone: 'success' },
    { label: 'Check-ins Pendentes', value: '12', icon: ClipboardCheck, tone: 'warning' },
    { label: 'Treinos Concluídos', value: '156', icon: Dumbbell, tone: 'info' },
  ] as const

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* KPI GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {mentorKpis.map((kpi) => (
          <V2StatCard key={kpi.label} {...kpi} />
        ))}
      </section>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* CHART & ACTIVITY */}
        <div className="xl:col-span-8 space-y-8">
          <V2Card className="p-8">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <V2IconBubble icon={Activity} tone="success" size={16} />
                  <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Adesão dos Alunos</h3>
                </div>
                <V2Badge tone="success">↑ 12% ESTE MÊS</V2Badge>
             </div>
             
             {/* Placeholder for Chart */}
             <div className="h-64 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                <span className="text-[10px] font-black italic text-text-muted uppercase tracking-widest">Gráfico de Performance</span>
             </div>
          </V2Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <V2Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <V2IconBubble icon={Calendar} tone="violet" size={16} />
                  <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Agenda de hoje</h3>
                </div>
                <div className="space-y-4">
                   {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                         <div className="w-10 h-10 rounded-lg bg-ec-violet/10 flex flex-col items-center justify-center">
                            <span className="text-xs font-black text-white">09</span>
                            <span className="text-[8px] font-bold text-ec-violet">MAI</span>
                         </div>
                         <div>
                            <p className="text-xs font-black italic text-white uppercase">Check-in: João Silva</p>
                            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Acompanhamento Semanal</p>
                         </div>
                      </div>
                   ))}
                </div>
             </V2Card>

             <V2Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <V2IconBubble icon={Search} tone="neutral" size={16} />
                  <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Busca Rápida</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Nome do aluno..." 
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-bold placeholder:text-text-muted outline-none focus:border-ec-violet/50 transition-all"
                  />
                </div>
             </V2Card>
          </div>
        </div>

        {/* SIDEBAR ACTIONS */}
        <div className="xl:col-span-4 space-y-8">
          
          <V2Card className="p-6">
             <div className="flex items-center gap-2 mb-6">
                <V2IconBubble icon={AlertCircle} tone="warning" size={16} />
                <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Ações Pendentes</h3>
             </div>
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h4 className="text-white text-[10px] font-black italic uppercase mb-1">REVISAR CHECK-INS</h4>
                  <p className="text-text-muted text-[10px] mb-3">8 alunos enviaram check-ins que precisam de resposta.</p>
                  <V2Button variant="primary" className="h-7 text-[8px] font-black italic uppercase px-3">RESOLVER</V2Button>
                </div>
                <div className="p-4 rounded-2xl bg-ec-violet/10 border border-ec-violet/20">
                  <h4 className="text-ec-violet text-[10px] font-black italic uppercase mb-1">ATUALIZAR PLANOS</h4>
                  <p className="text-text-muted text-[10px] mb-3">O plano de 3 alunos expira nos próximos 7 dias.</p>
                  <V2Button variant="secondary" className="h-7 text-[8px] font-black italic uppercase px-3">ATUALIZAR</V2Button>
                </div>
             </div>
          </V2Card>

          <V2Card className="p-6">
             <div className="flex items-center gap-2 mb-6">
                <V2IconBubble icon={Sparkles} tone="info" size={16} />
                <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Métricas de Saúde</h3>
             </div>
             <div className="space-y-4">
                <HealthMetric icon={Droplets} label="Hidratação média" value="2,1L" tone="info" />
                <HealthMetric icon={Smartphone} label="Frequência App" value="4,2d" tone="violet" />
                <HealthMetric icon={Dumbbell} label="Treinos Concluídos" value="76%" tone="success" />
             </div>
          </V2Card>
        </div>
      </div>
    </div>
  )
}

function HealthMetric({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
       <div className="flex items-center gap-3">
          <div className={cx(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            tone === 'info' && "bg-accent-sky/10 text-accent-sky",
            tone === 'violet' && "bg-ec-violet/10 text-ec-violet",
            tone === 'success' && "bg-accent-lime/10 text-accent-lime"
          )}>
            <Icon size={16} />
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-sm font-black italic text-white uppercase">{value}</span>
    </div>
  )
}
