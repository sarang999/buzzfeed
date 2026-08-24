// All shared domain types. Single source of truth across mobile and web.

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  isVerified: boolean;
}

export interface Location {
  city: string;
  country: string;
  countryCode: string;
}

export interface Post {
  id: string;
  author: Author;
  caption: string;
  imageUrl: string | null;
  /** Pre-generated blurhash string for blur-up image placeholder */
  blurhash: string | null;
  location: Location;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  createdAt: string; // ISO 8601
  tags: string[];
}

export interface Comment {
  id: string;
  author: Author;
  text: string;
  createdAt: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

/** Cursor-based page — nextCursor is null when no more pages exist */
export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  total: number;
}

export interface PostInteraction {
  liked: boolean;
  saved: boolean;
  likeCount: number;
  saveCount: number;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };
