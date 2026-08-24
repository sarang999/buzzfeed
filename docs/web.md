# BuzzFeed Travel — Web Patterns

## Server vs Client Component Rules
- `app/page.tsx` — Server Component. Calls getPosts() directly. Passes `initialData` to FeedClient.
- `app/post/[id]/page.tsx` — Server Component. Uses `notFound()` from `next/navigation`.
- `app/bookmarks/page.tsx` — Client Component (reads Zustand; must be `'use client'`).
- `components/feed/FeedClient.tsx` — `'use client'` (useInfiniteQuery, IntersectionObserver).
- `components/ui/LikeButton.tsx`, `SaveButton.tsx`, `ShareButton.tsx` — `'use client'` (mutations).
- Never push `'use client'` up to layout or page files.

## Infinite Scroll (no library — native IntersectionObserver)
```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    { threshold: 0.1, rootMargin: '200px' },
  );
  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```
Sentinel `<div ref={sentinelRef} />` sits below the last post card.

## TanStack Query v5 Infinite Query
```tsx
useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => getPosts(pageParam as string | null),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  initialData: { pages: [initialData], pageParams: [null] },
})
```

## Skeleton Loading
- Class `shimmer` defined in `app/globals.css` — `@keyframes shimmer` gradient animation.
- Component in `components/feed/FeedSkeleton.tsx`, accepts `count` prop.
- Do NOT install a skeleton library.

## next/image
- Domains allowed in `next.config.js`: `images.unsplash.com`, `i.pravatar.cc`
- Use `fill` + `sizes` for responsive images inside a relative container.

## Known tsconfig Requirement
`apps/web/tsconfig.json` must have `"declaration": false` — pnpm hoisted @types/react path causes TS2742 otherwise.
