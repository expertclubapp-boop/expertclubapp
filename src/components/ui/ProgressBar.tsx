type BarColor = 'lime' | 'sky' | 'purple' | 'red' | 'yellow' | 'orange' | 'violet'

interface ProgressBarProps {
  value: number
  max?: number
  color?: BarColor
  height?: number
  className?: string
  showLabel?: boolean
}

const colorMap: Record<BarColor, string> = {
  lime: 'bg-accent-lime',
  sky: 'bg-accent-sky',
  purple: 'bg-accent-purple',
  violet: 'bg-ec-violet',
  red: 'bg-accent-red/70',
  yellow: 'bg-accent-yellow',
  orange: 'bg-accent-orange',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'violet',
  height = 6,
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full rounded-pill overflow-hidden bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full rounded-pill transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${colorMap[color]} shadow-[0_0_18px_currentColor]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-code-data text-text-muted mt-1 block text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
