import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from '@/store/authStore'
import { clearTokens, getRefreshToken } from '@/lib/api/client'

// Layouts
import AppShell from '@/components/layout/AppShell'

// Pages
import LoginPage      from '@/pages/auth/LoginPage'
import RegisterPage   from '@/pages/auth/RegisterPage'
import ForgotPassword from '@/pages/auth/ForgotPasswordPage'
import DashboardPage  from '@/pages/DashboardPage'
import PrayerPage     from '@/pages/PrayerPage'
import QuranPage      from '@/pages/QuranPage'
import DhikrPage      from '@/pages/DhikrPage'
import HabitsPage     from '@/pages/HabitsPage'
import ProfilePage    from '@/pages/ProfilePage'
import OnboardingPage from '@/pages/OnboardingPage'

// ── React Query client ────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   5 * 60 * 1000, // 5 min
      retry:       1,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Auth guard ────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ── Root App ──────────────────────────────────────────────────────
export default function App() {
  const logout = useAuthStore((s) => s.logout)

  // Listen for session-expired events fired by the Axios interceptor
  useEffect(() => {
    const handler = () => {
      clearTokens()
      logout()
    }
    window.addEventListener('mlos:session-expired', handler)
    return () => window.removeEventListener('mlos:session-expired', handler)
  }, [logout])

  // Rehydrate in-memory access token on page reload
  // (if user is authenticated, try to fetch a fresh access token via refresh)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fetchProfile    = useAuthStore((s) => s.fetchProfile)
  useEffect(() => {
    if (isAuthenticated && getRefreshToken()) {
      // fetchProfile will hit /users/me — the interceptor will auto-refresh if needed
      fetchProfile().catch(() => logout())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Guest routes ────────────────────────────────── */}
          <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

          {/* ── Authenticated routes ─────────────────────── */}
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/prayer"     element={<PrayerPage />} />
            <Route path="/quran"      element={<QuranPage />} />
            <Route path="/dhikr"      element={<DhikrPage />} />
            <Route path="/habits"     element={<HabitsPage />} />
            <Route path="/profile"    element={<ProfilePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* ── Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications — calm, non-punishing (Article 3 & 11) */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: 'var(--color-brand)', secondary: 'transparent' } },
          error:   { iconTheme: { primary: 'var(--color-error)', secondary: 'transparent' } },
        }}
      />
    </QueryClientProvider>
  )
}
