import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarCheck,
  Flame,
  Heart,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  AppShell,
  Button,
  Card,
  ChallengeCard,
  DashboardHeader,
  HydrationCard,
  MetricBarChart,
  MiniSparkline,
  ProgressRing,
  RankingCard,
  Sidebar,
  StudentTodayPlanCard,
  studentNavItems,
} from '../../components/reference/ExpertClubVisualKit'

export function StudentDashboardScreen() {
  return (
    <AppShell
      sidebar={
        <Sidebar
          items={studentNavItems}
          footer={
            <Card soft className="ec-student-invite">
              <h3>Convide uma amiga</h3>
              <p>Ganhe 200 XP para cada amiga que entrar no Expert Club!</p>
              <div className="ec-student-invite-art" aria-hidden="true">
                <i />
                <i />
              </div>
              <Button>Convidar agora</Button>
            </Card>
          }
        />
      }
    >
      <DashboardHeader
        title={<>Olá, Mariana 👋</>}
        subtitle="Seu foco de hoje constrói a sua melhor versão de amanhã."
        actions={
          <div className="ec-ref-dashboard-actions">
            <Button variant="ghost" icon={<ArrowRight size={16} />}>Ver plano completo</Button>
            <button type="button" className="ec-ref-icon-button" aria-label="Notificações">
              <Bell size={24} />
              <span className="ec-student-notification-dot" />
            </button>
            <div className="ec-ref-avatar ec-ref-avatar--1" aria-label="Foto de Mariana" />
          </div>
        }
      />

      <div className="ec-student-grid">
        <StudentTodayPlanCard />
        <HydrationCard />

        <Card className="ec-student-week-card">
          <div className="ec-ref-card-head">
            <h2><Sparkles /> Evolução da semana</h2>
            <span>•••</span>
          </div>
          <ProgressRing value={76} size={112} label="76%" />
          <p>treinos concluídos</p>
          <MetricBarChart values={[48, 62, 42, 61, 75, 72, 58]} />
          <strong>↗ +12% vs. semana passada</strong>
        </Card>

        <RankingCard />
        <ChallengeCard />

        <Card className="ec-student-agenda">
          <div className="ec-ref-card-head">
            <h2><Calendar /> Sua agenda</h2>
          </div>
          <div className="ec-student-calendar-row">
            {['Sex 10', 'Sáb 11', 'Dom 12', 'Seg 13', 'Ter 14', 'Qua 15', 'Qui 16'].map((day, index) => (
              <button type="button" key={day} className={index === 0 ? 'is-active' : ''}>
                <span>{day.split(' ')[0]}</span>
                <b>{day.split(' ')[1]}</b>
              </button>
            ))}
          </div>
          <div className="ec-student-agenda-list">
            <p><Zap size={18} /> Treino A - Força <span>07:00</span></p>
            <p><Heart size={18} /> Plano de refeições <span>Almoço</span></p>
            <p><CalendarCheck size={18} /> Check-in diário <span>20:00</span></p>
          </div>
        </Card>

        <Card className="ec-student-checkin">
          <div className="ec-ref-card-head">
            <h2><CalendarCheck /> Próximo check-in</h2>
          </div>
          <div>
            <strong>Domingo, 12 de maio</strong>
            <b>20:00</b>
            <span>↣ Faltam 2 dias</span>
          </div>
          <aside>
            <h3>Prepare-se!</h3>
            <p>Responda com atenção e mantenha seus dados sempre atualizados.</p>
          </aside>
        </Card>

        <Card className="ec-student-mini-card">
          <h3><Flame /> Sequência</h3>
          <strong>12 <span>dias</span></strong>
          <p>Melhor: 28 dias</p>
          <MiniSparkline />
        </Card>
        <Card className="ec-student-mini-card">
          <h3><Moon /> Sono</h3>
          <strong>7h 30m</strong>
          <p><i /> Qualidade: Boa</p>
          <MetricBarChart values={[30, 55, 42, 68, 48, 76]} labels={['', '', '', '', '', '']} />
        </Card>
        <Card className="ec-student-mini-card ec-student-mini-card--split">
          <div>
            <h3><Heart /> Bem-estar</h3>
            <strong>8,5 <span>/ 10</span></strong>
            <p>🙂 Muito bem!</p>
          </div>
          <span><Sparkles /></span>
        </Card>
        <Card className="ec-student-mini-card ec-student-mini-card--split">
          <div>
            <h3><Zap /> Energia</h3>
            <strong>Alta</strong>
            <p>Pronta para o dia!</p>
          </div>
          <span><Zap /></span>
        </Card>
      </div>
    </AppShell>
  )
}
