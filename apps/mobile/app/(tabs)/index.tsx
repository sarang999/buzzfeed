import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { getPosts } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';
import type { Post } from '@buzzfeed/api';
import { PostCard } from '@/components/PostCard/PostCard';
import { SkeletonFeed } from '@/components/SkeletonFeed';
import { ErrorView } from '@/components/ErrorView';

export default function FeedScreen() {
  const hydrate = usePostInteractionStore((s) => s.hydrate);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => getPosts(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  /**
   * Memoize the flat post array so the reference is stable between renders.
   * Without useMemo, flatMap runs on every render — including renders triggered
   * by Zustand interaction updates — allocating a new array each time and
   * causing FlashList to diff the entire list unnecessarily.
   */
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages],
  );

  useEffect(() => {
    if (posts.length > 0) hydrate(posts);
    // hydrate is a stable function reference from Zustand — safe to omit from deps.
    // We re-run only when the page count changes (new page appended).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages.length]);

  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: Post }) => <PostCard post={item} />, []);
  const keyExtractor = useCallback((item: Post) => item.id, []);

  if (status === 'pending') return <SkeletonFeed />;
  if (status === 'error') {
    return <ErrorView message={(error as Error).message} onRetry={() => refetch()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✈ BuzzFeed Travel</Text>
      </View>

      <FlashList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.loadingMore} color="#f97316" />
          ) : !hasNextPage && posts.length > 0 ? (
            <Text style={styles.endText}>You've reached the end ✈</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor="#f97316"
            colors={['#f97316']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const ItemSeparator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  loadingMore: {
    paddingVertical: 20,
  },
  endText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    paddingVertical: 24,
  },
});
