import {
  ArrowRight,
  Bell,
  Calendar,
  ClipboardCheck,
  Droplets,
  Dumbbell,
  Flag,
  Search,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  AppShell,
  Button,
  Card,
  DashboardHeader,
  EngagementRankingCard,
  KpiCard,
  LineAreaChart,
  MentorAlertsCard,
  MiniSparkline,
  RecentActivityTable,
  Sidebar,
  mentorKpis,
  mentorNavItems,
} from '../../components/reference/ExpertClubVisualKit'

export function MentorDashboardScreen() {
  return (
    <AppShell
      sidebar={
        <Sidebar
          items={mentorNavItems}
          footer={
            <div className="ec-mentor-sidebar-footer">
              <Card className="ec-mentor-profile">
                <div className="ec-ref-avatar ec-ref-avatar--2" />
                <div>
                  <strong>Rodrigo Ferreira</strong>
                  <span>Mentor</span>
                </div>
              </Card>
              <Card className="ec-mentor-plan">
                <Sparkles />
                <div>
                  <strong>Plano Expert Pro</strong>
                  <span>Renova em 12/06/2024</span>
                </div>
              </Card>
            </div>
          }
        />
      }
    >
      <DashboardHeader
        title="Visão geral"
        subtitle="Olá, Rodrigo! Aqui está o resumo do seu acompanhamento."
        actions={
          <div className="ec-ref-dashboard-actions">
            <Button variant="ghost" icon={<Calendar size={16} />}>12 mai – 18 mai, 2024</Button>
            <Button variant="ghost">Todos os alunos</Button>
            <button type="button" className="ec-ref-icon-button" aria-label="Buscar"><Search size={24} /></button>
            <button type="button" className="ec-ref-icon-button" aria-label="Alertas"><Bell size={24} /><span className="ec-ref-badge">3</span></button>
          </div>
        }
      />

      <div className="ec-mentor-kpis">
        {mentorKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="ec-mentor-grid">
        <Card className="ec-mentor-chart-card">
          <div className="ec-ref-card-head">
            <h2>Adesão dos alunos ao longo do tempo <span>ⓘ</span></h2>
            <Button variant="ghost">Adesão (%)</Button>
          </div>
          <LineAreaChart />
        </Card>

        <MentorAlertsCard />

        <Card soft className="ec-mentor-quick-card">
          <h2><Sparkles /> Ações rápidas</h2>
          <p>Atalhos para as suas principais ações.</p>
          <Button icon={<ArrowRight size={16} />}><ClipboardCheck size={18} /> Revisar check-ins</Button>
          <Button variant="ghost" icon={<ArrowRight size={16} />}><Flag size={18} /> Atualizar planos</Button>
        </Card>

        <RecentActivityTable />
        <EngagementRankingCard />

        <aside className="ec-mentor-side-metrics">
          <SideMetric icon={<Droplets />} title="Hidratação média" value="2,1" suffix="L/dia" trend="↑ 0,3 L vs. semana passada" />
          <SideMetric icon={<Smartphone />} title="Frequência no app" value="4,2" suffix="dias/sem" trend="↑ 0,6 vs. semana passada" />
          <SideMetric icon={<Dumbbell />} title="Conclusão de treinos" value="76%" suffix="" trend="↑ 7 p.p. vs. semana passada" />
        </aside>
      </div>

      <Card soft className="ec-mentor-tip">
        <Sparkles />
        <div>
          <h2>Dica do mentor</h2>
          <p>Parabéns! Sua adesão média está acima da média da plataforma. Continue incentivando a consistência dos seus alunos.</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={16} />}>Ver insights detalhados</Button>
      </Card>
    </AppShell>
  )
}

function SideMetric({
  icon,
  title,
  value,
  suffix,
  trend,
}: {
  icon: ReactNode
  title: string
  value: string
  suffix: string
  trend: string
}) {
  return (
    <Card className="ec-mentor-side-card">
      <div>{icon}</div>
      <strong>{title}</strong>
      <p><b>{value}</b> {suffix}</p>
      <span>{trend}</span>
      <MiniSparkline />
    </Card>
  )
}
