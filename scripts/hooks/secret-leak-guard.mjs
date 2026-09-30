#!/usr/bin/env node
/**
 * Secret Leak Guard: Scans target files for raw API keys before saving.
 */
import fs from 'node:fs';

const targetFile = process.env.ANTIGRAVITY_TARGET_FILE || process.argv[2];

if (!targetFile || !fs.existsSync(targetFile)) {
  process.exit(0);
}

// Ignore test, backup, and node_modules files
if (targetFile.includes('node_modules') || targetFile.includes('.git')) {
  process.exit(0);
}

const content = fs.readFileSync(targetFile, 'utf-8');

const LEAK_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/,             // OpenAI / DeepSeek API keys
  /AIzaSy[a-zA-Z0-9_-]{33}/,         // Google Gemini / Firebase API keys
  /ghp_[a-zA-Z0-9]{36}/,             // GitHub Personal Access Token
  /timing_secret_password_2026/,     // Hardcoded default postgres password warning
];

for (const pattern of LEAK_PATTERNS) {
  if (pattern.test(content)) {
    // Check if it's in client-facing source code or client .env
    if (targetFile.includes('src/') || targetFile.endsWith('.env') || targetFile.endsWith('.env.local')) {
      console.warn(`⚠️ [SECRET LEAK WARNING] File "${targetFile}" appears to contain an active secret or default password!`);
      console.warn(`Secrets must be stored server-side or in secure local environment files without client prefixes.`);
    }
  }
}

process.exit(0);
