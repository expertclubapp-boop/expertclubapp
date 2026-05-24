import { useState, useEffect, useCallback } from 'react'
import { DollarSign, CheckCircle, XCircle, Clock, Search, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { influencerService } from '../../services/influencerService'
import { Button } from '../../components/ui/Button'
import { PageShell, GlassCard, StatusBadge } from '../../components/ui/Premium'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { InfluencerPayout } from '../../types/domain'

type StatusFilter = 'all' | InfluencerPayout['status']

export function AdminPayoutsV2Screen() {
  const { firebaseUser } = useAuth()
  const [payouts, setPayouts] = useState<InfluencerPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_review')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter
      setPayouts(await influencerService.listPayouts(undefined, status))
    } catch {
      setPayouts([])
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const filtered = payouts.filter((p) =>
    p.influencerId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApprove = async (payoutId: string) => {
    if (!firebaseUser) return
    setActionId(payoutId)
    try {
      await influencerService.approvePayoutRequest(payoutId, firebaseUser.uid)
      toastSuccess('Saque aprovado.')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao aprovar.')
    } finally {
      setActionId(null)
    }
  }

  const handleMarkPaid = async (payoutId: string) => {
    if (!firebaseUser) return
    setActionId(payoutId)
    try {
      await influencerService.markPayoutPaid(payoutId, firebaseUser.uid, {})
      toastSuccess('Saque marcado como pago.')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao marcar como pago.')
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async () => {
    if (!firebaseUser || !rejectId || !rejectReason.trim()) {
      toastError('Informe o motivo da rejeição.')
      return
    }
    setActionId(rejectId)
    try {
      await influencerService.rejectPayoutRequest(rejectId, firebaseUser.uid, rejectReason.trim())
      toastSuccess('Saque rejeitado. Saldo devolvido ao influenciador.')
      setRejectId(null)
      setRejectReason('')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao rejeitar.')
    } finally {
      setActionId(null)
    }
  }

  const pendingTotal = payouts
    .filter((p) => p.status === 'pending_review')
    .reduce((s, p) => s + p.amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-black text-text-primary">Saques de Influenciadores</h1>
        {pendingTotal > 0 && (
          <p className="text-sm text-amber-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            R${pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aguardando revisão
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending_review', 'approved', 'paid', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
              statusFilter === s
                ? 'bg-volt-600 text-white'
                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            {s === 'all' ? 'Todos' :
             s === 'pending_review' ? 'Em análise' :
             s === 'approved' ? 'Aprovados' :
             s === 'paid' ? 'Pagos' : 'Rejeitados'}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por ID do influenciador…"
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
        />
      </div>

      {/* Reject modal */}
      {rejectId && (
        <GlassCard className="rounded-card p-5 space-y-3 border border-red-500/30">
          <h3 className="text-sm font-semibold text-red-300">Rejeitar saque</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da rejeição (obrigatório)…"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <Button variant="primary" className="gap-2 bg-red-600 hover:bg-red-500" onClick={handleReject} disabled={!!actionId}>
              {actionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirmar rejeição
            </Button>
            <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason('') }}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      {filtered.length === 0 ? (
        <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
          <DollarSign className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Nenhum saque encontrado.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <GlassCard key={p.id} className="rounded-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm font-black text-text-primary">
                    R${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <PayoutStatusBadge status={p.status} />
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {p.influencerId} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  {p.pixKey && ` · PIX: ${p.pixKey}`}
                </p>
                {p.rejectionReason && (
                  <p className="text-xs text-red-400 mt-1">Motivo: {p.rejectionReason}</p>
                )}
              </div>

              <div className="flex gap-2">
                {p.status === 'pending_review' && (
                  <>
                    <Button
                      variant="primary"
                      className="text-xs px-3 h-8 gap-1.5"
                      onClick={() => handleApprove(p.id)}
                      disabled={actionId === p.id}
                    >
                      {actionId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Aprovar
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs px-3 h-8 gap-1.5 text-red-400"
                      onClick={() => setRejectId(p.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {p.status === 'approved' && (
                  <Button
                    variant="primary"
                    className="text-xs px-3 h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleMarkPaid(p.id)}
                    disabled={actionId === p.id}
                  >
                    {actionId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Marcar como pago
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function PayoutStatusBadge({ status }: { status: InfluencerPayout['status'] }) {
  const label =
    status === 'pending_review' ? 'Em análise' :
    status === 'approved'       ? 'Aprovado'   :
    status === 'processing'     ? 'Processando':
    status === 'paid'           ? 'Pago'       :
    status === 'rejected'       ? 'Rejeitado'  :
    'Cancelado'
  const tone =
    status === 'paid'                                ? 'green'  :
    (status === 'approved' || status === 'processing') ? 'sky'   :
    status === 'pending_review'                      ? 'yellow' :
    'red'
  return <StatusBadge tone={tone as 'green' | 'sky' | 'yellow' | 'red'}>{label}</StatusBadge>
}
