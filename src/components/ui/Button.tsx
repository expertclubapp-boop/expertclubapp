import { forwardRef } from 'react'
import { motion } from 'framer-motion'

type ButtonVariant = 'primary' | 'lime' | 'ghost' | 'google' | 'destructive'

interface ButtonProps {
  id?: string
  variant?: ButtonVariant
  fullWidth?: boolean
  isLoading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  'aria-label'?: string
  'aria-describedby'?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'ec-premium-cta font-bold',
  lime: 'ec-cta-lime font-bold',
  ghost:
    'ec-glass text-text-primary font-semibold hover:bg-white/[0.06]',
  google:
    'ec-glass text-text-primary font-medium hover:bg-white/[0.09]',
  destructive:
    'bg-accent-red/[0.08] border border-accent-red/20 text-accent-red font-bold hover:bg-accent-red/[0.14]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      fullWidth = true,
      isLoading = false,
      icon,
      children,
      className = '',
      disabled,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        type={type}
        onClick={onClick}
        className={`
          flex items-center justify-center gap-2
          min-h-12 rounded-btn px-6 py-[15px] text-[15px]
          font-body transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ec-violet/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
          ${fullWidth ? 'w-full' : ''}
          ${variantStyles[variant]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
