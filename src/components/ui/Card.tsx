interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'standard' | 'glass' | 'dashed' | 'hero'
  glowColor?: 'lime' | 'sky' | 'purple'
  onClick?: () => void
}

const variantStyles: Record<string, string> = {
  standard: 'ec-card',
  glass: 'ec-glass',
  dashed: 'card-dashed',
  hero: 'ec-hero-shell',
}

const glowStyles: Record<string, string> = {
  lime: 'glow-lime',
  sky: 'glow-sky',
  purple: 'glow-purple',
}

export function Card({
  children,
  className = '',
  variant = 'standard',
  glowColor,
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        rounded-card p-space-5
        ${variantStyles[variant]}
        ${glowColor ? glowStyles[glowColor] : ''}
        ${onClick ? 'ec-card-hover cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
