import { lazy, type ComponentType } from 'react';

/**
 * Executes a dynamic import with chunk error recovery logic.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName = 'component'
): Promise<{ default: T }> {
  const retryKey = `midmar_chunk_retry_${componentName}`;
  const alreadyRetried = typeof window !== 'undefined' && window.sessionStorage?.getItem(retryKey) === 'true';

  try {
    const module = await componentImport();
    // On success, clear the retry marker
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(retryKey);
    }
    return module;
  } catch (error: unknown) {
    const err = error as Error | undefined;
    const errorMessage = err?.message || String(error);

    const isChunkLoadError =
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('error loading dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      err?.name === 'ChunkLoadError';

    console.warn(`[Midmar lazyWithRetry] Chunk load failure for "${componentName}":`, errorMessage);

    if (isChunkLoadError && !alreadyRetried && typeof window !== 'undefined') {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(retryKey, 'true');
      }

      // Clear Service Worker caches if available to ensure we fetch the latest assets
      if ('caches' in window && window.caches) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        } catch {
          // Non-critical cache clear failure
        }
      }

      // Force reload from server
      if (window.location && typeof window.location.reload === 'function') {
        window.location.reload();
      }

      // Return an unresolving promise so React stays in Suspense state while the page reloads
      return new Promise<{ default: T }>(() => {});
    }

    // If already retried or not a chunk error, rethrow so ErrorBoundary handles it gracefully
    throw error;
  }
}

/**
 * Enhanced lazy loader with automatic recovery for chunk loading errors.
 * Solves the common SPA deployment issue where stale HTML requests outdated
 * hashed JS chunks that no longer exist on the server.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName = 'component'
) {
  return lazy(() => loadWithRetry(componentImport, componentName));
}
