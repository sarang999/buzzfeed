/**
 * Bookmarks screen.
 *
 * Reactivity design:
 *   - Subscribes to `interactions` from Zustand so any save/unsave on any
 *     screen instantly updates the list — no manual refresh required.
 *   - `savedIds` is derived with `useMemo` from the live interactions map
 *     so it only recomputes when the saved set changes.
 *   - Posts are fetched via TanStack Query keyed by `savedIds` — the query
 *     re-runs whenever the set changes (new save or unsave from the feed).
 *   - FlashList (not FlatList) for consistent performance with the feed.
 */

import { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { usePostInteractionStore } from '@buzzfeed/store';
import { getPostsByIds } from '@buzzfeed/api';
import type { Post } from '@buzzfeed/api';
import { PostCard } from '@/components/PostCard/PostCard';
import { SkeletonFeed } from '@/components/SkeletonFeed';

export default function BookmarksScreen() {
  // Live subscription — component re-renders the moment any save/unsave fires.
  const interactions = usePostInteractionStore((s) => s.interactions);

  const savedIds = useMemo(
    () =>
      Object.entries(interactions)
        .filter(([, v]) => v.saved)
        .map(([id]) => id),
    [interactions],
  );

  /**
   * Stable query key: join sorted IDs into a single string.
   *
   * TanStack Query v5 deep-compares array keys, so ['bookmarks', ['p1','p2']]
   * would correctly invalidate when the set changes. However, using a string
   * key is more explicit and avoids any edge cases with object deep-equality.
   * Sorting ensures the key is order-independent (the saved set has no order).
   */
  const savedKey = useMemo(() => [...savedIds].sort().join(','), [savedIds]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['bookmarks', savedKey],
    queryFn: () => getPostsByIds(savedIds),
    enabled: savedIds.length > 0,
    staleTime: 30_000,
  });

  const renderItem = useCallback(({ item }: { item: Post }) => <PostCard post={item} />, []);
  const keyExtractor = useCallback((item: Post) => item.id, []);

  if (isLoading && savedIds.length > 0) return <SkeletonFeed count={3} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        {posts.length > 0 && (
          <Text style={styles.headerCount}>{posts.length}</Text>
        )}
      </View>

      {savedIds.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔖</Text>
      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
      <Text style={styles.emptySubtitle}>
        Save posts from your feed to find them here any time.
      </Text>
      <TouchableOpacity
        style={styles.exploreCta}
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
      >
        <Text style={styles.exploreCtaText}>Explore feed</Text>
      </TouchableOpacity>
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreCta: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f97316',
    borderRadius: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
