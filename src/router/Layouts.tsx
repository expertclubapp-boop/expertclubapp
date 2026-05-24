import { Outlet, useLocation } from 'react-router-dom'
import { ExpertClubDesktopShell } from '../components/v2/ExpertClubDesktopShell'

export function AdminLayout() {
  const location = useLocation()
  
  // Map paths to active states
  const pathMap: Record<string, any> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/users': 'Alunos',
    '/admin/checkins': 'Check-ins',
    '/admin/workouts': 'Treinos',
    '/admin/diets': 'Dietas',
    '/admin/presets': 'Presets',
    '/admin/content': 'Conteúdo',
    '/admin/challenges': 'Desafios',
    '/admin/subscriptions': 'Assinaturas',
    '/admin/produtos': 'Produtos',
    '/admin/affiliates': 'Afiliados',
    '/admin/influencers-v2': 'Influenciadores',
    '/admin/payouts-v2': 'Saques',
    '/admin/store': 'Loja',
    '/admin/economia': 'Economia',
    '/admin/auditoria': 'Auditoria',
    '/admin/financeiro': 'Financeiro',
    '/admin/support': 'Suporte',
    '/admin/settings': 'Configurações'
  }

  const active = pathMap[location.pathname] || 'Dashboard'
  
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
    '/mentor/prescriptions': 'Prescrições',
    '/mentor/treinos/prescritor': 'Treinos',
    '/mentor/dietas/prescritor': 'Dietas',
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
