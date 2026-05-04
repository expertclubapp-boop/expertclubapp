export interface FilterChipProps {
  label: string
  isSelected?: boolean
  onClick: () => void
  icon?: React.ReactNode
}

export function FilterChip({ label, isSelected, onClick, icon }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-11 px-5 py-2 rounded-full font-display text-[12px] font-bold uppercase tracking-widest
        flex items-center gap-2 whitespace-nowrap transition-all duration-200 active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ec-violet/50
        ${
          isSelected
            ? 'ec-premium-cta text-bg-primary'
            : 'ec-glass text-text-muted hover:text-text-primary'
        }
      `}
    >
      {icon}
      {label}
    </button>
  )
}
