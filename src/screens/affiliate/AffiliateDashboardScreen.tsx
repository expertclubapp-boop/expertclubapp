import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Copy, Link2, Users, WalletCards, CheckCircle2, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { toastSuccess } from '../../components/ui/Toast'
import { affiliateDashboardService, type AffiliateDashboardSummary } from '../../services/affiliateDashboardService'
import type { AffiliateAccount } from '../../types/domain'

export function AffiliateDashboardScreen() {
  const navigate = useNavigate()
  const { firebaseUser, user } = useAuth()
  const [account, setAccount] = useState<AffiliateAccount | null>(null)
  const [summary, setSummary] = useState<AffiliateDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!firebaseUser) return
      try {
        const foundAccount = await affiliateDashboardService.getAccountByUid(firebaseUser.uid)
        setAccount(foundAccount)
        if (foundAccount) {
          setSummary(await affiliateDashboardService.getSummary(foundAccount.id))
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [firebaseUser])

  const code = summary?.referralCode || user?.referralCode
  const publicLink = useMemo(() => {
    if (!code) return ''
    return `${window.location.origin}/affiliate/${code}`
  }, [code])

  const copyLink = async () => {
    if (!publicLink) return
    await navigator.clipboard.writeText(publicLink)
    toastSuccess('Link copiado.')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/85 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button onClick={() => navigate('/app/today')} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-black italic tracking-widest text-accent-purple uppercase">Minhas comissões</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 pb-28">
        {account?.status === 'blocked' && (
          <div className="mb-5 rounded-2xl border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-accent-red">
            Sua conta de afiliada está bloqueada. Você ainda pode usar o app como aluna se sua assinatura estiver ativa.
          </div>
        )}

        <div className="ec-card rounded-3xl p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-accent-purple">Seu link</p>
          <h1 className="mt-1 font-display text-2xl font-black uppercase italic text-white">Indique o Expert Club</h1>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link2 className="h-5 w-5 shrink-0 text-accent-purple" />
              <p className="truncate text-sm text-white">{publicLink || 'Código ainda não vinculado'}</p>
            </div>
            <Button variant="primary" onClick={copyLink} disabled={!publicLink} icon={<Copy className="h-4 w-4" />}>
              Copiar link
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi icon={<Users />} label="Indicados" value={summary?.totalReferrals ?? 0} />
          <Kpi icon={<CheckCircle2 />} label="Ativos" value={summary?.activeReferrals ?? 0} />
          <Kpi icon={<Clock />} label="Pendentes" value={`R$ ${(summary?.pendingCommission ?? account?.pendingCommission ?? 0).toFixed(2)}`} />
          <Kpi icon={<WalletCards />} label="Pagas" value={`R$ ${(summary?.paidCommission ?? account?.totalCommissionPaid ?? 0).toFixed(2)}`} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="ec-card rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold uppercase italic text-white">Indicados</h2>
            <div className="mt-4 space-y-3">
              {(summary?.referrals || []).map(referral => (
                <div key={referral.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-bold text-white">{referral.firstName}</p>
                    <p className="text-[10px] text-text-muted">{new Date(referral.joinedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-accent-lime">R$ {referral.commissionAmount.toFixed(2)}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{referral.status}</p>
                  </div>
                </div>
              ))}
              {!summary?.referrals?.length && <p className="rounded-2xl bg-white/[0.03] p-4 text-sm text-text-muted">Você ainda não tem indicados convertidos.</p>}
            </div>
          </section>

          <section className="ec-card rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold uppercase italic text-white">Pagamentos</h2>
            <div className="mt-4 space-y-3">
              {(summary?.payouts || []).map(payout => (
                <div key={payout.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-bold text-white">R$ {payout.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-text-muted">{new Date(payout.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent-sky">{payout.status}</p>
                </div>
              ))}
              {!summary?.payouts?.length && <p className="rounded-2xl bg-white/[0.03] p-4 text-sm text-text-muted">Nenhum pagamento registrado ainda.</p>}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="ec-card rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
      <p className="font-display text-xl font-black italic text-white">{value}</p>
    </div>
  )
}
