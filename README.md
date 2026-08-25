# BuzzFeed Travel — Monorepo

A high-performance travel social feed. **Mobile** (React Native / Expo Router) and **Web** (Next.js 16 App Router) share typed API contracts, Zustand interaction state, and utilities through three internal packages in a Turborepo + pnpm workspace.

**Stack**: Next.js 16.3 · React 19 · Expo SDK 57 · React Native 0.86.2 · TanStack Query 5 · Zustand 4 · Reanimated 4.5 · FlashList 2

> **Full engineering decisions and trade-offs → [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22 | `brew install node` |
| pnpm | ≥ 9 | `npm install -g pnpm` |
| Xcode (iOS) | ≥ 16.4 (macOS only) | App Store |
| Android Studio | Latest | [developer.android.com](https://developer.android.com/studio) |
| Ruby (iOS native) | 3.3.6 via Homebrew | `brew install ruby@3.3` |
| Java (Android) | 17 | `brew install openjdk@17` |

---

## Quick Start

```bash
# 1. Clone
git clone <repo-url> && cd buzzfeed

# 2. Install all workspace dependencies
pnpm install

# 3. Run the web app
pnpm web:dev
# → http://localhost:3000

# 4. Run the mobile app (JS-only preview — separate terminal)
pnpm mobile:start
# Scan QR with Expo Go (iOS/Android) for the feed, interactions, auth
```

---

## Repository Structure

```
buzzfeed/
├── apps/
│   ├── mobile/          # Expo SDK 57, Expo Router, RN 0.86.2 (iOS + Android)
│   └── web/             # Next.js 16 App Router, React 19
├── packages/
│   ├── api/             # TypeScript types + async mock data layer
│   ├── store/           # Zustand interaction + auth store (framework-agnostic)
│   └── utils/           # formatRelativeTime, formatCount, buildShareUrl
├── builds/              # Pre-built release artifacts (IPA)
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Running Locally

### Web

```bash
pnpm web:dev        # dev server → localhost:3000
pnpm web:build      # production build (verifies SSR + static pages)
pnpm web:start      # serve production build
```

### Mobile — Expo Go (JS-only, fastest)

```bash
pnpm mobile:start
# Scan QR with Expo Go on iOS/Android
# Full feed, auth, interactions, bookmarks work in Expo Go
```

### Mobile — Full Native Build (required for MMKV, SecureStore, haptics)

#### iOS

```bash
# Step 1: Install CocoaPods using Homebrew Ruby 3.3 (must NOT use system ruby 2.6)
pnpm mobile:pod-install
# OR manually:
cd apps/mobile/ios
/opt/homebrew/opt/ruby@3.3/bin/ruby $(which pod) install
cd ../../..

# Step 2: Run on simulator
pnpm mobile:ios
# OR: cd apps/mobile && npx expo run:ios
```

#### Android

```bash
# Requires Android emulator running (open Android Studio → Device Manager → start emulator)
pnpm mobile:android
# OR: cd apps/mobile && npx expo run:android

# NOTE: See Troubleshooting section below if you hit the Kotlin version error
```

---

## Demo Account

The app ships with a pre-seeded demo account:

| Field | Value |
|-------|-------|
| Email | `demo@buzzfeed.travel` |
| Password | `password123` |

Tap **"Use demo account"** on the login screen to auto-fill.  
You can also register a new account — it persists for the session.

---

## Build Commands

All build commands are in the root `package.json`:

| Command | What it does |
|---------|-------------|
| `pnpm web:build` | Next.js production build |
| `pnpm mobile:pod-install` | Install iOS CocoaPods with Homebrew Ruby 3.3 |
| `pnpm mobile:build:ios:release` | Full iOS release archive + IPA (no signing) |
| `pnpm mobile:build:android:apk` | Release APK via Gradle |
| `pnpm mobile:build:android:aab` | Release AAB via Gradle |

### Pre-built Release Files

| File | Platform | Location |
|------|----------|----------|
| `BuzzFeedTravel.ipa` | iOS | `builds/BuzzFeedTravel.ipa` |

---

## Installing the IPA (iOS)

The IPA in `builds/` is an **unsigned development build** — install it via:

**Option A — Xcode**
```
Window → Devices and Simulators → select your device → drag the .ipa onto it
```

**Option B — Apple Configurator 2** (Mac App Store)
```
Drag the .ipa onto your connected device
```

**Option C — AltStore** (no Apple Developer account needed)
Install AltStore on your device, then sideload the IPA via AltServer.

> **Note**: An unsigned IPA requires the device's UDID to be registered in an Apple Developer account, OR you can use AltStore / Sideloadly to re-sign it with your personal certificate.

---

## Running All Dev Servers Together

```bash
# From repo root — Turborepo runs both in parallel
pnpm dev
```

---

## Troubleshooting

### Android: Kotlin version conflict (`expo-module-gradle-plugin:compileKotlin FAILED`)

**Symptom**:
```
e: kotlin-stdlib-2.3.0.jar!/META-INF/kotlin-stdlib.kotlin_module
   Module was compiled with an incompatible version of Kotlin.
   The binary version of its metadata is 2.3.0, expected version is 2.1.0.
```

**Root cause**: `expo-modules-core@57.0.13` uses Kotlin `2.1.20` for its Gradle plugin. `@react-native/gradle-plugin@0.86.2` ships pre-built class files compiled with Kotlin `2.3.0`. The metadata version check fails.

**Fix** (already applied in this repo): A Gradle init script at `~/.gradle/init.d/kotlin-suppress-metadata.gradle` adds `-Xskip-metadata-version-check` to all Kotlin compile tasks. If you're on a fresh machine, create the file:

```bash
mkdir -p ~/.gradle/init.d

cat > ~/.gradle/init.d/kotlin-suppress-metadata.gradle << 'EOF'
gradle.allprojects {
    afterEvaluate { project ->
        project.tasks.matching { it.class.name.contains("KotlinCompile") }.each { task ->
            try {
                def opts = task.kotlinOptions
                def existing = opts.freeCompilerArgs ?: []
                if (!existing.contains("-Xskip-metadata-version-check")) {
                    opts.freeCompilerArgs = existing + ["-Xskip-metadata-version-check"]
                }
            } catch (ignored) {}
        }
    }
}
EOF
```

Then clean and retry:
```bash
cd apps/mobile/android
./gradlew clean
npx expo run:android
```

---

### Android: `babel-preset-expo` not found during Gradle bundle

**Symptom**:
```
Failed to construct transformer: Error: Cannot find module 'babel-preset-expo'
```

**Cause**: Gradle's bundle task runs Metro from the `android/` subdirectory, which is outside the pnpm workspace.

**Fix**: Pre-bundle JS separately, then skip Gradle's bundling:
```bash
# From apps/mobile:
cd apps/mobile
npx expo export --platform android --output-dir /tmp/android-bundle

# Then build with bundling skipped:
cd android
./gradlew assembleRelease -x createBundleReleaseJsAndAssets -x lint -x test
```

---

### iOS: Pod install fails with "Rosetta2" warning

**Symptom**:
```
[!] Do not use "pod install" from inside Rosetta2 (x86_64 emulation on arm64)
```

**Fix**: Always use Homebrew Ruby 3.3 (ARM native), never the system `/usr/bin/ruby`:
```bash
cd apps/mobile/ios
/opt/homebrew/opt/ruby@3.3/bin/ruby $(which pod) install
```

Or set it permanently in your shell:
```bash
echo 'export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

---

### iOS: `expo run:ios` from wrong directory

**Symptom**:
```
ConfigError: The expected package.json path: .../ios/package.json does not exist
```

**Fix**: Always run from `apps/mobile`, never from `apps/mobile/ios`:
```bash
# Wrong:
cd apps/mobile/ios && npx expo run:ios

# Correct:
cd apps/mobile && npx expo run:ios
```

---

### Gradle: Clean up stale build artifacts

```bash
cd apps/mobile/android
./gradlew clean

# Nuclear option — wipe all Gradle caches:
rm -rf ~/.gradle/caches/build-cache-*
rm -rf ~/.gradle/caches/modules-2/
./gradlew clean
```

---

### pnpm: Peer dependency warnings on install

The following warnings are **expected and non-blocking**:

```
✕ unmet peer @react-native/metro-config@0.86.2: found 0.87.0
✕ Conflicting peer dependencies: react-dom
```

- `metro-config` mismatch: the `@react-native-community/cli` peer expects `0.87.0` but the app runs `0.86.2`. Metro still works correctly.
- `react-dom` conflict: framer-motion in the web app and the mobile workspace resolve different versions. Both work.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for all 13 engineering decisions including: monorepo rationale, state split, Zustand subscription correctness, auth token lifecycle, optimistic update pattern, and the Android Kotlin version conflict.

---

## Features

| Feature | Web | Mobile |
|---------|-----|--------|
| Travel feed (paginated, SSR) | ✅ | ✅ FlashList |
| Pull-to-refresh | ✅ | ✅ + haptic feedback |
| Skeleton loading | ✅ CSS shimmer | ✅ Reanimated UI-thread shimmer |
| Like (optimistic + rollback) | ✅ | ✅ + spring animation |
| Save / Bookmark | ✅ | ✅ + spring animation |
| State consistency across screens | ✅ | ✅ Shared Zustand store |
| Post detail (SSR) | ✅ | ✅ Native screen |
| Comments (async) | ✅ | ✅ |
| Native share | ✅ Web Share API | ✅ `Share.share()` |
| Error + retry | ✅ | ✅ |
| Bookmarks page (reactive) | ✅ | ✅ Live Zustand subscription |
| Offline banner | — | ✅ Reanimated slide-in |
| Auth (login / register) | ✅ | ✅ |
| JWT token storage | localStorage (dev) | ✅ expo-secure-store |
| Profile screen | ✅ Header nav | ✅ Profile tab |

---

## File Map

### Shared Packages

| File | What it does |
|------|-------------|
| `packages/api/src/types.ts` | Every TypeScript interface: `Post`, `Author`, `Comment`, `FeedPage`, `AuthSession`. Single source of truth. |
| `packages/api/src/mock/data.ts` | 50 seeded travel posts. Deterministic — same data on every run. |
| `packages/api/src/mock/handlers.ts` | `getPosts`, `getPostById`, `likePost`, `savePost`, `login`, `register`, `refreshTokens`. Swap these for real `fetch()` calls. |
| `packages/store/src/post-interaction.ts` | Zustand store: `optimisticLike`, `rollbackLike`, `confirmLike`, `optimisticSave`, `rollbackSave`, `getSavedIds`. |
| `packages/store/src/auth.ts` | Auth store: `user`, `tokens`, `isAuthenticated`, `isTokenExpired`, `setSession`, `clearSession`. |
| `packages/utils/src/index.ts` | `formatRelativeTime`, `formatCount`, `buildShareUrl`, `countryCodeToFlag`. Pure functions, no deps. |

### Web App

| File | Role |
|------|------|
| `apps/web/app/page.tsx` | Feed — Server Component, zero loading flash |
| `apps/web/app/login/page.tsx` | Login page |
| `apps/web/app/register/page.tsx` | Register page |
| `apps/web/app/bookmarks/page.tsx` | Bookmarks — client, reads Zustand saved IDs |
| `apps/web/app/auth-context.tsx` | `AuthProvider` + `useAuth` hook |
| `apps/web/components/ui/HeaderNav.tsx` | Sticky header with auth state |
| `apps/web/components/feed/FeedClient.tsx` | `useInfiniteQuery` + IntersectionObserver |

### Mobile App

| File | Role |
|------|------|
| `apps/mobile/app/_layout.tsx` | Root layout — auth guard, token refresh, providers |
| `apps/mobile/app/(auth)/login.tsx` | Login screen |
| `apps/mobile/app/(auth)/register.tsx` | Register screen |
| `apps/mobile/app/(tabs)/index.tsx` | Feed — FlashList, pull-to-refresh |
| `apps/mobile/app/(tabs)/bookmarks.tsx` | Bookmarks — reactive Zustand + TanStack Query |
| `apps/mobile/app/(tabs)/profile.tsx` | Profile + sign out |
| `apps/mobile/app/post/[id].tsx` | Post detail — hero image, comments, actions |
| `apps/mobile/components/PostCard/PostCard.tsx` | Main list item — single atomic Zustand selector |
| `apps/mobile/utils/secureAuth.ts` | SecureStore + MMKV two-layer auth storage |

---

## Contributing

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) before touching any component.
2. Run `pnpm install` from repo root.
3. Run `pnpm --filter @buzzfeed/web exec tsc --noEmit` to verify types across all packages.
4. Run `pnpm test` to run the 22 store unit tests.
