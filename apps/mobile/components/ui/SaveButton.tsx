import React, { memo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
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
import { savePost } from '@buzzfeed/api';
import { usePostInteractionStore, useAuthStore } from '@buzzfeed/store';

interface SaveButtonProps {
  postId: string;
}

function SaveButtonComponent({ postId }: SaveButtonProps) {
  const interaction = usePostInteractionStore((s) => s.interactions[postId]);
  const optimisticSave = usePostInteractionStore((s) => s.optimisticSave);
  const rollbackSave = usePostInteractionStore((s) => s.rollbackSave);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const saved = interaction?.saved ?? false;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { mutate } = useMutation({
    mutationFn: () => savePost(postId, !saved),
    onMutate: () => optimisticSave(postId),
    onError: () => {
      rollbackSave(postId);
      Toast.show({ type: 'error', text1: 'Failed to save post', visibilityTime: 2000 });
    },
  });

  const handlePress = useCallback(() => {
    if (!isAuthenticated) {
      Toast.show({
        type: 'info',
        text1: 'Sign in to save posts',
        text2: 'Tap to sign in',
        onPress: () => router.push('/(auth)/login'),
        visibilityTime: 3000,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutate();
  }, [isAuthenticated, saved, scale, mutate]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove bookmark' : 'Save post'}
      accessibilityState={{ checked: saved }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.Text style={[styles.icon, animStyle]}>{saved ? '🔖' : '📌'}</Animated.Text>
    </TouchableOpacity>
  );
}

export const SaveButton = memo(SaveButtonComponent);

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
  },
});
