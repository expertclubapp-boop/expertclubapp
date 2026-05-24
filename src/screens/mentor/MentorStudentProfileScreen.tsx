import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CalendarClock,
  RefreshCw,
  ClipboardList,
  User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { feedbackService } from '../../services/feedbackService'
import { toastError } from '../../components/ui/Toast'
import { V2Card, V2Badge } from '../../components/v2/ExpertClubV2Base'
import type { FeedbackSchedule, FeedbackRequest } from '../../types/feedback'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().slice(0, 10)
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10)
}

function isFuture(dateStr: string) {
  return dateStr > new Date().toISOString().slice(0, 10)
}

// ─── Agendamentos Tab ─────────────────────────────────────────────────────────

function AgendamentosTab({ studentId }: { studentId: string }) {
  const { firebaseUser } = useAuth()
  const [schedules, setSchedules] = useState<FeedbackSchedule[]>([])
  const [requests, setRequests] = useState<FeedbackRequest[]>([])
  const [loading, setLoading] = useState(true)

  // New schedule form
  const [showNewSchedule, setShowNewSchedule] = useState(false)
  const [schedForm, setSchedForm] = useState({ startDate: '', intervalDays: 15 })
  const [savingSched, setSavingSched] = useState(false)

  // One-off request form
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [newReqDate, setNewReqDate] = useState('')
  const [savingReq, setSavingReq] = useState(false)

  // Edit request date
  const [editingReqId, setEditingReqId] = useState<string | null>(null)
  const [editReqDate, setEditReqDate] = useState('')

  useEffect(() => {
    Promise.all([
      feedbackService.listSchedulesForStudent(studentId),
      feedbackService.listRequestsForStudent(studentId),
    ]).then(([scheds, reqs]) => {
      setSchedules(scheds)
      setRequests(reqs)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [studentId])

  async function handleCreateSchedule() {
    if (!schedForm.startDate) return
    setSavingSched(true)
    try {
      await feedbackService.createSchedule(studentId, {
        type: 'recurring',
        intervalDays: schedForm.intervalDays,
        startDate: schedForm.startDate,
        createdBy: firebaseUser?.uid ?? 'mentor',
      })
      const [scheds, reqs] = await Promise.all([
        feedbackService.listSchedulesForStudent(studentId),
        feedbackService.listRequestsForStudent(studentId),
      ])
      setSchedules(scheds)
      setRequests(reqs)
      setShowNewSchedule(false)
      setSchedForm({ startDate: '', intervalDays: 15 })
    } catch {
      toastError('Erro ao criar recorrência.')
    } finally {
      setSavingSched(false)
    }
  }

  async function handleDeleteSchedule(schedId: string) {
    if (!confirm('Excluir esta recorrência e todos os feedbacks futuros associados?')) return
    try {
      await feedbackService.deleteSchedule(studentId, schedId)
      setSchedules((s) => s.filter((x) => x.id !== schedId))
      setRequests((r) => r.filter((x) => x.scheduleId !== schedId || x.status === 'submitted'))
    } catch {
      toastError('Erro ao excluir recorrência.')
    }
  }

  async function handleAddOneOff() {
    if (!newReqDate) return
    setSavingReq(true)
    try {
      const id = await feedbackService.addOneTimeRequest(studentId, newReqDate, firebaseUser?.uid ?? 'mentor')
      const now = new Date().toISOString()
      const newReq: FeedbackRequest = { id, uid: studentId, dueDate: newReqDate, status: 'pending', createdAt: now }
      setRequests((r) => [...r, newReq].sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
      setShowNewRequest(false)
      setNewReqDate('')
    } catch {
      toastError('Erro ao criar feedback pontual.')
    } finally {
      setSavingReq(false)
    }
  }

  async function handleDeleteRequest(reqId: string) {
    try {
      await feedbackService.deleteRequest(studentId, reqId)
      setRequests((r) => r.filter((x) => x.id !== reqId))
    } catch {
      toastError('Erro ao excluir feedback.')
    }
  }

  async function handleUpdateReqDate(reqId: string) {
    if (!editReqDate) return
    try {
      await feedbackService.updateRequestDate(studentId, reqId, editReqDate)
      setRequests((r) => r.map((x) => x.id === reqId ? { ...x, dueDate: editReqDate } : x).sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
      setEditingReqId(null)
    } catch {
      toastError('Erro ao reagendar.')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  const futureRequests = requests.filter((r) => r.status === 'pending' && isFuture(r.dueDate))
  const pendingToday = requests.filter((r) => r.status === 'pending' && (isPast(r.dueDate) || isToday(r.dueDate)))
  const submitted = requests.filter((r) => r.status === 'submitted')

  return (
    <div className="space-y-8">
      {/* Active schedules */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Recorrências ativas
          </h2>
          {!showNewSchedule && (
            <button
              onClick={() => setShowNewSchedule(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ec-violet hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nova recorrência
            </button>
          )}
        </div>

        {showNewSchedule && (
          <V2Card className="p-4 mb-4 space-y-4 border-ec-violet/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-ec-violet">Nova recorrência</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Data de início</label>
                <input
                  type="date"
                  value={schedForm.startDate}
                  onChange={(e) => setSchedForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-ec-violet outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Intervalo (dias)</label>
                <select
                  value={schedForm.intervalDays}
                  onChange={(e) => setSchedForm((f) => ({ ...f, intervalDays: Number(e.target.value) }))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-ec-violet outline-none"
                >
                  {[7, 14, 15, 21, 30].map((d) => (
                    <option key={d} value={d}>A cada {d} dias</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateSchedule}
                disabled={!schedForm.startDate || savingSched}
                className="px-4 py-2 rounded-xl bg-ec-violet text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                {savingSched ? 'Criando...' : 'Criar'}
              </button>
              <button onClick={() => setShowNewSchedule(false)} className="px-4 py-2 rounded-xl bg-white/5 text-text-muted text-xs font-bold hover:text-white">
                Cancelar
              </button>
            </div>
          </V2Card>
        )}

        {schedules.filter((s) => s.status === 'active').length === 0 && !showNewSchedule ? (
          <p className="text-sm text-text-muted border border-dashed border-white/10 rounded-xl p-4 text-center">Nenhuma recorrência ativa.</p>
        ) : (
          <div className="space-y-2">
            {schedules.filter((s) => s.status === 'active').map((sched) => (
              <div key={sched.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <div>
                  <p className="text-xs font-black text-white">A cada {sched.intervalDays} dias</p>
                  <p className="text-[10px] text-text-muted">Iniciado em {formatDate(sched.startDate)}</p>
                </div>
                <button onClick={() => handleDeleteSchedule(sched.id)} className="p-1.5 text-text-muted hover:text-accent-red">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending / overdue */}
      {pendingToday.length > 0 && (
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
            <CalendarClock className="w-3.5 h-3.5" /> Aguardando resposta ({pendingToday.length})
          </h2>
          <div className="space-y-2">
            {pendingToday.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <span className="text-xs font-black text-amber-300">{formatDate(req.dueDate)}</span>
                <V2Badge tone="warning">Pendente</V2Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Future requests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Próximos agendados ({futureRequests.length})
          </h2>
          {!showNewRequest && (
            <button
              onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> Pontual
            </button>
          )}
        </div>

        {showNewRequest && (
          <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <input
              type="date"
              value={newReqDate}
              onChange={(e) => setNewReqDate(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-ec-violet outline-none"
            />
            <button onClick={handleAddOneOff} disabled={!newReqDate || savingReq} className="p-1.5 rounded-lg bg-ec-violet text-white disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setShowNewRequest(false)} className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {futureRequests.length === 0 ? (
          <p className="text-sm text-text-muted border border-dashed border-white/10 rounded-xl p-4 text-center">Nenhum feedback agendado.</p>
        ) : (
          <div className="space-y-2">
            {futureRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8 group">
                {editingReqId === req.id ? (
                  <>
                    <input
                      type="date"
                      value={editReqDate}
                      onChange={(e) => setEditReqDate(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-ec-violet outline-none mr-2"
                    />
                    <button onClick={() => handleUpdateReqDate(req.id)} className="p-1.5 rounded-lg bg-ec-violet text-white mr-1">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingReqId(null)} className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-white">{formatDate(req.dueDate)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingReqId(req.id); setEditReqDate(req.dueDate) }} className="p-1.5 text-text-muted hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteRequest(req.id)} className="p-1.5 text-text-muted hover:text-accent-red">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submitted history */}
      {submitted.length > 0 && (
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
            Respondidos ({submitted.length})
          </h2>
          <div className="space-y-2">
            {submitted.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs font-bold text-text-muted">{formatDate(req.dueDate)}</span>
                <V2Badge tone="success">Respondido</V2Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'agendamentos' | 'resumo'

export function MentorStudentProfileScreen() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('agendamentos')

  if (!studentId) return null

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-ec-violet">PERFIL DO ALUNO</p>
          <h1 className="text-2xl font-black uppercase italic text-white">Acompanhamento</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/8 pb-4">
        <button
          onClick={() => setTab('agendamentos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            tab === 'agendamentos' ? 'bg-ec-violet text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Agendamentos
        </button>
        <button
          onClick={() => setTab('resumo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            tab === 'resumo' ? 'bg-ec-violet text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Resumo
        </button>
      </div>

      {tab === 'agendamentos' && <AgendamentosTab studentId={studentId} />}

      {tab === 'resumo' && (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <ClipboardList className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">Resumo completo do aluno em breve.</p>
          <p className="text-xs text-text-muted/60 mt-1">Anamnese, fotos e histórico de prescrições.</p>
        </div>
      )}
    </div>
  )
}
