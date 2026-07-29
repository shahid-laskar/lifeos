import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, CheckCircle2 } from 'lucide-react'

import AuthShell from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    // ADR-009: same response regardless of whether email exists
    await client.post(ENDPOINTS.REQUEST_RESET, { email: data.email })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="A password reset link is on its way"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <CheckCircle2
            size={48}
            style={{ color: 'var(--color-brand)', margin: '0 auto 1rem' }}
          />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            If that email is registered, you'll receive a reset link shortly.
            Check your spam folder if you don't see it.
          </p>
          <Link
            to="/login"
            style={{ color: 'var(--color-brand)', fontSize: '0.875rem' }}
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a link to your email"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            id="reset-email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Send reset link
          </Button>
        </div>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '1.5rem' }}>
        Remembered it?{' '}
        <Link to="/login" style={{ color: 'var(--color-brand)' }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
