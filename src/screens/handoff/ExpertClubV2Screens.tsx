import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Apple,
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Droplets,
  Dumbbell,
  Edit3,
  Flame,
  Flag,
  Gift,
  Heart,
  HelpCircle,
  Home,
  Leaf,
  LineChart,
  ListChecks,
  MessageCircle,
  MoreVertical,
  Moon,
  Pause,
  PieChart,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Sun,
  Target,
  Timer,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react'
import { ExpertLogo } from '../../components/ui/ExpertLogo'

type Tone = 'violet' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pink'
type ActiveNav =
  | 'Visão geral'
  | 'Alunos'
  | 'Check-ins'
  | 'Treinos'
  | 'Dietas'
  | 'Agenda'
  | 'Financeiro'
  | 'Influencers'
  | 'Relatórios'
  | 'Configurações'
  | 'Workspaces'
  | 'Assinaturas'
  | 'Usuários'
  | 'Conteúdo'
  | 'Suporte'
  | 'Métricas SaaS'

const mentorNav = [
  { label: 'Visão geral', icon: Home, href: '/mentor/overview' },
  { label: 'Alunos', icon: Users, href: '/mentor/alunos' },
  { label: 'Check-ins', icon: CalendarCheck, href: '/mentor/checkins' },
  { label: 'Treinos', icon: Dumbbell, href: '/mentor/treinos/prescritor' },
  { label: 'Dietas', icon: Utensils, href: '/mentor/dietas/prescritor' },
  { label: 'Agenda', icon: Calendar, href: '/mentor/agenda' },
  { label: 'Financeiro', icon: CircleDollarSign, href: '/mentor/financeiro' },
  { label: 'Influencers', icon: Trophy, href: '/mentor/influencers' },
  { label: 'Relatórios', icon: BarChart3, href: '/mentor/relatorios' },
  { label: 'Configurações', icon: Settings, href: '/mentor/configuracoes' },
] as const

const adminNav = [
  { label: 'Visão geral', icon: Home, href: '/admin/overview' },
  { label: 'Workspaces', icon: Building2, href: '/admin/workspaces' },
  { label: 'Assinaturas', icon: CalendarCheck, href: '/admin/subscriptions' },
  { label: 'Usuários', icon: Users, href: '/admin/users' },
  { label: 'Influencers', icon: Trophy, href: '/admin/affiliates' },
  { label: 'Conteúdo', icon: BookOpen, href: '/admin/content' },
  { label: 'Financeiro', icon: CircleDollarSign, href: '/admin/commissions' },
  { label: 'Suporte', icon: HelpCircle, href: '/admin/support' },
  { label: 'Métricas SaaS', icon: BarChart3, href: '/admin/metrics' },
  { label: 'Configurações', icon: Settings, href: '/admin/settings' },
] as const

const people = [
  'Juliana Martins',
  'Rafael Almeida',
  'Camila Ribeiro',
  'Lucas Ferreira',
  'Mariana Costa',
  'Thiago Santos',
  'Fernanda Oliveira',
  'Amanda Rocha',
  'Beatriz Lima',
  'Gustavo Mendes',
]

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function V2Button({
  children,
  variant = 'secondary',
  icon,
  className,
  onClick,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <button type="button" className={cx('ec-v2-btn', `ec-v2-btn--${variant}`, className)} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('ec-v2-card', className)}>{children}</section>
}

function IconBubble({ icon: Icon, tone = 'violet' }: { icon: LucideIcon; tone?: Tone }) {
  return (
    <span className={cx('ec-v2-icon-bubble', `ec-v2-icon-bubble--${tone}`)}>
      <Icon aria-hidden="true" />
    </span>
  )
}

function Badge({ children, tone = 'violet' }: { children: ReactNode; tone?: Tone }) {
  return <span className={cx('ec-v2-badge', `ec-v2-badge--${tone}`)}>{children}</span>
}

function TrendChip({ value, danger = false, warning = false }: { value: string; danger?: boolean; warning?: boolean }) {
  return (
    <span className={cx('ec-v2-trend', danger && 'is-danger', warning && 'is-warning')}>
      {danger ? '↓' : warning ? '↑' : '↑'} {value}
    </span>
  )
}

function Avatar({ name, index = 0, size = 'md' }: { name: string; index?: number; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <span className={cx('ec-v2-avatar', `ec-v2-avatar--${size}`, `ec-v2-avatar--${(index % 6) + 1}`)} aria-label={name}>
      {initials}
    </span>
  )
}

function ProgressBar({ value, tone = 'violet' }: { value: number | string; tone?: Tone }) {
  const width = typeof value === 'number' ? `${value}%` : value
  return (
    <span className={cx('ec-v2-progress', `ec-v2-progress--${tone}`)}>
      <i style={{ width }} />
    </span>
  )
}

function Ring({
  value,
  label,
  sublabel,
  tone = 'violet',
  size = 'md',
}: {
  value: number
  label: string
  sublabel?: string
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div
      className={cx('ec-v2-ring', `ec-v2-ring--${tone}`, `ec-v2-ring--${size}`)}
      style={{ '--ec-ring-value': `${Math.min(100, Math.max(0, value)) * 3.6}deg` } as CSSProperties}
      aria-label={`${label} ${sublabel ?? ''}`}
    >
      <strong>{label}</strong>
      {sublabel && <span>{sublabel}</span>}
    </div>
  )
}

function Sparkline({ danger = false }: { danger?: boolean }) {
  const points = danger
    ? '4,22 28,35 52,28 76,17 100,31 124,40 148,27 172,36 196,26'
    : '4,36 28,25 52,31 76,18 100,28 124,41 148,19 172,24 196,16'

  return (
    <svg className={cx('ec-v2-sparkline', danger && 'is-danger')} viewBox="0 0 200 58" aria-hidden="true">
      <polyline points={points} />
    </svg>
  )
}

function LineAreaChart({ tall = false, dotted = false }: { tall?: boolean; dotted?: boolean }) {
  const path = tall
    ? 'M34 248 C92 188,145 224,202 162 S316 98,390 121 S520 110,620 82 S742 190,850 130'
    : 'M30 178 C88 144,144 168,206 112 S318 68,388 90 S520 82,624 58 S742 140,850 96'
  const baseY = tall ? 290 : 220

  return (
    <div className={cx('ec-v2-chart', tall && 'is-tall')}>
      <svg viewBox={`0 0 900 ${tall ? 320 : 250}`} role="img" aria-label="Gráfico de linha com área violeta">
        <defs>
          <linearGradient id="ecV2Area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C4DFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6C4DFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} x1="30" x2="870" y1={38 + line * 52} y2={38 + line * 52} className="grid" />
        ))}
        {dotted && <path className="dotted" d="M30 150 C120 80,210 130,300 98 S510 94,626 60 S760 120,870 76" />}
        <path d={`${path} L850 ${baseY} L30 ${baseY} Z`} fill="url(#ecV2Area)" />
        <path d={path} className="main-line" />
        <circle cx="620" cy={tall ? 82 : 58} r="8" className="point" />
        {['12 Mai', '16 Mai', '20 Mai', '24 Mai', '28 Mai', '1 Jun', '5 Jun', '10 Jun'].map((label, index) => (
          <text key={label} x={34 + index * 118} y={tall ? 306 : 238}>
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function DonutChart({
  center,
  label,
  segments = ['#6C4DFF', '#3B82F6', '#22C55E', '#FBC647'],
}: {
  center: string
  label: string
  segments?: string[]
}) {
  return (
    <div className="ec-v2-donut-wrap">
      <div
        className="ec-v2-donut"
        style={{
          background: `conic-gradient(${segments[0]} 0 38%, ${segments[1]} 38% 65%, ${segments[2]} 65% 83%, ${segments[3]} 83% 100%)`,
        }}
      >
        <span>
          <strong>{center}</strong>
          <small>{label}</small>
        </span>
      </div>
    </div>
  )
}

function FunnelChart() {
  return (
    <div className="ec-v2-funnel">
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}

function ExerciseArt({ index = 0 }: { index?: number }) {
  return (
    <span className={cx('ec-v2-exercise-art', `ec-v2-exercise-art--${(index % 4) + 1}`)}>
      <Dumbbell aria-hidden="true" />
      <i />
    </span>
  )
}

function FoodIcon({ label }: { label: string }) {
  return <span className="ec-v2-food-icon">{label.slice(0, 1).toUpperCase()}</span>
}

function Sidebar({ active, admin = false }: { active: ActiveNav; admin?: boolean }) {
  const items = admin ? adminNav : mentorNav

  return (
    <aside className="ec-v2-sidebar">
      <a className="ec-v2-logo-link" href="/" aria-label="Ir para a landing Expert Club">
        <ExpertLogo color="dark" variant="full" animate={false} className="ec-v2-logo" />
      </a>
      <nav aria-label={admin ? 'Navegação admin' : 'Navegação mentor'}>
        {items.map(({ label, icon: Icon, href }) => (
          <a key={label} href={href} className={cx('ec-v2-side-link', active === label && 'is-active')}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="ec-v2-sidebar-bottom">
        <Card className="ec-v2-plan-card">
          <IconBubble icon={Star} />
          <strong>Expert Club Pro</strong>
          <span>Seu plano está ativo</span>
          <a href="/billing/plans">Ver benefícios</a>
        </Card>
        <Card className="ec-v2-help-card">
          <HelpCircle aria-hidden="true" />
          <div>
            <strong>Central de ajuda</strong>
            <span>Suporte e tutoriais</span>
          </div>
        </Card>
      </div>
    </aside>
  )
}

function Topbar({ admin = false }: { admin?: boolean }) {
  const user = admin ? 'Rafael Almeida' : 'Ana Paula Souza'
  const role = admin ? 'Administrador' : 'Mentora'

  return (
    <div className="ec-v2-topbar">
      <button type="button" className="ec-v2-control">
        <Calendar size={18} /> <span>12 de mai – 10 de jun, 2024</span> <ChevronDown size={16} />
      </button>
      <button type="button" className="ec-v2-control">
        <span>Workspace</span> <strong>{admin ? 'Todos os workspaces' : 'Expert Coaching'}</strong> <ChevronDown size={16} />
      </button>
      <button type="button" className="ec-v2-icon-btn" aria-label="Buscar">
        <Search />
      </button>
      <button type="button" className="ec-v2-icon-btn has-badge" aria-label="Notificações">
        <Bell />
        <span>8</span>
      </button>
      <div className="ec-v2-user">
        <Avatar name={user} index={admin ? 1 : 2} size="md" />
        <div>
          <strong>{user}</strong>
          <span>{role}</span>
        </div>
        <ChevronDown size={16} />
      </div>
    </div>
  )
}

function DesktopShell({
  active,
  title,
  subtitle,
  eyebrow = 'MENTOR DASHBOARD',
  admin = false,
  children,
}: {
  active: ActiveNav
  title: string
  subtitle: string
  eyebrow?: string
  admin?: boolean
  children: ReactNode
}) {
  return (
    <main className="ec-v2-desktop">
      <Sidebar active={active} admin={admin} />
      <section className="ec-v2-main">
        <header className="ec-v2-page-header">
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <Topbar admin={admin} />
        </header>
        {children}
      </section>
    </main>
  )
}

function KpiCard({
  icon,
  label,
  value,
  trend,
  danger = false,
  warning = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  trend: string
  danger?: boolean
  warning?: boolean
}) {
  return (
    <Card className="ec-v2-kpi">
      <IconBubble icon={icon} tone={danger ? 'danger' : warning ? 'warning' : 'violet'} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>
        <TrendChip value={trend} danger={danger} warning={warning} />
        <small>vs. período anterior</small>
      </p>
    </Card>
  )
}

function DataTable({
  columns,
  rows,
  action = false,
}: {
  columns: string[]
  rows: ReactNode[][]
  action?: boolean
}) {
  return (
    <div className="ec-v2-table-wrap">
      <table className="ec-v2-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {action && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
              {action && (
                <td>
                  <button type="button" className="ec-v2-mini-action" aria-label="Mais ações">
                    <MoreVertical size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AlertList() {
  const alerts = [
    ['Juliana Martins', '3 check-ins pendentes', 'Há 3 dias', 'Alta', 'danger'],
    ['Rafael Almeida', 'Treinos não concluídos', 'Há 2 dias', 'Média', 'warning'],
    ['Camila Ribeiro', 'Baixa adesão nos treinos', 'Há 1 dia', 'Média', 'warning'],
    ['Lucas Ferreira', 'Último check-in há 7 dias', 'Há 7 dias', 'Baixa', 'violet'],
    ['Mariana Costa', 'Dieta não registrada', 'Há 4 dias', 'Baixa', 'violet'],
  ] as const

  return (
    <Card className="ec-v2-alerts-card">
      <div className="ec-v2-card-head">
        <h2>Alertas <Badge tone="pink">5</Badge></h2>
        <a href="/mentor/alerts">Ver todos</a>
      </div>
      {alerts.map(([name, issue, time, level, tone], index) => (
        <a className="ec-v2-alert-row" key={name} href="/mentor/alunos">
          <Avatar name={name} index={index} />
          <div>
            <strong>{name}</strong>
            <span>{issue}</span>
          </div>
          <small>{time}</small>
          <Badge tone={tone}>{level}</Badge>
          <ChevronRight size={16} />
        </a>
      ))}
    </Card>
  )
}

function RightMetrics() {
  const items = [
    { icon: Droplets, label: 'Hidratação média', value: '2,1 L', trend: '8%', spark: false },
    { icon: Smartphone, label: 'Frequência no app', value: '4,2 dias/sem', trend: '10%', spark: false },
    { icon: Dumbbell, label: 'Conclusão de treinos', value: '72%', trend: '12%', spark: false },
    { icon: Calendar, label: 'Próximos check-ins', value: '18', trend: '+14', spark: true },
  ]

  return (
    <div className="ec-v2-side-stack">
      {items.map(({ icon: Icon, label, value, trend, spark }) => (
        <Card className="ec-v2-side-metric" key={label}>
          <IconBubble icon={Icon} />
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            <p><TrendChip value={trend} /> vs. período anterior</p>
          </div>
          {spark ? <div className="ec-v2-avatar-stack">{people.slice(0, 4).map((name, index) => <Avatar key={name} name={name} index={index} size="sm" />)}<b>+14</b></div> : <Sparkline />}
        </Card>
      ))}
      <Card className="ec-v2-quick-actions">
        <h2>Ações rápidas</h2>
        {['Revisar check-ins', 'Atualizar planos', 'Criar prescrição'].map((label, index) => {
          const Icon = [ClipboardCheck, ListChecks, Plus][index]
          return (
          <V2Button key={label} variant="secondary" icon={<Icon size={18} />}>
            {label}
          </V2Button>
          )
        })}
      </Card>
    </div>
  )
}

export function MentorOverviewScreen() {
  const kpis = [
    { icon: Users, label: 'Alunos ativos', value: '156', trend: '12%' },
    { icon: ClipboardCheck, label: 'Check-ins pendentes', value: '28', trend: '8%', danger: true },
    { icon: Target, label: 'Adesão média', value: '85%', trend: '9%' },
    { icon: Dumbbell, label: 'Treinos concluídos', value: '1.248', trend: '18%' },
    { icon: Star, label: 'Satisfação média', value: '4,8', trend: '0,3' },
    { icon: CircleDollarSign, label: 'Receita do mês', value: 'R$ 18.450', trend: '16%' },
  ]

  const tableRows = people.slice(0, 5).map((name, index) => [
    <span className="ec-v2-person" key="person"><Avatar name={name} index={index} /> {name}</span>,
    ['Check-in enviado', 'Treino concluído', 'Dieta registrada', 'Check-in enviado', 'Treino não concluído'][index],
    ['Avaliação semanal', 'Treino A - Força', 'Plano alimentar', 'Avaliação semanal', 'Treino B - Hipertrofia'][index],
    ['Hoje, 09:32', 'Hoje, 08:15', 'Ontem, 21:47', 'Ontem, 19:12', 'Ontem, 18:03'][index],
    <Badge key="status" tone={index === 4 ? 'danger' : index === 3 ? 'warning' : 'success'}>{index === 4 ? 'Não concluído' : index === 3 ? 'Pendente' : 'Concluído'}</Badge>,
  ])

  return (
    <DesktopShell active="Visão geral" title="Visão geral do mentor" subtitle="Acompanhe o desempenho dos seus alunos e gerencie suas atividades.">
      <div className="ec-v2-kpi-grid ec-v2-kpi-grid--six">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>
      <div className="ec-v2-dashboard-grid">
        <Card className="ec-v2-chart-card ec-v2-main-chart">
          <div className="ec-v2-card-head">
            <h2>Adesão dos alunos ao longo do tempo <HelpCircle size={16} /></h2>
            <div className="ec-v2-chart-legend"><i /> Adesão média (%) <b /> Meta</div>
          </div>
          <LineAreaChart tall dotted />
          <div className="ec-v2-chart-tooltip">31 de maio<br /><strong>Adesão: 82%</strong></div>
        </Card>
        <AlertList />
        <RightMetrics />
        <Card className="ec-v2-table-card">
          <div className="ec-v2-card-head"><h2>Atividade recente dos alunos</h2></div>
          <DataTable columns={['Aluno', 'Atividade', 'Detalhes', 'Data/hora', 'Status']} rows={tableRows} />
          <a className="ec-v2-table-link" href="/mentor/alunos">Ver todas as atividades</a>
        </Card>
        <Card className="ec-v2-ranking-card">
          <div className="ec-v2-card-head">
            <h2>Ranking de alunos <HelpCircle size={16} /></h2>
            <a href="/student/ranking">Ver ranking completo</a>
          </div>
          {['Beatriz Lima', 'Thiago Santos', 'Fernanda Oliveira', 'Amanda Rocha', 'Gustavo Mendes'].map((name, index) => (
            <div className="ec-v2-ranking-row" key={name}>
              <span>{index + 1}</span>
              <Avatar name={name} index={index + 4} />
              <strong>{name}</strong>
              <ProgressBar value={[96, 92, 90, 87, 84][index]} />
              <b>{[96, 92, 90, 87, 84][index]}%</b>
            </div>
          ))}
        </Card>
      </div>
      <InsightBanner title="Insight do sistema" body="Seus alunos estão 18% mais engajados neste período! Continue incentivando a consistência nos treinos e check-ins." />
    </DesktopShell>
  )
}

function InsightBanner({ title, body }: { title: string; body: string }) {
  return (
    <Card className="ec-v2-insight">
      <IconBubble icon={Sparkles} />
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <V2Button variant="secondary" icon={<ChevronRight size={18} />}>Ver recomendações</V2Button>
      <button type="button" aria-label="Fechar"><ChevronDown size={18} /></button>
    </Card>
  )
}

export function MentorFinanceScreen() {
  const kpis = [
    { icon: DollarSign, label: 'Receita do mês', value: 'R$ 18.450', trend: '16%' },
    { icon: ClipboardCheck, label: 'Recebido', value: 'R$ 14.250', trend: '18%' },
    { icon: Wallet, label: 'Pendente', value: 'R$ 4.200', trend: '8%', warning: true },
    { icon: CreditCard, label: 'Ticket médio', value: 'R$ 196', trend: '7%' },
    { icon: Users, label: 'Assinaturas ativas', value: '156', trend: '12%' },
    { icon: Clock, label: 'Churn do período', value: '2,1%', trend: '-0,6 p.p.' },
  ]

  const rows = ['Juliana Martins', 'Rafael Almeida', 'Camila Ribeiro', 'Lucas Ferreira', 'Mariana Costa'].map((name, index) => [
    <span className="ec-v2-person" key="person"><Avatar name={name} index={index} /> {name}</span>,
    ['Mensal', 'Trimestral', 'Semestral', 'Mensal', 'Anual'][index],
    <Badge key="status" tone={index === 3 ? 'warning' : 'success'}>{index === 3 ? 'Pendente' : 'Ativa'}</Badge>,
    ['12/06/2024', '25/06/2024', '10/07/2024', '12/06/2024', '03/12/2024'][index],
    ['R$ 197,00', 'R$ 537,00', 'R$ 997,00', 'R$ 197,00', 'R$ 1.997,00'][index],
    ['Cartão •••• 4242', 'PIX', 'Cartão •••• 8888', 'Boleto', 'Cartão •••• 1111'][index],
  ])

  return (
    <DesktopShell active="Financeiro" title="Financeiro" subtitle="Acompanhe receitas, assinaturas e repasses.">
      <div className="ec-v2-kpi-grid ec-v2-kpi-grid--six">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
      <div className="ec-v2-finance-grid">
        <Card className="ec-v2-chart-card">
          <div className="ec-v2-card-head"><h2>Receita ao longo do tempo <HelpCircle size={16} /></h2><div className="ec-v2-chart-legend"><i /> Receita <b /> Meta</div></div>
          <LineAreaChart dotted />
          <div className="ec-v2-chart-tooltip is-finance">31 de maio<br /><strong>Receita: R$ 16.980</strong></div>
        </Card>
        <Card className="ec-v2-donut-card">
          <div className="ec-v2-card-head"><h2>Mix de planos <HelpCircle size={16} /></h2></div>
          <div className="ec-v2-donut-layout">
            <DonutChart center="156" label="Assinaturas" />
            <Legend items={['Mensal 52 (33%)', 'Trimestral 41 (26%)', 'Semestral 36 (23%)', 'Anual 27 (18%)']} />
          </div>
        </Card>
        <Card className="ec-v2-payout-panel">
          <div className="ec-v2-card-head"><h2>Repasses e saldo <HelpCircle size={16} /></h2><a>Ver extrato</a></div>
          <div className="ec-v2-money-box"><span>Saldo disponível</span><strong>R$ 3.240,50</strong><p>Disponível para transferência</p></div>
          <div className="ec-v2-money-box"><span>A receber este mês</span><strong>R$ 4.200,00</strong><p>Previsto para 2 repasses</p></div>
          <V2Button variant="primary">Solicitar repasse</V2Button>
          {['12 JUN R$ 2.100,00', '19 JUN R$ 1.800,00', '26 JUN R$ 2.100,00'].map((item) => <p className="ec-v2-payout-row" key={item}>{item}<small>via Pix</small></p>)}
        </Card>
        <Card className="ec-v2-table-card">
          <div className="ec-v2-card-head"><h2>Assinaturas e pagamentos <HelpCircle size={16} /></h2><button type="button" className="ec-v2-control">Todos os planos <ChevronDown size={15} /></button></div>
          <DataTable columns={['Aluno', 'Plano', 'Status', 'Próxima cobrança', 'Valor', 'Método']} rows={rows} action />
          <a className="ec-v2-table-link">Ver todas as assinaturas</a>
        </Card>
        <div className="ec-v2-finance-side-cards">
          <Card>
            <div className="ec-v2-card-head"><h2>Inadimplência <HelpCircle size={16} /></h2></div>
            <div className="ec-v2-delinquency"><Ring value={21} label="2,1%" sublabel="Inadimplência" tone="pink" /><div><span>Valor em atraso</span><strong>R$ 1.240,00</strong><span>Alunos inadimplentes</span><strong>6</strong></div></div>
          </Card>
          <Card className="ec-v2-coupon-card"><IconBubble icon={Gift} /><div><h2>Cupons e descontos</h2><p>Cupons utilizados <strong>18</strong></p><p>Descontos concedidos <strong>R$ 1.120,00</strong></p></div></Card>
        </div>
      </div>
    </DesktopShell>
  )
}

function Legend({ items }: { items: string[] }) {
  return (
    <div className="ec-v2-legend">
      {items.map((item, index) => <p key={item}><i style={{ background: ['#6C4DFF', '#3B82F6', '#22C55E', '#FBC647'][index] }} />{item}</p>)}
    </div>
  )
}

export function MentorInfluencersScreen() {
  const kpis = [
    { icon: Users, label: 'Influencers ativos', value: '156', trend: '18%' },
    { icon: CircleDollarSign, label: 'Receita gerada', value: 'R$ 128.450', trend: '24%' },
    { icon: LineChart, label: 'Conversões', value: '1.248', trend: '16%' },
    { icon: Wallet, label: 'Comissão a pagar', value: 'R$ 18.640', trend: '22%' },
    { icon: Target, label: 'CAC por creator', value: 'R$ 12,34', trend: '6%' },
    { icon: Gift, label: 'Cupons ativos', value: '86', trend: '12%' },
  ]
  const rows = ['Ana Paula Coach', 'Lucas Ferreira', 'Carla Ribeiro', 'Rafael Almeida', 'Mariana Costa'].map((name, index) => [
    <span className="ec-v2-person" key="creator"><Avatar name={name} index={index} /> <span>{name}<small>@{name.toLowerCase().split(' ')[0]}</small></span></span>,
    ['ANA10', 'VEMPROCLUB', 'MINDSET', 'TEAMFIT', 'DESAFIO15'][index],
    ['1.245', '876', '532', '982', '654'][index],
    ['320', '210', '148', '260', '166'][index],
    ['128', '94', '61', '112', '69'][index],
    ['10,3%', '10,7%', '11,5%', '11,4%', '10,6%'][index],
    ['R$ 18.450', 'R$ 13.760', 'R$ 8.920', 'R$ 16.340', 'R$ 9.870'][index],
    <Badge key="status" tone={index % 2 === 0 ? 'success' : 'warning'}>{index % 2 === 0 ? 'Pago' : 'Pendente'}</Badge>,
  ])

  return (
    <DesktopShell active="Influencers" title="Influencers e afiliados" subtitle="Acompanhe performance, comissões e repasses.">
      <div className="ec-v2-kpi-grid ec-v2-kpi-grid--six">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
      <div className="ec-v2-affiliate-grid">
        <Card className="ec-v2-chart-card"><div className="ec-v2-card-head"><h2>Performance ao longo do tempo <HelpCircle size={16} /></h2><button type="button" className="ec-v2-control">Diário <ChevronDown size={15} /></button></div><LineAreaChart dotted /><div className="ec-v2-chart-tooltip">31 de maio<br /><strong>Receita: R$ 21.450</strong><br />Conversões: 132</div></Card>
        <Card className="ec-v2-funnel-card"><h2>Funil de conversão</h2><div className="ec-v2-funnel-layout"><FunnelChart /><div><p>Cliques <strong>12.450</strong></p><p>Leads <strong>3.620</strong><Badge>29,1%</Badge></p><p>Conversões <strong>1.248</strong><Badge>34,5%</Badge></p><p>Vendas <strong>986</strong><Badge>79,0%</Badge></p></div></div><span>Taxa de conversão geral: 7,9%</span></Card>
        <div className="ec-v2-side-stack">
          <Card className="ec-v2-payout-list"><div className="ec-v2-card-head"><h2>Próximos repasses</h2><a>Ver todos</a></div>{['12 JUN R$ 8.450', '19 JUN R$ 9.870', '26 JUN R$ 7.320'].map((item) => <p key={item}>{item}<Badge tone="warning">Pendente</Badge></p>)}</Card>
          <Card className="ec-v2-coupon-list"><div className="ec-v2-card-head"><h2>Links/cupons mais usados</h2><a>Ver todos</a></div>{['ANA10', 'TEAMFIT', 'VEMPROCLUB', 'DESAFIO15', 'MINDSET'].map((item, index) => <p key={item}><Badge>{item}</Badge><span>{[1245, 982, 876, 654, 532][index]} usos</span><strong>R$ {[18450, 12760, 10230, 7890, 6120][index].toLocaleString('pt-BR')}</strong></p>)}</Card>
          <Card className="ec-v2-program-card"><IconBubble icon={Users} /><h2>Programa de afiliados</h2><p>Convide mais creators e aumente suas vendas com o Expert Club.</p><V2Button>Ver materiais</V2Button></Card>
          <V2Button variant="primary" icon={<UserPlus size={18} />}>Cadastrar influencer</V2Button>
        </div>
        <Card className="ec-v2-table-card ec-v2-wide-table"><div className="ec-v2-card-head"><h2>Top creators</h2></div><DataTable columns={['Creator', 'Cupom', 'Cliques', 'Leads', 'Vendas', 'Taxa de conversão', 'Receita gerada', 'Status de repasse']} rows={rows} action /><a className="ec-v2-table-link">Ver todos os influencers</a></Card>
      </div>
    </DesktopShell>
  )
}

export function MentorStudentsScreen() {
  const rows = people.slice(0, 8).map((name, index) => [
    <label className="ec-v2-check-person" key="person"><input type="checkbox" /> <Avatar name={name} index={index} /> <span>{name}<small>@{name.toLowerCase().replace(' ', '')}</small></span></label>,
    <Badge key="plan" tone={index % 2 === 0 ? 'violet' : 'info'}>{index % 2 === 0 ? 'Expert Club Pro' : 'Expert Club'}</Badge>,
    ['Perda de peso', 'Ganho de massa', 'Definição muscular', 'Performance', 'Emagrecimento', 'Hipertrofia', 'Bem-estar', 'Ganho de massa'][index],
    <div className="ec-v2-adhesion" key="ad">{[82, 64, 76, 91, 48, 69, 38, 83][index]}%<ProgressBar value={[82, 64, 76, 91, 48, 69, 38, 83][index]} /></div>,
    <span key="last"><i className={cx('ec-v2-dot', index > 4 && 'is-warning')} />{['Hoje, 09:32', 'Ontem, 21:15', 'Ontem, 17:41', 'Hoje, 07:12', '3 dias atrás', 'Ontem, 20:03', '5 dias atrás', 'Hoje, 06:45'][index]}</span>,
    ['Hoje, 18:00', 'Amanhã, 08:00', '12 Jun, 09:00', 'Hoje, 17:00', '13 Jun, 08:00', 'Amanhã, 07:30', '14 Jun, 10:00', 'Hoje, 19:00'][index],
    <Badge key="status" tone={index === 6 ? 'danger' : index === 4 ? 'warning' : 'success'}>{index === 6 ? 'Atrasada' : index === 4 ? 'Vencendo' : 'Ativa'}</Badge>,
    <span key="risk" className={cx('ec-v2-risk', index === 4 || index === 6 ? 'is-high' : index === 1 || index === 5 ? 'is-mid' : '')}>{[15, 28, 22, 12, 56, 33, 72, 18][index]}<small>{index === 4 || index === 6 ? 'Alto risco' : index === 1 || index === 5 ? 'Médio risco' : 'Baixo risco'}</small></span>,
  ])

  return (
    <DesktopShell active="Alunos" eyebrow="ALUNOS • GERENCIADOR" title="Alunos ativos" subtitle="Gerencie contas, status e acompanhamento dos seus alunos.">
      <div className="ec-v2-kpi-grid ec-v2-kpi-grid--five">
        {[
          { icon: Users, label: 'Alunos ativos', value: '156', trend: '12%' },
          { icon: ClipboardCheck, label: 'Em onboarding', value: '28', trend: '8%', danger: true },
          { icon: ShieldAlert, label: 'Em atenção', value: '14', trend: '27%', warning: true },
          { icon: Target, label: 'Check-ins hoje', value: '18', trend: '5%' },
          { icon: CreditCard, label: 'Assinaturas vencendo', value: '9', trend: '3%' },
        ].map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>
      <div className="ec-v2-students-grid">
        <div className="ec-v2-students-main">
          <Card className="ec-v2-filter-card">
            <div className="ec-v2-search"><input aria-label="Buscar aluno" placeholder="Buscar por nome, e-mail ou @username" /><Search size={18} /></div>
            {['Plano', 'Status', 'Coach', 'Objetivo', 'Risco'].map((filter) => <button type="button" className="ec-v2-control" key={filter}>{filter}<strong>Todos</strong><ChevronDown size={15} /></button>)}
            <V2Button variant="ghost">Limpar filtros</V2Button>
          </Card>
          <Card className="ec-v2-table-card">
            <div className="ec-v2-bulkbar"><label><input type="checkbox" /> 0 selecionados</label><a>Selecionar todos na página</a><V2Button icon={<Send size={16} />}>Enviar mensagem</V2Button><V2Button icon={<Copy size={16} />}>Atualizar plano</V2Button><V2Button icon={<Archive size={16} />}>Arquivar</V2Button><V2Button icon={<Download size={16} />}>Exportar</V2Button></div>
            <DataTable columns={['Aluno', 'Plano', 'Objetivo', 'Adesão', 'Última atividade', 'Próximo check-in', 'Status da assinatura', 'Score de risco']} rows={rows} action />
            <div className="ec-v2-pagination"><span>Mostrar 8 por página</span><button type="button"><ChevronLeft size={16} /></button><button type="button" className="is-active">1</button><button type="button">2</button><button type="button">3</button><button type="button"><ChevronRight size={16} /></button></div>
          </Card>
          <InsightBanner title="Mantenha sua base engajada" body="Alunos ativos e acompanhados têm 3x mais resultados e renovam por mais tempo." />
        </div>
        <div className="ec-v2-side-stack">
          <Card className="ec-v2-base-summary"><h2>Resumo da base</h2>{['Expert Club Pro', 'Expert Club', 'Starter'].map((plan, index) => <p key={plan}><span>{plan}</span><strong>{[84, 58, 14][index]}</strong><small>{['53.8%', '37.2%', '9.0%'][index]}</small><ProgressBar value={[54, 37, 9][index]} /></p>)}<h3>Por objetivo</h3>{['Perda de peso', 'Ganho de massa', 'Definição muscular', 'Performance', 'Bem-estar'].map((goal, index) => <p key={goal}><Badge tone={['violet', 'info', 'success', 'warning', 'pink'][index] as Tone}>{goal}</Badge><strong>{[48, 36, 24, 18, 14][index]}</strong></p>)}</Card>
          <Card className="ec-v2-attention"><div className="ec-v2-card-head"><h2>Fila de atenção <Badge tone="pink">14</Badge></h2><a>Ver todos</a></div>{['Mariana Costa', 'Fernanda Oliveira', 'Bruno Andrade', 'Patrícia Lima'].map((name, index) => <p key={name}><Avatar name={name} index={index + 4} /><span>{name}<small>{['Risco alto • 3 dias sem atividade', 'Risco alto • 5 dias sem atividade', 'Check-in atrasado • 2 dias', 'Adesão abaixo de 40%'][index]}</small></span></p>)}<V2Button>Ver fila completa</V2Button></Card>
        </div>
      </div>
    </DesktopShell>
  )
}

export function MentorWorkoutPrescriptorScreen() {
  const exercises = ['Supino reto com barra', 'Supino inclinado halteres', 'Crucifixo na máquina', 'Desenvolvimento com halteres', 'Elevação lateral', 'Tríceps na polia']
  const rows = exercises.map((name, index) => [
    <span className="ec-v2-drag" key="order">⋮⋮</span>,
    <span key="exercise" className="ec-v2-exercise-cell"><ExerciseArt index={index} /> <span>{name}<small>{index < 3 ? 'Peito' : index < 5 ? 'Ombro' : 'Tríceps'}</small></span></span>,
    <button type="button" key="series" className="ec-v2-cell-select">{index === 2 || index > 3 ? '3' : '4'} <ChevronDown size={14} /></button>,
    <button type="button" key="reps" className="ec-v2-cell-select">{index % 2 === 0 ? '8 – 10' : '12 – 15'}</button>,
    <button type="button" key="rest" className="ec-v2-cell-select">{index % 2 === 0 ? '90s' : '60s'}</button>,
    <button type="button" key="load" className="ec-v2-cell-select">{index === 0 ? '70% 1RM' : index === 3 ? '65% 1RM' : '-'}</button>,
    <button type="button" key="rpe" className="ec-v2-cell-select">{index < 2 || index === 3 ? '7' : index === 5 ? '9' : '8'}</button>,
    <input key="obs" className="ec-v2-table-input" aria-label={`Observações para ${name}`} placeholder={index === 2 ? 'Foco na contração' : 'Obs. (opcional)'} readOnly />,
    <button type="button" key="super" className="ec-v2-cell-select">{index > 3 ? '1' : '-'}</button>,
  ])

  return (
    <DesktopShell active="Treinos" title="Prescritor de treino" subtitle="Monte, personalize e salve planos de treino.">
      <ContextCard type="workout" />
      <BuilderTabs active="Divisão semanal" items={['Visão geral', 'Divisão semanal', 'Biblioteca', 'Modelos']} />
      <div className="ec-v2-builder-actions"><V2Button icon={<Copy size={17} />}>Duplicar dia</V2Button><V2Button icon={<Bookmark size={17} />}>Salvar modelo</V2Button><V2Button variant="primary" icon={<Send size={17} />}>Publicar treino</V2Button></div>
      <div className="ec-v2-prescriptor-grid">
        <div className="ec-v2-builder-main">
          <div className="ec-v2-day-tabs">{['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => <button type="button" key={day} className={index === 0 ? 'is-active' : ''}>{day}{index > 0 && index < 4 && <i />}</button>)}<button type="button"><Plus size={18} /></button></div>
          <Card className="ec-v2-builder-table-card">
            <div className="ec-v2-card-head"><div><h2>Treino de Segunda <Edit3 size={16} /></h2><p>Peito • Ombro • Tríceps</p></div><div className="ec-v2-builder-stats"><span><Clock size={16} /> 75 min</span><span><Dumbbell size={16} /> 18.450 kg</span></div><V2Button icon={<Plus size={16} />}>Adicionar exercício</V2Button></div>
            <DataTable columns={['', 'Exercício', 'Séries', 'Reps', 'Descanso', 'Carga alvo', 'RPE', 'Observações', 'Supersets']} rows={rows} action />
            <button type="button" className="ec-v2-add-super"><Plus size={15} /> Adicionar superset</button>
          </Card>
          <div className="ec-v2-note-grid"><Card><IconBubble icon={MessageCircle} /><div><h2>Observação do mentor</h2><p>Priorizar execução controlada e amplitude completa em todos os movimentos. Ajustar cargas conforme evolução da semana e feedback do aluno.</p></div><Edit3 size={18} /></Card><Card><IconBubble icon={Archive} /><div><h2>Anexos e materiais</h2><p>Adicionar material de apoio<br />PDFs, vídeos ou imagens</p></div></Card></div>
          <Card className="ec-v2-template-bar"><IconBubble icon={Calendar} /><div><h2>Modelos de treino</h2><p>Use modelos prontos como ponto de partida ou inspire-se nas melhores divisões.</p></div><button type="button" className="ec-v2-control">Hipertrofia – 5x/semana <ChevronDown size={16} /></button><V2Button>Aplicar modelo</V2Button></Card>
        </div>
        <LibraryPanel type="exercise" />
      </div>
    </DesktopShell>
  )
}

function ContextCard({ type }: { type: 'workout' | 'diet' }) {
  return (
    <Card className="ec-v2-context-card">
      <Avatar name={type === 'workout' ? 'Rafael Almeida' : 'Juliana Martins'} index={type === 'workout' ? 1 : 0} size="lg" />
      <div>
        <span>{type === 'workout' ? 'Aluno selecionado' : 'Juliana Martins'}</span>
        <h2>{type === 'workout' ? 'Rafael Almeida' : 'juliana.martins@email.com'}</h2>
        <p>{type === 'workout' ? 'Ver perfil do aluno' : '24 anos • 1,65 m • 62 kg'}</p>
      </div>
      {(type === 'workout'
        ? [
            ['Objetivo', 'Hipertrofia', Target],
            ['Fase', 'Força', Copy],
            ['Frequência semanal', '5 dias/semana', Calendar],
          ]
        : [
            ['Objetivo', 'Definição muscular', Target],
            ['Calorias alvo', '1.850 kcal', Flame],
            ['Macros alvo', '135g / 185g / 62g', PieChart],
            ['Restrições', 'Sem glúten', ShieldCheck],
            ['Preferências', 'Frango e peixe', Apple],
          ]).map(([label, value, Icon]) => (
        <div className="ec-v2-context-item" key={label as string}>
          <IconBubble icon={Icon as LucideIcon} />
          <span>{label as string}</span>
          <strong>{value as string}</strong>
        </div>
      ))}
      <V2Button>Ver perfil completo</V2Button>
    </Card>
  )
}

function BuilderTabs({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="ec-v2-tabs" role="tablist">
      {items.map((item) => <button type="button" role="tab" aria-selected={item === active} className={item === active ? 'is-active' : ''} key={item}>{item}</button>)}
    </div>
  )
}

function LibraryPanel({ type }: { type: 'exercise' | 'food' }) {
  const exerciseItems = ['Agachamento livre', 'Leg press 45°', 'Puxada frente', 'Remada curvada', 'Supino reto', 'Supino inclinado', 'Desenvolvimento', 'Elevação lateral', 'Tríceps na polia', 'Rosca direta']
  const foodItems = ['Peito de frango grelhado', 'Arroz integral cozido', 'Batata doce cozida', 'Ovo inteiro cozido', 'Banana prata']

  return (
    <Card className="ec-v2-library">
      <div className="ec-v2-card-head"><h2>{type === 'exercise' ? 'Biblioteca de exercícios' : 'Biblioteca de alimentos'}</h2><ChevronDown size={18} /></div>
      <div className="ec-v2-search"><input aria-label={type === 'exercise' ? 'Buscar exercícios' : 'Buscar alimentos'} placeholder={type === 'exercise' ? 'Buscar exercícios...' : 'Buscar alimento...'} /><Search size={18} /></div>
      {type === 'exercise' ? (
        <>
          <div className="ec-v2-library-filters"><button type="button" className="ec-v2-control">Grupo muscular <ChevronDown size={15} /></button><button type="button" className="ec-v2-control">Equipamento <ChevronDown size={15} /></button></div>
          <div className="ec-v2-exercise-grid">{exerciseItems.map((item, index) => <button type="button" key={item}><ExerciseArt index={index} /><span>{item}<small>{index < 2 ? 'Pernas' : index < 4 ? 'Costas' : index < 6 ? 'Peito' : index < 8 ? 'Ombro' : 'Braços'}</small></span></button>)}</div>
          <V2Button>Ver mais exercícios</V2Button>
        </>
      ) : (
        <>
          <div className="ec-v2-chip-row">{['Todos', 'Proteínas', 'Carboidratos', 'Gorduras', 'Vegetais'].map((chip, index) => <Badge key={chip} tone={index === 0 ? 'violet' : 'neutral'}>{chip}</Badge>)}</div>
          <div className="ec-v2-food-table">{foodItems.map((item, index) => <p key={item}><FoodIcon label={item} /><span>{item}<small>{[165, 111, 86, 78, 105][index]} kcal</small></span><button type="button"><Plus size={15} /></button></p>)}</div>
          <a className="ec-v2-table-link">Ver todos os alimentos</a>
        </>
      )}
    </Card>
  )
}

export function MentorDietPrescriptorScreen() {
  const meals = [
    ['Café da manhã', '07:00', '420 kcal', ['Ovos mexidos', 'Pão integral', 'Banana', 'Café sem açúcar']],
    ['Almoço', '12:30', '540 kcal', ['Filé de frango grelhado', 'Arroz integral', 'Feijão carioca', 'Salada mista', 'Azeite de oliva']],
    ['Lanche', '16:00', '250 kcal', ['Iogurte natural desnatado', 'Granola sem açúcar', 'Morango']],
    ['Jantar', '19:30', '480 kcal', ['Salmão grelhado', 'Batata doce cozida', 'Brócolis no vapor']],
    ['Ceia', '22:00', '160 kcal', ['Queijo cottage', 'Chia']],
  ]

  return (
    <DesktopShell active="Dietas" title="Prescritor de dieta" subtitle="Crie planos alimentares, metas e substituições.">
      <ContextCard type="diet" />
      <BuilderTabs active="Plano do dia" items={['Plano do dia', 'Refeições', 'Substituições', 'Lista de compras', 'Modelos']} />
      <div className="ec-v2-builder-actions"><V2Button icon={<CalendarCheck size={17} />}>Gerar lista de compras</V2Button><V2Button icon={<Check size={17} />}>Salvar plano</V2Button><V2Button variant="primary" icon={<Send size={17} />}>Publicar dieta</V2Button></div>
      <div className="ec-v2-diet-grid">
        <Card className="ec-v2-meal-builder">
          {meals.map(([meal, time, kcal, foods]) => (
            <div className="ec-v2-meal-row" key={meal as string}>
              <div><Clock size={16} /><h2>{meal as string}</h2><span>{time as string}</span><strong>{kcal as string}</strong></div>
              <div className="ec-v2-food-list">{(foods as string[]).map((food, index) => <p key={food}><FoodIcon label={food} /><span>{food}</span><small>{[140, 140, 90, 50, 68][index] ?? 55}</small><small>{[12, 6, 1, 0, 0][index] ?? 2} g</small><small>{[2, 24, 23, 0, 8][index] ?? 6} g</small><small>{[10, 2, 0, 0, 1][index] ?? 1} g</small></p>)}</div>
              <V2Button icon={<Plus size={16} />}>Adicionar alimento</V2Button>
              <MoreVertical size={18} />
            </div>
          ))}
          <V2Button icon={<Plus size={17} />}>Adicionar refeição</V2Button>
        </Card>
        <div className="ec-v2-side-stack">
          <Card className="ec-v2-macro-card"><h2>Resumo de macros</h2><div className="ec-v2-macro-layout"><Ring value={100} label="1.850" sublabel="kcal" size="lg" /><div>{[['Proteínas', 100, '135 g (29%)'], ['Carboidratos', 100, '185 g (40%)'], ['Gorduras', 100, '62 g (31%)']].map(([label, value, meta], index) => <p key={label as string}><span>{label as string}<b>{meta as string}</b></span><ProgressBar value={value as number} tone={index === 1 ? 'info' : index === 2 ? 'warning' : 'violet'} /></p>)}</div></div></Card>
          <LibraryPanel type="food" />
          <Card className="ec-v2-substitution-card"><div className="ec-v2-card-head"><h2>Substituições inteligentes</h2><a>Ver todas</a></div><div><p><strong>Arroz branco (100g)</strong><span>130 kcal</span></p><Zap size={18} /><p><strong>Arroz integral (100g)</strong><span>111 kcal</span></p></div><Badge tone="success">15% mais fibras</Badge><V2Button>Usar substituição</V2Button></Card>
        </div>
      </div>
      <button type="button" className="ec-v2-fab" aria-label="Assistente inteligente"><Sparkles /></button>
    </DesktopShell>
  )
}

export function AdminProductOverviewScreen() {
  const kpis = [
    { icon: CircleDollarSign, label: 'MRR', value: 'R$ 245.760', trend: '14%' },
    { icon: DollarSign, label: 'ARR', value: 'R$ 2.949.120', trend: '16%' },
    { icon: ShieldCheck, label: 'Workspaces ativos', value: '128', trend: '8%' },
    { icon: Users, label: 'Mentores ativos', value: '312', trend: '11%' },
    { icon: Users, label: 'Alunos ativos', value: '2.845', trend: '13%' },
    { icon: Clock, label: 'Conversão trial', value: '24,8%', trend: '2,3 p.p.' },
    { icon: Dumbbell, label: 'Churn (MRR)', value: '2,1%', trend: '0,4 p.p.', danger: true },
    { icon: Calendar, label: 'Tickets abertos', value: '18', trend: '12%' },
  ]
  const rows = ['Alpha Team', 'Performance Hub', 'Elite Coaching', 'Growth Hub', 'Next Level'].map((name, index) => [
    <span className="ec-v2-person" key="workspace"><Avatar name={name} index={index} /> {name}</span>,
    ['Expert Pro', 'Expert Plus', 'Expert Pro', 'Trial', 'Expert Essential'][index],
    ['142', '98', '86', '12', '54'][index],
    ['R$ 28.900', 'R$ 18.750', 'R$ 16.340', 'R$ 0', 'R$ 9.870'][index],
    <Badge key="health" tone={index === 2 ? 'warning' : index === 3 ? 'neutral' : 'success'}>{index === 0 ? 'Excelente' : index === 2 ? 'Atenção' : index === 3 ? 'Inativo' : 'Boa'}</Badge>,
    ['Há 5 min', 'Há 32 min', 'Há 2 h', 'Há 1 dia', 'Há 3 h'][index],
  ])

  return (
    <DesktopShell admin active="Visão geral" eyebrow="ADMINISTRAÇÃO" title="Administração do produto" subtitle="Visão estratégica da operação do Expert Club.">
      <div className="ec-v2-kpi-grid ec-v2-kpi-grid--eight">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
      <div className="ec-v2-admin-grid">
        <Card className="ec-v2-chart-card"><div className="ec-v2-card-head"><h2>MRR / crescimento <HelpCircle size={16} /></h2><button type="button" className="ec-v2-control">Diário <ChevronDown size={15} /></button></div><LineAreaChart dotted /><div className="ec-v2-chart-tooltip is-admin">1 de jun. de 2024<br /><strong>MRR atual R$ 245.760</strong></div></Card>
        <Card className="ec-v2-donut-card"><div className="ec-v2-card-head"><h2>Distribuição de planos</h2></div><div className="ec-v2-donut-layout"><DonutChart center="128" label="workspaces" /><Legend items={['Expert Pro 48 (37,5%)', 'Expert Plus 40 (31,3%)', 'Expert Essential 28 (21,9%)', 'Trial 12 (9,4%)']} /></div><a className="ec-v2-table-link">Ver todos os planos</a></Card>
        <div className="ec-v2-side-stack"><Card className="ec-v2-operation-alerts"><div className="ec-v2-card-head"><h2>Alertas da operação</h2><a>Ver todos</a></div>{[['Churn acima do limite', 'Churn de 2,1% acima da meta (2,0%)', 'danger'], ['Pagamento falhou', '12 assinaturas com falha de pagamento', 'warning'], ['Workspace inativo', '7 workspaces sem atividade há 14+ dias', 'violet'], ['Tickets críticos', '3 tickets críticos aguardando resposta', 'info'], ['Novo workspace criado', 'Growth Hub acabou de ser criado', 'success']].map(([title, body, tone]) => <p key={title}><IconBubble icon={ShieldAlert} tone={tone as Tone} /><span><strong>{title}</strong><small>{body}</small></span><em>Há 20 min</em></p>)}</Card><Card className="ec-v2-quick-actions"><h2>Ações rápidas</h2>{['Novo workspace', 'Convidar usuário', 'Criar campanha', 'Ver relatórios financeiros'].map((item, index) => {
          const Icon = [Calendar, UserPlus, ShieldCheck, BookOpen][index]
          return <V2Button key={item} icon={<Icon size={18} />}>{item}</V2Button>
        })}</Card></div>
        <Card className="ec-v2-revenue-origin"><h2>Origem da receita (MRR)</h2><DonutChart center="R$ 245.760" label="MRR total" /><Legend items={['Assinaturas 78,2%', 'Add-ons 12,6%', 'One-offs 6,3%', 'Outros 2,9%']} /></Card>
        <Card className="ec-v2-health-card"><h2>Saúde da operação</h2>{['Receita', 'Engajamento', 'Suporte', 'Infraestrutura', 'Satisfação (NPS)'].map((item, index) => <p key={item}><IconBubble icon={[Clock, Heart, ShieldCheck, Building2, Star][index]} /><span>{item}</span><Badge tone={index === 1 ? 'warning' : 'success'}>{index === 1 ? 'Atenção' : index === 4 ? 'Bom 72' : 'Saudável'}</Badge></p>)}<a className="ec-v2-table-link">Ver detalhes da saúde</a></Card>
        <Card className="ec-v2-bars-card"><h2>Ativação de workspaces</h2>{['Criado', 'Convite enviado', 'Ativo', 'Pago', 'Engajado'].map((item, index) => <p key={item}><span>{index + 1}</span>{item}<ProgressBar value={[100, 73, 61, 45, 36][index]} /><b>{[128, 94, 78, 58, 46][index]}</b></p>)}</Card>
        <Card className="ec-v2-bars-card"><h2>Feature adoption</h2>{['Check-ins', 'Planos', 'Treinos', 'Conteúdo', 'Relatórios'].map((item, index) => <p key={item}><IconBubble icon={[CalendarCheck, Dumbbell, ClipboardCheck, BookOpen, BarChart3][index]} />{item}<ProgressBar value={[92, 78, 64, 58, 46][index]} /><b>{[92, 78, 64, 58, 46][index]}%</b></p>)}</Card>
        <Card className="ec-v2-table-card ec-v2-wide-table"><div className="ec-v2-card-head"><h2>Workspaces em destaque</h2></div><DataTable columns={['Workspace', 'Plano', 'Usuários', 'Receita (MRR)', 'Saúde', 'Última atividade']} rows={rows} action /><a className="ec-v2-table-link">Ver todos os workspaces</a></Card>
      </div>
    </DesktopShell>
  )
}

function MobileShell({ children, active }: { children: ReactNode; active: 'Início' | 'Treinos' | 'Dieta' | 'Ranking' | 'Perfil' }) {
  return (
    <main className="ec-v2-mobile">
      <div className="ec-v2-mobile-page">
        {children}
        <MobileBottomNav active={active} />
      </div>
    </main>
  )
}

function MobileTop({ title, subtitle, logo = true, back = false, coach = false }: { title?: string; subtitle?: string; logo?: boolean; back?: boolean; coach?: boolean }) {
  return (
    <header className="ec-v2-mobile-top">
      {back && <a href="/student/workouts" aria-label="Voltar"><ArrowLeft /></a>}
      {logo && <ExpertLogo color="dark" variant="full" animate={false} className="ec-v2-mobile-logo" />}
      {title && <div className="ec-v2-mobile-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>}
      <div className="ec-v2-mobile-actions">
        {coach && <div className="ec-v2-coach"><span>Seu coach</span><strong>Juliana R.</strong></div>}
        <Bell aria-hidden="true" />
        <Avatar name="Mariana Alves" index={0} size="md" />
      </div>
    </header>
  )
}

function MobileBottomNav({ active }: { active: 'Início' | 'Treinos' | 'Dieta' | 'Ranking' | 'Perfil' }) {
  const items = [
    ['Início', Home, '/student/dashboard'],
    ['Treinos', Dumbbell, '/student/workout'],
    ['Dieta', Utensils, '/student/diet'],
    ['Ranking', Trophy, '/student/ranking'],
    ['Perfil', UserRound, '/student/profile'],
  ] as const

  return (
    <nav className="ec-v2-bottom-nav" aria-label="Navegação do aluno">
      {items.map(([label, Icon, href]) => (
        <a key={label} href={href} className={active === label ? 'is-active' : ''}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  )
}

export function StudentMobileDashboardScreen() {
  return (
    <MobileShell active="Início">
      <MobileTop />
      <section className="ec-v2-mobile-title-block">
        <h1>Olá, Mariana <Sparkles aria-hidden="true" /></h1>
        <p>Seu foco de hoje constrói a sua melhor versão de amanhã.</p>
      </section>
      <div className="ec-v2-mobile-dashboard-grid">
        <Card className="ec-v2-mobile-plan">
          <div className="ec-v2-card-head"><h2><Calendar /> Plano de hoje</h2><span>Sexta-feira, 10 de maio</span></div>
          {[
            [Dumbbell, 'Treino do dia', 'Força • Membros inferiores', 'Treino A - Força', '45 min', 'Intermediário', 'Iniciar treino'],
            [Utensils, 'Dieta do dia', 'Plano de refeições', 'Plano de hoje', '2.100 kcal', 'Alta proteína', 'Ver dieta'],
            [ClipboardCheck, 'Check-in do dia', 'Seu acompanhamento diário', 'Check-in diário', 'Rápido', '2 min', 'Responder'],
          ].map(([Icon, label, meta, title, chipA, chipB, action]) => (
            <div className="ec-v2-mobile-task" key={title as string}>
              <IconBubble icon={Icon as LucideIcon} />
              <div><strong>{label as string}</strong><span>{meta as string}</span><h3>{title as string}</h3><p><Badge tone="neutral">{chipA as string}</Badge><Badge tone={chipB === 'Alta proteína' ? 'success' : 'neutral'}>{chipB as string}</Badge></p></div>
              <V2Button icon={<ChevronRight size={16} />}>{action as string}</V2Button>
            </div>
          ))}
          <div className="ec-v2-mobile-streak"><IconBubble icon={Flame} tone="warning" /><p>Você está em uma ótima sequência!<span>Continue assim para alcançar seus objetivos.</span></p><strong>12</strong><span>dias seguidos</span></div>
        </Card>
        <HydrationMobileCard />
        <Card className="ec-v2-mobile-week"><div className="ec-v2-card-head"><h2><BarChart3 /> Evolução da semana</h2><strong>76%</strong></div><MiniBars /><Badge tone="success">↑ 12% vs. semana passada</Badge></Card>
        <RankingMini />
        <Card className="ec-v2-mobile-challenges"><div className="ec-v2-card-head"><h2><Flag /> Desafios ativos</h2><a>Ver todos</a></div>{['Desafio 30 Dias de Foco', 'Desafio Hidratação'].map((challenge, index) => <div key={challenge}><strong>{challenge}</strong><span>{index === 0 ? '18 / 30 dias' : '10 / 14 dias'}<b>{index === 0 ? '60%' : '71%'}</b></span><ProgressBar value={index === 0 ? 60 : 71} /></div>)}</Card>
        <Card className="ec-v2-mobile-checkin"><h2><CalendarCheck /> Próximo check-in</h2><div><span>Domingo, 12 de maio</span><strong>20:00</strong><Badge tone="success">Faltam 2 dias</Badge></div><p>Prepare-se! Responda com atenção e mantenha seus dados sempre atualizados.</p></Card>
        <Card className="ec-v2-mobile-agenda"><h2><Calendar /> Sua agenda</h2><div>{['Sex 10', 'Sáb 11', 'Dom 12', 'Seg 13', 'Ter 14', 'Qua 15', 'Qui 16'].map((day, index) => <button type="button" key={day} className={index === 0 ? 'is-active' : ''}>{day}</button>)}</div><ul><li><Dumbbell /> Treino A - Força</li><li><Utensils /> Plano de refeições</li><li><ClipboardCheck /> Check-in diário</li></ul></Card>
        {[
          [Flame, 'Sequência', '12 dias', 'Melhor: 28 dias'],
          [Moon, 'Sono', '7h 30m', 'Qualidade: Boa'],
          [Heart, 'Bem-estar', '8,5 /10', 'Muito bem!'],
          [Zap, 'Energia', 'Alta', 'Pronta para o dia!'],
        ].map(([Icon, title, value, meta]) => <Card key={title as string} className="ec-v2-mobile-stat"><h2><Icon />{title as string}</h2><strong>{value as string}</strong><span>{meta as string}</span></Card>)}
      </div>
    </MobileShell>
  )
}

function HydrationMobileCard() {
  return (
    <Card className="ec-v2-mobile-hydration">
      <div className="ec-v2-card-head"><h2><Droplets /> Hidratação</h2><strong>2,0 L / 2,5 L</strong></div>
      <div><Ring value={80} label="80%" sublabel="da meta" size="lg" /><div><span>Adicionar água</span>{['+250 ml', '+500 ml', '+750 ml'].map((amount) => <V2Button key={amount}>{amount}</V2Button>)}</div></div>
      <V2Button>Registrar outra <Plus size={16} /></V2Button>
    </Card>
  )
}

function MiniBars() {
  return <div className="ec-v2-mini-bars">{[58, 72, 50, 68, 82, 78, 64].map((value, index) => <span key={index}><i style={{ height: `${value}%` }} /><b>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}</b></span>)}</div>
}

function RankingMini() {
  return (
    <Card className="ec-v2-mobile-ranking-mini">
      <div className="ec-v2-card-head"><h2><Trophy /> Ranking</h2><a>Ver ranking</a></div>
      <div><span className="ec-v2-mobile-medal">8</span><div><strong>Top 8%</strong><p>Entre 12.540 alunas</p></div></div>
      <p><strong>2.450 XP</strong><span>Nível 12</span></p>
      <ProgressBar value={70} />
      <small>Próximo: 3.000 XP</small>
    </Card>
  )
}

export function StudentWorkoutPreviewScreen() {
  const exercises = ['Agachamento Livre', 'Leg Press 45°', 'Levantamento Terra Romeno', 'Avanço Búlgaro', 'Hip Thrust', 'Elevação de Panturrilha']

  return (
    <MobileShell active="Treinos">
      <MobileTop title="Visualização do treino" logo={false} back coach />
      <Card className="ec-v2-workout-hero">
        <div><IconBubble icon={Dumbbell} /><h1>Treino A - Força</h1><p>Força • Membros inferiores</p><div className="ec-v2-chip-row"><Badge tone="neutral"><Clock size={14} /> 45 min</Badge><Badge tone="neutral"><BarChart3 size={14} /> Intermediário</Badge><Badge tone="warning"><Flame size={14} /> ~510 kcal</Badge><Badge><Zap size={14} /> Alta intensidade</Badge><Badge tone="success"><Activity size={14} /> Membros inferiores</Badge></div></div>
        <div className="ec-v2-workout-illustration"><Dumbbell /><Droplets /></div>
        <V2Button variant="primary" icon={<Play size={20} />}>Iniciar treino</V2Button>
      </Card>
      <Card className="ec-v2-week-strip"><Calendar /><div><strong>Esta semana</strong><span>1 de 3 treinos concluídos</span></div>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => <span key={day}><b>{day}</b><i className={index === 0 ? 'is-done' : index === 3 ? 'is-active' : ''}>{index === 0 ? <Check size={16} /> : index === 3 ? '4' : ''}</i></span>)}</Card>
      <InfoRow icon={Target} title="Objetivo do treino" body="Fortalecer os membros inferiores, aumentar a força e melhorar a resistência muscular." />
      <InfoRow icon={Flame} title="Aquecimento" body="Prepare seu corpo para o treino com 5–7 minutos de aquecimento dinâmico." action="7 min" />
      <Card className="ec-v2-exercise-list"><div className="ec-v2-card-head"><h2><Dumbbell /> Exercícios</h2><span>6 exercícios</span></div>{exercises.map((exercise, index) => <div key={exercise} className="ec-v2-exercise-row"><b>{index + 1}</b><ExerciseArt index={index} /><div><strong>{exercise}</strong><span>{index === 4 ? 'Glúteos' : index === 5 ? 'Panturrilhas' : 'Quadríceps, Glúteos'}</span></div><p><strong>{['4 x 8–10', '4 x 10–12', '3 x 8–10', '3 x 10–12 c/p', '3 x 12–15', '4 x 15–20'][index]}</strong><span>{['Carga pesada', 'Carga moderada', 'Foco na técnica', 'Cada perna', 'Contração máxima', 'Pausa de 1s'][index]}</span></p><ChevronRight /></div>)}<a>Ver detalhes completos <ChevronDown size={16} /></a></Card>
      <Card className="ec-v2-coach-note"><h2><MessageCircle /> Observações do coach</h2><blockquote>Mantenha a postura e o controle em cada repetição. Respeite seus limites e foque na execução!</blockquote><Avatar name="Juliana R." index={0} /></Card>
      <InfoRow icon={Sparkles} title="Alongamento" body="Finalize com alongamentos para relaxar e melhorar sua recuperação." action="5–8 min" />
    </MobileShell>
  )
}

function InfoRow({ icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: string }) {
  const Icon = icon
  return <Card className="ec-v2-info-row"><IconBubble icon={Icon} /><div><h2>{title}</h2><p>{body}</p></div>{action && <V2Button icon={<ChevronRight size={16} />}>{action}</V2Button>}</Card>
}

export function StudentWorkoutSessionScreen() {
  return (
    <MobileShell active="Treinos">
      <header className="ec-v2-session-top"><a href="/student/workout"><ArrowLeft /></a><h1>Treino A - Força</h1><button type="button"><Timer />28:47</button><MoreVertical /></header>
      <Card className="ec-v2-current-exercise"><div className="ec-v2-card-head"><Badge>EXERCÍCIO ATUAL</Badge><a><BookOpen size={17} /> Ver execução</a></div><h1>Agachamento Livre</h1><p><Activity /> Pernas • Quadríceps</p><div className="ec-v2-exercise-work"><ExerciseArt /><div><span>Prescrito</span><strong>4 séries × 8–10 reps</strong><span>Progresso</span><h2>2 / 4 séries</h2><ProgressBar value={50} /><V2Button variant="primary" icon={<Plus size={22} />}>Registrar série</V2Button></div></div><div className="ec-v2-session-metrics"><div><Ring value={72} label="00:52" sublabel="Pausar" /></div>{[['Carga (kg)', '80', Wallet], ['Repetições', '8', Dumbbell], ['Esforço (RPE)', '8', Activity]].map(([label, value, Icon]) => <p key={label as string}><IconBubble icon={Icon as LucideIcon} /><span>{label as string}</span><strong>{value as string}</strong><Edit3 size={16} /></p>)}</div><div className="ec-v2-completed-sets"><h2>Séries concluídas <span>2/4</span></h2>{['70 kg  10 reps  RPE 7  02:00', '80 kg  8 reps  RPE 8  01:45'].map((set, index) => <p key={set}><CheckCircle2 /> <b>{index + 1}</b>{set}<ChevronDown size={16} /></p>)}</div></Card>
      <Card className="ec-v2-next-exercise"><h2>Próximo exercício</h2><ExerciseArt index={2} /><div><strong>Supino Reto com Barra</strong><span>Peito • Tríceps • Ombros</span><Badge tone="neutral">3 séries × 8–12 reps</Badge></div><ChevronRight /></Card>
      <Card className="ec-v2-workout-progress"><div className="ec-v2-card-head"><h2>Progresso do treino</h2><a>Ver detalhes</a></div><div>{[[60, 'Concluído', Target], ['3 / 5', 'Exercícios', Dumbbell], ['215', 'kcal estimadas', Flame], ['28:47', 'Tempo decorrido', Clock]].map(([value, label, Icon], index) => <div className="ec-v2-progress-metric" key={label as string}>{index === 0 ? <Ring value={value as number} label={`${value}%`} sublabel={label as string} /> : <><IconBubble icon={Icon as LucideIcon} /><strong>{value as string}</strong><span>{label as string}</span></>}</div>)}</div><h3>Exercícios do treino</h3>{['Agachamento Livre', 'Supino Reto com Barra', 'Remada Curvada com Barra', 'Desenvolvimento com Halteres', 'Rosca Direta com Barra'].map((exercise, index) => <p className={index === 1 ? 'is-active' : index === 0 ? 'is-done' : ''} key={exercise}><b>{index + 1}</b><span>{exercise}<small>{index === 0 ? 'Pernas • Quadríceps' : index === 1 ? 'Peito • Tríceps • Ombros' : index === 2 ? 'Costas • Bíceps' : 'Ombros • Tríceps'}</small></span><em>{index === 0 ? '4 séries' : '3 séries'}</em><ChevronRight /></p>)}</Card>
      <div className="ec-v2-session-actions"><V2Button variant="secondary" icon={<Pause size={20} />}>Pausar treino</V2Button><V2Button variant="danger" icon={<Square size={18} />}>Finalizar treino</V2Button></div>
    </MobileShell>
  )
}

export function StudentDietMobileScreen() {
  const meals = [
    ['Café da manhã', '07:00', '420 kcal', 'Omelete de claras com espinafre, aveia com frutas e 1 café', true, Sun],
    ['Almoço', '12:30', '560 kcal', 'Peito de frango grelhado, arroz integral, feijão e salada', true, Sun],
    ['Lanche da tarde', '16:30', '210 kcal', 'Iogurte natural com whey e banana', false, Utensils],
    ['Jantar', '19:30', '350 kcal', 'Salmão grelhado, batata doce e legumes salteados', false, Moon],
    ['Ceia', '22:00', '140 kcal', 'Caseína com pasta de amendoim e cacau', false, Moon],
  ] as const

  return (
    <MobileShell active="Dieta">
      <MobileTop />
      <section className="ec-v2-mobile-title-block"><h1>Minha dieta <Apple /></h1></section>
      <Segmented items={['Hoje', 'Plano', 'Compras']} />
      <Card className="ec-v2-nutrition-summary"><div className="ec-v2-card-head"><h2><Droplets /> Resumo nutricional do dia</h2><Badge tone="success"><CheckCircle2 size={15} />75% concluído</Badge></div><div><Ring value={76} label="1.680" sublabel="kcal de 2.200 kcal" size="lg" /><div>{[['Proteínas', '112 g • 27%', 70], ['Carboidratos', '190 g • 46%', 86], ['Gorduras', '55 g • 27%', 74]].map(([label, meta, value]) => <p key={label as string}><span>{label as string}<b>{meta as string}</b></span><ProgressBar value={value as number} /><small>Meta: {label === 'Proteínas' ? '120 g' : label === 'Carboidratos' ? '210 g' : '60 g'}</small></p>)}</div><aside><Leaf /><strong>Dieta equilibrada</strong><p>Você está dentro das metas!</p><Badge tone="success">Excelente!</Badge></aside></div></Card>
      <Card className="ec-v2-meals-mobile">{meals.map(([meal, time, kcal, desc, done, Icon]) => <div className="ec-v2-meal-mobile" key={meal}><IconBubble icon={Icon} /><div><h2>{meal}</h2><span><Clock size={14} /> {time}</span><strong>{kcal}</strong></div><p>{desc}</p><div><Badge tone={done ? 'success' : 'violet'}>{done ? 'Refeição concluída' : 'Marcar como concluída'}</Badge><V2Button icon={<ChevronRight size={16} />}>Ver refeição</V2Button></div></div>)}</Card>
      <div className="ec-v2-diet-bottom-cards"><Card><h2><Droplets /> Hidratação</h2><strong>1,6 L <span>de 2,5 L</span></strong><ProgressBar value={64} /><V2Button>Registrar água <Plus size={16} /></V2Button></Card><Card><h2><LineChart /> Substituições</h2><strong>2 opções disponíveis</strong><div className="ec-v2-sub-icons"><FoodIcon label="Banana" /><FoodIcon label="Aveia" /><FoodIcon label="Amêndoas" /></div><V2Button>Ver opções</V2Button></Card><Card><h2><Star /> Nota do coach</h2><p>Parabéns! Você está mantendo uma ótima consistência. Continue assim e confie no processo!</p><span><Avatar name="Coach Pedro" index={2} /> Coach Pedro</span></Card></div>
    </MobileShell>
  )
}

function Segmented({ items }: { items: string[] }) {
  return <div className="ec-v2-segmented">{items.map((item, index) => <button type="button" key={item} className={index === 0 ? 'is-active' : ''}>{item}</button>)}</div>
}

export function StudentRankingMobileScreen() {
  const rows = ['Lucas Martins', 'Beatriz Sampaio', 'Rafael Nogueira', 'Juliana Costa', 'Gabriel Lima', 'Camila Ribeiro', 'Pedro Almeida', 'Mariana Alves (Você)', 'Ana Carolina', 'Thiago Mendes']
  return (
    <MobileShell active="Ranking">
      <MobileTop />
      <section className="ec-v2-mobile-title-block"><h1>Ranking</h1><p>Veja sua posição e conquiste o topo.</p></section>
      <Segmented items={['Semanal', 'Mensal']} />
      <div className="ec-v2-ranking-summary"><Card><span>Sua posição</span><strong>Top 8%</strong><p>Entre 12.540 alunos</p><span className="ec-v2-mobile-medal">8</span></Card><Card><div className="ec-v2-card-head"><h2>2.450 XP</h2><strong>Nível 12</strong></div><ProgressBar value={70} /><p><span>Próximo: 3.000 XP</span><b>Faltam 550 XP</b></p><h3>Coleção de badges</h3><div className="ec-v2-badge-collection">{[Flame, Droplets, BarChart3, Zap, Heart].map((Icon, index) => <IconBubble key={index} icon={Icon} tone={['violet', 'info', 'success', 'warning', 'pink'][index] as Tone} />)}<Badge tone="neutral">+6 ver todos</Badge></div></Card></div>
      <Card className="ec-v2-ranking-list"><div className="ec-v2-card-head"><h2><Trophy /> Ranking da semana</h2><span>Atualizado há 2h <i className="ec-v2-dot" /></span></div>{rows.map((name, index) => <div className={cx('ec-v2-rank-row', index === 7 && 'is-me')} key={name}><b>{index + 1}</b><Avatar name={name} index={index} /><strong>{name}</strong><Badge tone="violet">Nível {index < 1 ? 16 : index < 3 ? 15 : index < 5 ? 14 : index < 7 ? 13 : 12}</Badge><span>{['18.750', '16.230', '15.480', '13.920', '12.810', '11.240', '10.560', '9.850', '9.120', '8.430'][index]} XP</span></div>)}</Card>
      <div className="ec-v2-ranking-cards"><Card><h2><Target /> Desafio do mês <Badge>Em andamento</Badge></h2><strong>Top 10%</strong><p>Mantenha-se no top 10% até o fim do mês e ganhe +500 XP bônus!</p><ProgressBar value={68} /><span>Faltam 6 dias</span></Card><Card><h2><Flame /> Sequência</h2><strong>12 dias</strong><div className="ec-v2-week-checks">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => <span key={day + index} className={index < 6 ? 'is-done' : ''}><Check size={14} />{day}</span>)}</div><p><Star size={15} /> Melhor: 28 dias</p></Card></div>
      <Card className="ec-v2-rewards"><IconBubble icon={Gift} /><div><h2>Recompensas em destaque</h2><p>Continue subindo no ranking e desbloqueie prêmios exclusivos.</p></div>{['Top 10%', 'Top 5%', 'Top 3%'].map((reward, index) => <Badge key={reward} tone={index === 0 ? 'violet' : 'neutral'}>{reward}</Badge>)}<ChevronRight /></Card>
    </MobileShell>
  )
}
