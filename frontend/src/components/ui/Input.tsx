import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
  icon?:    React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, id, className: _cls, style, ...rest }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            {...rest}
            style={{
              width: '100%',
              padding: icon ? '0.625rem 0.875rem 0.625rem 2.5rem' : '0.625rem 0.875rem',
              background: 'var(--color-bg-surface)',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color var(--duration-fast) var(--ease-out)',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--color-error)'
                : 'var(--color-brand)'
              rest.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--color-error)'
                : 'var(--color-border)'
              rest.onBlur?.(e)
            }}
          />
        </div>
        {error && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{error}</p>
        )}
        {hint && !error && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
