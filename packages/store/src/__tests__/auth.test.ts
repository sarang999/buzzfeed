import { useAuthStore } from '../auth';
import type { AuthSession } from '@buzzfeed/api';

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeSession(overrides?: Partial<AuthSession['tokens']>): AuthSession {
  return {
    user: {
      id: 'user_1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: 'https://i.pravatar.cc/150?u=test',
    },
    tokens: {
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min from now
      ...overrides,
    },
  };
}

// Reset store before each test to prevent state leaking across tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    tokens: null,
    isLoading: false,
    isAuthenticated: false,
    isTokenExpired: true,
  });
});

// ─── setSession ───────────────────────────────────────────────────────────────

describe('setSession', () => {
  it('stores user and tokens', () => {
    const session = makeSession();
    useAuthStore.getState().setSession(session);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(session.user);
    expect(state.tokens).toEqual(session.tokens);
  });

  it('sets isAuthenticated to true', () => {
    useAuthStore.getState().setSession(makeSession());
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('sets isLoading to false', () => {
    useAuthStore.setState({ isLoading: true });
    useAuthStore.getState().setSession(makeSession());
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sets isTokenExpired false for a fresh token', () => {
    useAuthStore.getState().setSession(makeSession({ expiresAt: Date.now() + 20 * 60 * 1000 }));
    expect(useAuthStore.getState().isTokenExpired).toBe(false);
  });

  it('sets isTokenExpired true when token is already expired', () => {
    useAuthStore.getState().setSession(makeSession({ expiresAt: Date.now() - 1000 }));
    expect(useAuthStore.getState().isTokenExpired).toBe(true);
  });

  it('sets isTokenExpired true when token expires within 60 s (refresh window)', () => {
    // 30 s left — within the 60 s proactive refresh window
    useAuthStore.getState().setSession(makeSession({ expiresAt: Date.now() + 30_000 }));
    expect(useAuthStore.getState().isTokenExpired).toBe(true);
  });
});

// ─── setTokens ────────────────────────────────────────────────────────────────

describe('setTokens', () => {
  it('replaces tokens without changing user', () => {
    const session = makeSession();
    useAuthStore.getState().setSession(session);

    const newTokens = {
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    useAuthStore.getState().setTokens(newTokens);

    const state = useAuthStore.getState();
    expect(state.tokens).toEqual(newTokens);
    expect(state.user).toEqual(session.user); // unchanged
    expect(state.isAuthenticated).toBe(true); // still authenticated
  });

  it('recomputes isTokenExpired after token swap', () => {
    useAuthStore.getState().setSession(makeSession({ expiresAt: Date.now() - 1000 }));
    expect(useAuthStore.getState().isTokenExpired).toBe(true);

    useAuthStore.getState().setTokens({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
      expiresAt: Date.now() + 30 * 60 * 1000,
    });
    expect(useAuthStore.getState().isTokenExpired).toBe(false);
  });
});

// ─── clearSession ─────────────────────────────────────────────────────────────

describe('clearSession', () => {
  it('clears user, tokens, and derived fields', () => {
    useAuthStore.getState().setSession(makeSession());
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isTokenExpired).toBe(true);
    expect(state.isLoading).toBe(false);
  });
});

// ─── setLoading ───────────────────────────────────────────────────────────────

describe('setLoading', () => {
  it('sets isLoading flag', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

// ─── isAuthenticated invariant ────────────────────────────────────────────────

describe('isAuthenticated invariant', () => {
  it('is false with no session', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('is true after setSession', () => {
    useAuthStore.getState().setSession(makeSession());
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('is false after clearSession', () => {
    useAuthStore.getState().setSession(makeSession());
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
