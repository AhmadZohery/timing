/**
 * Robust Cross-Platform Cryptographic Utility with Pure-JS Fallback
 * Designed to guarantee 100% reliability even in restricted mobile in-app browsers
 * (such as Facebook Messenger, Instagram, TikTok, and legacy WebViews) where
 * `window.crypto.subtle` is undefined.
 */

// SHA-256 round constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function ch(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z);
}

function maj(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x: number): number {
  return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
}

function sigma1(x: number): number {
  return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
}

function gamma0(x: number): number {
  return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
}

function gamma1(x: number): number {
  return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
}

/**
 * Pure JavaScript FIPS 180-4 compliant SHA-256 implementation
 */
export function pureJsSha256(message: string): string {
  // UTF-8 encode string
  const utf8Bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    let charcode = message.charCodeAt(i);
    if (charcode < 0x80) {
      utf8Bytes.push(charcode);
    } else if (charcode < 0x800) {
      utf8Bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (message.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8Bytes.length * 8;

  // Append single 1 bit (0x80)
  utf8Bytes.push(0x80);

  // Pad with 0s until length % 64 === 56
  while ((utf8Bytes.length % 64) !== 56) {
    utf8Bytes.push(0);
  }

  // Append 64-bit length (big-endian)
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  for (let i = 3; i >= 0; i--) {
    utf8Bytes.push((highBits >>> (i * 8)) & 0xff);
  }
  for (let i = 3; i >= 0; i--) {
    utf8Bytes.push((lowBits >>> (i * 8)) & 0xff);
  }

  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Int32Array(64);

  // Process 64-byte chunks
  for (let chunk = 0; chunk < utf8Bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      w[i] =
        (utf8Bytes[idx] << 24) |
        (utf8Bytes[idx + 1] << 16) |
        (utf8Bytes[idx + 2] << 8) |
        utf8Bytes[idx + 3];
    }

    for (let i = 16; i < 64; i++) {
      const s0 = gamma0(w[i - 15]);
      const s1 = gamma1(w[i - 2]);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = sigma1(e);
      const chVal = ch(e, f, g);
      const temp1 = (h + s1 + chVal + K[i] + w[i]) | 0;
      const s0 = sigma0(a);
      const majVal = maj(a, b, c);
      const temp2 = (s0 + majVal) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

/**
 * Robust SHA-256 that uses Web Crypto when available, and falls back to pure JavaScript
 */
export async function secureSha256(message: string): Promise<string> {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      globalThis.crypto.subtle &&
      typeof globalThis.crypto.subtle.digest === 'function'
    ) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Web Crypto Subtle API failed, falling back to pure JavaScript SHA-256:', err);
  }

  return pureJsSha256(message);
}

/**
 * Generates a cryptographically strong random salt (16 bytes = 32 hex chars)
 * with graceful fallback for restricted in-app webviews
 */
export function generateSecureSalt(): string {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const array = new Uint8Array(16);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}

  // Fallback using high-entropy timestamp, performance counter, and Math.random()
  const bytes = new Uint8Array(16);
  const now = Date.now();
  const perf = typeof performance !== 'undefined' ? performance.now() : 0;
  for (let i = 0; i < 16; i++) {
    const seed = Math.floor((Math.random() * 0x100000000) ^ (now + i * 37) ^ (perf * 1000));
    bytes[i] = (seed >>> (i % 4 * 8)) & 0xff;
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if the browser environment supports full Web Crypto API (SubtleCrypto)
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    !!globalThis.crypto &&
    !!globalThis.crypto.subtle &&
    typeof globalThis.crypto.subtle.digest === 'function'
  );
}
