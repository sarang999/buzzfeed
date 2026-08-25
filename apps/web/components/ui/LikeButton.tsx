'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { likePost } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';
import { useAuth } from '@/app/auth-context';
import { formatCount } from '@buzzfeed/utils';

interface LikeButtonProps {
  postId: string;
}

export function LikeButton({ postId }: LikeButtonProps) {
  const [toast, setToast] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const interaction = usePostInteractionStore((s) => s.interactions[postId]);
  const optimisticLike = usePostInteractionStore((s) => s.optimisticLike);
  const rollbackLike = usePostInteractionStore((s) => s.rollbackLike);
  const confirmLike = usePostInteractionStore((s) => s.confirmLike);

  const liked = interaction?.liked ?? false;
  const likeCount = interaction?.likeCount ?? 0;

  const { mutate } = useMutation({
    mutationFn: () => likePost(postId, !liked),
    onMutate: () => optimisticLike(postId),
    onSuccess: (data) => confirmLike(postId, data.likeCount),
    onError: () => {
      rollbackLike(postId);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    mutate();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 transition-all active:scale-90 ${
          liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
        }`}
        aria-label={liked ? 'Unlike post' : 'Like post'}
        aria-pressed={liked}
      >
        <span className={`text-base transition-transform ${liked ? 'scale-110' : ''}`}>
          {liked ? '❤️' : '🤍'}
        </span>
        <span className="text-xs font-medium">{formatCount(likeCount)}</span>
      </button>
      {toast && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          Failed to update
        </div>
      )}
    </div>
  );
}
