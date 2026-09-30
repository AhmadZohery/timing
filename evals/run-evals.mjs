// evals/run-evals.mjs - Master Agent OS V2 Evaluation Suite Runner
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const evalSuites = [
  { name: 'Dynamic Agent Routing Policy', script: 'evals/test-routing.mjs' },
  { name: 'Decision Rights & Veto Matrix', script: 'evals/test-permission-guards.mjs' },
  { name: 'Opportunity Development Pack Boundary', script: 'evals/test-opportunity-boundary.mjs' },
  { name: 'Canonical State Consistency (ADR-0002)', script: 'evals/test-state-consistency.mjs' }
];

console.log('================================================================');
console.log('🚀 MIDMAR AGENT OS V2 - AUTOMATED EVALUATION SUITE');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const suite of evalSuites) {
  const start = Date.now();
  const res = spawnSync('node', [suite.script], { encoding: 'utf8', stdio: 'pipe' });
  const duration = Date.now() - start;

  if (res.status === 0) {
    totalPassed++;
    results.push({ name: suite.name, status: 'PASSED', duration: `${duration}ms` });
    process.stdout.write(res.stdout);
  } else {
    totalFailed++;
    results.push({ name: suite.name, status: 'FAILED', duration: `${duration}ms`, error: res.stderr || res.stdout });
    process.stderr.write(res.stderr || res.stdout);
  }
}

console.log('================================================================');
console.log('📊 EVALUATION SUMMARY SCORECARD');
console.log('================================================================');
console.table(results);
console.log(`Total Suites: ${evalSuites.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

if (totalFailed > 0) {
  console.error('\n❌ AGENT OS EVALUATION SUITE FAILED!');
  process.exit(1);
} else {
  console.log('\n🌟 ALL AGENT OS EVALUATION GATES PASSED CLEANLY (Zero Defects).');
  process.exit(0);
}
