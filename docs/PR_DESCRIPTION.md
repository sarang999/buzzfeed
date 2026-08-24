## Overview

High-performance travel social feed built as a Turborepo + pnpm monorepo. **Mobile** (React Native / Expo Router) and **Web** (Next.js 16 App Router) share typed API contracts, Zustand interaction state, and utilities through three internal packages.

**Stack**: Next.js 16.3 · React 19 · Expo SDK 57 · React Native 0.87 · TanStack Query 5 · Zustand 4 · Reanimated 4 · FlashList 2

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for full engineering decision rationale.

---

## What's in this PR

### Shared Packages

| Package | What it does |
|---------|-------------|
| `@buzzfeed/api` | TypeScript interfaces (`Post`, `Author`, `FeedPage`…) + mock handlers with 300–800ms latency and 5% random errors |
| `@buzzfeed/store` | Framework-agnostic Zustand store for optimistic interaction state — zero RN/Next.js imports |
| `@buzzfeed/utils` | `formatRelativeTime`, `formatCount`, `buildShareUrl`, `countryCodeToFlag` |

### Web App (Next.js 14 App Router)

- `/` — Feed as **Server Component**: first page SSR'd, zero loading flash, crawlable
- `/post/[id]` — Post detail, SSR with React 18 Suspense streaming for comments
- `/bookmarks` — Client-side saved posts via Zustand
- Infinite scroll via **native IntersectionObserver** (no library)
- Framer Motion staggered entrance on PostCard
- Dark mode (`darkMode: 'class'`), PWA manifest

### Mobile App (Expo Router + React Native)

- **FlashList** — RecyclerView-style recycling, 10× better perf than FlatList; `overrideItemLayout`: image posts = 380dp, text-only = 200dp
- Reanimated 3 spring bounce on like/save (UI thread — smooth even when JS is busy)
- Hand-written Reanimated shimmer skeleton (UI thread, no library)
- **MMKV** injected into Zustand persist — bookmarks survive app restart
- Offline banner via NetInfo + Reanimated slide-in
- Haptics: Light on like, Medium on save

### Tests & CI

- **24 unit tests**: 15 for `@buzzfeed/utils`, 9 for `@buzzfeed/store`
- GitHub Actions: type-check → unit tests → `next build` on every PR

---

## Key Engineering Decisions

| Decision | We Chose | Why | Trade-off |
|----------|----------|-----|-----------|
| Mobile list | FlashList | Cell recycling, 60fps on long feeds | Requires `estimatedItemSize` discipline |
| Pagination | Cursor-based | Stable under concurrent inserts | No jump-to-page-N |
| State | Zustand (interaction) + TanStack Query (server) | Each owns exactly one concern | Two systems to learn |
| Shared store | `packages/store` (zero framework deps) | Bug fix applies to both platforms simultaneously | Storage injection needed per platform |
| Mobile nav | Expo Router v3 | Same file-based mental model as Next.js App Router | Opinionated file structure |
| Web initial data | Server Component | Zero loading flash, crawlable HTML | Slow API = slow server response |
| Skeleton | Reanimated `withRepeat` hand-written | UI-thread shimmer, no bundle cost | ~40 lines vs npm install |
| Mock API | Direct async functions | Reviewer runs mobile without starting a server | No real HTTP exercised in dev |

---

## How to Run

```bash
pnpm install

# Web → localhost:3000
pnpm --filter @buzzfeed/web dev

# Mobile
cd apps/mobile && npx expo start        # Expo Go (core flow)
cd apps/mobile && npx expo run:ios      # Full native (FlashList + haptics)
```

---

## Test Results

```
@buzzfeed/utils  15 passed  (formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag)
@buzzfeed/store   9 passed  (hydrate, optimisticLike/rollback, optimisticSave/rollback, getSavedIds, confirmLike)
next build        ✓ 4 routes compiled, zero errors
tsc --noEmit      ✓ all 4 packages clean
```
