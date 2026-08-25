export type {
  Author,
  Location,
  Post,
  Comment,
  PostDetail,
  FeedPage,
  PostInteraction,
  ApiResult,
  // Auth
  AuthUser,
  AuthTokens,
  AuthSession,
  LoginInput,
  RegisterInput,
} from './types';

export {
  getPosts,
  getPostById,
  getComments,
  likePost,
  savePost,
  getPostsByIds,
  // Auth
  login,
  register,
  refreshTokens,
} from './mock/handlers';

export { MOCK_POSTS, MOCK_AUTHORS, MOCK_COMMENTS } from './mock/data';
