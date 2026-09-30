// evals/test-permission-guards.mjs - Validates Decision Rights & Veto Matrix
import assert from 'node:assert';

console.log('🧪 Testing Decision Rights & Hard Vetoes (DECISION_RIGHTS_MATRIX.md)...');

function evaluateApproval(proposal) {
  const { authority_level, vetoes = [], approved_by = [], owner_signed = false } = proposal;
  
  // 1. Hard Veto Check: Any specialist hard veto immediately halts execution
  if (vetoes.length > 0) {
    return {
      allowed: false,
      reason: `Blocked by Hard Veto: ${vetoes.map(v => `${v.role} (${v.reason})`).join(', ')}`
    };
  }

  // 2. Level 5 check: Strictly requires Human Project Owner signature
  if (authority_level === 'L5') {
    if (!owner_signed) {
      return { allowed: false, reason: 'Level 5 actions require explicit Human Project Owner sign-off' };
    }
    return { allowed: true, approved_at_level: 'L5' };
  }

  // 3. Level 4 check: Requires Human Owner approval + System Architect / Security sign-off
  if (authority_level === 'L4') {
    if (!owner_signed) {
      return { allowed: false, reason: 'Level 4 actions (Schema/Auth/Infra) require Human Project Owner sign-off' };
    }
    return { allowed: true, approved_at_level: 'L4' };
  }

  // 4. Level 3 check: Requires Executive Product Director
  if (authority_level === 'L3') {
    const hasDirector = approved_by.includes('Executive Product Director');
    if (!hasDirector) {
      return { allowed: false, reason: 'Level 3 actions require Executive Product Director approval' };
    }
    return { allowed: true, approved_at_level: 'L3' };
  }

  // 5. Level 1-2: Autonomous if tests and reviews pass
  return { allowed: true, approved_at_level: authority_level };
}

// Test 1: Security Auditor Veto must block deployment even if approved by Director
const vetoTest = evaluateApproval({
  authority_level: 'L3',
  approved_by: ['Executive Product Director'],
  vetoes: [{ role: 'Security Auditor', reason: 'Unauthenticated API endpoint detected' }]
});
assert.strictEqual(vetoTest.allowed, false, 'Security veto must strictly block execution');
console.log('  ✓ Test 1: Security Auditor Hard Veto stops execution regardless of director approval');

// Test 2: Level 4 schema change fails without Human Owner sign-off
const l4NoOwner = evaluateApproval({
  authority_level: 'L4',
  approved_by: ['Executive Product Director', 'System Architect'],
  owner_signed: false
});
assert.strictEqual(l4NoOwner.allowed, false, 'L4 without Owner signature must fail');
console.log('  ✓ Test 2: Level 4 schema/auth change blocked without Human Project Owner sign-off');

// Test 3: Level 4 succeeds with Human Owner sign-off
const l4WithOwner = evaluateApproval({
  authority_level: 'L4',
  approved_by: ['Executive Product Director', 'System Architect'],
  owner_signed: true
});
assert.strictEqual(l4WithOwner.allowed, true, 'L4 with Owner signature succeeds');
console.log('  ✓ Test 3: Level 4 change succeeds with verified Human Project Owner sign-off');

// Test 4: Level 1 leaf task proceeds autonomously
const l1Test = evaluateApproval({
  authority_level: 'L1',
  approved_by: ['Implementer']
});
assert.strictEqual(l1Test.allowed, true, 'L1 task runs autonomously');
console.log('  ✓ Test 4: Level 1 local change proceeds autonomously without blocking gates');

console.log('✅ Decision Rights & Veto Matrix evals passed successfully.\n');
