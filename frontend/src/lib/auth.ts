import { useSyncExternalStore } from "react";
import {
  clearTokens,
  getServerTokensSnapshot,
  getTokensSnapshot,
  setTokens,
  subscribeTokens,
  type Tokens,
} from "./api/tokens";

export function useTokens() {
  return useSyncExternalStore(subscribeTokens, getTokensSnapshot, getServerTokensSnapshot);
}

export function useIsAuthenticated() {
  return useTokens() !== null;
}

export function signIn(tokens: Tokens) {
  setTokens(tokens);
}

export function signOut() {
  clearTokens();
}
