import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';

export function OfflineBanner() {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      translateY.value = withSpring(offline ? 0 : -60, { damping: 14 });
      opacity.value = withTiming(offline ? 1 : 0, { duration: 200 });
    });
    return () => unsubscribe();
  }, [translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, animStyle]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  text: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '500',
  },
});
