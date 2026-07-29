/**
 * Dashboard Page
 * Article 1: Benefit over Engagement — show the most useful content immediately.
 * ADR-002: Prayer times are the first meaningful outcome.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, BookOpen, Heart, CheckSquare, ArrowRight, Sunrise } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { Card }  from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

interface PrayerTimes {
  fajr: string; sunrise: string; dhuhr: string;
  asr: string;  maghrib: string; isha: string
}

interface PrayerTimeResponse {
  times: PrayerTimes
  high_latitude_adjustment_applied: boolean
}

interface DhikrSummary {
  date: string
  total_morning: number
  total_evening: number
  total_post_prayer: number
  total_general: number
}

// Determine which prayer is current/next
function getPrayerStatus(times: PrayerTimes) {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  const prayers = [
    { name: 'Fajr',    time: times.fajr },
    { name: 'Sunrise', time: times.sunrise },
    { name: 'Dhuhr',   time: times.dhuhr },
    { name: 'Asr',     time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha',    time: times.isha },
  ].map((p) => ({
    ...p,
    dt: new Date(`${today}T${p.time}:00`),
  }))

  const filtered = prayers.filter((p) => p.dt <= now)
  const current = filtered[filtered.length - 1]
  const next    = prayers.find((p) => p.dt > now)
  return { current: current?.name, next }
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm   = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function timeUntil(timeStr: string) {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]
  const target = new Date(`${today}T${timeStr}:00`)
  const diff   = target.getTime() - now.getTime()
  if (diff < 0) return null
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `in ${hours}h ${mins % 60}m`
  return `in ${mins}m`
}

export default function DashboardPage() {
  const user       = useAuthStore((s) => s.user)
  const onboarding = useAuthStore((s) => s.onboarding)
  const fetchOnboarding = useAuthStore((s) => s.fetchOnboarding)

  useEffect(() => {
    fetchOnboarding()
  }, [fetchOnboarding])

  const canSeePrayerTimes = onboarding?.first_meaningful_outcome_available ?? false

  const { data: prayerResponse, isLoading: prayerLoading } = useQuery<PrayerTimeResponse>({
    queryKey: ['prayer-times-me'],
    queryFn:  () => client.get(ENDPOINTS.PRAYER_TIMES_ME).then((r) => r.data),
    enabled:  canSeePrayerTimes,
    refetchInterval: 60_000,
  })

  const prayerTimes = prayerResponse?.times

  const { data: dhikrSummary } = useQuery<DhikrSummary>({
    queryKey: ['dhikr-summary-today'],
    queryFn:  () => {
      const today = new Date().toISOString().split('T')[0]
      return client.get(`${ENDPOINTS.DHIKR_SUMMARY}?date=${today}`).then((r) => r.data)
    },
  })

  const { data: weeklyQuran } = useQuery<{ active_days_last_7_days: number; surahs_read_last_7_days: number }>({
    queryKey: ['quran-weekly'],
    queryFn:  () => client.get(ENDPOINTS.QURAN_WEEKLY).then((r) => r.data),
  })

  const prayerStatus = prayerTimes ? getPrayerStatus(prayerTimes) : null
  const greeting     = getGreeting()

  const PRAYER_NAMES = ['fajr','dhuhr','asr','maghrib','isha'] as const

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Greeting ───────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {greeting}
          {user?.email && (
            <span style={{ color: 'var(--color-brand)' }}>
              {' '}{user.email.split('@')[0]}
            </span>
          )}
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Onboarding nudge ────────────────────────────────────── */}
      {!canSeePrayerTimes && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-brand-muted)',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Sunrise size={20} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Set your location for personalised prayer times
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Only takes a moment — optional when you're ready.
            </p>
          </div>
          <Link to="/onboarding">
            <Badge variant="brand">Set up →</Badge>
          </Link>
        </div>
      )}

      {/* ── Next Prayer Countdown ─────────────────────────────── */}
      {canSeePrayerTimes && (
        <div>
          {prayerLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Spinner size={28} />
            </div>
          ) : prayerTimes && prayerStatus?.next ? (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
                border: '1px solid rgba(16,185,129,0.25)',
                boxShadow: 'var(--shadow-glow-brand)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-brand)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Next prayer
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
                    {prayerStatus.next.name}
                  </p>
                  <p style={{ fontSize: '1.125rem', color: 'var(--color-brand)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {formatTime(prayerStatus.next.time)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {timeUntil(prayerStatus.next.time) ?? 'Now'}
                  </p>
                  {prayerResponse.high_latitude_adjustment_applied && (
                    <Badge variant="warning">Adjusted</Badge>
                  )}
                </div>
              </div>

              {/* Mini prayer grid */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                {PRAYER_NAMES.map((p) => {
                  const t = prayerTimes[p]
                  const isNext = prayerStatus.next?.name.toLowerCase() === p
                  return (
                    <div
                      key={p}
                      style={{
                        flex: 1,
                        minWidth: 64,
                        padding: '0.5rem 0.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: isNext ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                        border: isNext ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '0.65rem', color: isNext ? 'var(--color-brand)' : 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: isNext ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.2rem' }}>
                        {formatTime(t)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Feature cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Prayer */}
        <Link to="/prayer" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-brand-muted)' }}>
                <Clock size={18} style={{ color: 'var(--color-brand)' }} />
              </div>
              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Prayer Times</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Daily schedule & consistency
            </p>
          </Card>
        </Link>

        {/* Qur'an */}
        <Link to="/quran" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-gold-muted)' }}>
                <BookOpen size={18} style={{ color: 'var(--color-gold)' }} />
              </div>
              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Qur'an</p>
            {weeklyQuran ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {weeklyQuran.active_days_last_7_days}/7 days this week
              </p>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Browse surahs & track progress
              </p>
            )}
          </Card>
        </Link>

        {/* Dhikr */}
        <Link to="/dhikr" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'rgba(167,139,250,0.12)' }}>
                <Heart size={18} style={{ color: '#a78bfa' }} />
              </div>
              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Dhikr</p>
            {dhikrSummary ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {dhikrSummary.total_morning + dhikrSummary.total_evening + dhikrSummary.total_post_prayer + dhikrSummary.total_general} recitations today
              </p>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Morning, evening & post-prayer
              </p>
            )}
          </Card>
        </Link>

        {/* Habits */}
        <Link to="/habits" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'rgba(96,165,250,0.12)' }}>
                <CheckSquare size={18} style={{ color: '#60a5fa' }} />
              </div>
              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Habits</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Prayer consistency (30 days)
            </p>
          </Card>
        </Link>
      </div>

      {/* ── Islamic date / quote ──────────────────────────────── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <p className="arabic" style={{ fontSize: '1.25rem', color: 'var(--color-gold)', marginBottom: '0.75rem' }}>
          فَاذْكُرُونِي أَذْكُرْكُمْ
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          "Remember Me and I will remember you." — Al-Baqarah 2:152
        </p>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'As-salāmu ʿalaykum,'
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  if (h < 21) return 'Good evening,'
  return 'Good night,'
}
