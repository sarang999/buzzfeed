import { useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Share, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPostById, getComments } from '@buzzfeed/api';
import { formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag } from '@buzzfeed/utils';
import { LikeButton } from '@/components/ui/LikeButton';
import { SaveButton } from '@/components/ui/SaveButton';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPostById(id),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => getComments(id),
    enabled: !!post,
  });

  const handleShare = useCallback(async () => {
    if (!post) return;
    await Share.share({
      message: post.caption,
      url: buildShareUrl(post.id),
    });
  }, [post]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.errorText}>Could not load post.</Text>
      </SafeAreaView>
    );
  }

  const flag = countryCodeToFlag(post.location.countryCode);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.heroImage}
            {...(post.blurhash ? { placeholder: post.blurhash } : {})}
            contentFit="cover"
            transition={300}
          />
        )}

        <View style={styles.content}>
          {/* Author row */}
          <View style={styles.authorRow}>
            <Image
              source={{ uri: post.author.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{post.author.name}</Text>
                {post.author.isVerified && (
                  <Text style={styles.verifiedBadge} accessibilityLabel="Verified">✓</Text>
                )}
              </View>
              <Text style={styles.username}>@{post.author.username}</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
              <Text style={styles.location}>{flag} {post.location.city}</Text>
            </View>
          </View>

          {/* Caption */}
          <Text style={styles.caption}>{post.caption}</Text>

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tags}>
              {post.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.actionsLeft}>
              <LikeButton postId={post.id} />
              <View style={styles.commentCount}>
                <Text style={styles.commentIcon}>💬</Text>
                <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share post"
              >
                <Text style={styles.shareIcon}>↗</Text>
                <Text style={styles.shareLabel}>Share</Text>
              </TouchableOpacity>
            </View>
            <SaveButton postId={post.id} />
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>
              Comments ({formatCount(post.commentCount)})
            </Text>

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                {Array.from({ length: 3 }, (_, i) => (
                  <View key={i} style={styles.commentSkeletonRow}>
                    <View style={styles.commentAvatarSkeleton} />
                    <View style={styles.commentTextSkeleton} />
                  </View>
                ))}
              </View>
            ) : (
              comments?.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <Image
                    source={{ uri: comment.author.avatarUrl }}
                    style={styles.commentAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                      <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#3b82f6',
  },
  username: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  caption: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#f3f4f6',
    marginBottom: 24,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  shareLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  commentsSection: {
    gap: 16,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  commentsLoading: {
    gap: 12,
  },
  commentSkeletonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatarSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  commentTextSkeleton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  commentTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  commentText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    marginTop: 40,
    fontSize: 15,
  },
});
