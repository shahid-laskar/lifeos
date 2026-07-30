/**
 * In-memory token store. Tokens are intentionally NOT persisted to
 * localStorage/sessionStorage — a full page reload returns the user to sign-in.
 */

export type Tokens = {
  access_token: string;
  refresh_token: string;
};

let tokens: Tokens | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getTokens(): Tokens | null {
  return tokens;
}

export function getAccessToken(): string | null {
  return tokens?.access_token ?? null;
}

export function setTokens(next: Tokens | null) {
  tokens = next;
  emit();
}

export function clearTokens() {
  setTokens(null);
}

export function subscribeTokens(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTokensSnapshot() {
  return tokens;
}

export function getServerTokensSnapshot(): Tokens | null {
  return null;
}
