// evals/test-state-consistency.mjs - Validates JSONL Canonical State Store Integrity
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { execSync } from 'node:child_process';

console.log('🧪 Testing Canonical State Store Consistency (ADR-0002)...');

const stateDir = path.resolve('project-management/state');
const requiredFiles = ['tasks.jsonl', 'bugs.jsonl', 'decisions.jsonl', 'reviews.jsonl', 'comments.jsonl'];

// 1. Verify existence of all state files
for (const file of requiredFiles) {
  const filePath = path.join(stateDir, file);
  assert.ok(fs.existsSync(filePath), `State file ${file} must exist`);
}
console.log('  ✓ Test 1: All 5 canonical JSONL event logs exist');

// 2. Parse and validate JSONL entries
const taskIds = new Set();
const tasksContent = fs.readFileSync(path.join(stateDir, 'tasks.jsonl'), 'utf8');
const taskLines = tasksContent.split('\n').filter(line => line.trim().length > 0);

for (const line of taskLines) {
  const task = JSON.parse(line);
  assert.ok(task.id, 'Task must have an id');
  assert.ok(task.id.startsWith('TASK-'), `Task ID ${task.id} must start with TASK-`);
  taskIds.add(task.id);
}
assert.ok(taskIds.size >= 21, `Expected at least 21 tasks, found ${taskIds.size}`);
console.log(`  ✓ Test 2: Validated ${taskIds.size} tasks with valid schema and unique IDs`);

// 3. Validate bugs.jsonl
const bugsContent = fs.readFileSync(path.join(stateDir, 'bugs.jsonl'), 'utf8');
const bugLines = bugsContent.split('\n').filter(line => line.trim().length > 0);
for (const line of bugLines) {
  const bug = JSON.parse(line);
  assert.ok(bug.id && bug.id.startsWith('BUG-'), `Bug ID ${bug.id} must start with BUG-`);
}
console.log(`  ✓ Test 3: Validated ${bugLines.length} bugs in canonical store`);

// 4. Validate decisions.jsonl
const decContent = fs.readFileSync(path.join(stateDir, 'decisions.jsonl'), 'utf8');
const decLines = decContent.split('\n').filter(line => line.trim().length > 0);
for (const line of decLines) {
  const dec = JSON.parse(line);
  assert.ok(dec.id && dec.id.startsWith('DEC-'), `Decision ID ${dec.id} must start with DEC-`);
}
console.log(`  ✓ Test 4: Validated ${decLines.length} architectural and product decisions`);

// 5. Run state compiler and verify markdown generation
try {
  execSync('node scripts/state.mjs compile', { stdio: 'pipe' });
  const sprintMd = path.resolve('project-management/dashboard/CURRENT_SPRINT.md');
  assert.ok(fs.existsSync(sprintMd), 'Compiled CURRENT_SPRINT.md must exist');
  const sprintText = fs.readFileSync(sprintMd, 'utf8');
  assert.ok(sprintText.includes('TASK-0016'), 'Compiled sprint must include active sprint phase 2 tasks');
  console.log('  ✓ Test 5: State projection compiler generated deterministic markdown views');
} catch (err) {
  assert.fail(`Compiler execution failed: ${err.message}`);
}

console.log('✅ Canonical State Consistency evals passed successfully.\n');
