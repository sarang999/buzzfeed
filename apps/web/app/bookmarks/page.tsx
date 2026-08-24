'use client';

import { usePostInteractionStore } from '@buzzfeed/store';
import { getPostsByIds } from '@buzzfeed/api';
import { useEffect, useState } from 'react';
import type { Post } from '@buzzfeed/api';
import { PostCard } from '@/components/feed/PostCard';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';

export default function BookmarksPage() {
  const getSavedIds = usePostInteractionStore((s) => s.getSavedIds);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    getPostsByIds(ids)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [getSavedIds]);

  if (loading) return <FeedSkeleton />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Posts</h1>
      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔖</p>
          <p className="text-lg font-medium">No bookmarks yet</p>
          <p className="text-sm mt-1">Save posts from your feed to see them here.</p>
          <a href="/" className="mt-4 inline-block text-orange-500 hover:underline text-sm font-medium">
            Explore feed →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
