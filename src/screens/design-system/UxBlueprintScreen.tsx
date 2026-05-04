import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flag,
  Home,
  LineChart,
  LockKeyhole,
  MessageCircle,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Utensils,
  Zap,
} from 'lucide-react'
import type { ElementType, ReactNode } from 'react'
import {
  Button,
  Card,
  FeatureCard,
  MetricBarChart,
  PosterShell,
  ProgressRing,
} from '../../components/reference/ExpertClubVisualKit'

const architecture = [
  [Home, 'Landing Page'],
  [UserRound, 'Onboarding'],
  [BarChart3, 'Dashboard\ndo Aluno'],
  [Users, 'Dashboard\ndo Mentor'],
  [CheckCircle2, 'Check-ins'],
  [Dumbbell, 'Treinos'],
  [Utensils, 'Dieta'],
  [Droplets, 'Hidratação'],
  [Trophy, 'Ranking'],
  [Flag, 'Desafios'],
  [MessageCircle, 'Mensagens'],
  [LineChart, 'Relatórios'],
  [Sparkles, 'Configurações'],
] as const

const studentJourney = [
  [UserRound, 'Cadastro /\nLogin'],
  [Sparkles, 'Onboarding'],
  [Calendar, 'Plano do Dia'],
  [Dumbbell, 'Treino'],
  [Utensils, 'Dieta'],
  [Droplets, 'Hidratação'],
  [Trophy, 'Ranking'],
  [Flag, 'Desafios'],
  [CheckCircle2, 'Check-in'],
  [LineChart, 'Evolução'],
] as const

const mentorJourney = [
  [LockKeyhole, 'Login'],
  [BarChart3, 'Visão Geral'],
  [LineChart, 'Métricas'],
  [Users, 'Alunos'],
  [Sparkles, 'Alertas'],
  [CheckCircle2, 'Check-ins\nPendentes'],
  [Calendar, 'Prescrições'],
  [LineChart, 'Acompanhamento'],
  [BarChart3, 'Relatórios'],
] as const

export function UxBlueprintScreen() {
  return (
    <PosterShell
      page="02"
      eyebrow="UX Blueprint"
      title="UX BLUEPRINT"
      subtitle="Arquitetura, jornadas e módulos principais"
      body="Visão estruturada da experiência do Expert Club, conectando módulos, jornadas e telas-chave para uma experiência inteligente de fitness e bem-estar."
    >
      <section className="ec-blueprint-top-grid">
        <Card className="ec-blueprint-architecture">
          <h3>1. ARQUITETURA DO PRODUTO</h3>
          <p>Mapa de módulos e estrutura de alto nível</p>
          <div className="ec-blueprint-tree">
            <FlowNode item={architecture[0]} />
            <i />
            <FlowNode item={architecture[1]} />
            <div className="ec-blueprint-branches">
              {architecture.slice(2).map((item) => <FlowNode key={item[1]} item={item} />)}
            </div>
          </div>
        </Card>

        <div className="ec-blueprint-journeys">
          <Card>
            <h3>2. JORNADA DO ALUNO</h3>
            <p>Fluxo principal da experiência do aluno</p>
            <Journey items={studentJourney} caption="Ciclo diário de melhoria contínua" />
          </Card>
          <Card>
            <h3>3. JORNADA DO MENTOR</h3>
            <p>Fluxo principal da experiência do mentor</p>
            <Journey items={mentorJourney} caption="Ciclo de acompanhamento e otimização" />
          </Card>
        </div>
      </section>

      <section className="ec-blueprint-middle-grid">
        <Card>
          <h3>4. PRINCÍPIOS DE NAVEGAÇÃO</h3>
          <p>Diretrizes que guiam todas as interações</p>
          <div className="ec-blueprint-principles">
            <FeatureCard icon={Sparkles} title="Light-first" body="Clareza, respiro visual e foco no conteúdo que importa." />
            <FeatureCard icon={Zap} title="Simples" body="Fluxos diretos, telas enxutas e hierarquia clara." />
            <FeatureCard icon={Trophy} title="Motivador" body="Reforços positivos, progresso visível e conexão emocional." />
            <FeatureCard icon={Zap} title="Focado em ação" body="CTAs evidentes, microações e resultados rápidos." />
            <FeatureCard icon={Flag} title="Baixa fricção" body="Menos cliques, autopreenchimento e experiência fluida." />
          </div>
        </Card>

        <Card>
          <h3>5. BLUEPRINT DAS TELAS PRINCIPAIS</h3>
          <p>Visão geral das telas centrais e seus blocos de conteúdo</p>
          <div className="ec-blueprint-screens">
            <ScreenPreview title="LANDING PAGE">
              <div className="ec-blueprint-mini-landing">
                <b>Transforme sua rotina.</b>
                <span>Alcance sua melhor versão.</span>
                <Button>Começar agora</Button>
              </div>
            </ScreenPreview>
            <ScreenPreview title="DASHBOARD DO ALUNO">
              <div className="ec-blueprint-mini-dashboard">
                <b>Olá, Mariana! 👋</b>
                <div><span>Plano do dia</span><ProgressRing value={76} size={68} /></div>
              </div>
            </ScreenPreview>
            <ScreenPreview title="DASHBOARD DO MENTOR">
              <div className="ec-blueprint-mini-dashboard">
                <b>Visão geral dos alunos</b>
                <div><strong>28</strong><strong>156</strong><strong>85%</strong></div>
              </div>
            </ScreenPreview>
          </div>
        </Card>
      </section>

      <Card className="ec-blueprint-content-system">
        <h3>6. SISTEMA DE CONTEÚDO</h3>
        <p>Blocos e componentes que constroem as telas</p>
        <div>
          <ContentTile title="Cards"><Dumbbell /><b>Treino A - Força</b><span>Contêiner de informação com ação ou status.</span></ContentTile>
          <ContentTile title="KPIs"><strong>85%</strong><span>Indicadores numéricos com tendência.</span></ContentTile>
          <ContentTile title="Gráficos"><MetricBarChart values={[48, 62, 44, 70, 54, 82, 52]} /></ContentTile>
          <ContentTile title="Listas"><p>✓ Check-in realizado</p><p>✓ Plano atualizado</p><p>✓ Meta batida</p></ContentTile>
          <ContentTile title="CTA"><Button>Iniciar treino</Button><Button variant="secondary">Ver plano</Button></ContentTile>
          <ContentTile title="Calendário"><Calendar /><b>Maio 2024</b><span>Seleção de datas e planejamento.</span></ContentTile>
          <ContentTile title="Badges"><span><em>Novo</em><em>Em dia</em><em>Atenção</em></span></ContentTile>
          <ContentTile title="Progress Rings"><ProgressRing value={76} size={86} /><span>Progresso visual rápido e intuitivo.</span></ContentTile>
        </div>
      </Card>
    </PosterShell>
  )
}

function FlowNode({ item }: { item: readonly [ElementType, string] }) {
  const [Icon, label] = item
  return (
    <div className="ec-blueprint-node">
      <Icon />
      <span>{label}</span>
    </div>
  )
}

function Journey({ items, caption }: { items: readonly (readonly [ElementType, string])[]; caption: string }) {
  return (
    <div className="ec-blueprint-journey">
      {items.map((item, index) => (
        <div className="ec-blueprint-step" key={item[1]}>
          <FlowNode item={item} />
          {index < items.length - 1 && <b>›</b>}
        </div>
      ))}
      <small>{caption}</small>
    </div>
  )
}

function ScreenPreview({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ec-blueprint-screen-preview">
      <strong>{title}</strong>
      {children}
    </div>
  )
}

function ContentTile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ec-blueprint-content-tile">
      <strong>{title}</strong>
      {children}
    </div>
  )
}
