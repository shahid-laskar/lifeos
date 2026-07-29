/**
 * Onboarding Page
 * Implements 024_Onboarding_Framework.md progressive disclosure.
 * Collects location, prayer preferences, and goals at user's own pace.
 * ADR-004: Nothing here is mandatory.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Settings, Target, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { Card }   from '@/components/ui/Card'

const CALCULATION_METHODS = [
  { value: 'MWL',         label: 'Muslim World League' },
  { value: 'ISNA',        label: 'ISNA (North America)' },
  { value: 'EGYPTIAN',    label: 'Egyptian General Authority' },
  { value: 'UMM_AL_QURA', label: 'Umm al-Qura (Makkah)' },
  { value: 'KARACHI',     label: 'University of Islamic Sciences, Karachi' },
  { value: 'TEHRAN',      label: 'Institute of Geophysics, Tehran' },
] as const

const ASR_METHODS = [
  { value: 'STANDARD', label: 'Standard (Shafi\'i, Maliki, Hanbali)' },
  { value: 'HANAFI',   label: 'Hanafi' },
] as const

const GOALS = [
  { value: 'pray_consistently', label: 'Improve prayer consistency' },
  { value: 'read_quran_daily', label: 'Read Qur\'an daily' },
  { value: 'learn_arabic', label: 'Learn more about Islam' },
  { value: 'build_healthier_habits', label: 'Build better daily habits' },
  { value: 'strengthen_family_organisation', label: 'Strengthen family bonds' },
  { value: 'manage_community_activities', label: 'Connect with community' },
] as const

const locationSchema = z.object({
  latitude:  z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone:  z.string().min(1, 'Timezone is required'),
  country:   z.string().optional(),
})

const prefsSchema = z.object({
  prayer_calculation_method: z.string(),
  asr_method:                z.string(),
})

type LocationForm = z.infer<typeof locationSchema>
type PrefsForm    = z.infer<typeof prefsSchema>

const STEPS = [
  { id: 'location', icon: MapPin,    title: 'Your location',          subtitle: 'For accurate prayer times' },
  { id: 'prefs',    icon: Settings,  title: 'Prayer preferences',     subtitle: 'Choose your calculation method' },
  { id: 'goals',    icon: Target,    title: 'What brings you here?',  subtitle: 'Select all that apply — optional' },
  { id: 'done',     icon: CheckCircle2, title: 'You\'re all set!',   subtitle: 'Your journey begins' },
] as const

export default function OnboardingPage() {
  const [step,          setStep]      = useState(0)
  const [selectedGoals, setGoals]     = useState<string[]>([])
  const updateProfile  = useAuthStore((s) => s.updateProfile)
  const fetchOnboarding = useAuthStore((s) => s.fetchOnboarding)
  const navigate        = useNavigate()

  const locationForm = useForm<LocationForm>({ resolver: zodResolver(locationSchema) })
  const prefsForm    = useForm<PrefsForm>({
    resolver: zodResolver(prefsSchema),
    defaultValues: { prayer_calculation_method: 'MWL', asr_method: 'STANDARD' },
  })

  async function handleLocationSubmit(data: LocationForm) {
    try {
      const payload: any = { ...data }
      if (!payload.country) delete payload.country
      await updateProfile(payload)
      setStep(1)
    } catch {
      toast.error('Could not save location. Please try again.')
    }
  }

  async function handlePrefsSubmit(data: PrefsForm) {
    try {
      await updateProfile(data)
      setStep(2)
    } catch {
      toast.error('Could not save preferences.')
    }
  }

  async function handleGoalsSubmit() {
    try {
      if (selectedGoals.length > 0) {
        await updateProfile({ goals: selectedGoals })
      }
      await fetchOnboarding()
      setStep(3)
    } catch {
      toast.error('Could not save goals.')
    }
  }

  function handleSkip() {
    setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const Icon    = current.icon

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Background accent */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% -5%, rgba(16,185,129,0.06) 0%, transparent 70%)`,
        }}
      />

      <div className="w-full max-w-lg relative animate-fade-in" style={{ zIndex: 1 }}>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.slice(0, 3).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: i < step ? 'var(--color-brand)' : i === step ? 'var(--color-brand-muted)' : 'var(--color-bg-surface)',
                  color:      i <= step ? (i < step ? 'white' : 'var(--color-brand)') : 'var(--color-text-muted)',
                  border:     i === step ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                  transition: 'all 0.3s',
                }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div style={{ width: 40, height: 1, background: i < step ? 'var(--color-brand)' : 'var(--color-border)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card elevated padding="lg">
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'var(--color-brand-muted)' }}
            >
              <Icon size={22} style={{ color: 'var(--color-brand)' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {current.title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {current.subtitle}
            </p>
          </div>

          {/* ── Step 0: Location ─────────────────────────────── */}
          {step === 0 && (
            <form onSubmit={locationForm.handleSubmit(handleLocationSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 21.3891"
                    error={locationForm.formState.errors.latitude?.message}
                    {...locationForm.register('latitude')}
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 39.8579"
                    error={locationForm.formState.errors.longitude?.message}
                    {...locationForm.register('longitude')}
                  />
                </div>
                <Input
                  label="Timezone"
                  placeholder="e.g. Asia/Riyadh"
                  hint="IANA timezone — e.g. Europe/London, Asia/Kolkata"
                  error={locationForm.formState.errors.timezone?.message}
                  {...locationForm.register('timezone')}
                />
                <Input
                  label="Country (optional)"
                  placeholder="e.g. SA"
                  {...locationForm.register('country')}
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button type="button" variant="ghost" onClick={handleSkip} fullWidth>
                    Skip for now
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    loading={locationForm.formState.isSubmitting}
                  >
                    Continue <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* ── Step 1: Prayer Preferences ───────────────────── */}
          {step === 1 && (
            <form onSubmit={prefsForm.handleSubmit(handlePrefsSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Calculation method
                  </label>
                  <select
                    {...prefsForm.register('prayer_calculation_method')}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {CALCULATION_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
                    Differences between methods reflect valid scholarly opinions (Article 5).
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Asr method
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ASR_METHODS.map((m) => (
                      <label
                        key={m.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bg-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          value={m.value}
                          {...prefsForm.register('asr_method')}
                          style={{ accentColor: 'var(--color-brand)' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                          {m.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                    <ArrowLeft size={15} /> Back
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    loading={prefsForm.formState.isSubmitting}
                  >
                    Continue <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* ── Step 2: Goals ─────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {GOALS.map((g) => {
                  const active = selectedGoals.includes(g.value)
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() =>
                        setGoals((prev) =>
                          active ? prev.filter((v) => v !== g.value) : [...prev, g.value],
                        )
                      }
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${active ? 'var(--color-brand)' : 'var(--color-border)'}`,
                        background: active ? 'var(--color-brand-muted)' : 'var(--color-bg-surface)',
                        color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        fontWeight: active ? 500 : 400,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {g.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={15} /> Back
                </Button>
                <Button fullWidth onClick={handleGoalsSubmit}>
                  Continue <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ──────────────────────────────────── */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                Bismillah — your Muslim Life OS is ready. You can always update
                your location, prayer preferences, and goals from your profile.
              </p>
              <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </Card>

        {step < 3 && (
          <p
            style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
          >
            All fields are optional and can be changed anytime.
          </p>
        )}
      </div>
    </div>
  )
}
