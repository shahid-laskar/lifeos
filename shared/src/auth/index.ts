/**
 * Shared authentication utilities — platform neutral.
 *
 * Implements the token storage contract that both web and React Native
 * must satisfy. Each platform provides its own concrete implementation
 * (web: in-memory + httpOnly cookie; mobile: SecureStore).
 */

export interface AuthTokenStore {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh: string): void
  clearTokens(): void
}

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
}

/** Decodes a JWT payload without verifying the signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Returns true if the JWT is expired (or unparseable). */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload['exp'] !== 'number') return true
  return payload['exp'] * 1000 < Date.now()
}
