# Architecture & Engineering Decisions

This document explains the key engineering choices made in this codebase and the trade-offs considered. This is the kind of reasoning a senior engineer should be able to articulate in a code review.

---

## 1. FlashList over FlatList

**Decision**: Use `@shopify/flash-list` for the mobile feed instead of React Native's built-in `FlatList`.

**Why**: FlatList unmounts and remounts React components as they scroll off-screen. FlashList uses a *RecyclerView-style* model — it recycles the component instances and updates their data in-place. For a feed with complex cards (image, author, actions), this reduces the per-scroll CPU cost by an order of magnitude.

**Trade-off**: FlashList requires `estimatedItemSize` to be set correctly. If this value is significantly wrong, it causes layout jumps. We mitigate this with `overrideItemLayout` which specifies per-item sizes based on post type (with image: 380dp, text-only: 200dp). The discipline required is worth it for 60fps scrolling.

**Alternative considered**: Recyclerlistview. We chose FlashList 2 (actively maintained by Shopify, cleanest API, ships with Expo SDK 57).

---

## 2. Cursor-Based Pagination over Offset

**Decision**: Paginate using `cursor` (the last post ID) rather than `?page=1&limit=10`.

**Why**: Offset pagination has a well-known problem: if a new post is inserted while the user is scrolling, every subsequent offset page returns shifted results — causing duplicates or gaps. Cursor pagination anchors to a specific item, so concurrent feed updates don't corrupt the user's scroll position.

**Trade-off**: Cursor pagination requires the API to be ordered consistently (newest first in our case) and cannot support arbitrary "jump to page N" UX. For a social feed, this is the correct trade-off.

---

## 3. Zustand for Interaction State, TanStack Query for Server State

**Decision**: Split state management into two separate concerns.

- **TanStack Query**: Owns post content (author, image, caption, commentCount). Handles caching, background refetch, stale-time, deduplication.
- **Zustand**: Owns user *intent* (liked, saved, likeCount delta). Updates immediately on action, persists bookmarks to localStorage/AsyncStorage.

**Why**: These have fundamentally different characteristics. Server state is *owned by the API* — it should go stale, be refetched, and have a single canonical version. Interaction state is *owned by the user* — it should respond instantly, survive navigation, and be optimistic.

Putting server state in Zustand would require manually implementing what TanStack Query already does (deduplication, background refetch, garbage collection). Putting interaction state in TanStack Query would make optimistic rollback awkward and lose the cross-screen consistency that Zustand's single store provides.

**Trade-off**: Two state systems increase initial complexity. The benefit is that each system does exactly one thing well.

---

## 4. Shared `packages/store` — Framework-Agnostic Zustand

**Decision**: The Zustand store lives in `packages/store` and contains zero React Native or Next.js imports.

**Why**: Zustand's core `create()` is framework-agnostic. By keeping the store in a shared package, both the mobile app and web app share the exact same state logic, actions, and optimistic update patterns. A bug fixed in `optimisticLike` is fixed on both platforms simultaneously.

**Trade-off**: The store uses `localStorage` (web) as its persistence backend, but this doesn't run in React Native. We solve this with a try/catch SSR-safe accessor — the mobile app can override the storage adapter by swapping in `AsyncStorage` or `MMKV` via Zustand's `persist` middleware, since the store accepts an injected storage.

---

## 5. Shared `packages/api` — Mock Layer as Interface Contract

**Decision**: All API types and mock handlers live in a shared package, not in either app.

**Why**: The TypeScript interfaces (`Post`, `Author`, `FeedPage`, etc.) define the contract between the frontend and the (future) real API. By having them in one place, both apps import from the same source — there is no risk of type drift where the mobile app's `Post` type diverges from the web app's.

The mock handlers simulate realistic network conditions (300–800ms latency, 5% random errors) so that loading states, error boundaries, and optimistic rollback are exercised during development.

**Trade-off**: Swapping to a real API requires updating one file (`packages/api/src/mock/handlers.ts`), changing each function from a mock to an `await fetch(...)` call. The function signatures and types remain identical.

---

## 6. Expo Router over React Navigation

**Decision**: Use Expo Router (file-based routing) rather than configuring React Navigation directly.

**Why**: Expo Router v57 provides the same mental model as Next.js App Router — routes are files, layouts are `_layout.tsx`, dynamic segments are `[id].tsx`. This means developers familiar with Next.js can navigate the mobile app structure immediately. It also provides type-safe routes (via `typedRoutes: true` in app.json) and deep linking with zero additional configuration.

**Trade-off**: Expo Router is more opinionated about file structure and requires the Expo SDK. It doesn't support every advanced React Navigation pattern out of the box. For a standard tab + stack navigation pattern like this app, the trade-off is clearly positive.

---

## 7. Server Components for Initial Feed Data (Web)

**Decision**: `app/page.tsx` is a Server Component that calls `getPosts()` directly and passes the result as `initialData` to the client feed.

**Why**: On first load, users see the feed content in the HTML response — no client-side loading spinner. The page is crawlable by search engines. React 19 Suspense streaming means slow data doesn't block the entire page.

**Note (Next.js 15+ breaking change)**: `params` in Server Component pages is now a `Promise`. `app/post/[id]/page.tsx` awaits params before reading `.id`.

**Trade-off**: The initial data is fetched at render time. If the mock (or real API) is slow, the server response is slow. We mitigate this with `next: { revalidate: 60 }` in production, so frequently-visited pages serve cached HTML.

---

## 8. Reanimated Shimmer Skeleton — No Library

**Decision**: The mobile skeleton loader is implemented with Reanimated 4 `useSharedValue` + `withRepeat(withTiming(...))` + `interpolateColor` — no skeleton library installed.

**Why**: This demonstrates deep Reanimated knowledge, keeps the bundle smaller, and the shimmer runs on the **UI thread** via Reanimated's worklet system. A JS-thread-based shimmer would stutter if the JS thread is busy loading the first page of data. Ours doesn't.

**Trade-off**: ~40 lines of code vs `npm install`. Worth it.

---

## 9. Optimistic Update Pattern

Both like and save use the same pattern:

1. **`onMutate`**: Call Zustand `optimisticLike(postId)` — UI updates in <1ms
2. **Network request**: Fires in background
3. **`onSuccess`**: Call `confirmLike(postId, serverCount)` — reconcile with server truth
4. **`onError`**: Call `rollbackLike(postId)` + show toast — restore previous state silently

This means the UI *always* responds instantly. If the network request fails (which our mock does 5% of the time), the user sees a brief toast but the UI restores itself — no jarring state flip.

## 11. Auth Flow — JWT Storage, Token Lifecycle, and the Zustand Store Design

**Decision**: Store auth session (user + tokens) in a dedicated Zustand store (`packages/store/src/auth.ts`) with storage injected per platform.

**Why a separate auth store, not the interaction store or React Context?**

The interaction store's `persist` middleware is specifically configured to persist only `saved` bookmarks. Mixing auth tokens into it would either leak token data into a less-secure storage bucket or require maintaining two separate partialize functions in the same store — both are maintenance liabilities.

React Context was considered for web-only auth. Rejected because:
1. The mobile app needs the same auth state and Context doesn't cross the React Native / Next.js boundary.
2. Zustand's `persist` middleware handles storage injection cleanly, whereas Context would require a separate `useEffect` + `localStorage` read on every page load.

**Mobile — expo-secure-store + MMKV mirror:**

expo-secure-store uses the device keychain (iOS) and Android Keystore (Android). Tokens are AES-256 encrypted at rest and never touch the filesystem unencrypted.

The core challenge: Zustand's `persist` middleware calls `getItem` synchronously during the first render, but expo-secure-store is async. We solve this with a two-layer approach:
- MMKV acts as a fast synchronous mirror (RAM + mmap — reads in ~1µs).
- On cold boot, `hydrateAuthFromSecureStore()` reads SecureStore async, seeds MMKV, then rehydrates Zustand. The root layout awaits this before allowing routing to resolve, so the first render already has the correct auth state.
- Writes go to MMKV immediately (synchronous path) and to SecureStore asynchronously in the background.

**Token refresh lifecycle:**

Access tokens expire in 15 minutes (configurable). The store exposes `isTokenExpired: boolean` (not a function — Zustand subscriptions only re-render on value changes, not function call results). The root `_layout.tsx` listens to `AppState` and silently refreshes on foreground if the token is within 60 seconds of expiry. On refresh failure, `clearSession()` is called and the user is redirected to the login screen.

**Derived booleans vs methods:**

`isAuthenticated` and `isTokenExpired` are stored as plain boolean fields, not methods. This is a deliberate Zustand pattern: if they were methods (`s.isAuthenticated()`), the selector would subscribe to the function reference — which is stable — and never re-render when `user` changes. Storing them as booleans recomputed on every mutation means the subscription fires correctly.

**Trade-off**: The derived booleans must be kept in sync manually in `setSession`, `setTokens`, and `clearSession`. This is acceptable because these mutations are the only paths that change `user` or `tokens`, and they're all in one file.

---

| Area | Current | Production |
|------|---------|-----------|
| API | In-memory mock functions | REST/GraphQL API with real auth |
| Auth | None | JWT + Expo SecureStore / httpOnly cookie |
| Images | Unsplash CDN | Cloudflare Images / S3 + CDN with signed URLs |
| Persistence | In-memory (mobile) | MMKV via Zustand persist middleware |
| Analytics | None | Amplitude / PostHog (event on like, share, scroll depth) |
| Tests | None | Jest + RNTL for components, Detox for E2E critical flows |
| Monitoring | None | Sentry (crash reporting + performance traces) |
| CI/CD | None | GitHub Actions → EAS Build (mobile) + Vercel (web) |
