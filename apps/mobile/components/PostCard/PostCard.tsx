import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { likePost, savePost } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';
import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '@buzzfeed/utils';
import type { Post } from '@buzzfeed/api';
import { Share } from 'react-native';

interface PostCardProps {
  post: Post;
}

function PostCardComponent({ post }: PostCardProps) {
  const interaction = usePostInteractionStore((s) => s.interactions[post.id]);
  const optimisticLike = usePostInteractionStore((s) => s.optimisticLike);
  const rollbackLike = usePostInteractionStore((s) => s.rollbackLike);
  const confirmLike = usePostInteractionStore((s) => s.confirmLike);
  const optimisticSave = usePostInteractionStore((s) => s.optimisticSave);
  const rollbackSave = usePostInteractionStore((s) => s.rollbackSave);

  const liked = interaction?.liked ?? false;
  const saved = interaction?.saved ?? false;
  const likeCount = interaction?.likeCount ?? post.likeCount;
  const saveCount = interaction?.saveCount ?? post.saveCount;

  // Reanimated scale spring for like button press feedback
  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const { mutate: mutateLike } = useMutation({
    mutationFn: () => likePost(post.id, !liked),
    onMutate: () => {
      optimisticLike(post.id);
    },
    onSuccess: (data) => {
      confirmLike(post.id, data.likeCount);
    },
    onError: () => {
      rollbackLike(post.id);
      Toast.show({ type: 'error', text1: 'Failed to update like', visibilityTime: 2000 });
    },
  });

  const { mutate: mutateSave } = useMutation({
    mutationFn: () => savePost(post.id, !saved),
    onMutate: () => {
      optimisticSave(post.id);
    },
    onError: () => {
      rollbackSave(post.id);
      Toast.show({ type: 'error', text1: 'Failed to save post', visibilityTime: 2000 });
    },
  });

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutateLike();
  }, [liked, likeScale, mutateLike]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutateSave();
  }, [saved, saveScale, mutateSave]);

  const handleShare = useCallback(() => {
    Share.share({ message: post.caption, url: buildShareUrl(post.id) });
  }, [post]);

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

      {/* Post image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
          placeholder={post.blurhash ?? null}
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
          {/* Like */}
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

          {/* Comments */}
          <View style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
          </View>

          {/* Share */}
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

        {/* Save */}
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

// Custom comparator: only re-render when visual data changes
export const PostCard = memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.likeCount === next.post.likeCount
  );
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
