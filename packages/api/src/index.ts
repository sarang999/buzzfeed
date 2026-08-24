export type {
  Author,
  Location,
  Post,
  Comment,
  PostDetail,
  FeedPage,
  PostInteraction,
  ApiResult,
} from './types';

export {
  getPosts,
  getPostById,
  getComments,
  likePost,
  savePost,
  getPostsByIds,
} from './mock/handlers';

export { MOCK_POSTS, MOCK_AUTHORS, MOCK_COMMENTS } from './mock/data';
