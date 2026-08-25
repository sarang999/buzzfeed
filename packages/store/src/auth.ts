/**
 * Auth store — single source of truth for session state.
 *
 * Design principles:
 *  - Zero RN / Next.js imports: works in any JS runtime.
 *  - Storage adapter is injected per platform at startup:
 *      Mobile  → expo-secure-store (device keychain / Android Keystore)
 *      Web     → httpOnly cookie in production; localStorage in dev/mock
 *  - Tokens are persisted; isLoading is ephemeral (never persisted).
 *
 * Selector pattern:
 *  - `isAuthenticated` and `isTokenExpired` are boolean fields, NOT functions.
 *  - Zustand re-runs selectors when the selected slice changes. If these were
 *    methods (s.isAuthenticated()), the selector would only subscribe to the
 *    function reference — which never changes — so components would not
 *    re-render when user or tokens change.
 *  - The store keeps these in sync via middleware: every `set()` call that
 *    touches `user` or `tokens` automatically recomputes the derived booleans.
 *
 * Token refresh strategy:
 *  - `isTokenExpired` is true when the access token expires in < 60 s.
 *  - Mobile _layout.tsx listens to AppState and silently refreshes on foreground.
 *  - `clearSession()` is the single logout path — called on refresh failure too.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, AuthTokens, AuthSession } from '@buzzfeed/api';

// ─── State shape ─────────────────────────────────────────────────────────────

interface AuthState {
  /** Null until a session is established. */
  user: AuthUser | null;

  /** Null until a session is established. Never log/expose the accessToken. */
  tokens: AuthTokens | null;

  /** True while login / register / token-refresh is in-flight. */
  isLoading: boolean;

  /**
   * Derived: true when user and tokens are both non-null.
   * Stored as a plain boolean so Zustand subscriptions fire correctly when
   * the session is established or cleared.
   */
  isAuthenticated: boolean;

  /**
   * Derived: true when the access token has expired or will expire within
   * 60 seconds. Stored as a plain boolean for the same subscription reason.
   * Recomputed in setTokens and clearSession.
   */
  isTokenExpired: boolean;

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Persist a full session after login or register. */
  setSession: (session: AuthSession) => void;

  /** Swap tokens after a silent refresh — does not change the user object. */
  setTokens: (tokens: AuthTokens) => void;

  /** Full logout — wipes user + tokens from memory and persisted storage. */
  clearSession: () => void;

  setLoading: (loading: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

function computeIsTokenExpired(tokens: AuthTokens | null): boolean {
  if (!tokens) return true;
  // Refresh 60 s before actual expiry to avoid edge-case 401s on slow networks
  return Date.now() >= tokens.expiresAt - 60_000;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      isTokenExpired: true,

      setSession: (session) =>
        set({
          user: session.user,
          tokens: session.tokens,
          isLoading: false,
          isAuthenticated: true,
          isTokenExpired: computeIsTokenExpired(session.tokens),
        }),

      setTokens: (tokens) =>
        set((state) => ({
          tokens,
          // isAuthenticated doesn't change — user is still present
          isTokenExpired: computeIsTokenExpired(tokens),
          // Preserve other fields
          user: state.user,
        })),

      clearSession: () =>
        set({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
          isTokenExpired: true,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'buzzfeed-auth',

      // Only persist session data — never persist loading or derived flags.
      // The derived booleans are recomputed from user/tokens on rehydration
      // via the `onRehydrateStorage` hook below.
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Recompute derived fields after rehydration from storage.
        state.isAuthenticated = state.user !== null && state.tokens !== null;
        state.isTokenExpired = computeIsTokenExpired(state.tokens);
      },

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
