import type { FeedPage, Post, PostDetail, Comment, AuthSession, LoginInput, RegisterInput } from '../types';
import { MOCK_POSTS, MOCK_COMMENTS } from './data';

// ─── Mock auth store (in-memory, resets on reload — swap for real DB calls) ──

interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string; // plaintext in mock — never do this in production
  avatarUrl: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'user_demo',
    name: 'Demo Traveler',
    username: 'demo',
    email: 'demo@buzzfeed.travel',
    passwordHash: 'password123',
    avatarUrl: 'https://i.pravatar.cc/150?u=demo',
  },
];

/** Generate a mock JWT-shaped token (not a real JWT — swap for jsonwebtoken in production) */
function mockToken(userId: string, type: 'access' | 'refresh'): string {
  const payload = btoa(JSON.stringify({ sub: userId, type, iat: Date.now() }));
  return `mock.${payload}.signature`;
}

function makeSession(user: MockUser): AuthSession {
  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    tokens: {
      accessToken: mockToken(user.id, 'access'),
      refreshToken: mockToken(user.id, 'refresh'),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
    },
  };
}

export async function login(input: LoginInput): Promise<AuthSession> {
  await simulateLatency();

  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.passwordHash === input.password,
  );
  if (!user) throw new Error('Invalid email or password.');

  return makeSession(user);
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  await simulateLatency();

  if (MOCK_USERS.find((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  if (MOCK_USERS.find((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    throw new Error('This username is already taken.');
  }

  const newUser: MockUser = {
    id: `user_${Date.now()}`,
    name: input.name,
    username: input.username,
    email: input.email,
    passwordHash: input.password,
    avatarUrl: `https://i.pravatar.cc/150?u=${input.username}`,
  };
  MOCK_USERS.push(newUser);

  return makeSession(newUser);
}

export async function refreshTokens(refreshToken: string): Promise<AuthSession> {
  await simulateLatency();

  // In production: verify refreshToken signature, look up user from DB
  try {
    const parts = refreshToken.split('.');
    const payload = parts[1];
    if (!payload) throw new Error('Malformed token');
    const { sub } = JSON.parse(atob(payload)) as { sub: string };
    const user = MOCK_USERS.find((u) => u.id === sub);
    if (!user) throw new Error('User not found');
    return makeSession(user);
  } catch {
    throw new Error('Invalid or expired refresh token. Please log in again.');
  }
}

const PAGE_SIZE = 10;

/** Simulates realistic network latency: 300–800ms */
function simulateLatency(): Promise<void> {
  const ms = 300 + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 5% chance of network error for realistic error-state testing */
function maybeThrow(): void {
  if (Math.random() < 0.05) {
    throw new Error('Network request failed. Please try again.');
  }
}

export async function getPosts(cursor?: string | null): Promise<FeedPage> {
  await simulateLatency();
  maybeThrow();

  const startIndex = cursor ? MOCK_POSTS.findIndex((p) => p.id === cursor) + 1 : 0;
  const slice = MOCK_POSTS.slice(startIndex, startIndex + PAGE_SIZE);
  const lastPost = slice[slice.length - 1];
  const hasMore = startIndex + PAGE_SIZE < MOCK_POSTS.length;

  return {
    posts: slice,
    nextCursor: hasMore && lastPost ? lastPost.id : null,
    total: MOCK_POSTS.length,
  };
}

export async function getPostById(id: string): Promise<PostDetail> {
  await simulateLatency();
  maybeThrow();

  const post = MOCK_POSTS.find((p) => p.id === id);
  if (!post) throw new Error(`Post ${id} not found`);

  return { ...post, comments: MOCK_COMMENTS };
}

export async function getComments(_postId: string): Promise<Comment[]> {
  await simulateLatency();
  return MOCK_COMMENTS;
}

export async function likePost(
  _postId: string,
  liked: boolean,
): Promise<{ likeCount: number }> {
  await simulateLatency();
  maybeThrow();

  const post = MOCK_POSTS.find((p) => p.id === _postId);
  // Return the adjusted count reflecting the new state
  const base = post?.likeCount ?? 0;
  return { likeCount: liked ? base + 1 : Math.max(0, base - 1) };
}

export async function savePost(_postId: string, _saved: boolean): Promise<void> {
  await simulateLatency();
  maybeThrow();
}

export async function getPostsByIds(ids: string[]): Promise<Post[]> {
  await simulateLatency();
  return MOCK_POSTS.filter((p) => ids.includes(p.id));
}
