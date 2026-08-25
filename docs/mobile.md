# BuzzFeed Travel — Mobile Patterns (Expo SDK 57 · RN 0.86.2)

## FlashList (not FlatList)
```tsx
<FlashList
  data={posts}
  renderItem={renderItem}          // useCallback — stable ref
  keyExtractor={keyExtractor}      // useCallback
  estimatedItemSize={320}
  overrideItemLayout={(layout, item) => {
    layout.size = item.imageUrl ? 380 : 200;   // with-image vs text-only
  }}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.5}
/>
```

## Reanimated Animation Pattern (UI thread)
```tsx
const scale = useSharedValue(1);
const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
// Trigger:
scale.value = withSequence(
  withSpring(1.4, { damping: 4, stiffness: 300 }),
  withSpring(1, { damping: 8 }),
);
```

## Haptics
- Like: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- Save: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`
- Pull-to-refresh: Light on start

## expo-image with Blurhash
```tsx
<Image
  source={{ uri: post.imageUrl }}
  placeholder={post.blurhash ?? undefined}   // string from mock data
  contentFit="cover"
  transition={300}
/>
```

## Navigation (Expo Router)
- `app/_layout.tsx` — root providers
- `app/(tabs)/_layout.tsx` — tab bar
- `app/(tabs)/index.tsx` — feed tab (file = route)
- `app/post/[id].tsx` — dynamic segment, `useLocalSearchParams<{ id: string }>()`

## Babel Rule
`reanimated/plugin` must be last in `babel.config.js` plugins array — always.

## Toast on Error
```tsx
Toast.show({ type: 'error', text1: 'Failed to update', visibilityTime: 2000 });
```
`<Toast />` is mounted in `app/_layout.tsx` after all providers.

## Known tsconfig Requirements
- Mobile tsconfig needs `"jsx": "react-native"` and `"noEmit": true`
- All three `packages/*/tsconfig.json` need `"rootDir": "./src"` — without it TypeScript warns TS6307 when test files sit alongside source
- `packages/api` and `packages/store` need `"lib": ["ES2022", "DOM"]` for setTimeout + localStorage
- `packages/utils` and `packages/store` need `"types": ["jest"]` so `describe`/`expect`/`beforeEach` resolve without installing extra globals
