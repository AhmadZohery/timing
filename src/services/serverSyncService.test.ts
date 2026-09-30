import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOrCreateDeviceId, ServerSyncService } from './serverSyncService';

// Ensure localStorage mock is available in Node test runner
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) {
      delete store[k];
    }
  },
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}

describe('ServerSyncService & Delta Sync (OPP-0101)', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('generates and persists a stable client device ID', () => {
    const deviceId1 = getOrCreateDeviceId();
    expect(deviceId1).toBeDefined();
    expect(deviceId1).toMatch(/^dev_[a-z0-9]+_\d+$/);

    // Calling again returns the exact same ID from localStorage
    const deviceId2 = getOrCreateDeviceId();
    expect(deviceId2).toBe(deviceId1);
  });

  it('initializes with default offline status when server is unreachable', () => {
    const service = new ServerSyncService();
    const status = service.getStatus();
    expect(status.pendingSync).toBe(false);
    expect(status.aiConfigured).toBe(false);
    service.destroy();
  });

  it('correctly handles delta sync when server is unreachable gracefully', async () => {
    const service = new ServerSyncService();
    // checkServerAvailability fails
    vi.spyOn(service, 'checkServerAvailability').mockResolvedValue(false);

    const result = await service.syncDelta();
    expect(result.success).toBe(false);
    expect(result.message).toContain('السيرفر غير متصل');
    service.destroy();
  });
});
