import { type InputHTMLAttributes, forwardRef } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-white/25 pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              input-dark ec-input
              ${icon ? 'pl-11' : ''}
              ${error ? 'border-accent-red/50' : ''}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-accent-red font-body">{error}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
