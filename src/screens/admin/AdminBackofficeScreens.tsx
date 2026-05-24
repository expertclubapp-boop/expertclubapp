import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Headset,
  Layers3,
  ShieldAlert,
  WalletCards,
  Database,
  GitBranch,
  Info,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { PageShell } from '../../components/ui/Premium'
import { AdminState, AdminToolbar } from './AdminShared'
import { adminMetricsService } from '../../services/adminMetricsService'
import { adminCommissionService } from '../../services/adminCommissionService'
import { communityFeedService } from '../../services/communityFeedService'
import { adminUserService } from '../../services/adminUserService'
import type { AdminMetrics } from '../../services/adminMetricsService'
import type { AffiliatePayout, CommissionEntry, CommunityPost, Subscription, PlanTier } from '../../types/domain'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}

function MetricsWarnings({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null
  return (
    <div className="rounded-2xl border border-accent-yellow/25 bg-accent-yellow/8 p-4 text-sm text-accent-yellow">
      Métricas parciais: {warnings.join(' ')}
    </div>
  )
}

// ═══════════════════════════════════════════════
// WORKSPACES — Honest: schema is single-tenant
// ═══════════════════════════════════════════════
export function AdminWorkspacesScreen() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminMetricsService
      .getDashboard()
      .then(setMetrics)
      .catch((loadError) => {
        console.error(loadError)
        setError('Nao foi possivel carregar o resumo operacional.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageShell wide>
      <AdminToolbar
        title="Workspaces"
        eyebrow="Arquitetura"
        description="Status real do schema de dados. Multi-tenant ainda nao habilitado."
      />

      {/* Honest architecture notice */}
      <div className="mb-6 rounded-2xl border border-accent-yellow/25 bg-accent-yellow/8 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent-yellow" />
          <div>
            <p className="font-bold text-accent-yellow">Arquitetura atual: single-tenant com colecoes globais</p>
            <p className="mt-1 text-sm text-text-secondary">
              O Expert Club opera hoje com colecoes globais (<code className="font-mono text-xs">users</code>,{' '}
              <code className="font-mono text-xs">workouts</code>, <code className="font-mono text-xs">diets</code>
              ). Nao existe entidade <code className="font-mono text-xs">workspaces/&#123;id&#125;</code> no
              Firestore. Esta tela nao e um modulo operacional — e um hub de navegacao para os modulos reais.
            </p>
          </div>
        </div>
      </div>

      {/* Schema gap checklist */}
      <div className="mb-6 ec-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-accent-sky" />
          <p className="text-[10px] font-black uppercase tracking-widest text-accent-sky">
            O que falta para multi-tenant real
          </p>
        </div>
        <ul className="space-y-2">
          {[
            { field: 'workspaces/{workspaceId}', desc: 'Colecao de tenants com nome, slug, plano e configuracoes' },
            { field: 'workspaceMembers/{workspaceId}_{uid}', desc: 'Relacao de membros por workspace' },
            { field: 'users.workspaceId', desc: 'Campo para vincular usuario a um workspace' },
            { field: 'Firestore rules por workspace', desc: 'Isolamento de dados por tenant nas regras de seguranca' },
          ].map(({ field, desc }) => (
            <li key={field} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-white/20" />
              <span>
                <code className="font-mono text-xs text-accent-sky">{field}</code>
                <span className="ml-2 text-text-muted">— {desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <GitBranch className="h-3 w-3 text-text-muted" />
          <p className="text-xs text-text-muted">
            Implementar multi-tenant antes de ter receita consistente por tenant e prematuro. Registrar como backlog quando
            o produto atingir demanda de segmentacao real.
          </p>
        </div>
      </div>

      {/* Real current metrics */}
      <AdminState isLoading={isLoading} error={error} empty={!metrics}>
        {metrics && (
          <div className="space-y-5">
            <MetricsWarnings warnings={metrics.queryWarnings} />
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Estado operacional atual (colecoes globais)
            </p>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Alunos ativos" value={String(metrics.activeStudents)} />
              <MetricCard label="Assinaturas pendentes" value={String(metrics.pendingSubscriptions)} />
              <MetricCard label="Conteudo em uso" value={String(metrics.appUsage.diets + metrics.appUsage.workouts)} />
              <MetricCard label="Check-ins na semana" value={String(metrics.dailyCheckinsWeek)} />
            </section>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <WorkspaceLink to="/admin/users" title="Base de usuarios" description="Perfis, roles e historico operacional." />
              <WorkspaceLink to="/admin/subscriptions" title="Receita recorrente" description="Planos, renovacoes e pendencias." />
              <WorkspaceLink to="/admin/content" title="Conteudo e programas" description="Dietas, treinos, desafios e conteudos." />
              <WorkspaceLink to="/admin/settings" title="Comunidade e suporte" description="Regras, links, moderacao e configuracao." />
            </section>
          </div>
        )}
      </AdminState>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════
// FINANCE — Full dashboard
// ═══════════════════════════════════════════════

const TIER_LABELS: Partial<Record<PlanTier, string>> = {
  low_ticket: 'Expert Club',
  mentoring_quarterly: 'Mentoria Trimestral',
  mentoring_semester: 'Mentoria Semestral',
  mentoring_annual: 'Mentoria Anual',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  trialing: 'Trial',
  past_due: 'Inadimplente',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  pending: 'Pendente',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-accent-lime bg-accent-lime/10 border-accent-lime/20',
  trialing: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20',
  past_due: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  cancelled: 'text-text-muted bg-white/5 border-white/10',
  expired: 'text-red-400 bg-red-400/10 border-red-400/20',
  pending: 'text-text-muted bg-white/5 border-white/10',
}

function computeMRR(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => {
      const price = s.price || 0
      switch (s.interval) {
        case 'monthly': return sum + price
        case 'quarterly': return sum + price / 3
        case 'semester': return sum + price / 6
        case 'annual': return sum + price / 12
        default: return sum + price
      }
    }, 0)
}

function daysFromNow(isoDate?: string): number | null {
  if (!isoDate) return null
  const diff = new Date(isoDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function AdminFinanceOverviewScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, COLLECTIONS.SUBSCRIPTIONS), orderBy('updatedAt', 'desc'))),
      adminCommissionService.listCommissions(),
      adminCommissionService.listPayouts(),
    ])
      .then(([subSnap, commissionRows, payoutRows]) => {
        setSubscriptions(subSnap.docs.map((d) => ({ ...(d.data() as Subscription) })))
        setCommissions(commissionRows)
        setPayouts(payoutRows)
      })
      .catch((err) => {
        console.error(err)
        setError('Não foi possível carregar o financeiro.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const mrr = useMemo(() => computeMRR(subscriptions), [subscriptions])

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    subscriptions.forEach((s) => { map[s.status] = (map[s.status] || 0) + 1 })
    return map
  }, [subscriptions])

  const byTier = useMemo(() => {
    const map: Record<string, number> = {}
    subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').forEach((s) => {
      const tier = (s as any).tier || 'low_ticket'
      map[tier] = (map[tier] || 0) + 1
    })
    return map
  }, [subscriptions])

  const expiringIn7 = useMemo(() =>
    subscriptions.filter((s) => {
      if (s.status !== 'active' && s.status !== 'trialing') return false
      const days = daysFromNow(s.currentPeriodEnd || s.renewalDate)
      return days !== null && days >= 0 && days <= 7
    }),
    [subscriptions]
  )

  const pastDue = useMemo(() =>
    subscriptions.filter((s) => s.status === 'past_due'),
    [subscriptions]
  )

  const approvedVolume = useMemo(() =>
    commissions.filter((e) => e.status === 'approved').reduce((sum, e) => sum + e.commissionAmount, 0),
    [commissions]
  )

  const recentActive = useMemo(() =>
    subscriptions.filter((s) => s.status === 'active').slice(0, 10),
    [subscriptions]
  )

  return (
    <PageShell wide>
      <AdminToolbar
        title="Financeiro"
        eyebrow="Gestão"
        description="Receita, assinaturas, inadimplência e renovações em tempo real."
        action={
          <Link
            to="/admin/produtos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            Gerenciar produtos
          </Link>
        }
      />

      <AdminState isLoading={isLoading} error={error} empty={false}>
        <div className="space-y-8">

          {/* KPI row */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="ec-card rounded-2xl p-5 border border-accent-lime/20 bg-gradient-to-b from-accent-lime/5 to-transparent">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-accent-lime" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">MRR</p>
              </div>
              <p className="text-3xl font-black italic text-white">{formatCurrency(mrr)}</p>
              <p className="text-[10px] text-text-muted mt-1">Receita mensal recorrente</p>
            </div>

            <div className="ec-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-accent-lime" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ativos</p>
              </div>
              <p className="text-3xl font-black italic text-white">
                {(byStatus['active'] || 0) + (byStatus['trialing'] || 0)}
              </p>
              <p className="text-[10px] text-text-muted mt-1">Assinantes ativos + trial</p>
            </div>

            <div className="ec-card rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Vencendo</p>
              </div>
              <p className="text-3xl font-black italic text-white">{expiringIn7.length}</p>
              <p className="text-[10px] text-text-muted mt-1">Renovam em até 7 dias</p>
            </div>

            <div className="ec-card rounded-2xl p-5 border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Inadimplentes</p>
              </div>
              <p className="text-3xl font-black italic text-white">{pastDue.length}</p>
              <p className="text-[10px] text-text-muted mt-1">Status past_due</p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* By tier */}
            <div className="ec-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-ec-violet" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ativos por plano</p>
              </div>
              <div className="space-y-3">
                {Object.entries(byTier).length === 0 ? (
                  <p className="text-sm text-text-muted">Sem dados.</p>
                ) : (
                  Object.entries(byTier).map(([tier, count]) => (
                    <div key={tier} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{TIER_LABELS[tier as PlanTier] ?? tier}</p>
                        <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ec-violet rounded-full"
                            style={{ width: `${Math.min(100, (count / Math.max(1, subscriptions.length)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-black text-white w-6 text-right">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* By status */}
            <div className="ec-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <WalletCards className="w-4 h-4 text-ec-violet" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Por status</p>
              </div>
              <div className="space-y-2">
                {Object.entries(byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[status] ?? 'text-text-muted bg-white/5 border-white/10'}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-sm font-black text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions */}
            <div className="ec-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-ec-violet" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Afiliados</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-text-muted">Comissão aprovada</p>
                  <p className="text-xl font-black text-white">{formatCurrency(approvedVolume)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Repasses pagos</p>
                  <p className="text-xl font-black text-white">{payouts.filter((p) => p.status === 'paid').length}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                <Link to="/admin/commissions" className="text-[10px] font-bold text-ec-violet hover:underline">Ver comissões →</Link>
                <Link to="/admin/payouts" className="text-[10px] font-bold text-ec-violet hover:underline">Ver repasses →</Link>
              </div>
            </div>
          </div>

          {/* Expiring in 7 days */}
          {expiringIn7.length > 0 && (
            <div className="ec-card rounded-2xl p-5 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Vencendo nos próximos 7 dias ({expiringIn7.length})</p>
              </div>
              <div className="space-y-2">
                {expiringIn7.map((s) => {
                  const days = daysFromNow(s.currentPeriodEnd || s.renewalDate)
                  return (
                    <div key={s.uid} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-white">{s.planName}</p>
                        <p className="text-[10px] text-text-muted">{s.uid}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black ${days !== null && days <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
                          {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days} dias`}
                        </span>
                        <p className="text-[10px] text-text-muted">{formatCurrency(s.price)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past due */}
          {pastDue.length > 0 && (
            <div className="ec-card rounded-2xl p-5 border border-red-500/15">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Inadimplentes ({pastDue.length})</p>
              </div>
              <div className="space-y-2">
                {pastDue.map((s) => (
                  <div key={s.uid} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-white">{s.planName}</p>
                      <p className="text-[10px] text-text-muted">{s.uid}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-red-400">Past due</span>
                      <p className="text-[10px] text-text-muted">{formatCurrency(s.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent active */}
          <div className="ec-card rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Assinaturas recentes ativas</p>
            <div className="space-y-2">
              {recentActive.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma assinatura ativa.</p>
              ) : (
                recentActive.map((s) => (
                  <div key={s.uid} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-white">{s.planName || '—'}</p>
                      <p className="text-[10px] text-text-muted">{s.uid} · renova {s.renewalDate ? new Date(s.renewalDate).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{formatCurrency(s.price)}</p>
                      <p className="text-[10px] text-text-muted">{s.interval}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-3">
            <WorkspaceLink to="/admin/subscriptions" title="Todas as assinaturas" description="Ver e editar status de qualquer assinatura." />
            <WorkspaceLink to="/admin/produtos" title="Produtos & links de venda" description="Criar e gerenciar planos com checkout." />
            <WorkspaceLink to="/admin/commissions" title="Comissões de afiliados" description="Aprovar e acompanhar repasses." />
          </section>

        </div>
      </AdminState>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════
// SUPPORT — Honest: no ticket collection yet
// ═══════════════════════════════════════════════
export function AdminSupportOverviewScreen() {
  const [usersCount, setUsersCount] = useState(0)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([adminUserService.list(), communityFeedService.getAllPostsForAdmin(80)])
      .then(([users, communityPosts]) => {
        setUsersCount(users.length)
        setPosts(communityPosts)
      })
      .catch((loadError) => {
        console.error(loadError)
        setError('Nao foi possivel carregar o hub de suporte.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const reportedPosts = useMemo(() => posts.filter((p) => (p.reportCount || 0) > 0), [posts])

  return (
    <PageShell wide>
      <AdminToolbar
        title="Suporte"
        eyebrow="Operacao"
        description="Central de atendimento. Tickets formais ainda nao existem no schema — veja o status abaixo."
      />

      {/* Honest gap notice */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
          <div>
            <p className="font-bold text-white">Colecao de tickets nao implementada</p>
            <p className="mt-1 text-sm text-text-secondary">
              Nao existe colecao <code className="font-mono text-xs">supportTickets</code> no Firestore. O atendimento
              hoje e feito diretamente via WhatsApp/email ou pela moderacao da comunidade. Para tickets formais, seria
              necessario criar a colecao, regras de acesso e interface de resposta.
            </p>
            <a
              href="https://firebase.google.com/docs/firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-sky hover:underline"
            >
              Documentacao Firestore <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <AdminState isLoading={isLoading} error={error} empty={false}>
        <div className="space-y-6">
          {/* Real data: community moderation */}
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Usuarios na base" value={String(usersCount)} />
            <MetricCard label="Posts denunciados" value={String(reportedPosts.length)} />
            <MetricCard label="Posts moderados" value={String(posts.filter((p) => p.status !== 'published').length)} />
          </section>

          {/* Reported posts list — actual actionable data */}
          {reportedPosts.length > 0 && (
            <div className="ec-card rounded-2xl p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-accent-yellow">
                Posts com denuncia ({reportedPosts.length})
              </p>
              <div className="space-y-2">
                {reportedPosts.slice(0, 10).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.03] p-3 text-sm"
                  >
                    <div>
                      <p className="font-bold text-white">{post.authorName}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{post.content}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent-yellow/10 px-2 py-0.5 text-[10px] font-bold text-accent-yellow">
                      {post.reportCount} denuncias
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/community"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent-sky hover:underline"
              >
                Abrir moderacao completa <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <WorkspaceLink to="/admin/community" title="Moderacao" description="Ocultar, fixar e revisar denuncias." />
            <WorkspaceLink
              to="/admin/users"
              title="Atendimento por usuario"
              description="Abrir historico e assinatura do aluno."
            />
            <WorkspaceLink
              to="/admin/subscriptions"
              title="Cobranca e status"
              description="Ajustar situacoes de pagamento."
            />
            <WorkspaceLink
              to="/admin/settings"
              title="Regras e links"
              description="Atualizar onboarding e suporte da comunidade."
            />
          </section>
        </div>
      </AdminState>
    </PageShell>
  )
}

function WorkspaceLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link to={to} className="ec-card rounded-2xl p-5 transition-colors hover:border-ec-violet/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        {to.includes('community') ? <ShieldAlert className="h-5 w-5 text-accent-sky" /> : null}
        {to.includes('commission') || to.includes('payout') ? <WalletCards className="h-5 w-5 text-accent-sky" /> : null}
        {to.includes('users') || to.includes('settings') || to.includes('content') || to.includes('subscriptions') ? (
          <Layers3 className="h-5 w-5 text-accent-sky" />
        ) : null}
        {to.includes('support') ? <Headset className="h-5 w-5 text-accent-sky" /> : null}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </Link>
  )
}
