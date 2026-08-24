# BuzzFeed Travel — Architecture & Critical Patterns

## State Split (never violate this)
- **TanStack Query** → server data (post content, comments). Never in Zustand.
- **Zustand (`packages/store`)** → interaction state only (liked, saved, counts). Zero RN/Next.js imports.

## Optimistic Update Shape (both platforms, same pattern)
```
onMutate  → Zustand optimisticLike(postId)    [UI updates <1ms]
network   → likePost(postId, newState)
onSuccess → Zustand confirmLike(postId, count) [reconcile with server]
onError   → Zustand rollbackLike(postId) + Toast.show()
```
See: `apps/web/components/ui/LikeButton.tsx`, `apps/mobile/components/ui/LikeButton.tsx`

## Cursor Pagination (never use offset)
- `nextCursor` = last post ID; `null` = end of feed
- TanStack Query v5: `initialPageParam: null`, `getNextPageParam: (page) => page.nextCursor ?? undefined`

## Package Import Rules
- No `.js` extensions in intra-package imports — Next.js webpack can't resolve `.ts → .js`
- All shared types from `packages/api/src/types.ts` — never define Post/Author/FeedPage inline in an app

## Zustand Store Keys
- `interactions: Record<postId, { liked, saved, likeCount, saveCount }>` — O(1) lookup
- `hydrate(posts[])` — called after each TanStack Query page load to seed new post IDs
- `getSavedIds()` — returns string[] for bookmarks screen

## Mock API Contract
- 300–800ms simulated latency + 5% random error rate in `packages/api/src/mock/handlers.ts`
- Swap each function body for a real `fetch()` call when connecting backend — signatures unchanged

## SSR Rule (web)
- `app/page.tsx` is a Server Component — calls `getPosts(null)` directly, passes result as `initialData`
- Never add `'use client'` to page or layout files — push it down to leaf components only
