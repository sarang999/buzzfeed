import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Share } from 'react-native';
import { likePost, savePost } from '@buzzfeed/api';
import { usePostInteractionStore, useAuthStore } from '@buzzfeed/store';
import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '@buzzfeed/utils';
import type { Post } from '@buzzfeed/api';

interface PostCardProps {
  post: Post;
}

function PostCardComponent({ post }: PostCardProps) {
  /**
   * Single atomic selector — one Zustand subscription, one re-render.
   *
   * Trade-off vs 6 individual selectors:
   *   - Pro: O(1) subscription overhead regardless of how many fields we read.
   *   - Pro: All interaction fields update atomically — no intermediate renders
   *     where `liked` is true but `likeCount` is still the old value.
   *   - Con: The object reference changes on every store update (even unrelated
   *     posts). We guard against this with the stable memo comparator below —
   *     the component only re-renders when `post.id` changes, while the Zustand
   *     subscription handles all interaction-driven re-renders.
   *
   * The selector falls back to the server-side counts from the post prop so
   * cards render correctly before the interaction store has been hydrated.
   */
  const { liked, saved, likeCount, saveCount, optimisticLike, rollbackLike, confirmLike, optimisticSave, rollbackSave } =
    usePostInteractionStore((s) => {
      const ix = s.interactions[post.id];
      return {
        liked: ix?.liked ?? false,
        saved: ix?.saved ?? false,
        likeCount: ix?.likeCount ?? post.likeCount,
        saveCount: ix?.saveCount ?? post.saveCount,
        optimisticLike: s.optimisticLike,
        rollbackLike: s.rollbackLike,
        confirmLike: s.confirmLike,
        optimisticSave: s.optimisticSave,
        rollbackSave: s.rollbackSave,
      };
    });

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  /**
   * mutationFn reads current liked state at call-time via the store getter,
   * not from the closure. This prevents the stale-closure bug where deps
   * `[liked]` would cause the mutation instance to be recreated on every
   * optimistic toggle, briefly making the button non-interactive.
   */
  const { mutate: mutateLike } = useMutation({
    mutationFn: () => {
      const currentLiked = usePostInteractionStore.getState().interactions[post.id]?.liked ?? false;
      return likePost(post.id, !currentLiked);
    },
    onMutate: () => optimisticLike(post.id),
    onSuccess: (data) => confirmLike(post.id, data.likeCount),
    onError: () => {
      rollbackLike(post.id);
      Toast.show({ type: 'error', text1: 'Failed to update like', visibilityTime: 2000 });
    },
  });

  const { mutate: mutateSave } = useMutation({
    mutationFn: () => {
      const currentSaved = usePostInteractionStore.getState().interactions[post.id]?.saved ?? false;
      return savePost(post.id, !currentSaved);
    },
    onMutate: () => optimisticSave(post.id),
    onError: () => {
      rollbackSave(post.id);
      Toast.show({ type: 'error', text1: 'Failed to save post', visibilityTime: 2000 });
    },
  });

  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      Toast.show({
        type: 'info',
        text1: 'Sign in to like posts',
        text2: 'Tap to sign in',
        onPress: () => router.push('/(auth)/login'),
        visibilityTime: 3000,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutateLike();
    // No `liked` in deps — mutation reads state at call-time via store.getState()
  }, [isAuthenticated, likeScale, mutateLike]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      Toast.show({
        type: 'info',
        text1: 'Sign in to save posts',
        text2: 'Tap to sign in',
        onPress: () => router.push('/(auth)/login'),
        visibilityTime: 3000,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutateSave();
  }, [isAuthenticated, saveScale, mutateSave]);

  const handleShare = useCallback(() => {
    Share.share({ message: post.caption, url: buildShareUrl(post.id) });
  }, [post.caption, post.id]);

  const handlePress = useCallback(() => {
    router.push(`/post/${post.id}`);
  }, [post.id]);

  const flag = countryCodeToFlag(post.location.countryCode);

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Post by ${post.author.name} from ${post.location.city}`}
    >
      {/* Author row */}
      <View style={styles.authorRow}>
        <Image
          source={{ uri: post.author.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName} numberOfLines={1}>{post.author.name}</Text>
            {post.author.isVerified && (
              <Text style={styles.verified} accessibilityLabel="Verified">✓</Text>
            )}
          </View>
          <Text style={styles.username}>@{post.author.username}</Text>
        </View>
        <View style={styles.metaRight}>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
          <Text style={styles.location}>{flag} {post.location.city}</Text>
        </View>
      </View>

      {/* Post image — recyclingKey lets expo-image reuse the native layer */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
          {...(post.blurhash ? { placeholder: post.blurhash } : {})}
          transition={400}
          recyclingKey={post.id}
        />
      )}

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption} numberOfLines={3}>{post.caption}</Text>
        {post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Action row */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
            accessibilityState={{ checked: liked }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.Text style={[styles.actionIcon, likeAnimStyle]}>
              {liked ? '❤️' : '🤍'}
            </Animated.Text>
            <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove bookmark' : 'Save post'}
          accessibilityState={{ checked: saved }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.Text style={[styles.saveIcon, saveAnimStyle]}>
            {saved ? '🔖' : '📌'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

/**
 * Memo comparator: only re-render when the post ID changes.
 *
 * Interaction state (liked, saved, counts) is owned by Zustand — the Zustand
 * subscription inside PostCardComponent handles those re-renders independently.
 * The `post` prop reference changes when new pages are appended to the feed
 * (TanStack Query creates a new page array), so comparing by ID prevents
 * FlashList from remounting identical cards on pagination.
 */
export const PostCard = memo(PostCardComponent, (prev, next) => {
  return prev.post.id === next.post.id;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e5e7eb',
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  verified: {
    fontSize: 11,
    color: '#3b82f6',
    flexShrink: 0,
  },
  username: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  metaRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
  location: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#e5e7eb',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  caption: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 19,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  shareIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveIcon: {
    fontSize: 20,
  },
});
