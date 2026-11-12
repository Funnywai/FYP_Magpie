export interface KVStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const manifestKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

/**
 * SecureStore rejects values above ~2048 bytes. Split large values into
 * chunks and store a manifest so reads can rebuild the original string.
 */
export function createChunkedStore(backend: KVStore, chunkSize = 512): KVStore {
  return {
    async getItem(key) {
      const rawCount = await backend.getItem(manifestKey(key));
      if (rawCount === null) return null;

      const count = Number(rawCount);
      if (!Number.isInteger(count) || count < 0) return null;

      const parts: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const part = await backend.getItem(chunkKey(key, index));
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    },

    async setItem(key, value) {
      const chunks = value.match(new RegExp(`[\\s\\S]{1,${chunkSize}}`, 'g')) ?? [];
      const previousRaw = await backend.getItem(manifestKey(key));
      const previous = Number(previousRaw ?? '0');

      for (let index = 0; index < Math.max(previous, chunks.length); index += 1) {
        const chunk = chunks[index];
        if (chunk !== undefined) await backend.setItem(chunkKey(key, index), chunk);
        else await backend.removeItem(chunkKey(key, index));
      }

      await backend.setItem(manifestKey(key), String(chunks.length));
      await backend.removeItem(key);
    },

    async removeItem(key) {
      const previousRaw = await backend.getItem(manifestKey(key));
      const previous = Number(previousRaw ?? '0');

      for (let index = 0; index < previous; index += 1) {
        await backend.removeItem(chunkKey(key, index));
      }
      await backend.removeItem(manifestKey(key));
      await backend.removeItem(key);
    },
  };
}
