import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, CalendarClock, Dumbbell, Utensils, Target, Activity } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'

import { useAdminStudent360 } from '../../hooks/admin/useAdminStudent360'
import { adminWorkoutService } from '../../services/adminWorkoutService'
import { adminDietService } from '../../services/adminDietService'
import { adminUserService } from '../../services/adminUserService'
import { adminPrescriptionService } from '../../services/adminPrescriptionService'
import type { AdminActor } from '../../services/adminAuditLogService'
import { workoutProgressionService, type WorkoutProgressSummary } from '../../services/workoutProgressionService'
import { AdminState, AdminToolbar, ConfirmButton, Field } from './AdminShared'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { statusPt, rolePt, goalPt, levelPt, assignmentStatusPt, churnRiskPt, consistencyLevelPt, evolutionPeriodPt } from '../../utils/labels'
import { cx, V2Badge, V2Card, V2Button } from '../../components/v2/ExpertClubV2Base'
import { V2StatCard } from '../../components/v2/ExpertClubStatCard'
import type { SubscriptionStatus, Workout, Diet, User } from '../../types/domain'
import type { PrescriptionAssignment } from '../../types/prescription.types'

function formatDate(val: unknown) {
  if (!val) return '-'
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toLocaleDateString('pt-BR')
  }
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? '-' : val.toLocaleDateString('pt-BR')
  }
  if (typeof val !== 'string' && typeof val !== 'number') return '-'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
}

function bodyFatPct(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const raw = (value as { bodyFatPct?: unknown; bodyFat?: unknown }).bodyFatPct ?? (value as { bodyFat?: unknown }).bodyFat
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

const TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'workout', label: 'Treino' },
  { id: 'diet', label: 'Dieta' },
  { id: 'checkins', label: 'Check-ins' },
  { id: 'evolution', label: 'Evolução' },
  { id: 'subscription', label: 'Assinatura' },
] as const

export function AdminUserDetailScreen() {
  const { uid } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'overview'
  const tab = rawTab === 'evolucao' ? 'evolution' : rawTab
  const setTab = (t: string) => setSearchParams({ tab: t })

  const { data, isLoading, error, reload } = useAdminStudent360(uid)

  const user = data?.user
  const subscription = data?.subscription
  const summary = data?.summary

  return (
    <PageShell wide>
      <AdminToolbar 
        title={user?.displayName || 'Aluno'} 
        eyebrow="PRONTUÁRIO 360º" 
        description={user?.email} 
      />
      <AdminState isLoading={isLoading} error={error} empty={!data}>
        {data && (
          <div className="space-y-8">
            {/* Resumo Rápido */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               <V2StatCard label="Status" value={statusPt(subscription?.status)} tone={subscription?.status === 'active' ? 'success' : 'warning'} icon={Activity} />
               <V2StatCard label="Último Treino" value={formatDate(summary?.lastWorkoutAt)} icon={Dumbbell} tone="violet" />
               <V2StatCard label="Último Check-in" value={formatDate(summary?.lastCheckinAt)} icon={CalendarClock} tone="info" />
               <V2StatCard label="Aderência Dieta" value={`${summary?.dietAdherence || 0}%`} icon={Utensils} tone="success" />
               <V2StatCard label="Plano" value={subscription?.planName || 'Padrão'} icon={Target} tone="neutral" />
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    "px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors",
                    tab === t.id ? "border-ec-violet text-ec-violet" : "border-transparent text-text-muted hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="py-4">
              {tab === 'overview' && <TabOverview data={data} />}
              {tab === 'workout' && <TabWorkout data={data} reload={reload} />}
              {tab === 'diet' && <TabDiet data={data} reload={reload} />}
              {tab === 'checkins' && <TabCheckins data={data} />}
              {tab === 'evolution' && <TabEvolution data={data} />}
              {tab === 'subscription' && <TabSubscription data={data} reload={reload} />}
            </div>
          </div>
        )}
      </AdminState>
    </PageShell>
  )
}

function TabOverview({ data }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']> }) {
  const { user, profile, insightSummary, evolutionReport } = data
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Dados Pessoais</h3>
        <div className="space-y-4">
          <Info label="Nome" value={user.displayName} />
          <Info label="Email" value={user.email} />
          <Info label="Role" value={rolePt(user.role)} />
          <Info label="Data de Cadastro" value={formatDate(user.createdAt)} />
        </div>
      </V2Card>
      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Perfil Físico</h3>
        <div className="space-y-4">
          <Info label="Objetivo" value={goalPt(profile?.goal)} />
        </div>
      </V2Card>
      <V2Card className="p-6 md:col-span-2 border border-accent-lime/20 bg-accent-lime/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xs font-black italic text-accent-lime uppercase tracking-widest">Resumo automático</h3>
            <p className="mt-3 text-2xl font-black italic text-white">{evolutionReport.automatedSummary.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{evolutionReport.automatedSummary.message}</p>
          </div>
          <V2Badge tone={insightSummary.churnRisk.level === 'low' ? 'success' : insightSummary.churnRisk.level === 'medium' ? 'warning' : 'danger'}>
            Risco de abandono {churnRiskPt(insightSummary.churnRisk.level)}
          </V2Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Info label="Consistência" value={`${evolutionReport.consistency.score} · ${consistencyLevelPt(evolutionReport.consistency.level)}`} />
          <Info label="Treinos" value={`${evolutionReport.training.completedSessions}`} />
          <Info label="Dieta" value={`${evolutionReport.diet.averageAdherencePct}%`} />
          <Info label="Água" value={`${evolutionReport.hydration.averagePct}%`} />
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{evolutionPeriodPt(evolutionReport.periodDays)}</p>
          <div className="mt-3 space-y-2">
            {evolutionReport.consistency.reasons.length > 0 ? evolutionReport.consistency.reasons.map((reason) => (
              <p key={reason} className="text-sm text-white">{reason}</p>
            )) : (
              <p className="text-sm text-text-secondary">Sem alertas operacionais relevantes no momento.</p>
            )}
          </div>
        </div>
      </V2Card>
    </div>
  )
}

function TabWorkout({ data, reload }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']>, reload: () => void }) {
  const { firebaseUser } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [assigning, setAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState<PrescriptionAssignment[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [progressSummary, setProgressSummary] = useState<WorkoutProgressSummary | null>(null)
  const [progressError, setProgressError] = useState<string | null>(null)

  useEffect(() => {
    adminWorkoutService.list().then(res => setWorkouts(res))
    adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'workout')
      .then((items) => {
        setHistory(items)
        setHistoryError(null)
      })
      .catch((error: unknown) => {
        setHistory([])
        setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico de prescrições.')
      })
      .finally(() => setHistoryLoading(false))
    workoutProgressionService.getStudentWorkoutProgressSummary(data.user.uid)
      .then((summary) => {
        setProgressSummary(summary)
        setProgressError(null)
      })
      .catch((error: unknown) => {
        setProgressSummary(null)
        setProgressError(error instanceof Error ? error.message : 'Não foi possível carregar as métricas de progressão.')
      })
  }, [data.user.uid])

  async function handleAssign() {
    if (!data.user.uid || !selectedId || !firebaseUser) return
    setAssigning(true)
    try {
      await adminPrescriptionService.assignWorkoutToStudent({
        studentId: data.user.uid,
        workoutId: selectedId,
        reason,
        adminUid: firebaseUser.uid,
        adminEmail: firebaseUser.email || 'admin',
        adminName: firebaseUser.displayName || firebaseUser.email || 'Admin',
      })
      toastSuccess('Treino atribuído com sucesso.')
      setSelectedId('')
      setReason('')
      const [updated] = await Promise.all([
        adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'workout'),
        reload(),
      ])
      setHistory(updated)
      setHistoryError(null)
    } catch (e: any) {
      toastError(e.message || 'Erro ao atribuir treino.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Treino Atual</h3>
          {data.currentWorkout ? (
            <div className="space-y-4">
              <Info label="Título" value={data.currentWorkout.title} />
              <Info label="Objetivo" value={goalPt(data.currentWorkout.goal)} />
              <Info label="Nível" value={levelPt(data.currentWorkout.level)} />
              {history.length > 0 && history[0].status === 'active' && (
                <>
                  <Info label="Atribuído por" value={history[0].assignedByName} />
                  <Info label="Data da atribuição" value={formatDate(history[0].assignedAt)} />
                  {history[0].reason && <Info label="Motivo" value={history[0].reason} />}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhum treino atribuído.</p>
          )}
        </V2Card>

        <V2Card className="p-6 border border-ec-violet/30 bg-ec-violet/5">
          <h3 className="text-xs font-black italic text-ec-violet uppercase tracking-widest mb-6">Atribuir Novo Treino</h3>
          <div className="space-y-4">
            <Field label="Template de treino">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
              >
                <option value="">Selecione um template...</option>
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Motivo da atribuição (opcional)">
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Progressão de carga, mudança de objetivo..."
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                disabled={assigning}
              />
            </Field>
            <V2Button
              variant="primary"
              className="w-full"
              disabled={!selectedId || assigning}
              onClick={handleAssign}
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atribuir Treino'}
            </V2Button>
          </div>
        </V2Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <V2Card className="p-6 border border-accent-lime/20 bg-accent-lime/5">
          <h3 className="text-xs font-black italic text-accent-lime uppercase tracking-widest mb-6">Métricas de Progressão</h3>
          {progressError ? (
            <p className="text-sm text-rose-300 italic">{progressError}</p>
          ) : progressSummary && progressSummary.totalSessions > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Sessões concluídas" value={progressSummary.totalSessions.toString()} />
                <Info label="Volume total" value={`${progressSummary.totalTonnage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`} />
                <Info label="Último treino" value={progressSummary.lastSessionDate ? formatDate(progressSummary.lastSessionDate) : 'Nunca'} />
                <Info label="Sequência ativa" value={`${progressSummary.activeStreak} dia(s)`} />
              </div>

              {progressSummary.topExercises.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Exercícios com maior evolução</h4>
                  <div className="mt-3 space-y-3">
                    {progressSummary.topExercises.map((exercise) => (
                      <div key={exercise.exerciseId} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-white">{exercise.exerciseName}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">
                              {exercise.sessionsCount} sessão(ões) registradas
                            </p>
                          </div>
                          <V2Badge tone="success">
                            {exercise.totalTonnage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                          </V2Badge>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <Info label="Melhor marca" value={`${exercise.bestLoad.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg · ${exercise.bestReps} reps`} />
                          <Info label="Última carga" value={`${exercise.latestLoad.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg · ${exercise.latestReps} reps`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progressSummary.latestPerformances.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Últimas cargas registradas</h4>
                  <div className="mt-3 space-y-3">
                    {progressSummary.latestPerformances.map((exercise) => (
                      <div key={`${exercise.exerciseId}-${exercise.latestDate || 'latest'}`} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                        <div>
                          <p className="text-sm font-bold text-white">{exercise.exerciseName}</p>
                          <p className="text-[10px] uppercase tracking-widest text-text-muted">
                            {exercise.latestDate ? formatDate(exercise.latestDate) : 'Sem data'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {exercise.latestLoad.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-text-muted">
                            {exercise.latestReps} reps
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs text-text-muted">
                  Volume total = soma de carga x reps das séries válidas das sessões concluídas deste aluno.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted italic">Sem histórico real de treino para calcular progressão neste aluno.</p>
          )}
        </V2Card>
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Sessões Recentes</h3>
          {data.recentWorkoutSessions.length > 0 ? (
            <div className="space-y-4">
              {data.recentWorkoutSessions.map((s, index) => (
                <div key={s.id || `${s.startedAt || 'session'}-${index}`} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{s.workoutId ? `Treino ${s.workoutId}` : 'Treino registrado'}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">
                      {formatDate(s.startedAt)} - {Math.floor((s.durationSeconds || 0) / 60)} min
                    </p>
                  </div>
                  <V2Button disabled variant="secondary" className="text-xs h-8" title="Visualização de sessão em breve">Abrir sessão</V2Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhuma sessão registrada.</p>
          )}
        </V2Card>

        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Histórico de Prescrições</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
          ) : historyError ? (
            <p className="text-sm text-rose-300 italic">{historyError}</p>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((a, index) => (
                <div key={a.id || `${a.templateId}-${a.assignedAt}-${index}`} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white">{a.templateTitle}</span>
                    <V2Badge tone={a.status === 'active' ? 'success' : 'neutral'}>
                      {assignmentStatusPt(a.status)}
                    </V2Badge>
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest space-y-1">
                    <p>Atribuído por {a.assignedByName} em {formatDate(a.assignedAt)}</p>
                    {a.reason && <p>Motivo: {a.reason}</p>}
                    {a.previousTemplateTitle && <p>Substituiu: {a.previousTemplateTitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhuma prescrição registrada.</p>
          )}
        </V2Card>
      </div>
    </div>
  )
}

function TabDiet({ data, reload }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']>, reload: () => void }) {
  const { firebaseUser } = useAuth()
  const [diets, setDiets] = useState<Diet[]>([])
  const [assigning, setAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState<PrescriptionAssignment[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    adminDietService.list().then(setDiets)
    adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'diet')
      .then((items) => {
        setHistory(items)
        setHistoryError(null)
      })
      .catch((error: unknown) => {
        setHistory([])
        setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico de prescrições.')
      })
      .finally(() => setHistoryLoading(false))
  }, [data.user.uid])

  async function handleAssign() {
    if (!data.user.uid || !selectedId || !firebaseUser) return
    setAssigning(true)
    try {
      await adminPrescriptionService.assignDietToStudent({
        studentId: data.user.uid,
        dietId: selectedId,
        reason,
        adminUid: firebaseUser.uid,
        adminEmail: firebaseUser.email || 'admin',
        adminName: firebaseUser.displayName || firebaseUser.email || 'Admin',
      })
      toastSuccess('Dieta atribuída com sucesso.')
      setSelectedId('')
      setReason('')
      const [updated] = await Promise.all([
        adminPrescriptionService.listPrescriptionAssignments(data.user.uid, 'diet'),
        reload(),
      ])
      setHistory(updated)
      setHistoryError(null)
    } catch (e: any) {
      toastError(e.message || 'Erro ao atribuir dieta.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Dieta Atual</h3>
          {data.currentDiet ? (
            <div className="space-y-4">
              <Info label="Título" value={data.currentDiet.title} />
              <Info label="Calorias Alvo" value={`${data.currentDiet.calories || 0} kcal`} />
              <div className="flex gap-4">
                <Info label="P" value={`${data.currentDiet.protein || 0}g`} />
                <Info label="C" value={`${data.currentDiet.carbs || 0}g`} />
                <Info label="G" value={`${data.currentDiet.fat || 0}g`} />
              </div>
              {history.length > 0 && history[0].status === 'active' && (
                <>
                  <Info label="Atribuída por" value={history[0].assignedByName} />
                  <Info label="Data da atribuição" value={formatDate(history[0].assignedAt)} />
                  {history[0].reason && <Info label="Motivo" value={history[0].reason} />}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhuma dieta atribuída.</p>
          )}
        </V2Card>

        <V2Card className="p-6 border border-ec-violet/30 bg-ec-violet/5">
          <h3 className="text-xs font-black italic text-ec-violet uppercase tracking-widest mb-6">Atribuir Nova Dieta</h3>
          <div className="space-y-4">
            <Field label="Template de dieta">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
              >
                <option value="">Selecione um template...</option>
                {diets.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Motivo da atribuição (opcional)">
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Ajuste calórico, fase de cutting..."
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                disabled={assigning}
              />
            </Field>
            <V2Button
              variant="primary"
              className="w-full"
              disabled={!selectedId || assigning}
              onClick={handleAssign}
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atribuir Dieta'}
            </V2Button>
          </div>
        </V2Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Dias Recentes</h3>
          {data.recentDietDays.length > 0 ? (
            <div className="space-y-4">
              {data.recentDietDays.map((d, index) => (
                <div key={d.id || `${d.dateKey || 'diet-day'}-${index}`} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{formatDate(d.dateKey)}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">
                      Aderência: {d.adherencePercent !== undefined ? `${d.adherencePercent}%` : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhum dia registrado.</p>
          )}
        </V2Card>

        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Histórico de Prescrições</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
          ) : historyError ? (
            <p className="text-sm text-rose-300 italic">{historyError}</p>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((a, index) => (
                <div key={a.id || `${a.templateId}-${a.assignedAt}-${index}`} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white">{a.templateTitle}</span>
                    <V2Badge tone={a.status === 'active' ? 'success' : 'neutral'}>
                      {assignmentStatusPt(a.status)}
                    </V2Badge>
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest space-y-1">
                    <p>Atribuída por {a.assignedByName} em {formatDate(a.assignedAt)}</p>
                    {a.reason && <p>Motivo: {a.reason}</p>}
                    {a.previousTemplateTitle && <p>Substituiu: {a.previousTemplateTitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">Nenhuma prescrição registrada.</p>
          )}
        </V2Card>
      </div>
    </div>
  )
}

function TabCheckins({ data }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']> }) {
  const navigate = useNavigate()
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Check-ins Diários Recentes</h3>
        {data.recentDailyCheckins.length > 0 ? (
          <div className="space-y-4">
            {data.recentDailyCheckins.map(c => (
              <div key={c.id} className="p-4 bg-white/5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">{formatDate(c.dateKey)}</span>
                  <V2Badge tone="neutral">Humor: {c.mood || '-'}/10</V2Badge>
                </div>
                <p className="text-[10px] text-text-muted uppercase mb-1">Energia: {c.energy || '-'}</p>
                {c.notes && <p className="text-sm text-text-secondary italic">"{c.notes}"</p>}
                <div className="mt-4 border-t border-white/5 pt-3">
                  <V2Button 
                    variant="secondary" 
                    className="text-xs w-full h-8" 
                    onClick={() => navigate(`/admin/checkins/${data.user.uid}/daily/${c.dateKey}`)}
                  >
                    Abrir check-in
                  </V2Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Nenhum check-in diário.</p>
        )}
      </V2Card>
      
      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Check-ins Semanais Recentes</h3>
        {data.recentWeeklyCheckins.length > 0 ? (
          <div className="space-y-4">
            {data.recentWeeklyCheckins.map(c => (
              <div key={c.id} className="p-4 bg-white/5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">{formatDate(c.createdAt)}</span>
                </div>
                {c.notes && <p className="text-sm text-text-secondary italic">"{c.notes}"</p>}
                <div className="mt-4 border-t border-white/5 pt-3">
                  <V2Button 
                    variant="secondary" 
                    className="text-xs w-full h-8" 
                    onClick={() => navigate(`/admin/checkins/${data.user.uid}/weekly/${c.id}`)}
                  >
                    Abrir check-in
                  </V2Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Nenhum check-in semanal.</p>
        )}
      </V2Card>
    </div>
  )
}

function TabEvolution({ data }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']> }) {
  const { evolutionReport, insightSummary } = data
  return (
    <div className="space-y-6">
      <V2Card className="p-6 border border-accent-lime/20 bg-accent-lime/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xs font-black italic text-accent-lime uppercase tracking-widest">Painel operacional</h3>
            <p className="mt-3 text-2xl font-black italic text-white">{evolutionReport.automatedSummary.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{evolutionReport.automatedSummary.message}</p>
          </div>
          <div className="flex flex-col gap-2">
            <V2Badge tone={evolutionReport.consistency.level === 'high' ? 'success' : evolutionReport.consistency.level === 'medium' ? 'warning' : 'danger'}>
              {evolutionReport.consistency.score} pontos
            </V2Badge>
            <V2Badge tone={insightSummary.churnRisk.level === 'low' ? 'success' : insightSummary.churnRisk.level === 'medium' ? 'warning' : 'danger'}>
              Risco de abandono {churnRiskPt(insightSummary.churnRisk.level)}
            </V2Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Info label="Consistência" value={consistencyLevelPt(evolutionReport.consistency.level)} />
          <Info label="Treinos" value={`${evolutionReport.training.completedSessions}`} />
          <Info label="Dieta" value={`${evolutionReport.diet.averageAdherencePct}%`} />
          <Info label="Água" value={`${evolutionReport.hydration.averagePct}%`} />
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{evolutionPeriodPt(evolutionReport.periodDays)}</p>
          <div className="mt-3 space-y-2">
            {insightSummary.churnRisk.reasons.length > 0 ? insightSummary.churnRisk.reasons.map((reason) => (
              <p key={reason} className="text-sm text-white">{reason}</p>
            )) : (
              <p className="text-sm text-text-secondary">Sem alertas operacionais relevantes no momento.</p>
            )}
          </div>
        </div>
      </V2Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Corpo e Check-ins</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Peso atual" value={typeof evolutionReport.body.latestWeightKg === 'number' ? `${evolutionReport.body.latestWeightKg} kg` : '-'} />
            <Info label="Peso anterior" value={typeof evolutionReport.body.previousWeightKg === 'number' ? `${evolutionReport.body.previousWeightKg} kg` : '-'} />
            <Info label="Diferença peso" value={typeof evolutionReport.body.weightDeltaKg === 'number' ? `${evolutionReport.body.weightDeltaKg > 0 ? '+' : ''}${evolutionReport.body.weightDeltaKg} kg` : 'Dados iniciais'} />
            <Info label="Gordura corporal" value={typeof evolutionReport.body.latestBodyFatPct === 'number' ? `${evolutionReport.body.latestBodyFatPct}%` : '-'} />
            <Info label="Check-ins diários" value={`${evolutionReport.checkins.dailyCompleted}/${evolutionReport.checkins.dailyExpected}`} />
            <Info label="Check-ins quinzenais" value={`${evolutionReport.checkins.weeklyCompleted}`} />
          </div>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Observações</p>
            <div className="space-y-2">
              {evolutionReport.warnings && evolutionReport.warnings.length > 0 ? evolutionReport.warnings.map((warning) => (
                <p key={warning} className="text-sm text-text-secondary">{warning}</p>
              )) : (
                <p className="text-sm text-text-secondary">Sem limitações relevantes para este período.</p>
              )}
            </div>
          </div>
        </V2Card>

        <V2Card className="p-6">
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Treino, Dieta e Água</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Sessões concluídas" value={`${evolutionReport.training.completedSessions}`} />
            <Info label="Volume total" value={`${evolutionReport.training.totalTonnage.toLocaleString('pt-BR')} kg`} />
            <Info label="Último treino" value={formatDate(evolutionReport.training.lastWorkoutAt)} />
            <Info label="Dieta média" value={`${evolutionReport.diet.averageAdherencePct}%`} />
            <Info label="Dias de dieta" value={`${evolutionReport.diet.loggedDays}`} />
            <Info label="Água média" value={`${evolutionReport.hydration.averagePct}%`} />
          </div>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Highlights reais</p>
            <div className="space-y-3">
              {evolutionReport.training.bestHighlights.length > 0 ? evolutionReport.training.bestHighlights.map((highlight) => (
                <div key={`${highlight.exerciseName}-${highlight.metric}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold text-white">{highlight.exerciseName}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-text-muted">{highlight.metric}</p>
                  <p className="mt-2 text-sm text-accent-lime">{highlight.value}</p>
                </div>
              )) : (
                <p className="text-sm text-text-secondary">Ainda não há highlights suficientes de progressão neste período.</p>
              )}
            </div>
          </div>
        </V2Card>
      </div>

      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Evolução Corporal (Body Check-ins)</h3>
        {data.recentBodyCheckins.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.recentBodyCheckins.map(c => (
              <div key={c.id} className="p-4 bg-white/5 rounded-xl">
                <span className="text-xs font-bold text-white block mb-3">{formatDate(c.date)}</span>
                <Info label="Peso" value={typeof c.weightKg === 'number' ? `${c.weightKg} kg` : '-'} />
                <Info
                  label="Gordura Corporal"
                  value={bodyFatPct(c) !== null ? `${bodyFatPct(c)}%` : '-'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Nenhum registro de evolução corporal.</p>
        )}
      </V2Card>

      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Motivos de atenção</h3>
        <div className="space-y-2">
          {insightSummary.churnRisk.reasons.length > 0 ? insightSummary.churnRisk.reasons.map((reason) => (
            <p key={reason} className="text-sm text-white">{reason}</p>
          )) : (
            <p className="text-sm text-text-secondary">Sem alertas operacionais relevantes no momento.</p>
          )}
        </div>
      </V2Card>
    </div>
  )
}

function TabSubscription({ data, reload }: { data: NonNullable<ReturnType<typeof useAdminStudent360>['data']>, reload: () => void }) {
  const { user, subscription } = data
  const [role, setRole] = useState<User['role']>(user.role)
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status || 'pending')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingRole, setSavingRole] = useState(false)
  const { firebaseUser } = useAuth()
  const actor: AdminActor | null = firebaseUser?.uid
    ? { uid: firebaseUser.uid, email: firebaseUser.email || 'admin@expertclub.test' }
    : null

  async function saveRole() {
    if (!user.uid || !role || !actor) return
    if (user.uid === firebaseUser?.uid && role !== 'admin') {
      toastError('Por segurança, não é possível remover seu próprio acesso admin por esta tela.')
      return
    }
    setSavingRole(true)
    try {
      await adminUserService.updateRole(actor, user.uid, role)
      toastSuccess('Role atualizada.')
      await reload()
    } catch (e) {
      toastError('Erro ao atualizar role.')
    } finally {
      setSavingRole(false)
    }
  }

  async function saveStatus() {
    if (!user.uid || !status || !actor) return
    setSavingStatus(true)
    try {
      await adminUserService.updateSubscription(actor, user.uid, { status })
      toastSuccess('Status de assinatura atualizado.')
      await reload()
    } catch (e) {
      toastError('Erro ao alterar assinatura.')
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Assinatura Atual</h3>
        <div className="space-y-4 mb-6">
          <Info label="Status" value={statusPt(subscription?.status)} />
          <Info label="Plano" value={subscription?.planName || '-'} />
          <Info label="Preço" value={subscription?.price ? `R$ ${subscription.price}` : '-'} />
          <Info label="Renovação" value={formatDate(subscription?.currentPeriodEnd)} />
        </div>
        
        <Field label="Alterar Status">
          <select
            value={status}
            onChange={e => setStatus(e.target.value as SubscriptionStatus)}
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white mb-2"
          >
            <option value="active">Ativa</option>
            <option value="trialing">Em Teste</option>
            <option value="pending">Pendente</option>
            <option value="past_due">Em Atraso</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
          </select>
          <V2Button variant="secondary" onClick={saveStatus} disabled={savingStatus} className="w-full h-10">
            {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Status'}
          </V2Button>
        </Field>
      </V2Card>

      <V2Card className="p-6">
        <h3 className="text-xs font-black italic text-white uppercase tracking-widest mb-6">Configuração de Acesso (Role)</h3>
        <div className="space-y-4 mb-6">
          <Info label="Role Atual" value={rolePt(user.role)} />
        </div>
        
        <Field label="Alterar Role">
          <select
            value={role}
            onChange={e => setRole(e.target.value as User['role'])}
            className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white mb-2"
          >
            <option value="member">Aluno</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="affiliate">Afiliado</option>
          </select>
          <V2Button variant="secondary" onClick={saveRole} disabled={savingRole || role === user.role} className="w-full h-10">
            {savingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Role'}
          </V2Button>
        </Field>
        <div className="mt-6 border-t border-white/5 pt-6">
          <ConfirmButton
            variant="destructive"
            message="Desativar usuário logicamente? Ele perderá acesso ao sistema."
            onConfirm={() =>
              actor &&
              user.uid &&
              adminUserService.softDelete(actor, user.uid).then(() => {
                reload()
                toastSuccess('Usuário desativado.')
              })
            }
          >
            Desativar Usuário
          </ConfirmButton>
        </div>
      </V2Card>
    </div>
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
