import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWithRetry, lazyWithRetry } from './lazyWithRetry';

describe('lazyWithRetry', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    vi.restoreAllMocks();

    // Mock window & sessionStorage for Node vitest environment
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
      location: {
        reload: vi.fn(),
      },
      caches: {
        keys: vi.fn().mockResolvedValue(['cache-1']),
        delete: vi.fn().mockResolvedValue(true),
      },
    };
  });

  it('creates a lazy component without throwing', () => {
    const mockComponent = () => null;
    const loader = vi.fn().mockResolvedValue({ default: mockComponent });
    const LazyComponent = lazyWithRetry(loader, 'TestComponent');
    expect(LazyComponent).toBeDefined();
  });

  it('loads a successful component import without errors', async () => {
    const mockComponent = () => null;
    const loader = vi.fn().mockResolvedValue({ default: mockComponent });

    const result = await loadWithRetry(loader, 'SuccessComponent');
    expect(result.default).toBe(mockComponent);
  });

  it('sets retry flag and initiates reload on chunk load error', async () => {
    const reloadMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.window as any).location.reload = reloadMock;

    const chunkError = new TypeError('Failed to fetch dynamically imported module: /assets/test.js');
    const loader = vi.fn().mockRejectedValue(chunkError);

    void loadWithRetry(loader, 'FailedComponent');

    // Give microtasks a turn to run
    await new Promise((r) => setTimeout(r, 10));

    expect(globalThis.window.sessionStorage.getItem('midmar_chunk_retry_FailedComponent')).toBe('true');
    expect(reloadMock).toHaveBeenCalled();
  });

  it('throws error if already retried to prevent infinite reload loop', async () => {
    globalThis.window.sessionStorage.setItem('midmar_chunk_retry_LoopComponent', 'true');

    const chunkError = new TypeError('Failed to fetch dynamically imported module: /assets/test.js');
    const loader = vi.fn().mockRejectedValue(chunkError);

    await expect(loadWithRetry(loader, 'LoopComponent')).rejects.toThrow(
      'Failed to fetch dynamically imported module'
    );
  });
});
