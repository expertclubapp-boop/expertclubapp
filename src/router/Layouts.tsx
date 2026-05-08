import { Outlet, useLocation } from 'react-router-dom'
import { ExpertClubDesktopShell } from '../components/v2/ExpertClubDesktopShell'

export function AdminLayout() {
  const location = useLocation()
  
  // Map paths to active states
  const pathMap: Record<string, any> = {
    '/admin/dashboard': 'Visão geral',
    '/admin/users': 'Usuários',
    '/admin/subscriptions': 'Assinaturas',
    '/admin/affiliates': 'Influencers',
    '/admin/financeiro': 'Financeiro',
    '/admin/content': 'Conteúdo',
    '/admin/support': 'Suporte',
    '/admin/metrics': 'Métricas SaaS',
    '/admin/settings': 'Configurações',
    '/admin/workspaces': 'Workspaces'
  }

  const active = pathMap[location.pathname] || 'Visão geral'
  
  return (
    <ExpertClubDesktopShell 
      admin 
      active={active} 
      eyebrow="ADMIN DASHBOARD"
      title={active}
      subtitle="Painel administrativo do Expert Club"
    >
      <Outlet />
    </ExpertClubDesktopShell>
  )
}

export function MentorLayout() {
  const location = useLocation()
  
  const pathMap: Record<string, any> = {
    '/mentor/overview': 'Visão geral',
    '/mentor/alunos': 'Alunos',
    '/mentor/checkins': 'Check-ins',
    '/mentor/financeiro': 'Financeiro',
    '/mentor/influencers': 'Influencers',
    '/mentor/agenda': 'Agenda',
    '/mentor/relatorios': 'Relatórios',
    '/mentor/configuracoes': 'Configurações'
  }

  const active = pathMap[location.pathname] || 'Visão geral'

  return (
    <ExpertClubDesktopShell 
      active={active} 
      eyebrow="MENTOR DASHBOARD"
      title={active}
      subtitle="Painel de mentoria do Expert Club"
    >
      <Outlet />
    </ExpertClubDesktopShell>
  )
}
