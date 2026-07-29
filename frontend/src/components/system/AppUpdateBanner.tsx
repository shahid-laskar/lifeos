/**
 * Non-intrusive update notification for new service worker versions.
 * Per Article 11 (Calm by Default): prompts only when the user can act,
 * never interrupts focused tasks.
 */
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function AppUpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateReady(true)
          }
        })
      })
    })
  }, [])

  if (!updateReady) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.625rem 1rem',
        background: 'var(--color-brand-muted)',
        borderBottom: '1px solid rgba(16,185,129,0.25)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <RefreshCw size={14} style={{ color: 'var(--color-brand)' }} />
        A new version is available.
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.location.reload()}
        style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
      >
        Refresh
      </Button>
    </div>
  )
}
