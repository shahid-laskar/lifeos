import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep production-safe diagnostics without exposing the error to users.
    if (import.meta.env.DEV) {
      console.error('Frontend rendering error', error, info)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          background: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <section
          role="alert"
          style={{
            width: 'min(100%, 32rem)',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <AlertTriangle size={28} style={{ color: 'var(--color-warning)', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something needs a moment</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 1.5rem' }}>
            This screen could not be displayed. You can try again without losing your session.
          </p>
          <Button onClick={this.handleRetry}>Try again</Button>
        </section>
      </main>
    )
  }
}
