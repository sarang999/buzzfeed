# BuzzFeed Travel — Commands

## Root (run from repo root)
```bash
pnpm install                     # install all workspace deps
pnpm dev                         # start all apps in parallel (Turborepo)
pnpm build                       # build all packages + apps
```

## Web (`@buzzfeed/web`)
```bash
pnpm --filter @buzzfeed/web dev              # dev server → localhost:3000
pnpm --filter @buzzfeed/web exec next build  # production build check
pnpm --filter @buzzfeed/web exec tsc --noEmit
```

## Mobile (`@buzzfeed/mobile`)
```bash
cd apps/mobile
npx expo start           # Expo Go — core feed, nav, interactions
npx expo run:ios         # Full native: FlashList + haptics + blurhash
npx expo run:android     # Full Android emulator build
```

## Shared Packages — Type Check
```bash
pnpm --filter @buzzfeed/api exec tsc --noEmit
pnpm --filter @buzzfeed/store exec tsc --noEmit
pnpm --filter @buzzfeed/utils exec tsc --noEmit
```

## Useful One-liners
```bash
# List all TS source files (excluding node_modules/dist/.next)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v .next | grep -v dist | sort

# Check for FlatList usage (should be zero in feed screens)
grep -r "FlatList" apps/mobile/app --include="*.tsx"

# Verify no .js extensions in package imports
grep -r "from '\./.*\.js'" packages --include="*.ts"
```
