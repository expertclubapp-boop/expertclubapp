import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, ShieldCheck, Zap, ArrowRight, Bell } from 'lucide-react'
import { plansService } from '../../services/plansService'
import { useAuth } from '../../contexts/AuthContext'
import { functions } from '../../lib/firebase/firebase'
import { httpsCallable } from 'firebase/functions'
import { Button } from '../../components/ui/Button'
import type { Plan } from '../../types/domain'
import { referralUtils } from '../../utils/referral'

export function PlansScreen() {
  const { firebaseUser, logout } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null)

  useEffect(() => {
    referralUtils.captureReferralParams()
    setAppliedReferral(referralUtils.getStoredReferral().referralCode || null)
    async function loadPlans() {
      try {
        const activePlans = await plansService.getActivePlans()
        setPlans(activePlans)
      } catch (error) {
        console.error('Error loading plans:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPlans()
  }, [])

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(planId)
    try {
      const createCheckout = httpsCallable(functions, 'createMercadoPagoCheckout')
      
      // Get tracking info if available (Phase 5B readiness)
      const { referralCode, couponCode, source, campaign } = referralUtils.getStoredReferral()

      const result = await createCheckout({ 
        planId,
        referralCode,
        couponCode,
        source,
        campaign
      }) as { data: { checkoutUrl: string } }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error initiating subscription:', error)
      alert('Falha ao iniciar checkout. Tente novamente ou fale com o suporte.')
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary text-text-primary pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-7xl items-center justify-between rounded-shell px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-accent-lime/30 p-0.5 overflow-hidden bg-bg-primary">
            <img 
              src={firebaseUser?.photoURL || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200"} 
              alt="User" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="text-xl font-black italic text-accent-lime tracking-widest font-display">EXPERT CLUB</span>
        </div>
        <div className="flex gap-4 items-center">
          <button className="text-text-muted hover:text-accent-lime transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => logout()} className="text-text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            Sair
          </button>
        </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ec-floating-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-accent-lime mb-6"
          >
            <Star className="w-4 h-4 fill-accent-lime" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Acesso Ilimitado</span>
          </motion.div>
          <h1 className="font-display text-h1 md:text-6xl mb-6 uppercase italic font-black leading-none">
            ESCOLHA SEU <span className="text-accent-lime">PLANO DE ELITE</span>
          </h1>
          {appliedReferral && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-purple mb-6"
            >
              <div className="w-4 h-4 rounded-full bg-accent-purple/10 flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </div>
              Convite Aplicado: <span className="bg-accent-purple/10 px-2 py-0.5 rounded border border-accent-purple/20">{appliedReferral}</span>
            </motion.div>
          )}
          <p className="max-w-2xl mx-auto text-text-muted font-body-md text-lg">
            Desbloqueie protocolos avançados, acompanhamento em tempo real e a comunidade que vai elevar seu jogo.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PlanCard 
              key={plan.id}
              plan={plan}
              isProcessing={isProcessing === plan.id}
              onSubscribe={() => handleSubscribe(plan.id)}
              delay={index * 0.1}
            />
          ))}

          {plans.length === 0 && (
            <div className="ec-card md:col-span-2 lg:col-span-3 rounded-3xl p-8 text-center">
              <h3 className="font-display text-h3 text-text-primary font-bold mb-3">Planos indisponíveis no momento</h3>
              <p className="text-text-secondary max-w-xl mx-auto">
                Não encontramos um plano ativo para checkout. Tente novamente em alguns minutos ou fale com o suporte para concluir sua entrada.
              </p>
            </div>
          )}
        </div>

        <section className="mt-24 max-w-4xl mx-auto">
          <div className="ec-card rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-2xl bg-accent-sky/10 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-10 h-10 text-accent-sky" />
            </div>
            <div>
              <h3 className="font-display text-h2 text-white mb-2 uppercase italic font-bold">Garantia Incondicional</h3>
              <p className="text-text-muted font-body-md">
                Teste o Expert Club por 7 dias. Se não sentir que está no caminho para sua melhor versão, devolvemos seu investimento integralmente. Sem perguntas.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function PlanCard({ plan, isProcessing, onSubscribe, delay }: { plan: any, isProcessing: boolean, onSubscribe: () => void, delay: number }) {
  const isFounder = plan.isFounderPlan

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        relative rounded-3xl p-8 border flex flex-col h-full transition-all duration-500 group
        ${isFounder 
          ? 'ec-hero-shell ec-highlight-ring' 
          : 'ec-card hover:border-white/20'}
      `}
    >
      {isFounder && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-lime text-bg-primary px-4 py-1 rounded-full font-display text-[10px] font-black uppercase tracking-widest shadow-xl">
          Melhor Valor
        </div>
      )}

      <div className="mb-8">
        <h3 className="font-display text-h3 text-white mb-2 uppercase italic font-bold">{plan.name}</h3>
        <p className="text-xs text-text-muted font-body-md line-clamp-2">{plan.description}</p>
      </div>

      <div className="mb-10 flex items-baseline gap-1">
        <span className="text-text-muted font-display text-sm">R$</span>
        <span className={`text-5xl font-display font-black italic tracking-tighter ${isFounder ? 'text-accent-lime' : 'text-text-primary'}`}>
          {plan.price}
        </span>
        <span className="text-text-muted text-xs font-bold uppercase tracking-widest">/mês</span>
      </div>

      <div className="space-y-4 mb-10 flex-grow">
        {plan.features.map((feature: string) => (
          <div key={feature} className="flex items-center gap-3">
            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isFounder ? 'bg-accent-lime/10 text-accent-lime' : 'bg-white/5 text-text-muted'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-text-secondary font-medium">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        variant={isFounder ? 'lime' : 'ghost'}
        className={`w-full py-5 text-sm font-black italic uppercase tracking-widest group-hover:scale-[1.02] transition-all`}
        onClick={onSubscribe}
        isLoading={isProcessing}
        icon={!isProcessing && <Zap className="w-4 h-4 fill-current" />}
      >
        Assinar Agora
      </Button>

      <div className="mt-6 flex items-center justify-center gap-2 text-text-muted opacity-40">
        <ArrowRight className="w-3 h-3" />
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Cancelamento a qualquer momento</span>
      </div>
    </motion.div>
  )
}
