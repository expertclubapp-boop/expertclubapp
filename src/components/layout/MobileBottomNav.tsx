import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  MoreHorizontal,
  Droplets,
  ClipboardCheck,
  Trophy,
  PlayCircle,
  Users,
  CreditCard,
  User,
  HelpCircle,
  LogOut,
  X,
  Link2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const mainNav = [
  { to: '/app/today', icon: CalendarDays, label: 'Hoje' },
  { to: '/app/workouts', icon: Dumbbell, label: 'Treinos' },
  { to: '/app/diets', icon: UtensilsCrossed, label: 'Dietas' },
  { to: '/app/evolution', icon: TrendingUp, label: 'Evolução' },
]

const moreItems = [
  { to: '/app/hydration', icon: Droplets, label: 'Hidratação', color: 'text-accent-sky' },
  { to: '/app/checkin/daily', icon: ClipboardCheck, label: 'Check-ins', color: 'text-ec-violet' },
  { to: '/app/challenges', icon: Trophy, label: 'Desafios', color: 'text-ec-violet' },
  { to: '/app/content', icon: PlayCircle, label: 'Conteúdos', color: 'text-ec-violet' },
  { to: '/app/community', icon: Users, label: 'Comunidade', color: 'text-ec-violet' },
  { to: '/app/billing', icon: CreditCard, label: 'Meu plano', color: 'text-text-muted' },
  { to: '/app/profile', icon: User, label: 'Perfil', color: 'text-text-muted' },
]

const affiliateItems = [
  { to: '/affiliate/dashboard', icon: Link2, label: 'Minhas comissões', color: 'text-accent-purple' },
]

export function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const isAffiliate = user?.role === 'affiliate'
  const extraItems = isAffiliate ? [...moreItems, ...affiliateItems] : moreItems

  return (
    <>
      {/* More Sheet Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[61] md:hidden"
            >
              <div className="mx-3 mb-3 rounded-3xl bg-surface-1 border border-white/[0.08] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Menu</span>
                  <button
                    onClick={() => setShowMore(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid Items */}
                <div className="grid grid-cols-4 gap-1 px-3 pb-3">
                  {extraItems.map(({ to, icon: Icon, label, color }) => {
                    const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
                    return (
                      <button
                        key={to}
                        onClick={() => { setShowMore(false); navigate(to) }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all active:scale-95 ${
                          isActive ? 'bg-ec-violet/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-ec-violet' : color}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wide text-center leading-tight ${
                          isActive ? 'text-ec-violet' : 'text-text-secondary'
                        }`}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Footer actions */}
                <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between">
                  <button
                    onClick={() => { setShowMore(false); navigate('/app/profile') }}
                    className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Suporte</span>
                  </button>
                  <button
                    onClick={() => { setShowMore(false); logout() }}
                    className="flex items-center gap-2 text-accent-red/70 hover:text-accent-red transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-safe pt-3 md:hidden">
        <div className="ec-floating-pill mx-auto flex w-full max-w-[460px] items-center justify-around rounded-shell px-2 py-2">
          {mainNav.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-[3px] rounded-lg px-2 py-1.5 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-ec-violet text-white shadow-[0_10px_30px_rgba(91,75,255,0.20)]'
                    : 'text-white/58 hover:bg-white/[0.045] hover:text-white'
                }`}
                aria-label={label}
              >
                <Icon className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
                <span className="max-w-[52px] truncate font-display text-[8px] font-black uppercase leading-none tracking-[0.08em]">
                  {label}
                </span>
              </NavLink>
            )
          })}

          {/* Mais button */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-[3px] rounded-lg px-2 py-1.5 transition-all duration-200 active:scale-95 ${
              showMore
                ? 'bg-ec-violet text-white shadow-[0_10px_30px_rgba(91,75,255,0.20)]'
                : 'text-white/58 hover:bg-white/[0.045] hover:text-white'
            }`}
            aria-label="Mais"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="max-w-[52px] truncate font-display text-[8px] font-black uppercase leading-none tracking-[0.08em]">
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
