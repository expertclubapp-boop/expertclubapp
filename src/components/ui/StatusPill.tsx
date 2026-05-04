type StatusColor = 'lime' | 'sky' | 'purple' | 'yellow' | 'red' | 'green'

interface StatusPillProps {
  label: string
  color?: StatusColor
  className?: string
}

const colorMap: Record<StatusColor, { bg: string; border: string; text: string }> = {
  lime: { bg: 'bg-accent-lime/10', border: 'border-accent-lime/[0.22]', text: 'text-accent-lime' },
  sky: { bg: 'bg-accent-sky/[0.08]', border: 'border-accent-sky/[0.18]', text: 'text-accent-sky' },
  purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/[0.22]', text: 'text-accent-purple' },
  yellow: { bg: 'bg-accent-yellow/10', border: 'border-accent-yellow/[0.22]', text: 'text-accent-yellow' },
  red: { bg: 'bg-accent-red/10', border: 'border-accent-red/[0.22]', text: 'text-accent-red' },
  green: { bg: 'bg-accent-green/10', border: 'border-accent-green/[0.22]', text: 'text-accent-green' },
}

export function StatusPill({ label, color = 'lime', className = '' }: StatusPillProps) {
  const styles = colorMap[color]
  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        ec-floating-pill
        rounded-pill border border-white/[0.08]
        text-micro font-bold uppercase tracking-[0.12em]
        font-body
        ${styles.bg} ${styles.border} ${styles.text}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
