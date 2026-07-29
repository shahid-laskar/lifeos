/**
 * Profile Page
 * Manages user settings, preferences, and goals (ADR-004)
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User as UserIcon, MapPin, Settings, Check } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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

const schema = z.object({
  latitude:  z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
  timezone:  z.string().nullable(),
  country:   z.string().nullable(),
  prayer_calculation_method: z.string().nullable(),
  asr_method: z.string().nullable(),
})
type Form = z.infer<typeof schema>

export default function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const updateProfile = useAuthStore(s => s.updateProfile)
  const fetchOnboarding = useAuthStore(s => s.fetchOnboarding)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: null, longitude: null, timezone: null, country: null,
      prayer_calculation_method: 'MWL', asr_method: 'STANDARD'
    }
  })

  // Load user data into form
  useEffect(() => {
    if (user) {
      reset({
        latitude: user.latitude,
        longitude: user.longitude,
        timezone: user.timezone,
        country: user.country,
        prayer_calculation_method: user.prayer_calculation_method || 'MWL',
        asr_method: user.asr_method || 'STANDARD'
      })
    }
  }, [user, reset])

  async function onSubmit(data: Form) {
    try {
      // Remove nulls so we don't accidentally overwrite with null if not intended,
      // though backend PATCH handles it
      const payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null && v !== ''))
      await updateProfile(payload)
      await fetchOnboarding() // Refresh dashboard flags
      toast.success('Profile updated successfully.')
      reset(data) // Reset dirty state
    } catch {
      toast.error('Failed to update profile.')
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Profile Settings
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Manage your account and app preferences.
        </p>
      </div>

      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
            <UserIcon size={32} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.email}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Location Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <MapPin size={18} style={{ color: 'var(--color-brand)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Location</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input label="Latitude" type="number" step="any" {...register('latitude')} error={errors.latitude?.message} />
              <Input label="Longitude" type="number" step="any" {...register('longitude')} error={errors.longitude?.message} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Timezone (IANA)" placeholder="e.g. Europe/London" {...register('timezone')} error={errors.timezone?.message} />
              <Input label="Country Code" placeholder="e.g. GB" {...register('country')} error={errors.country?.message} />
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Settings size={18} style={{ color: 'var(--color-brand)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Prayer Preferences</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Calculation Method</label>
                <select {...register('prayer_calculation_method')} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  {CALCULATION_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Asr Method</label>
                <select {...register('asr_method')} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  {ASR_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              <Check size={16} /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
