import { useState, useEffect, useCallback } from 'react'
import { Copy, Share2, Users, Gift, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { referralService } from '../../services/referralService'
import { walletService } from '../../services/walletService'
import { Button } from '../../components/ui/Button'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  PageShell,
  SectionHeader,
  StatusBadge,
} from '../../components/ui/Premium'
import type { Referral, StudentReferralAccount, WalletBalance } from '../../types/domain'

export function StudentReferralScreen() {
  const { firebaseUser } = useAuth()
  const [account, setAccount] = useState<StudentReferralAccount | null>(null)
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const [acc, bal, refs] = await Promise.all([
        referralService.getOrCreateStudentAccount(
          firebaseUser.uid,
          firebaseUser.displayName || 'Aluno'
        ),
        walletService.getBalance(firebaseUser.uid),
        referralService.getReferralsByReferrer(firebaseUser.uid),
      ])
      setAccount(acc)
      setBalance(bal)
      setReferrals(refs)
    } catch (err) {
      console.error('Error loading referral data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  const referralLink = account
    ? `${window.location.origin}/?ref=${account.referralCode}`
    : ''

  const handleCopy = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setShareError('Não foi possível copiar. Copie manualmente.')
    }
  }

  const handleShare = async () => {
    if (!referralLink || !account) return
    const text = `Entre no Expert Club com meu link e ganhe desconto! 🏋️\n${referralLink}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Expert Club', text, url: referralLink })
      } catch {
        // user cancelled
      }
    } else {
      await handleCopy()
    }
  }

  const activeCount = referrals.filter((r) => r.status === 'active').length

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
        eyebrow="Indique & Ganhe"
        title="Seu link de indicação"
        description="Convide amigos para o Expert Club e acumule créditos para trocar na loja."
        tone="violet"
        icon={<Gift className="h-4 w-4" />}
      />

      {/* Hero — code + share */}
      <DashboardHero className="min-h-[260px]">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <FloatingPill tone="violet" icon={<Gift className="h-3.5 w-3.5" />}>
              Seu código
            </FloatingPill>
            <h2 className="mt-4 font-display text-display-lg font-black uppercase italic leading-none text-text-primary tracking-wider">
              {account?.referralCode ?? '—'}
            </h2>
            <p className="mt-2 text-body-sm text-text-secondary max-w-xs">
              Seus amigos recebem desconto e você ganha créditos a cada assinatura confirmada.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:min-w-[260px]">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-text-secondary font-mono overflow-hidden">
              <span className="flex-1 truncate">{referralLink || '—'}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1 gap-2"
                onClick={handleCopy}
                disabled={!account}
              >
                {copied ? (
                  <><CheckCircle className="h-4 w-4" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar link</>
                )}
              </Button>
              <Button
                variant="ghost"
                className="gap-2 px-3"
                onClick={handleShare}
                disabled={!account}
                aria-label="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            {shareError && (
              <p className="text-xs text-red-400">{shareError}</p>
            )}
          </div>
        </div>
      </DashboardHero>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
          <Users className="h-5 w-5 text-volt-400 mb-1" />
          <span className="font-display text-display-sm font-black text-text-primary">
            {account?.totalReferrals ?? 0}
          </span>
          <span className="text-xs text-text-muted">Indicações</span>
        </GlassCard>
        <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
          <TrendingUp className="h-5 w-5 text-emerald-400 mb-1" />
          <span className="font-display text-display-sm font-black text-text-primary">
            {activeCount}
          </span>
          <span className="text-xs text-text-muted">Ativas</span>
        </GlassCard>
        <GlassCard className="rounded-card p-4 flex flex-col gap-1 items-center text-center">
          <Gift className="h-5 w-5 text-amber-400 mb-1" />
          <span className="font-display text-display-sm font-black text-text-primary">
            {balance?.availableBalance ?? 0}
          </span>
          <span className="text-xs text-text-muted">Créditos</span>
        </GlassCard>
      </div>

      {/* Pending balance */}
      {(balance?.pendingBalance ?? 0) > 0 && (
        <GlassCard className="rounded-card p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {balance!.pendingBalance} créditos em processamento
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Aguardando confirmação do pagamento (período de hold de 7 dias).
            </p>
          </div>
        </GlassCard>
      )}

      {/* How it works */}
      <div>
        <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
          Como funciona
        </h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Compartilhe seu código ou link com amigos', color: 'text-volt-400' },
            { step: '2', text: 'Seu amigo se cadastra e assina com desconto', color: 'text-emerald-400' },
            { step: '3', text: 'Após 7 dias de pagamento confirmado, você recebe créditos', color: 'text-amber-400' },
            { step: '4', text: 'Troque créditos por produtos e benefícios na loja', color: 'text-sky-400' },
          ].map(({ step, text, color }) => (
            <GlassCard key={step} className="rounded-card p-4 flex items-center gap-4">
              <span className={`font-display text-display-sm font-black ${color} min-w-[2rem] text-center`}>
                {step}
              </span>
              <p className="text-sm text-text-primary">{text}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div>
          <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
            Histórico de indicações
          </h3>
          <div className="space-y-2">
            {referrals.map((ref) => (
              <GlassCard key={ref.id} className="rounded-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {ref.referredEmail}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ReferralStatusBadge status={ref.status} />
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {referrals.length === 0 && (
        <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Nenhuma indicação ainda. Compartilhe seu link para começar!
          </p>
        </GlassCard>
      )}
    </PageShell>
  )
}

function ReferralStatusBadge({ status }: { status: Referral['status'] }) {
  const label =
    status === 'active'     ? 'Ativa'      :
    status === 'converted'  ? 'Convertida' :
    status === 'pending'    ? 'Pendente'   :
    status === 'fraud_hold' ? 'Em análise' :
    status === 'cancelled'  ? 'Cancelada'  :
    'Revertida'
  const tone =
    status === 'active'                        ? 'green'   :
    status === 'converted'                     ? 'sky'     :
    status === 'pending' || status === 'fraud_hold' ? 'yellow' :
    'red'
  return <StatusBadge tone={tone as 'green' | 'sky' | 'yellow' | 'red' | 'neutral'}>{label}</StatusBadge>
}
