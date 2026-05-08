import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { V2Card, V2IconBubble, cx, type Tone } from './ExpertClubV2Base'

// === KPI / STAT CARD ===
export interface V2StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: string
  danger?: boolean
  warning?: boolean
  tone?: Tone
  className?: string
}

export function V2StatCard({
  icon,
  label,
  value,
  trend,
  danger = false,
  warning = false,
  tone,
  className
}: V2StatCardProps) {
  const finalTone = tone || (danger ? 'danger' : warning ? 'warning' : 'violet')
  
  return (
    <V2Card className={cx('ec-v2-kpi p-5 flex flex-col gap-3', className)}>
      <V2IconBubble icon={icon} tone={finalTone} />
      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <strong className="text-2xl font-black text-white italic">{value}</strong>
      {trend && (
        <p className="flex items-center gap-2">
          <span className={cx(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            danger ? 'bg-red-500/10 text-red-400' : warning ? 'bg-amber-500/10 text-amber-400' : 'bg-accent-lime/10 text-accent-lime'
          )}>
            {danger ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
            {trend}
          </span>
          <small className="text-[9px] text-text-muted font-medium uppercase tracking-tighter">vs. período anterior</small>
        </p>
      )}
    </V2Card>
  )
}

// === PROGRESS CARD ===
export function V2ProgressCard({
  title,
  subtitle,
  progress,
  total,
  unit,
  className
}: {
  title: string
  subtitle: string
  progress: number
  total: number
  unit: string
  className?: string
}) {
  const percent = Math.round((progress / total) * 100)
  
  return (
    <V2Card className={cx('ec-v2-progress-card p-6', className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <p className="text-text-muted text-xs">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black text-white italic leading-none">{percent}%</span>
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{progress} / {total} {unit}</span>
        </div>
      </div>
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-ec-violet h-full rounded-full transition-all duration-700" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </V2Card>
  )
}
