#!/usr/bin/env node
/**
 * Pre-command safety guard: Intercepts dangerous/destructive commands on Windows & POSIX.
 */
const command = process.env.ANTIGRAVITY_COMMAND || process.argv.slice(2).join(' ');

if (!command) {
  process.exit(0);
}

const DANGEROUS_PATTERNS = [
  /git\s+reset\s+--hard/i,
  /git\s+clean\s+-[a-zA-Z]*f/i,
  /git\s+branch\s+-[a-zA-Z]*D\s+(main|master)/i,
  /rm\s+-rf\s+[\/\\]/i,
  /rmdir\s+\/s\s+\/q\s+[\/\\]/i,
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /TRUNCATE\s+TABLE/i,
  /DELETE\s+FROM\s+users/i,
];

for (const pattern of DANGEROUS_PATTERNS) {
  if (pattern.test(command)) {
    console.error(`🛑 [SECURITY BLOCK] The proposed command violates safety policy: "${command}"`);
    console.error(`Destructive actions require explicit authorization from Human Project Owner.`);
    process.exit(1);
  }
}

process.exit(0);
