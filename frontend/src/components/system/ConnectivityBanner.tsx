import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function ConnectivityBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const handleOffline = () => setOffline(true)
    const handleOnline = () => setOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        background: 'var(--color-gold-muted)',
        borderBottom: '1px solid rgba(245,158,11,0.25)',
        color: 'var(--color-text-secondary)',
        fontSize: '0.8125rem',
      }}
    >
      <WifiOff size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
      You are offline. Cached content remains available; changes will sync when you reconnect.
    </div>
  )
}
