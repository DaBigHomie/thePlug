#!/usr/bin/env npx tsx
/**
 * branch-hygiene.mts — 9-class branch classifier.
 *
 * Read-only: classifies local branches as
 * MERGED | SQUASH_MERGED | SQUASH_REUSED | CHURN | BOT | ACTIVE | GONE | MISMATCH | HOLD.
 *
 * Usage:
 *   npx tsx branch-hygiene.mts [--repo=/path/to/repo] [--json] [--with-pr-check]
 *
 * --with-pr-check: Opt-in GitHub lookup (one batched `gh pr list` call) so squash-merged
 * branches are classified correctly. Offline-graceful: if `gh` is unavailable, the
 * ancestry-only classifier runs unchanged.
 *
 * Credit: DaBigHomie / thePlug
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_PATH = process.argv.find(a => a.startsWith('--repo='))?.split('=')[1]
  ?? process.cwd();
const JSON_OUTPUT = process.argv.includes('--json');
const WITH_PR_CHECK = process.argv.includes('--with-pr-check');

interface BranchInfo {
  name: string;
  disposition: 'MERGED' | 'SQUASH_MERGED' | 'SQUASH_REUSED' | 'CHURN' | 'BOT' | 'ACTIVE' | 'GONE' | 'MISMATCH' | 'HOLD';
  reason: string;
  isRemote: boolean;
  upstream?: string;
  lastCommitAge?: number;
}

function git(args: string, cwd: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Batched squash-merge lookup: exactly ONE `gh pr list` call.
 * Offline-graceful: any failure returns an empty map.
 */
function mergedPrHeads(cwd: string): Map<string, string> {
  const map = new Map<string, string>();
  let raw = '';
  try {
    raw = execSync('gh pr list --state merged --json headRefName,headRefOid --limit 500', {
      cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    console.error('WARN: `gh pr list` unavailable — squash-merge detection skipped.');
    return map;
  }
  try {
    const prs = JSON.parse(raw) as { headRefName: string; headRefOid: string }[];
    for (const pr of prs) {
      if (!map.has(pr.headRefName)) map.set(pr.headRefName, pr.headRefOid);
    }
  } catch {
    console.error('WARN: failed to parse `gh pr list` output.');
  }
  return map;
}

function classify(cwd: string): BranchInfo[] {
  git('fetch origin --prune', cwd);

  const mergedHeads = WITH_PR_CHECK ? mergedPrHeads(cwd) : new Map<string, string>();

  const currentBranch = git('branch --show-current', cwd);
  const rawLocal = git('branch --no-color', cwd)
    .split('\n')
    .map(b => b.replace(/^\*?\s+/, '').trim())
    .filter(Boolean);

  const rawRemote = git('branch -r --no-color', cwd)
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('->'));

  const results: BranchInfo[] = [];

  for (const branch of rawLocal) {
    if (branch === currentBranch || branch === 'main' || branch === 'master') {
      results.push({ name: branch, disposition: 'ACTIVE', reason: 'current/default', isRemote: false });
      continue;
    }

    // Gone upstream
    const upstream = git(`config branch.${branch}.remote`, cwd);
    const upstreamRef = git(`config branch.${branch}.merge`, cwd);
    if (upstream && upstreamRef) {
      const remoteBranch = `${upstream}/${upstreamRef.replace('refs/heads/', '')}`;
      if (!rawRemote.includes(remoteBranch)) {
        results.push({ name: branch, disposition: 'GONE', reason: `upstream ${remoteBranch} pruned`, isRemote: false, upstream: remoteBranch });
        continue;
      }
    }

    // Merged check
    const isMerged = (() => {
      try {
        execSync(`git merge-base --is-ancestor ${branch} origin/main`, { cwd, stdio: 'pipe' });
        return true;
      } catch { return false; }
    })();

    if (isMerged) {
      results.push({ name: branch, disposition: 'MERGED', reason: 'ancestor of origin/main', isRemote: false });
      continue;
    }

    // Squash-merge check (opt-in)
    if (WITH_PR_CHECK) {
      const prHead = mergedHeads.get(branch);
      if (prHead) {
        const tip = git(`rev-parse ${branch}`, cwd);
        if (tip && tip === prHead) {
          results.push({ name: branch, disposition: 'SQUASH_MERGED', reason: 'tip matches merged PR head', isRemote: false });
        } else {
          results.push({ name: branch, disposition: 'SQUASH_REUSED', reason: `merged PR exists but tip differs — post-merge commits`, isRemote: false });
        }
        continue;
      }
    }

    // Bot branch detection
    const botPatterns = [/^claude\//, /^copilot\//, /^dependabot\//, /^renovate\//, /^github-actions\//];
    if (botPatterns.some(p => p.test(branch))) {
      results.push({ name: branch, disposition: 'BOT', reason: 'bot-generated branch', isRemote: false });
      continue;
    }

    // Churn: no commits in 30+ days
    const lastDate = git(`log -1 --format=%ci ${branch}`, cwd);
    if (lastDate) {
      const ageDays = (Date.now() - new Date(lastDate).getTime()) / 86400000;
      if (ageDays > 30) {
        results.push({ name: branch, disposition: 'CHURN', reason: `${Math.round(ageDays)}d stale`, isRemote: false, lastCommitAge: Math.round(ageDays) });
        continue;
      }
    }

    // SHA mismatch with upstream
    if (upstream) {
      const localSha = git(`rev-parse ${branch}`, cwd);
      const remoteSha = git(`rev-parse ${upstream}/${branch}`, cwd);
      if (localSha && remoteSha && localSha !== remoteSha) {
        results.push({ name: branch, disposition: 'MISMATCH', reason: `local != remote SHA`, isRemote: false });
        continue;
      }
    }

    results.push({ name: branch, disposition: 'ACTIVE', reason: 'active branch', isRemote: false });
  }

  return results;
}

function main(): void {
  const cwd = resolve(REPO_PATH);
  if (!existsSync(resolve(cwd, '.git'))) {
    console.error(`Not a git repo: ${cwd}`);
    process.exit(1);
  }

  const branches = classify(cwd);

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(branches, null, 2));
    return;
  }

  console.log(`\n== Branch Hygiene: ${cwd.split('/').pop()} ==\n`);

  const groups = new Map<string, BranchInfo[]>();
  for (const b of branches) {
    const arr = groups.get(b.disposition) ?? [];
    arr.push(b);
    groups.set(b.disposition, arr);
  }

  const order = ['MERGED', 'SQUASH_MERGED', 'CHURN', 'BOT', 'GONE', 'MISMATCH', 'SQUASH_REUSED', 'ACTIVE', 'HOLD'];
  for (const d of order) {
    const items = groups.get(d);
    if (!items?.length) continue;
    const icon = d === 'ACTIVE' ? '[PASS]' : d === 'HOLD' || d === 'SQUASH_REUSED' ? '[HOLD]' : '[DROP]';
    console.log(`${icon} ${d} (${items.length}):`);
    for (const b of items) {
      console.log(`   ${b.name} — ${b.reason}`);
    }
    console.log('');
  }

  const deletable = branches.filter(b => ['MERGED', 'CHURN', 'BOT', 'SQUASH_MERGED'].includes(b.disposition));
  console.log(`Summary: ${branches.length} branches, ${deletable.length} auto-deletable`);
}

main();
