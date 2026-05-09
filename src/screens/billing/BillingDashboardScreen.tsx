import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  RefreshCw, 
  HelpCircle, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { billingService } from '../../services/billingService'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { PageShell, SectionHeader } from '../../components/ui/Premium'
import type { Subscription, BillingEvent } from '../../types/domain'

export function BillingDashboardScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<BillingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBillingData() {
      if (!firebaseUser) return
      try {
        const [subData, historyData] = await Promise.all([
          billingService.getSubscription(firebaseUser.uid),
          billingService.getBillingHistory(firebaseUser.uid)
        ])
        setSubscription(subData)
        setHistory(historyData)
      } catch (error) {
        console.error('Error loading billing data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadBillingData()
  }, [firebaseUser])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-accent-lime', bg: 'bg-accent-lime/10', label: 'Ativa', icon: CheckCircle2 }
      case 'trialing': return { color: 'text-accent-sky', bg: 'bg-accent-sky/10', label: 'Experimental', icon: Clock }
      case 'past_due': return { color: 'text-accent-red', bg: 'bg-accent-red/10', label: 'Pagamento Pendente', icon: AlertCircle }
      case 'cancelled': return { color: 'text-text-muted', bg: 'bg-white/5', label: 'Cancelada', icon: AlertCircle }
      default: return { color: 'text-text-muted', bg: 'bg-white/5', label: status, icon: AlertCircle }
    }
  }

  return (
    <PageShell className="space-y-10">
      <SectionHeader
        eyebrow="Conta e pagamentos"
        title="Gestão Financeira"
        description="Status da assinatura, próximas cobranças e histórico de transações."
        tone="sky"
        icon={<CreditCard className="h-4 w-4" />}
        action={
          <button onClick={() => navigate(-1)} className="hidden sm:flex h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        }
      />
        {!subscription ? (
          <div className="ec-card rounded-3xl p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
               <CreditCard className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="font-display text-h2 text-white uppercase italic">Sem Plano Ativo</h2>
            <p className="text-text-muted font-body-md max-w-sm mx-auto">
              Você ainda não possui uma assinatura ativa no Expert Club. Escolha um plano para desbloquear todo o potencial da plataforma.
            </p>
            <Button variant="primary" className="max-w-xs mx-auto" onClick={() => navigate('/app/billing/plans')}>
              Ver Planos Disponíveis
            </Button>
          </div>
        ) : (
          <>
            {/* Active Subscription Summary */}
            <section className="ec-hero-shell rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <RefreshCw className="w-32 h-32 text-white" />
              </div>
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {(() => {
                        const config = getStatusConfig(subscription.status)
                        return (
                          <div className={`px-3 py-1 rounded-full ${config.bg} ${config.color} flex items-center gap-1.5`}>
                             <config.icon className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <h2 className="font-display text-h1 text-white uppercase italic font-black leading-none">
                      {subscription.planName}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Próximo Cobrança</p>
                    <div className="flex items-center justify-end gap-2 text-white">
                      <Calendar className="w-4 h-4 text-accent-lime" />
                      <span className="font-display text-h3 font-bold italic">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/5 pt-8">
                  <InfoBlock label="Valor" value={`R$ ${subscription.price}/mês`} />
                  <InfoBlock label="Método" value={subscription.provider === 'mercadopago' ? 'Mercado Pago' : 'Manual'} />
                  <InfoBlock label="Desde" value={new Date(subscription.startedAt).toLocaleDateString('pt-BR')} />
                  <InfoBlock label="ID Assinatura" value={subscription.providerSubscriptionId?.slice(0, 8) || '--'} />
                </div>
              </div>
              
              <div className="bg-white/[0.025] border-t border-white/5 p-6 flex flex-col sm:flex-row gap-4">
                {subscription.status === 'past_due' && (
                  <Button variant="primary" className="flex-1" onClick={() => navigate('/app/billing/plans')}>
                    Regularizar Assinatura
                  </Button>
                )}
                <button className="flex-1 bg-white/5 border border-subtle text-text-primary py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                   <RefreshCw className="w-4 h-4" /> Alterar Plano
                </button>
                <button className="flex-1 bg-transparent border border-subtle text-text-muted py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">
                   Gerenciar no Mercado Pago
                </button>
              </div>
            </section>

            {/* Billing History */}
            <section className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="font-display text-h3 text-white uppercase italic font-bold">Histórico de Transações</h3>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Últimos 12 meses</span>
              </div>
              
              <div className="ec-card rounded-2xl overflow-hidden">
                {history.length === 0 ? (
                  <div className="p-10 text-center text-text-muted italic text-sm">
                    Nenhuma transação registrada ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {history.map((event) => (
                      <HistoryItem key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Support CTA */}
            <section className="ec-card flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-sky/10 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-accent-sky" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Dúvidas sobre sua cobrança?</h4>
                  <p className="text-text-muted text-xs">Canal de suporte financeiro ainda não configurado.</p>
                </div>
              </div>
              <Button variant="ghost" disabled className="w-full md:w-auto px-10 border-accent-sky/30 text-accent-sky hover:bg-accent-sky/10">
                 Falar com Suporte
              </Button>
            </section>
          </>
        )}
    </PageShell>
  )
}

function InfoBlock({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="font-display text-sm text-white font-bold">{value}</p>
    </div>
  )
}

function HistoryItem({ event }: { event: BillingEvent }) {
  const isSuccess = event.normalizedStatus === 'active'
  return (
    <div className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSuccess ? 'bg-accent-lime/10 text-accent-lime' : 'bg-accent-red/10 text-accent-red'}`}>
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{event.eventType === 'subscription_payment' ? 'Mensalidade Expert Club' : 'Adesão Plano Fundador'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              {new Date(event.createdAt).toLocaleDateString('pt-BR')}
            </span>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Ref: {event.providerPaymentId?.slice(0, 10) || '--'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="font-display font-bold text-white italic">R$ {event.amount.toFixed(2)}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${isSuccess ? 'text-accent-lime' : 'text-accent-red'}`}>
            {isSuccess ? 'Aprovado' : 'Falhou'}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-white transition-colors cursor-pointer" />
      </div>
    </div>
  )
}
