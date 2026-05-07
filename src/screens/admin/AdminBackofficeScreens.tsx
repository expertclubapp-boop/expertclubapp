import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headset, Layers3, ShieldAlert, WalletCards } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { AdminState, AdminToolbar } from './AdminShared'
import { adminMetricsService } from '../../services/adminMetricsService'
import { adminCommissionService } from '../../services/adminCommissionService'
import { communityFeedService } from '../../services/communityFeedService'
import { adminUserService } from '../../services/adminUserService'
import type { AdminMetrics } from '../../services/adminMetricsService'
import type { AffiliatePayout, CommissionEntry, CommunityPost } from '../../types/domain'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}

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
        description="O schema atual nao possui workspaces nomeados. Esta tela assume esse gap e aponta para os modulos reais em producao."
      />
      <AdminState isLoading={isLoading} error={error} empty={!metrics}>
        {metrics && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-accent-yellow/20 bg-accent-yellow/10 px-4 py-3 text-sm text-accent-yellow">
              Hoje o produto opera com colecoes globais. Antes de criar multitenancy real, usamos este hub para navegar com clareza pelas areas ativas.
            </div>
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

export function AdminFinanceOverviewScreen() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminMetricsService.getDashboard(),
      adminCommissionService.listCommissions(),
      adminCommissionService.listPayouts(),
    ])
      .then(([dashboard, commissionRows, payoutRows]) => {
        setMetrics(dashboard)
        setCommissions(commissionRows)
        setPayouts(payoutRows)
      })
      .catch((loadError) => {
        console.error(loadError)
        setError('Nao foi possivel carregar o financeiro.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const approvedVolume = useMemo(
    () => commissions.filter((entry) => entry.status === 'approved').reduce((sum, entry) => sum + entry.commissionAmount, 0),
    [commissions],
  )

  return (
    <PageShell wide>
      <AdminToolbar title="Financeiro" eyebrow="Operacao" description="Resumo consolidado de assinaturas, comissoes e repasses ja gravados no Firestore." />
      <AdminState isLoading={isLoading} error={error} empty={!metrics}>
        {metrics && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="MRR estimado" value={formatCurrency(metrics.estimatedMrr)} />
              <MetricCard label="Comissao pendente" value={formatCurrency(metrics.pendingCommissions)} />
              <MetricCard label="Comissao aprovada" value={formatCurrency(approvedVolume)} />
              <MetricCard label="Payouts pagos" value={String(payouts.filter((payout) => payout.status === 'paid').length)} />
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <WorkspaceLink to="/admin/commissions" title="Gerir comissoes" description="Aprovar, revisar e acompanhar saldo por afiliada." />
              <WorkspaceLink to="/admin/payouts" title="Gerir repasses" description="Auditar payout pendente ou pago." />
            </section>
          </div>
        )}
      </AdminState>
    </PageShell>
  )
}

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

  const reportedPosts = useMemo(
    () => posts.filter((post) => (post.reportCount || 0) > 0),
    [posts],
  )

  return (
    <PageShell wide>
      <AdminToolbar title="Suporte" eyebrow="Operacao" description="Fila de comunidade e atalhos para os modulos reais usados no atendimento." />
      <AdminState isLoading={isLoading} error={error} empty={false}>
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Usuarios na base" value={String(usersCount)} />
            <MetricCard label="Posts denunciados" value={String(reportedPosts.length)} />
            <MetricCard label="Posts moderados" value={String(posts.filter((post) => post.status !== 'published').length)} />
          </section>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <WorkspaceLink to="/admin/community" title="Moderacao" description="Ocultar, fixar e revisar denuncias." />
            <WorkspaceLink to="/admin/users" title="Atendimento por usuario" description="Abrir historico e assinatura do aluno." />
            <WorkspaceLink to="/admin/subscriptions" title="Cobranca e status" description="Ajustar situacoes de pagamento." />
            <WorkspaceLink to="/admin/settings" title="Regras e links" description="Atualizar onboarding e suporte da comunidade." />
          </section>
        </div>
      </AdminState>
    </PageShell>
  )
}

function WorkspaceLink({
  to,
  title,
  description,
}: {
  to: string
  title: string
  description: string
}) {
  return (
    <Link to={to} className="ec-card rounded-2xl p-5 transition-colors hover:border-ec-violet/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        {to.includes('community') ? <ShieldAlert className="h-5 w-5 text-accent-sky" /> : null}
        {to.includes('commission') || to.includes('payout') ? <WalletCards className="h-5 w-5 text-accent-sky" /> : null}
        {to.includes('users') || to.includes('settings') || to.includes('content') || to.includes('subscriptions') ? <Layers3 className="h-5 w-5 text-accent-sky" /> : null}
        {to.includes('support') ? <Headset className="h-5 w-5 text-accent-sky" /> : null}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </Link>
  )
}
