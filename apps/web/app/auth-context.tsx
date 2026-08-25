'use client';

/**
 * Web auth context.
 *
 * Wraps the Zustand auth store in a React context so:
 *  1. Components can call `useAuth()` without importing the store directly.
 *  2. The provider handles the one-time `persist.rehydrate()` call needed
 *     because Next.js server-renders the initial HTML before localStorage
 *     is available — the store starts hydrated=false on first render.
 *  3. `isHydrated` prevents the header from flashing "Sign in" then
 *     immediately switching to the user's name on page load.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@buzzfeed/store';
import type { AuthUser } from '@buzzfeed/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  logout: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Tracks whether the Zustand persist layer has finished rehydrating
  // from localStorage on the client. Until true, treat auth as unknown.
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // `onFinishHydration` fires synchronously if already hydrated
    // or asynchronously after the first client-side rehydration.
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
    // If already hydrated (possible on fast re-mounts), set immediately.
    if (useAuthStore.persist.hasHydrated()) setIsHydrated(true);
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isHydrated, logout: clearSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
