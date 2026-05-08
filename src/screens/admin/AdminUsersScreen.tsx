import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  SlidersHorizontal, 
  ChevronRight
} from 'lucide-react'
import { useAdminUsers } from '../../hooks/admin/useAdminUsers'
import { V2Card, V2Avatar, V2Badge, V2Button, V2IconBubble } from '../../components/v2/ExpertClubV2Base'
import type { Subscription, User } from '../../types/domain'

type UserTableRow = User & {
  subscription?: Subscription | null
}

export function AdminUsersScreen() {
  const navigate = useNavigate()
  const { users, isLoading } = useAdminUsers()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')

  const tableUsers = useMemo<UserTableRow[]>(() => {
    return users.map((row) => ({
      ...row.user,
      subscription: row.subscription,
    }))
  }, [users])

  const filteredUsers = useMemo(() => {
    return tableUsers.filter(user => {
      const matchesSearch = 
        (user.displayName || '').toLowerCase().includes(search.toLowerCase()) || 
        (user.email || '').toLowerCase().includes(search.toLowerCase())
      const matchesRole = role === 'all' || user.role === role
      return matchesSearch && matchesRole
    })
  }, [tableUsers, search, role])

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* FILTERS */}
      <V2Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm font-bold placeholder:text-text-muted outline-none focus:border-ec-violet/50 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-ec-violet/50 transition-all appearance-none cursor-pointer"
            >
              <option value="all">TODOS OS ROLES</option>
              <option value="admin">ADMIN</option>
              <option value="mentor">MENTOR</option>
              <option value="member">ALUNO</option>
              <option value="affiliate">AFILIADO</option>
            </select>
            <V2Button
              variant="secondary"
              disabled
              title="Os filtros de role e busca ja estao ativos; filtros avancados ainda nao existem neste modulo."
              className="px-6 flex items-center gap-2"
            >
              <SlidersHorizontal size={16} />
              FILTROS ATIVOS
            </V2Button>
          </div>
        </div>
      </V2Card>

      {/* USERS TABLE */}
      <V2Card className="overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Role</th>
                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Plano</th>
                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <V2Avatar uid={user.uid} name={user.displayName || ''} size="md" />
                      <div>
                        <p className="text-sm font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{user.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <V2Badge tone={
                      user.role === 'admin' ? 'warning' : 
                      user.role === 'mentor' ? 'violet' : 
                      user.role === 'affiliate' ? 'info' : 'neutral'
                    }>
                      {user.role?.toUpperCase()}
                    </V2Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white uppercase">{user.subscription?.planName || user.subscriptionPlan || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <V2Badge tone={(user.subscription?.status || user.subscriptionStatus) === 'active' ? 'success' : 'neutral'}>
                      {(user.subscription?.status || user.subscriptionStatus)?.toUpperCase() || 'INATIVO'}
                    </V2Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/admin/users/${user.uid}`)}
                      className="p-2 text-text-muted hover:text-white transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center">
            <V2IconBubble icon={Search} tone="neutral" size={24} className="mx-auto mb-4" />
            <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Nenhum usuário encontrado com estes filtros.</p>
          </div>
        )}
      </V2Card>

      {/* FOOTER STATS */}
      <div className="flex justify-between items-center text-[10px] font-black tracking-[0.2em] text-text-muted uppercase px-2">
         <span>{filteredUsers.length} USUÁRIOS FILTRADOS</span>
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-accent-lime" /> {tableUsers.filter(u => (u.subscription?.status || u.subscriptionStatus) === 'active').length} ATIVOS</span>
            <span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-ec-violet" /> {tableUsers.filter(u => u.role === 'mentor').length} MENTORES</span>
         </div>
      </div>

    </div>
  )
}
