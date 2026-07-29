import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Heart,
  CheckSquare,
  User,
  LogOut,
  Menu,
  X,
  Moon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prayer',    icon: Clock,           label: 'Prayer Times' },
  { to: '/quran',     icon: BookOpen,        label: "Qur'an" },
  { to: '/dhikr',     icon: Heart,           label: 'Dhikr' },
  { to: '/habits',    icon: CheckSquare,     label: 'Habits' },
  { to: '/profile',   icon: User,            label: 'Profile' },
] as const

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const logout   = useAuthStore((s) => s.logout)
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
    toast.success('Signed out. As-salāmu ʿalaykum.')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* ── Mobile overlay ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--color-bg-overlay)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-brand-muted)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <Moon size={18} style={{ color: 'var(--color-brand)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Muslim Life OS
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Your companion
            </p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 rounded-lg transition-colors hover:opacity-70"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'text-brand-active nav-active'
                  : 'nav-inactive hover:nav-hover'
                }
              `}
              style={({ isActive }) => ({
                background:    isActive ? 'var(--color-brand-muted)' : 'transparent',
                color:         isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                borderLeft:    isActive ? '2px solid var(--color-brand)' : '2px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2"
            style={{ background: 'var(--color-bg-surface)' }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--color-brand-muted)', color: 'var(--color-brand)' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {user?.email ?? 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-surface)'
              e.currentTarget.style.color = 'var(--color-error)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="flex items-center gap-4 px-4 py-3 lg:hidden"
          style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Moon size={16} style={{ color: 'var(--color-brand)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Muslim Life OS
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
