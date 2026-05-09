import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { StatusPill } from '../../components/ui/StatusPill'
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon'
import { useAuth } from '../../contexts/AuthContext'
import { billingService } from '../../services/billingService'
import { useNavigate } from 'react-router-dom'
import type { SubscriptionStatus } from '../../types/domain'

interface StateConfig {
  icon: React.ReactNode
  iconBg: string
  iconBorder: string
  pillColor: 'yellow' | 'red' | 'sky'
  label: string
  desc: string
}

const stateConfigs: Record<
  Exclude<SubscriptionStatus, 'active' | 'trialing'>,
  StateConfig
> = {
  past_due: {
    icon: <AlertTriangle className="w-8 h-8 text-accent-yellow" />,
    iconBg: 'rgba(250,204,21,0.10)',
    iconBorder: 'rgba(250,204,21,0.20)',
    pillColor: 'yellow',
    label: 'Pagamento pendente',
    desc: 'Para continuar acessando treinos, dietas, check-ins, desafios e conteúdos do Expert Club, regularize sua assinatura.',
  },
  expired: {
    icon: <Clock className="w-8 h-8 text-accent-red" />,
    iconBg: 'rgba(255,59,59,0.10)',
    iconBorder: 'rgba(255,59,59,0.20)',
    pillColor: 'red',
    label: 'Assinatura expirada',
    desc: 'Sua assinatura chegou ao fim. Renove agora para voltar a ter acesso completo a treinos, dietas, check-ins e toda a comunidade.',
  },
  cancelled: {
    icon: <XCircle className="w-8 h-8 text-accent-red" />,
    iconBg: 'rgba(255,59,59,0.08)',
    iconBorder: 'rgba(255,59,59,0.15)',
    pillColor: 'red',
    label: 'Assinatura cancelada',
    desc: 'Você cancelou sua assinatura. Se foi por engano ou quer voltar, é só reativar. Seu histórico continua intacto.',
  },
  pending: {
    icon: <Loader2 className="w-8 h-8 text-accent-sky" />,
    iconBg: 'rgba(93,220,255,0.08)',
    iconBorder: 'rgba(93,220,255,0.18)',
    pillColor: 'sky',
    label: 'Aguardando confirmação',
    desc: 'Seu pagamento está sendo processado. Assim que confirmado, seu acesso será liberado automaticamente.',
  },
}

const pausedFeatures = [
  {
    icon: <Dumbbell className="w-[18px] h-[18px]" />,
    iconBg: 'rgba(183,255,60,0.08)',
    iconColor: 'text-accent-lime/40',
    label: 'Treinos mensais por objetivo',
  },
  {
    icon: <UtensilsCrossed className="w-[18px] h-[18px]" />,
    iconBg: 'rgba(93,220,255,0.08)',
    iconColor: 'text-accent-sky/40',
    label: 'Dietas e planos alimentares',
  },
  {
    icon: <TrendingUp className="w-[18px] h-[18px]" />,
    iconBg: 'rgba(139,92,246,0.08)',
    iconColor: 'text-accent-purple/40',
    label: 'Check-ins e evolução',
  },
  {
    icon: <Trophy className="w-[18px] h-[18px]" />,
    iconBg: 'rgba(250,204,21,0.08)',
    iconColor: 'text-accent-yellow/40',
    label: 'Desafios e comunidade',
  },
]

type LockState = Exclude<SubscriptionStatus, 'active' | 'trialing'>

export function SubscriptionLockScreen() {
  const navigate = useNavigate()
  const { firebaseUser, logout } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSub() {
      if (!firebaseUser) return
      try {
        const sub = await billingService.getSubscription(firebaseUser.uid)
        setSubscription(sub)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    loadSub()
  }, [firebaseUser])

  const activeState = (subscription?.status as LockState) || 'past_due'
  const config = stateConfigs[activeState]

  const handleRenew = () => {
    navigate('/app/billing/plans')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="ec-app-bg flex min-h-screen flex-col items-center justify-center px-5 py-6 relative overflow-hidden">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="font-display text-lg font-black text-accent-lime/35 tracking-[0.15em] italic">
            EXPERT CLUB
          </div>
        </div>

        {/* Main Card */}
        <div className="ec-glass-strong rounded-card p-7 mb-3">
          {/* Status icon */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              key={activeState}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-[68px] h-[68px] rounded-card flex items-center justify-center mb-4"
              style={{
                background: config.iconBg,
                border: `1px solid ${config.iconBorder}`,
              }}
            >
              {config.icon}
            </motion.div>

            <StatusPill label={config.label} color={config.pillColor} className="mb-3" />

            <h1 className="font-display text-heading-3 text-text-primary text-center leading-tight mb-2.5">
              Sua assinatura precisa de atenção
            </h1>
            <motion.p
              key={`desc-${activeState}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-body-sm text-text-secondary text-center leading-relaxed"
            >
              {config.desc}
            </motion.p>
          </div>

          {/* Paused features */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.035] p-4 mb-6">
            <div className="text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase mb-3 font-body">
              O que está pausado
            </div>
            {pausedFeatures.map((feature, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-2.5 ${
                  i < pausedFeatures.length - 1
                    ? 'border-b border-white/5'
                    : ''
                }`}
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: feature.iconBg }}
                >
                  <span className={feature.iconColor}>{feature.icon}</span>
                </div>
                <span className="text-body-sm text-white/35 line-through">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              onClick={handleRenew}
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              Regularizar assinatura
            </Button>
            <Button
              variant="ghost"
              disabled
              aria-describedby="support-unconfigured"
              icon={<WhatsAppIcon />}
            >
              Falar com suporte
            </Button>
            <p id="support-unconfigured" className="text-center text-xs text-text-muted">
              Canal de suporte ainda não configurado.
            </p>
            <Button
              variant="ghost"
              className="text-text-muted hover:text-white border-transparent"
              onClick={() => logout()}
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-text-muted leading-relaxed px-4 font-body">
          Seu progresso, histórico e conquistas estão salvos e serão
          restaurados ao reativar a assinatura.
        </p>
      </motion.main>
    </div>
  )
}
