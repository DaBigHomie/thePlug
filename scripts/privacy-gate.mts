#!/usr/bin/env npx tsx
/**
 * privacy-gate.mts — Prevents private/internal content from leaking
 * into a public repository.
 *
 * Two layers:
 *   Layer 1 (built-in): Generic privacy patterns that are safe to hardcode
 *     because they describe FORMATS, not internal names. Catches API keys,
 *     JWT tokens, hardcoded home paths, Supabase URLs, private IPs, etc.
 *
 *   Layer 2 (config-driven): Project-specific banned terms loaded from
 *     .gate-patterns.txt (gitignored). Operator populates with internal
 *     system names, project IDs, agent IDs, etc.
 *
 * Usage:
 *   npx tsx scripts/privacy-gate.mts              # scan all tracked + staged
 *   npx tsx scripts/privacy-gate.mts --staged      # scan only staged files
 *   npx tsx scripts/privacy-gate.mts --json        # machine-readable output
 *
 * Exit codes:
 *   0 = PASS (no violations)
 *   1 = BLOCKED (violations found)
 *   2 = ERROR (script failure)
 *
 * Credit: DaBigHomie / thePlug
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

// ── Config ─────────────────────────────────────────────────────────────

const REPO = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const STAGED_ONLY = args.includes('--staged');
const JSON_OUTPUT = args.includes('--json');

/** File extensions to scan */
const SCAN_EXTENSIONS = new Set([
  '.md', '.mts', '.ts', '.js', '.mjs', '.cjs',
  '.json', '.yaml', '.yml', '.toml', '.sh', '.bash',
  '.env', '.txt', '.html', '.css', '.xml', '.csv',
]);

/** Paths to skip (relative to repo root) */
const SKIP_PATHS = [
  'node_modules', '.git', 'dist', '.next', '.turbo',
  'scripts/privacy-gate.mts', // don't scan yourself
];

// ── Layer 1: Built-In Privacy Patterns ─────────────────────────────────
// These describe FORMATS, not internal names. Safe to commit publicly.

interface PrivacyPattern {
  id: string;
  description: string;
  regex: RegExp;
  severity: 'BLOCK' | 'WARN';
}

const BUILTIN_PATTERNS: PrivacyPattern[] = [
  // ── Hardcoded paths ──
  {
    id: 'PATH-HOME',
    description: 'Hardcoded home directory path',
    regex: /\/Users\/[a-zA-Z][a-zA-Z0-9._-]+\//g,
    severity: 'BLOCK',
  },
  {
    id: 'PATH-WIN-HOME',
    description: 'Hardcoded Windows user path',
    regex: /C:\\Users\\[a-zA-Z][a-zA-Z0-9._-]+\\/gi,
    severity: 'BLOCK',
  },

  // ── API keys and tokens (format-based, no vendor names leaked) ──
  {
    id: 'KEY-OPENAI',
    description: 'OpenAI-format API key',
    regex: /sk-[a-zA-Z0-9]{20,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-GITHUB-PAT',
    description: 'GitHub personal access token',
    regex: /ghp_[a-zA-Z0-9]{36,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-GITHUB-OAUTH',
    description: 'GitHub OAuth token',
    regex: /gho_[a-zA-Z0-9]{36,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-SUPABASE',
    description: 'Supabase service/anon key pattern',
    regex: /sbp_[a-zA-Z0-9]{20,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-SLACK',
    description: 'Slack bot/user token',
    regex: /xox[bpras]-[a-zA-Z0-9-]{10,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-STRIPE',
    description: 'Stripe secret key',
    regex: /sk_live_[a-zA-Z0-9]{20,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-STRIPE-TEST',
    description: 'Stripe test key (still sensitive)',
    regex: /sk_test_[a-zA-Z0-9]{20,}/g,
    severity: 'WARN',
  },
  {
    id: 'KEY-AWS',
    description: 'AWS access key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-GROQ',
    description: 'Groq-format API key',
    regex: /gsk_[a-zA-Z0-9]{20,}/g,
    severity: 'BLOCK',
  },

  // ── Tokens and secrets ──
  {
    id: 'TOKEN-JWT',
    description: 'JWT token (base64 header.payload)',
    regex: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
    severity: 'BLOCK',
  },
  {
    id: 'SECRET-ENV-INLINE',
    description: 'Inline secret assignment in non-.env file',
    regex: /(?:SERVICE_ROLE_KEY|SECRET_KEY|API_SECRET|PRIVATE_KEY)\s*=\s*["']?[a-zA-Z0-9+/=_-]{20,}/g,
    severity: 'BLOCK',
  },

  // ── Infrastructure identifiers ──
  {
    id: 'INFRA-SUPABASE-URL',
    description: 'Supabase project URL (contains project ID)',
    regex: /https:\/\/[a-z]{10,}\.supabase\.co/g,
    severity: 'BLOCK',
  },
  {
    id: 'INFRA-SUPABASE-REF',
    description: 'Supabase project ref (20-char lowercase)',
    regex: /supabase[^a-zA-Z][a-z]{20,26}/gi,
    severity: 'WARN',
  },

  // ── SSH and private keys ──
  {
    id: 'KEY-SSH-PRIVATE',
    description: 'SSH private key header',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'BLOCK',
  },
  {
    id: 'KEY-PGP-PRIVATE',
    description: 'PGP private key header',
    regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    severity: 'BLOCK',
  },

  // ── Database connection strings ──
  {
    id: 'INFRA-DB-CONN',
    description: 'Database connection string with credentials',
    regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:]+:[^@]+@[^/\s]+/gi,
    severity: 'BLOCK',
  },
];

// ── Layer 2: Config-Driven Patterns ────────────────────────────────────

function loadConfigPatterns(): PrivacyPattern[] {
  const configPath = join(REPO, '.gate-patterns.txt');
  if (!existsSync(configPath)) return [];

  const lines = readFileSync(configPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  return lines.map((pattern, i) => ({
    id: `CUSTOM-${String(i + 1).padStart(3, '0')}`,
    description: `Custom banned pattern: ${pattern.slice(0, 40)}`,
    regex: new RegExp(pattern, 'gi'),
    severity: 'BLOCK' as const,
  }));
}

// ── File Discovery ─────────────────────────────────────────────────────

function getFilesToScan(): string[] {
  let raw: string;
  if (STAGED_ONLY) {
    raw = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
      cwd: REPO,
    });
  } else {
    raw = execSync('git ls-files', { encoding: 'utf8', cwd: REPO });
  }

  return raw
    .split('\n')
    .filter(f => f.trim())
    .filter(f => SCAN_EXTENSIONS.has(extname(f)))
    .filter(f => !SKIP_PATHS.some(skip => f.startsWith(skip) || f === skip));
}

// ── Scanning ───────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  patternId: string;
  description: string;
  severity: 'BLOCK' | 'WARN';
  match: string;
}

function scanFile(filePath: string, patterns: PrivacyPattern[]): Violation[] {
  const absPath = join(REPO, filePath);
  if (!existsSync(absPath)) return [];

  const content = readFileSync(absPath, 'utf8');

  // Skip files with gate_skip in frontmatter
  if (content.startsWith('---')) {
    const fmEnd = content.indexOf('---', 3);
    if (fmEnd !== -1) {
      const frontmatter = content.slice(0, fmEnd);
      if (frontmatter.includes('gate_skip:')) return [];
    }
  }

  const lines = content.split('\n');
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.regex.exec(line)) !== null) {
        violations.push({
          file: filePath,
          line: i + 1,
          patternId: pattern.id,
          description: pattern.description,
          severity: pattern.severity,
          match: m[0].length > 40 ? m[0].slice(0, 37) + '...' : m[0],
        });
      }
    }
  }

  return violations;
}

// ── Main ───────────────────────────────────────────────────────────────

function main(): void {
  const allPatterns = [...BUILTIN_PATTERNS, ...loadConfigPatterns()];
  const files = getFilesToScan();
  const allViolations: Violation[] = [];

  for (const file of files) {
    allViolations.push(...scanFile(file, allPatterns));
  }

  const blocks = allViolations.filter(v => v.severity === 'BLOCK');
  const warns = allViolations.filter(v => v.severity === 'WARN');
  const verdict = blocks.length > 0 ? 'BLOCKED' : 'PASS';

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      verdict,
      scanned: files.length,
      builtin_patterns: BUILTIN_PATTERNS.length,
      custom_patterns: allPatterns.length - BUILTIN_PATTERNS.length,
      blocks: blocks.length,
      warns: warns.length,
      violations: allViolations,
    }, null, 2));
    process.exit(blocks.length > 0 ? 1 : 0);
    return;
  }

  console.log('=== PRIVACY GATE — thePlug ===\n');
  console.log(`Scanned: ${files.length} files`);
  console.log(`Patterns: ${BUILTIN_PATTERNS.length} built-in + ${allPatterns.length - BUILTIN_PATTERNS.length} custom\n`);

  if (allViolations.length === 0) {
    console.log('[PASS] No privacy violations detected.\n');
    console.log('=== VERDICT: PASS ===');
    process.exit(0);
    return;
  }

  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    const existing = byFile.get(v.file) ?? [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, violations] of byFile) {
    console.log(`--- ${file} ---`);
    for (const v of violations) {
      const tag = v.severity === 'BLOCK' ? 'BLOCK' : 'WARN ';
      console.log(`  [${tag}] L${v.line} ${v.patternId}: ${v.description}`);
      console.log(`         match: "${v.match}"`);
    }
    console.log('');
  }

  console.log(`BLOCKS: ${blocks.length}  WARNS: ${warns.length}`);
  console.log(`\n=== VERDICT: ${verdict} ===`);
  process.exit(blocks.length > 0 ? 1 : 0);
}

main();
