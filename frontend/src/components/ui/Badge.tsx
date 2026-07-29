type BadgeVariant = 'brand' | 'gold' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  brand:   { background: 'var(--color-brand-muted)',              color: 'var(--color-brand)' },
  gold:    { background: 'var(--color-gold-muted)',               color: 'var(--color-gold)' },
  success: { background: 'rgba(16,185,129,0.12)',                 color: 'var(--color-success)' },
  warning: { background: 'rgba(245,158,11,0.12)',                 color: 'var(--color-warning)' },
  error:   { background: 'rgba(248,113,113,0.12)',                color: 'var(--color-error)' },
  muted:   { background: 'var(--color-bg-elevated)',              color: 'var(--color-text-secondary)' },
}

export function Badge({ variant = 'brand', children }: BadgeProps) {
  return (
    <span
      style={{
        ...styles[variant],
        display:      'inline-flex',
        alignItems:   'center',
        padding:      '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        fontSize:     '0.6875rem',
        fontWeight:   600,
        letterSpacing: '0.03em',
      }}
    >
      {children}
    </span>
  )
}
