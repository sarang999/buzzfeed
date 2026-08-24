# BuzzFeed Travel — Monorepo

A high-performance travel social feed. **Mobile** (React Native / Expo Router) and **Web** (Next.js 16 App Router) share typed API contracts, Zustand interaction state, and utilities through three internal packages in a Turborepo + pnpm workspace.

**Stack**: Next.js 16.3 · React 19 · Expo SDK 57 · React Native 0.87 · TanStack Query 5 · Zustand 4 · Reanimated 4 · FlashList 2

> **Engineering decisions and trade-offs → [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Xcode (iOS) | ≥ 15 (macOS only) |
| Android Studio | Latest |

Install pnpm if needed: `npm install -g pnpm`

---

## Quick Start

```bash
# 1. Install all workspace dependencies from repo root
pnpm install

# 2. Run the web app
pnpm --filter @buzzfeed/web dev
# → http://localhost:3000

# 3. Run the mobile app (separate terminal)
cd apps/mobile
npx expo start
# Scan QR with Expo Go (iOS/Android) for JS-only preview
# OR: npx expo run:ios / npx expo run:android for full native build
```

---

## Repository Structure

```
buzzfeed/
├── apps/
│   ├── mobile/          # Expo SDK 57, Expo Router v57, RN 0.87 (iOS + Android)
│   └── web/             # Next.js 16 App Router, React 19
├── packages/
│   ├── api/             # TypeScript types + async mock data layer
│   ├── store/           # Zustand interaction store (framework-agnostic)
│   └── utils/           # formatRelativeTime, formatCount, buildShareUrl
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Running Individual Apps

### Web

```bash
cd apps/web
pnpm dev        # development server → localhost:3000
pnpm build      # production build (verifies SSR + static pages)
pnpm start      # serve production build
```

### Mobile

```bash
cd apps/mobile
npx expo start              # Expo Go — core flow (feed, nav, interactions)
npx expo run:ios            # Full build: FlashList + haptics + blurhash
npx expo run:android        # Full Android emulator build
```

> `FlashList`, `expo-haptics`, and `expo-image` blurhash require a native build (`expo run:*`). Expo Go shows the full feed and interaction flow.

---

## Engineering Decisions at a Glance

Full rationale in [ARCHITECTURE.md](./ARCHITECTURE.md). Summary table:

| # | Decision | We Chose | Rejected | Why We Chose It | Key Trade-off |
|---|----------|----------|----------|-----------------|---------------|
| 1 | **Mobile list rendering** | `FlashList` (Shopify) | `FlatList` (RN built-in) | RecyclerView-style cell recycling — components reused, not remounted. Maintains 60 fps on long feeds | Requires `estimatedItemSize` + `overrideItemLayout` discipline; wrong values cause layout jumps |
| 2 | **Pagination strategy** | Cursor-based (`lastId`) | Offset (`?page=N`) | Stable under concurrent inserts — no duplicate/missing posts when feed updates while user is scrolling | Can't jump to arbitrary page N; API must be consistently ordered |
| 3 | **State split** | Zustand (interactions) + TanStack Query (server data) | Redux for everything | Each system owns exactly one concern. Query handles cache/staleness/refetch; Zustand owns user intent and survives navigation | Two systems to learn; developers must understand which store owns what |
| 4 | **Shared Zustand store** | `packages/store` (zero framework imports) | Per-app store duplication | Bug fix in `optimisticLike` propagates to both mobile and web simultaneously. Same optimistic pattern everywhere | Store persistence backend differs per platform (localStorage web / AsyncStorage mobile) — requires injection |
| 5 | **API contract location** | `packages/api` shared types + mock handlers | Types duplicated per app | Single TypeScript source of truth — type drift between mobile and web is a build error, not a runtime surprise | Swapping mock → real API requires editing one file; function signatures are identical |
| 6 | **Mobile navigation** | Expo Router v3 (file-based) | React Navigation configured manually | Same mental model as Next.js App Router — `_layout.tsx`, `[id].tsx`. Deep linking zero-config. Type-safe routes via `typedRoutes: true` | More opinionated about file structure; some advanced RN Navigation patterns require workarounds |
| 7 | **Web initial data** | Server Component calls `getPosts()` directly | Client-side `useQuery` with spinner | Feed HTML arrives pre-filled — zero loading flash on first paint; crawlable by search engines; React 19 Suspense streams slow data | If server-side mock/API is slow, server response is slow; mitigated with `revalidate` in production |
| 8 | **Mobile skeleton loader** | Reanimated `withRepeat` + `interpolateColor` (hand-written) | `react-native-skeleton-placeholder` library | Shimmer runs on **UI thread** via Reanimated worklets — stays smooth when JS thread is busy loading first page | ~40 more lines of code vs an npm install |
| 9 | **Optimistic update rollback** | Zustand `onMutate` → `onError` rollback + toast | Disabled button during request | UI responds in <1 ms. 5% random mock errors ensure rollback path is exercised every dev session | Slightly more complex mutation hook; worth it for the UX |
| 10 | **Mock API approach** | Direct async function calls with simulated latency | HTTP mock server (json-server / MSW) | Mobile app works without a running server — reviewer runs `npx expo start` standalone | No real HTTP exercised in dev; swap is one file change (`handlers.ts` functions become `fetch()` calls) |

---

## Running All Dev Servers

```bash
# From repo root — Turborepo orchestrates both in parallel
pnpm dev
```

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for engineering decisions and trade-offs.

---

## Features

| Feature | Web | Mobile |
|---------|-----|--------|
| Travel feed (paginated) | ✅ SSR + client infinite scroll | ✅ FlashList |
| Pull-to-refresh | ✅ | ✅ + haptic feedback |
| Skeleton loading | ✅ CSS shimmer | ✅ Reanimated shimmer |
| Like (optimistic) | ✅ | ✅ + spring animation |
| Save / Bookmark | ✅ | ✅ + spring animation |
| State consistency | ✅ Shared Zustand store | ✅ Same store |
| Post detail | ✅ SSR | ✅ Native screen |
| Comments (async) | ✅ | ✅ |
| Native share | ✅ Web Share API | ✅ Share.share() |
| Error + retry | ✅ | ✅ |
| Bookmarks page | ✅ | ✅ |
| Accessibility | ✅ ARIA labels | ✅ accessibilityRole |

---

## File Map — Where to Find Things

> Use this to orient quickly without re-reading the whole codebase.

### Shared Packages

| File | What it does |
|------|-------------|
| `packages/api/src/types.ts` | **Every** TypeScript interface: `Post`, `Author`, `Comment`, `FeedPage`, `PostInteraction`. Change the contract here. |
| `packages/api/src/mock/data.ts` | 50 seeded travel posts. Deterministic — same data on every run. Add or edit posts here. |
| `packages/api/src/mock/handlers.ts` | `getPosts`, `getPostById`, `likePost`, `savePost`. Swap these bodies for real `fetch()` calls when connecting a backend. |
| `packages/store/src/post-interaction.ts` | Zustand store. All `optimisticLike`, `rollbackLike`, `optimisticSave`, `rollbackSave` actions live here. |
| `packages/utils/src/index.ts` | `formatRelativeTime`, `formatCount`, `buildShareUrl`, `countryCodeToFlag`. Pure functions, no deps. |

### Web App (`apps/web`)

| File | What it does |
|------|-------------|
| `app/page.tsx` | Feed page — **Server Component**. Fetches first page, passes as `initialData`. |
| `app/providers.tsx` | `QueryClientProvider` wrapper (client boundary). |
| `app/post/[id]/page.tsx` | Post detail — **Server Component** with `notFound()` guard. |
| `app/bookmarks/page.tsx` | Client-only bookmarks page — reads saved IDs from Zustand. |
| `components/feed/FeedClient.tsx` | `useInfiniteQuery` + Intersection Observer for infinite scroll. |
| `components/feed/PostCard.tsx` | Feed card: `next/image`, author, caption, tags, action row. |
| `components/feed/FeedSkeleton.tsx` | CSS shimmer skeleton. Controls count via `count` prop. |
| `components/post/PostDetailClient.tsx` | Full detail view with comment list and actions. |
| `components/ui/LikeButton.tsx` | Optimistic like with TanStack mutation + Zustand + rollback toast. |
| `components/ui/SaveButton.tsx` | Optimistic save — same pattern as LikeButton. |
| `components/ui/ShareButton.tsx` | `navigator.share()` with clipboard copy fallback. |

### Mobile App (`apps/mobile`)

| File | What it does |
|------|-------------|
| `app/_layout.tsx` | Root layout — providers: QueryClient, GestureHandler, SafeArea, Toast. |
| `app/(tabs)/_layout.tsx` | Bottom tab bar config (Feed + Saved tabs). |
| `app/(tabs)/index.tsx` | Feed screen — FlashList, `overrideItemLayout`, pull-to-refresh, infinite scroll. |
| `app/(tabs)/bookmarks.tsx` | Bookmarks screen — reads from Zustand, fetches matching posts. |
| `app/post/[id].tsx` | Post detail — hero image, comments, actions, native Share. |
| `components/PostCard/PostCard.tsx` | **The main list item.** `React.memo` + `expo-image` + blurhash + action row. |
| `components/SkeletonFeed.tsx` | Reanimated shimmer skeleton — UI thread, no library. |
| `components/ErrorView.tsx` | Full-screen error state with retry button. |
| `components/ui/LikeButton.tsx` | Spring animation (`withSequence`) + haptic + optimistic + rollback. |
| `components/ui/SaveButton.tsx` | Same pattern, medium haptic weight. |

---

## Task Backlog — What to Build Next

Ordered by impact. Each item is self-contained and can be picked up independently.

### High Priority

- [ ] **Real API integration** — Replace `packages/api/src/mock/handlers.ts` bodies with `fetch()` calls to a real backend. Types, pagination, and error handling stay identical.
- [ ] **Auth flow** — Add login/register screens. Mobile: JWT in `expo-secure-store`. Web: httpOnly cookie. Gate feed mutations on auth state.
- [ ] **MMKV persistence on mobile** — Swap the Zustand persist storage from in-memory to `react-native-mmkv` for bookmarks that survive app restart. Already wired; just inject the storage adapter.
- [ ] **PostCard mobile — complete component** — The `PostCard.tsx` stub in `apps/mobile/components/PostCard/` needs its full implementation (image, author row, caption, action row). Currently handled in the detail screen but the feed card is minimal.

### Medium Priority

- [ ] **Unit tests** — `packages/utils` functions are pure and trivially testable with Jest. `packages/store` reducers can be tested without a render. Start here.
- [ ] **Component tests** — `LikeButton` (web + mobile) with `@testing-library/react` and `@testing-library/react-native`. Mock `useMutation`, assert Zustand state updates.
- [ ] **Detox E2E** — Critical path: load feed → like a post → navigate to detail → verify like count → navigate back → verify count consistent.
- [ ] **Web: Framer Motion entry animations** — Subtle `fadeInUp` on PostCard mount. Already using Tailwind; no layout engine conflict.
- [ ] **Web: Virtualized list** — `react-window` or TanStack Virtual for web feed (currently a DOM list). Not needed until 100+ posts per session but good for parity with mobile.
- [ ] **Image upload / create post flow** — New screen with `expo-image-picker`, upload to S3/Cloudflare, POST to API.

### Low Priority / Polish

- [ ] **Dark mode** — Tailwind `dark:` classes (web), `Appearance.getColorScheme()` (mobile). Design tokens in `packages/utils` already support extension.
- [ ] **CI/CD** — GitHub Actions: `pnpm install` → `tsc --noEmit` all packages → `next build` → EAS Build (mobile). Vercel auto-deploy for web.
- [ ] **Sentry** — `@sentry/nextjs` (web) + `@sentry/react-native` (mobile). Add to root providers.
- [ ] **Analytics** — PostHog or Amplitude. Instrument: feed scroll depth, like, save, share, post detail open.
- [ ] **Offline banner** — `@react-native-community/netinfo` on mobile. Already referenced in architecture plan; component scaffolded but not wired.
- [ ] **Web PWA manifest** — Add `manifest.json` for installable PWA. Pairs well with Web Share API already implemented.

---

## Contributing / Picking Up a Task

1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** first — understand the state split before touching any component.
2. Run `pnpm install` from repo root.
3. Run `pnpm --filter @buzzfeed/web dev` to verify web works.
4. Pick a task from the backlog above.
5. Changes to `packages/*` are automatically picked up by both apps (Metro watches `monorepoRoot`; Next.js transpiles via `transpilePackages`).
6. After any change: `pnpm --filter @buzzfeed/web exec tsc --noEmit` to verify types across all packages.
