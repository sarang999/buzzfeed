# BuzzFeed Travel — File Map

## Shared Packages
| File | What it owns |
|------|-------------|
| `packages/api/src/types.ts` | Every interface: Post, Author, Comment, FeedPage, PostInteraction |
| `packages/api/src/mock/data.ts` | 50 seeded travel posts (deterministic) |
| `packages/api/src/mock/handlers.ts` | getPosts, getPostById, likePost, savePost — swap for real fetch() |
| `packages/store/src/post-interaction.ts` | All optimistic actions + rollback + getSavedIds |
| `packages/utils/src/index.ts` | formatRelativeTime, formatCount, buildShareUrl, countryCodeToFlag |

## Web App (`apps/web`)
| File | Role |
|------|------|
| `app/page.tsx` | Feed — **Server Component**, fetches initial page, zero loading flash |
| `app/providers.tsx` | QueryClientProvider (client boundary) |
| `app/post/[id]/page.tsx` | Post detail — Server Component with notFound() guard |
| `app/bookmarks/page.tsx` | Bookmarks — client, reads Zustand saved IDs |
| `components/feed/FeedClient.tsx` | useInfiniteQuery + IntersectionObserver infinite scroll |
| `components/feed/PostCard.tsx` | Feed card: next/image, author, caption, tags, actions |
| `components/feed/FeedSkeleton.tsx` | CSS shimmer, configurable count prop |
| `components/post/PostDetailClient.tsx` | Full detail + comments |
| `components/ui/LikeButton.tsx` | Optimistic like + rollback + toast |
| `components/ui/SaveButton.tsx` | Optimistic save + rollback |
| `components/ui/ShareButton.tsx` | navigator.share() + clipboard fallback |

## Mobile App (`apps/mobile`)
| File | Role |
|------|------|
| `app/_layout.tsx` | Root — QueryClient, GestureHandler, SafeArea, Toast providers |
| `app/(tabs)/_layout.tsx` | Bottom tab bar (Feed + Saved) |
| `app/(tabs)/index.tsx` | Feed — FlashList, overrideItemLayout, pull-to-refresh |
| `app/(tabs)/bookmarks.tsx` | Bookmarks — Zustand IDs → fetch posts |
| `app/post/[id].tsx` | Detail — hero image, comments, native Share |
| `components/PostCard/PostCard.tsx` | React.memo list item, expo-image, blurhash |
| `components/SkeletonFeed.tsx` | Reanimated shimmer — UI thread, no library |
| `components/ErrorView.tsx` | Full-screen error + retry |
| `components/ui/LikeButton.tsx` | Spring bounce + haptic + optimistic + rollback |
| `components/ui/SaveButton.tsx` | Same pattern, medium haptic |

## Config Files
| File | Purpose |
|------|---------|
| `turbo.json` | Build task graph |
| `pnpm-workspace.yaml` | Workspace roots |
| `tsconfig.base.json` | Strict TS base (no lib — each package adds its own) |
| `apps/mobile/metro.config.js` | watchFolders + nodeModulesPaths for monorepo |
| `apps/mobile/babel.config.js` | reanimated/plugin must be last |
| `apps/web/next.config.js` | transpilePackages for workspace imports |
| `.github/copilot-instructions.md` | Code review rules loaded by VS Code Copilot |
