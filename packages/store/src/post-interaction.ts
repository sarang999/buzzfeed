import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Post, PostInteraction } from '@buzzfeed/api';

/**
 * Holds user interaction state (like, save) separately from server state.
 * Server state (post content) lives in TanStack Query — this store owns intent.
 * Keyed by post ID for O(1) lookup across feed + detail + bookmarks.
 */
interface PostInteractionState {
  interactions: Record<string, PostInteraction>;

  /** Seed from initial feed load — avoids stale interaction state */
  hydrate: (posts: Post[]) => void;

  optimisticLike: (postId: string) => void;
  rollbackLike: (postId: string) => void;
  confirmLike: (postId: string, likeCount: number) => void;

  optimisticSave: (postId: string) => void;
  rollbackSave: (postId: string) => void;

  getSavedIds: () => string[];
}

export const usePostInteractionStore = create<PostInteractionState>()(
  persist(
    (set, get) => ({
      interactions: {},

      hydrate: (posts) => {
        set((state) => {
          const next = { ...state.interactions };
          for (const post of posts) {
            // Only seed if we have no local record (preserve optimistic state)
            if (!next[post.id]) {
              next[post.id] = {
                liked: false,
                saved: false,
                likeCount: post.likeCount,
                saveCount: post.saveCount,
              };
            }
          }
          return { interactions: next };
        });
      },

      optimisticLike: (postId) => {
        set((state) => {
          const current = state.interactions[postId];
          if (!current) return state;
          return {
            interactions: {
              ...state.interactions,
              [postId]: {
                ...current,
                liked: !current.liked,
                likeCount: current.liked ? current.likeCount - 1 : current.likeCount + 1,
              },
            },
          };
        });
      },

      rollbackLike: (postId) => {
        // Mirror of optimisticLike — called on network failure
        set((state) => {
          const current = state.interactions[postId];
          if (!current) return state;
          return {
            interactions: {
              ...state.interactions,
              [postId]: {
                ...current,
                liked: !current.liked,
                likeCount: current.liked ? current.likeCount - 1 : current.likeCount + 1,
              },
            },
          };
        });
      },

      confirmLike: (postId, likeCount) => {
        set((state) => {
          const current = state.interactions[postId];
          if (!current) return state;
          return {
            interactions: {
              ...state.interactions,
              [postId]: { ...current, likeCount },
            },
          };
        });
      },

      optimisticSave: (postId) => {
        set((state) => {
          const current = state.interactions[postId];
          if (!current) return state;
          return {
            interactions: {
              ...state.interactions,
              [postId]: {
                ...current,
                saved: !current.saved,
                saveCount: current.saved ? current.saveCount - 1 : current.saveCount + 1,
              },
            },
          };
        });
      },

      rollbackSave: (postId) => {
        set((state) => {
          const current = state.interactions[postId];
          if (!current) return state;
          return {
            interactions: {
              ...state.interactions,
              [postId]: {
                ...current,
                saved: !current.saved,
                saveCount: current.saved ? current.saveCount - 1 : current.saveCount + 1,
              },
            },
          };
        });
      },

      getSavedIds: () => {
        const { interactions } = get();
        return Object.entries(interactions)
          .filter(([, v]) => v.saved)
          .map(([k]) => k);
      },
    }),
    {
      name: 'post-interactions',
      // Storage is injected by each app — SSR-safe noop fallback for Next.js
      storage: createJSONStorage(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          return typeof window !== 'undefined' && window.localStorage ? localStorage : noopStorage;
        } catch {
          return noopStorage;
        }
      }),
      // Only persist saved bookmarks — likes are ephemeral per session
      partialize: (state) => ({
        interactions: Object.fromEntries(
          Object.entries(state.interactions).filter(([, v]) => v.saved),
        ),
      }),
    },
  ),
);

// Fallback no-op storage for environments without localStorage (SSR)
const noopStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => undefined,
  removeItem: (_key: string): void => undefined,
};
