// evals/test-opportunity-boundary.mjs - Validates Opportunity Pack Schema & Gates
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('🧪 Testing Opportunity Development Pack Boundary (opportunity.schema.json)...');

const schemaPath = path.resolve('agent-os/schemas/opportunity.schema.json');
assert.ok(fs.existsSync(schemaPath), 'opportunity.schema.json must exist');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Lightweight validator against the JSON schema
function validateOpportunity(odp) {
  const errors = [];
  
  // Required fields check
  for (const field of schema.required) {
    if (odp[field] === undefined || odp[field] === null || odp[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // ID pattern check
  if (odp.id && !new RegExp(schema.properties.id.pattern).test(odp.id)) {
    errors.push(`Invalid ID pattern: ${odp.id}, must match ^OPP-[0-9]{4}$`);
  }

  // Evidence against check (must have minItems: 1)
  if (odp.evidence_against && (!Array.isArray(odp.evidence_against) || odp.evidence_against.length === 0)) {
    errors.push('Evidence Against is mandatory (minItems: 1) to prevent confirmation bias');
  }

  // Why now rationale check
  if (odp.why_now_rationale && odp.why_now_rationale.length < 20) {
    errors.push('Why Now rationale must be at least 20 characters');
  }

  // Impact scoring check
  if (odp.impact_scoring) {
    const { strategic_value, user_reach, implementation_effort, technical_risk, score } = odp.impact_scoring;
    if (!strategic_value || !user_reach || !implementation_effort || !technical_risk || score === undefined) {
      errors.push('Impact scoring must define strategic_value, user_reach, implementation_effort, technical_risk, and score');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Sample Valid ODP (OPP-0101)
const validOdp = {
  id: 'OPP-0101',
  title: 'Multi-Device Conflict-Free Delta Sync Engine',
  status: 'IN_SHAPING',
  horizon: 'H1_CORE',
  category: 'ARCHITECTURE',
  risk_tier: 'HIGH',
  authority_level: 'L4',
  problem_statement: 'Users modifying data across mobile and desktop experience sync overwrites without delta tracking.',
  target_persona: 'Practicing knowledge worker using multiple devices throughout the day',
  evidence_base: [
    'Issue reports of overwritten flashcards when syncing after offline commute.',
    'Analysis of current full-state dump in /api/sync/backup.'
  ],
  evidence_against: [
    'Adds tombstone tracking complexity and schema migration risks to Dexie v12.',
    'Risk of sync performance degradation if delta logs grow indefinitely.'
  ],
  alternatives_considered: [
    { name: 'Last-Write-Wins Full Snapshot', rationale: 'Simple', reason_rejected: 'Causes silent data loss' },
    { name: 'Pure Cloud CouchDB/CRDT', rationale: 'Zero-conflict', reason_rejected: 'Violates local-first sovereignty' }
  ],
  impact_scoring: {
    strategic_value: 5,
    user_reach: 4,
    implementation_effort: 4,
    technical_risk: 3,
    score: 2.85
  },
  why_now_rationale: 'Required before launching native mobile companion app to prevent data loss across devices.'
};

// Test 1: Valid ODP must pass validation
const resValid = validateOpportunity(validOdp);
assert.strictEqual(resValid.valid, true, `Valid ODP failed validation: ${resValid.errors.join(', ')}`);
console.log('  ✓ Test 1: Valid Opportunity Pack passes schema validation');

// Test 2: Missing "Why Now" gate fails
const badOdpNoWhyNow = { ...validOdp, why_now_rationale: '' };
const resNoWhyNow = validateOpportunity(badOdpNoWhyNow);
assert.strictEqual(resNoWhyNow.valid, false, 'ODP without Why Now rationale must fail');
console.log('  ✓ Test 2: "Why Now" gate successfully blocks unjustified proposals');

// Test 3: Missing "Evidence Against" fails
const badOdpNoEvidenceAgainst = { ...validOdp, evidence_against: [] };
const resNoContra = validateOpportunity(badOdpNoEvidenceAgainst);
assert.strictEqual(resNoContra.valid, false, 'ODP without Evidence Against must fail');
console.log('  ✓ Test 3: Mandatory Counter-Evidence rule prevents confirmation bias');

// Test 4: Invalid ID regex fails
const badOdpId = { ...validOdp, id: 'FEATURE-123' };
const resBadId = validateOpportunity(badOdpId);
assert.strictEqual(resBadId.valid, false, 'ODP with invalid ID pattern must fail');
console.log('  ✓ Test 4: Standardized OPP-XXXX naming pattern strictly enforced');

console.log('✅ Opportunity Pack Boundary evals passed successfully.\n');
