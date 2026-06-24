import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  Trophy, 
  UserRound,
  Bell
} from 'lucide-react'
import { ExpertLogo } from '../ui/ExpertLogo'
import { V2Avatar } from './ExpertClubV2Base'
import { useAuth } from '../../contexts/AuthContext'

// === BOTTOM NAV ===
export type MobileNavItem = 'Início' | 'Treinos' | 'Dieta' | 'Ranking' | 'Perfil'

export function ExpertClubBottomNav({ active }: { active: MobileNavItem }) {
  const navigate = useNavigate()
  
  const items = [
    { label: 'Início', Icon: Home, href: '/app/today' },
    { label: 'Treinos', Icon: Dumbbell, href: '/app/workouts' },
    { label: 'Dieta', Icon: Utensils, href: '/app/diets/today' },
    { label: 'Ranking', Icon: Trophy, href: '/app/challenges' },
    { label: 'Perfil', Icon: UserRound, href: '/app/profile' },
  ] as const

  return (
    <nav className="ec-v2-bottom-nav" aria-label="Navegação do aluno">
      {items.map(({ label, Icon, href }) => (
        <button 
          key={label} 
          onClick={() => navigate(href)} 
          className={active === label ? 'is-active' : ''}
        >
          <Icon aria-hidden="true" size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

// === TOP BAR ===
export function ExpertClubMobileTop({ 
  title, 
  subtitle, 
  logo = false, 
  back = false 
}: { 
  title?: string; 
  subtitle?: string; 
  logo?: boolean; 
  back?: boolean 
}) {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  
  return (
    <header className="ec-v2-mobile-top">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary"
        >
          <Home size={24} />
        </button>
      )}
      
      {logo && (
        <ExpertLogo 
          color="dark" 
          variant="full" 
          animate={false} 
          className="ec-v2-mobile-logo" 
        />
      )}
      
      {title && (
        <div className="ec-v2-mobile-title">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      )}
      
      <div className="ec-v2-mobile-actions ml-auto flex items-center gap-3">
        <button className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-white transition-colors rounded-lg">
          <Bell size={24} aria-hidden="true" />
        </button>
        <V2Avatar uid={firebaseUser?.uid} name={firebaseUser?.displayName || 'User'} size="md" />
      </div>
    </header>
  )
}

// === MOBILE SHELL ===
export function ExpertClubMobileShell({ 
  children, 
  active,
  title,
  subtitle,
  logo = false,
  back = false
}: { 
  children: ReactNode; 
  active: MobileNavItem;
  title?: string;
  subtitle?: string;
  logo?: boolean;
  back?: boolean
}) {
  return (
    <main className="ec-v2-mobile min-h-screen" data-active-section={active}>
      <div className="ec-v2-mobile-page">
        <ExpertClubMobileTop title={title} subtitle={subtitle} logo={logo} back={back} />
        <div className="px-4 pt-4">
          {children}
        </div>
      </div>
    </main>
  )
}
