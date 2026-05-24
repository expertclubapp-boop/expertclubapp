import { useEffect, useState } from 'react'
import { BarChart3, CreditCard, TrendingDown, UserPlus, Users, WalletCards } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { adminMetricsService, type AdminMetrics } from '../../services/adminMetricsService'

export function AdminDashboardScreen() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminMetricsService.getDashboard()
      .then(setMetrics)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading || !metrics) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
      </div>
    )
  }

  return (
    <PageShell wide>
      <header className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-accent-lime">Painel do dono</p>
        <h1 className="font-display text-h1 font-black uppercase italic text-white">Admin OS</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CreditCard />} label="Receita mensal estimada" value={`R$ ${metrics.estimatedMrr.toFixed(2)}`} />
        <Metric icon={<Users />} label="Alunos ativos" value={metrics.activeStudents} />
        <Metric icon={<UserPlus />} label="Novos alunos" value={metrics.newStudents} />
        <Metric icon={<TrendingDown />} label="Cancelados" value={metrics.cancelledSubscriptions} />
        <Metric icon={<BarChart3 />} label="Assinaturas pendentes" value={metrics.pendingSubscriptions} />
        <Metric icon={<Users />} label="Alunos bloqueados" value={metrics.blockedStudents} />
        <Metric icon={<WalletCards />} label="Comissões pendentes" value={`R$ ${metrics.pendingCommissions.toFixed(2)}`} />
        <Metric icon={<WalletCards />} label="Comissões aprovadas" value={`R$ ${metrics.approvedCommissions.toFixed(2)}`} />
        <Metric icon={<WalletCards />} label="Comissões pagas" value={`R$ ${metrics.paidCommissions.toFixed(2)}`} />
        <Metric icon={<BarChart3 />} label="Check-ins na semana" value={metrics.dailyCheckinsWeek} />
        <Metric icon={<BarChart3 />} label="Evoluções no mês" value={metrics.bodyCheckinsMonth} />
        <Metric icon={<BarChart3 />} label="Treinos concluídos" value={metrics.completedWorkoutsWeek} />
        <Metric icon={<BarChart3 />} label="Aderência média" value={metrics.averageDietAdherence === null ? 'Sem dados' : `${metrics.averageDietAdherence}%`} />
      </div>

      {metrics.queryWarnings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-accent-yellow/25 bg-accent-yellow/8 p-4 text-sm text-accent-yellow">
          Métricas parciais: {metrics.queryWarnings.join(' ')}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="ec-card rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold uppercase italic text-white">Status das assinaturas</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(metrics.subscriptionStatus).map(([status, count]) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-xs font-bold text-text-muted">
                  <span>{statusLabel(status)}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-accent-lime" style={{ width: `${Math.min(100, count * 12)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ec-card rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold uppercase italic text-white">Top afiliadas</h2>
          <div className="mt-5 space-y-3">
            {metrics.topAffiliates.map(affiliate => (
              <div key={affiliate.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">
                <div>
                  <p className="text-sm font-bold text-white">{affiliate.name}</p>
                  <p className="text-[10px] text-text-muted">{affiliate.email}</p>
                </div>
                <p className="text-xs font-bold text-accent-lime">R$ {(affiliate.totalCommissionPaid + affiliate.pendingCommission).toFixed(2)}</p>
              </div>
            ))}
            {metrics.topAffiliates.length === 0 && <p className="text-sm text-text-muted">Nenhuma afiliada com comissão ainda.</p>}
          </div>
        </section>
        <section className="ec-card rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold uppercase italic text-white">Uso do app</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Usage label="Treinos" value={metrics.appUsage.workouts} />
            <Usage label="Dietas" value={metrics.appUsage.diets} />
            <Usage label="Check-ins" value={metrics.appUsage.checkins} />
            <Usage label="Água" value={metrics.appUsage.hydration} />
          </div>
          {Object.values(metrics.appUsage).every(v => v === 0) && (
            <p className="mt-4 text-sm text-text-muted">Começaremos a mostrar esta métrica quando houver dados suficientes.</p>
          )}
        </section>
      </div>
    </PageShell>
  )
}

function Usage({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p><p className="font-display text-2xl font-black italic text-white">{value}</p></div>
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2 text-text-muted [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativas',
    trialing: 'Em teste',
    pending: 'Pendentes',
    past_due: 'Atrasadas',
    cancelled: 'Canceladas',
    expired: 'Expiradas',
  }
  return labels[status] || status
}
