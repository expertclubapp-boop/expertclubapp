import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  ClipboardList,
  Droplets,
  Dumbbell,
  FileText,
  FolderCog,
  ListChecks,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { PageHeader } from './PageHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { useAuth } from '../../contexts/AuthContext'

const appNavItems = [
  { to: '/app/today', icon: CalendarDays, label: 'Hoje' },
  { to: '/app/workouts', icon: Dumbbell, label: 'Treinos' },
  { to: '/app/diets', icon: UtensilsCrossed, label: 'Dietas' },
  { to: '/app/hydration', icon: Droplets, label: 'Hidratação' },
  { to: '/app/evolution', icon: BarChart3, label: 'Evolução' },
  { to: '/app/challenges', icon: Trophy, label: 'Desafios' },
  { to: '/app/badges', icon: Trophy, label: 'Conquistas' }, // I'll use Award if I find it, but Trophy is fine for now
  { to: '/app/content', icon: FileText, label: 'Conteúdos' },
  { to: '/app/community', icon: Users, label: 'Comunidade' },
  { to: '/app/billing', icon: CreditCard, label: 'Meu plano' },
]

const adminNavItems = [
  { to: '/admin/dashboard', icon: BarChart3, label: 'Painel' },
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/subscriptions', icon: ShieldCheck, label: 'Assinaturas' },
  { to: '/admin/diets', icon: UtensilsCrossed, label: 'Dietas' },
  { to: '/admin/foods', icon: ListChecks, label: 'Alimentos' },
  { to: '/admin/workouts', icon: Dumbbell, label: 'Treinos' },
  { to: '/admin/exercises', icon: ClipboardList, label: 'Exercícios' },
  { to: '/admin/content', icon: FileText, label: 'Conteúdos' },
  { to: '/admin/challenges', icon: Trophy, label: 'Desafios' },
  { to: '/admin/badges', icon: Trophy, label: 'Badges' },
  { to: '/admin/plans', icon: FolderCog, label: 'Planos' },
  { to: '/admin/community', icon: CalendarDays, label: 'Comunidade' },
  { to: '/admin/affiliates', icon: Users, label: 'Afiliados' },
  { to: '/admin/commissions', icon: CreditCard, label: 'Comissões' },
  { to: '/admin/payouts', icon: CreditCard, label: 'Pagamentos' },
  { to: '/admin/audit-logs', icon: ShieldCheck, label: 'Auditoria' },
  { to: '/admin/settings', icon: Settings, label: 'Configurações' },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = location.pathname.startsWith('/admin')
  const navItems = isAdmin ? adminNavItems : appNavItems

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary text-text-primary">
      <PageHeader />
      <div className="mx-auto flex w-full max-w-[1540px] gap-4 px-3 sm:px-5 lg:px-6">
        <aside className="sticky top-[88px] hidden h-[calc(100dvh-96px)] w-[236px] shrink-0 py-6 lg:block">
          <nav className="ec-glass-strong rounded-shell p-3">
            <div className="px-3 pb-4 pt-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                {isAdmin ? 'Admin' : 'Aluno'}
              </p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate(isAdmin ? '/app/today' : '/admin/subscriptions')}
                  className="text-[10px] font-bold text-accent-sky hover:underline"
                >
                  {isAdmin ? 'Ver App' : 'Ver Admin'}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-ec-violet to-ec-violet-2 text-white shadow-[0_12px_34px_rgba(91,75,255,0.18)]'
                        : 'text-text-secondary hover:bg-white/[0.055] hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          isActive ? 'text-white' : 'text-ec-violet/70'
                        }`}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-28 pt-3 sm:pt-5 lg:pb-12">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
