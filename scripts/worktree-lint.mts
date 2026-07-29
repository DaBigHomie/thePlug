#!/usr/bin/env npx tsx
/**
 * worktree-lint.mts — Flag linked worktrees vs real clones under a workspace root.
 *
 * Usage:
 *   npx tsx worktree-lint.mts [--json] [--root=/path/to/workspace]
 *
 * If --root is not provided, defaults to the current directory.
 *
 * Credit: DaBigHomie / thePlug
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.argv.find(a => a.startsWith('--root='))?.split('=')[1]
  ?? process.cwd();
const JSON_OUTPUT = process.argv.includes('--json');

interface WorktreeEntry {
  path: string;
  branch: string;
  sha: string;
  isMain: boolean;
  isLinked: boolean;
  parentRepo?: string;
  prunable: boolean;
}

interface RepoReport {
  repo: string;
  worktrees: WorktreeEntry[];
  warnings: string[];
}

function parseWorktreeList(cwd: string): WorktreeEntry[] {
  let raw: string;
  try {
    raw = execSync('git worktree list --porcelain', { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch { return []; }

  const entries: WorktreeEntry[] = [];
  let current: Partial<WorktreeEntry> = {};

  for (const line of raw.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) entries.push(current as WorktreeEntry);
      current = { path: line.slice(9), isMain: false, isLinked: false, prunable: false };
    } else if (line.startsWith('HEAD ')) {
      current.sha = line.slice(5);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice(7).replace('refs/heads/', '');
    } else if (line === 'bare') {
      current.isMain = true;
    } else if (line === 'prunable') {
      current.prunable = true;
    }
  }
  if (current.path) entries.push(current as WorktreeEntry);

  if (entries.length > 0) {
    entries[0].isMain = true;
    for (let i = 1; i < entries.length; i++) {
      entries[i].isLinked = true;
      entries[i].parentRepo = entries[0].path;
    }
  }

  return entries;
}

function scanRepos(): RepoReport[] {
  const reports: RepoReport[] = [];
  const resolvedRoot = resolve(ROOT);

  if (!existsSync(resolvedRoot)) {
    console.error(`Root not found: ${resolvedRoot}`);
    process.exit(1);
  }

  const entries = readdirSync(resolvedRoot).filter(e => {
    const p = join(resolvedRoot, e);
    return statSync(p).isDirectory() && existsSync(join(p, '.git'));
  });

  for (const dir of entries) {
    const repoPath = join(resolvedRoot, dir);
    const worktrees = parseWorktreeList(repoPath);
    const warnings: string[] = [];

    const linked = worktrees.filter(w => w.isLinked);
    if (linked.length > 0) warnings.push(`${linked.length} linked worktree(s)`);

    const prunable = worktrees.filter(w => w.prunable);
    if (prunable.length > 0) warnings.push(`${prunable.length} prunable worktree(s)`);

    // Detect agent-created worktrees (Claude, Cursor, etc.)
    const agentWorktrees = linked.filter(w =>
      w.path.includes('.claude/worktrees') ||
      w.path.includes('.cursor/worktrees') ||
      w.path.includes('.gemini/worktrees')
    );
    if (agentWorktrees.length > 0) warnings.push(`${agentWorktrees.length} agent-created worktree(s)`);

    reports.push({ repo: dir, worktrees, warnings });
  }

  return reports;
}

function main(): void {
  const reports = scanRepos();

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(reports, null, 2));
    return;
  }

  console.log(`\n== Worktree Lint: ${resolve(ROOT)} ==\n`);

  let totalWorktrees = 0;
  let totalLinked = 0;
  let totalPrunable = 0;

  for (const r of reports) {
    const linked = r.worktrees.filter(w => w.isLinked);
    totalWorktrees += r.worktrees.length;
    totalLinked += linked.length;
    totalPrunable += r.worktrees.filter(w => w.prunable).length;

    if (r.warnings.length === 0 && r.worktrees.length <= 1) continue;

    const icon = r.warnings.length > 0 ? '[WARN]' : '[PASS]';
    console.log(`${icon} ${r.repo} (${r.worktrees.length} worktree(s))`);
    for (const w of r.worktrees) {
      const tag = w.isMain ? '[main]' : w.isLinked ? '[linked]' : '';
      const prune = w.prunable ? ' [PRUNE]' : '';
      console.log(`   ${tag} ${w.branch ?? 'detached'} -> ${w.path}${prune}`);
    }
    if (r.warnings.length > 0) {
      console.log(`   warnings: ${r.warnings.join(', ')}`);
    }
    console.log('');
  }

  console.log(`Summary: ${reports.length} repos, ${totalWorktrees} worktrees (${totalLinked} linked, ${totalPrunable} prunable)`);
}

main();
