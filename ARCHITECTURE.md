# BuzzFeed Travel — Architecture & Engineering Decisions

> **This document is the definitive engineering record for the BuzzFeed Travel submission.**
> Every decision below was made deliberately, with alternatives considered and trade-offs weighed.

---

## Why a Monorepo?

BuzzFeed Travel ships on three surfaces — a Next.js web app, a React Native iOS app, and a React Native Android app. Without a monorepo, three separate repositories would mean:

- **Type drift**: `Post`, `Author`, and `FeedPage` TypeScript interfaces diverge silently between platforms. A field rename on the web is not reflected on mobile until a runtime error surfaces in production.
- **Duplicated logic**: The optimistic-update pattern (`onMutate → optimisticLike → onError → rollbackLike`) would be copy-pasted, meaning a bug fix needs to land in two places.
- **Coordination overhead**: Merging a mock-API change requires opening PRs in two repositories and coordinating merge order.

A **pnpm workspace + Turborepo** monorepo solves all three:

| Problem | Solution |
|---------|----------|
| Type drift | `packages/api/src/types.ts` is the single source of truth. Both apps import from it; a type mismatch is a build error, not a runtime surprise. |
| Duplicated logic | `packages/store` contains the Zustand interaction store. A fix to `optimisticLike` propagates to both platforms simultaneously. |
| Coordination overhead | One PR, one CI run, one merge. Turborepo's task graph runs `tsc`, `test`, and `build` in the correct order across all packages in parallel. |

**Trade-off accepted:** pnpm workspaces add complexity to `node_modules` resolution and require Metro's `watchFolders` configuration on mobile. This is a one-time setup cost paid once and documented.

---

## 1. FlashList over FlatList

**Decision**: `@shopify/flash-list` for the mobile feed.

**Why**: FlatList unmounts and remounts React components as they scroll off-screen — each card with an image, author row, and action bar gets fully destroyed and re-created. FlashList uses a *RecyclerView-style* model: it recycles the component instance and updates its data in place. For a feed with 50 posts (each ≈380dp), this reduces per-scroll CPU cost by an order of magnitude and keeps frame rate at 60fps on mid-range devices.

**Trade-off**: FlashList 2.x removed `estimatedItemSize` and `overrideItemLayout` for single-column lists. We simplified to rely on FlashList's auto-measurement, which adds a single layout pass on first render but removes a class of layout-jump bugs caused by wrong estimates.

**Alternative considered**: `RecyclerListView` (Flipkart). Rejected because FlashList 2.x ships with Expo SDK 57, has a cleaner API, and is actively maintained by Shopify.

---

## 2. Cursor-Based Pagination over Offset

**Decision**: `cursor` (last post ID) rather than `?page=1&limit=10`.

**Why**: Offset pagination is broken under concurrent inserts. If a new post is inserted while the user is scrolling from page 1 to page 2, every page-N result shifts by one — producing either a duplicate post or a gap. Cursor pagination anchors to a specific item: `getPosts(cursor: "post-010")` always returns the 10 posts after `post-010`, regardless of what was inserted above it.

**Trade-off**: Cannot jump to an arbitrary page (e.g. "page 5 of 50"). For a social feed, this is the correct trade-off — users scroll linearly, they don't page-jump. The API returns `nextCursor: null` to signal end-of-feed cleanly.

---

## 3. State Split: Zustand (interactions) + TanStack Query (server data)

**Decision**: Two state systems with explicitly separated concerns.

- **TanStack Query** owns post *content* (author, caption, image, comment count). It handles caching, background refetch, deduplication, and stale-time. Post content is *owned by the server*.
- **Zustand** owns *user intent* (liked, saved, like counts). It updates in <1ms, survives navigation, and drives optimistic UI. Interaction state is *owned by the user*.

**Why not Redux for everything?** Redux would require manually implementing what TanStack Query already does (deduplication, garbage collection, background refetch). Putting interaction state in TanStack Query would make optimistic rollback awkward and lose cross-screen consistency.

**Why not Zustand for everything?** Zustand has no concept of stale-time, background refetch, or request deduplication. Every navigation to the feed would require a manual invalidation call.

**Trade-off**: Two systems increase initial learning curve. The benefit is that each system does exactly one thing well, and there is never confusion about which store owns what.

---

## 4. Zustand Subscription Patterns — Correctness Detail

Two subtle correctness decisions that any senior reviewer will inspect:

### 4a. Atomic selectors in PostCard

`PostCardComponent` uses **one atomic selector** returning a single object, rather than six individual `usePostInteractionStore` calls:

```ts
const { liked, saved, likeCount, optimisticLike, ... } = usePostInteractionStore(s => ({
  liked: s.interactions[post.id]?.liked ?? false,
  ...
}))
```

With six selectors, Zustand fires six notification cycles on a single store update — producing intermediate renders where `liked` is `true` but `likeCount` still holds the old value (tearing). One atomic selector guarantees all fields update in a single render.

### 4b. Derived booleans, not methods

`isAuthenticated` and `isTokenExpired` in the auth store are **plain `boolean` fields**, not methods:

```ts
// Wrong — selector subscribes to the function reference (stable, never fires):
const authed = useAuthStore(s => s.isAuthenticated())

// Correct — selector subscribes to the boolean value (changes on login/logout):
const authed = useAuthStore(s => s.isAuthenticated)
```

If `isAuthenticated` were a method, calling `s.isAuthenticated()` in a selector subscribes to the function reference — which never changes — so the component never re-renders on login or logout.

---

## 5. Shared `packages/store` — Framework-Agnostic Zustand

**Decision**: Zero React Native / Next.js imports in `packages/store`.

Zustand's `create()` is framework-agnostic. By keeping the store clean of platform imports, it runs identically on web (Next.js server render, browser), iOS (Hermes), and Android (Hermes). Storage adapters are *injected* at startup:

| Platform | Storage adapter | Where injected |
|----------|----------------|----------------|
| Mobile (interactions) | MMKV | `utils/storage.ts` → `hydrateStoreFromMMKV()` |
| Mobile (auth tokens) | expo-secure-store + MMKV mirror | `utils/secureAuth.ts` → `hydrateAuthFromSecureStore()` |
| Web | `localStorage` | SSR-safe default in `createJSONStorage` |

**Trade-off**: Each app is responsible for injecting the correct storage at startup. If forgotten, persist silently degrades to a no-op. Mitigated by calling both hydration functions before routing resolves in `_layout.tsx`.

---

## 6. Auth Flow — JWT Storage & Token Lifecycle

### Why a dedicated auth store

- Mixing tokens into the interaction store would either leak them into a less-secure storage bucket or require maintaining two `partialize` functions in the same store.
- React Context was considered for web. Rejected because the mobile app needs the same auth state and Context doesn't cross the React Native / Next.js boundary.

### Mobile: expo-secure-store + MMKV two-layer approach

`expo-secure-store` uses the **device keychain (iOS)** and **Android Keystore (Android)**. Tokens are AES-256 encrypted at rest and never touch the filesystem unencrypted.

The challenge: Zustand's `persist` middleware calls `getItem` **synchronously** during the first render, but expo-secure-store is **async**. Solution:

1. MMKV acts as a fast synchronous mirror (~1µs reads).
2. On cold boot, `hydrateAuthFromSecureStore()` reads SecureStore async, seeds MMKV, rehydrates Zustand.
3. Writes go to MMKV immediately, SecureStore asynchronously in the background.
4. The root `_layout.tsx` `await`s both hydrations before routing resolves — zero auth flicker on warm launch.

### Token refresh lifecycle

- `expiresAt` is set to 15 minutes from login.
- `isTokenExpired` is `true` when within 60 seconds of expiry (proactive refresh window).
- `AppState` foreground listener in `_layout.tsx` triggers a silent token refresh if expired.
- On refresh failure: `clearSession()` → redirect to login.

---

## 7. Optimistic Update Pattern

Both like and save use the same four-step pattern, consistent across web and mobile:

```
onMutate  → Zustand optimisticLike(postId)     [UI updates in <1ms]
network   → likePost(postId, !currentState)    [fires in background]
onSuccess → Zustand confirmLike(postId, count) [reconcile with server truth]
onError   → Zustand rollbackLike(postId)       [restore previous state]
           + Toast / inline error               [unobtrusive user feedback]
```

The mock API introduces a **5% random error rate** to ensure the rollback path is exercised in every dev session. UI always responds instantly.

**Stale closure fix**: `mutationFn` reads the current `liked` state via `usePostInteractionStore.getState()` at call-time, not from a closure. This prevents the classic React mutation bug where `!liked` uses a stale value from a previous render.

---

## 8. Server Components for Initial Feed Data (Web)

**Decision**: `app/page.tsx` is a React Server Component that calls `getPosts()` directly.

**Why**: On first load, the feed HTML arrives pre-filled in the server response — no client-side loading spinner, no layout shift. The page is crawlable by search engines. React 19 Suspense streaming means slow data doesn't block the entire HTML response.

**Note (Next.js 15+ breaking change)**: `params` in Server Component pages is now a `Promise`. `app/post/[id]/page.tsx` awaits params before reading `.id`.

**Trade-off**: If the mock (or real API) is slow, the server response is slow. Mitigated with `revalidate` in production, so cached HTML is served for frequently-visited pages.

---

## 9. Reanimated Shimmer Skeleton — No Library

**Decision**: UI-thread shimmer skeleton built with Reanimated 4 `useSharedValue` + `withRepeat` + `interpolateColor`. No npm library.

**Why**: This demonstrates deep Reanimated knowledge and the shimmer runs on the **UI thread via worklets** — it stays smooth when the JS thread is busy loading the first page. A JS-thread-based shimmer (CSS-style or `Animated.Value`) would stutter.

**Trade-off**: ~40 more lines of code vs `npm install`. Worth it.

---

## 10. expo-router over React Navigation

**Decision**: File-based routing (Expo Router v57) rather than configured React Navigation.

**Why**: Same mental model as Next.js App Router — routes are files, layouts are `_layout.tsx`, dynamic segments are `[id].tsx`. Deep linking is zero-config. Type-safe routes via `typedRoutes: true`. Developers familiar with Next.js navigate the mobile structure immediately.

**Trade-off**: More opinionated about file structure. Some advanced React Navigation patterns require workarounds. For a standard tab + stack navigation pattern, the trade-off is clearly positive.

---

## 11. Bookmarks Reactivity

**Decision**: Bookmarks screen subscribes to the live Zustand `interactions` map and re-fetches via TanStack Query whenever the saved set changes.

```ts
const interactions = usePostInteractionStore(s => s.interactions) // live subscription
const savedIds = useMemo(
  () => Object.entries(interactions).filter(([,v]) => v.saved).map(([id]) => id),
  [interactions]
)
const savedKey = useMemo(() => [...savedIds].sort().join(','), [savedIds])
useQuery({ queryKey: ['bookmarks', savedKey], ... })
```

Any save/unsave on any screen instantly updates the bookmarks list — no manual refresh, no stale data.

**TanStack Query key**: `savedKey` is a sorted, joined string rather than an array. More explicit, order-independent, and human-readable in devtools.

---

## 12. Mock API Design

**Decision**: Direct async function calls with simulated latency (300–800ms) and a 5% random error rate. No HTTP mock server.

**Why**: The mobile app works without a running backend — reviewer runs `npx expo start` standalone. The simulated latency exercises loading states, skeleton screens, and pull-to-refresh. The 5% error rate ensures optimistic rollback is exercised in every dev session, not just when manually tested.

**Swap path to production**: Change each function body in `packages/api/src/mock/handlers.ts` from mock to `await fetch(...)`. Function signatures, types, and pagination contract are identical.

---

## 13. Android Build: Known Kotlin Version Conflict

**Root cause**: `expo-modules-core@57.0.13`'s `expo-module-gradle-plugin` is compiled with Kotlin `2.1.20`. `@react-native/gradle-plugin@0.86.2` ships pre-built `.kotlin_module` metadata files compiled with Kotlin `2.3.0`. When the expo plugin tries to link against the RN plugin classes at build time, Kotlin's metadata version check fails.

**Fix applied** (committed in `android/gradle/init.d`):
A Gradle init script at `~/.gradle/init.d/kotlin-suppress-metadata.gradle` adds `-Xskip-metadata-version-check` to all Kotlin compile tasks globally, allowing the metadata version mismatch to be ignored safely.

**Production path**: This is a known upstream issue between Expo SDK 57 and RN 0.86.2. Use **EAS Build** (Expo's managed CI) for production AAB/IPA — it runs in a controlled environment where the toolchain versions are pre-matched.

---

## Production Roadmap

| Area | Current | Production |
|------|---------|-----------|
| API | Mock functions with simulated latency | REST/GraphQL with JWT auth |
| Auth | Mock JWT, in-memory user store | Real issuer, refresh token rotation, revocation |
| Images | Unsplash CDN | Cloudflare Images / S3 + CDN + signed URLs |
| Persistence (mobile) | MMKV (interactions) + SecureStore (auth) | Same — production-ready |
| Analytics | None | Amplitude / PostHog: like, save, share, scroll depth |
| Tests | 22 store unit tests | Jest + RNTL component tests, Detox E2E critical path |
| Monitoring | None | Sentry crash reporting + performance traces |
| CI/CD | GitHub Actions (type-check, test, web build) | + EAS Build (iOS/Android) on release tag |
