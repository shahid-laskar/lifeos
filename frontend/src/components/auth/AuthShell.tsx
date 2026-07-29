/**
 * Shared auth page wrapper — consistent branding for Login / Register / Forgot
 */
import { Moon } from 'lucide-react'

interface AuthShellProps {
  title:    string
  subtitle: string
  children: React.ReactNode
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Gradient background accent */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse 100% 70% at 50% -10%,
            rgba(16,185,129,0.08) 0%,
            transparent 70%
          )`,
        }}
      />

      <div
        className="w-full max-w-md relative animate-fade-in"
        style={{ zIndex: 1 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'var(--color-brand-muted)',
              border: '1px solid rgba(16,185,129,0.3)',
              boxShadow: 'var(--shadow-glow-brand)',
            }}
          >
            <Moon size={24} style={{ color: 'var(--color-brand)' }} />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div
          className="card-elevated p-8"
          style={{ borderRadius: 'var(--radius-xl)' }}
        >
          {children}
        </div>

        {/* Footer */}
        <p
          className="text-center mt-6 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </p>
      </div>
    </div>
  )
}
