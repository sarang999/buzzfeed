'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Post } from '@buzzfeed/api';
import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '@buzzfeed/utils';
import { LikeButton } from '@/components/ui/LikeButton';
import { SaveButton } from '@/components/ui/SaveButton';
import { ShareButton } from '@/components/ui/ShareButton';

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const flag = countryCodeToFlag(post.location.countryCode);

  return (
    <motion.article
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Image
          src={post.author.avatarUrl}
          alt={post.author.name}
          width={40}
          height={40}
          className="rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-gray-900 truncate">{post.author.name}</span>
            {post.author.isVerified && (
              <span className="text-blue-500 text-xs flex-shrink-0" aria-label="Verified">✓</span>
            )}
          </div>
          <p className="text-xs text-gray-400">@{post.author.username}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {flag} {post.location.city}
          </p>
        </div>
      </div>

      {/* Post image */}
      {post.imageUrl && (
        <Link href={`/post/${post.id}`} className="block">
          <div className="relative w-full aspect-[4/3] bg-gray-100">
            <Image
              src={post.imageUrl}
              alt={`Photo from ${post.location.city}`}
              fill
              className="object-cover"
              placeholder={post.blurhash ? 'blur' : 'empty'}
              blurDataURL={
                post.blurhash
                  ? `data:image/svg+xml;base64,${Buffer.from(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><filter id="b"><feGaussianBlur stdDeviation="20"/></filter><image width="100%" height="100%" style="filter:url(#b)"/></svg>`,
                    ).toString('base64')}`
                  : undefined
              }
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        </Link>
      )}

      {/* Caption */}
      <div className="px-4 py-3">
        <Link href={`/post/${post.id}`} className="block">
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{post.caption}</p>
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-orange-500 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <LikeButton postId={post.id} />
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={`${post.commentCount} comments`}
          >
            <span className="text-base">💬</span>
            <span className="text-xs font-medium">{formatCount(post.commentCount)}</span>
          </Link>
          <ShareButton url={buildShareUrl(post.id)} title={post.caption} />
        </div>
        <SaveButton postId={post.id} />
      </div>
    </motion.article>
  );
}
