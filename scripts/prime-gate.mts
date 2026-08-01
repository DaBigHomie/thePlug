#!/usr/bin/env npx tsx
/**
 * prime-gate.mts — Doc-standards validation gate for thePlug
 *
 * Validates:
 *   1. Branch safety (not on main)
 *   2. Doc-standards format (frontmatter, line limits, table columns)
 *   3. README link integrity
 *   4. Banned patterns (loaded from .gate-patterns.txt, never committed)
 *   5. Portable paths (no hardcoded home directories)
 *
 * Usage:
 *   npx tsx scripts/prime-gate.mts
 *   npx tsx scripts/prime-gate.mts --fix  # auto-fix where possible
 *
 * Credit: DaBigHomie / thePlug
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');

interface GateResult {
  gate: string;
  verdict: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  details: string[];
}

const results: GateResult[] = [];

// ── Gate 1: Branch Safety ──────────────────────────────────────────────

function checkBranch(): GateResult {
  const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: REPO }).trim();
  if (branch === 'main' || branch === 'master') {
    return { gate: 'Branch Safety', verdict: 'FAIL', details: [`On protected branch: ${branch}`] };
  }
  return { gate: 'Branch Safety', verdict: 'PASS', details: [`Branch: ${branch}`] };
}

// ── Gate 2: Doc-Standards Format ───────────────────────────────────────

function checkDocStandards(): GateResult {
  const dirs = ['skills', 'runbooks'];
  const details: string[] = [];
  let failures = 0;

  for (const dir of dirs) {
    const dirPath = join(REPO, dir);
    if (!existsSync(dirPath)) continue;

    for (const file of readdirSync(dirPath).filter(f => f.endsWith('.md'))) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relPath = `${dir}/${file}`;

      // Frontmatter check
      if (lines[0] !== '---') {
        details.push(`FAIL ${relPath}: missing YAML frontmatter`);
        failures++;
        continue;
      }

      // Line count check (≤300)
      if (lines.length > 300) {
        details.push(`FAIL ${relPath}: ${lines.length} lines (max 300)`);
        failures++;
      }

      // Table column check (≤7)
      const tableLines = lines.filter(l => l.startsWith('|'));
      for (const tl of tableLines) {
        const cols = tl.split('|').length - 2; // leading and trailing pipes
        if (cols > 7) {
          details.push(`FAIL ${relPath}: table has ${cols} columns (max 7)`);
          failures++;
          break;
        }
      }
    }
  }

  if (failures === 0) {
    details.unshift(`All docs pass format checks`);
    return { gate: 'Doc-Standards Format', verdict: 'PASS', details };
  }
  return { gate: 'Doc-Standards Format', verdict: 'FAIL', details };
}

// ── Gate 3: README Link Integrity ──────────────────────────────────────

function checkReadmeLinks(): GateResult {
  const readmePath = join(REPO, 'README.md');
  if (!existsSync(readmePath)) {
    return { gate: 'README Links', verdict: 'SKIP', details: ['No README.md found'] };
  }

  const content = readFileSync(readmePath, 'utf8');
  const linkPattern = /\[([^\]]+)\]\(([^http][^)]+)\)/g;
  const broken: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(content)) !== null) {
    const target = match[2];
    const resolved = join(REPO, target);
    if (!existsSync(resolved)) {
      broken.push(`BROKEN: [${match[1]}](${target})`);
    }
  }

  if (broken.length === 0) {
    return { gate: 'README Links', verdict: 'PASS', details: ['All internal links resolve'] };
  }
  return { gate: 'README Links', verdict: 'FAIL', details: broken };
}

// ── Gate 4: Banned Patterns ────────────────────────────────────────────

function checkBannedPatterns(): GateResult {
  const patternsFile = join(REPO, '.gate-patterns.txt');
  if (!existsSync(patternsFile)) {
    return {
      gate: 'Banned Patterns',
      verdict: 'SKIP',
      details: ['No .gate-patterns.txt found — create one with patterns to ban (one regex per line)'],
    };
  }

  const patterns = readFileSync(patternsFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  if (patterns.length === 0) {
    return { gate: 'Banned Patterns', verdict: 'SKIP', details: ['Pattern file is empty'] };
  }

  const scanDirs = ['skills', 'runbooks', 'references', 'scripts', 'docs'];
  const hits: string[] = [];

  for (const dir of scanDirs) {
    const dirPath = join(REPO, dir);
    if (!existsSync(dirPath)) continue;

    for (const file of readdirSync(dirPath, { recursive: true }) as string[]) {
      if (!file.endsWith('.md') && !file.endsWith('.mts')) continue;
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf8');

      // Skip files with gate_skip in frontmatter
      if (content.includes('gate_skip:')) continue;

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(content)) {
          hits.push(`HIT: ${dir}/${file} matches pattern: ${pattern}`);
        }
      }
    }
  }

  if (hits.length === 0) {
    return { gate: 'Banned Patterns', verdict: 'PASS', details: [`Scanned ${patterns.length} patterns — clean`] };
  }
  return { gate: 'Banned Patterns', verdict: 'FAIL', details: hits };
}

// ── Gate 5: Portable Paths ─────────────────────────────────────────────

function checkPortablePaths(): GateResult {
  const scanDirs = ['skills', 'runbooks', 'references', 'scripts', 'docs'];
  const hits: string[] = [];
  const homePattern = /\/Users\/[a-zA-Z]+\//g;

  for (const dir of scanDirs) {
    const dirPath = join(REPO, dir);
    if (!existsSync(dirPath)) continue;

    for (const file of readdirSync(dirPath, { recursive: true }) as string[]) {
      if (!file.endsWith('.md') && !file.endsWith('.mts')) continue;
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf8');

      // Skip files with gate_skip in frontmatter
      if (content.includes('gate_skip:')) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (homePattern.test(lines[i])) {
          hits.push(`HIT: ${dir}/${file}:${i + 1} — hardcoded home path`);
        }
        homePattern.lastIndex = 0;
      }
    }
  }

  if (hits.length === 0) {
    return { gate: 'Portable Paths', verdict: 'PASS', details: ['No hardcoded home paths found'] };
  }
  return { gate: 'Portable Paths', verdict: 'FAIL', details: hits };
}

// ── Run All Gates ──────────────────────────────────────────────────────

console.log('=== PRIME GATE — thePlug ===\n');

results.push(checkBranch());
results.push(checkDocStandards());
results.push(checkReadmeLinks());
results.push(checkBannedPatterns());
results.push(checkPortablePaths());

// ── Output ─────────────────────────────────────────────────────────────

let exitCode = 0;

for (const r of results) {
  const icon = r.verdict === 'PASS' ? 'PASS' : r.verdict === 'FAIL' ? 'FAIL' : r.verdict;
  console.log(`[${icon}] ${r.gate}`);
  for (const d of r.details) {
    console.log(`  ${d}`);
  }
  if (r.verdict === 'FAIL') exitCode = 1;
}

console.log(`\n=== VERDICT: ${exitCode === 0 ? 'PASS' : 'BLOCKED'} ===`);
process.exit(exitCode);
