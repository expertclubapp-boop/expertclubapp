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
} from 'lucide-react'
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-black italic text-white">{value}</p>
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
// FINANCE
// ═══════════════════════════════════════════════
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
    () =>
      commissions
        .filter((entry) => entry.status === 'approved')
        .reduce((sum, entry) => sum + entry.commissionAmount, 0),
    [commissions],
  )

  return (
    <PageShell wide>
      <AdminToolbar
        title="Financeiro"
        eyebrow="Operacao"
        description="Resumo consolidado de assinaturas, comissoes e repasses ja gravados no Firestore."
      />
      <AdminState isLoading={isLoading} error={error} empty={!metrics}>
        {metrics && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="MRR estimado" value={formatCurrency(metrics.estimatedMrr)} />
              <MetricCard label="Comissao pendente" value={formatCurrency(metrics.pendingCommissions)} />
              <MetricCard label="Comissao aprovada" value={formatCurrency(approvedVolume)} />
              <MetricCard label="Payouts pagos" value={String(payouts.filter((p) => p.status === 'paid').length)} />
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <WorkspaceLink
                to="/admin/commissions"
                title="Gerir comissoes"
                description="Aprovar, revisar e acompanhar saldo por afiliada."
              />
              <WorkspaceLink
                to="/admin/payouts"
                title="Gerir repasses"
                description="Auditar payout pendente ou pago."
              />
            </section>
          </div>
        )}
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
