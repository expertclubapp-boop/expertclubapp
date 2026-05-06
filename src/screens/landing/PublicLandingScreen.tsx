import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ExpertLogo,
  FeatureCard,
  HeroMockup,
  landingFeatures,
} from '../../components/reference/ExpertClubVisualKit'

const benefits = [
  ['Planos personalizados', 'para seus objetivos'],
  ['Acompanhamento', 'real e contínuo'],
  ['Comunidade que', 'te motiva todo dia'],
]

const stats = [
  { icon: Users, value: '+ 48 mil', label: 'alunas transformadas' },
  { icon: TrendingUp, value: '+ 1,2 milhão', label: 'treinos realizados' },
  { icon: Star, value: '4,9 ★', label: 'avaliação nas lojas' },
  { icon: ShieldCheck, value: '100%', label: 'seguro e confiável' },
]

const navItems = [
  ['Início', '#inicio'],
  ['Recursos', '#recursos'],
  ['Para você', '#resultados'],
  ['Planos', '#planos'],
  ['Sobre nós', '#resultados'],
  ['Blog', '#recursos'],
]

export function PublicLandingScreen() {
  const navigate = useNavigate()
  const goToSignup = () => navigate('/signup')
  const goToLogin = () => navigate('/login')
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const talkToConsultant = () => {
    window.open(
      'https://wa.me/5511999999999?text=Quero%20falar%20com%20um%20consultor%20sobre%20o%20Expert%20Club',
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="ec-reference ec-landing-ref">
      <header className="ec-landing-nav">
        <div className="ec-landing-nav-inner">
          <button type="button" className="ec-landing-logo-button" onClick={() => navigate('/')} aria-label="Ir para o início">
            <ExpertLogo className="ec-ref-logo ec-landing-logo" />
          </button>
          <nav aria-label="Navegação da landing">
            {navItems.map(([item, href], index) => (
              <a key={item} href={href} className={index === 0 ? 'is-active' : ''}>
                {item}
              </a>
            ))}
          </nav>
          <div className="ec-landing-nav-actions">
            <Button variant="secondary" onClick={goToLogin}>Entrar</Button>
            <Button icon={<ArrowRight size={16} />} onClick={goToSignup}>Começar agora</Button>
          </div>
        </div>
      </header>

      <main id="inicio" className="ec-landing-main">
        <section className="ec-landing-hero">
          <div className="ec-landing-copy">
            <Badge className="ec-landing-kicker">
              <Sparkles size={15} />
              Seu app completo de fitness e bem-estar
            </Badge>
            <h1>
              <span className="ec-landing-title-lead">Sua rotina fitness,</span>
              <span>mais leve, clara<br />e inteligente.</span>
            </h1>
            <p>
              Treinos personalizados, dieta inteligente, check-ins, desafios, ranking e acompanhamento completo para
              transformar seus hábitos e alcançar seus melhores resultados.
            </p>
            <div className="ec-landing-ctas">
              <Button icon={<ArrowRight size={17} />} onClick={goToSignup}>Começar agora</Button>
              <Button variant="ghost" icon={<PlayCircle size={17} />} onClick={() => scrollTo('recursos')}>Ver como funciona</Button>
            </div>
            <div className="ec-landing-benefits">
              {benefits.map(([title, body], index) => (
                <div key={title}>
                  <span>{index === 0 ? <Sparkles /> : index === 1 ? <TrendingUp /> : <ShieldCheck />}</span>
                  <strong>{title}<br />{body}</strong>
                </div>
              ))}
            </div>
          </div>
          <HeroMockup />
        </section>

        <Card className="ec-landing-stats">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </Card>

        <div className="ec-landing-proof-grid">
          <section id="recursos" className="ec-landing-features">
            <h2>Tudo que você precisa em <span>um só lugar</span></h2>
            <p>Recursos completos para cuidar do seu corpo, mente e hábitos.</p>
            <div>
              {landingFeatures.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>

          <section id="resultados" className="ec-landing-social">
            <div>
              <h2>Histórias reais,<br /><span>resultados reais</span></h2>
              <p>Alunas que transformaram sua rotina com o Expert Club.</p>
            </div>
            <button type="button" aria-label="Depoimento anterior">‹</button>
            <Card className="ec-landing-testimonial">
              <div className="ec-ref-avatar ec-ref-avatar--1" />
              <blockquote>
                “O Expert Club mudou minha relação com o treino e comida. Hoje me sinto mais forte, confiante e feliz!”
              </blockquote>
              <strong>Juliana R.</strong>
              <span>-12 kg em 5 meses</span>
              <div className="ec-landing-dots"><i /><i /><i /></div>
            </Card>
            <button type="button" aria-label="Próximo depoimento">›</button>
          </section>
        </div>

        <section id="planos" className="ec-landing-final">
          <div className="ec-landing-final-side">
            <div><Sparkles /><ZapCopy /></div>
            <strong>Clareza</strong>
            <p>Tenha um plano claro e objetivo do treino.</p>
          </div>
          <div className="ec-landing-final-mark">
            <ExpertLogo className="ec-ref-logo ec-landing-final-logo" />
          </div>
          <div className="ec-landing-final-copy">
            <h2>Pronta para <span>sua melhor versão?</span></h2>
            <p>Comece agora e tenha tudo o que precisa para transformar sua rotina e conquistar seus objetivos.</p>
          </div>
          <div className="ec-landing-final-actions">
            <Button icon={<ArrowRight size={17} />} onClick={goToSignup}>Começar agora</Button>
            <Button variant="ghost" icon={<MessageCircle size={17} />} onClick={talkToConsultant}>Falar com um consultor</Button>
            <div>
              <span><CheckCircle2 /> 7 dias grátis</span>
              <span><CheckCircle2 /> Cancele quando quiser</span>
              <span><CheckCircle2 /> Suporte humano</span>
              <span><CheckCircle2 /> Ambiente 100% seguro</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function ZapCopy() {
  return <span className="ec-landing-zap">↯</span>
}
