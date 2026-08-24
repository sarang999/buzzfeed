import { Suspense } from 'react';
import { getPostById } from '@buzzfeed/api';
import { PostDetailClient } from '@/components/post/PostDetailClient';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function PostDetailPage({ params }: PageProps) {
  let post;
  try {
    post = await getPostById(params.id);
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={<FeedSkeleton count={1} />}>
      <PostDetailClient initialPost={post} />
    </Suspense>
  );
}
