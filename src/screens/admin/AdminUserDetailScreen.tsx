import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { useAdminUser } from '../../hooks/admin/useAdminUsers'
import { adminUserService } from '../../services/adminUserService'
import { AdminState, AdminToolbar, ConfirmButton, Field } from './AdminShared'
import type { User } from '../../types/domain'

export function AdminUserDetailScreen() {
  const { uid } = useParams()
  const { firebaseUser } = useAuth()
  const { detail, isLoading, error, reload } = useAdminUser(uid)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [mentors, setMentors] = useState<User[]>([])

  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  const user = detail?.user
  const subscription = detail?.subscription

  useEffect(() => {
    adminUserService.listMentors().then(setMentors).catch((loadError) => {
      console.error('Erro ao carregar mentores:', loadError)
      setMentors([])
    })
  }, [])

  useEffect(() => {
    setMentorId(user?.mentorId || '')
  }, [user?.mentorId])

  async function saveRole() {
    if (!uid || !role) return
    if (uid === firebaseUser?.uid && role !== 'admin' && !window.confirm('Você está removendo seu próprio admin. Confirme novamente para continuar.')) return
    await adminUserService.updateRole(actor, uid, role as never)
    await reload()
  }

  async function saveStatus() {
    if (!uid || !status) return
    await adminUserService.updateSubscription(actor, uid, { status: status as never })
    await reload()
  }

  async function saveMentor() {
    if (!uid) return
    await adminUserService.assignMentor(actor, uid, mentorId || null)
    await reload()
  }

  return (
    <PageShell wide>
      <AdminToolbar title={user?.displayName || 'Usuário'} eyebrow="Detalhe do usuário" description={user?.email} />
      <AdminState isLoading={isLoading} error={error} empty={!detail}>
        {detail && (
          <div className="grid gap-5 lg:grid-cols-3">
            <section className="ec-card rounded-2xl p-5 lg:col-span-1">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Perfil</h2>
              <Info label="Nome" value={user?.displayName} />
              <Info label="Email" value={user?.email} />
              <Info label="UID" value={user?.uid} mono />
              <Info label="Mentor atual" value={detail.mentor?.displayName || detail.mentor?.email || '-'} />
              <Info label="Treino selecionado" value={detail.profile?.selectedWorkoutId || '-'} />
              <Info label="Dieta selecionada" value={detail.profile?.selectedDietId || '-'} />
              <div className="mt-5 space-y-4">
                <Field label="Alterar role">
                  <select value={role || user?.role} onChange={e => setRole(e.target.value)} className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white">
                    <option value="member">Aluno</option>
                    <option value="mentor">Mentor</option>
                    <option value="affiliate">Afiliada</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Button variant="primary" onClick={saveRole}>Salvar role</Button>
                <Field label="Vincular mentor">
                  <select value={mentorId} onChange={e => setMentorId(e.target.value)} className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white">
                    <option value="">Sem mentor</option>
                    {mentors
                      .filter((mentor) => mentor.uid !== user?.uid)
                      .map((mentor) => (
                        <option key={mentor.uid} value={mentor.uid}>
                          {mentor.displayName || mentor.email}
                        </option>
                      ))}
                  </select>
                </Field>
                <Button variant="ghost" onClick={saveMentor}>Salvar mentor</Button>
              </div>
            </section>

            <section className="ec-card rounded-2xl p-5 lg:col-span-2">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Assinatura e uso</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Plano" value={subscription?.planName || '-'} />
                <Info label="Status" value={subscription?.status || '-'} />
                <Info label="Preço" value={subscription ? `R$ ${subscription.price}` : '-'} />
                <Info label="Renovação" value={subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') : '-'} />
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <select value={status || subscription?.status || 'pending'} onChange={e => setStatus(e.target.value)} className="ec-input rounded-xl px-4 py-3 text-sm text-white">
                  <option value="active">Ativa</option>
                  <option value="trialing">Teste</option>
                  <option value="pending">Pendente</option>
                  <option value="past_due">Atrasada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="expired">Expirada</option>
                </select>
                <Button variant="primary" className="md:w-auto" onClick={saveStatus}>Alterar assinatura</Button>
                <ConfirmButton variant="destructive" message="Desativar usuário logicamente?" onConfirm={() => uid && adminUserService.softDelete(actor, uid).then(reload)}>Desativar</ConfirmButton>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <Metric label="Treinos" value={detail.workoutSessions.length} />
                <Metric label="Dietas registradas" value={detail.dietDays.length} />
                <Metric label="Evoluções" value={detail.bodyCheckins.length} />
              </div>
            </section>

            <section className="ec-card rounded-2xl p-5 lg:col-span-3">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Audit logs relacionados</h2>
              <div className="space-y-2">
                {detail.auditLogs.map(log => <p key={log.id} className="rounded-xl bg-white/[0.03] p-3 text-xs text-text-secondary">{log.action} por {log.actorEmail} em {String(log.createdAt)}</p>)}
                {detail.auditLogs.length === 0 && <p className="text-sm text-text-muted">Nenhum histórico administrativo para este usuário.</p>}
              </div>
            </section>
          </div>
        )}
      </AdminState>
    </PageShell>
  )
}

function Info({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p><p className={`mt-1 text-sm text-white ${mono ? 'font-mono' : 'font-bold'}`}>{value || '-'}</p></div>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white/[0.035] p-4"><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p><p className="font-display text-2xl font-black italic text-white">{value}</p></div>
}
