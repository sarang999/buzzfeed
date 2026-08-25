import React, { memo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { likePost } from '@buzzfeed/api';
import { usePostInteractionStore, useAuthStore } from '@buzzfeed/store';
import { formatCount } from '@buzzfeed/utils';

interface LikeButtonProps {
  postId: string;
}

function LikeButtonComponent({ postId }: LikeButtonProps) {
  const interaction = usePostInteractionStore((s) => s.interactions[postId]);
  const optimisticLike = usePostInteractionStore((s) => s.optimisticLike);
  const rollbackLike = usePostInteractionStore((s) => s.rollbackLike);
  const confirmLike = usePostInteractionStore((s) => s.confirmLike);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const liked = interaction?.liked ?? false;
  const likeCount = interaction?.likeCount ?? 0;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { mutate } = useMutation({
    mutationFn: () => likePost(postId, !liked),
    onMutate: () => optimisticLike(postId),
    onSuccess: (data) => confirmLike(postId, data.likeCount),
    onError: () => {
      rollbackLike(postId);
      Toast.show({ type: 'error', text1: 'Failed to update like', visibilityTime: 2000 });
    },
  });

  const handlePress = useCallback(() => {
    if (!isAuthenticated) {
      Toast.show({
        type: 'info',
        text1: 'Sign in to like posts',
        text2: 'Tap to sign in',
        onPress: () => router.push('/(auth)/login'),
        visibilityTime: 3000,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutate();
  }, [isAuthenticated, liked, scale, mutate]);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
      accessibilityState={{ checked: liked }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.Text style={animStyle}>{liked ? '❤️' : '🤍'}</Animated.Text>
      <Text style={styles.count}>{formatCount(likeCount)}</Text>
    </TouchableOpacity>
  );
}

export const LikeButton = memo(LikeButtonComponent);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
});
