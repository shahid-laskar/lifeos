/**
 * Habits / Consistency Page
 * ADR-006, Article 2: Consistency over Intensity, Article 6: Humility
 * N-of-30 days metrics rather than streaks.
 */
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, AlertCircle } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface ConsistencyMetrics {
  days_completed_last_30: number
  total_prayers_logged_last_30: number
}

export default function HabitsPage() {
  const { data: metrics, isLoading, error } = useQuery<ConsistencyMetrics>({
    queryKey: ['habits-metrics'],
    queryFn: () => client.get(ENDPOINTS.HABITS_METRICS).then(r => r.data),
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Habits & Consistency
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Small, consistent actions are the most beloved to Allah.
        </p>
      </div>

      {/* Philosophy note (Article 2) */}
      <Card style={{ background: 'var(--color-bg-surface)', borderColor: 'rgba(96,165,250,0.3)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              <strong>Consistency over streaks.</strong> We do not use "streaks" that reset to zero if you miss a day. 
              Instead, we look at your consistency over the last 30 days. A lapse is just a lapse; return and continue.
            </p>
          </div>
        </div>
      </Card>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <Card>
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>
            Could not load metrics. Have you logged any prayers yet?
          </p>
        </Card>
      )}

      {metrics && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Top-level summary */}
          <Card elevated>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.625rem', background: 'rgba(96,165,250,0.15)', borderRadius: 'var(--radius-md)' }}>
                <CheckSquare size={20} style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Overall Prayer Consistency</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Past 30 days</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
                {metrics.days_completed_last_30} / 30
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', paddingBottom: '0.3rem' }}>
                ({metrics.total_prayers_logged_last_30} individual prayers logged)
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: 'var(--color-bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${(metrics.days_completed_last_30 / 30) * 100}%`, 
                  height: '100%', 
                  background: 'var(--color-brand)', 
                  borderRadius: 3,
                  transition: 'width 1s ease-in-out'
                }} 
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
