import { useId, type CSSProperties, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  Dumbbell,
  Flag,
  Heart,
  Home,
  LineChart,
  MessageCircle,
  Moon,
  MoreVertical,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trophy,
  UserRound,
  Users,
  Utensils,
  Zap,
} from 'lucide-react'
import { ExpertLogo as BrandLogo } from '../ui/ExpertLogo'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type BadgeTone = 'violet' | 'mint' | 'amber' | 'danger' | 'neutral'

export function Button({
  children,
  variant = 'primary',
  className = '',
  icon,
  onClick,
  disabled = false,
}: {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  icon?: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}) {
  return (
    <button 
      type="button" 
      className={`ec-ref-button ec-ref-button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon}
    </button>
  )
}

export function Card({
  children,
  className = '',
  soft = false,
}: {
  children: ReactNode
  className?: string
  soft?: boolean
}) {
  return <section className={`ec-ref-card ${soft ? 'ec-ref-card--soft' : ''} ${className}`}>{children}</section>
}

export function Badge({
  children,
  tone = 'violet',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return <span className={`ec-ref-badge ec-ref-badge--${tone} ${className}`}>{children}</span>
}

export function Chip({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return <span className={`ec-ref-chip ec-ref-badge--${tone} ${className}`}>{children}</span>
}

export function Input({ label, placeholder, state = 'default' }: { label: string; placeholder: string; state?: 'default' | 'focus' | 'success' | 'error' }) {
  return (
    <label className="ec-ref-input-row">
      <span>{label}</span>
      <input className={`ec-ref-input ec-ref-input--${state}`} placeholder={placeholder} aria-label={label} readOnly />
    </label>
  )
}

export function Toggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={`ec-ref-toggle ${checked ? 'is-on' : ''}`}>
      <span />
      {label}
    </button>
  )
}

export function Tabs({ items, active = 0 }: { items: string[]; active?: number }) {
  return (
    <div className="ec-ref-tabs" role="tablist">
      {items.map((item, index) => (
        <button key={item} type="button" role="tab" aria-selected={index === active} className={index === active ? 'is-active' : ''}>
          {item}
        </button>
      ))}
    </div>
  )
}

export function ProgressRing({
  value,
  size = 132,
  label,
  sublabel,
}: {
  value: number
  size?: number
  label?: string
  sublabel?: string
}) {
  const gradientId = useId().replace(/:/g, '')
  const stroke = Math.max(9, Math.round(size * 0.09))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)

  return (
    <div className="ec-ref-ring" style={{ width: size, height: size } as CSSProperties}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="20%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="var(--ec-violet)" />
            <stop offset="100%" stopColor="var(--ec-violet-700)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} className="track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="value"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{label ?? `${value}%`}</strong>
      {sublabel && <span>{sublabel}</span>}
    </div>
  )
}

export function MiniSparkline({ danger = false }: { danger?: boolean }) {
  const points = danger
    ? '0,20 20,36 40,26 60,18 80,31 100,38 120,28 140,39 160,25 180,31 200,42'
    : '0,42 20,31 40,38 60,20 82,27 104,43 126,18 148,25 170,35 200,18'

  return (
    <svg className="ec-ref-sparkline" viewBox="0 0 200 58" aria-hidden="true">
      <polyline points={points} fill="none" stroke={danger ? 'var(--ec-danger-500)' : 'var(--ec-violet)'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MetricBarChart({ values = [52, 68, 45, 70, 82, 76, 65], labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] }: { values?: number[]; labels?: string[] }) {
  return (
    <div className="ec-ref-bars" aria-label="Grafico de barras">
      {values.map((value, index) => (
        <div key={`${labels[index]}-${value}`} className="ec-ref-bar-item">
          <i style={{ height: `${value}%` }} />
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  )
}

export function LineAreaChart({
  compact = false,
  danger = false,
}: {
  compact?: boolean
  danger?: boolean
}) {
  const gradientId = useId().replace(/:/g, '')
  const stroke = danger ? 'var(--ec-danger-500)' : 'var(--ec-violet)'
  const path = 'M34 151 C96 180, 148 147, 206 97 S314 40, 382 56 S498 132, 612 84'
  const fillPath = `${path} L612 218 L34 218 Z`

  return (
    <div className={`ec-ref-linechart ${compact ? 'is-compact' : ''}`}>
    <svg viewBox="0 0 650 230" aria-label="Adesão dos alunos ao longo do tempo">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((item, index) => (
          <g key={item}>
            <line x1="34" x2="612" y1={218 - index * 42} y2={218 - index * 42} className="grid" />
            {!compact && <text x="0" y={222 - index * 42}>{item}%</text>}
          </g>
        ))}
        <path d={fillPath} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        {[34, 145, 224, 324, 430, 526, 612].map((x, index) => (
          <circle key={x} cx={x} cy={[151, 164, 102, 56, 67, 101, 84][index]} r="7" fill="var(--ec-white)" stroke={stroke} strokeWidth="4" />
        ))}
        {!compact && ['12 Mai', '13 Mai', '14 Mai', '15 Mai', '16 Mai', '17 Mai', '18 Mai'].map((label, index) => (
          <text key={label} x={34 + index * 96} y="226" textAnchor="middle">{label}</text>
        ))}
      </svg>
    </div>
  )
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  danger = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  trend: string
  danger?: boolean
}) {
  return (
    <Card className="ec-ref-kpi">
      <Icon className="ec-ref-icon" aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <p className={danger ? 'is-danger' : ''}>{trend}</p>
      <MiniSparkline danger={danger} />
    </Card>
  )
}

export function ExpertLogo({ className = 'ec-ref-logo' }: { className?: string }) {
  return <BrandLogo color="dark" variant="full" animate={false} className={className} />
}

export function TopCircuit() {
  return (
    <svg className="ec-ref-circuit" viewBox="0 0 260 240" aria-hidden="true">
      <path d="M210 0v48l-38 38v46M250 6l-52 52v114M180 0v34l-40 40v82M242 80h-42M220 126h-38M160 122h-26" />
      <circle cx="210" cy="49" r="7" />
      <circle cx="198" cy="174" r="7" />
      <circle cx="140" cy="156" r="7" />
    </svg>
  )
}

export function ModeCards() {
  return (
    <div className="ec-ref-mode-stack">
      <Card className="ec-ref-mode-card">
        <Sun className="ec-ref-mode-icon" aria-hidden="true" />
        <div>
          <strong>MODO LIGHT</strong>
          <span>Direção principal</span>
        </div>
      </Card>
      <Card className="ec-ref-mode-card">
        <Moon className="ec-ref-mode-icon" aria-hidden="true" />
        <div>
          <strong>MODO DARK</strong>
          <span>Direção secundária</span>
        </div>
      </Card>
    </div>
  )
}

export function PosterShell({
  eyebrow,
  title,
  subtitle,
  body,
  children,
  page,
}: {
  eyebrow: string
  title: ReactNode
  subtitle: ReactNode
  body?: string
  children: ReactNode
  page: string
}) {
  return (
    <main className="ec-ref-poster">
      <TopCircuit />
      <div className="ec-ref-poster-breadcrumb">
        EXPERT CLUB <span>|</span> {eyebrow.toUpperCase()} <span>|</span> {page}
      </div>
      <header className="ec-ref-poster-header">
        <ExpertLogo className="ec-ref-logo ec-ref-logo--poster" />
        <div>
          <h1>{title}</h1>
          <h2>{subtitle}</h2>
          {body && <p>{body}</p>}
        </div>
        <ModeCards />
      </header>
      {children}
    </main>
  )
}

export function NavItem({
  icon: Icon,
  label,
  active = false,
  badge,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  badge?: string
}) {
  return (
    <button type="button" className={`ec-ref-nav-item ${active ? 'is-active' : ''}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      {badge && <Badge>{badge}</Badge>}
    </button>
  )
}

export function Sidebar({
  items,
  footer,
}: {
  items: Array<{ icon: LucideIcon; label: string; badge?: string }>
  footer?: ReactNode
}) {
  return (
    <aside className="ec-ref-sidebar">
      <ExpertLogo className="ec-ref-logo ec-ref-logo--sidebar" />
      <nav aria-label="Navegacao principal">
        {items.map((item, index) => (
          <NavItem key={item.label} {...item} active={index === 0} />
        ))}
      </nav>
      {footer && <div className="ec-ref-sidebar-footer">{footer}</div>}
    </aside>
  )
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <header className="ec-ref-dashboard-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions}
    </header>
  )
}

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <main className="ec-ref-app-shell">
      {sidebar}
      <section className="ec-ref-app-main">{children}</section>
    </main>
  )
}

export function HeroMockup() {
  const metricCards = [
    ['Treinos concluídos', '28', '+ 12%'],
    ['Minutos ativos', '240', '+ 18%'],
    ['Consistência', '85%', '+ 9%'],
    ['Check-ins', '16', '+ 14%'],
  ]

  return (
    <div className="ec-ref-hero-mockup" aria-label="Mockups do app Expert Club">
      <Card className="ec-ref-desktop-mock">
        <div className="ec-ref-mock-top">
          <span><Sparkles size={16} /> Dashboard do Aluno</span>
          <div>
            <small>Semanal</small>
            <small>Baixo</small>
            <small>Fonte</small>
          </div>
        </div>
        <div className="ec-ref-mock-grid">
          <Card className="ec-ref-mock-card ec-ref-mock-card--profile">
            <strong>Olá, Mariana! 👋</strong>
            <small>Pronta para superar seus limites hoje?</small>
            <div className="ec-ref-mini-workout">
              <div className="ec-ref-photo" />
              <span>Treino A - Força<br /><small>45 min • Intermediário</small></span>
              <button type="button">Iniciar treino</button>
            </div>
          </Card>
          <Card className="ec-ref-mock-card">
            <strong>Progresso semanal</strong>
            <div className="ec-ref-mock-progress">
              <b>76%</b>
              <ProgressRing value={76} size={76} />
            </div>
          </Card>
          <Card className="ec-ref-mock-card">
            <strong>Bem-estar</strong>
            <p>Sono 7h 30m</p>
            <p>Água 1,8 L</p>
          </Card>
        </div>
        <h4>Métricas</h4>
        <div className="ec-ref-mock-metrics">
          {metricCards.map(([label, value, trend]) => (
            <Card key={label} className="ec-ref-metric-mini">
              <span>{label}</span>
              <b>{value}</b>
              <small>{trend}</small>
            </Card>
          ))}
        </div>
        <div className="ec-ref-next-steps">
          {['Check-in de hoje', 'Plano alimentar', 'Desafio da semana'].map((step) => (
            <div key={step}>
              <span>{step}</span>
              <button type="button">Ver plano</button>
            </div>
          ))}
        </div>
      </Card>
      <div className="ec-ref-phone">
        <div className="ec-ref-phone-notch" />
        <div className="ec-ref-phone-hero">
          <strong>Foco. Disciplina.<br />Evolução diária.</strong>
          <span>Você está no caminho certo! 💪</span>
        </div>
        <div className="ec-ref-week-dots">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
        <Card className="ec-ref-phone-card">
          <small>Treino de hoje</small>
          <strong>Treino A - Força</strong>
          <Button className="ec-ref-phone-button" icon={<ArrowRight size={14} />}>Iniciar treino</Button>
        </Card>
        <Card className="ec-ref-phone-card ec-ref-phone-nutrition">
          <ProgressRing value={78} size={82} label="1.650" sublabel="de 2.100 kcal" />
          <div>
            <p><i /> Proteínas <b>120g</b></p>
            <p><i /> Carboidratos <b>180g</b></p>
            <p><i /> Gorduras <b>55g</b></p>
          </div>
        </Card>
        <Card className="ec-ref-phone-card">
          <strong>Hidratação</strong>
          <span>1,8 L de 2,5 L</span>
          <div className="ec-ref-progress"><i style={{ width: '72%' }} /></div>
        </Card>
      </div>
    </div>
  )
}

export function FeatureCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <Card className="ec-ref-feature-card">
      <span className="ec-ref-feature-icon"><Icon aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{body}</p>
    </Card>
  )
}

export function StudentTodayPlanCard() {
  const tasks = [
    { icon: Dumbbell, label: 'Treino do dia', meta: 'Força • Membros Inferiores', title: 'Treino A - Força', chips: ['45 min', 'Intermediário'], action: 'Iniciar treino' },
    { icon: Utensils, label: 'Dieta do dia', meta: 'Plano de refeições', title: 'Plano de hoje', chips: ['2.100 kcal', 'Alta proteína'], action: 'Ver dieta', green: true },
    { icon: ClipboardCheck, label: 'Check-in do dia', meta: 'Seu acompanhamento diário', title: 'Check-in diário', chips: ['Rápido • 2 min'], action: 'Responder' },
  ]

  return (
    <Card className="ec-ref-today-card">
      <div className="ec-ref-card-head">
        <h2><Sparkles /> Plano de hoje</h2>
        <span>Sexta-feira, 10 de maio</span>
      </div>
      <div className="ec-ref-task-list">
        {tasks.map(({ icon: Icon, label, meta, title, chips, action, green }) => (
          <div className="ec-ref-task" key={title}>
            <span className="ec-ref-task-icon"><Icon aria-hidden="true" /></span>
            <div>
              <b>{label}</b>
              <small>{meta}</small>
              <strong>{title}</strong>
              <div>
                {chips.map((chip, index) => <Chip key={chip} tone={green && index === 1 ? 'mint' : 'neutral'}>{chip}</Chip>)}
              </div>
            </div>
            <Button variant="secondary" icon={<ChevronRight size={16} />}>{action}</Button>
          </div>
        ))}
      </div>
      <div className="ec-ref-streak-banner">
        <span>🔥</span>
        <p><strong>Você está em uma ótima sequência!</strong><br />Continue assim para alcançar seus objetivos.</p>
        <b>12</b>
        <small>dias seguidos<br />🔥 🔥 🔥 🔥 🔥 🔥 🔥</small>
      </div>
    </Card>
  )
}

export function HydrationCard() {
  return (
    <Card className="ec-ref-hydration-card">
      <div className="ec-ref-card-head">
        <h2><Droplets /> Hidratação</h2>
        <span>2,0 L / 2,5 L <MoreVertical size={18} /></span>
      </div>
      <div className="ec-ref-hydration-body">
        <ProgressRing value={80} size={150} label="80%" sublabel="da meta" />
        <div>
          <small>Adicionar água</small>
          {['+250 ml', '+500 ml', '+750 ml'].map((amount) => (
            <Button key={amount} variant="ghost">{amount}</Button>
          ))}
        </div>
      </div>
      <Button variant="secondary" className="ec-ref-full-button">Registrar outra +</Button>
    </Card>
  )
}

export function RankingCard() {
  return (
    <Card className="ec-ref-ranking-card">
      <div className="ec-ref-card-head">
        <h2><Trophy /> Ranking</h2>
        <a>Ver ranking</a>
      </div>
      <div className="ec-ref-ranking-body">
        <div className="ec-ref-medal">8</div>
        <div>
          <h3>Top 8%</h3>
          <p>Entre 12.540 alunas</p>
        </div>
      </div>
      <div className="ec-ref-xp-row">
        <strong>2.450 XP</strong>
        <span>Nível 12</span>
      </div>
      <div className="ec-ref-progress"><i style={{ width: '70%' }} /></div>
      <small>Proximo: 3.000 XP</small>
    </Card>
  )
}

export function ChallengeCard() {
  const challenges = [
    ['🎯', 'Desafio 30 Dias de Foco', '18 / 30 dias', '60%'],
    ['💧', 'Desafio Hidratação', '10 / 14 dias', '71%'],
  ]
  return (
    <Card className="ec-ref-challenge-card">
      <div className="ec-ref-card-head">
        <h2><Flag /> Desafios ativos</h2>
        <a>Ver todos</a>
      </div>
      {challenges.map(([icon, title, meta, value]) => (
        <div className="ec-ref-challenge" key={title}>
          <strong>{icon} {title}</strong>
          <span>{meta}<b>{value}</b></span>
          <div className="ec-ref-progress"><i style={{ width: value }} /></div>
        </div>
      ))}
    </Card>
  )
}

export function MentorAlertsCard() {
  const alerts = [
    ['Ana Carolina Silva', '3 check-ins pendentes', 'Atenção alta', 'danger'],
    ['Lucas Almeida', 'Treinos não concluídos há 5 dias', 'Atenção média', 'amber'],
    ['Mariana Costa', 'Queda de adesão (-15%)', 'Atenção baixa', 'amber'],
  ] as const
  return (
    <Card className="ec-ref-alerts-card">
      <div className="ec-ref-card-head">
        <h2>Alertas <Badge>3</Badge></h2>
        <a>Ver todos</a>
      </div>
      {alerts.map(([name, meta, label, tone], index) => (
        <div className="ec-ref-alert-row" key={name}>
          <div className={`ec-ref-avatar ec-ref-avatar--${index + 1}`} />
          <div>
            <strong>{name}</strong>
            <span>{meta}</span>
          </div>
          <Badge tone={tone}>{label}</Badge>
          <MessageCircle size={18} />
        </div>
      ))}
    </Card>
  )
}

export function RecentActivityTable() {
  const rows = [
    ['João Pedro Santos', 'Hoje, 09:41', 'Enviado', 'Concluído', '92%'],
    ['Beatriz Lima', 'Hoje, 08:15', 'Pendente', 'Concluído', '78%'],
    ['Rafael Oliveira', 'Ontem, 21:32', 'Enviado', 'Não concluído', '62%'],
    ['Juliana Martins', 'Ontem, 18:07', 'Enviado', 'Concluído', '88%'],
    ['Thiago Mendes', 'Ontem, 17:50', 'Pendente', 'Concluído', '73%'],
  ]
  return (
    <Card className="ec-ref-table-card">
      <h2>Atividade recente dos alunos</h2>
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Última atividade</th>
            <th>Check-in</th>
            <th>Treino</th>
            <th>Adesão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, time, checkin, workout, adhesion], index) => (
            <tr key={name}>
              <td><div className={`ec-ref-avatar ec-ref-avatar--${(index % 3) + 1}`} /> {name}</td>
              <td>{time}</td>
              <td><Badge tone={checkin === 'Pendente' ? 'danger' : 'mint'}>{checkin}</Badge></td>
              <td><Badge tone={workout === 'Não concluído' ? 'amber' : 'mint'}>{workout}</Badge></td>
              <td><span>{adhesion}</span><div className="ec-ref-table-progress"><i style={{ width: adhesion }} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button">Ver todas as atividades</button>
    </Card>
  )
}

export function EngagementRankingCard() {
  const rows = [
    ['1º', 'João Pedro Santos', '96%', '🥇'],
    ['2º', 'Juliana Martins', '93%', '🥈'],
    ['3º', 'Beatriz Lima', '91%', '🥉'],
    ['4º', 'Rafael Oliveira', '89%', ''],
    ['5º', 'Carlos Eduardo', '87%', ''],
  ]
  return (
    <Card className="ec-ref-engagement-card">
      <div className="ec-ref-card-head">
        <h2>Ranking de engajamento</h2>
        <a>Ver ranking completo</a>
      </div>
      {rows.map(([position, name, value, medal], index) => (
        <div className="ec-ref-engagement-row" key={name}>
          <b>{position}</b>
          <div className={`ec-ref-avatar ec-ref-avatar--${(index % 3) + 1}`} />
          <span>{name}</span>
          <strong>{value}</strong>
          <em>{medal}</em>
        </div>
      ))}
    </Card>
  )
}

export const studentNavItems = [
  { icon: Users, label: 'Dashboard do Aluno' },
  { icon: Dumbbell, label: 'Treinos' },
  { icon: Utensils, label: 'Dieta' },
  { icon: Droplets, label: 'Hidratação' },
  { icon: Check, label: 'Check-ins' },
  { icon: LineChart, label: 'Evolução' },
  { icon: Trophy, label: 'Desafios' },
  { icon: MessageCircle, label: 'Mensagens', badge: '3' },
  { icon: ClipboardCheck, label: 'Relatórios' },
  { icon: Settings, label: 'Configurações' },
]

export const mentorNavItems = [
  { icon: Home, label: 'Visão geral' },
  { icon: Users, label: 'Alunos' },
  { icon: CalendarCheck, label: 'Check-ins' },
  { icon: Dumbbell, label: 'Treinos' },
  { icon: Flag, label: 'Planos' },
  { icon: MessageCircle, label: 'Mensagens' },
  { icon: LineChart, label: 'Relatórios' },
  { icon: Bell, label: 'Alertas', badge: '3' },
  { icon: Settings, label: 'Configurações' },
]

export const landingFeatures = [
  { icon: Dumbbell, title: 'Treinos', body: 'Planos personalizados para seu nível e objetivo.' },
  { icon: Utensils, title: 'Dieta', body: 'Planos alimentares inteligentes e flexíveis.' },
  { icon: Droplets, title: 'Hidratação', body: 'Lembretes e metas para se manter hidratada.' },
  { icon: Heart, title: 'Check-ins', body: 'Acompanhe sua evolução e mantenha a constância.' },
  { icon: Trophy, title: 'Desafios', body: 'Participe, ganhe pontos e supere seus limites.' },
  { icon: LineChart, title: 'Ranking', body: 'Suba no ranking e se motive com outras.' },
]

export const mentorKpis = [
  { icon: Users, label: 'Alunos ativos', value: '28', trend: '↑ 12% vs. semana passada' },
  { icon: ClipboardCheck, label: 'Check-ins pendentes', value: '8', trend: '↓ 20% vs. semana passada', danger: true },
  { icon: ShieldCheck, label: 'Adesão média', value: '85%', trend: '↑ 9 p.p. vs. semana passada' },
  { icon: Dumbbell, label: 'Treinos concluídos', value: '156', trend: '↑ 8% vs. semana passada' },
  { icon: LineChart, label: 'Evolução média', value: '+4,8%', trend: '↑ 1,2 p.p. vs. semana passada' },
  { icon: Heart, label: 'Satisfação', value: '4,8/5', trend: '↑ 0,2 vs. semana passada' },
]

export const utilityIcons = {
  ArrowRight,
  Bell,
  Calendar,
  Droplets,
  Dumbbell,
  Flame: Zap,
  Heart,
  MoreVertical,
  Search,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
}
