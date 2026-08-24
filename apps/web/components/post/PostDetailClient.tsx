'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { PostDetail } from '@buzzfeed/api';
import { getComments } from '@buzzfeed/api';
import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '@buzzfeed/utils';
import { LikeButton } from '@/components/ui/LikeButton';
import { SaveButton } from '@/components/ui/SaveButton';
import { ShareButton } from '@/components/ui/ShareButton';

interface PostDetailClientProps {
  initialPost: PostDetail;
}

export function PostDetailClient({ initialPost }: PostDetailClientProps) {
  const flag = countryCodeToFlag(initialPost.location.countryCode);

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', initialPost.id],
    queryFn: () => getComments(initialPost.id),
    initialData: initialPost.comments,
  });

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors">
        ← Back to feed
      </Link>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Author */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <Image
            src={initialPost.author.avatarUrl}
            alt={initialPost.author.name}
            width={44}
            height={44}
            className="rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{initialPost.author.name}</span>
              {initialPost.author.isVerified && (
                <span className="text-blue-500 text-xs" aria-label="Verified">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-400">@{initialPost.author.username}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{formatRelativeTime(initialPost.createdAt)}</p>
            <p className="text-sm mt-0.5">{flag} {initialPost.location.city}, {initialPost.location.country}</p>
          </div>
        </div>

        {/* Full-size image */}
        {initialPost.imageUrl && (
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={initialPost.imageUrl}
              alt={`Photo from ${initialPost.location.city}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        )}

        {/* Caption + tags */}
        <div className="px-4 py-4">
          <p className="text-gray-800 leading-relaxed">{initialPost.caption}</p>
          {initialPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {initialPost.tags.map((tag) => (
                <span key={tag} className="text-sm text-orange-500 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <LikeButton postId={initialPost.id} />
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="text-base">💬</span>
              <span className="text-xs font-medium">{formatCount(initialPost.commentCount)}</span>
            </span>
            <ShareButton url={buildShareUrl(initialPost.id)} title={initialPost.caption} />
          </div>
          <SaveButton postId={initialPost.id} />
        </div>
      </article>

      {/* Comments */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comments ({formatCount(initialPost.commentCount)})
        </h2>

        {commentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded shimmer" />
                  <div className="h-3 w-full rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Image
                  src={comment.author.avatarUrl}
                  alt={comment.author.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover flex-shrink-0"
                />
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-900">{comment.author.name}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
