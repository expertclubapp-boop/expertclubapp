interface ActionCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  ctaLabel?: string
  onCtaClick?: () => void
  variant?: 'standard' | 'dashed' | 'hero'
  accentColor?: string
  children?: React.ReactNode
  className?: string
}

export function ActionCard({
  title,
  description,
  icon,
  ctaLabel,
  onCtaClick,
  variant = 'standard',
  accentColor = 'text-accent-lime',
  children,
  className = '',
}: ActionCardProps) {
  const variantStyles = {
    standard: 'ec-card',
    dashed: 'border-2 border-dashed border-accent-lime/20 bg-accent-lime/[0.04]',
    hero: 'ec-hero-shell transition-all relative overflow-hidden',
  }

  return (
    <div
      className={`rounded-card p-5 ${variantStyles[variant]} ${onCtaClick ? 'ec-card-hover' : ''} ${className}`}
    >
      <div className="flex items-center gap-5">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-display text-heading-3 font-semibold ${accentColor} mb-1`}>
            {title}
          </h3>
          <p className="text-body-sm text-white/60 mb-3 line-clamp-2">{description}</p>
          {ctaLabel && onCtaClick && (
            <button
              onClick={onCtaClick}
              className="text-white font-body text-ui-label-lg font-bold flex items-center gap-2 hover:translate-x-1 transition-transform uppercase tracking-widest"
            >
              {ctaLabel} →
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
