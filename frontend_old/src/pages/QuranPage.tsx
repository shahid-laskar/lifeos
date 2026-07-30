/**
 * Qur'an Page
 * ADR-007, ADR-010
 * Article 2: Consistency over Intensity, Article 9: Privacy
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { requestWithOfflineQueue } from '@/lib/offline/queue'

interface Surah {
  number: number
  arabic_name: string
  transliterated_name: string
  meaning: string
  ayah_count: number
  revelation_type: string
}

interface Ayah {
  number_in_surah: number
  text: string
}

interface SurahAyahsResponse {
  surah_number: number
  ayahs: Ayah[]
}

export default function QuranPage() {
  const qc = useQueryClient()
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)
  const [progressInput, setProgressInput] = useState<string>('')

  const { data: surahs, isLoading: surahsLoading } = useQuery<Surah[]>({
    queryKey: ['quran-surahs'],
    queryFn: () => client.get(ENDPOINTS.QURAN_SURAHS).then((r) => r.data),
  })

  const { data: progress } = useQuery<Record<number, { last_ayah_number: number; updated_at: string }>>({
    queryKey: ['quran-progress'],
    queryFn: () => client.get(ENDPOINTS.QURAN_PROGRESS).then((r) => {
      // Backend returns array of ReadingProgressResponse: { surah_number, last_ayah_number, updated_at }
      const map: Record<number, { last_ayah_number: number; updated_at: string }> = {}
      for (const p of r.data) {
        map[p.surah_number] = p
      }
      return map
    }),
  })

  const { data: ayahs, isLoading: ayahsLoading, error: ayahsError } = useQuery<Ayah[]>({
    queryKey: ['quran-ayahs', selectedSurah],
    enabled: selectedSurah !== null,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const response = await client.get<SurahAyahsResponse>(ENDPOINTS.QURAN_AYAHS(selectedSurah!))
      return response.data.ayahs
    },
  })

  const { mutate: updateProgress, isPending: isUpdatingProgress } = useMutation({
    mutationFn: (ayahNumber: number) =>
      requestWithOfflineQueue({
        method: 'put',
        url: ENDPOINTS.QURAN_PROGRESS,
        data: { surah_number: selectedSurah, last_ayah_number: ayahNumber },
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['quran-progress'] })
      qc.invalidateQueries({ queryKey: ['quran-weekly'] })
      toast.success(result.queued ? 'Progress saved locally. It will sync when you reconnect.' : 'Reading progress saved.')
      setSelectedSurah(null)
    },
    onError: () => toast.error('Could not save progress. Please check ayah number.')
  })

  if (selectedSurah) {
    const surah = surahs?.find(s => s.number === selectedSurah)
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => setSelectedSurah(null)}>
            <ChevronLeft size={16} /> Back
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {surah?.transliterated_name} <span className="arabic" style={{ color: 'var(--color-gold)', fontSize: '1.5rem', marginLeft: '0.5rem' }}>{surah?.arabic_name}</span>
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {surah?.meaning} • {surah?.ayah_count} Ayahs • {surah?.revelation_type}
            </p>
          </div>
        </div>

        {ayahsLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size={32} />
          </div>
        )}

        {ayahsError && (
          <Card>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                The ayahs could not be loaded right now. Please check your connection and try again.
              </p>
            </div>
          </Card>
        )}

        {ayahs && (
          <Card padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {ayahs.map((ayah) => {
                    const isRead = (progress?.[selectedSurah]?.last_ayah_number ?? 0) >= ayah.number_in_surah
                return (
                  <div
                    key={ayah.number_in_surah}
                    style={{
                      paddingBottom: '1.25rem',
                      borderBottom: '1px solid var(--color-border)',
                      opacity: isRead ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--color-brand)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {ayah.number_in_surah}
                      </span>
                    </div>
                    <p className="arabic" lang="ar" style={{ color: 'var(--color-text-primary)', fontSize: '1.65rem', textAlign: 'right', lineHeight: 2.1 }}>
                      {ayah.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
            Save your reading position
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Mark the last ayah you read. This is optional and does not interrupt reading.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: 360 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                Last Ayah Number
              </label>
              <input
                type="number"
                min={1}
                max={surah?.ayah_count}
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}
              />
            </div>
            <Button
              loading={isUpdatingProgress}
              disabled={!progressInput || parseInt(progressInput, 10) < 1 || parseInt(progressInput, 10) > (surah?.ayah_count || 1000)}
              onClick={() => updateProgress(parseInt(progressInput, 10))}
            >
              Save Position
            </Button>
          </div>
        </Card>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Arabic text: <a href="https://tanzil.net" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand)' }}>Tanzil Project</a> · Uthmani text, CC BY 3.0
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          The Noble Qur'an
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Read at your own pace.
        </p>
      </div>

      {surahsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {surahs?.map((surah) => {
            const p = progress?.[surah.number]
            const readPercentage = p ? Math.round((p.last_ayah_number / surah.ayah_count) * 100) : 0

            return (
              <Card 
                key={surah.number} 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSurah(surah.number)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: 40, height: 40, 
                        background: 'var(--color-bg-elevated)', 
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-brand)', fontWeight: 600, fontSize: '0.875rem'
                      }}
                    >
                      {surah.number}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{surah.transliterated_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{surah.meaning} • {surah.ayah_count} Ayahs</p>
                    </div>
                  </div>
                  <p className="arabic" style={{ fontSize: '1.25rem', color: 'var(--color-gold)' }}>
                    {surah.arabic_name}
                  </p>
                </div>
                {p && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      <span>Progress</span>
                      <span>{p.last_ayah_number} / {surah.ayah_count} ({readPercentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'var(--color-bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${readPercentage}%`, height: '100%', background: 'var(--color-brand)', borderRadius: 2 }} />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
