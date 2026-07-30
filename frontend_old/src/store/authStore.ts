/**
 * Auth store (Zustand)
 *
 * Owns the session state for the entire app.
 * Keeps access tokens in-memory (setAccessToken/clearTokens from client.ts).
 * Exposes typed actions for the rest of the app.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import client, {
  clearTokens,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export interface UserProfile {
  id: string
  email: string
  preferred_language: string | null
  country: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  prayer_calculation_method: string | null
  asr_method: string | null
  goals: string[]
  created_at: string
}

export interface OnboardingStatus {
  location_set: boolean
  prayer_preferences_set: boolean
  goals_set: boolean
  first_meaningful_outcome_available: boolean
}

interface AuthState {
  user: UserProfile | null
  onboarding: OnboardingStatus | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login:    (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout:   () => void
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  fetchOnboarding: () => Promise<void>
  _hydrate: (accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      onboarding:      null,
      isAuthenticated: false,
      isLoading:       false,

      _hydrate(at, rt) {
        setAccessToken(at)
        setRefreshToken(rt)
        set({ isAuthenticated: true })
      },

      async login(email, password) {
        set({ isLoading: true })
        try {
          const { data } = await client.post<{ access_token: string; refresh_token: string }>(
            ENDPOINTS.LOGIN,
            { email, password },
          )
          setAccessToken(data.access_token)
          setRefreshToken(data.refresh_token)
          set({ isAuthenticated: true })
          await get().fetchProfile()
        } finally {
          set({ isLoading: false })
        }
      },

      async register(email, password) {
        set({ isLoading: true })
        try {
          const { data } = await client.post<{ access_token: string; refresh_token: string }>(
            ENDPOINTS.REGISTER,
            { email, password, terms_accepted: true },
          )
          setAccessToken(data.access_token)
          setRefreshToken(data.refresh_token)
          set({ isAuthenticated: true })
          await get().fetchProfile()
        } finally {
          set({ isLoading: false })
        }
      },

      logout() {
        clearTokens()
        set({ user: null, onboarding: null, isAuthenticated: false })
      },

      async fetchProfile() {
        const { data } = await client.get<UserProfile>(ENDPOINTS.ME)
        set({ user: data })
      },

      async updateProfile(update) {
        const { data } = await client.patch<UserProfile>(ENDPOINTS.PROFILE, update)
        set({ user: data })
      },

      async fetchOnboarding() {
        const { data } = await client.get<OnboardingStatus>(ENDPOINTS.ONBOARDING)
        set({ onboarding: data })
      },
    }),
    {
      name: 'mlos-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist minimal state — tokens live in memory / localStorage separately
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
)
