import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base:  { background: 'var(--color-brand)', color: 'var(--color-text-inverse)', border: 'none' },
    hover: { background: 'var(--color-brand-hover)' },
  },
  secondary: {
    base:  { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
    hover: { borderColor: 'var(--color-border-hover)', background: 'var(--color-bg-elevated)' },
  },
  ghost: {
    base:  { background: 'transparent', color: 'var(--color-text-secondary)', border: 'none' },
    hover: { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' },
  },
  danger: {
    base:  { background: 'rgba(248,113,113,0.12)', color: 'var(--color-error)', border: '1px solid rgba(248,113,113,0.2)' },
    hover: { background: 'rgba(248,113,113,0.2)' },
  },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.875rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' },
  md: { padding: '0.625rem 1.25rem',  fontSize: '0.875rem',  borderRadius: 'var(--radius-md)' },
  lg: { padding: '0.75rem 1.75rem',   fontSize: '1rem',      borderRadius: 'var(--radius-lg)' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, children, disabled, style, ...rest }, ref) => {
    const vs = variantStyles[variant]

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        {...rest}
        style={{
          ...vs.base,
          ...sizeStyles[size],
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontWeight: 500,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled || loading ? 0.6 : 1,
          transition: 'all var(--duration-fast) var(--ease-out)',
          width: fullWidth ? '100%' : undefined,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !loading) {
            Object.assign(e.currentTarget.style, vs.hover)
          }
          rest.onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (!disabled && !loading) {
            Object.assign(e.currentTarget.style, vs.base)
          }
          rest.onMouseLeave?.(e)
        }}
      >
        {loading && <span className="spinner" style={{ width: '14px', height: '14px' }} />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
