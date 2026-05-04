import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  Droplets,
  Dumbbell,
  Instagram,
  Linkedin,
  Menu,
  MessageCircle,
  PlayCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Twitter,
  Users,
  Utensils,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { referralUtils } from '../../utils/referral'
import { ExpertLogo } from '../../components/ui/ExpertLogo'

type Accent = 'lime' | 'sky' | 'purple'
type HeroVariantKey = 'A' | 'B' | 'C'

interface FeatureCard {
  title: string
  body: string
  metric: string
  icon: ReactNode
  accent: Accent
}

interface HeroVariant {
  headline: string
  subheadline: string
  cta: string
}

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4'

const WORKOUT_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=640&q=80'

const navLinks = [
  { label: 'Problema', href: '#problema' },
  { label: 'O que vem incluso', href: '#recebe' },
  { label: 'Como começa', href: '#como-funciona' },
  { label: 'Plano', href: '#preco' },
]

const DEFAULT_HERO_VARIANT: HeroVariantKey = 'B'

const HERO_VARIANTS: Record<HeroVariantKey, HeroVariant> = {
  A: {
    headline: 'Abra o app e veja o que treinar, o que comer e o que acompanhar hoje.',
    subheadline:
      'No Expert Club você encontra treinos por objetivo, modelos de dieta, check-ins, controle de água, desafios e um grupo no WhatsApp para manter a constância.',
    cta: 'Quero entrar por R$49/mês',
  },
  B: {
    headline: 'Pare de se perder no treino e na dieta por R$49/mês.',
    subheadline:
      'Entre no Expert Club e tenha treinos por objetivo, modelos de dieta, check-ins, controle de água, desafios e grupo no WhatsApp para seguir uma rotina com mais clareza.',
    cta: 'Quero meu acesso fundador',
  },
  C: {
    headline: 'Chega de começar toda segunda e parar no meio do caminho.',
    subheadline:
      'O Expert Club te mostra o que treinar, o que comer e o que acompanhar durante a semana, com app, check-ins, desafios e grupo no WhatsApp.',
    cta: 'Entrar no plano fundador',
  },
}

const heroPills = ['Treino de hoje', 'Dieta para seu objetivo', 'Check-in diário', 'Água do dia']

const todayStats = [
  { label: 'Hoje', value: '4 tarefas', icon: <CalendarCheck className="h-4 w-4" /> },
  { label: 'Água', value: '1,5L/3L', icon: <Droplets className="h-4 w-4" /> },
  { label: 'Dias seguidos', value: '12', icon: <Zap className="h-4 w-4" /> },
]

const painCards = [
  {
    title: 'Você tenta de tudo, mas nunca termina o que começa.',
    body: 'Vive trocando de estratégia, salvando treinos no Instagram e perdendo tempo com métodos que não foram feitos para você.',
  },
  {
    title: 'A dieta sempre parece uma punição temporária.',
    body: 'Você até começa bem, mas qualquer imprevisto vira desculpa para chutar o balde e desistir de tudo de novo.',
  },
  {
    title: 'Excesso de informação te deixa paralisado.',
    body: 'Cada hora um influenciador fala uma coisa diferente. Você não precisa de mais conteúdo, precisa de um sistema.',
  },
  {
    title: 'Você treina no escuro, sem saber se está evoluindo.',
    body: 'Sem anotar cargas, medidas e sem ver seu progresso real, você desanima porque parece que nada está mudando.',
  },
  {
    title: 'Sozinho, o caminho é muito mais difícil.',
    body: 'Sem um grupo de pessoas com o mesmo objetivo, é fácil deixar a rotina de lado quando o cansaço bate.',
  },
]

const whatIsBlocks = [
  {
    title: 'App',
    body: 'Para ver treino, dieta, água, check-ins e evolução em um só lugar.',
    icon: <Dumbbell className="h-5 w-5" />,
  },
  {
    title: 'Grupo',
    body: 'Para compartilhar rotina, tirar dúvidas gerais e ver outras pessoas tentando melhorar também.',
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    title: 'Ciclo do mês',
    body: 'Para participar de desafios, conteúdos e orientações novas ao longo do mês.',
    icon: <Trophy className="h-5 w-5" />,
  },
]

const beforeItems = [
  { label: 'Treino solto do Instagram', reason: 'Sem progressão real' },
  { label: 'Dieta no improviso', reason: 'Fácil de errar a mão' },
  { label: 'Água no esquecimento', reason: 'Baixa performance' },
  { label: 'Peso sem acompanhamento', reason: 'Frustração garantida' },
  { label: 'Medidas no achismo', reason: 'Zero controle' },
  { label: 'Ciclos de começa e para', reason: 'Falta de método' },
]

const afterItems = [
  { label: 'Treino no App', benefit: 'Progressão de carga' },
  { label: 'Dieta por Objetivo', benefit: 'Sem adivinhação' },
  { label: 'Hidratação em dia', benefit: 'Mais energia' },
  { label: 'Check-in de Evolução', benefit: 'Métricas reais' },
  { label: 'Grupo de Elite', benefit: 'Constância extrema' },
  { label: 'Caminho Decidido', benefit: 'Resultados visíveis' },
]

const featureCards: FeatureCard[] = [
  {
    title: 'Treinos por objetivo',
    body: 'Treinos para emagrecimento, hipertrofia ou recomposição, com divisão por nível e frequência.',
    metric: 'Treino',
    icon: <Dumbbell className="h-5 w-5" />,
    accent: 'lime',
  },
  {
    title: 'Dietas por objetivo',
    body: 'Modelos de dieta com refeições, quantidades, proteínas, carboidratos, gorduras e substituições.',
    metric: 'Dieta',
    icon: <Utensils className="h-5 w-5" />,
    accent: 'sky',
  },
  {
    title: 'Registro de treino',
    body: 'Anote séries, repetições e carga para saber se está progredindo de verdade.',
    metric: 'Carga',
    icon: <ClipboardCheck className="h-5 w-5" />,
    accent: 'lime',
  },
  {
    title: 'Check-in diário',
    body: 'Registre se treinou, seguiu a dieta, bebeu água, como dormiu e como está sua fome.',
    metric: 'Diário',
    icon: <CalendarCheck className="h-5 w-5" />,
    accent: 'purple',
  },
  {
    title: 'Check-in semanal',
    body: 'Acompanhe peso, medidas, fotos e adesão da semana.',
    metric: 'Semanal',
    icon: <Camera className="h-5 w-5" />,
    accent: 'sky',
  },
  {
    title: 'Hidratação',
    body: 'Defina sua meta de água e marque o quanto bebeu durante o dia.',
    metric: 'Água',
    icon: <Droplets className="h-5 w-5" />,
    accent: 'sky',
  },
  {
    title: 'Evolução',
    body: 'Veja seu histórico de peso, medidas, treinos, check-ins e constância.',
    metric: 'Histórico',
    icon: <Scale className="h-5 w-5" />,
    accent: 'purple',
  },
  {
    title: 'Desafios',
    body: 'Participe de missões mensais para manter o ritmo.',
    metric: 'Mês',
    icon: <Trophy className="h-5 w-5" />,
    accent: 'lime',
  },
  {
    title: 'Conteúdos',
    body: 'Acesse aulas, orientações e materiais para entender melhor treino e dieta.',
    metric: 'Aulas',
    icon: <PlayCircle className="h-5 w-5" />,
    accent: 'purple',
  },
  {
    title: 'Grupo no WhatsApp',
    body: 'Compartilhe rotina, evolução e relatos com outras pessoas que também estão tentando melhorar.',
    metric: 'Grupo',
    icon: <Users className="h-5 w-5" />,
    accent: 'lime',
  },
]

const startSteps = [
  {
    title: 'Assine o Expert Club.',
    body: 'Você entra pelo plano mensal e recebe acesso ao app.',
  },
  {
    title: 'Responda algumas perguntas.',
    body: 'O app entende seu objetivo, nível e rotina.',
  },
  {
    title: 'Escolha treino e dieta.',
    body: 'Você seleciona o plano que combina melhor com seu momento.',
  },
  {
    title: 'Abra o app todos os dias.',
    body: 'Veja treino, dieta, água, check-in e desafio do mês.',
  },
  {
    title: 'Acompanhe sua evolução.',
    body: 'Registre peso, medidas, fotos e treinos para enxergar seu progresso.',
  },
]

const forYou = [
  'quer emagrecer, mas se perde na dieta',
  'quer ganhar massa, mas não sabe se o treino está bom',
  'é iniciante e não sabe por onde começar',
  'já treina, mas muda tudo toda hora',
  'quer acompanhar peso, medidas e cargas',
  'precisa de um grupo para manter constância',
  'quer pagar menos do que uma consultoria individual',
]

const notForYou = [
  'quer plano 100% personalizado',
  'precisa de acompanhamento médico ou nutricional individual',
  'quer resultado sem executar',
  'não quer registrar nada',
  'quer uma dieta clínica feita só para você',
]

const offerBenefits = [
  'app com treinos',
  'app com dietas',
  'check-ins',
  'água',
  'evolução',
  'desafios',
  'conteúdos',
  'grupo no WhatsApp',
]

const objections = [
  {
    title: 'Mas eu já vejo conteúdo fitness de graça...',
    body: 'Conteúdo gratuito pode ajudar, mas normalmente vem solto. O Expert Club organiza treino, dieta, check-ins e evolução em um lugar só.',
  },
  {
    title: 'Isso é uma consultoria individual?',
    body: 'Não. A consultoria individual é feita sob medida. O Expert Club é uma assinatura mais acessível com modelos, ferramentas e comunidade.',
  },
  {
    title: 'Eu sou iniciante. Serve para mim?',
    body: 'Sim. A ideia é justamente ajudar quem precisa de um caminho mais simples para começar.',
  },
  {
    title: 'E se eu não conseguir seguir perfeito?',
    body: 'Você não precisa ser perfeito. O objetivo é acompanhar sua rotina, ajustar o que está difícil e continuar.',
  },
]

const faqs = [
  {
    question: 'O Expert Club é uma consultoria?',
    answer:
      'Não. O Expert Club é uma assinatura com app, treinos, dietas, check-ins, conteúdos e grupo. Consultoria individual é outro tipo de acompanhamento.',
  },
  {
    question: 'A dieta é feita só para mim?',
    answer:
      'Não. Você acessa modelos de dieta por objetivo. Eles ajudam a ter uma base, mas não substituem uma prescrição feita por nutricionista.',
  },
  {
    question: 'O treino é personalizado?',
    answer:
      'Não é um treino feito do zero só para você. O app mostra opções por objetivo, nível e frequência para você escolher o que combina melhor com sua rotina.',
  },
  {
    question: 'Posso cancelar?',
    answer:
      'Sim. A assinatura é mensal e você pode cancelar quando quiser.',
  },
  {
    question: 'Tem grupo no WhatsApp?',
    answer:
      'Sim. O grupo serve para acompanhar o ciclo, compartilhar rotina, ver outras pessoas executando e manter constância.',
  },
  {
    question: 'Sou iniciante. Posso entrar?',
    answer:
      'Pode. O Expert Club foi pensado para quem precisa de um caminho simples para começar ou voltar a ter rotina.',
  },
  {
    question: 'Serve para emagrecer?',
    answer:
      'Sim. O app tem treinos e dietas por objetivo, incluindo emagrecimento.',
  },
  {
    question: 'Serve para ganhar massa?',
    answer:
      'Sim. Também existem opções para hipertrofia e recomposição corporal.',
  },
  {
    question: 'Como recebo acesso?',
    answer:
      'Depois de assinar, você entra com sua conta, passa pelo onboarding e acessa o app.',
  },
  {
    question: 'Se eu entrar pelo link de uma influenciadora, muda algo para mim?',
    answer:
      'Não muda sua experiência no app. O convite fica aplicado no checkout para identificar de onde você veio.',
  },
]

const accentClasses: Record<Accent, string> = {
  lime: 'text-accent-lime bg-accent-lime/10',
  sky: 'text-accent-sky bg-accent-sky/10',
  purple: 'text-accent-purple-light bg-accent-purple/10',
}

function buildTrackedPath(path: string) {
  const urlParams = new URLSearchParams(window.location.search)
  const stored = referralUtils.getStoredReferral()
  const params = new URLSearchParams()

  const referralCode = urlParams.get('ref') || stored.referralCode
  const couponCode = urlParams.get('coupon') || stored.couponCode
  const source = urlParams.get('utm_source') || urlParams.get('source') || stored.source
  const campaign = urlParams.get('utm_campaign') || urlParams.get('campaign') || stored.campaign
  const heroVariant = normalizeHeroVariantKey(urlParams.get('hero'))

  if (referralCode) params.set('ref', referralCode)
  if (couponCode) params.set('coupon', couponCode)
  if (source) params.set('utm_source', source)
  if (campaign) params.set('utm_campaign', campaign)
  if (heroVariant) params.set('hero', heroVariant)

  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function normalizeHeroVariantKey(value: string | null): HeroVariantKey | null {
  const normalized = value?.trim().toUpperCase()
  return normalized === 'A' || normalized === 'B' || normalized === 'C' ? normalized : null
}

function getHeroVariantKey(): HeroVariantKey {
  return normalizeHeroVariantKey(new URLSearchParams(window.location.search).get('hero')) ?? DEFAULT_HERO_VARIANT
}

function useLandingReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || localStorage.getItem('referralCode')
  })

  useEffect(() => {
    referralUtils.captureReferralParams()
    setReferralCode(localStorage.getItem('referralCode') || new URLSearchParams(window.location.search).get('ref'))
  }, [])

  return referralCode
}

function ExpertMark({ large = false }: { large?: boolean }) {
  return (
    <ExpertLogo variant="icon" className={large ? 'h-20' : 'h-8'} />
  )
}

function LiquidLink({
  to,
  children,
  variant = 'primary',
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  const base =
    'group inline-flex min-h-[48px] items-center justify-center gap-3 rounded-full px-5 py-3 font-semibold transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary'
  const styles =
    variant === 'primary'
      ? 'liquid-glass-strong ec-landing-cta-primary text-white ec-btn-neon-trace'
      : 'liquid-glass text-white hover:text-white/85'

  if (to.startsWith('#')) {
    return (
      <a href={to} className={`${base} ${styles} ${className}`}>
        <span className="relative z-10 flex items-center gap-3">{children}</span>
      </a>
    )
  }

  return (
    <Link to={to} className={`${base} ${styles} ${className}`}>
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </Link>
  )
}

function IconButton({ children, label, href = '#topo' }: { children: ReactNode; label: string; href?: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="liquid-glass inline-flex h-11 w-11 items-center justify-center rounded-full text-white/85 transition duration-300 hover:scale-105 hover:text-white active:scale-95"
    >
      {children}
    </a>
  )
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: ReactNode
  body?: string
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
      <div className="liquid-glass mb-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase text-white/60">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-medium leading-tight text-white md:text-5xl">{title}</h2>
      {body && <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">{body}</p>}
    </div>
  )
}

function AppPreview() {
  return (
    <div className="liquid-glass-strong ec-landing-float rounded-[2rem] p-4">
      <div className="liquid-glass rounded-[1.55rem] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-white/45">No app</p>
            <h3 className="text-2xl font-medium text-white">Hoje</h3>
          </div>
          <div className="liquid-glass rounded-full px-3 py-1.5 text-xs font-semibold text-ec-violet">
            4 tarefas
          </div>
        </div>

        <div className="space-y-3">
          <div className="liquid-glass-strong rounded-[1.25rem] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ec-violet text-white">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ec-violet">Treino de hoje</p>
                <p className="text-lg font-medium text-white">Inferiores + cardio</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {['5 exercícios', '42 min', 'Anotar carga'].map((item) => (
                <div key={item} className="liquid-glass rounded-full px-2 py-2 text-[11px] font-medium text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="liquid-glass rounded-[1.25rem] p-4">
              <Droplets className="mb-3 h-5 w-5 text-accent-sky" />
              <p className="text-xs text-white/45">Água do dia</p>
              <p className="text-2xl font-medium text-white">1,5L</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-accent-sky shadow-[0_0_18px_rgba(93,220,255,0.55)]" />
              </div>
            </div>
            <div className="liquid-glass rounded-[1.25rem] p-4">
              <ClipboardCheck className="mb-3 h-5 w-5 text-accent-purple-light" />
              <p className="text-xs text-white/45">Check-in diário</p>
              <p className="text-2xl font-medium text-white">Hoje</p>
              <p className="mt-2 text-xs leading-tight text-white/55">Sono, fome e dieta</p>
            </div>
          </div>

          <div className="liquid-glass rounded-[1.25rem] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/45">Dieta para seu objetivo</p>
                <p className="text-base font-medium text-white">Recomposição</p>
              </div>
              <Utensils className="h-5 w-5 text-accent-sky" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Proteína', 'Carbo', 'Gordura'].map((macro, index) => (
                <div key={macro} className="rounded-[12px] bg-white/[0.055] p-2">
                  <div
                    className={`mb-2 h-1.5 rounded-full ${
                      index === 0 ? 'bg-accent-sky' : index === 1 ? 'bg-accent-lime' : 'bg-accent-purple'
                    }`}
                  />
                  <p className="text-[10px] text-white/55">{macro}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PublicLandingScreen() {
  const appliedReferral = useLandingReferral()
  const shouldReduceMotion = useReducedMotion()
  const [openFaq, setOpenFaq] = useState(0)

  const heroVariantKey = useMemo(getHeroVariantKey, [])
  const heroVariant = HERO_VARIANTS[heroVariantKey]
  const checkoutPath = useMemo(() => buildTrackedPath('/app/billing/plans'), [appliedReferral])

  const heroMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
      }

  const reveal = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <div className="ec-landing min-h-screen overflow-x-hidden bg-bg-primary text-white">
      <video
        className="ec-landing-video fixed inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="ec-landing-scrim fixed inset-0 z-[1]" aria-hidden="true" />
      <div className="ec-landing-grain fixed inset-0 z-[2]" aria-hidden="true" />

      <main id="topo" className="relative z-10">
        <section className="min-h-dvh px-3 py-3 sm:px-4 lg:px-6 lg:py-5">
          <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-4 lg:min-h-[calc(100dvh-40px)] lg:flex-row">
            <motion.div
              {...heroMotion}
              className="liquid-glass-strong relative flex min-h-[calc(100dvh-24px)] w-full overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:min-h-[calc(100dvh-40px)] lg:w-[52%] lg:p-9"
            >
              {/* Violet Gradient Tint to counter any green in the video */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(91,75,255,0.35),transparent_40%),linear-gradient(180deg,rgba(91,75,255,0.05),transparent_55%)] mix-blend-screen" />
              <div className="absolute inset-0 bg-bg-primary/20 backdrop-blur-[1px]" />

              <div className="relative z-10 flex w-full flex-col">
                <nav className="flex items-center justify-between gap-4" aria-label="Navegação principal">
                  <a href="#topo" className="inline-flex min-h-11 items-center gap-3 text-white">
                    <ExpertMark />
                    <span className="text-xl font-semibold">Expert Club</span>
                  </a>

                  <div className="hidden items-center gap-2 xl:flex">
                    {navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="liquid-glass inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-semibold text-white/70 transition hover:scale-105 hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>

                  <a
                    href="#recebe"
                    className="liquid-glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition hover:scale-105 hover:text-white active:scale-95"
                  >
                    <Menu className="h-4 w-4" />
                    Menu
                  </a>
                </nav>

                {appliedReferral && (
                  <div className="liquid-glass mt-5 inline-flex w-fit rounded-full px-4 py-2 text-xs font-semibold text-accent-purple-light">
                    Convite aplicado: {appliedReferral}
                  </div>
                )}

                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-12 lg:py-14">
                  <ExpertMark large />

                  <h1 className="mt-6 max-w-3xl text-4xl font-medium leading-[1.04] text-white sm:text-6xl lg:text-7xl">
                    {heroVariant.headline}
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                    {heroVariant.subheadline}
                  </p>

                  <div className="liquid-glass mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white border border-ec-violet/40 shadow-[0_0_30px_rgba(91,75,255,0.25)] bg-ec-violet/10">
                    Pioneiro Expert: <span className="text-ec-violet ml-1">R$49/mês</span>
                  </div>

                  <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
                    <LiquidLink to={checkoutPath} className="w-full sm:w-auto">
                      {heroVariant.cta}
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-primary/15">
                        <Download className="h-4 w-4" />
                      </span>
                    </LiquidLink>
                    <LiquidLink to="#recebe" variant="secondary" className="w-full sm:w-auto">
                      Ver o que tem dentro
                      <ArrowRight className="h-4 w-4" />
                    </LiquidLink>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">
                    Assinatura mensal. Cancele quando quiser. Não é consultoria individual — é uma forma mais simples e
                    acessível de ter um caminho para seguir.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {heroPills.map((pill) => (
                      <span key={pill} className="liquid-glass rounded-full px-4 py-2 text-xs font-semibold text-white/75">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mx-auto max-w-xl text-center">
                  <p className="text-xs font-semibold uppercase text-white/45">Para o dia a dia</p>
                  <p className="mt-2 text-lg text-white/85">
                    "Em vez de salvar dica solta, você entra no app e segue uma rotina mais clara."
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase text-white/45">
                    <span className="h-px w-10 bg-white/20" />
                    Expert Club
                    <span className="h-px w-10 bg-white/20" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.aside
              {...(shouldReduceMotion
                ? {}
                : {
                    initial: { opacity: 0, x: 22 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.72, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
                  })}
              className="hidden min-h-[calc(100dvh-40px)] w-[48%] flex-col p-2 lg:flex"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="liquid-glass flex items-center gap-2 rounded-full p-1.5">
                  <IconButton label="Twitter Expert Club">
                    <Twitter className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="LinkedIn Expert Club">
                    <Linkedin className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Instagram Expert Club">
                    <Instagram className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Ir para plano" href="#preco">
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>

                <div className="flex items-center gap-3">
                  <IconButton label="O que tem dentro" href="#recebe">
                    <Sparkles className="h-4 w-4" />
                  </IconButton>
                  <Link
                    to="/login"
                    className="liquid-glass inline-flex min-h-11 items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
                  >
                    Entrar
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/12">A</span>
                  </Link>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="liquid-glass w-64 rounded-[1.35rem] p-5">
                  <p className="text-sm font-semibold text-white">O básico no mesmo lugar</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    Treino, dieta, água, check-in e grupo para você não depender só de motivação.
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <div className="liquid-glass-strong rounded-[2.5rem] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="liquid-glass rounded-[1.6rem] p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <Wand2 className="h-5 w-5 text-ec-violet" />
                      </div>
                      <p className="font-semibold text-white">Treino de hoje</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        Veja qual treino fazer e anote carga, séries e repetições.
                      </p>
                    </div>
                    <div className="liquid-glass rounded-[1.6rem] p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <BookOpen className="h-5 w-5 text-accent-sky" />
                      </div>
                      <p className="font-semibold text-white">Evolução</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        Acompanhe peso, medidas, fotos e seus check-ins da semana.
                      </p>
                    </div>
                  </div>

                  <div className="liquid-glass mt-3 flex items-center gap-4 rounded-[1.6rem] p-3">
                    <img
                      src={WORKOUT_IMAGE}
                      alt="Pessoa treinando em academia"
                      className="h-16 w-24 rounded-[1.1rem] object-cover"
                      loading="eager"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">Grupo no WhatsApp</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">
                        Para compartilhar rotina e ver outras pessoas tentando melhorar também.
                      </p>
                    </div>
                    <a
                      href="#recebe"
                      aria-label="Ver o que tem dentro"
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white transition hover:scale-105 active:scale-95"
                    >
                      +
                    </a>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>

        <section id="problema" className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="O problema real"
              title="O problema não é falta de dica. É não saber o que seguir."
              body="Você vê muita informação, tenta começar, mas no meio da semana tudo fica confuso de novo."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {painCards.map((pain) => (
                <div key={pain.title} className="liquid-glass rounded-[1.75rem] p-5 transition hover:scale-[1.02]">
                  <X className="mb-5 h-5 w-5 text-accent-red" />
                  <h3 className="text-xl font-medium text-white">{pain.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{pain.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="O que é"
              title="O Expert Club junta o básico que você precisa para seguir uma rotina."
              body="Você entra no app, escolhe seu objetivo e começa a usar treinos, dietas, check-ins e ferramentas simples para acompanhar sua evolução."
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {whatIsBlocks.map((block) => (
                <div key={block.title} className="liquid-glass rounded-[2rem] p-6 transition hover:scale-[1.02]">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-ec-violet">
                    {block.icon}
                  </div>
                  <h3 className="text-2xl font-medium text-white">{block.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{block.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <div className="liquid-glass-strong overflow-hidden rounded-[2.5rem] p-5 md:p-8">
              <SectionHeader
                eyebrow="Antes e depois"
                title="Antes: tudo solto. Depois: uma rotina para seguir."
                body="Você não precisa montar tudo sozinho. O app organiza o básico para você seguir melhor."
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="liquid-glass rounded-[1.75rem] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <X className="h-5 w-5 text-accent-red" />
                    <h3 className="text-2xl font-medium text-white">Antes</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {beforeItems.map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white/[0.035] p-4 border border-white/5">
                        <p className="text-sm font-bold text-white/80">{item.label}</p>
                        <p className="text-[10px] text-accent-red/60 uppercase font-black tracking-widest mt-1">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="liquid-glass rounded-[1.75rem] p-5 border-ec-violet/20">
                  <div className="mb-5 flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-lime" />
                    <h3 className="text-2xl font-medium text-white">Depois</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {afterItems.map((item) => (
                      <div key={item.label} className="rounded-2xl bg-ec-violet/[0.08] p-4 border border-ec-violet/20 shadow-[0_0_15px_rgba(91,75,255,0.05)]">
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-ec-violet uppercase font-black tracking-widest mt-1">{item.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {todayStats.map((stat) => (
                  <div key={stat.label} className="liquid-glass rounded-full px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm text-white/58">
                        {stat.icon}
                        {stat.label}
                      </span>
                      <span className="font-semibold text-white">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="recebe" className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Dentro do app"
              title="O que você recebe no Expert Club"
              body="Tudo escrito de forma simples para você saber o que fazer, registrar sua rotina e acompanhar se está evoluindo."
            />

            <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
              <AppPreview />

              <div className="grid gap-4 sm:grid-cols-2">
                {featureCards.map((feature) => (
                  <div key={feature.title} className="liquid-glass rounded-[1.75rem] p-5 transition hover:scale-[1.02]">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accentClasses[feature.accent]}`}>
                        {feature.icon}
                      </div>
                      <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/60">
                        {feature.metric}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/62">{feature.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="como-funciona" className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Como funciona"
              title="Como você começa"
              body="A ideia é tirar você do improviso sem complicar sua rotina."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {startSteps.map((step, index) => (
                <div key={step.title} className="liquid-glass rounded-[1.75rem] p-5 transition hover:scale-[1.02]">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-ec-violet text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium leading-tight text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{step.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Para quem é"
              title="É para quem quer mais direção sem entrar ainda em uma consultoria individual."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="liquid-glass rounded-[1.75rem] p-6">
                <h3 className="mb-5 text-2xl font-medium text-white">É para você se...</h3>
                <div className="space-y-3">
                  {forYou.map((item) => (
                    <div key={item} className="flex gap-3">
                      <Check className="mt-1 h-4 w-4 flex-none text-accent-lime" />
                      <p className="text-base text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="liquid-glass rounded-[1.75rem] p-6">
                <h3 className="mb-5 text-2xl font-medium text-white">Não é para você se...</h3>
                <div className="space-y-3">
                  {notForYou.map((item) => (
                    <div key={item} className="flex gap-3">
                      <X className="mt-1 h-4 w-4 flex-none text-accent-red" />
                      <p className="text-base text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="liquid-glass mt-4 rounded-[1.5rem] p-5">
              <p className="text-sm leading-relaxed text-white/65">
                <strong className="font-semibold text-white">Aviso importante:</strong> O Expert Club não substitui
                consulta individual, avaliação médica ou prescrição personalizada. Para acompanhamento individual,
                existe a consultoria.
              </p>
            </div>
          </motion.div>
        </section>

        <section id="preco" className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="liquid-glass mb-5 inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase text-ec-violet">
                Plano fundador
              </div>
              <h2 className="text-3xl font-medium leading-tight text-white md:text-5xl">
                Entre como membro fundador por R$ 49/mês.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">
                Um valor especial para os primeiros membros que vão testar os primeiros ciclos do Expert Club.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/76">
                Enquanto sua assinatura continuar ativa, você mantém o valor fundador.
              </p>
            </div>

            <div className="liquid-glass-strong rounded-[2.5rem] p-5">
              <div className="liquid-glass rounded-[2rem] p-6 md:p-7">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                  <span className="liquid-glass rounded-full px-4 py-2 text-sm font-semibold text-ec-violet">
                    Plano fundador
                  </span>
                  {appliedReferral && (
                    <span className="liquid-glass rounded-full px-4 py-2 text-sm font-semibold text-accent-purple-light">
                      Convite: {appliedReferral}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-white/50 font-bold uppercase tracking-widest mb-2">Pioneiro Expert</p>
                  <div className="mt-1 flex flex-wrap items-end gap-2">
                    <span className="text-6xl font-black text-white md:text-7xl drop-shadow-[0_0_30px_rgba(91,75,255,0.6)]">R$ 49</span>
                    <span className="pb-2 text-xl font-bold text-ec-violet">/mês</span>
                  </div>
                </div>

                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {offerBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 rounded-full bg-white/[0.055] px-3 py-2.5">
                      <Check className="h-4 w-4 flex-none text-accent-lime" />
                      <span className="text-sm font-medium text-white/80">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <LiquidLink to={checkoutPath} className="w-full">
                    Quero começar por R$49/mês
                    <ArrowRight className="h-4 w-4" />
                  </LiquidLink>
                  <p className="mt-3 text-center text-sm text-white/48">
                    Assinatura mensal. Cancele quando quiser.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Dúvidas comuns"
              title="Antes da dúvida virar desistência"
              body="Algumas perguntas que aparecem antes de entrar."
            />
            <div className="grid gap-4 lg:grid-cols-4">
              {objections.map((item) => (
                <div key={item.title} className="liquid-glass rounded-[1.75rem] p-5">
                  <h3 className="text-lg font-medium leading-tight text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/62">{item.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section id="duvidas" className="px-4 py-16 md:px-6 md:py-24">
          <motion.div {...reveal()} className="mx-auto max-w-4xl">
            <SectionHeader eyebrow="FAQ" title="Perguntas de quem está pensando em entrar" />
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={faq.question} className="liquid-glass rounded-[1.5rem]">
                    <button
                      type="button"
                      className="flex min-h-[58px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-white transition hover:text-white/82 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${index}`}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 flex-none text-ec-violet transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div id={`faq-${index}`} className="px-5 pb-5 text-sm leading-relaxed text-white/62">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </section>

        <section className="px-4 pb-16 md:px-6 md:pb-24">
          <motion.div {...reveal()} className="mx-auto max-w-5xl text-center">
            <div className="liquid-glass-strong rounded-[2.5rem] p-6 md:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ec-violet text-white">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-medium leading-tight text-white md:text-5xl">
                Você não precisa começar perfeito. Precisa começar com um caminho.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">
                Entre no Expert Club, escolha seu treino, siga uma dieta, registre sua rotina e pare de fazer tudo no improviso.
              </p>
              <div className="mt-7 flex justify-center">
                <LiquidLink to={checkoutPath} className="w-full sm:w-auto">
                  Entrar por R$49/mês
                  <ArrowRight className="h-4 w-4" />
                </LiquidLink>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/54">
                <span className="inline-flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-ec-violet" /> Aulas
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-ec-violet" /> Grupo
                </span>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-ec-violet" /> WhatsApp
                </span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 px-4 pb-8 md:px-6">
        <div className="liquid-glass mx-auto flex max-w-6xl flex-col gap-3 rounded-[1.5rem] px-5 py-4 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <ExpertLogo variant="compact" className="h-6" />
          <p className="font-medium">Inteligência · Sistema · Evolução</p>
        </div>
      </footer>
    </div>
  )
}
