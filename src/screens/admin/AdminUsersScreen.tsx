import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, UserCog } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { useAdminUsers } from '../../hooks/admin/useAdminUsers'
import { AdminSearchFilter, AdminState, AdminToolbar } from './AdminShared'

const roleLabel = { admin: 'Admin', member: 'Aluno', affiliate: 'Afiliada' } as const
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

  const filtered = useMemo(() => users.filter(({ user, subscription }) => {
    const haystack = `${user.displayName} ${user.email} ${subscription?.planName || ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase()) && (role === 'all' || user.role === role)
  }), [users, search, role])

  return (
    <PageShell wide>
      <AdminToolbar title="Usuários" eyebrow="Operação" description="Gerencie alunos, afiliadas, admins, assinatura e histórico de uso." />
      <AdminSearchFilter search={search} onSearch={setSearch} status={role} onStatus={setRole} statuses={[['all', 'Todos'], ['member', 'Alunos'], ['affiliate', 'Afiliadas'], ['admin', 'Admins']]} />
      <AdminState isLoading={isLoading} error={error} empty={filtered.length === 0}>
        <div className="ec-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {['Usuário', 'Role', 'Assinatura', 'Plano', 'Entrada', 'Origem', 'Ações'].map(h => <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(({ user, subscription }) => (
                  <tr key={user.uid} className="hover:bg-white/[0.025]">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{user.displayName || 'Usuário sem nome'}</p>
                      <p className="text-[10px] text-text-muted">{user.email}</p>
                    </td>
                    <td className="p-4 text-xs text-white">{roleLabel[user.role]}</td>
                    <td className="p-4 text-xs text-text-secondary">{statusLabel[subscription?.status || user.subscriptionStatus || 'pending'] || 'Pendente'}</td>
                    <td className="p-4 text-xs text-text-secondary">{subscription?.planName || user.subscriptionPlan || '-'}</td>
                    <td className="p-4 text-xs text-text-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-4 text-xs text-text-muted">{subscription?.referralCode || user.referralCode || '-'}</td>
                    <td className="p-4">
                      <button onClick={() => navigate(`/admin/users/${user.uid}`)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-accent-lime/40">
                        <Eye className="h-4 w-4" /> Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminState>
      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted"><UserCog className="h-4 w-4" /> UID aparece apenas no detalhe do usuário.</div>
    </PageShell>
  )
}
