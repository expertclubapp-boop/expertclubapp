import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, UserCog, UserX } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { useAdminUsers } from '../../hooks/admin/useAdminUsers'
import { adminUserService } from '../../services/adminUserService'
import { AdminSearchFilter, AdminState, AdminToolbar } from './AdminShared'
import type { User } from '../../types/domain'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  mentor: 'Mentor',
  member: 'Aluno',
  affiliate: 'Afiliada',
}

const statusLabel: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Teste',
  pending: 'Pendente',
  past_due: 'Atrasada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

export function AdminUsersScreen() {
  const navigate = useNavigate()
  const { users, isLoading, error } = useAdminUsers()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [mentorFilter, setMentorFilter] = useState('all') // 'all' | 'none' | mentorUid
  const [mentors, setMentors] = useState<User[]>([])

  useEffect(() => {
    adminUserService
      .listMentors()
      .then(setMentors)
      .catch(() => setMentors([]))
  }, [])

  const filtered = useMemo(
    () =>
      users.filter(({ user, subscription }) => {
        const haystack = `${user.displayName} ${user.email} ${subscription?.planName || ''}`.toLowerCase()
        const matchesSearch = haystack.includes(search.toLowerCase())
        const matchesRole = role === 'all' || user.role === role
        const matchesMentor =
          mentorFilter === 'all' ||
          (mentorFilter === 'none' && !user.mentorId) ||
          user.mentorId === mentorFilter
        return matchesSearch && matchesRole && matchesMentor
      }),
    [users, search, role, mentorFilter],
  )

  const mentorMap = useMemo(
    () => Object.fromEntries(mentors.map(m => [m.uid, m.displayName || m.email])),
    [mentors],
  )

  return (
    <PageShell wide>
      <AdminToolbar
        title="Usuários"
        eyebrow="Operação"
        description="Gerencie alunos, afiliadas, admins, assinatura e histórico de uso."
      />

      {/* Search + role filter */}
      <AdminSearchFilter
        search={search}
        onSearch={setSearch}
        status={role}
        onStatus={setRole}
        statuses={[
          ['all', 'Todos'],
          ['member', 'Alunos'],
          ['mentor', 'Mentores'],
          ['affiliate', 'Afiliadas'],
          ['admin', 'Admins'],
        ]}
      />

      {/* Mentor filter row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Filtrar por mentor:</span>
        <button
          onClick={() => setMentorFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${mentorFilter === 'all' ? 'bg-accent-lime/20 text-accent-lime' : 'bg-white/5 text-text-muted hover:text-white'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setMentorFilter('none')}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors ${mentorFilter === 'none' ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-white/5 text-text-muted hover:text-white'}`}
        >
          <UserX className="h-3 w-3" /> Sem mentor
        </button>
        {mentors.map(m => (
          <button
            key={m.uid}
            onClick={() => setMentorFilter(m.uid)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${mentorFilter === m.uid ? 'bg-ec-violet/30 text-white' : 'bg-white/5 text-text-muted hover:text-white'}`}
          >
            {m.displayName || m.email}
          </button>
        ))}
      </div>

      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {['Usuário', 'Role', 'Mentor', 'Assinatura', 'Plano', 'Entrada', 'Ações'].map(h => (
                    <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(({ user, subscription }) => (
                  <tr key={user.uid} className="hover:bg-white/[0.025]">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{user.displayName || 'Usuário sem nome'}</p>
                      <p className="text-[10px] text-text-muted">{user.email}</p>
                    </td>
                    <td className="p-4 text-xs text-white">{roleLabel[user.role] || user.role}</td>

                    {/* Mentor column */}
                    <td className="p-4">
                      {user.mentorId ? (
                        <span className="inline-block rounded-full bg-ec-violet/20 px-2 py-0.5 text-[10px] font-bold text-white">
                          {mentorMap[user.mentorId] || user.mentorId.slice(0, 8) + '…'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-yellow/10 px-2 py-0.5 text-[10px] font-bold text-accent-yellow">
                          <UserX className="h-2.5 w-2.5" /> Sem mentor
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-text-secondary">
                      {statusLabel[subscription?.status || user.subscriptionStatus || 'pending'] || 'Pendente'}
                    </td>
                    <td className="p-4 text-xs text-text-secondary">
                      {subscription?.planName || user.subscriptionPlan || '-'}
                    </td>
                    <td className="p-4 text-xs text-text-muted">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-open-user-${user.uid}`}
                          onClick={() => navigate(`/admin/users/${user.uid}`)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-accent-lime/40"
                        >
                          <Eye className="h-4 w-4" /> Abrir
                        </button>
                        {/* Quick assign mentor shortcut for students without mentor */}
                        {user.role === 'member' && !user.mentorId && (
                          <button
                            id={`btn-assign-mentor-${user.uid}`}
                            onClick={() => navigate(`/admin/users/${user.uid}`)}
                            title="Atribuir mentor"
                            className="inline-flex items-center gap-1 rounded-lg border border-accent-yellow/20 bg-accent-yellow/10 px-3 py-2 text-xs font-bold text-accent-yellow hover:border-accent-yellow/40"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>

      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
        <UserCog className="h-4 w-4" /> UID aparece apenas no detalhe do usuário.
        {mentorFilter === 'none' && (
          <span className="ml-4 text-accent-yellow">
            Mostrando {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} sem mentor.
          </span>
        )}
      </div>
    </PageShell>
  )
}
