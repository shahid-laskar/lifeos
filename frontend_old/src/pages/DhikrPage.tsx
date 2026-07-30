/**
 * Dhikr Page
 * ADR-008
 * Article 1: Benefit over Engagement, Article 2: Consistency over Intensity
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface DhikrItem {
  id: string
  category: string
  arabic_text: string
  transliteration: string
  meaning: string
  recommended_count: number
  source: string
}

interface DhikrSummary {
  date: string
  total_morning: number
  total_evening: number
  total_post_prayer: number
  total_general: number
}

export default function DhikrPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: items, isLoading: itemsLoading } = useQuery<DhikrItem[]>({
    queryKey: ['dhikr-items'],
    queryFn: () => client.get(ENDPOINTS.DHIKR_ITEMS).then(r => r.data),
  })

  const { data: summary } = useQuery<DhikrSummary>({
    queryKey: ['dhikr-summary-today'],
    queryFn: () => client.get(`${ENDPOINTS.DHIKR_SUMMARY}?date=${today}`).then(r => r.data),
  })

  const { mutate: logDhikr, isPending } = useMutation({
    mutationFn: ({ item_id, count }: { item_id: string; count: number }) =>
      client.post(`${ENDPOINTS.DHIKR_LOG}?date=${today}`, { dhikr_item_id: item_id, count }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dhikr-summary-today'] })
      toast.success('Dhikr logged. May Allah accept it.', { icon: '🤍' })
    },
    onError: () => toast.error('Could not log Dhikr.'),
  })

  // Group items by category
  const categories = items ? [...new Set(items.map(i => i.category))] : []
  const categoryTotals: Record<string, number> = {
    morning: summary?.total_morning ?? 0,
    evening: summary?.total_evening ?? 0,
    post_prayer: summary?.total_post_prayer ?? 0,
    general: summary?.total_general ?? 0,
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Dhikr Companion
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Remembrance of Allah brings tranquility to the heart.
        </p>
      </div>

      {/* Summary Card */}
      <Card elevated style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.02) 100%)', borderColor: 'rgba(167,139,250,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(167,139,250,0.2)', borderRadius: 'var(--radius-md)' }}>
            <Heart size={20} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Today's Remembrance</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>A calm summary of today's sessions.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {categories.length > 0 ? categories.map(cat => (
             <div key={cat} style={{ background: 'var(--color-bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flex: 1, minWidth: 120 }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{cat}</p>
               <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#a78bfa' }}>{categoryTotals[cat] || 0}</p>
             </div>
          )) : (
             <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Loadng categories...</p>
          )}
        </div>
      </Card>

      {itemsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {categories.map(cat => (
            <div key={cat}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize', marginBottom: '1rem' }}>
                {cat.replace('_', ' ')}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {items?.filter(i => i.category === cat).map((item) => (
                  <Card key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '1rem', flex: 1 }}>
                      <p className="arabic" style={{ fontSize: '1.5rem', color: 'var(--color-text-primary)', textAlign: 'right', marginBottom: '1rem', lineHeight: 1.8 }}>
                        {item.arabic_text}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        {item.transliteration}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {item.meaning}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Ref: {item.source}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Badge variant="muted">x{item.recommended_count}</Badge>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => logDhikr({ item_id: item.id, count: item.recommended_count })}
                          disabled={isPending}
                        >
                          <Plus size={14} /> Log
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
