import {
  Calendar,
  Check,
  Droplets,
  Dumbbell,
  Heart,
  LineChart,
  MessageCircle,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Utensils,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ExpertLogo,
  Input,
  MetricBarChart,
  MiniSparkline,
  PosterShell,
  ProgressRing,
  Tabs,
  Toggle,
} from '../../components/reference/ExpertClubVisualKit'

const swatches = [
  ['#6C4DFF', 'VIOLETA ELÉTRICO', '#6C4DFF'],
  ['#111318', 'CARVÃO', '#111318'],
  ['#2A2E36', 'GRAFITE', '#2A2E36'],
  ['#FAFAFC', 'OFF WHITE', '#FAFAFC'],
  ['#FFFFFF', 'BRANCO', '#FFFFFF'],
  ['#F1EAFE', 'LILÁS SUAVE', '#F1EAFE'],
  ['#E9E3FF', 'LILÁS CLARO', '#E9E3FF'],
  ['#E9F7F1', 'MINT SUAVE', '#E9F7F1'],
  ['#F4F1ED', 'AREIA', '#F4F1ED'],
  ['#FDE6F1', 'ROSA SUAVE', '#FDE6F1'],
]

const uxPrinciples: Array<[LucideIcon, string, string]> = [
  [UserRound, 'FOCADO NA PESSOA', 'Experiências que se adaptam à jornada única de cada usuário.'],
  [Sparkles, 'INTELIGENTE', 'Dados e IA para recomendações personalizadas e decisões melhores.'],
  [Zap, 'SIMPLIFICADO', 'Interfaces limpas que eliminam ruído e facilitam o que importa.'],
  [Heart, 'MOTIVADOR', 'Design que inspira ação, consistência e bem-estar.'],
  [ShieldCheck, 'CONFIÁVEL', 'Privacidade, segurança e transparência em primeiro lugar.'],
]

export function DesignSystemScreen() {
  return (
    <PosterShell
      page="01"
      eyebrow="Brandbook"
      title={<>BRANDBOOK +<br />DESIGN SYSTEM</>}
      subtitle={<><span>Expert Club</span> by Expert Coaching</>}
      body="Sistema de identidade visual e design para uma experiência inteligente de fitness e bem-estar."
    >
      <section className="ec-brandbook-grid">
        <Card className="ec-brandbook-logo-card">
          <h3>LOGO</h3>
          <small>USO PRINCIPAL</small>
          <ExpertLogo className="ec-ref-logo ec-brandbook-logo" />
          <small>VERSÕES</small>
          <div className="ec-brandbook-logo-versions">
            <span><ExpertLogo className="ec-ref-logo" /></span>
            <span className="is-dark"><ExpertLogo className="ec-ref-logo" /></span>
            <span>EXPERT<br /><b>CLUB</b></span>
          </div>
          <div className="ec-brandbook-logo-rules">
            <div>
              <small>ÁREA DE PROTEÇÃO</small>
              <div><ExpertLogo className="ec-ref-logo" /></div>
            </div>
            <div>
              <small>REDUÇÃO MÍNIMA</small>
              <p>32 px</p>
              <p>24 px</p>
            </div>
          </div>
        </Card>

        <Card className="ec-brandbook-palette-card">
          <h3>PALETA</h3>
          <small>PRIMÁRIAS</small>
          <div className="ec-brandbook-swatches">
            {swatches.map(([color, name, hex]) => (
              <div key={name}>
                <i style={{ background: color }} />
                <strong>{name}</strong>
                <span>{hex}</span>
              </div>
            ))}
          </div>
          <small>SEMÂNTICAS</small>
          <div className="ec-brandbook-semantics">
            <span className="mint">SUCESSO<br />#22C55E</span>
            <span className="amber">ATENÇÃO<br />#F59E0B</span>
            <span className="danger">AVISO<br />#EF4444</span>
            <span className="info">INFO<br />#3B82F6</span>
          </div>
        </Card>

        <Card className="ec-brandbook-type-card">
          <h3>TIPOGRAFIA</h3>
          <div className="ec-brandbook-aa">Aa</div>
          <p><b>Família<br />Inter</b>Moderna, amigável e altamente legível.</p>
          {[
            ['H1', 'Título Principal', '40/48'],
            ['H2', 'Título de Seção', '28/36'],
            ['H3', 'Subtítulo', '20/28'],
            ['Body 1', 'Texto principal', '16/24'],
            ['Body 2', 'Texto secundário', '14/20'],
            ['Caption', 'Legenda / Apoio', '12/16'],
          ].map(([tag, label, size]) => (
            <div className="ec-brandbook-type-row" key={tag}><b>{tag}</b><span>{label}</span><small>{size}</small></div>
          ))}
        </Card>

        <Card className="ec-brandbook-scale-card">
          <h3>ESCALA DE ESPAÇAMENTO</h3>
          <div className="ec-brandbook-space-scale">
            {[4, 8, 12, 16, 24, 32, 40, 48, 64, 96].map((space) => <span key={space} style={{ width: space / 2 + 12, height: space / 2 + 12 }}>{space}</span>)}
          </div>
          <h3>RAIO DE BORDA</h3>
          <div className="ec-brandbook-radius-scale">
            {[4, 8, 12, 16, 24, 999].map((radius) => <span key={radius} style={{ borderRadius: radius === 999 ? 999 : radius }}>{radius === 999 ? 'Pílula' : `${radius} px`}</span>)}
          </div>
          <h3>WIDGETS KPI</h3>
          <div className="ec-brandbook-kpis">
            {['5 /6', '240 min', '12.450 kg', '12 dias'].map((value, index) => (
              <div key={value}>
                <small>{['Treinos esta semana', 'Minutos ativos', 'Carga levantada', 'Streak'][index]}</small>
                <strong>{value}</strong>
                <MiniSparkline />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="ec-brandbook-components">
        <Card>
          <h3>COMPONENTES</h3>
          <small>BOTÕES</small>
          <Button>Botão Primário →</Button>
          <Button variant="secondary">Botão Secundário</Button>
          <a>Texto / Link →</a>
        </Card>
        <Card>
          <small>INPUTS</small>
          <Input label="Default" placeholder="Digite algo..." />
          <Input label="Foco" placeholder="Digite algo..." state="focus" />
          <Input label="Sucesso" placeholder="Meta salva com sucesso!" state="success" />
          <Input label="Erro" placeholder="Digite um valor válido" state="error" />
        </Card>
        <Card>
          <small>TOGGLE / CHECK / RADIO</small>
          <Toggle checked label="Ativo" />
          <Toggle checked={false} label="Inativo" />
          <p><Check size={16} /> Selecionado</p>
          <p><span /> Não selecionado</p>
        </Card>
        <Card>
          <small>TABS</small>
          <Tabs items={['Visão geral', 'Treinos', 'Nutrição']} />
          <Tabs items={['Diário', 'Semanal', 'Mensal']} />
        </Card>
        <Card>
          <small>BADGES / CHIPS</small>
          <Badge tone="danger">Em alta</Badge>
          <Badge>Novo</Badge>
          <Badge>Personalizado</Badge>
          <Badge tone="mint">Concluído</Badge>
        </Card>
        <Card>
          <small>BARRA DE PROGRESSO</small>
          {['Determinação', 'Força', 'Cardio'].map((label, index) => (
            <div className="ec-brandbook-progress-row" key={label}>
              <span>{label}</span><b>{[76, 48, 32][index]}%</b>
              <div className="ec-ref-progress"><i style={{ width: `${[76, 48, 32][index]}%` }} /></div>
            </div>
          ))}
        </Card>
        <Card>
          <small>GRÁFICO</small>
          <MetricBarChart />
        </Card>
        <Card>
          <small>ICONOGRAFIA</small>
          <div className="ec-brandbook-icons">
            {[Dumbbell, LineChart, Heart, ShieldCheck, Calendar, Trophy, MessageCircle, UserRound, Droplets, Moon, Utensils, Settings].map((Icon, index) => (
              <Icon key={index} />
            ))}
          </div>
          <p>Estilo: Linear • 2px • Extremidades arredondadas</p>
        </Card>
      </section>

      <section className="ec-brandbook-previews">
        <Card>
          <h3>DASHBOARD DO ALUNO</h3>
          <div className="ec-brandbook-preview-student">
            <div className="ec-ref-avatar ec-ref-avatar--1" />
            <div><b>Olá, Mariana! 👋</b><span>Pronta para superar seus limites hoje?</span></div>
            <strong>76%</strong>
            <ProgressRing value={76} size={76} />
          </div>
        </Card>
        <Card>
          <h3>DASHBOARD DO MENTOR</h3>
          <div className="ec-brandbook-preview-mentor">
            <div><span>Alunos ativos</span><b>28</b><small>↑ 12%</small></div>
            <div><span>Treinos concluídos</span><b>156</b><small>↑ 8%</small></div>
            <div><span>Adesão média</span><b>85%</b><small>↑ 9%</small></div>
          </div>
        </Card>
        <Card>
          <h3>PRINCÍPIOS DE UX</h3>
          <div className="ec-brandbook-principles">
            {uxPrinciples.map(([Icon, title, body]) => (
              <div key={title}>
                <Icon />
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <footer className="ec-brandbook-footer">
        <span>EXPERT CLUB BY EXPERT COACHING</span>
        <span>BRANDBOOK + DESIGN SYSTEM</span>
        <span>VERSÃO 1.0 • MAIO 2024</span>
      </footer>
    </PosterShell>
  )
}
