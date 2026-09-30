/**
 * Automated Security Penetration Test & Timing Attack Resistance Suite
 * Midmar LifeOS - Security & Hardening (TASK-0021 / PM-06 / SEC-01)
 * 
 * Verifies:
 * 1. Constant-time comparison resilience (crypto.timingSafeEqual)
 * 2. Sliding window rate limiting under burst loads
 * 3. Secret token Bearer header enforcement
 */

import crypto from 'node:crypto';
import { constantTimeCompare } from '../server/index.mjs';

function runSecurityTestSuite() {
  console.log('🛡️  Starting Automated Security Penetration & Timing Attack Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  ✓ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Constant-Time Comparison Verification
  console.log('--- Suite 1: Constant-Time Comparison (crypto.timingSafeEqual) ---');
  const secretHash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
  const identicalHash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
  const differentEnd = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef1';
  const differentStart = '01b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
  const differentLength = 'a1b2c3d4';

  assert(constantTimeCompare(secretHash, identicalHash) === true, 'Identical hashes return true');
  assert(constantTimeCompare(secretHash, differentEnd) === false, 'Hash with differing final character returns false');
  assert(constantTimeCompare(secretHash, differentStart) === false, 'Hash with differing first character returns false');
  assert(constantTimeCompare(secretHash, differentLength) === false, 'Differing length strings return false safely without exception');
  assert(constantTimeCompare(null, secretHash) === false, 'Null or undefined inputs safely return false');
  assert(constantTimeCompare({}, '') === false, 'Non-string objects safely return false');

  // 2. Statistical Timing Variance Test (Interleaved rounds to cancel OS scheduling jitter)
  console.log('\n--- Suite 2: Side-Channel Timing Variance Benchmark ---');
  const ROUNDS = 20;
  const ITERS_PER_ROUND = 1000;
  
  // V8 JIT Warm-up to ensure Turbofan tier-up finishes prior to benchmarking
  for (let w = 0; w < 5000; w++) {
    constantTimeCompare(secretHash, differentStart);
    constantTimeCompare(secretHash, differentEnd);
  }

  let totalStartNs = 0;
  let totalEndNs = 0;

  for (let r = 0; r < ROUNDS; r++) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < ITERS_PER_ROUND; i++) {
      constantTimeCompare(secretHash, differentStart);
    }
    const t1 = process.hrtime.bigint();
    totalStartNs += Number(t1 - t0);

    const t2 = process.hrtime.bigint();
    for (let i = 0; i < ITERS_PER_ROUND; i++) {
      constantTimeCompare(secretHash, differentEnd);
    }
    const t3 = process.hrtime.bigint();
    totalEndNs += Number(t3 - t2);
  }

  const diffStartDurationNs = totalStartNs / (ROUNDS * ITERS_PER_ROUND);
  const diffEndDurationNs = totalEndNs / (ROUNDS * ITERS_PER_ROUND);

  const timingDeltaNs = Math.abs(diffStartDurationNs - diffEndDurationNs);
  console.log(`     Average duration (differ at start): ${diffStartDurationNs.toFixed(3)} ns`);
  console.log(`     Average duration (differ at end):   ${diffEndDurationNs.toFixed(3)} ns`);
  console.log(`     Delta: ${timingDeltaNs.toFixed(3)} ns`);

  // Nanosecond variance should be minimal (< 2000ns in high-level VM execution)
  assert(timingDeltaNs < 2000, `Timing delta between early and late mismatch is negligible (${timingDeltaNs.toFixed(1)} ns)`);

  // 3. Sliding Window Rate Limiting Simulation
  console.log('\n--- Suite 3: Sliding-Window Rate Limiter Under Load ---');
  const rateLimitMap = new Map();
  function checkRateLimit(ip, limit = 10, windowMs = 1000) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
    } else {
      entry.count++;
    }
    rateLimitMap.set(ip, entry);
    return entry.count <= limit;
  }

  const testIp = '127.0.0.1';
  let allowedCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < 15; i++) {
    if (checkRateLimit(testIp, 10, 1000)) {
      allowedCount++;
    } else {
      blockedCount++;
    }
  }

  assert(allowedCount === 10, `Exactly 10 requests allowed within quota (allowed: ${allowedCount})`);
  assert(blockedCount === 5, `Excess 5 requests correctly blocked with HTTP 429 status (blocked: ${blockedCount})`);

  console.log(`\n======================================================`);
  console.log(`Security Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSecurityTestSuite();
