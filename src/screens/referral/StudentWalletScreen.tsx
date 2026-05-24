import { useState, useEffect, useCallback } from 'react'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, TrendingUp, Gift, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { walletService } from '../../services/walletService'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  PageShell,
  SectionHeader,
  StatusBadge,
} from '../../components/ui/Premium'
import { ProgressBar } from '../../components/ui/ProgressBar'
import type { WalletBalance, WalletLedgerEntry, WalletEntryType } from '../../types/domain'

export function StudentWalletScreen() {
  const { firebaseUser } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const [bal, entries] = await Promise.all([
        walletService.getBalance(firebaseUser.uid),
        walletService.getLedger(firebaseUser.uid, 30),
      ])
      setBalance(bal)
      setLedger(entries)
    } catch (err) {
      console.error('Error loading wallet:', err)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  const available = balance?.availableBalance ?? 0
  const pending = balance?.pendingBalance ?? 0
  const lifetimeEarned = balance?.lifetimeEarned ?? 0
  const lifetimeSpent = balance?.lifetimeSpent ?? 0
  const spendProgress = lifetimeEarned > 0 ? (lifetimeSpent / lifetimeEarned) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-volt-600/30 border-t-volt-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell className="space-y-6">
      <SectionHeader
        eyebrow="Carteira"
        title="Seus créditos"
        description="Créditos acumulados por indicações. Use na loja para trocar por benefícios."
        tone="violet"
        icon={<Wallet className="h-4 w-4" />}
      />

      {/* Hero */}
      <DashboardHero className="min-h-[240px]">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <FloatingPill tone="violet" icon={<Wallet className="h-3.5 w-3.5" />}>
              Saldo disponível
            </FloatingPill>
            <h2 className="mt-4 font-display text-display-xl font-black text-text-primary leading-none">
              {available.toLocaleString('pt-BR')}
            </h2>
            <p className="text-body-sm text-text-secondary">créditos</p>
          </div>

          {pending > 0 && (
            <GlassCard className="rounded-card p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">{pending.toLocaleString('pt-BR')} em processamento</p>
                <p className="text-xs text-text-muted">Liberados após período de hold</p>
              </div>
            </GlassCard>
          )}
        </div>
      </DashboardHero>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="rounded-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <ArrowUpCircle className="h-4 w-4" />
            <span className="text-xs text-text-muted uppercase tracking-wide">Total ganho</span>
          </div>
          <span className="font-display text-display-sm font-black text-text-primary">
            {lifetimeEarned.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-text-muted">créditos</span>
        </GlassCard>
        <GlassCard className="rounded-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-hot">
            <ArrowDownCircle className="h-4 w-4" />
            <span className="text-xs text-text-muted uppercase tracking-wide">Total gasto</span>
          </div>
          <span className="font-display text-display-sm font-black text-text-primary">
            {lifetimeSpent.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-text-muted">créditos</span>
        </GlassCard>
      </div>

      {lifetimeEarned > 0 && (
        <GlassCard className="rounded-card p-4 space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Créditos utilizados</span>
            <span>{Math.round(spendProgress)}%</span>
          </div>
          <ProgressBar value={spendProgress} color="violet" height={8} />
        </GlassCard>
      )}

      {/* Ledger */}
      <div>
        <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
          Extrato
        </h3>

        {ledger.length === 0 ? (
          <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
            <TrendingUp className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Nenhuma movimentação ainda. Comece indicando amigos!
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <LedgerRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function LedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  const isCredit = entry.amount > 0
  const amount = Math.abs(entry.amount)

  return (
    <GlassCard className="rounded-card p-4 flex items-center gap-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCredit ? 'bg-emerald-500/15' : 'bg-hot/15'}`}>
        {entryIcon(entry.entryType, isCredit)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{entry.description}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-semibold text-sm ${isCredit ? 'text-emerald-400' : 'text-hot'}`}>
          {isCredit ? '+' : '-'}{amount.toLocaleString('pt-BR')}
        </span>
        <LedgerStatusPill status={entry.status} />
      </div>
    </GlassCard>
  )
}

function entryIcon(type: WalletEntryType, isCredit: boolean) {
  const cls = `h-4 w-4 ${isCredit ? 'text-emerald-400' : 'text-hot'}`
  if (type.startsWith('SPEND') || type.startsWith('PAYOUT')) return <ShoppingBag className={cls} />
  if (type.startsWith('EARN')) return <Gift className={cls} />
  if (isCredit) return <ArrowUpCircle className={cls} />
  return <ArrowDownCircle className={cls} />
}

function LedgerStatusPill({ status }: { status: WalletLedgerEntry['status'] }) {
  const map = {
    PENDING:   { label: 'Pendente',   tone: 'yellow'  as const },
    CONFIRMED: { label: 'Confirmado', tone: 'green'   as const },
    REVERSED:  { label: 'Revertido',  tone: 'red'     as const },
    EXPIRED:   { label: 'Expirado',   tone: 'neutral' as const },
  }
  const { label, tone } = map[status] ?? { label: status, tone: 'neutral' as const }
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
