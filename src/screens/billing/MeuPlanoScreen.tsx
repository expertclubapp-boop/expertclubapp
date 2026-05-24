import { motion } from 'framer-motion'
import {
  Check,
  Lock,
  Crown,
  Zap,
  Dumbbell,
  UtensilsCrossed,
  Trophy,
  Star,
  Users,
  ArrowRight,
  BookOpen,
  Target,
  MessageCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { usePlanTier } from '../../hooks/usePlanTier'
import { useSubscription } from '../../hooks/useSubscription'
import { planProductService } from '../../services/planProductService'
import { checkoutService } from '../../services/checkoutService'
import type { Plan, PlanTier, Subscription } from '../../types/domain'

const TIER_LABELS: Record<PlanTier, string> = {
  low_ticket: 'Expert Club',
  mentoring_quarterly: 'Mentoria 1:1 Trimestral',
  mentoring_semester: 'Mentoria 1:1 Semestral',
  mentoring_annual: 'Mentoria 1:1 Anual',
}

const LOW_TICKET_FEATURES = [
  { icon: Dumbbell, label: 'Biblioteca de treinos completa', included: true },
  { icon: UtensilsCrossed, label: 'Biblioteca de dietas', included: true },
  { icon: Trophy, label: 'Missões e gamificação com XP', included: true },
  { icon: BookOpen, label: 'Conteúdos e vídeo aulas', included: true },
  { icon: Target, label: 'Check-ins e evolução', included: true },
  { icon: Crown, label: 'Treino prescrito pelo mentor', included: false },
  { icon: Crown, label: 'Dieta personalizada pelo mentor', included: false },
  { icon: Crown, label: 'Ranking exclusivo 1:1 com premiações', included: false },
  { icon: Crown, label: 'Conteúdos exclusivos da mentoria', included: false },
  { icon: Crown, label: 'Anamnese completa e acompanhamento', included: false },
]

const MENTORING_FEATURES = [
  { icon: Dumbbell, label: 'Biblioteca de treinos completa', included: true },
  { icon: UtensilsCrossed, label: 'Biblioteca de dietas', included: true },
  { icon: Trophy, label: 'Missões e gamificação com XP', included: true },
  { icon: BookOpen, label: 'Todos os conteúdos e vídeo aulas', included: true },
  { icon: Target, label: 'Check-ins e evolução', included: true },
  { icon: Dumbbell, label: 'Treino prescrito pelo mentor', included: true },
  { icon: UtensilsCrossed, label: 'Dieta personalizada pelo mentor', included: true },
  { icon: Trophy, label: 'Ranking exclusivo 1:1 com premiações', included: true },
  { icon: Star, label: 'Conteúdos exclusivos da mentoria', included: true },
  { icon: Users, label: 'Anamnese completa e acompanhamento', included: true },
]

const INTERVAL_LABEL: Record<string, string> = {
  monthly: 'mês',
  quarterly: '3 meses',
  semester: '6 meses',
  annual: 'ano',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function PlanBadge({ tier }: { tier: PlanTier }) {
  const isMentoring = tier !== 'low_ticket'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${
        isMentoring
          ? 'bg-gradient-to-r from-ec-violet/30 to-accent-purple/30 border border-ec-violet/40 text-ec-violet'
          : 'bg-white/5 border border-white/10 text-text-secondary'
      }`}
    >
      {isMentoring && <Crown className="w-3 h-3" />}
      {TIER_LABELS[tier]}
    </span>
  )
}

function FeatureRow({ label, included }: { icon: any; label: string; included: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 ${included ? '' : 'opacity-50'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${included ? 'bg-accent-lime/15 text-accent-lime' : 'bg-white/5 text-text-muted'}`}>
        {included ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
      </div>
      <span className={`text-sm ${included ? 'text-white' : 'text-text-muted'}`}>{label}</span>
      {!included && (
        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ec-violet border border-ec-violet/30 rounded-full px-2 py-0.5">
          <Crown className="w-2.5 h-2.5" />
          1:1
        </span>
      )}
    </div>
  )
}

function MentoringUpsell({ subscription }: { subscription: Subscription | null }) {
  const navigate = useNavigate()
  const [mentoringPlans, setMentoringPlans] = useState<Plan[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    planProductService.listActive().then((all) =>
      setMentoringPlans(all.filter((p) => p.tier && p.tier !== 'low_ticket'))
    )
  }, [])

  async function handleRenew() {
    if (!subscription?.planId) return
    setCheckoutLoading('renew')
    try {
      const url = await checkoutService.createCheckout({ planId: subscription.planId })
      window.location.href = url
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handleUpgrade(planId: string) {
    setCheckoutLoading(planId)
    try {
      const url = await checkoutService.createCheckout({ planId })
      window.location.href = url
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan renewal */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ec-card rounded-3xl p-5 border border-white/10 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-accent-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Renovar assinatura</p>
            <p className="text-xs text-text-muted mt-0.5">{subscription.planName}</p>
          </div>
          <button
            onClick={handleRenew}
            disabled={checkoutLoading === 'renew'}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest bg-accent-lime/10 text-accent-lime hover:bg-accent-lime/20 transition-all disabled:opacity-60"
          >
            {checkoutLoading === 'renew' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Renovar
          </button>
        </motion.div>
      )}

      {/* Mentoring upsell hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="ec-card rounded-3xl p-6 text-center space-y-4 border border-ec-violet/20 bg-gradient-to-b from-ec-violet/10 to-transparent"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ec-violet to-accent-purple flex items-center justify-center mx-auto shadow-[0_8px_32px_rgba(91,75,255,0.4)]">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet mb-1">Próximo nível</p>
          <h2 className="text-xl font-black text-white">Mentoria 1:1</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-xs mx-auto">
            Resultados reais com prescrição personalizada, acompanhamento direto e suporte completo.
          </p>
        </div>

        {/* Real mentoring plans from Firestore */}
        {mentoringPlans.length > 0 ? (
          <div className="space-y-3 text-left">
            {mentoringPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-3 ${
                  plan.highlighted
                    ? 'border-ec-violet bg-ec-violet/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-4 bg-ec-violet text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black ${plan.highlighted ? 'text-ec-violet' : 'text-white'}`}>{plan.name}</p>
                  {plan.subtitle && <p className="text-[10px] text-text-muted">{plan.subtitle}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black italic text-white">
                    {formatCurrency(plan.price)}
                    <span className="text-[10px] font-normal text-text-muted ml-1">/{INTERVAL_LABEL[plan.interval] ?? plan.interval}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!checkoutLoading}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-ec-violet text-white hover:bg-ec-violet/80 transition-all disabled:opacity-60 shrink-0"
                >
                  {checkoutLoading === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  Assinar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => navigate('/app/billing/plans')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Ver planos de mentoria
          </Button>
        )}
      </motion.div>

      {/* Feature comparison */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ec-card rounded-3xl p-5"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4">O que está incluído</p>
        <div>
          {LOW_TICKET_FEATURES.map((f, i) => (
            <FeatureRow key={i} {...f} />
          ))}
        </div>
      </motion.div>

      {/* Dúvidas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ec-card rounded-3xl p-5 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-accent-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Dúvidas sobre a mentoria?</p>
          <p className="text-xs text-text-muted mt-0.5">Fale com a equipe antes de assinar.</p>
        </div>
        <button
          onClick={() => navigate('/app/billing/plans')}
          className="flex items-center gap-1.5 text-xs font-bold text-accent-lime hover:text-accent-lime/80 transition-colors whitespace-nowrap"
        >
          Saiba mais
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  )
}

function MentoringActive({ tier, subscription }: { tier: PlanTier; subscription: Subscription | null }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const expiryDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
    : null

  async function handleRenew() {
    if (!subscription?.planId) return
    setCheckoutLoading(true)
    try {
      const url = await checkoutService.createCheckout({ planId: subscription.planId })
      window.location.href = url
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ec-card rounded-3xl p-6 border border-ec-violet/20 bg-gradient-to-b from-ec-violet/10 to-transparent"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ec-violet to-accent-purple flex items-center justify-center shadow-[0_8px_32px_rgba(91,75,255,0.4)]">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet">Plano ativo</p>
            <h2 className="text-lg font-black text-white">{TIER_LABELS[tier]}</h2>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span className="text-xs font-bold text-accent-lime uppercase tracking-widest">Mentoria ativa</span>
          </div>
          {expiryDate && (
            <span className="text-xs text-text-muted">Vence em {expiryDate}</span>
          )}
        </div>
        {subscription?.planId && (
          <button
            onClick={handleRenew}
            disabled={checkoutLoading}
            className="mt-4 w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-ec-violet/40 text-ec-violet hover:bg-ec-violet/10 transition-all disabled:opacity-60"
          >
            {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Renovar plano
          </button>
        )}
      </motion.div>

      {/* Full feature list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ec-card rounded-3xl p-5"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4">Seus benefícios</p>
        <div>
          {MENTORING_FEATURES.map((f, i) => (
            <FeatureRow key={i} {...f} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export function MeuPlanoScreen() {
  const { tier, isMentoring, isLoading } = usePlanTier()
  const { subscription } = useSubscription()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="space-y-1 mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Assinatura</p>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Meu Plano</h1>
          <PlanBadge tier={tier} />
        </div>
        {subscription && (
          <p className="text-xs text-text-muted">
            {subscription.planName} · renova em{' '}
            {subscription.renewalDate
              ? new Date(subscription.renewalDate).toLocaleDateString('pt-BR')
              : subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
                : '—'}
          </p>
        )}
      </div>

      {isMentoring
        ? <MentoringActive tier={tier} subscription={subscription ?? null} />
        : <MentoringUpsell subscription={subscription ?? null} />
      }

      <div className="mt-6 pt-5 border-t border-white/5">
        <button
          onClick={() => navigate('/app/billing')}
          className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Ver histórico de pagamentos
        </button>
      </div>
    </PageShell>
  )
}
