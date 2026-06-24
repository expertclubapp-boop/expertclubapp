import { useState, useMemo } from 'react'

import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  Users,
  Search,
  User,
  Dumbbell,
  Utensils,
  TrendingUp,
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import {
  useMentorAgenda,
  useMentorCheckins,
  useMentorFinance,
  useMentorInfluencers,
  useMentorOverview,
  useMentorReports,
  useMentorStudents,
} from '../../hooks/mentor/useMentorWorkspace'
import { V2Card, V2Badge, V2Button, V2Avatar, cx } from '../../components/v2/ExpertClubV2Base'
import { V2StatCard } from '../../components/v2/ExpertClubStatCard'
import { PrescriptionDrawer } from './PrescriptionDrawer'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function SectionHeader({ title, subtitle, eyebrow, isPartial }: { title: string; subtitle?: string; eyebrow?: string; isPartial?: boolean }) {
  return (
    <div className="mb-8 relative">
      {eyebrow && <span className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase mb-1 block">{eyebrow}</span>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
        </div>
        {isPartial && <SlicingNotice />}
      </div>
    </div>
  )
}

function SlicingNotice() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl max-w-[200px]">
      <AlertTriangle size={14} className="text-yellow-500 shrink-0" />
      <span className="text-[9px] font-black italic text-yellow-500 uppercase leading-tight">
        Exibindo recorte dos dados recentes para performance.
      </span>
    </div>
  )
}

export function MentorOverviewScreen() {
  const { user } = useAuth()
  const { data, isLoading } = useMentorOverview()

  if (isLoading) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Visão Geral"
        eyebrow="MENTOR DASHBOARD"
        subtitle={data?.scopeNote || 'Painel de mentoria do Expert Club'}
        isPartial={data?.isPartial}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <V2StatCard icon={Users} label="Alunos Ativos" value={data?.activeStudents ?? '--'} tone="violet" />
        <V2StatCard icon={ClipboardCheck} label="Check-ins Pendentes" value={data?.pendingCheckins ?? '--'} warning={(data?.pendingCheckins ?? 0) > 5} />
        <V2StatCard icon={Dumbbell} label="Treinos / Semana" value={data?.completedWorkoutsWeek ?? '--'} tone="info" />
        <V2StatCard icon={Utensils} label="Aderência Dieta" value={data?.averageDietAdherence != null ? `${Math.round(data.averageDietAdherence)}%` : '--'} tone="violet" />
        <V2StatCard icon={CircleDollarSign} label="MRR Estimado" value={formatCurrency(data?.estimatedMrr ?? 0)} tone="violet" />
        <V2StatCard icon={TrendingUp} label="Afiliados Ativos" value={data?.activeAffiliates ?? '--'} tone="info" />
      </div>

      {/* Alunos que precisam de atenção */}
      {(data?.attentionStudents?.length ?? 0) > 0 && (
        <V2Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-accent-yellow" />
            <h3 className="text-sm font-black uppercase tracking-widest text-accent-yellow">Alunos que precisam de atenção</h3>
          </div>
          <div className="space-y-3">
            {data!.attentionStudents.map((s) => (
              <div key={s.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <V2Avatar uid={s.uid} name={s.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.displayName}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest">{s.planName}</p>
                </div>
                <V2Badge tone={s.subscriptionStatus === 'active' ? 'violet' : 'danger'}>
                  {s.subscriptionStatus}
                </V2Badge>
              </div>
            ))}
          </div>
        </V2Card>
      )}

      {/* Boas vindas quando não há dados */}
      {!data && (
        <V2Card className="p-8 text-center">
          <User className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">Bem-vindo, {user?.displayName || 'Mentor'}. Os dados serão carregados em instantes.</p>
        </V2Card>
      )}
    </div>
  )
}


export function MentorStudentsScreen() {
  const navigate = useNavigate()
  const { data, isLoading } = useMentorStudents()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [prescriptionStudent, setPrescriptionStudent] = useState<{ uid: string; name: string } | null>(null)

  const filtered = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.filter((student) => {
      const haystack = `${student.displayName} ${student.email} ${student.planName}`.toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesStatus = status === 'all' || student.subscriptionStatus === status
      return matchesSearch && matchesStatus
    })
  }, [data?.rows, search, status])

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Alunos" 
        eyebrow="CARTEIRA DO MENTOR" 
        subtitle="Base real de alunos e histórico de engajamento." 
        isPartial={data?.isPartial} 
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-ec-violet transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar aluno..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold placeholder:text-text-muted focus:border-ec-violet/50 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            ['all', 'Todos'], ['active', 'Ativos'], ['past_due', 'Atraso'], ['cancelled', 'Cancelados']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatus(id)}
              className={cx(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                status === id ? "bg-ec-violet text-white" : "bg-white/5 text-text-muted hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <V2Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-white/5">
                <th className="p-4">Aluno</th>
                <th className="p-4">Plano</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Último Check-in</th>
                <th className="p-4 text-center">Aderência</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.uid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <V2Avatar uid={student.uid} name={student.displayName} size="sm" />
                      <div>
                        <p className="text-sm font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{student.displayName}</p>
                        <p className="text-[10px] text-text-muted font-bold">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold text-text-muted uppercase tracking-widest">{student.planName || 'Padrão'}</td>
                  <td className="p-4 text-center">
                    <V2Badge tone={student.subscriptionStatus === 'active' ? 'success' : 'warning'}>
                      {student.subscriptionStatus?.toUpperCase()}
                    </V2Badge>
                  </td>
                  <td className="p-4 text-center text-xs text-text-muted font-bold">{formatDate(student.lastDailyCheckinAt)}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black italic text-white">{student.adherencePercent ?? '-'}%</span>
                      <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-ec-violet" style={{ width: `${student.adherencePercent || 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <V2Button
                        variant="ghost"
                        onClick={() => navigate(`/mentor/students/${student.uid}`)}
                        className="h-8 px-3 text-[10px] font-black uppercase italic"
                      >
                        <User className="w-3.5 h-3.5 mr-1" />
                        PERFIL
                      </V2Button>
                      <V2Button
                        variant="secondary"
                        onClick={() => setPrescriptionStudent({ uid: student.uid, name: student.displayName })}
                        className="h-8 px-4 text-[10px] font-black uppercase italic"
                      >
                        PRESCREVER
                      </V2Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </V2Card>

      <AnimatePresence>
        {prescriptionStudent && (
          <PrescriptionDrawer
            studentId={prescriptionStudent.uid}
            studentName={prescriptionStudent.name}
            onClose={() => setPrescriptionStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function MentorCheckinsScreen() {
  const { data, isLoading } = useMentorCheckins()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.filter((row) => `${row.displayName} ${row.email}`.toLowerCase().includes(search.toLowerCase()))
  }, [data?.rows, search])

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Check-ins" 
        eyebrow="ACOMPANHAMENTO" 
        subtitle="Fila real de follow-ups diários e semanais." 
        isPartial={data?.isPartial}
      />

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-ec-violet transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar aluno..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold placeholder:text-text-muted focus:border-ec-violet/50 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((row) => (
          <V2Card key={row.uid} className="p-6 space-y-4">
             <div className="flex items-center gap-3">
                <V2Avatar uid={row.uid} name={row.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black italic text-white uppercase truncate">{row.displayName}</p>
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{row.pendingCheckinDays ?? 0} DIAS SEM CHECK-IN</p>
                </div>
                <V2Badge tone={row.needsAttention ? 'warning' : 'success'}>
                  {row.needsAttention ? 'ATENÇÃO' : 'OK'}
                </V2Badge>
             </div>

             <div className="space-y-2 py-4 border-y border-white/5">
                <CheckinRow label="Diário" date={formatDate(row.lastDailyCheckinAt)} />
                <CheckinRow label="Semanal" date={formatDate(row.lastWeeklyCheckinAt)} />
                <CheckinRow label="Corporal" date={formatDate(row.lastBodyCheckinAt)} />
             </div>

             <V2Button
               variant="primary"
               disabled
               title="Historico detalhado ainda nao esta disponivel no workspace do mentor."
               className="w-full h-10 text-[10px] font-black uppercase italic"
             >
               ABRIR HISTÓRICO
             </V2Button>
          </V2Card>
        ))}
      </div>
    </div>
  )
}

function CheckinRow({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-black italic text-white uppercase">{date}</span>
    </div>
  )
}

export function MentorFinanceScreen() {
  const { data, isLoading } = useMentorFinance()

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Financeiro" 
        eyebrow="RECEITA E COMISSÕES" 
        subtitle="Visão real de receita, risco e ganhos na sua carteira." 
        isPartial={data?.isPartial}
      />

      {data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <V2StatCard label="MRR Estimado" value={formatCurrency(data.estimatedMrr)} icon={CircleDollarSign} tone="success" />
            <V2StatCard label="Receita em Risco" value={formatCurrency(data.revenueAtRisk)} icon={AlertTriangle} tone="warning" />
            <V2StatCard label="Comissão Pendente" value={formatCurrency(data.pendingCommissions)} icon={CircleDollarSign} tone="info" />
            <V2StatCard label="Comissão Paga" value={formatCurrency(data.paidCommissions)} icon={Users} tone="neutral" />
          </section>

          <V2Card className="p-0 overflow-hidden">
             <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Mix de Planos</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white/[0.02] text-[10px] font-black uppercase text-text-muted tracking-widest">
                     <th className="p-6">Plano</th>
                     <th className="p-6 text-center">Alunos</th>
                     <th className="p-6 text-right">Receita Total</th>
                   </tr>
                 </thead>
                 <tbody>
                    {data.planMix.map((row) => (
                      <tr key={row.planName} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 text-sm font-black italic text-white uppercase">{row.planName}</td>
                        <td className="p-6 text-center text-sm font-bold text-text-muted">{row.students}</td>
                        <td className="p-6 text-right text-sm font-black italic text-ec-violet">{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </V2Card>
        </>
      )}
    </div>
  )
}

export function MentorInfluencersScreen() {
  const { data, isLoading } = useMentorInfluencers()

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Influencers" 
        eyebrow="AFILIADOS VINCULADOS" 
        subtitle="Parceiros que trouxeram alunos para sua carteira." 
        isPartial={data?.isPartial}
      />

      <V2Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black uppercase text-text-muted tracking-widest">
                <th className="p-6">Influencer</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-center">Alunos</th>
                <th className="p-6 text-right">Comissão Pendente</th>
                <th className="p-6 text-right">Total Pago</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((affiliate) => (
                <tr key={affiliate.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <V2Avatar uid={affiliate.id} name={affiliate.name} size="sm" />
                      <div>
                        <p className="text-sm font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{affiliate.name}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase">{affiliate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <V2Badge tone={affiliate.status === 'active' ? 'success' : 'neutral'}>
                      {affiliate.status?.toUpperCase()}
                    </V2Badge>
                  </td>
                  <td className="p-6 text-center font-black italic text-white">{affiliate.referredStudents}</td>
                  <td className="p-6 text-right font-black italic text-accent-yellow">{formatCurrency(affiliate.pendingCommission)}</td>
                  <td className="p-6 text-right font-black italic text-ec-violet">{formatCurrency(affiliate.totalCommissionPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </V2Card>
    </div>
  )
}

export function MentorAgendaScreen() {
  const { data, isLoading } = useMentorAgenda()
  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>
  return (
    <div className="space-y-8">
      <SectionHeader title="Agenda" eyebrow="PRÓXIMOS PASSOS" subtitle="Follow-ups e renovações agendadas." />
      <div className="grid grid-cols-1 gap-3">
         {data?.map(item => (
            <V2Card key={item.id} className="p-4 flex items-center justify-between group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-ec-violet">
                     <CalendarClock size={20} />
                  </div>
                  <div>
                     <p className="text-sm font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{item.title}</p>
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{item.subtitle}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black italic text-white uppercase">{formatDate(item.dueDate)}</span>
                  <V2Button variant="secondary" className="h-8 px-4 text-[10px] font-black uppercase italic" onClick={() => window.location.href = item.href}>ABRIR</V2Button>
               </div>
            </V2Card>
         ))}
      </div>
    </div>
  )
}

export function MentorReportsScreen() {
  const { data, isLoading } = useMentorReports()
  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>
  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Relatórios" 
        eyebrow="ANÁLISE DE BASE" 
        subtitle="Resumo operacional e pontos de queda." 
        isPartial={data?.isPartial}
      />
      {data && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <V2StatCard label="Ativos 7d" value={String(data.activeIn7Days)} icon={Users} tone="violet" />
          <V2StatCard label="Alunos Dormentes" value={String(data.dormantStudents)} icon={CalendarClock} tone="warning" />
          <V2StatCard label="Alta Aderência" value={String(data.highAdherenceStudents)} icon={ClipboardCheck} tone="success" />
        </section>
      )}
    </div>
  )
}

export function MentorSettingsScreen() {
  const { user } = useAuth()
  const { profile, isLoading } = useProfile()
  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>
  return (
    <div className="space-y-8">
      <SectionHeader title="Configurações" eyebrow="MINHA CONTA" subtitle="Gestão operacional e dados do mentor." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <V2Card className="p-6">
            <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Dados Conectados</h3>
            <div className="space-y-4">
               <DataField label="Nome" value={user?.displayName || '-'} />
               <DataField label="Email" value={user?.email || '-'} />
               <DataField label="Role" value={user?.role || '-'} />
               <DataField label="Objetivo" value={profile?.goal || '-'} />
            </div>
         </V2Card>
      </div>
    </div>
  )
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}

export function MentorWorkoutPrescriptorScreen() { return <div className="p-10 text-center text-text-muted font-black italic uppercase">Módulo de Prescrição V2 em breve.</div> }
export { MentorDietPrescriptorScreen } from './MentorDietPrescriptorScreen'
