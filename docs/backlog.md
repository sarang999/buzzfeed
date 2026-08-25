# BuzzFeed Travel — Backlog & Status

## Done ✅
- Turborepo + pnpm monorepo scaffolding
- `packages/api`: types, 50 seeded mock posts, async handlers (latency + 5% error)
- `packages/store`: Zustand interaction store, optimistic like/save + rollback
- `packages/utils`: formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag
- Web: feed page (SSR), post detail (SSR), bookmarks (client), infinite scroll (IntersectionObserver)
- Web: LikeButton, SaveButton, ShareButton — all optimistic with rollback toast
- Web: CSS shimmer skeleton
- Web: Framer Motion entrance animations on PostCard (staggered, 50ms delay per card)
- Web: Dark mode (Tailwind `darkMode: 'class'`, header + cards)
- Web: PWA manifest (`/public/manifest.json`, `themeColor`, manifest metadata)
- Mobile: Expo Router tabs (Feed + Saved), post detail screen
- Mobile: FlashList feed with overrideItemLayout, pull-to-refresh + haptics
- Mobile: Reanimated shimmer skeleton (UI thread)
- Mobile: PostCard — full implementation (image, author, caption, tags, actions, Reanimated)
- Mobile: LikeButton (spring + haptic) + SaveButton — wired in PostCard and standalone
- Mobile: Toast on optimistic error
- Mobile: MMKV persistence (`apps/mobile/utils/storage.ts`) — bookmarks survive app restart
- Mobile: Offline banner (`OfflineBanner.tsx`) — Reanimated slide-in, NetInfo driven
- Unit tests: 15 tests for `packages/utils` (all passing)
- Unit tests: 9 tests for `packages/store` (all passing)
- Next.js production build: 4 routes passing, zero build errors
- All packages TypeScript clean (`tsc --noEmit` passes)
- CI/CD: `.github/workflows/ci.yml` — type-check → test → web build on every PR
- README, ARCHITECTURE.md, `.github/copilot-instructions.md`, `docs/`

## High Priority — Next Up
- [x] **Auth flow** — login/register screens; mobile JWT in `expo-secure-store`; web localStorage (dev) / httpOnly cookie (prod); session persisted across restarts; auth guard in root layout; feed mutations gated behind auth
- [ ] **Real API swap** — replace bodies in `packages/api/src/mock/handlers.ts` with `fetch()` calls; all types + signatures stay identical
- [ ] **Image upload + create post** — expo-image-picker → S3 → POST to API

## Medium Priority
- [ ] Component tests: LikeButton with @testing-library, mock useMutation
- [ ] Detox E2E: like post → detail → verify count → back → verify consistent
- [ ] Web virtualized list (TanStack Virtual) for very large sessions

## Low Priority / Polish
- [ ] Full dark mode pass — PostCard text, comment bubbles, detail screen, bookmarks page
- [ ] Sentry: `@sentry/nextjs` + `@sentry/react-native`
- [ ] Analytics: PostHog — instrument like, save, share, scroll depth
- [ ] PWA icons — replace placeholder 1×1 PNGs with real 192/512 icons
