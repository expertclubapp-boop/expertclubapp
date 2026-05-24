import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, DollarSign, Clock, Copy, Share2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { influencerService } from '../../services/influencerService'
import { referralService } from '../../services/referralService'
import { walletService } from '../../services/walletService'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  PageShell,
  SectionHeader,
  StatusBadge,
} from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import type { InfluencerAccount, Referral, WalletBalance } from '../../types/domain'

export function InfluencerDashboardScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [account, setAccount] = useState<InfluencerAccount | null>(null)
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const [acc, bal, refs] = await Promise.all([
        influencerService.getAccount(firebaseUser.uid),
        walletService.getBalance(firebaseUser.uid),
        referralService.getReferralsByReferrer(firebaseUser.uid),
      ])
      setAccount(acc)
      setBalance(bal)
      setReferrals(refs.slice(0, 10))
    } catch (err) {
      console.error('Error loading influencer dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  const referralLink = account
    ? `${window.location.origin}/?ref=${account.uid}`
    : ''

  const handleCopy = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    if (!referralLink) return
    if (navigator.share) {
      await navigator.share({ title: 'Expert Club', url: referralLink }).catch(() => {})
    } else {
      await handleCopy()
    }
  }

  const available = balance?.availableBalance ?? 0
  const pending = balance?.pendingBalance ?? 0
  const lifetimeEarned = balance?.lifetimeEarned ?? 0
  const activeRefs = referrals.filter((r) => r.status === 'active').length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <p className="text-white text-lg font-semibold">Conta de influenciador não encontrada</p>
        <p className="text-text-secondary text-sm max-w-xs">
          Entre em contato com a equipe Expert Club para ativar sua conta de influenciador.
        </p>
        <Button variant="primary" onClick={() => navigate('/app/today')}>Voltar ao início</Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-ink-900 text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/85 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => navigate('/app/today')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-black italic tracking-widest text-emerald-400 uppercase">
            Painel Influenciador
          </span>
          <Button
            variant="ghost"
            className="text-xs px-3 h-8"
            onClick={() => navigate('/influencer/carteira')}
          >
            Carteira
          </Button>
        </div>
      </header>

      <PageShell className="space-y-6 max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Comissões"
          title={`Olá, ${account.displayName.split(' ')[0]}!`}
          description="Acompanhe suas indicações e comissões em tempo real."
          tone="green"
          icon={<TrendingUp className="h-4 w-4" />}
        />

        {/* Balance hero */}
        <DashboardHero className="min-h-[220px]">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <FloatingPill tone="green" icon={<DollarSign className="h-3.5 w-3.5" />}>
                Saldo disponível
              </FloatingPill>
              <h2 className="mt-4 font-display text-display-lg font-black text-text-primary leading-none">
                R${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              {pending > 0 && (
                <p className="mt-1 text-sm text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  + R${pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em processamento
                </p>
              )}
            </div>

            {available >= account.minPayoutAmount && (
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => navigate('/influencer/carteira')}
              >
                <DollarSign className="h-4 w-4" />
                Solicitar saque
              </Button>
            )}
          </div>
        </DashboardHero>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
            <Users className="h-5 w-5 text-sky-400 mb-1" />
            <span className="font-display text-display-sm font-black text-text-primary">
              {account.totalReferrals}
            </span>
            <span className="text-xs text-text-muted">Indicações</span>
          </GlassCard>
          <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
            <TrendingUp className="h-5 w-5 text-emerald-400 mb-1" />
            <span className="font-display text-display-sm font-black text-text-primary">
              {activeRefs}
            </span>
            <span className="text-xs text-text-muted">Ativas</span>
          </GlassCard>
          <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
            <DollarSign className="h-5 w-5 text-amber-400 mb-1" />
            <span className="font-display text-display-sm font-black text-text-primary text-xs">
              R${lifetimeEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-text-muted">Total ganho</span>
          </GlassCard>
        </div>

        {/* Share link */}
        <GlassCard className="rounded-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Seu link de indicação</h3>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-text-secondary font-mono overflow-hidden">
            <span className="flex-1 truncate">{referralLink}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <><CheckCircle className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar</>}
            </Button>
            <Button variant="ghost" className="px-3" onClick={handleShare} aria-label="Compartilhar">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </GlassCard>

        {/* Recent referrals */}
        {referrals.length > 0 && (
          <div>
            <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
              Indicações recentes
            </h3>
            <div className="space-y-2">
              {referrals.map((ref) => (
                <GlassCard key={ref.id} className="rounded-card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{ref.referredEmail}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(ref.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                      R${ref.commissionAmountBrl.toFixed(2)} comissão
                    </p>
                  </div>
                  <InfluencerReferralBadge status={ref.status} />
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
            <Users className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Nenhuma indicação ainda. Compartilhe seu link para começar a ganhar!
            </p>
          </GlassCard>
        )}
      </PageShell>
    </main>
  )
}

function InfluencerReferralBadge({ status }: { status: Referral['status'] }) {
  const label =
    status === 'active'     ? 'Ativa'      :
    status === 'converted'  ? 'Convertida' :
    status === 'pending'    ? 'Pendente'   :
    status === 'fraud_hold' ? 'Em análise' :
    status === 'cancelled'  ? 'Cancelada'  :
    'Revertida'
  const tone =
    status === 'active'                             ? 'green'   :
    status === 'converted'                          ? 'sky'     :
    (status === 'pending' || status === 'fraud_hold') ? 'yellow' :
    'red'
  return <StatusBadge tone={tone as 'green' | 'sky' | 'yellow' | 'red' | 'neutral'}>{label}</StatusBadge>
}
