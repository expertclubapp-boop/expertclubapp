import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  Dumbbell,
  FileText,
  Salad,
  Settings,
  Users,
} from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
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
import { AdminSearchFilter, AdminState, AdminToolbar } from '../admin/AdminShared'
import { AdminDietsScreen, AdminWorkoutsScreen } from '../admin/AdminCatalogScreens'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function ScopeNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-accent-yellow/20 bg-accent-yellow/10 px-4 py-3 text-sm text-accent-yellow">
      {text}
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}

export function MentorOverviewScreen() {
  const { data, isLoading, error } = useMentorOverview()

  return (
    <PageShell wide>
      <AdminToolbar
        title="Visao geral"
        eyebrow="Mentor"
        description="Acompanhamento real dos alunos, com agregacao honesta sobre o schema atual."
      />
      {data && <ScopeNote text={data.scopeNote} />}
      <div className="mt-6">
        <AdminState isLoading={isLoading} error={error} empty={!data}>
          {data && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard label="Alunos ativos" value={String(data.activeStudents)} icon={<Users className="h-4 w-4" />} />
                <MetricCard label="Check-ins pendentes" value={String(data.pendingCheckins)} icon={<ClipboardCheck className="h-4 w-4" />} />
                <MetricCard label="Treinos na semana" value={String(data.completedWorkoutsWeek)} icon={<Dumbbell className="h-4 w-4" />} />
                <MetricCard label="Aderencia media" value={data.averageDietAdherence === null ? '-' : `${data.averageDietAdherence}%`} icon={<Salad className="h-4 w-4" />} />
                <MetricCard label="MRR estimado" value={formatCurrency(data.estimatedMrr)} icon={<CircleDollarSign className="h-4 w-4" />} />
                <MetricCard label="Afiliados ativos" value={String(data.activeAffiliates)} icon={<Users className="h-4 w-4" />} />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className="ec-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Atencao imediata</p>
                      <h2 className="mt-2 font-display text-2xl font-black italic text-white">Alunos pedindo follow-up</h2>
                    </div>
                    <Link to="/mentor/checkins" className="text-xs font-bold text-accent-sky hover:underline">
                      Abrir check-ins
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {data.attentionStudents.map((student) => (
                      <div key={student.uid} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{student.displayName}</p>
                            <p className="text-xs text-text-muted">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-accent-yellow">
                              {student.pendingCheckinDays ?? '-'} dias sem check-in
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-text-muted">
                              Ultimo treino {formatDate(student.lastWorkoutAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.attentionStudents.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-text-muted">
                        Nenhum aluno precisa de follow-up imediato agora.
                      </div>
                    )}
                  </div>
                </div>

                <div className="ec-card rounded-2xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Atalhos reais</p>
                  <h2 className="mt-2 font-display text-2xl font-black italic text-white">Proximas acoes</h2>
                  <div className="mt-5 space-y-3">
                    <Link to="/mentor/checkins" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                      Revisar check-ins
                      <ArrowRight className="h-4 w-4 text-accent-sky" />
                    </Link>
                    <Link to="/mentor/treinos/prescritor" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                      Atualizar treinos
                      <ArrowRight className="h-4 w-4 text-accent-sky" />
                    </Link>
                    <Link to="/mentor/dietas/prescritor" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                      Atualizar dietas
                      <ArrowRight className="h-4 w-4 text-accent-sky" />
                    </Link>
                    <Link to="/mentor/financeiro" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                      Ver financeiro
                      <ArrowRight className="h-4 w-4 text-accent-sky" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          )}
        </AdminState>
      </div>
    </PageShell>
  )
}

export function MentorStudentsScreen() {
  const { data, isLoading, error } = useMentorStudents()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((student) => {
      const haystack = `${student.displayName} ${student.email} ${student.planName}`.toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesStatus = status === 'all' || student.subscriptionStatus === status
      return matchesSearch && matchesStatus
    })
  }, [data, search, status])

  return (
    <PageShell wide>
      <AdminToolbar title="Alunos" eyebrow="Mentor" description="Base real de alunos ativos e historico recente de engajamento." />
      <AdminSearchFilter
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        statuses={[
          ['all', 'Todos'],
          ['active', 'Ativos'],
          ['trialing', 'Trial'],
          ['past_due', 'Em atraso'],
          ['cancelled', 'Cancelados'],
        ]}
      />
      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {['Aluno', 'Plano', 'Status', 'Ultimo check-in', 'Ultimo treino', 'Aderencia', 'Atencao'].map((heading) => (
                    <th key={heading} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((student) => (
                  <tr key={student.uid}>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{student.displayName}</p>
                      <p className="text-[10px] text-text-muted">{student.email}</p>
                    </td>
                    <td className="p-4 text-xs text-text-secondary">{student.planName}</td>
                    <td className="p-4 text-xs text-text-secondary">{student.subscriptionStatus}</td>
                    <td className="p-4 text-xs text-text-secondary">{formatDate(student.lastDailyCheckinAt)}</td>
                    <td className="p-4 text-xs text-text-secondary">{formatDate(student.lastWorkoutAt)}</td>
                    <td className="p-4 text-xs font-bold text-white">{student.adherencePercent === null ? '-' : `${student.adherencePercent}%`}</td>
                    <td className="p-4 text-xs font-bold text-accent-yellow">
                      {student.pendingCheckinDays === null ? 'Sem historico' : `${student.pendingCheckinDays} dias`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
    </PageShell>
  )
}

export function MentorCheckinsScreen() {
  const { data, isLoading, error } = useMentorCheckins()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((row) => {
      const matchesSearch = `${row.displayName} ${row.email}`.toLowerCase().includes(search.toLowerCase())
      const matchesFilter =
        filter === 'all' ||
        (filter === 'attention' && row.needsAttention) ||
        (filter === 'healthy' && !row.needsAttention)
      return matchesSearch && matchesFilter
    })
  }, [data, search, filter])

  return (
    <PageShell wide>
      <AdminToolbar title="Check-ins" eyebrow="Mentor" description="Fila real de acompanhamento diario, semanal e corporal." />
      <AdminSearchFilter
        search={search}
        onSearch={setSearch}
        status={filter}
        onStatus={setFilter}
        statuses={[
          ['all', 'Todos'],
          ['attention', 'Com atencao'],
          ['healthy', 'Em dia'],
        ]}
      />
      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="grid gap-3">
          {filtered.map((row) => (
            <div key={row.uid} className="ec-card rounded-2xl p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{row.displayName}</p>
                  <p className="text-xs text-text-muted">{row.email}</p>
                </div>
                <div className="grid gap-3 text-xs text-text-secondary md:grid-cols-4">
                  <span>Diario: {formatDate(row.lastDailyCheckinAt)}</span>
                  <span>Semanal: {formatDate(row.lastWeeklyCheckinAt)}</span>
                  <span>Corporal: {formatDate(row.lastBodyCheckinAt)}</span>
                  <span className={row.needsAttention ? 'font-bold text-accent-yellow' : 'font-bold text-accent-lime'}>
                    {row.pendingCheckinDays === null ? 'Sem historico' : `${row.pendingCheckinDays} dias sem diario`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminState>
    </PageShell>
  )
}

export function MentorAgendaScreen() {
  const { data, isLoading, error } = useMentorAgenda()

  return (
    <PageShell wide>
      <AdminToolbar title="Agenda" eyebrow="Mentor" description="Proximos follow-ups e renovacoes identificados pelos dados atuais." />
      <AdminState isLoading={isLoading} error={error} empty={!data || data.length === 0}>
        <div className="grid gap-3">
          {data?.map((item) => (
            <div key={item.id} className="ec-card rounded-2xl p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-text-muted">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary">{formatDate(item.dueDate)}</span>
                  <Link to={item.href} className="text-xs font-bold text-accent-sky hover:underline">
                    Abrir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminState>
    </PageShell>
  )
}

export function MentorFinanceScreen() {
  const { user: currentUser } = useAuth()
  const { data, isLoading, error } = useMentorFinance()

  // MRR is unreliable if price=0 on all subscriptions (common when not set manually)
  const hasPriceData = data ? data.planMix.some(r => r.revenue > 0) : true
  const isMentorRole = currentUser?.role === 'mentor'

  return (
    <PageShell wide>
      <AdminToolbar title="Financeiro" eyebrow="Mentor" description="Visao real de receita, risco e comissoes dentro do schema atual." />
      {data && <ScopeNote text={data.scopeNote} />}
      {/* MRR quality guard — only for mentor role */}
      {data && isMentorRole && !hasPriceData && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-muted">
          <span className="font-bold text-white">Receita nao disponivel com o schema atual.</span>{' '}
          Os campos <code className="font-mono text-xs">subscription.price</code> dos seus alunos estao zerados ou
          ausentes. Os totais de MRR e receita em risco abaixo serao R$ 0,00 ate que os valores sejam preenchidos.
          Contate o admin para corrigir as assinaturas.
        </div>
      )}
      <div className="mt-6">
        <AdminState isLoading={isLoading} error={error} empty={!data}>
          {data && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard label="MRR estimado" value={formatCurrency(data.estimatedMrr)} icon={<CircleDollarSign className="h-4 w-4" />} />
                <MetricCard label="Receita em risco" value={formatCurrency(data.revenueAtRisk)} icon={<AlertTriangle className="h-4 w-4" />} />
                <MetricCard label="Alunos ativos" value={String(data.activeStudents)} icon={<Users className="h-4 w-4" />} />
                <MetricCard label="Alunos em atraso" value={String(data.overdueStudents)} icon={<AlertTriangle className="h-4 w-4" />} />
                <MetricCard label="Comissao pendente" value={formatCurrency(data.pendingCommissions)} icon={<CircleDollarSign className="h-4 w-4" />} />
                <MetricCard label="Comissao paga" value={formatCurrency(data.paidCommissions)} icon={<CircleDollarSign className="h-4 w-4" />} />
              </section>

              <section className="ec-card rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Mix de planos</p>
                <h2 className="mt-2 font-display text-2xl font-black italic text-white">Receita por plano</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        {['Plano', 'Alunos', 'Receita'].map((heading) => (
                          <th key={heading} className="pb-3 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.planMix.map((row) => (
                        <tr key={row.planName}>
                          <td className="py-4 text-sm font-bold text-white">{row.planName}</td>
                          <td className="py-4 text-xs text-text-secondary">{row.students}</td>
                          <td className="py-4 text-xs text-text-secondary">{formatCurrency(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </AdminState>
      </div>
    </PageShell>
  )
}

export function MentorReportsScreen() {
  const { data, isLoading, error } = useMentorReports()

  return (
    <PageShell wide>
      <AdminToolbar title="Relatorios" eyebrow="Mentor" description="Resumo operacional dos alunos mais ativos e dos pontos de queda." />
      {data && <ScopeNote text={data.scopeNote} />}
      <div className="mt-6">
        <AdminState isLoading={isLoading} error={error} empty={!data}>
          {data && (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Ativos em 7 dias" value={String(data.activeIn7Days)} icon={<Users className="h-4 w-4" />} />
                <MetricCard label="Dormentes" value={String(data.dormantStudents)} icon={<CalendarClock className="h-4 w-4" />} />
                <MetricCard label="Alta aderencia" value={String(data.highAdherenceStudents)} icon={<ClipboardCheck className="h-4 w-4" />} />
              </section>

              <section className="ec-card rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Base operacional</p>
                <h2 className="mt-2 font-display text-2xl font-black italic text-white">Ultima atividade por aluno</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        {['Aluno', 'Ultima atividade', 'Check-in', 'Treino', 'Aderencia'].map((heading) => (
                          <th key={heading} className="pb-3 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.rows.slice(0, 12).map((row) => (
                        <tr key={row.uid}>
                          <td className="py-4">
                            <p className="text-sm font-bold text-white">{row.displayName}</p>
                            <p className="text-[10px] text-text-muted">{row.email}</p>
                          </td>
                          <td className="py-4 text-xs text-text-secondary">{formatDate(row.lastSeenAt)}</td>
                          <td className="py-4 text-xs text-text-secondary">{formatDate(row.lastDailyCheckinAt)}</td>
                          <td className="py-4 text-xs text-text-secondary">{formatDate(row.lastWorkoutAt)}</td>
                          <td className="py-4 text-xs font-bold text-white">{row.adherencePercent === null ? '-' : `${row.adherencePercent}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </AdminState>
      </div>
    </PageShell>
  )
}

export function MentorSettingsScreen() {
  const { user } = useAuth()
  const { profile, isLoading } = useProfile()

  return (
    <PageShell wide>
      <AdminToolbar title="Configuracoes" eyebrow="Mentor" description="O app ainda nao tem entidade propria de mentor no backend; por isso esta tela assume um papel operacional." />
      <AdminState isLoading={isLoading} empty={!user}>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <section className="ec-card rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Conta conectada</p>
            <h2 className="mt-2 font-display text-2xl font-black italic text-white">Dados reais da sessao</h2>
            <div className="mt-5 space-y-3 text-sm text-text-secondary">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</p>
                <p className="mt-1 text-white">{user?.displayName || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Email</p>
                <p className="mt-1 text-white">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Role</p>
                <p className="mt-1 text-white">{user?.role || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Objetivo do perfil</p>
                <p className="mt-1 text-white">{profile?.goal || '-'}</p>
              </div>
            </div>
          </section>

          <section className="ec-card rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Acoes</p>
            <h2 className="mt-2 font-display text-2xl font-black italic text-white">Configuracoes funcionais</h2>
            <div className="mt-5 space-y-3">
              <Link to="/app/profile" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                Ajustar perfil do app
                <Settings className="h-4 w-4 text-accent-sky" />
              </Link>
              <Link to="/admin/settings" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                Configuracoes de comunidade
                <ArrowRight className="h-4 w-4 text-accent-sky" />
              </Link>
              <Link to="/mentor/relatorios" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white">
                Rever relatorios
                <FileText className="h-4 w-4 text-accent-sky" />
              </Link>
            </div>
          </section>
        </div>
      </AdminState>
    </PageShell>
  )
}

export function MentorWorkoutPrescriptorScreen() {
  return <AdminWorkoutsScreen />
}

export function MentorDietPrescriptorScreen() {
  return <AdminDietsScreen />
}

export function MentorInfluencersScreen() {
  const { data, isLoading, error } = useMentorInfluencers()

  return (
    <PageShell wide>
      <AdminToolbar
        title="Influencers"
        eyebrow="Mentor"
        description="Afiliados que ja trouxeram alunos para esta carteira. A leitura vem de commissionLedger e affiliateAccounts."
      />
      <AdminState isLoading={isLoading} error={error} empty={!data || data.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {['Afiliado', 'Status', 'Alunos vinculados', 'Comissao pendente', 'Comissao paga'].map((heading) => (
                    <th key={heading} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{affiliate.name}</p>
                      <p className="text-[10px] text-text-muted">{affiliate.email}</p>
                    </td>
                    <td className="p-4 text-xs text-text-secondary">{affiliate.status}</td>
                    <td className="p-4 text-xs font-bold text-white">{affiliate.referredStudents}</td>
                    <td className="p-4 text-xs text-text-secondary">{formatCurrency(affiliate.pendingCommission)}</td>
                    <td className="p-4 text-xs text-text-secondary">{formatCurrency(affiliate.totalCommissionPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
    </PageShell>
  )
}
