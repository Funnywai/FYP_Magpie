import { describe, expect, it } from 'vitest';

import { createChunkedStore, type KVStore } from './chunked-store';

function memoryStore(): KVStore & { dump(): Map<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
    dump: () => map,
  };
}

describe('createChunkedStore', () => {
  it('round-trips a value larger than the SecureStore limit', async () => {
    const backend = memoryStore();
    const store = createChunkedStore(backend, 512);
    const big = 'a'.repeat(3000);

    await store.setItem('session', big);

    await expect(store.getItem('session')).resolves.toBe(big);
    expect([...backend.dump().values()].every((v) => v.length <= 512)).toBe(true);
  });

  it('overwrites a long value with a shorter one and removes stale chunks', async () => {
    const backend = memoryStore();
    const store = createChunkedStore(backend, 100);

    await store.setItem('session', 'x'.repeat(1000));
    await store.setItem('session', 'short');

    await expect(store.getItem('session')).resolves.toBe('short');
    expect([...backend.dump().keys()].some((k) => k.endsWith('.9'))).toBe(false);
  });

  it('returns null after removeItem', async () => {
    const backend = memoryStore();
    const store = createChunkedStore(backend, 100);

    await store.setItem('session', 'value');
    await store.removeItem('session');

    await expect(store.getItem('session')).resolves.toBeNull();
    expect(backend.dump().size).toBe(0);
  });
});
