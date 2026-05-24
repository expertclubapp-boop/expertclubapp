import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  Wallet,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  TrendingUp,
  Ban,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { useAuth } from '../../contexts/AuthContext'
import { economyConfigService, type EconomyConfig } from '../../services/economyConfigService'
import { walletService } from '../../services/walletService'
import { influencerService } from '../../services/influencerService'
import { Button } from '../../components/ui/Button'
import { GlassCard, StatusBadge, PageShell } from '../../components/ui/Premium'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { FraudSignal, InfluencerPayout, WalletBalance } from '../../types/domain'

type Tab = 'controls' | 'fraud' | 'wallets' | 'payouts'

// ── Controls Tab ─────────────────────────────────────────────────────────────

function ControlsTab({ config, onSave }: { config: EconomyConfig; onSave: () => void }) {
  const { firebaseUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(config)

  useEffect(() => { setDraft(config) }, [config])

  const toggleFlag = async (key: keyof Pick<EconomyConfig, 'economyEnabled' | 'storeEnabled' | 'referralsEnabled' | 'payoutsEnabled'>) => {
    if (!firebaseUser) return
    setSaving(true)
    try {
      await economyConfigService.updateConfig({ [key]: !draft[key] }, firebaseUser.uid)
      toastSuccess(draft[key] ? `"${key}" desativado.` : `"${key}" ativado.`)
      onSave()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao atualizar config.')
    } finally {
      setSaving(false)
    }
  }

  const handleFreezeAll = async () => {
    if (!firebaseUser) return
    if (!confirm('CONGELAR TODA A ECONOMIA? Todos os saques, resgates e indicações serão bloqueados imediatamente.')) return
    setSaving(true)
    try {
      await economyConfigService.updateConfig({
        economyEnabled: false,
        maintenanceMessage: 'Sistema de economia em manutenção. Voltamos em breve.',
      }, firebaseUser.uid)
      toastSuccess('Economia congelada. Atualize a página para confirmar.')
      onSave()
    } catch {
      toastError('Erro ao congelar economia.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    if (!firebaseUser) return
    setSaving(true)
    try {
      await economyConfigService.updateConfig({
        economyEnabled: true,
        storeEnabled: true,
        referralsEnabled: true,
        payoutsEnabled: true,
        maintenanceMessage: '',
      }, firebaseUser.uid)
      toastSuccess('Todos os switches restaurados.')
      onSave()
    } catch {
      toastError('Erro ao restaurar.')
    } finally {
      setSaving(false)
    }
  }

  const saveNumeric = async (key: keyof Pick<EconomyConfig, 'maxSinglePayoutBrl' | 'maxDailyPayoutsPerInfluencer'>, value: number) => {
    if (!firebaseUser) return
    setSaving(true)
    try {
      await economyConfigService.updateConfig({ [key]: value }, firebaseUser.uid)
      toastSuccess('Limite atualizado.')
    } catch {
      toastError('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const FlagToggle = ({
    id,
    label,
    description,
  }: {
    id: keyof Pick<EconomyConfig, 'economyEnabled' | 'storeEnabled' | 'referralsEnabled' | 'payoutsEnabled'>
    label: string
    description: string
  }) => {
    const on = draft[id]
    return (
      <GlassCard className={`rounded-card p-4 flex items-center justify-between gap-4 ${!on ? 'border-accent-red/30' : 'border-white/5'}`}>
        <div>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
        <button
          onClick={() => toggleFlag(id)}
          disabled={saving}
          className="shrink-0 transition-opacity disabled:opacity-50"
        >
          {on
            ? <ToggleRight className="w-8 h-8 text-accent-lime" />
            : <ToggleLeft className="w-8 h-8 text-accent-red" />
          }
        </button>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Emergency row */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          className="gap-2 bg-accent-red hover:bg-red-600 text-white"
          onClick={handleFreezeAll}
          disabled={saving}
        >
          <Ban className="h-4 w-4" />
          CONGELAR TUDO
        </Button>
        <Button variant="ghost" className="gap-2" onClick={handleRestore} disabled={saving}>
          <RefreshCw className="h-4 w-4" />
          Restaurar tudo
        </Button>
        {saving && <Loader2 className="h-5 w-5 animate-spin text-text-muted self-center" />}
      </div>

      {/* Feature flags */}
      <div className="space-y-2">
        <FlagToggle id="economyEnabled" label="Sistema Econômico (Master)" description="Desativar bloqueia TUDO: loja, indicações e saques." />
        <FlagToggle id="storeEnabled" label="Loja de Créditos" description="Alunos podem resgatar itens com créditos." />
        <FlagToggle id="referralsEnabled" label="Programa de Indicação" description="Atribuição de comissões a estudantes e influencers." />
        <FlagToggle id="payoutsEnabled" label="Saques de Influencers" description="Influencers podem solicitar pagamentos em BRL." />
      </div>

      {/* Numeric limits */}
      <GlassCard className="rounded-card p-5 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Limites de segurança</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">Valor máximo por saque (R$)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="100"
                value={draft.maxSinglePayoutBrl}
                onChange={(e) => setDraft((p) => ({ ...p, maxSinglePayoutBrl: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
              <Button variant="ghost" className="px-3 h-9 text-xs shrink-0" onClick={() => saveNumeric('maxSinglePayoutBrl', draft.maxSinglePayoutBrl)} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Saques por dia por influencer</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={draft.maxDailyPayoutsPerInfluencer}
                onChange={(e) => setDraft((p) => ({ ...p, maxDailyPayoutsPerInfluencer: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
              <Button variant="ghost" className="px-3 h-9 text-xs shrink-0" onClick={() => saveNumeric('maxDailyPayoutsPerInfluencer', draft.maxDailyPayoutsPerInfluencer)} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Mensagem de manutenção (exibida aos usuários quando desativado)</label>
          <div className="flex gap-2">
            <input
              value={draft.maintenanceMessage}
              onChange={(e) => setDraft((p) => ({ ...p, maintenanceMessage: e.target.value }))}
              placeholder="Ex: Em manutenção até 18h. Voltamos em breve!"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none"
            />
            <Button
              variant="ghost"
              className="px-3 h-9 text-xs shrink-0"
              onClick={async () => {
                if (!firebaseUser) return
                await economyConfigService.updateConfig({ maintenanceMessage: draft.maintenanceMessage }, firebaseUser.uid)
                toastSuccess('Mensagem salva.')
              }}
              disabled={saving}
            >
              Salvar
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Last updated */}
      <p className="text-xs text-text-muted">
        Última atualização: {new Date(config.updatedAt).toLocaleString('pt-BR')} · por {config.updatedBy}
      </p>
    </div>
  )
}

// ── Fraud Tab ────────────────────────────────────────────────────────────────

interface FraudSignalDoc extends FraudSignal {
  id: string
}

function FraudTab() {
  const [signals, setSignals] = useState<FraudSignalDoc[]>([])
  const [loading, setLoading] = useState(true)
  const { firebaseUser } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, COLLECTIONS.FRAUD_SIGNALS),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snap = await getDocs(q)
      setSignals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FraudSignalDoc)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markReviewed = async (id: string) => {
    if (!firebaseUser) return
    await updateDoc(doc(db, COLLECTIONS.FRAUD_SIGNALS, id), {
      reviewedAt: new Date().toISOString(),
      reviewedBy: firebaseUser.uid,
      status: 'reviewed',
    })
    toastSuccess('Sinal marcado como revisado.')
    load()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-text-muted" /></div>

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{signals.length} sinais · {signals.filter((s) => !(s as any).reviewedAt).length} pendentes de revisão</p>
        <Button variant="ghost" className="gap-1.5 text-xs h-8" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>
      {signals.length === 0 ? (
        <GlassCard className="rounded-card p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-accent-lime mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Nenhum sinal de fraude registrado.</p>
        </GlassCard>
      ) : signals.map((s) => {
        const reviewed = !!(s as any).reviewedAt
        return (
          <GlassCard key={s.id} className={`rounded-card p-4 flex items-start gap-4 flex-wrap ${!reviewed ? 'border-accent-red/30' : 'border-white/5 opacity-60'}`}>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldAlert className={`h-4 w-4 ${!reviewed ? 'text-accent-red' : 'text-text-muted'}`} />
                <span className="text-sm font-semibold text-text-primary">{(s as any).flagType ?? (s as any).flags?.join(', ') ?? 'Sinal desconhecido'}</span>
                <StatusBadge tone={!reviewed ? 'red' : 'neutral'}>{!reviewed ? 'Pendente' : 'Revisado'}</StatusBadge>
                {(s as any).riskScore !== undefined && (
                  <span className={`text-xs font-bold ${(s as any).riskScore >= 80 ? 'text-accent-red' : 'text-amber-400'}`}>
                    Risco: {(s as any).riskScore}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                UID: {(s as any).userId ?? (s as any).referrerId ?? '—'} ·{' '}
                {new Date((s as any).createdAt).toLocaleString('pt-BR')}
              </p>
              {(s as any).context && (
                <p className="text-xs text-text-muted mt-0.5 truncate max-w-sm">{JSON.stringify((s as any).context)}</p>
              )}
            </div>
            {!reviewed && (
              <Button variant="ghost" className="text-xs h-8 px-3" onClick={() => markReviewed(s.id)}>
                Marcar revisado
              </Button>
            )}
          </GlassCard>
        )
      })}
    </div>
  )
}

// ── Wallets Tab (manual correction) ─────────────────────────────────────────

function WalletsTab() {
  const { firebaseUser } = useAuth()
  const [uid, setUid] = useState('')
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [currency, setCurrency] = useState<'CREDITS' | 'BRL'>('CREDITS')
  const [applying, setApplying] = useState(false)

  const lookupBalance = async () => {
    if (!uid.trim()) return
    setLoadingBalance(true)
    try {
      const b = await walletService.getBalance(uid.trim())
      setBalance(b)
      if (!b) toastError('Nenhuma carteira encontrada para este UID.')
    } catch {
      toastError('Erro ao buscar saldo.')
    } finally {
      setLoadingBalance(false)
    }
  }

  const applyAdjustment = async (type: 'credit' | 'debit') => {
    if (!firebaseUser || !uid.trim() || !amount || !reason.trim()) {
      toastError('Preencha UID, valor e motivo.')
      return
    }
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) { toastError('Valor inválido.'); return }
    if (!confirm(`${type === 'credit' ? 'CREDITAR' : 'DEBITAR'} ${currency} ${num} na carteira de ${uid}?\nMotivo: ${reason}`)) return

    setApplying(true)
    try {
      if (type === 'credit') {
        await walletService.adminCredit({
          userId: uid.trim(),
          accountType: 'student',
          currency,
          amount: num,
          reason,
          adminUid: firebaseUser.uid,
        })
        toastSuccess(`${num} ${currency} creditados com sucesso.`)
      } else {
        await walletService.adminDebit({
          userId: uid.trim(),
          accountType: 'student',
          currency,
          amount: num,
          reason,
          adminUid: firebaseUser.uid,
        })
        toastSuccess(`${num} ${currency} debitados com sucesso.`)
      }
      setAmount('')
      setReason('')
      await lookupBalance()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao aplicar ajuste.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="rounded-card p-5 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Buscar carteira por UID</p>
        <div className="flex gap-2">
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Firebase UID do usuário"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none"
          />
          <Button variant="ghost" className="px-3 h-9 text-xs shrink-0 gap-1.5" onClick={lookupBalance} disabled={loadingBalance}>
            {loadingBalance ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Buscar
          </Button>
        </div>

        {balance && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'Disponível', value: balance.availableBalance },
              { label: 'Pendente', value: balance.pendingBalance },
              { label: 'Ganho Total', value: balance.lifetimeEarned },
              { label: 'Gasto Total', value: balance.lifetimeSpent },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-text-muted mb-1">{label}</p>
                <p className="text-base font-bold text-white">{value.toFixed(balance.currency === 'BRL' ? 2 : 0)} {balance.currency}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {uid && (
        <GlassCard className="rounded-card p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">Correção manual — use com extremo cuidado</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Moeda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'CREDITS' | 'BRL')}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="CREDITS">Créditos (estudante)</option>
                <option value="BRL">BRL (influencer)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Valor</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Motivo (fica registrado no ledger)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Correção por erro técnico — ticket #1234"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="gap-1.5 bg-accent-lime/80 hover:bg-accent-lime text-ink-900"
              onClick={() => applyAdjustment('credit')}
              disabled={applying}
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
              Creditar
            </Button>
            <Button
              variant="ghost"
              className="gap-1.5 text-accent-red hover:bg-accent-red/10"
              onClick={() => applyAdjustment('debit')}
              disabled={applying}
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownCircle className="h-4 w-4" />}
              Debitar
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ── Payouts Monitoring Tab ────────────────────────────────────────────────────

function PayoutsTab() {
  const [payouts, setPayouts] = useState<InfluencerPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBrl, setTotalBrl] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await influencerService.listPayouts()
      setPayouts(all)
      const paid = all.filter((p) => p.status === 'paid')
      setTotalBrl(paid.reduce((s, p) => s + p.amount, 0))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Flag suspicious: single payout > R$2000 OR same influencer > 2 payouts in last 24h
  const now = Date.now()
  const suspicious = payouts.filter((p) => {
    if (p.amount > 2000) return true
    const recent = payouts.filter((q) => q.influencerId === p.influencerId && now - new Date(q.createdAt).getTime() < 86400000)
    return recent.length > 2
  })

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-text-muted" /></div>

  const statusTone = (s: InfluencerPayout['status']) =>
    s === 'paid' ? 'green' : s === 'approved' ? 'sky' : s === 'pending_review' ? 'yellow' : s === 'rejected' ? 'red' : 'neutral'

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total pago (all-time)', value: `R$${totalBrl.toFixed(2)}`, icon: TrendingUp },
          { label: 'Pendentes', value: payouts.filter((p) => p.status === 'pending_review').length, icon: Clock },
          { label: 'Aprovados', value: payouts.filter((p) => p.status === 'approved').length, icon: CheckCircle2 },
          { label: 'Suspeitos', value: suspicious.length, icon: AlertTriangle, alert: suspicious.length > 0 },
        ].map(({ label, value, icon: Icon, alert }) => (
          <GlassCard key={label} className={`rounded-card p-4 ${alert ? 'border-amber-400/40' : 'border-white/5'}`}>
            <Icon className={`h-4 w-4 mb-2 ${alert ? 'text-amber-400' : 'text-text-muted'}`} />
            <p className={`text-lg font-bold ${alert ? 'text-amber-400' : 'text-white'}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Suspicious payouts banner */}
      {suspicious.length > 0 && (
        <GlassCard className="rounded-card p-4 border-amber-400/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {suspicious.length} saque(s) suspeito(s) detectado(s)
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Critérios: valor {'>'} R$2.000 ou 3+ saques do mesmo influencer em 24h. Revise antes de aprovar.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Payout list */}
      <div className="space-y-2">
        {payouts.slice(0, 50).map((p) => {
          const isSuspect = suspicious.some((s) => s.influencerId === p.influencerId && s.createdAt === p.createdAt)
          return (
            <GlassCard
              key={p.id}
              className={`rounded-card p-4 flex items-center gap-4 flex-wrap ${isSuspect ? 'border-amber-400/30' : 'border-white/5'}`}
            >
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  {isSuspect && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                  <span className="text-sm font-semibold text-text-primary">
                    R$ {p.amount.toFixed(2)}
                  </span>
                  <StatusBadge tone={statusTone(p.status)}>{p.status.replace('_', ' ')}</StatusBadge>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {p.influencerId} · PIX: {p.pixKey ?? '—'} · {new Date(p.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </GlassCard>
          )
        })}
        {payouts.length === 0 && (
          <GlassCard className="rounded-card p-8 text-center">
            <XCircle className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Nenhum saque registrado.</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function AdminEconomyControlScreen() {
  const [tab, setTab] = useState<Tab>('controls')
  const [config, setConfig] = useState<EconomyConfig | null>(null)

  useEffect(() => {
    return economyConfigService.subscribe(setConfig)
  }, [])

  const tabs: { id: Tab; label: string; icon: typeof Zap; alert?: boolean }[] = [
    { id: 'controls', label: 'Controles', icon: Zap, alert: config ? !config.economyEnabled : false },
    { id: 'fraud', label: 'Fraude', icon: ShieldAlert },
    { id: 'wallets', label: 'Carteiras', icon: Wallet },
    { id: 'payouts', label: 'Saques', icon: TrendingUp },
  ]

  return (
    <PageShell className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-black text-text-primary">Controle da Economia</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Kill switches · Correções manuais · Anti-fraude · Monitoramento de saques
        </p>
        {config && !config.economyEnabled && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-red/15 px-4 py-1.5 text-sm font-bold text-accent-red">
            <Ban className="h-4 w-4" />
            ECONOMIA CONGELADA
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id, label, icon: Icon, alert }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === id ? 'bg-volt-600 text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {alert && <span className="ml-1 h-2 w-2 rounded-full bg-accent-red" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!config ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          {tab === 'controls' && (
            <ControlsTab
              config={config}
              onSave={() => economyConfigService.getConfig().then(setConfig)}
            />
          )}
          {tab === 'fraud' && <FraudTab />}
          {tab === 'wallets' && <WalletsTab />}
          {tab === 'payouts' && <PayoutsTab />}
        </>
      )}
    </PageShell>
  )
}
