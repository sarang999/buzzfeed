# BuzzFeed Travel — Stack & Versions

## Monorepo
- Turborepo 2 + pnpm workspaces (`pnpm-workspace.yaml`)
- `apps/*` + `packages/*`

## Apps
| App | Framework | Entry |
|-----|-----------|-------|
| `apps/web` | Next.js 14 App Router | `app/page.tsx` |
| `apps/mobile` | Expo SDK 51, RN 0.74, Expo Router v3 | `app/_layout.tsx` |

## Shared Packages
| Package | Purpose | Key deps |
|---------|---------|----------|
| `@buzzfeed/api` | Types + mock handlers | none |
| `@buzzfeed/store` | Zustand interaction state | zustand 4, @buzzfeed/api |
| `@buzzfeed/utils` | Pure utility functions | none |

## Mobile Key Libraries
- `@shopify/flash-list 1.7.1` — feeds (NOT FlatList)
- `react-native-reanimated ~3.10` — UI-thread animations
- `react-native-gesture-handler ~2.17` — gestures
- `expo-image ~1.12` — images with blurhash
- `expo-haptics ~13.0` — haptic feedback
- `expo-router ~3.5` — file-based navigation
- `react-native-toast-message ^2.2` — error toasts
- `@tanstack/react-query ^5.56` — server state

## Web Key Libraries
- `next 14.2.13`
- `@tanstack/react-query ^5.56`
- `zustand ^4.5.4`
- `tailwindcss ^3.4`
