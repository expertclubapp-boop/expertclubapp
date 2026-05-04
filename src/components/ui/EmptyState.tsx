import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-space-12 px-space-6 ${className}`}
    >
      {icon && (
        <div className="text-white/15 mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-body-md font-semibold text-text-secondary mb-2 text-center">
        {title}
      </h4>
      <p className="text-[13px] text-text-muted text-center max-w-[260px] leading-relaxed">
        {description}
      </p>
      {ctaLabel && onCtaClick && (
        <div className="mt-4">
          <Button variant="primary" fullWidth={false} onClick={onCtaClick}>
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
