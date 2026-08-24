import type { FeedPage, Post, PostDetail, Comment } from '../types';
import { MOCK_POSTS, MOCK_COMMENTS } from './data';

const PAGE_SIZE = 10;

/** Simulates realistic network latency: 300–800ms */
function simulateLatency(): Promise<void> {
  const ms = 300 + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 5% chance of network error for realistic error-state testing */
function maybeThrow(): void {
  if (Math.random() < 0.05) {
    throw new Error('Network request failed. Please try again.');
  }
}

export async function getPosts(cursor?: string | null): Promise<FeedPage> {
  await simulateLatency();
  maybeThrow();

  const startIndex = cursor ? MOCK_POSTS.findIndex((p) => p.id === cursor) + 1 : 0;
  const slice = MOCK_POSTS.slice(startIndex, startIndex + PAGE_SIZE);
  const lastPost = slice[slice.length - 1];
  const hasMore = startIndex + PAGE_SIZE < MOCK_POSTS.length;

  return {
    posts: slice,
    nextCursor: hasMore && lastPost ? lastPost.id : null,
    total: MOCK_POSTS.length,
  };
}

export async function getPostById(id: string): Promise<PostDetail> {
  await simulateLatency();
  maybeThrow();

  const post = MOCK_POSTS.find((p) => p.id === id);
  if (!post) throw new Error(`Post ${id} not found`);

  return { ...post, comments: MOCK_COMMENTS };
}

export async function getComments(_postId: string): Promise<Comment[]> {
  await simulateLatency();
  return MOCK_COMMENTS;
}

export async function likePost(
  _postId: string,
  liked: boolean,
): Promise<{ likeCount: number }> {
  await simulateLatency();
  maybeThrow();

  const post = MOCK_POSTS.find((p) => p.id === _postId);
  // Return the adjusted count reflecting the new state
  const base = post?.likeCount ?? 0;
  return { likeCount: liked ? base + 1 : Math.max(0, base - 1) };
}

export async function savePost(_postId: string, _saved: boolean): Promise<void> {
  await simulateLatency();
  maybeThrow();
}

export async function getPostsByIds(ids: string[]): Promise<Post[]> {
  await simulateLatency();
  return MOCK_POSTS.filter((p) => ids.includes(p.id));
}
