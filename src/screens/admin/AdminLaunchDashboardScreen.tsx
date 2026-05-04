import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, Users, Target, Activity, AlertCircle, 
  TrendingUp, ChevronRight, BarChart2, Zap 
} from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useLaunchOps } from '../../hooks/admin/useLaunchOps'
import type { LaunchDateRange } from '../../services/adminLaunchService'

export function AdminLaunchDashboardScreen() {
  const navigate = useNavigate()
  const [range, setRange] = useState<LaunchDateRange>('all')
  const { metrics, affiliateRows, alerts, isLoading, error } = useLaunchOps(range)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${Number(value || 0).toFixed(1)}%`
  }

  if (error) {
    return (
      <PageShell wide>
        <div className="p-8 text-center text-accent-red bg-accent-red/10 rounded-2xl border border-accent-red/20">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro ao carregar Dashboard</h2>
          <p className="text-sm">{error}</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell wide>
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-white uppercase italic tracking-tight mb-2">
            Lançamento Fundador
          </h1>
          <p className="text-sm text-text-muted">Acompanhe vendas, alunos, afiliadas e uso real do Expert Club.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7d', label: '7 dias' },
            { id: '30d', label: '30 dias' },
            { id: 'month', label: 'Mês Atual' },
            { id: 'all', label: 'Desde Lançamento' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as LaunchDateRange)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                range === r.id 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-text-muted border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
        </div>
      ) : metrics ? (
        <div className="space-y-6">

          {/* LINE 1: KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard title="Receita Confirmada" value={formatCurrency(metrics.revenueConfirmed)} icon={<DollarSign className="w-4 h-4 text-accent-lime" />} />
            <KpiCard title="Receita Mensal Estimada" value={formatCurrency(metrics.estimatedMrr)} icon={<TrendingUp className="w-4 h-4 text-accent-sky" />} />
            <KpiCard title="Assinaturas Ativas" value={metrics.activeSubscriptions.toString()} icon={<Users className="w-4 h-4 text-white" />} />
            <KpiCard title="Pagamentos Aprov" value={metrics.approvedPayments.toString()} icon={<Target className="w-4 h-4 text-accent-purple" />} />
            <KpiCard title="Checkouts Criados" value={metrics.checkoutCount.toString()} icon={<Activity className="w-4 h-4 text-text-muted" />} />
            <KpiCard title="Comissão a Pagar" value={formatCurrency(metrics.commissionBalance)} icon={<DollarSign className="w-4 h-4 text-accent-yellow" />} />
          </section>

          {/* LINE 2: FUNNEL */}
          <section className="ec-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent-lime" /> Funil de Conversão
              </h3>
            </div>
            <div className="flex flex-col md:flex-row justify-between relative">
              {/* Funnel Steps */}
              <FunnelStep title="Checkout Criado" value={metrics.checkoutCount} total={metrics.checkoutCount} />
              <FunnelDivider value={metrics.checkoutCount > 0 ? (metrics.approvedPayments / metrics.checkoutCount) * 100 : 0} />
              <FunnelStep title="Pag. Aprovado" value={metrics.approvedPayments} total={metrics.checkoutCount} highlight />
              <FunnelDivider value={metrics.approvedPayments > 0 ? (metrics.onboardingCompleted / metrics.approvedPayments) * 100 : 0} />
              <FunnelStep title="Onboarding Completo" value={metrics.onboardingCompleted} total={metrics.checkoutCount} />
              <FunnelDivider value={metrics.onboardingCompleted > 0 ? (metrics.firstWorkoutCompleted / metrics.onboardingCompleted) * 100 : 0} />
              <FunnelStep title="Uso do App (7d)" value={metrics.firstWorkoutCompleted} total={metrics.checkoutCount} color="sky" />
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              
              {/* LINE 3: AFFILIATES */}
              <section className="ec-card rounded-2xl p-6 overflow-hidden flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent-purple" /> Top Afiliadas
                  </h3>
                  <Button variant="ghost" className="text-xs py-1.5" onClick={() => navigate('/admin/affiliates')}>Ver Todas</Button>
                </div>
                
                {affiliateRows.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted p-10 border border-dashed border-white/10 rounded-xl">
                    Nenhuma afiliada gerou checkouts neste período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase text-text-muted tracking-wider">
                          <th className="pb-3 font-bold">Afiliada</th>
                          <th className="pb-3 font-bold text-center">Checkouts</th>
                          <th className="pb-3 font-bold text-center">Assinaturas</th>
                          <th className="pb-3 font-bold text-right">Comissão Paga</th>
                          <th className="pb-3 font-bold text-right">Saldo</th>
                          <th className="pb-3 font-bold text-right">Conversão</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {affiliateRows.slice(0, 10).map(row => (
                          <tr key={row.affiliateId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-4">
                              <p className="font-bold text-white">{row.affiliateName}</p>
                              <p className="text-[10px] text-text-muted font-mono">{row.referralCode}</p>
                            </td>
                            <td className="py-4 text-center font-bold text-white">{row.checkouts}</td>
                            <td className="py-4 text-center"><Badge color="lime">{row.activeSubscriptions}</Badge></td>
                            <td className="py-4 text-right text-text-secondary">{formatCurrency(row.commissionPaid)}</td>
                            <td className="py-4 text-right font-bold text-accent-yellow">{formatCurrency(row.commissionBalance)}</td>
                            <td className="py-4 text-right text-accent-sky font-bold text-xs">{formatPercent(row.conversionRate || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              
            </div>

            {/* RIGHT COLUMN */}
            <div className="xl:col-span-4 flex flex-col gap-6">

              {/* LINE 5: ALERTS */}
              <section className="ec-card rounded-2xl p-6">
                <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-accent-yellow" /> Alertas Operacionais
                </h3>
                
                {alerts.length === 0 ? (
                  <div className="text-sm text-text-muted p-4 border border-dashed border-white/10 rounded-xl text-center">
                    Tudo operando dentro da normalidade.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`p-4 rounded-xl border ${
                        alert.severity === 'critical' ? 'bg-accent-red/10 border-accent-red/20' : 
                        alert.severity === 'warning' ? 'bg-accent-yellow/10 border-accent-yellow/20' : 
                        'bg-white/5 border-white/10'
                      }`}>
                        <h4 className={`font-bold text-sm mb-1 ${
                          alert.severity === 'critical' ? 'text-accent-red' : 
                          alert.severity === 'warning' ? 'text-accent-yellow' : 
                          'text-white'
                        }`}>{alert.title}</h4>
                        <p className="text-xs text-text-secondary mb-3">{alert.description}</p>
                        {alert.actionLabel && alert.actionHref && (
                          <button onClick={() => navigate(alert.actionHref!)} className="text-[10px] font-bold uppercase tracking-wider underline hover:text-white transition-colors">
                            {alert.actionLabel}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* LINE 4: APP ACTIVITY */}
              <section className="ec-card rounded-2xl p-6">
                <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-accent-sky" /> Uso do App (Últimos 7 dias)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <ActivityMiniCard label="Treinos" value={metrics.workoutSessions7d} />
                  <ActivityMiniCard label="Dias Dieta" value={metrics.dietDays7d} />
                  <ActivityMiniCard label="Check-ins" value={metrics.dailyCheckins7d} />
                  <ActivityMiniCard label="Onboarding" value={metrics.onboardingCompleted} />
                </div>
              </section>

              {/* QUICK ACTIONS */}
              <section className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start py-3 border border-white/10 bg-black hover:bg-white/5" onClick={() => navigate('/admin/subscriptions')}>Gerenciar Assinaturas</Button>
                <Button variant="ghost" className="w-full justify-start py-3 border border-white/10 bg-black hover:bg-white/5" onClick={() => navigate('/admin/users')}>Pesquisar Alunos</Button>
                <Button variant="ghost" className="w-full justify-start py-3 border border-white/10 bg-black hover:bg-white/5" onClick={() => navigate('/admin/commissions')}>Pagar Comissões</Button>
              </section>
            </div>
          </div>

        </div>
      ) : null}
    </PageShell>
  )
}

function KpiCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="ec-card p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{title}</p>
      </div>
      <p className="font-display text-2xl font-black italic text-white">{value}</p>
    </div>
  )
}

function FunnelStep({ title, value, total, highlight, color }: { title: string; value: number; total: number; highlight?: boolean; color?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className={`flex flex-col items-center flex-1 py-4 px-2 rounded-xl border transition-all ${
      highlight ? 'bg-accent-lime/10 border-accent-lime/30 ring-1 ring-accent-lime/20' : 
      'bg-black/40 border-white/5'
    }`}>
      <span className="text-3xl font-display font-black italic text-white mb-1">{value}</span>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center mb-2">{title}</span>
      {total > 0 && <Badge color={color as any || 'white'} className="text-[9px]">{pct.toFixed(0)}%</Badge>}
    </div>
  )
}

function FunnelDivider({ value }: { value: number }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center px-2">
      <ChevronRight className="w-6 h-6 text-white/20 mb-1" />
      <span className="text-[9px] font-bold text-text-muted">{value.toFixed(0)}%</span>
    </div>
  )
}

function ActivityMiniCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{label}</span>
      <span className="font-display text-2xl font-black italic text-white">{value}</span>
    </div>
  )
}
