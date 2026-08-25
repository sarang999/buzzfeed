# BuzzFeed Travel — Stack & Versions

## Monorepo
- Turborepo 2 + pnpm workspaces (`pnpm-workspace.yaml`)
- `apps/*` + `packages/*`

## Apps
| App | Framework | Entry |
|-----|-----------|-------|
| `apps/web` | Next.js 16.3.2, React 19, App Router | `app/page.tsx` |
| `apps/mobile` | Expo SDK 57, RN 0.86.2, Expo Router v57 | `app/_layout.tsx` |

## Shared Packages
| Package | Purpose | Key deps |
|---------|---------|----------|
| `@buzzfeed/api` | Types + mock handlers | none |
| `@buzzfeed/store` | Zustand interaction state | zustand 4, @buzzfeed/api |
| `@buzzfeed/utils` | Pure utility functions | none |

## Mobile Key Libraries
- `@shopify/flash-list 2.3.2` — feeds (NOT FlatList)
- `react-native-reanimated ~4.6.0` — UI-thread animations
- `react-native-worklets ~0.12.1` — required peer dep for Reanimated 4
- `react-native-gesture-handler ~3.2.1` — gestures
- `expo-image ~57.0.3` — images with blurhash
- `expo-haptics ~57.0.1` — haptic feedback
- `expo-router ~57.0.16` — file-based navigation
- `expo-secure-store ~14.0.1` — encrypted JWT storage (device keychain / Android Keystore)
- `react-native-toast-message ^2.4.0` — error toasts
- `@tanstack/react-query ^5.102.3` — server state

## Web Key Libraries
- `next 16.3.2`
- `react 19.2.8`
- `@tanstack/react-query ^5.102.3`
- `zustand ^4.5.4`
- `framer-motion ^13.1.1`
- `tailwindcss ^3.4`
