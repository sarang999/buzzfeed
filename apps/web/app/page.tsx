import { Suspense } from 'react';
import { getPosts } from '@buzzfeed/api';
import { FeedClient } from '@/components/feed/FeedClient';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';

// Server Component: fetch first page at render time → zero loading flash on initial paint
export default async function FeedPage() {
  const initialData = await getPosts(null);

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedClient initialData={initialData} />
    </Suspense>
  );
}
