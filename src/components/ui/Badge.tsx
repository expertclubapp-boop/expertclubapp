type BadgeColor = 'lime' | 'sky' | 'purple' | 'yellow' | 'red' | 'green' | 'violet'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
}

const colorStyles: Record<BadgeColor, string> = {
  lime: 'bg-accent-lime/10 border-accent-lime/[0.22] text-accent-lime',
  sky: 'bg-accent-sky/10 border-accent-sky/[0.22] text-accent-sky',
  purple: 'bg-accent-purple/10 border-accent-purple/[0.22] text-accent-purple',
  violet: 'bg-ec-violet/10 border-ec-violet/[0.22] text-ec-violet',
  yellow: 'bg-accent-yellow/10 border-accent-yellow/[0.22] text-accent-yellow',
  red: 'bg-accent-red/10 border-accent-red/[0.22] text-accent-red',
  green: 'bg-accent-green/10 border-accent-green/[0.22] text-accent-green',
}

export function Badge({ children, color = 'lime', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1
        ec-floating-pill
        rounded-pill border border-white/[0.08]
        text-micro font-bold uppercase tracking-[0.08em]
        font-body
        ${colorStyles[color]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
