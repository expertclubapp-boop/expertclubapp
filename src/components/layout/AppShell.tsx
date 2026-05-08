import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  UtensilsCrossed,
  Trophy,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { V2Avatar, cx } from '../v2/ExpertClubV2Base'

const appNavItems = [
  { to: '/app/today', icon: LayoutDashboard, label: 'Hoje' },
  { to: '/app/workouts', icon: Dumbbell, label: 'Treinos' },
  { to: '/app/diets/today', icon: UtensilsCrossed, label: 'Dieta' },
  { to: '/app/challenges', icon: Trophy, label: 'Desafios' },
  { to: '/app/content', icon: FileText, label: 'Conteúdos' },
  { to: '/app/profile', icon: Settings, label: 'Perfil' },
]

const adminNavItems = [
  { to: '/admin/dashboard', icon: BarChart3, label: 'Painel' },
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/subscriptions', icon: ShieldCheck, label: 'Assinaturas' },
  { to: '/admin/affiliates', icon: Users, label: 'Afiliados' },
  { to: '/admin/financeiro', icon: CreditCard, label: 'Financeiro' },
  { to: '/admin/workouts', icon: Dumbbell, label: 'Treinos' },
  { to: '/admin/diets', icon: UtensilsCrossed, label: 'Dietas' },
]

const mentorNavItems = [
  { to: '/mentor/overview', icon: LayoutDashboard, label: 'Visão Geral' },
  { to: '/mentor/alunos', icon: Users, label: 'Alunos' },
  { to: '/mentor/checkins', icon: CalendarDays, label: 'Check-ins' },
  { to: '/mentor/financeiro', icon: CreditCard, label: 'Financeiro' },
  { to: '/mentor/influencers', icon: Users, label: 'Influencers' },
]

export function AppShell() {
  const location = useLocation()
  const { user, logout, isQaBypass } = useAuth()
  
  const isAdmin = location.pathname.startsWith('/admin')
  const isMentor = location.pathname.startsWith('/mentor')
  const isStudent = !isAdmin && !isMentor
  
  const navItems = isAdmin ? adminNavItems : isMentor ? mentorNavItems : appNavItems
  const roleLabel = isAdmin ? 'ADMINISTRADOR' : isMentor ? 'MENTOR' : 'ALUNO'

  if (isStudent) {
    return (
      <div className="ec-student-app-host min-h-screen">
        <main className="ec-student-app-main">
          {isQaBypass && (
            <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-200">
              QA BYPASS - Firestore real pode negar dados. Nao usar como prova de permissao Firebase.
            </div>
          )}
          <Outlet />
        </main>

        <nav className="ec-student-bottom-nav" aria-label="Navegação do aluno">
          {appNavItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(
                "flex flex-col items-center gap-1.5 rounded-xl transition-all",
                isActive ? "is-active text-ec-violet" : "text-text-muted"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050A12] text-white flex flex-col xl:flex-row">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden xl:flex w-72 h-screen sticky top-0 bg-[#080E17] border-r border-white/5 flex-col p-6 z-40">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-ec-violet rounded-xl flex items-center justify-center font-black italic text-xl">EC</div>
          <div>
            <h1 className="text-sm font-black italic uppercase leading-none">Expert Club</h1>
            <span className="text-[10px] font-black text-ec-violet tracking-[0.2em] uppercase">{roleLabel}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-ec-violet text-white shadow-lg shadow-ec-violet/20" 
                  : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="text-xs font-black italic uppercase tracking-wider">{item.label}</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
            <span className="text-xs font-black italic uppercase tracking-wider">Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="xl:hidden h-16 bg-[#080E17]/80 backdrop-blur-xl sticky top-0 border-b border-white/5 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-ec-violet rounded-lg flex items-center justify-center font-black italic text-sm">EC</div>
           <span className="text-[10px] font-black italic uppercase tracking-widest">{roleLabel}</span>
        </div>
        <div className="flex items-center gap-3">
           <button className="w-9 h-9 flex items-center justify-center text-text-muted"><Search size={20} /></button>
           <button className="w-9 h-9 flex items-center justify-center text-text-muted relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-ec-violet rounded-full border-2 border-[#080E17]" />
           </button>
           <V2Avatar uid={user?.uid || ''} name={user?.displayName || ''} size="sm" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 p-4 xl:p-12 pb-24 xl:pb-12">
        {isQaBypass && (
          <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-200">
            QA BYPASS - Firestore real pode negar dados. Nao usar como prova de permissao Firebase.
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAV (Student only) */}
      {isStudent && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#080E17]/90 backdrop-blur-2xl border-t border-white/5 z-40 px-2 flex items-center justify-around">
          {appNavItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                isActive ? "text-ec-violet" : "text-text-muted"
              )}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
