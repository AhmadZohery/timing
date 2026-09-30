#!/usr/bin/env node
/**
 * مضمار | Midmar LifeOS - Pre-Deployment Unified Verification Gate
 * Runs all quality, security, type safety, test, and build checks before deploying to production.
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

const steps = [
  { name: '1. Canonical State Compile', cmd: 'node scripts/state.mjs compile' },
  { name: '2. Strict TypeScript Typecheck (tsc -b)', cmd: 'npx tsc -b' },
  { name: '3. Fast Linter (oxlint)', cmd: 'npm run lint' },
  { name: '4. Vitest Unit & Regression Tests', cmd: 'npm test' },
  { name: '5. Production Bundle Build (Vite)', cmd: 'npm run build' },
  { name: '6. Agent OS Evaluation Suite', cmd: 'node evals/run-evals.mjs' },
  { name: '7. Security Pen Test & Cryptographic Timing Gate', cmd: 'node evals/security-pen-test.mjs' },
];

console.log('================================================================');
console.log('🚀 MIDMAR LIFEOS - PRE-DEPLOYMENT VERIFICATION GATES');
console.log('================================================================\n');

let failed = false;

for (const step of steps) {
  process.stdout.write(`⏳ Running [${step.name}]... `);
  const startTime = Date.now();
  try {
    execSync(step.cmd, { stdio: 'pipe', encoding: 'utf-8' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PASSED (${duration}s)`);
  } catch (err) {
    console.log(`❌ FAILED`);
    console.error(`\nError in step: ${step.name}`);
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    failed = true;
    break;
  }
}

console.log('\n================================================================');
if (failed) {
  console.log('❌ DEPLOYMENT GATE FAILED: Resolve the issues above before pushing.');
  process.exit(1);
} else {
  console.log('🌟 ALL 7 GATES PASSED! Midmar LifeOS is 100% ready for production deployment.');
  console.log('================================================================\n');
  process.exit(0);
}
