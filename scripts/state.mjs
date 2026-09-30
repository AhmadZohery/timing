#!/usr/bin/env node
/**
 * scripts/state.mjs — Zero-dependency Canonical State & Dashboard Compiler for Midmar LifeOS
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATE_DIR = path.resolve(ROOT_DIR, 'project-management', 'state');
const DASHBOARD_DIR = path.resolve(ROOT_DIR, 'project-management', 'dashboard');

// Ensure directories exist
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
if (!fs.existsSync(DASHBOARD_DIR)) fs.mkdirSync(DASHBOARD_DIR, { recursive: true });

function readJsonl(file) {
  const filePath = path.resolve(STATE_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

function writeJsonl(file, items) {
  const filePath = path.resolve(STATE_DIR, file);
  const content = items.map((item) => JSON.stringify(item)).join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf-8');
}

function appendJsonl(file, item) {
  const filePath = path.resolve(STATE_DIR, file);
  fs.appendFileSync(filePath, JSON.stringify(item) + '\n', 'utf-8');
}

export function compileDashboard() {
  const tasks = readJsonl('tasks.jsonl');
  const bugs = readJsonl('bugs.jsonl');
  const decisions = readJsonl('decisions.jsonl');
  const risks = readJsonl('risks.jsonl');

  const activeTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'READY');
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const criticalBugs = bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'RESOLVED');

  const content = `# 🚀 MIDMAR LIFEOS — CURRENT SPRINT & PROJECT STATUS
**Generated At:** ${new Date().toISOString()}  
**Canonical State:** \`project-management/state/\` (Source of Truth)  
**Health Status:** ${criticalBugs.length > 0 ? '🔴 ATTENTION_REQUIRED' : '🟢 HEALTHY'}

---

## 1. Active & Planned Tasks
| ID | Title | Status | Authority | Owner | Epic |
| :--- | :--- | :--- | :--- | :--- | :--- |
${
  tasks.length === 0
    ? '| _None_ | No tasks registered | - | - | - | - |\n'
    : tasks
        .map(
          (t) =>
            `| \`${t.id}\` | ${t.title} | **${t.status}** | Level ${t.authorityLevel || 2} | ${t.owner || 'Ahmad'} | ${t.epic || 'Core'} |`
        )
        .join('\n')
}

---

## 2. Active Defect Radar
| Bug ID | Title | Severity | Status | Affected Module |
| :--- | :--- | :--- | :--- | :--- |
${
  bugs.length === 0
    ? '| _None_ | No defects logged | - | - | - |\n'
    : bugs
        .map(
          (b) =>
            `| \`${b.id}\` | ${b.title} | **${b.severity}** | ${b.status} | \`${b.module || 'src/'}\` |`
        )
        .join('\n')
}

---

## 3. Active Risks & Mitigations
| Risk ID | Description | Impact | Mitigation | Status |
| :--- | :--- | :--- | :--- | :--- |
${
  risks.length === 0
    ? '| _None_ | No active risks registered | - | - | - |\n'
    : risks
        .map(
          (r) =>
            `| \`${r.id}\` | ${r.description} | ${r.impact} | ${r.mitigation} | **${r.status}** |`
        )
        .join('\n')
}

---

## 4. Key Architectural Decisions (ADRs)
| DEC ID | Title | Selected Option | Status | Date |
| :--- | :--- | :--- | :--- | :--- |
${
  decisions.length === 0
    ? '| _None_ | No ADRs registered | - | - | - |\n'
    : decisions
        .map(
          (d) =>
            `| \`${d.id}\` | ${d.title} | ${d.selectedOption} | **${d.status}** | ${d.date || '2026-09-29'} |`
        )
        .join('\n')
}
`;

  const sprintPath = path.resolve(DASHBOARD_DIR, 'CURRENT_SPRINT.md');
  fs.writeFileSync(sprintPath, content, 'utf-8');
  console.log(`✅ Compiled dashboard view: ${sprintPath}`);
}

// CLI handler
const cmd = process.argv[2];

if (cmd === 'compile') {
  compileDashboard();
} else if (cmd === 'status') {
  const tasks = readJsonl('tasks.jsonl');
  const bugs = readJsonl('bugs.jsonl');
  console.log(`📊 Canonical State Summary:`);
  console.log(`   Tasks: ${tasks.length} total (${tasks.filter(t => t.status === 'COMPLETED').length} done)`);
  console.log(`   Bugs:  ${bugs.length} total (${bugs.filter(b => b.status !== 'RESOLVED').length} open)`);
} else {
  compileDashboard();
}
