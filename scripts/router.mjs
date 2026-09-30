#!/usr/bin/env node
/**
 * Dynamic Agent Router for Midmar LifeOS (Antigravity Agent OS)
 * Evaluates task scope, affected subsystems, and risk tier to recommend the smallest effective agent team.
 */

import process from 'node:process';

const RISK_TIERS = {
  1: {
    name: 'Level 1: Trivial / Cosmetic',
    description: 'Isolated UI copy, CSS utility adjustments, doc updates.',
    agentCount: 0,
    requiredReviews: ['Self-verification via linter/typecheck'],
    recommendedSubagents: []
  },
  2: {
    name: 'Level 2: Leaf Module Feature / Bugfix',
    description: 'Single station or modal feature, isolated utility helper.',
    agentCount: 0,
    requiredReviews: ['Self-verification + unit test'],
    recommendedSubagents: []
  },
  3: {
    name: 'Level 3: Shared UI / Component Integration',
    description: 'Shared navigation, Dynamic Island, Audio Capsule, or multi-component interaction.',
    agentCount: 1,
    requiredReviews: ['Domain Specialist Review (PM-03 or PM-04)'],
    recommendedSubagents: ['Domain Specialist (Research/Reviewer)']
  },
  4: {
    name: 'Level 4: Core State / Storage / Security / Sync',
    description: 'Dexie schema modification, auth flow, companion server routes, background audio engine.',
    agentCount: 2,
    requiredReviews: ['Technical Review (PM-04/PM-06)', 'Independent Peer Review (§19)'],
    recommendedSubagents: ['Specialist Subagent', 'Independent Evaluator (§19)']
  },
  5: {
    name: 'Level 5: Critical Architecture / Migration / Release',
    description: 'Database schema migration, production deployment, auth cryptography, major refactor.',
    agentCount: 3,
    requiredReviews: ['Human Project Owner Approval (Ahmad)', 'Independent Peer Review (§19)', 'QA/Security Release Sign-off'],
    recommendedSubagents: ['Domain Specialist', 'Security/QA Specialist', 'Independent Evaluator (§19)']
  }
};

function inferRiskTier(query, files = []) {
  const q = query.toLowerCase();
  const fileStr = files.join(' ').toLowerCase();

  if (
    q.includes('schema') ||
    q.includes('migration') ||
    q.includes('auth') ||
    q.includes('jwt') ||
    q.includes('security') ||
    q.includes('production release') ||
    fileStr.includes('db.ts') ||
    fileStr.includes('server/index.mjs')
  ) {
    return 4;
  }

  if (
    q.includes('navigation') ||
    q.includes('dynamic island') ||
    q.includes('audio capsule') ||
    q.includes('swipe') ||
    q.includes('shortcuts') ||
    fileStr.includes('swipeable') ||
    fileStr.includes('app.tsx')
  ) {
    return 3;
  }

  if (
    q.includes('station') ||
    q.includes('modal') ||
    q.includes('prayer') ||
    q.includes('card') ||
    q.includes('counter')
  ) {
    return 2;
  }

  return 1;
}

function routeTask(query, specifiedTier, files = []) {
  const tier = specifiedTier || inferRiskTier(query, files);
  const tierInfo = RISK_TIERS[tier] || RISK_TIERS[2];

  console.log('='.repeat(70));
  console.log(`DYNAMIC AGENT ROUTER (MIDMAR LIFEOS / ANTIGRAVITY)`);
  console.log('='.repeat(70));
  console.log(`Task:        "${query}"`);
  console.log(`Risk Tier:   ${tierInfo.name}`);
  console.log(`Scope:       ${tierInfo.description}`);
  console.log(`Subagents:   ${tierInfo.agentCount} recommended`);
  console.log(`Reviews:     ${tierInfo.requiredReviews.join(' | ')}`);
  
  if (tierInfo.recommendedSubagents.length > 0) {
    console.log(`\nRecommended Team:`);
    tierInfo.recommendedSubagents.forEach((agent, i) => {
      console.log(`  ${i + 1}. ${agent}`);
    });
  } else {
    console.log(`\nExecution Model: Direct single-agent execution with automated checks.`);
  }

  if (tier >= 4) {
    console.log(`\n[GOVERNANCE GATE]: Human Owner (Ahmad) sign-off required prior to production execution.`);
  }
  console.log('='.repeat(70));
}

// CLI handling
const args = process.argv.slice(2);
let tierArg = null;
const queryParts = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--level' || args[i] === '-l') {
    tierArg = parseInt(args[++i], 10);
  } else {
    queryParts.push(args[i]);
  }
}

const query = queryParts.join(' ') || 'Standard task evaluation';
routeTask(query, tierArg);
