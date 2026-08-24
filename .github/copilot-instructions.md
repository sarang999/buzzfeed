# Copilot Instructions — BuzzFeed Travel Monorepo

## Project Overview
Turborepo + pnpm monorepo. Expo Router mobile (iOS/Android) + Next.js 14 web app sharing three internal packages.

## Architecture Rules (enforce in code review)

### State Management
- **TanStack Query** owns server state (post content, comments). Never put fetched data in Zustand.
- **Zustand (`packages/store`)** owns interaction state only (liked, saved, counts). Must stay framework-agnostic — zero React Native or Next.js imports.
- Optimistic update pattern: `onMutate` → Zustand optimistic action → network → `onSuccess` confirm → `onError` rollback + toast. Deviating from this breaks state consistency across screens.

### Shared Packages
- All TypeScript interfaces live in `packages/api/src/types.ts`. Never define `Post`, `Author`, or `FeedPage` inline in an app.
- Import paths inside packages must NOT use `.js` extensions. Next.js webpack cannot resolve `.ts → .js`. Use bare extensionless imports.
- `packages/utils` exports must be pure functions with no dependencies.

### Mobile
- Use `FlashList` (not `FlatList`) for all feed-style lists. Always set `estimatedItemSize` and `overrideItemLayout` for variable-height content.
- Animations that must stay smooth during data loading must use Reanimated worklets (runs on UI thread). Do NOT use the `Animated` API for list-related animations.
- `reanimated/plugin` must remain the **last** entry in `babel.config.js` plugins array.
- Haptics: light impact for like, medium for save. Always wrap in `expo-haptics`.

### Web
- `app/page.tsx` is a Server Component. Do not add `'use client'` to it.
- Push `'use client'` to leaf components (LikeButton, SaveButton, ShareButton) — not to page or layout files.
- Skeleton loading uses CSS `shimmer` animation class defined in `globals.css`. Do not install a skeleton library.

### Pagination
- Always cursor-based. `nextCursor` = last item ID, `null` = end of feed.
- TanStack Query v5: `initialPageParam: null`, `getNextPageParam: (page) => page.nextCursor ?? undefined`.
- Never use offset (`?page=N`) pagination on feeds.

## Code Review Checklist
When reviewing a PR, check:
- [ ] No new `Post`/`Author`/`FeedPage` type definitions outside `packages/api/src/types.ts`
- [ ] FlatList not used in feed screens (must be FlashList)
- [ ] New mutations follow onMutate → onError rollback pattern
- [ ] `'use client'` not added to Server Component files (`app/page.tsx`, `app/post/[id]/page.tsx`)
- [ ] No `.js` extension in intra-package imports
- [ ] `tsc --noEmit` passes for all changed packages

## File Locations Quick Reference
| Concern | File |
|---------|------|
| All types | `packages/api/src/types.ts` |
| Mock data (50 posts) | `packages/api/src/mock/data.ts` |
| API functions (swap for real backend here) | `packages/api/src/mock/handlers.ts` |
| Optimistic state + rollback | `packages/store/src/post-interaction.ts` |
| Web feed (SSR) | `apps/web/app/page.tsx` |
| Web infinite scroll | `apps/web/components/feed/FeedClient.tsx` |
| Mobile feed (FlashList) | `apps/mobile/app/(tabs)/index.tsx` |
| Mobile skeleton (Reanimated) | `apps/mobile/components/SkeletonFeed.tsx` |

## Commands
```bash
pnpm install                                        # root
pnpm --filter @buzzfeed/web dev                     # web dev server
pnpm --filter @buzzfeed/web exec next build         # web prod build
pnpm --filter @buzzfeed/api exec tsc --noEmit       # check api types
pnpm --filter @buzzfeed/store exec tsc --noEmit     # check store types
pnpm --filter @buzzfeed/web exec tsc --noEmit       # check web types
cd apps/mobile && npx expo start                    # mobile (Expo Go)
cd apps/mobile && npx expo run:ios                  # mobile (full native)
```
