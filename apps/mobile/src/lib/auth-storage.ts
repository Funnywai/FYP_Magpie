import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { createChunkedStore, type KVStore } from './chunked-store';

const nativeBackend: KVStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Web is a development convenience only; localStorage is not secure storage.
const webBackend: KVStore = {
  async getItem(key) {
    const storage = (globalThis as { localStorage?: { getItem(k: string): string | null } }).localStorage;
    return storage ? storage.getItem(key) : null;
  },
  async setItem(key, value) {
    const storage = (globalThis as { localStorage?: { setItem(k: string, v: string): void } }).localStorage;
    storage?.setItem(key, value);
  },
  async removeItem(key) {
    const storage = (globalThis as { localStorage?: { removeItem(k: string): void } }).localStorage;
    storage?.removeItem(key);
  },
};

export const authStorage = createChunkedStore(Platform.OS === 'web' ? webBackend : nativeBackend);
