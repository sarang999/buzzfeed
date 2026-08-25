/**
 * Mobile auth persistence layer.
 *
 * Architecture:
 *   - expo-secure-store is the source of truth (device keychain / Android Keystore).
 *     Tokens are AES-256 encrypted at rest — never hit the filesystem unencrypted.
 *   - MMKV acts as a synchronous in-memory mirror so Zustand's synchronous
 *     `getItem` always has the value available. SecureStore is written async
 *     in the background after every update.
 *   - On cold boot, `hydrateAuthFromSecureStore()` reads SecureStore, seeds MMKV,
 *     then rehydrates the Zustand auth store so the first render already has the
 *     correct auth state with zero flicker.
 *
 * Token refresh lifecycle:
 *   The root _layout.tsx checks `isTokenExpired()` before every navigation event.
 *   If true, it calls `refreshTokens()` from the API layer and calls `setTokens()`
 *   on the store. On failure it calls `clearSession()` and redirects to /login.
 */

import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from '@buzzfeed/store';

// ─── MMKV instance for auth mirror ───────────────────────────────────────────
// Separate store from interactions to keep concerns isolated.
const authMmkv = new MMKV({ id: 'buzzfeed-auth-mirror' });

const AUTH_STORE_KEY = 'buzzfeed-auth';

// ─── Zustand storage adapter ─────────────────────────────────────────────────

const secureStorageAdapter = createJSONStorage(() => ({
  getItem: (key: string): string | null => {
    // Synchronous read from MMKV mirror — Zustand requires sync getItem.
    return authMmkv.getString(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    // 1. Update MMKV immediately so next synchronous read is consistent.
    authMmkv.set(key, value);
    // 2. Persist to SecureStore asynchronously (encrypted at rest).
    SecureStore.setItemAsync(key, value).catch((err: unknown) => {
      console.warn('[SecureAuth] SecureStore write failed:', err);
    });
  },

  removeItem: (key: string): void => {
    authMmkv.delete(key);
    SecureStore.deleteItemAsync(key).catch((err: unknown) => {
      console.warn('[SecureAuth] SecureStore delete failed:', err);
    });
  },
}));

// ─── Cold-boot hydration ──────────────────────────────────────────────────────

/**
 * Call once, early in app startup (before routing resolves), and await it.
 *
 * Reads the encrypted session from SecureStore, seeds the MMKV mirror,
 * swaps the Zustand storage adapter to SecureStore, then rehydrates the store.
 *
 * After this resolves, `useAuthStore.getState().isAuthenticated()` is reliable.
 */
export async function hydrateAuthFromSecureStore(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORE_KEY);
    if (raw) {
      // Seed the MMKV mirror before rehydration so `getItem` returns the value.
      authMmkv.set(AUTH_STORE_KEY, raw);
    }
    // Swap the Zustand persist storage to the secure adapter.
    useAuthStore.persist.setOptions({ storage: secureStorageAdapter });
    await useAuthStore.persist.rehydrate();
  } catch (err: unknown) {
    console.warn('[SecureAuth] Hydration failed — starting with empty session:', err);
  }
}
