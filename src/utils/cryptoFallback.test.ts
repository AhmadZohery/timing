import { describe, it, expect, vi } from 'vitest';
import {
  pureJsSha256,
  secureSha256,
  generateSecureSalt,
  isWebCryptoAvailable,
} from './cryptoFallback';

describe('cryptoFallback - Pure JS SHA-256 & Fallback Engine', () => {
  it('correctly hashes empty string matching NIST FIPS 180-4 standard', () => {
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(pureJsSha256('')).toBe(expected);
  });

  it('correctly hashes standard test vector "abc"', () => {
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    expect(pureJsSha256('abc')).toBe(expected);
  });

  it('correctly hashes "The quick brown fox jumps over the lazy dog"', () => {
    const expected = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
    expect(pureJsSha256('The quick brown fox jumps over the lazy dog')).toBe(expected);
  });

  it('correctly hashes multi-byte UTF-8 Arabic text (e.g. مضمار)', async () => {
    const text = 'مضمار - Midmar LifeOS';
    const pureHash = pureJsSha256(text);
    expect(pureHash).toMatch(/^[0-9a-f]{64}$/);

    // If WebCrypto is available in test environment, both must match 100%
    if (typeof globalThis.crypto?.subtle?.digest === 'function') {
      const secureHash = await secureSha256(text);
      expect(pureHash).toBe(secureHash);
    }
  });

  it('produces identical output for typical password/salt patterns', async () => {
    const salt = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const secret = 'Khaled#123456';
    const payload = `${salt}:${secret}:${salt}`;

    const pureHash = pureJsSha256(payload);
    expect(pureHash).toHaveLength(64);

    const secureHash = await secureSha256(payload);
    expect(secureHash).toBe(pureHash);
  });

  it('secureSha256 falls back to pureJsSha256 when crypto.subtle is undefined (Facebook Messenger simulation)', async () => {
    const originalCrypto = globalThis.crypto;

    // Simulate Messenger / embedded WebView where crypto exists but subtle is undefined
    const mockCryptoWithoutSubtle = {
      ...originalCrypto,
      subtle: undefined,
    } as unknown as Crypto;

    vi.stubGlobal('crypto', mockCryptoWithoutSubtle);

    try {
      const message = 'test-in-messenger-webview';
      const hash = await secureSha256(message);
      expect(hash).toBe(pureJsSha256(message));
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
  });

  it('generateSecureSalt returns a 32-character hex string', () => {
    const salt1 = generateSecureSalt();
    const salt2 = generateSecureSalt();

    expect(salt1).toMatch(/^[0-9a-f]{32}$/);
    expect(salt2).toMatch(/^[0-9a-f]{32}$/);
    expect(salt1).not.toBe(salt2);
  });

  it('generateSecureSalt falls back gracefully when crypto.getRandomValues is undefined', () => {
    const originalCrypto = globalThis.crypto;

    vi.stubGlobal('crypto', undefined);

    try {
      const salt = generateSecureSalt();
      expect(salt).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
  });

  it('isWebCryptoAvailable detects whether crypto.subtle is supported', () => {
    const available = isWebCryptoAvailable();
    expect(typeof available).toBe('boolean');
  });
});
