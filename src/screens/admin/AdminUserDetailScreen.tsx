import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, UserCog } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { useAdminUser } from '../../hooks/admin/useAdminUsers'
import { adminUserService } from '../../services/adminUserService'
import { AdminState, AdminToolbar, ConfirmButton, Field } from './AdminShared'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { User } from '../../types/domain'

export function AdminUserDetailScreen() {
  const { uid } = useParams()
  const { firebaseUser } = useAuth()
  const { detail, isLoading, error, reload } = useAdminUser(uid)

  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [mentors, setMentors] = useState<User[]>([])
  const [mentorsLoading, setMentorsLoading] = useState(true)

  const [savingRole, setSavingRole] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingMentor, setSavingMentor] = useState(false)

  const actor = { uid: firebaseUser?.uid, email: firebaseUser?.email }
  const user = detail?.user
  const subscription = detail?.subscription

  // Load mentor list once
  useEffect(() => {
    setMentorsLoading(true)
    adminUserService
      .listMentors()
      .then(setMentors)
      .catch((loadError) => {
        console.error('Erro ao carregar mentores:', loadError)
        setMentors([])
      })
      .finally(() => setMentorsLoading(false))
  }, [])

  // Sync mentorId when user loads
  useEffect(() => {
    setMentorId(user?.mentorId || '')
  }, [user?.mentorId])

  async function saveRole() {
    if (!uid || !role) return
    if (
      uid === firebaseUser?.uid &&
      role !== 'admin'
    ) {
      toastError('Por segurança, não é possível remover seu próprio acesso admin por esta tela.')
      return
    }
    setSavingRole(true)
    try {
      await adminUserService.updateRole(actor, uid, role as never)
      await reload()
      toastSuccess('Role atualizada com sucesso.')
    } catch (err) {
      console.error(err)
      toastError('Erro ao salvar role. Verifique o console.')
    } finally {
      setSavingRole(false)
    }
  }

  async function saveStatus() {
    if (!uid || !status) return
    setSavingStatus(true)
    try {
      await adminUserService.updateSubscription(actor, uid, { status: status as never })
      await reload()
      toastSuccess('Status da assinatura atualizado.')
    } catch (err) {
      console.error(err)
      toastError('Erro ao alterar assinatura.')
    } finally {
      setSavingStatus(false)
    }
  }

  async function saveMentor() {
    if (!uid) return
    setSavingMentor(true)
    try {
      await adminUserService.assignMentor(actor, uid, mentorId || null)
      await reload()
      toastSuccess(mentorId ? 'Mentor vinculado com sucesso.' : 'Mentor removido com sucesso.')
    } catch (err) {
      console.error(err)
      toastError('Erro ao salvar mentor. Verifique o console.')
    } finally {
      setSavingMentor(false)
    }
  }

  return (
    <PageShell wide>
      <AdminToolbar title={user?.displayName || 'Usuário'} eyebrow="Detalhe do usuário" description={user?.email} />
      <AdminState isLoading={isLoading} error={error} empty={!detail}>
        {detail && (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* ── Perfil + Ações ── */}
            <section className="ec-card rounded-2xl p-5 lg:col-span-1">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Perfil</h2>
              <Info label="Nome" value={user?.displayName} />
              <Info label="Email" value={user?.email} />
              <Info label="UID" value={user?.uid} mono />
              <Info
                label="Mentor atual"
                value={detail.mentor?.displayName || detail.mentor?.email || 'Sem mentor'}
              />
              <Info label="Treino selecionado" value={detail.profile?.selectedWorkoutId || '-'} />
              <Info label="Dieta selecionada" value={detail.profile?.selectedDietId || '-'} />

              <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
                {/* Role */}
                <Field label="Alterar role">
                  <select
                    value={role || user?.role}
                    onChange={e => setRole(e.target.value)}
                    className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                  >
                    <option value="member">Aluno</option>
                    <option value="mentor">Mentor</option>
                    <option value="affiliate">Afiliada</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Button
                  id="btn-save-role"
                  variant="primary"
                  onClick={saveRole}
                  disabled={savingRole || !role || role === user?.role}
                  className="w-full"
                >
                  {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar role'}
                </Button>

                {/* Mentor */}
                <Field label="Vincular mentor">
                  {mentorsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-text-muted">
                      <Loader2 className="h-3 w-3 animate-spin" /> Carregando mentores…
                    </div>
                  ) : (
                    <select
                      value={mentorId}
                      onChange={e => setMentorId(e.target.value)}
                      className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                    >
                      <option value="">Sem mentor</option>
                      {mentors.length === 0 && (
                        <option disabled value="">
                          Nenhum mentor cadastrado ainda
                        </option>
                      )}
                      {mentors
                        .filter(m => m.uid !== user?.uid)
                        .map(m => (
                          <option key={m.uid} value={m.uid}>
                            {m.displayName || m.email}
                          </option>
                        ))}
                    </select>
                  )}
                </Field>
                <Button
                  id="btn-save-mentor"
                  variant="ghost"
                  onClick={saveMentor}
                  disabled={savingMentor || mentorsLoading || mentorId === (user?.mentorId || '')}
                  className="w-full"
                >
                  {savingMentor ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar mentor'}
                </Button>

                <div className="flex items-center gap-2 rounded-xl border border-accent-yellow/20 bg-accent-yellow/5 px-3 py-2 text-[10px] text-accent-yellow">
                  <UserCog className="h-3 w-3 shrink-0" />
                  <span>
                    Ao alterar mentor, o vínculo é gravado em{' '}
                    <code className="font-mono">users/{'{uid}'}.mentorId</code> e auditado.
                  </span>
                </div>
              </div>
            </section>

            {/* ── Assinatura ── */}
            <section className="ec-card rounded-2xl p-5 lg:col-span-2">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Assinatura e uso</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Plano" value={subscription?.planName || '-'} />
                <Info label="Status" value={subscription?.status || '-'} />
                <Info label="Preço" value={subscription ? `R$ ${subscription.price}` : '-'} />
                <Info
                  label="Renovação"
                  value={
                    subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
                      : '-'
                  }
                />
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <select
                  value={status || subscription?.status || 'pending'}
                  onChange={e => setStatus(e.target.value)}
                  className="ec-input rounded-xl px-4 py-3 text-sm text-white"
                >
                  <option value="active">Ativa</option>
                  <option value="trialing">Teste</option>
                  <option value="pending">Pendente</option>
                  <option value="past_due">Atrasada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="expired">Expirada</option>
                </select>
                <Button
                  id="btn-save-status"
                  variant="primary"
                  className="md:w-auto"
                  onClick={saveStatus}
                  disabled={savingStatus}
                >
                  {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Alterar assinatura'}
                </Button>
                <ConfirmButton
                  variant="destructive"
                  message="Desativar usuário logicamente? Ele não será removido fisicamente."
                  onConfirm={() =>
                    uid &&
                    adminUserService.softDelete(actor, uid).then(() => {
                      reload()
                      toastSuccess('Usuário desativado.')
                    })
                  }
                >
                  Desativar
                </ConfirmButton>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <Metric label="Treinos" value={detail.workoutSessions.length} />
                <Metric label="Dietas registradas" value={detail.dietDays.length} />
                <Metric label="Evoluções" value={detail.bodyCheckins.length} />
              </div>
            </section>

            {/* ── Audit logs ── */}
            <section className="ec-card rounded-2xl p-5 lg:col-span-3">
              <h2 className="mb-4 font-display text-xl font-bold uppercase italic text-white">Audit logs relacionados</h2>
              <div className="space-y-2">
                {detail.auditLogs.map(log => (
                  <p key={log.id} className="rounded-xl bg-white/[0.03] p-3 text-xs text-text-secondary">
                    <span className="font-bold text-white">{log.action}</span> por {log.actorEmail} em{' '}
                    {String(log.createdAt)}
                  </p>
                ))}
                {detail.auditLogs.length === 0 && (
                  <p className="text-sm text-text-muted">Nenhum histórico administrativo para este usuário.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </AdminState>
    </PageShell>
  )
}

function Info({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className={`mt-1 text-sm text-white ${mono ? 'font-mono text-xs' : 'font-bold'}`}>{value || '-'}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.035] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className="font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}
