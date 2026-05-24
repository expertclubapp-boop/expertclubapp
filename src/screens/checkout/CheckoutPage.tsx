import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Check, Crown, ArrowRight, Loader2, Shield, Star, Zap } from 'lucide-react'
import { planProductService } from '../../services/planProductService'
import { checkoutService } from '../../services/checkoutService'
import { useAuth } from '../../contexts/AuthContext'
import type { Plan } from '../../types/domain'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const INTERVAL_LABEL: Record<string, string> = {
  monthly: 'mês',
  quarterly: '3 meses',
  semester: '6 meses',
  annual: 'ano',
}

const TIER_COLOR: Record<string, string> = {
  low_ticket: 'from-accent-lime/20 to-transparent border-accent-lime/20',
  mentoring_quarterly: 'from-ec-violet/20 to-transparent border-ec-violet/20',
  mentoring_semester: 'from-ec-violet/20 to-transparent border-ec-violet/20',
  mentoring_annual: 'from-ec-violet/20 to-transparent border-ec-violet/20',
}

export function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { firebaseUser, isLoading: authLoading } = useAuth()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [otherPlans, setOtherPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return
    Promise.all([
      planProductService.getById(planId),
      planProductService.listActive(),
    ]).then(([found, all]) => {
      setPlan(found)
      setOtherPlans(all.filter((p) => p.id !== planId && p.status === 'active'))
    }).catch(() => setError('Plano não encontrado.')).finally(() => setLoading(false))
  }, [planId])

  async function handleBuy() {
    if (!plan) return
    if (!firebaseUser) {
      navigate(`/login?next=/checkout/${plan.id}`)
      return
    }
    setCheckoutLoading(true)
    setError(null)
    try {
      const url = await checkoutService.createCheckout({ planId: plan.id })
      window.location.href = url
    } catch {
      setError('Erro ao criar checkout. Tente novamente.')
      setCheckoutLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ec-violet animate-spin" />
      </div>
    )
  }

  if (!plan || plan.status !== 'active') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-muted mb-4">Plano não disponível.</p>
          <Link to="/" className="text-ec-violet hover:underline text-sm">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const isMentoring = plan.tier !== 'low_ticket'
  const gradientClass = TIER_COLOR[plan.tier ?? 'low_ticket'] ?? TIER_COLOR.low_ticket

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg-primary/90 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ec-violet flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black uppercase italic text-white text-sm tracking-wider">Expert Club</span>
          </div>
          {firebaseUser ? (
            <Link to="/app/today" className="text-xs font-bold text-text-muted hover:text-white transition-colors">
              Entrar no app →
            </Link>
          ) : (
            <Link to="/login" className="text-xs font-bold text-text-muted hover:text-white transition-colors">
              Já sou aluno
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 lg:py-16 grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
        {/* Left — Plan details */}
        <div>
          {/* Badge */}
          {plan.badge && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">
              <Star className="w-3 h-3" />
              {plan.badge}
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            {isMentoring && <Crown className="w-5 h-5 text-ec-violet" />}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              {isMentoring ? 'Mentoria 1:1' : 'Expert Club'}
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase text-white leading-tight mb-3">
            {plan.name}
          </h1>
          {plan.subtitle && (
            <p className="text-base text-text-secondary mb-6">{plan.subtitle}</p>
          )}
          {plan.description && (
            <p className="text-sm text-text-muted leading-relaxed mb-8">{plan.description}</p>
          )}

          {/* Features */}
          {plan.features?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                O que está incluído
              </p>
              <ul className="space-y-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-lime/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent-lime" />
                    </div>
                    <span className="text-sm text-white">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other plans */}
          {otherPlans.length > 0 && (
            <div className="mt-12">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4">
                Outros planos disponíveis
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {otherPlans.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/checkout/${p.id}`}
                    className="rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-ec-violet transition-colors">{p.name}</p>
                        {p.subtitle && <p className="text-[10px] text-text-muted mt-0.5">{p.subtitle}</p>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-ec-violet transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-lg font-black italic text-white mt-2">
                      {formatCurrency(p.price)}
                      <span className="text-xs font-normal text-text-muted ml-1">/{INTERVAL_LABEL[p.interval] ?? p.interval}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Sticky checkout card */}
        <div className="lg:sticky lg:top-20">
          <div className={`rounded-3xl border bg-gradient-to-b ${gradientClass} p-6 space-y-5`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">
                {isMentoring ? 'Mentoria 1:1' : 'Plano mensal'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black italic text-white">{formatCurrency(plan.price)}</span>
                <span className="text-sm text-text-muted">/{INTERVAL_LABEL[plan.interval] ?? plan.interval}</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 rounded-xl px-3 py-2 border border-red-400/20">{error}</p>
            )}

            <button
              onClick={handleBuy}
              disabled={checkoutLoading}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-ec-violet hover:bg-ec-violet/90 active:scale-[0.98] text-white shadow-[0_8px_32px_rgba(91,75,255,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  {firebaseUser ? 'Ir para pagamento' : 'Criar conta e comprar'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!firebaseUser && (
              <p className="text-[10px] text-center text-text-muted">
                Já é aluno?{' '}
                <Link to={`/login?next=/checkout/${plan.id}`} className="text-ec-violet hover:underline">
                  Entrar e continuar
                </Link>
              </p>
            )}

            <div className="flex items-center gap-2 text-[10px] text-text-muted pt-1">
              <Shield className="w-3 h-3 shrink-0" />
              <span>Pagamento 100% seguro via Mercado Pago. Dados protegidos por criptografia SSL.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
