import { Stack } from 'expo-router/stack';

/**
 * Auth group layout.
 * Clean full-screen presentation — no tab bar, no back header on the first screen.
 * Individual screens opt into a header if they need a back button (e.g. register).
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          headerTitle: 'Create Account',
          headerTintColor: '#f97316',
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
