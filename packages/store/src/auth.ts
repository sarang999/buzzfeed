/**
 * Auth store — single source of truth for session state.
 *
 * Design principles:
 *  - Zero RN / Next.js imports: works in any JS runtime.
 *  - Storage adapter is injected per platform at startup:
 *      Mobile  → expo-secure-store (device keychain / Android Keystore)
 *      Web     → httpOnly cookie in production; localStorage in dev/mock
 *  - Tokens are persisted; isLoading is ephemeral (never persisted).
 *  - isTokenExpired() proactively triggers refresh 60 s before actual expiry
 *    so in-flight mutations never hit a 401.
 *  - clearSession() is the single logout path — both platforms call it.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, AuthTokens, AuthSession } from '@buzzfeed/api';

// ─── State shape ─────────────────────────────────────────────────────────────

interface AuthState {
  /** Null until a session is established. */
  user: AuthUser | null;

  /** Null until a session is established. Never log/expose accessToken. */
  tokens: AuthTokens | null;

  /** True while login / register / token-refresh is in-flight. */
  isLoading: boolean;

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Persist a full session after login or register. */
  setSession: (session: AuthSession) => void;

  /** Swap tokens after a silent refresh — does not change the user object. */
  setTokens: (tokens: AuthTokens) => void;

  /** Full logout — wipes user + tokens from memory and persisted storage. */
  clearSession: () => void;

  setLoading: (loading: boolean) => void;

  // ── Derived ───────────────────────────────────────────────────────────────

  isAuthenticated: () => boolean;

  /**
   * Returns true when the access token has expired or will expire within
   * the next 60 seconds — callers should refresh before firing a mutation.
   */
  isTokenExpired: () => boolean;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,

      setSession: (session) =>
        set({ user: session.user, tokens: session.tokens, isLoading: false }),

      setTokens: (tokens) => set({ tokens }),

      clearSession: () => set({ user: null, tokens: null, isLoading: false }),

      setLoading: (loading) => set({ isLoading: loading }),

      isAuthenticated: () => {
        const { user, tokens } = get();
        return user !== null && tokens !== null;
      },

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens) return true;
        return Date.now() >= tokens.expiresAt - 60_000;
      },
    }),
    {
      name: 'buzzfeed-auth',

      // Only persist the session data — never persist loading state.
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),

      // Default: SSR-safe localStorage for web dev / mock.
      // Mobile overrides this with the SecureStore adapter at startup.
      storage: createJSONStorage(() => {
        try {
          return typeof window !== 'undefined' && window.localStorage
            ? localStorage
            : noopStorage;
        } catch {
          return noopStorage;
        }
      }),
    },
  ),
);

// ─── SSR / headless fallback ─────────────────────────────────────────────────

const noopStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => undefined,
  removeItem: (_key: string): void => undefined,
};
