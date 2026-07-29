import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  padding?:  'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '0',
  sm:   '1rem',
  md:   '1.5rem',
  lg:   '2rem',
}

export function Card({ elevated = false, padding = 'md', children, style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background:   elevated ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding:      paddingMap[padding],
        boxShadow:    elevated ? 'var(--shadow-md)' : 'none',
        transition:   'border-color var(--duration-fast), box-shadow var(--duration-fast)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
