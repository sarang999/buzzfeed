'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getPosts } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';
import type { FeedPage } from '@buzzfeed/api';
import { PostCard } from './PostCard';
import { FeedSkeleton } from './FeedSkeleton';

interface FeedClientProps {
  initialData: FeedPage;
}

export function FeedClient({ initialData }: FeedClientProps) {
  const hydrate = usePostInteractionStore((s) => s.hydrate);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => getPosts(pageParam as string | null),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [initialData],
        pageParams: [null],
      },
    });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Seed Zustand interaction store with server data on every page load
  useEffect(() => {
    hydrate(posts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages.length]);

  // Intersection Observer drives infinite scroll — no library needed
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'error') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Failed to load feed</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {/* Invisible sentinel — Intersection Observer triggers next page load */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && <FeedSkeleton count={2} />}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-8">You've reached the end ✈</p>
      )}
    </div>
  );
}
