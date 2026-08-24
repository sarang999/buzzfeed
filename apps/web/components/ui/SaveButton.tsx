'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { savePost } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';

interface SaveButtonProps {
  postId: string;
}

export function SaveButton({ postId }: SaveButtonProps) {
  const [toast, setToast] = useState(false);

  const interaction = usePostInteractionStore((s) => s.interactions[postId]);
  const optimisticSave = usePostInteractionStore((s) => s.optimisticSave);
  const rollbackSave = usePostInteractionStore((s) => s.rollbackSave);

  const saved = interaction?.saved ?? false;

  const { mutate } = useMutation({
    mutationFn: () => savePost(postId, !saved),
    onMutate: () => {
      optimisticSave(postId);
    },
    onError: () => {
      rollbackSave(postId);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => mutate()}
        className={`flex items-center gap-1 transition-all active:scale-90 ${
          saved ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'
        }`}
        aria-label={saved ? 'Remove bookmark' : 'Save post'}
        aria-pressed={saved}
      >
        <span className="text-base">{saved ? '🔖' : '📌'}</span>
      </button>
      {toast && (
        <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          Failed to save
        </div>
      )}
    </div>
  );
}
