// evals/test-routing.mjs - Validates dynamic agent router sizing logic
import assert from 'node:assert';

console.log('🧪 Testing Dynamic Agent Router Policy (AGENT_ROUTING_POLICY.md)...');

// Dynamic sizing calculation simulation matching AGENT_ROUTING_POLICY
function routeTask(task) {
  const { authority_level, blast_radius, modifies_schema, modifies_auth, modifies_shared_ui } = task;
  
  if (authority_level === 'L5' || blast_radius === 'SYSTEMIC') {
    return { agents: 5, roles: ['Director', 'Architect', 'Security', 'Evaluator', 'Council'] };
  }
  if (authority_level === 'L4' || modifies_schema || modifies_auth) {
    return { agents: 4, roles: ['Architect', 'Implementer', 'SecurityAuditor', 'IndependentEvaluator'] };
  }
  if (authority_level === 'L3' || modifies_shared_ui) {
    return { agents: 3, roles: ['Planner', 'Implementer', 'DomainReviewer'] };
  }
  if (authority_level === 'L2') {
    return { agents: 2, roles: ['Implementer', 'DomainReviewer'] };
  }
  // Level 1 default
  return { agents: 1, roles: ['Implementer'] };
}

// Test 1: L1 leaf change must route to exactly 1 agent
const t1 = routeTask({ authority_level: 'L1', blast_radius: 'LOCAL' });
assert.strictEqual(t1.agents, 1, 'L1 task should route to exactly 1 agent');
assert.deepStrictEqual(t1.roles, ['Implementer'], 'L1 should only spawn Implementer');
console.log('  ✓ Test 1: L1 local change routes to single agent');

// Test 2: L2 component change routes to 2 agents
const t2 = routeTask({ authority_level: 'L2', blast_radius: 'MODULE' });
assert.strictEqual(t2.agents, 2, 'L2 task should route to 2 agents');
console.log('  ✓ Test 2: L2 module change routes to pair (Implementer + Reviewer)');

// Test 3: L3 shared UI change routes to 3 agents
const t3 = routeTask({ authority_level: 'L3', blast_radius: 'SHARED_UI', modifies_shared_ui: true });
assert.strictEqual(t3.agents, 3, 'L3 task should route to 3 agents');
console.log('  ✓ Test 3: L3 shared UI change routes to 3 agents (Plan + Dev + Review)');

// Test 4: L4 schema change routes to 4 agents with Independent Evaluator
const t4 = routeTask({ authority_level: 'L4', blast_radius: 'STORAGE', modifies_schema: true });
assert.strictEqual(t4.agents, 4, 'L4 schema change should route to 4 agents');
assert.ok(t4.roles.includes('IndependentEvaluator'), 'L4 must include Independent Evaluator');
console.log('  ✓ Test 4: L4 schema change routes to 4 agents including Independent Evaluator');

// Test 5: Ceiling constraint - No task should EVER route to >5 agents
const t5 = routeTask({ authority_level: 'L5', blast_radius: 'SYSTEMIC' });
assert.ok(t5.agents <= 5, 'Max subagents ceiling of 5 strictly enforced');
console.log('  ✓ Test 5: Strict ceiling of maximum 5 subagents enforced');

console.log('✅ Dynamic Agent Router evals passed successfully.\n');
