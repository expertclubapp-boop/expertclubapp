import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react'
import { ArrowRight } from 'lucide-react'

type Tone = 'violet' | 'lime' | 'sky' | 'purple' | 'yellow' | 'red' | 'green' | 'neutral'
type GlassVariant = 'light' | 'strong' | 'panel' | 'card' | 'hero'

const toneText: Record<Tone, string> = {
  violet: 'text-ec-violet',
  lime: 'text-accent-lime',
  sky: 'text-accent-sky',
  purple: 'text-accent-purple',
  yellow: 'text-accent-yellow',
  red: 'text-accent-red',
  green: 'text-accent-green',
  neutral: 'text-text-secondary',
}

const tonePill: Record<Tone, string> = {
  violet: 'bg-ec-violet/10 text-ec-violet',
  lime: 'bg-accent-lime/10 text-accent-lime',
  sky: 'bg-accent-sky/10 text-accent-sky',
  purple: 'bg-accent-purple/10 text-accent-purple',
  yellow: 'bg-accent-yellow/10 text-accent-yellow',
  red: 'bg-accent-red/10 text-accent-red',
  green: 'bg-accent-green/10 text-accent-green',
  neutral: 'bg-white/[0.05] text-text-secondary',
}

const variantClass: Record<GlassVariant, string> = {
  light: 'ec-glass',
  strong: 'ec-glass-strong',
  panel: 'ec-panel',
  card: 'ec-card',
  hero: 'ec-hero-shell',
}

interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant
  interactive?: boolean
}

export function GlassSurface({
  variant = 'card',
  interactive,
  className = '',
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={`${variantClass[variant]} ${
        interactive ? 'ec-card-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassPanel(props: GlassSurfaceProps) {
  return <GlassSurface variant="panel" {...props} />
}

export function GlassCard(props: GlassSurfaceProps) {
  return <GlassSurface variant="card" interactive {...props} />
}

interface GlowBackgroundProps {
  intensity?: 'subtle' | 'hero'
  className?: string
}

export function GlowBackground({
  intensity = 'subtle',
  className = '',
}: GlowBackgroundProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${
        intensity === 'hero' ? 'opacity-100' : 'opacity-70'
      } ${className}`}
    >
      <span className="absolute inset-0 ec-subtle-grid opacity-[0.18]" />
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <span className="absolute inset-x-10 top-0 h-28 bg-gradient-to-b from-white/[0.055] to-transparent" />
    </span>
  )
}

interface FloatingPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  icon?: ReactNode
}

export function FloatingPill({
  tone = 'violet',
  icon,
  className = '',
  children,
  ...props
}: FloatingPillProps) {
  return (
    <span
      className={`ec-floating-pill inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[10px] font-black uppercase leading-none tracking-[0.12em] ${tonePill[tone]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}

interface PremiumCTAProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  fullWidth?: boolean
}

export function PremiumCTA({
  icon,
  fullWidth = false,
  className = '',
  children,
  ...props
}: PremiumCTAProps) {
  return (
    <button
      className={`ec-premium-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-btn border border-transparent px-6 py-3 font-display text-sm font-black uppercase italic leading-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

interface PageShellProps extends HTMLAttributes<HTMLElement> {
  wide?: boolean
}

export function PageShell({
  wide,
  className = '',
  children,
  ...props
}: PageShellProps) {
  return (
    <main
      className={`ec-page-shell ec-page-reveal ${wide ? 'ec-page-wide' : ''} ${className}`}
      {...props}
    >
      {children}
    </main>
  )
}

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  tone?: Tone
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  tone = 'violet',
  className = '',
  ...props
}: SectionHeaderProps) {
  return (
    <div className={`ec-section-header ${className}`} {...props}>
      <div className="min-w-0">
        {eyebrow && (
          <div className={`mb-3 flex items-center gap-2 ${toneText[tone]}`}>
            {icon}
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="font-display text-heading-1 font-black uppercase italic leading-tight text-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-body-md text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface DashboardHeroProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function DashboardHero({
  className = '',
  children,
  ...props
}: DashboardHeroProps) {
  return (
    <section
      className={`ec-hero-shell ec-page-reveal rounded-shell p-6 sm:p-8 lg:p-10 ${className}`}
      {...props}
    >
      <GlowBackground intensity="hero" />
      {children}
    </section>
  )
}

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  icon?: ReactNode
}

export function StatusBadge({
  tone = 'neutral',
  icon,
  className = '',
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border border-white/[0.08] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${tonePill[tone]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}

interface ActionCardShellProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title: string
  description: string
  tone?: Tone
  cta?: string
}

export function ActionCardShell({
  icon,
  title,
  description,
  tone = 'violet',
  cta,
  className = '',
  ...props
}: ActionCardShellProps) {
  return (
    <GlassCard
      className={`rounded-card p-5 ${className}`}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!props.onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          props.onClick(event as never)
        }
      }}
      {...props}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] ${toneText[tone]}`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-body-lg font-black uppercase italic text-text-primary">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-body-sm text-text-secondary">
            {description}
          </p>
        </div>
        {cta && (
          <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneText[tone]}`}>
            {cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </GlassCard>
  )
}
