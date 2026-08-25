/**
 * Root layout — bootstraps all providers and handles the auth routing gate.
 *
 * Boot sequence:
 *  1. GestureHandlerRootView + SafeAreaProvider + QueryClientProvider wrap everything.
 *  2. `hydrateStoreFromMMKV()` rehydrates interaction state (bookmarks) from MMKV.
 *  3. `hydrateAuthFromSecureStore()` decrypts and restores the auth session from
 *     the device keychain before routing resolves — zero flicker on warm launch.
 *  4. Once both hydrations are complete, `isReady` flips to true and the Stack
 *     navigator renders. This prevents the auth guard from firing before the
 *     persisted session is loaded (avoids false redirects to /login on warm launch).
 *  5. Token expiry: on every app foreground event, if the access token is within
 *     60 s of expiry, a silent refresh fires. On failure, the session is cleared
 *     and the user is redirected to the auth flow.
 */

import { useEffect, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@buzzfeed/store';
import { refreshTokens } from '@buzzfeed/api';
import { hydrateStoreFromMMKV } from '@/utils/storage';
import { hydrateAuthFromSecureStore } from '@/utils/secureAuth';
import { OfflineBanner } from '@/components/OfflineBanner';

// ─── QueryClient — module-level singleton (safe in RN; no SSR concerns) ──────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});

// ─── Auth routing guard ───────────────────────────────────────────────────────

/**
 * Watches auth state and current route segments. Redirects to /(auth)/login
 * when unauthenticated and to /(tabs) when authenticated, but only after the
 * persisted session has been rehydrated from SecureStore (`isReady`).
 */
function AuthGuard({ isReady }: { isReady: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, segments]);

  return null;
}

// ─── Root layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  const setTokens = useAuthStore((s) => s.setTokens);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);
  const tokens = useAuthStore((s) => s.tokens);

  // ── Cold-boot hydration ────────────────────────────────────────────────────
  useEffect(() => {
    async function boot() {
      // Both hydrations run concurrently — they touch independent stores.
      await Promise.all([hydrateStoreFromMMKV(), hydrateAuthFromSecureStore()]);
      setIsReady(true);
    }
    void boot();
  }, []);

  // ── Silent token refresh on foreground ────────────────────────────────────
  const handleAppStateChange = useCallback(
    async (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      if (!tokens?.refreshToken) return;
      if (!isTokenExpired()) return;

      try {
        const session = await refreshTokens(tokens.refreshToken);
        setTokens(session.tokens);
      } catch {
        // Refresh token itself expired — force re-login.
        clearSession();
      }
    },
    [tokens, isTokenExpired, setTokens, clearSession],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [handleAppStateChange]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard isReady={isReady} />

          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {/* Auth flow — shown when unauthenticated */}
            <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />

            {/* Main app — shown when authenticated */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Post detail — pushed onto the stack from either tab */}
            <Stack.Screen
              name="post/[id]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: '#f97316',
                headerStyle: { backgroundColor: '#ffffff' },
                headerShadowVisible: false,
                presentation: 'card',
              }}
            />
          </Stack>

          <StatusBar style="auto" />
          <Toast />
          <OfflineBanner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
