/**
 * Prayer Page — full prayer times view with habit logging
 * ADR-002, ADR-005, ADR-006
 * Article 3: reminders encourage, never shame
 */
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Info, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

import { Card }   from '@/components/ui/Card'
import { Badge }  from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useAuthStore } from '@/store/authStore'

interface PrayerTimes {
  fajr: string; sunrise: string; dhuhr: string
  asr: string;  maghrib: string; isha: string
  high_latitude_adjustment_applied: boolean
  method: string
}

interface PrayerTimeResponse {
  times: PrayerTimes
  method: string
  high_latitude_adjustment_applied: boolean
}

interface DailyPrayerStatus {
  date: string
  fajr: 'completed' | 'missed' | 'excused' | null
  dhuhr: 'completed' | 'missed' | 'excused' | null
  asr: 'completed' | 'missed' | 'excused' | null
  maghrib: 'completed' | 'missed' | 'excused' | null
  isha: 'completed' | 'missed' | 'excused' | null
}

type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function isActive(time: string): boolean {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]
  const dt    = new Date(`${today}T${time}:00`)
  return dt <= now
}

export default function PrayerPage() {
  const user       = useAuthStore((s) => s.user)
  const onboarding = useAuthStore((s) => s.onboarding)
  const fetchOnboarding = useAuthStore((s) => s.fetchOnboarding)
  const qc         = useQueryClient()
  const today      = new Date().toISOString().split('T')[0]
  const [logDate]  = useState(today)

  useEffect(() => {
    fetchOnboarding().catch(() => undefined)
  }, [fetchOnboarding])

  const { data: prayerResponse, isLoading, error } = useQuery<PrayerTimeResponse>({
    queryKey: ['prayer-times-me'],
    queryFn:  () => client.get(ENDPOINTS.PRAYER_TIMES_ME).then((r) => r.data),
    enabled:  onboarding?.first_meaningful_outcome_available ?? false,
    refetchInterval: 60_000,
  })

  const times = prayerResponse?.times

  const { data: dailyStatus } = useQuery<DailyPrayerStatus>({
    queryKey: ['habits-status', logDate],
    queryFn:  () => client.get(`${ENDPOINTS.HABITS_HISTORY}?date=${logDate}`).then((r) => r.data),
  })

  const { mutate: logPrayer, isPending } = useMutation({
    mutationFn: ({ prayer, status }: { prayer: string; status: string }) =>
      client.post(`${ENDPOINTS.HABITS_LOG}?date=${logDate}`, { prayer_name: prayer, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits-status'] })
      qc.invalidateQueries({ queryKey: ['habits-metrics'] })
      toast.success('Prayer logged. Alhamdulillah.')
    },
    onError: () => toast.error('Could not log prayer. Please try again.'),
  })

  function getStatus(prayer: PrayerName) {
    return dailyStatus?.[prayer]
  }

  const canSee = onboarding?.first_meaningful_outcome_available ?? false

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Prayer Times
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {!canSee && (
        <Card>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={18} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
                Location not set yet
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Add your location and prayer calculation method in{' '}
                <a href="/onboarding" style={{ color: 'var(--color-brand)' }}>Onboarding</a> or{' '}
                <a href="/profile" style={{ color: 'var(--color-brand)' }}>Profile</a> to see your times.
              </p>
            </div>
          </div>
        </Card>
      )}

      {canSee && isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      )}

      {canSee && error && (
        <Card>
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>
            Could not load prayer times. Check your profile settings.
          </p>
        </Card>
      )}

      {canSee && times && (
        <>
          {/* Method badge */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge variant="muted">Method: {prayerResponse.method}</Badge>
            {prayerResponse.high_latitude_adjustment_applied && (
              <Badge variant="warning">High-latitude adjustment applied</Badge>
            )}
          </div>

          {/* Prayer cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Sunrise (display only) */}
            <Card style={{ opacity: 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-gold-muted)' }}>
                  <Clock size={16} style={{ color: 'var(--color-gold)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Sunrise</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Informational only</p>
                </div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{fmt12(times.sunrise)}</p>
              </div>
            </Card>

            {/* Obligatory prayers */}
            {PRAYERS.map((prayer) => {
              const time   = times[prayer]
              const status = getStatus(prayer)
              const passed = isActive(time)

              return (
                <Card
                  key={prayer}
                  style={{
                    borderColor: status === 'completed' ? 'rgba(16,185,129,0.3)' : status === 'missed' ? 'rgba(248,113,113,0.25)' : undefined,
                    background:  status === 'completed' ? 'rgba(16,185,129,0.06)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Status icon */}
                    <div>
                      {status === 'completed' ? (
                        <CheckCircle2 size={22} style={{ color: 'var(--color-brand)' }} />
                      ) : status === 'missed' ? (
                        <Circle size={22} style={{ color: 'var(--color-error)', opacity: 0.7 }} />
                      ) : status === 'excused' ? (
                        <Circle size={22} style={{ color: 'var(--color-warning)' }} />
                      ) : (
                        <Circle size={22} style={{ color: 'var(--color-border)' }} />
                      )}
                    </div>

                    {/* Name & time */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                        {prayer}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {fmt12(time)}
                      </p>
                    </div>

                    {/* Log buttons */}
                    {!status && passed && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => logPrayer({ prayer, status: 'completed' })}
                          disabled={isPending}
                        >
                          ✓ Done
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => logPrayer({ prayer, status: 'excused' })}
                          disabled={isPending}
                        >
                          Excused
                        </Button>
                      </div>
                    )}
                    {status && (
                      <Badge variant={status === 'completed' ? 'brand' : status === 'excused' ? 'warning' : 'error'}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    )}
                    {!status && !passed && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Upcoming</p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Gentle note — Article 3: Mercy over Guilt */}
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Missed a prayer? Every moment is an opportunity for repentance and return.
          </p>
        </>
      )}

      {/* User info summary */}
      {user && (
        <Card padding="sm" style={{ opacity: 0.7 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Location: {user.latitude != null ? `${user.latitude.toFixed(2)}°, ${user.longitude?.toFixed(2)}°` : 'Not set'} ·{' '}
            Timezone: {user.timezone ?? 'Not set'}
          </p>
        </Card>
      )}
    </div>
  )
}
