import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function ShimmerBox({ style }: { style: object }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite
      true, // reverse
    );
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#f0f0f0', '#d8d8d8'],
    ),
  }));

  return <Animated.View style={[style, animStyle]} />;
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <ShimmerBox style={styles.avatarSkeleton} />
        <View style={styles.authorText}>
          <ShimmerBox style={styles.nameSkeleton} />
          <ShimmerBox style={styles.usernameSkeleton} />
        </View>
      </View>
      <ShimmerBox style={styles.imageSkeleton} />
      <View style={styles.textArea}>
        <ShimmerBox style={styles.textLine} />
        <ShimmerBox style={styles.textLineShort} />
      </View>
      <View style={styles.actionRow}>
        <ShimmerBox style={styles.actionSkeleton} />
        <ShimmerBox style={styles.actionSkeleton} />
      </View>
    </View>
  );
}

interface SkeletonFeedProps {
  count?: number;
}

export function SkeletonFeed({ count = 4 }: SkeletonFeedProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const cardWidth = width - 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarSkeleton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  authorText: {
    flex: 1,
    gap: 6,
  },
  nameSkeleton: {
    height: 12,
    width: cardWidth * 0.35,
    borderRadius: 6,
  },
  usernameSkeleton: {
    height: 10,
    width: cardWidth * 0.25,
    borderRadius: 5,
  },
  imageSkeleton: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  textArea: {
    padding: 12,
    gap: 8,
  },
  textLine: {
    height: 12,
    width: '100%',
    borderRadius: 6,
  },
  textLineShort: {
    height: 12,
    width: '70%',
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    paddingTop: 8,
  },
  actionSkeleton: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
});
