import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, Users, Target, Activity, AlertCircle, 
  TrendingUp, BarChart2, Zap,
  ChevronRight
} from 'lucide-react'
import { useLaunchOps } from '../../hooks/admin/useLaunchOps'
import type { LaunchDateRange } from '../../services/adminLaunchService'
import { V2Card, V2IconBubble, V2Badge, V2Button, V2Avatar, cx } from '../../components/v2/ExpertClubV2Base'
import { V2StatCard } from '../../components/v2/ExpertClubStatCard'

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
      <div className="p-12 text-center bg-red-500/10 rounded-3xl border border-red-500/20 w-full max-w-4xl mx-auto">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-black italic text-white uppercase mb-2">Erro de Permissão</h2>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <div className="flex justify-center gap-4">
           <V2Button variant="secondary" onClick={() => window.location.reload()}>TENTAR NOVAMENTE</V2Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* RANGE FILTERS */}
      <div className="flex justify-end">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' },
            { id: 'month', label: 'Mês' },
            { id: 'all', label: 'Total' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as LaunchDateRange)}
              className={cx(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                range === r.id 
                  ? "bg-white text-black" 
                  : "text-text-muted hover:text-white hover:bg-white/5"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <V2StatCard 
          label="Receita Confirmada" 
          value={formatCurrency(metrics.revenueConfirmed)} 
          icon={DollarSign}
          tone="success"
        />
        <V2StatCard 
          label="MRR Estimado" 
          value={formatCurrency(metrics.estimatedMrr)} 
          icon={TrendingUp}
          tone="info"
        />
        <V2StatCard 
          label="Assinaturas Ativas" 
          value={metrics.activeSubscriptions.toString()} 
          icon={Users}
          tone="violet"
        />
        <V2StatCard 
          label="Pag. Aprovados" 
          value={metrics.approvedPayments.toString()} 
          icon={Target}
          tone="success"
        />
        <V2StatCard 
          label="Checkouts Criados" 
          value={metrics.checkoutCount.toString()} 
          icon={Activity}
          tone="neutral"
        />
        <V2StatCard 
          label="Comissão a Pagar" 
          value={formatCurrency(metrics.commissionBalance)} 
          icon={DollarSign}
          tone="warning"
        />
      </section>

      {/* CONVERSION FUNNEL */}
      <V2Card className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <V2IconBubble icon={BarChart2} tone="success" size={16} />
          <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Funil de Conversão</h3>
        </div>
        <div className="flex flex-col lg:flex-row justify-between relative gap-4 lg:gap-0">
          <FunnelStep title="Checkout Criado" value={metrics.checkoutCount} total={metrics.checkoutCount} />
          <FunnelDivider value={metrics.checkoutCount > 0 ? (metrics.approvedPayments / metrics.checkoutCount) * 100 : 0} />
          <FunnelStep title="Pag. Aprovado" value={metrics.approvedPayments} total={metrics.checkoutCount} highlight />
          <FunnelDivider value={metrics.approvedPayments > 0 ? (metrics.onboardingCompleted / metrics.approvedPayments) * 100 : 0} />
          <FunnelStep title="Onboarding" value={metrics.onboardingCompleted} total={metrics.checkoutCount} />
          <FunnelDivider value={metrics.onboardingCompleted > 0 ? (metrics.firstWorkoutCompleted / metrics.onboardingCompleted) * 100 : 0} />
          <FunnelStep title="Uso Ativo (7d)" value={metrics.firstWorkoutCompleted} total={metrics.checkoutCount} tone="info" />
        </div>
      </V2Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* AFFILIATES TABLE */}
        <div className="xl:col-span-8">
          <V2Card className="p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <V2IconBubble icon={Users} tone="violet" size={16} />
                <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Top Afiliadas</h3>
              </div>
              <V2Button variant="secondary" className="text-[10px] h-8 px-4" onClick={() => navigate('/admin/affiliates')}>VER TODAS</V2Button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] uppercase text-text-muted tracking-widest font-black">
                    <th className="p-6">Afiliada</th>
                    <th className="p-6 text-center">Checkouts</th>
                    <th className="p-6 text-center">Assinaturas</th>
                    <th className="p-6 text-right">Saldo</th>
                    <th className="p-6 text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {affiliateRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-text-muted italic">Nenhuma atividade registrada.</td>
                    </tr>
                  ) : (
                    affiliateRows.slice(0, 10).map(row => (
                      <tr key={row.affiliateId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <V2Avatar uid={row.affiliateId} name={row.affiliateName} size="sm" />
                            <div>
                              <p className="font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{row.affiliateName}</p>
                              <p className="text-[9px] text-text-muted font-bold tracking-widest uppercase">{row.referralCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center font-black italic text-white">{row.checkouts}</td>
                        <td className="p-6 text-center">
                          <V2Badge tone="success">{row.activeSubscriptions}</V2Badge>
                        </td>
                        <td className="p-6 text-right font-black italic text-accent-yellow">{formatCurrency(row.commissionBalance)}</td>
                        <td className="p-6 text-right font-black italic text-ec-violet">{formatPercent(row.conversionRate || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </V2Card>
        </div>

        {/* SIDEBAR: ALERTS & ACTIVITY */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          
          {/* ALERTS */}
          <V2Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <V2IconBubble icon={AlertCircle} tone="warning" size={16} />
              <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Alertas Operacionais</h3>
            </div>
            
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Operação Normal
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <h4 className="text-yellow-500 text-[10px] font-black italic uppercase mb-1">{alert.title}</h4>
                    <p className="text-text-muted text-[10px]">{alert.description}</p>
                  </div>
                ))
              )}
            </div>
          </V2Card>

          {/* ACTIVITY */}
          <V2Card className="p-6">
             <div className="flex items-center gap-2 mb-6">
                <V2IconBubble icon={Zap} tone="violet" size={16} />
                <h3 className="text-xs font-black italic text-white uppercase tracking-widest">Atividade Recente</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <ActivityMiniCard label="Vendas" value={metrics.approvedPayments} />
                <ActivityMiniCard label="Checkouts" value={metrics.checkoutCount} />
             </div>
          </V2Card>
        </div>
      </div>
    </div>
  )
}

function FunnelStep({ title, value, total, highlight, tone }: { title: string; value: number; total: number; highlight?: boolean; tone?: any }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className={cx(
      "flex flex-col items-center flex-1 py-4 px-2 rounded-xl border transition-all",
      highlight ? "bg-ec-violet/10 border-ec-violet/30 ring-1 ring-ec-violet/20" : "bg-white/5 border-white/5"
    )}>
      <span className="text-2xl font-black italic text-white mb-1">{value}</span>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center mb-2">{title}</span>
      {total > 0 && <V2Badge tone={tone || (highlight ? 'violet' : 'neutral')} className="text-[9px]">{pct.toFixed(0)}%</V2Badge>}
    </div>
  )
}

function FunnelDivider({ value }: { value: number }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-2">
      <ChevronRight className="w-6 h-6 text-white/20 mb-1" />
      <span className="text-[9px] font-bold text-text-muted">{value.toFixed(0)}%</span>
    </div>
  )
}

function ActivityMiniCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{label}</span>
      <span className="text-xl font-black italic text-white">{value}</span>
    </div>
  )
}
