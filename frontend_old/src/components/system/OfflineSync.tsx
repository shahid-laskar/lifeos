import { useEffect } from 'react'

import { flushOfflineQueue } from '@/lib/offline/queue'

export default function OfflineSync() {
  useEffect(() => {
    const flush = () => {
      flushOfflineQueue().catch(() => undefined)
    }

    flush()
    window.addEventListener('online', flush)
    const interval = window.setInterval(flush, 30_000)

    return () => {
      window.removeEventListener('online', flush)
      window.clearInterval(interval)
    }
  }, [])

  return null
}
