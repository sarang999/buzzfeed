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
import { savePost } from '@buzzfeed/api';
import { usePostInteractionStore } from '@buzzfeed/store';

interface SaveButtonProps {
  postId: string;
}

function SaveButtonComponent({ postId }: SaveButtonProps) {
  const interaction = usePostInteractionStore((s) => s.interactions[postId]);
  const optimisticSave = usePostInteractionStore((s) => s.optimisticSave);
  const rollbackSave = usePostInteractionStore((s) => s.rollbackSave);

  const saved = interaction?.saved ?? false;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { mutate } = useMutation({
    mutationFn: () => savePost(postId, !saved),
    onMutate: () => {
      optimisticSave(postId);
    },
    onError: () => {
      rollbackSave(postId);
      Toast.show({ type: 'error', text1: 'Failed to save', visibilityTime: 2000 });
    },
  });

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8 }),
    );
    mutate();
  }, [saved, scale, mutate]);

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
