import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

import AuthShell from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  terms:    z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' }),
  }),
})
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const register_ = useAuthStore((s) => s.register)
  const navigate   = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    setServerError(null)
    try {
      await register_(data.email, data.password)
      toast.success('Account created! Bismillah — let us begin.')
      navigate('/onboarding')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setServerError(
        detail?.includes('could not be completed')
          ? 'An account with this email may already exist.'
          : (detail ?? 'Registration failed. Please try again.'),
      )
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Begin your journey with Muslim Life OS"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="reg-email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="reg-password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={<Lock size={16} />}
            hint="Minimum 8 characters. We never store passwords in plain text."
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Terms checkbox */}
          <label
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              id="terms"
              style={{ marginTop: '2px', accentColor: 'var(--color-brand)', flexShrink: 0 }}
              {...register('terms')}
            />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              I agree to the{' '}
              <a href="#" style={{ color: 'var(--color-brand)' }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: 'var(--color-brand)' }}>Privacy Policy</a>.
              Your data stays yours — we collect only what is necessary.
            </span>
          </label>
          {errors.terms && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: '-0.75rem' }}>
              {errors.terms.message}
            </p>
          )}

          {serverError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)',
                fontSize: '0.8125rem',
                color: 'var(--color-error)',
              }}
            >
              {serverError}
            </div>
          )}

          {/* Privacy note (Article 9) */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-brand-muted)',
              border: '1px solid rgba(16,185,129,0.15)',
              display: 'flex',
              gap: '0.625rem',
              alignItems: 'flex-start',
            }}
          >
            <ShieldCheck size={15} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              We only ask for your email and password to get started. Location,
              prayer preferences, and goals can be set later — at your pace.
            </p>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
          >
            Create account
          </Button>
        </div>
      </form>

      <div className="divider-ornament" style={{ margin: '1.5rem 0' }}>or</div>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          style={{ color: 'var(--color-brand)', fontWeight: 500, textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
