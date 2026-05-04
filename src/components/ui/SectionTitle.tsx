interface SectionTitleProps {
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function SectionTitle({ children, icon, className = '' }: SectionTitleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon}
      <h3 className="text-ui-label text-white/80 uppercase tracking-widest font-body">
        {children}
      </h3>
    </div>
  )
}
