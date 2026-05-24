import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  CalendarCheck,
  Dumbbell,
  Utensils,
  Calendar,
  CircleDollarSign,
  Trophy,
  BarChart3,
  Settings,
  BookOpen,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  Star,
  ShieldCheck,
  LogOut,
  Zap,
  Tag,
  ShoppingBag,
  DollarSign,
  UserCheck,
  Activity,
} from 'lucide-react'
import { ExpertLogo } from '../ui/ExpertLogo'
import { V2Avatar, V2IconBubble, V2Card, cx } from './ExpertClubV2Base'
import { useAuth } from '../../contexts/AuthContext'

export type ActiveNav =
  | 'Dashboard'
  | 'Alunos'
  | 'Check-ins'
  | 'Treinos'
  | 'Dietas'
  | 'Conteúdo'
  | 'Desafios'
  | 'Assinaturas'
  | 'Produtos'
  | 'Afiliados'
  | 'Influenciadores'
  | 'Saques'
  | 'Loja'
  | 'Financeiro'
  | 'Suporte'
  | 'Configurações'
  | 'Presets'
  | 'Visão geral'
  | 'Agenda'
  | 'Influencers'
  | 'Relatórios'
  | 'Workspaces'
  | 'Usuários'
  | 'Métricas SaaS'
  | 'Economia'
  | 'Auditoria'

const mentorNav = [
  { label: 'Visão geral', icon: Home, href: '/mentor/dashboard' },
  { label: 'Alunos', icon: Users, href: '/mentor/students' },
  { label: 'Check-ins', icon: CalendarCheck, href: '/mentor/checkins' },
  { label: 'Treinos', icon: Dumbbell, href: '/mentor/workouts/prescriptor' },
  { label: 'Dietas', icon: Utensils, href: '/mentor/diets/prescriptor' },
  { label: 'Agenda', icon: Calendar, href: '/mentor/agenda' },
  { label: 'Financeiro', icon: CircleDollarSign, href: '/mentor/finance' },
  { label: 'Influencers', icon: Trophy, href: '/mentor/influencers' },
  { label: 'Relatórios', icon: BarChart3, href: '/mentor/relatorios' },
  { label: 'Configurações', icon: Settings, href: '/mentor/configuracoes' },
] as const

const adminNav = [
  { label: 'Dashboard', icon: Home, href: '/admin/dashboard' },
  { label: 'Alunos', icon: Users, href: '/admin/users' },
  { label: 'Check-ins', icon: CalendarCheck, href: '/admin/checkins' },
  { label: 'Treinos', icon: Dumbbell, href: '/admin/workouts' },
  { label: 'Dietas', icon: Utensils, href: '/admin/diets' },
  { label: 'Presets', icon: Zap, href: '/admin/presets' },
  { label: 'Conteúdo', icon: BookOpen, href: '/admin/content' },
  { label: 'Desafios', icon: Trophy, href: '/admin/challenges' },
  { label: 'Assinaturas', icon: ShieldCheck, href: '/admin/subscriptions' },
  { label: 'Produtos', icon: Tag, href: '/admin/produtos' },
  { label: 'Afiliados', icon: Users, href: '/admin/affiliates' },
  { label: 'Influenciadores', icon: UserCheck, href: '/admin/influencers-v2' },
  { label: 'Saques', icon: DollarSign, href: '/admin/payouts-v2' },
  { label: 'Loja', icon: ShoppingBag, href: '/admin/store' },
  { label: 'Financeiro', icon: CircleDollarSign, href: '/admin/financeiro' },
  { label: 'Suporte', icon: HelpCircle, href: '/admin/support' },
  { label: 'Configurações', icon: Settings, href: '/admin/settings' },
  { label: 'Economia', icon: Zap, href: '/admin/economia' },
  { label: 'Auditoria', icon: Activity, href: '/admin/auditoria' },
] as const

// === SIDEBAR ===
export function ExpertClubSidebar({ active, admin = false }: { active: ActiveNav; admin?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const items = admin ? adminNav : mentorNav
  const currentPath = location.pathname

  return (
    <aside className="ec-v2-sidebar">
      <button onClick={() => navigate('/')} className="ec-v2-logo-link w-full text-left p-6">
        <ExpertLogo color="dark" variant="full" animate={false} className="ec-v2-logo" />
      </button>
      
      <nav aria-label={admin ? 'Navegação admin' : 'Navegação mentor'} className="px-3 flex-1">
        {items.map(({ label, icon: Icon, href }) => (
          <button
            key={label}
            onClick={() => navigate(href)}
            className={cx(
              'ec-v2-side-link w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              (active === label || currentPath === href) ? 'is-active bg-ec-violet text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="font-semibold text-sm">{label}</span>
          </button>
        ))}
      </nav>

      <div className="ec-v2-sidebar-bottom p-6 space-y-4">
        <V2Card className="ec-v2-plan-card p-4 bg-ec-violet-dim border-ec-violet-border rounded-2xl">
          <V2IconBubble icon={Star} className="mb-2" />
          <strong className="block text-white text-sm">Expert Club Pro</strong>
          <span className="block text-text-muted text-xs mb-2">Seu plano está ativo</span>
          <button onClick={() => navigate('/billing/plans')} className="text-ec-violet text-xs font-bold hover:underline">Ver benefícios</button>
        </V2Card>
        
        <V2Card className="ec-v2-help-card p-4 flex items-center gap-3 bg-surface-2 border-white/5 rounded-2xl">
          <HelpCircle className="text-text-muted" size={24} aria-hidden="true" />
          <div>
            <strong className="block text-white text-sm">Central de ajuda</strong>
            <span className="block text-text-muted text-xs">Suporte e tutoriais</span>
          </div>
        </V2Card>
      </div>
    </aside>
  )
}

// === TOPBAR ===
export function ExpertClubDesktopTop({ admin = false }: { admin?: boolean }) {
  const { firebaseUser, logout } = useAuth()
  const role = admin ? 'Administrador' : 'Mentor'

  return (
    <div className="ec-v2-topbar flex items-center justify-end gap-4 p-6 border-b border-white/5">
      <button
        type="button"
        disabled
        title="Filtro de periodo ainda nao altera esta visao."
        className="ec-v2-control flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-xs text-text-primary"
      >
        <Calendar size={18} /> 
        <span>12 de mai – 10 de jun, 2024</span> 
        <ChevronDown size={16} />
      </button>
      
      <button
        type="button"
        disabled
        title={admin ? 'Multi-workspace ainda nao esta operacional; a visao usa colecoes globais.' : 'Workspace do mentor e fixo para a carteira atual.'}
        className="ec-v2-control flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-xs text-text-primary"
      >
        <span>Workspace</span> 
        <strong className="text-ec-violet">{admin ? 'Todos os workspaces' : 'Expert Coaching'}</strong> 
        <ChevronDown size={16} />
      </button>

      <div className="h-8 w-px bg-white/5 mx-2" />

      <button
        type="button"
        disabled
        title="Busca global ainda nao esta conectada neste shell."
        className="ec-v2-icon-btn p-2 text-text-muted hover:text-white"
        aria-label="Buscar"
      >
        <Search size={20} />
      </button>
      
      <button
        type="button"
        disabled
        title="Central de notificacoes ainda nao esta conectada."
        className="ec-v2-icon-btn p-2 text-text-muted hover:text-white relative"
        aria-label="Notificações"
      >
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-4 h-4 bg-ec-violet text-[10px] font-bold text-white flex items-center justify-center rounded-full">8</span>
      </button>

      <div className="flex items-center gap-3 pl-4">
        <div className="text-right hidden md:block">
          <strong className="block text-sm text-white">{firebaseUser?.displayName || 'User'}</strong>
          <span className="block text-[10px] text-text-muted uppercase tracking-widest">{role}</span>
        </div>
        <V2Avatar uid={firebaseUser?.uid} name={firebaseUser?.displayName || 'User'} size="md" />
        <div className="h-8 w-px bg-white/5 mx-2" />
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 p-2 rounded-xl text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
          title="Sair da conta"
        >
          <LogOut size={20} />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Sair</span>
        </button>
      </div>
    </div>
  )
}

// === DESKTOP SHELL ===
export function ExpertClubDesktopShell({
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
  const { isQaBypass } = useAuth()

  return (
    <main className="ec-v2-desktop flex min-h-screen bg-[#050A12]">
      <ExpertClubSidebar active={active} admin={admin} />
      <section className="ec-v2-main flex-1 flex flex-col">
        {isQaBypass && (
          <div className="border-b border-amber-300/30 bg-amber-300/10 px-6 py-3 text-center text-[11px] font-black uppercase tracking-widest text-amber-200">
            QA BYPASS - Firestore real pode negar dados. Nao usar como prova de permissao Firebase.
          </div>
        )}
        <header className="ec-v2-page-header p-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase mb-2 block">{eyebrow}</span>
              <h1 className="text-4xl font-black italic text-white uppercase mb-2">{title}</h1>
              <p className="text-text-muted text-lg">{subtitle}</p>
            </div>
            <ExpertClubDesktopTop admin={admin} />
          </div>
        </header>
        <div className="flex-1 p-8 pt-4 overflow-y-auto">
          {children}
        </div>
      </section>
    </main>
  )
}
