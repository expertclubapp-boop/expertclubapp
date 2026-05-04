interface MetricCardProps {
  label: string
  value: string | number
  subLabel?: string
  icon?: React.ReactNode
  color?: 'lime' | 'sky' | 'purple' | 'yellow'
  className?: string
  children?: React.ReactNode
}

export function MetricCard({
  label,
  value,
  subLabel,
  icon,
  color = 'lime',
  className = '',
  children,
}: MetricCardProps) {
  const colorMap = {
    lime: 'text-accent-lime',
    sky: 'text-accent-sky',
    purple: 'text-accent-purple',
    yellow: 'text-accent-yellow',
  }

  return (
    <div className={`ec-card rounded-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-ui-label text-white/80 uppercase tracking-widest font-body">
          {label}
        </h3>
        {icon && <span className={colorMap[color]}>{icon}</span>}
      </div>
      <div className="flex flex-col items-center mb-4">
        <span className={`font-display text-heading-2 font-semibold ${colorMap[color]}`}>
          {value}
        </span>
        {subLabel && (
          <span className="text-micro text-white/40 uppercase tracking-widest">
            {subLabel}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
