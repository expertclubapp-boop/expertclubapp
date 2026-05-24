import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, Clock, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle, Send } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { influencerService } from '../../services/influencerService'
import { walletService } from '../../services/walletService'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  StatusBadge,
} from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import type { InfluencerAccount, InfluencerPayout, WalletBalance, WalletLedgerEntry } from '../../types/domain'

export function InfluencerWalletScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [account, setAccount] = useState<InfluencerAccount | null>(null)
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([])
  const [payouts, setPayouts] = useState<InfluencerPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const [acc, bal, entries, pays] = await Promise.all([
        influencerService.getAccount(firebaseUser.uid),
        walletService.getBalance(firebaseUser.uid),
        walletService.getLedger(firebaseUser.uid, 30),
        influencerService.listPayouts(firebaseUser.uid),
      ])
      setAccount(acc)
      setBalance(bal)
      setLedger(entries)
      setPayouts(pays)
    } catch (err) {
      console.error('Error loading wallet:', err)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  const handleRequestPayout = async () => {
    if (!firebaseUser || !account) return
    const amount = parseFloat(payoutAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', message: 'Valor inválido.' })
      return
    }
    if (amount < account.minPayoutAmount) {
      setFeedback({ type: 'error', message: `Valor mínimo para saque: R$${account.minPayoutAmount.toFixed(2)}` })
      return
    }
    setIsRequesting(true)
    setFeedback(null)
    try {
      await influencerService.requestPayout({ influencerId: firebaseUser.uid, amount })
      setFeedback({ type: 'success', message: `Solicitação de R$${amount.toFixed(2)} enviada. Prazo: 3 dias úteis.` })
      setPayoutAmount('')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar saque.'
      setFeedback({ type: 'error', message })
    } finally {
      setIsRequesting(false)
    }
  }

  const available = balance?.availableBalance ?? 0
  const pending = balance?.pendingBalance ?? 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-ink-900 text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/85 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate('/influencer/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-black italic tracking-widest text-emerald-400 uppercase">
            Carteira
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-6">
        {/* Balance hero */}
        <DashboardHero className="min-h-[200px]">
          <div className="relative z-10 flex flex-col gap-2">
            <FloatingPill tone="green" icon={<DollarSign className="h-3.5 w-3.5" />}>
              Saldo disponível para saque
            </FloatingPill>
            <h2 className="mt-4 font-display text-display-xl font-black text-text-primary leading-none">
              R${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
            {pending > 0 && (
              <p className="text-sm text-amber-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                R${pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aguardando liberação
              </p>
            )}
          </div>
        </DashboardHero>

        {/* Payout request */}
        {account && (
          <GlassCard className="rounded-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              Solicitar saque
            </h3>

            {feedback && (
              <div className={`flex items-center gap-3 rounded-lg p-3 border text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {feedback.type === 'success'
                  ? <CheckCircle className="h-4 w-4 shrink-0" />
                  : <AlertCircle className="h-4 w-4 shrink-0" />}
                {feedback.message}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-text-muted mb-1">
                  Valor (mín. R${account.minPayoutAmount.toFixed(2)})
                </label>
                <input
                  type="number"
                  min={account.minPayoutAmount}
                  max={available}
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`${account.minPayoutAmount.toFixed(2)}`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <Button
                variant="primary"
                className="self-end gap-2"
                onClick={handleRequestPayout}
                disabled={isRequesting || available < account.minPayoutAmount}
              >
                {isRequesting ? 'Enviando…' : 'Sacar'}
              </Button>
            </div>

            <p className="text-xs text-text-muted">
              Via {account.payoutMethod === 'pix' ? 'PIX' : account.payoutMethod === 'bank_transfer' ? 'TED/DOC' : 'Manual'}.
              {account.pixKey && ` Chave PIX: ${account.pixKey}`}
            </p>
          </GlassCard>
        )}

        {/* Payout history */}
        {payouts.length > 0 && (
          <div>
            <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
              Saques solicitados
            </h3>
            <div className="space-y-2">
              {payouts.map((p) => (
                <GlassCard key={p.id} className="rounded-card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      R${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <PayoutStatusBadge status={p.status} />
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Ledger */}
        <div>
          <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
            Extrato
          </h3>
          {ledger.length === 0 ? (
            <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
              <DollarSign className="h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-secondary">Sem movimentações ainda.</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => {
                const isCredit = entry.amount > 0
                const amount = Math.abs(entry.amount)
                return (
                  <GlassCard key={entry.id} className="rounded-card p-4 flex items-center gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCredit ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                      {isCredit
                        ? <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                        : <ArrowDownCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{entry.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`font-semibold text-sm ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}R${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
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
    status === 'paid'                              ? 'green'  :
    status === 'approved' || status === 'processing' ? 'sky'   :
    status === 'pending_review'                    ? 'yellow' :
    'red'
  return <StatusBadge tone={tone as 'green' | 'sky' | 'yellow' | 'red' | 'neutral'}>{label}</StatusBadge>
}
