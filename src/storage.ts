export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    get: (k) => data.get(k) ?? null,
    set: (k, v) => void data.set(k, v),
    remove: (k) => void data.delete(k),
  };
}

/**
 * Wraps a Web Storage object so that every failure (private mode, quota,
 * disabled storage) degrades to "nothing persisted" instead of crashing.
 */
export function safeStore(getBacking: () => Storage | undefined): KeyValueStore {
  const attempt = <T>(fn: (s: Storage) => T, fallback: T): T => {
    try {
      const backing = getBacking();
      return backing ? fn(backing) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    get: (k) => attempt((s) => s.getItem(k), null),
    set: (k, v) => attempt((s) => s.setItem(k, v), undefined),
    remove: (k) => attempt((s) => s.removeItem(k), undefined),
  };
}
