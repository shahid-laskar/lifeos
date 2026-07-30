/**
 * Axios client with JWT interceptors.
 *
 * Security notes per 086_Frontend_Security.md:
 * - Access token stored in memory only (not localStorage / sessionStorage)
 * - Refresh token persisted in localStorage for session continuity
 * - Automatic retry on 401 using refresh token
 * - Never logs tokens to console
 */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

// In-memory access token — not persisted (86_Frontend_Security: avoid storing JWTs in localStorage)
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setRefreshToken(token: string): void {
  // refresh token lives in localStorage for session persistence
  localStorage.setItem('mlos_rt', token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('mlos_rt')
}

export function clearTokens(): void {
  accessToken = null
  localStorage.removeItem('mlos_rt')
}

// ── Client instance ──────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Authorization header
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Transparent token refresh on 401
let refreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean }

    if (error.response?.status === 401 && !original._retried) {
      original._retried = true

      if (refreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              ;(original.headers as Record<string, string>).Authorization = `Bearer ${token}`
              resolve(client(original))
            } else {
              reject(error)
            }
          })
        })
      }

      refreshing = true
      const rt = getRefreshToken()

      if (!rt) {
        refreshing = false
        clearTokens()
        window.dispatchEvent(new Event('mlos:session-expired'))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
          '/api/v1/auth/refresh',
          { refresh_token: rt },
        )
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)
        refreshQueue.forEach((cb) => cb(data.access_token))
        refreshQueue = []
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${data.access_token}`
        return client(original)
      } catch {
        refreshQueue.forEach((cb) => cb(null))
        refreshQueue = []
        clearTokens()
        window.dispatchEvent(new Event('mlos:session-expired'))
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default client
