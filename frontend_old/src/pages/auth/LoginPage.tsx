import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

import AuthShell from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const login    = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    setServerError(null)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back! Ahlan wa sahlan.')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Sign in failed. Please try again.'
      setServerError(msg)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Muslim Life OS account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Your password"
              autoComplete="current-password"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.75rem', color: 'var(--color-brand)' }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

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

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="divider-ornament" style={{ margin: '1.5rem 0' }}>
        or
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Don't have an account?{' '}
        <Link
          to="/register"
          style={{ color: 'var(--color-brand)', fontWeight: 500, textDecoration: 'none' }}
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}
