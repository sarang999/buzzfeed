import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';
import { usePostInteractionStore } from '@buzzfeed/store';

const mmkv = new MMKV({ id: 'buzzfeed-interactions' });

/** MMKV-backed storage adapter for Zustand persist — synchronous, 30× faster than AsyncStorage */
export const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
}));

/** Call once at app startup to swap the default noopStorage for MMKV and rehydrate saved bookmarks */
export function hydrateStoreFromMMKV() {
  usePostInteractionStore.persist.setOptions({ storage: mmkvStorage });
  void usePostInteractionStore.persist.rehydrate();
}
