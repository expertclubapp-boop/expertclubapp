import React, { type ReactNode, type CSSProperties } from 'react'
import { LucideIcon, Dumbbell } from 'lucide-react'

export type Tone = 'violet' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pink'

export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

// === BUTTON ===
export interface V2ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}

export function V2Button({
  children,
  variant = 'secondary',
  icon,
  className,
  onClick,
  disabled,
  type = 'button',
  title
}: V2ButtonProps) {
  return (
    <button 
      type={type} 
      className={cx('ec-v2-btn', `ec-v2-btn--${variant}`, className)} 
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={title}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}

// === CARD ===
export function V2Card({ children, className, id, onClick }: { children: ReactNode; className?: string; id?: string; onClick?: () => void }) {
  return (
    <section 
      id={id} 
      className={cx('ec-v2-card', className)} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </section>
  )
}

// === ICON BUBBLE ===
export function V2IconBubble({ icon: Icon, tone = 'violet', size = 20, className }: { icon: LucideIcon; tone?: Tone; size?: number; className?: string }) {
  return (
    <span className={cx('ec-v2-icon-bubble', `ec-v2-icon-bubble--${tone}`, className)}>
      <Icon aria-hidden="true" size={size} />
    </span>
  )
}

// === BADGE ===
export function V2Badge({ children, tone = 'violet', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cx('ec-v2-badge', `ec-v2-badge--${tone}`, className)}>{children}</span>
}

// === AVATAR ===
export function V2Avatar({ name, uid, index = 0, size = 'md', className }: { name?: string; uid?: string; index?: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  if (uid) {
    return (
      <span className={cx('ec-v2-avatar', `ec-v2-avatar--${size}`, className)} aria-label={name}>
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} 
          alt={name} 
          className="w-full h-full object-cover rounded-full" 
        />
      </span>
    )
  }

  return (
    <span className={cx('ec-v2-avatar', `ec-v2-avatar--${size}`, `ec-v2-avatar--${(index % 6) + 1}`, className)} aria-label={name}>
      {initials}
    </span>
  )
}

// === PROGRESS BAR ===
export function V2ProgressBar({ value, tone = 'violet', className }: { value: number | string; tone?: Tone; className?: string }) {
  const width = typeof value === 'number' ? `${Math.min(100, Math.max(0, value))}%` : value
  return (
    <span className={cx('ec-v2-progress', `ec-v2-progress--${tone}`, className)}>
      <i style={{ width }} />
    </span>
  )
}

// === RING ===
export function V2Ring({
  value,
  label,
  sublabel,
  tone = 'violet',
  size = 'md',
  className
}: {
  value: number
  label: string
  sublabel?: string
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div
      className={cx('ec-v2-ring', `ec-v2-ring--${tone}`, `ec-v2-ring--${size}`, className)}
      style={{ '--ec-ring-value': `${Math.min(100, Math.max(0, value)) * 3.6}deg` } as CSSProperties}
      aria-label={`${label} ${sublabel ?? ''}`}
    >
      <strong>{label}</strong>
      {sublabel && <span>{sublabel}</span>}
    </div>
  )
}

// === EXERCISE ART ===
export function V2ExerciseArt({ index = 0, className }: { index?: number; className?: string }) {
  return (
    <span className={cx('ec-v2-exercise-art', `ec-v2-exercise-art--${(index % 4) + 1}`, className)}>
      <Dumbbell aria-hidden="true" size={18} />
      <i />
    </span>
  )
}
