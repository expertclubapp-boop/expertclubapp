import { Flame } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { mockStats } from '../../mocks/data'
import { ExpertLogo } from '../ui/ExpertLogo'
import { NotificationsDrawer } from '../ui/NotificationsDrawer'

interface PageHeaderProps {
  showGreeting?: boolean
  className?: string
}

export function PageHeader({ showGreeting = true, className = '' }: PageHeaderProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  const now = new Date()
  const hours = now.getHours()
  const greeting =
    hours < 12 ? 'Bom dia' : hours < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <header
      className={`sticky top-0 z-50 w-full px-3 py-3 sm:px-5 ${className}`}
    >
      <div className="ec-glass mx-auto flex w-full max-w-[1540px] items-center justify-between rounded-shell px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-ec-violet/35 bg-surface-2 p-0.5 shadow-[0_0_28px_rgba(91,75,255,0.12)]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-bg-primary">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-ec-violet">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          {showGreeting && (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                {greeting}, {user.displayName} · {dateStr}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-accent-lime fill-accent-lime" />
                <span className="truncate font-display text-sm font-bold text-white">
                  {mockStats.currentStreak} dias de streak
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ExpertLogo variant="compact" className="h-10 w-auto" />
          </div>
          <NotificationsDrawer uid={user?.uid} />
          <button
            onClick={() => logout()}
            className="flex h-11 px-4 items-center justify-center rounded-full border border-accent-red/20 bg-accent-red/5 text-accent-red transition-all hover:bg-accent-red/10 active:scale-95 text-[10px] font-black uppercase tracking-widest"
            aria-label="Sair"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
