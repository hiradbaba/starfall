import { memoryStore, safeStore } from '../src/storage';

const throwing = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
} as unknown as Storage;

describe('safeStore', () => {
  it('passes through to working storage', () => {
    const backing = new Map<string, string>();
    const fake = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => void backing.set(k, v),
      removeItem: (k: string) => void backing.delete(k),
    } as unknown as Storage;
    const store = safeStore(() => fake);
    store.set('a', '1');
    expect(store.get('a')).toBe('1');
    store.remove('a');
    expect(store.get('a')).toBeNull();
  });

  it('never throws when storage is broken or missing', () => {
    for (const store of [
      safeStore(() => throwing),
      safeStore(() => undefined),
      safeStore(() => {
        throw new Error('SecurityError');
      }),
    ]) {
      expect(() => store.set('a', '1')).not.toThrow();
      expect(store.get('a')).toBeNull();
      expect(() => store.remove('a')).not.toThrow();
    }
  });
});

describe('memoryStore', () => {
  it('stores values', () => {
    const s = memoryStore();
    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
  });
});
