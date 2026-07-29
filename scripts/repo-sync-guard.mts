#!/usr/bin/env npx tsx
/**
 * repo-sync-guard.mts — Pre-flight git-hygiene + regression-risk audit.
 *
 * Reports whether landing work would regress code: stale/dirty worktrees,
 * branches diverged from remote, unpushed/uncommitted/stashed work, open
 * PRs/issues, and DB migration drift. Cross-machine aware.
 *
 * Read-only by default. Never deploys, pushes, applies migrations, or
 * writes a tracked file.
 *
 * Usage:
 *   npx tsx repo-sync-guard.mts <repoDir>            # audit one repo (default: cwd)
 *   npx tsx repo-sync-guard.mts --root ~/projects     # audit every git repo under root
 *   npx tsx repo-sync-guard.mts <repoDir> --fetch     # refresh remote refs first
 *   npx tsx repo-sync-guard.mts <repoDir> --json      # machine-readable verdict
 *   npx tsx repo-sync-guard.mts <repoDir> --remediate  # safe cleanup only (worktree prune)
 *
 * Verdict: SYNCED | NEEDS_SYNC | HOLD
 *
 * Credit: DaBigHomie / thePlug
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { usage(); process.exit(0); }
const flags = new Set(argv.filter(a => a.startsWith('--')));
const doFetch = flags.has('--fetch');
const asJson = flags.has('--json');
const remediate = flags.has('--remediate');
const rootIdx = argv.indexOf('--root');
const positionals = argv.filter((a, i) => !a.startsWith('--') && i !== rootIdx + 1);

type Verdict = 'SYNCED' | 'NEEDS_SYNC' | 'HOLD';
interface BranchState { name: string; upstream: string | null; ahead: number; behind: number; gone: boolean; }
interface MigrationState { dir: string | null; count: number; latest: string | null; note: string; }
interface RepoReport {
  repo: string;
  path: string;
  isGitRepo: boolean;
  dirty: { staged: number; unstaged: number; untracked: number; files: string[] };
  stashes: number;
  branches: BranchState[];
  worktrees: { path: string; branch: string | null }[];
  prunableWorktrees: string[];
  prs: { number: number; title: string; headRefName: string; mergeStateStatus?: string }[] | null;
  issues: { number: number; title: string }[] | null;
  migrations: MigrationState;
  verdict: Verdict;
  reasons: string[];
}

function usage(): void {
  console.log(`repo-sync-guard.mts — Pre-flight git-hygiene audit.`);
  console.log(``);
  console.log(`Usage:`);
  console.log(`  npx tsx repo-sync-guard.mts [repoDir]           Audit a single repo (default: cwd)`);
  console.log(`  npx tsx repo-sync-guard.mts --root <dir>        Audit every git repo under <dir>`);
  console.log(``);
  console.log(`Flags:`);
  console.log(`  --fetch       Refresh remote refs first (git fetch --all --prune)`);
  console.log(`  --json        Machine-readable JSON output`);
  console.log(`  --remediate   Safe cleanup only (prune stale worktree entries)`);
  console.log(`  --help        Show this help`);
}

function git(dir: string, args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}
function tryGit(dir: string, args: string[]): string | null {
  try { return git(dir, args); } catch { return null; }
}
function hasCmd(cmd: string): boolean {
  try { execFileSync(cmd, ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

function auditRepo(dir: string): RepoReport {
  const repo = dir.split('/').filter(Boolean).pop() ?? dir;
  const report: RepoReport = {
    repo, path: dir, isGitRepo: false,
    dirty: { staged: 0, unstaged: 0, untracked: 0, files: [] },
    stashes: 0, branches: [], worktrees: [], prunableWorktrees: [],
    prs: null, issues: null,
    migrations: { dir: null, count: 0, latest: null, note: '' },
    verdict: 'SYNCED', reasons: [],
  };
  if (!existsSync(join(dir, '.git')) && tryGit(dir, ['rev-parse', '--is-inside-work-tree']) !== 'true') return report;
  report.isGitRepo = true;

  if (doFetch) tryGit(dir, ['fetch', '--all', '--prune']);

  // Dirty tree
  const porcelain = tryGit(dir, ['status', '--porcelain']) ?? '';
  for (const line of porcelain.split('\n').filter(Boolean)) {
    const x = line[0], y = line[1];
    if (x === '?' && y === '?') report.dirty.untracked++;
    else { if (x !== ' ' && x !== '?') report.dirty.staged++; if (y !== ' ' && y !== '?') report.dirty.unstaged++; }
    report.dirty.files.push(line.slice(3));
  }
  report.stashes = (tryGit(dir, ['stash', 'list']) ?? '').split('\n').filter(Boolean).length;

  // Branches vs upstream
  const fmt = '%(refname:short)%09%(upstream:short)%09%(upstream:track)';
  const refs = tryGit(dir, ['for-each-ref', `--format=${fmt}`, 'refs/heads']) ?? '';
  for (const line of refs.split('\n').filter(Boolean)) {
    const [name, upstream, track = ''] = line.split('\t');
    const ahead = /ahead (\d+)/.exec(track)?.[1];
    const behind = /behind (\d+)/.exec(track)?.[1];
    report.branches.push({
      name, upstream: upstream || null,
      ahead: ahead ? Number(ahead) : 0,
      behind: behind ? Number(behind) : 0,
      gone: /gone/.test(track),
    });
  }

  // Worktrees
  const wt = tryGit(dir, ['worktree', 'list', '--porcelain']) ?? '';
  let cur: { path: string; branch: string | null } | null = null;
  for (const line of wt.split('\n')) {
    if (line.startsWith('worktree ')) { cur = { path: line.slice(9), branch: null }; report.worktrees.push(cur); }
    else if (line.startsWith('branch ') && cur) cur.branch = line.slice(7).replace('refs/heads/', '');
  }
  const prune = tryGit(dir, ['worktree', 'prune', '--dry-run', '-v']) ?? '';
  report.prunableWorktrees = prune.split('\n').filter(Boolean);

  // Open PRs / issues (read-only; only if gh CLI present + authed)
  if (hasCmd('gh')) {
    try {
      const prs = execFileSync('gh', ['pr', 'list', '--state', 'open', '--json', 'number,title,headRefName,mergeStateStatus', '--limit', '50'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      report.prs = JSON.parse(prs);
    } catch { report.prs = null; }
    try {
      const issues = execFileSync('gh', ['issue', 'list', '--state', 'open', '--json', 'number,title', '--limit', '50'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      report.issues = JSON.parse(issues);
    } catch { report.issues = null; }
  }

  // Migration safety — checks for supabase/migrations/ or prisma/migrations/
  for (const migSubdir of ['supabase/migrations', 'prisma/migrations']) {
    const migDir = join(dir, migSubdir);
    if (existsSync(migDir)) {
      const files = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
      report.migrations.dir = migDir;
      report.migrations.count = files.length;
      report.migrations.latest = files.at(-1) ?? null;
      report.migrations.note = `${files.length} local migration(s) in ${migSubdir}. Verify applied state before landing.`;
      break;
    }
  }

  computeVerdict(report);
  return report;
}

function computeVerdict(r: RepoReport): void {
  const reasons: string[] = [];
  const unpushed = r.branches.filter(b => b.ahead > 0);
  const behind = r.branches.filter(b => b.behind > 0);
  const gone = r.branches.filter(b => b.gone);
  const dirtyTotal = r.dirty.staged + r.dirty.unstaged + r.dirty.untracked;

  if (dirtyTotal > 0 && unpushed.length > 0) reasons.push(`HOLD: ${dirtyTotal} dirty file(s) AND ${unpushed.length} branch(es) with unpushed commits — risk of losing local work.`);
  if (r.migrations.count > 0 && r.migrations.dir) reasons.push(`Review: ${r.migrations.count} local migration(s) — verify DB is migrated, not overwritten.`);
  if (unpushed.length) reasons.push(`unpushed: ${unpushed.map(b => `${b.name}(+${b.ahead})`).join(', ')}`);
  if (behind.length) reasons.push(`behind remote: ${behind.map(b => `${b.name}(-${b.behind})`).join(', ')}`);
  if (gone.length) reasons.push(`upstream gone: ${gone.map(b => b.name).join(', ')}`);
  if (dirtyTotal) reasons.push(`dirty tree: ${r.dirty.staged} staged / ${r.dirty.unstaged} unstaged / ${r.dirty.untracked} untracked`);
  if (r.stashes) reasons.push(`${r.stashes} stash(es) pending`);
  if (r.prunableWorktrees.length) reasons.push(`${r.prunableWorktrees.length} prunable worktree entr(ies)`);
  if (r.prs && r.prs.length) {
    const conflicting = r.prs.filter(pr => pr.mergeStateStatus === 'DIRTY' || pr.mergeStateStatus === 'CONFLICTING');
    if (conflicting.length) reasons.push(`HOLD: ${conflicting.length} open PR(s) have merge conflicts (${conflicting.map(p => '#' + p.number).join(', ')})`);
    else reasons.push(`${r.prs.length} open PR(s) — verify none regress on merge`);
  }

  const hardHold = reasons.some(x => x.startsWith('HOLD'));
  r.reasons = reasons;
  r.verdict = hardHold ? 'HOLD' : (unpushed.length || behind.length || dirtyTotal || gone.length || r.stashes) ? 'NEEDS_SYNC' : 'SYNCED';
}

function applySafeRemediation(r: RepoReport): string[] {
  const done: string[] = [];
  if (r.prunableWorktrees.length) { tryGit(r.path, ['worktree', 'prune']); done.push('pruned stale worktree admin entries'); }
  return done;
}

function printReport(r: RepoReport): void {
  const tag = r.verdict;
  console.log(`\n[${tag}] ${r.repo}  (${r.path})`);
  if (!r.isGitRepo) { console.log('  not a git repo — skipped'); return; }
  for (const reason of r.reasons) console.log(`  - ${reason}`);
  if (r.migrations.dir) console.log(`  - migrations: ${r.migrations.note}`);
  if (r.verdict !== 'SYNCED') {
    console.log('  next:');
    if (r.dirty.staged + r.dirty.unstaged + r.dirty.untracked > 0) console.log('    * review & commit/stash dirty files');
    if (r.branches.some(b => b.ahead > 0)) console.log('    * git push the unpushed branch(es)');
    if (r.branches.some(b => b.behind > 0)) console.log('    * git pull --rebase to take remote work');
    if (r.prunableWorktrees.length) console.log('    * git worktree prune  (or re-run with --remediate)');
  }
}

// ---- main ----
const targets: string[] = [];
if (rootIdx >= 0) {
  const root = argv[rootIdx + 1];
  if (!root) { console.error('--root requires a directory'); process.exit(2); }
  const expanded = root.startsWith('~') ? root.replace('~', homedir()) : root;
  for (const e of readdirSync(expanded, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      const p = join(expanded, e.name);
      try { if (statSync(p).isDirectory()) targets.push(p); } catch { /* skip */ }
    }
  }
} else {
  targets.push(...(positionals.length ? positionals : [process.cwd()]));
}

const reports = targets.map(auditRepo).filter(r => r.isGitRepo);
for (const r of reports) {
  if (remediate) { const done = applySafeRemediation(r); if (done.length) console.log(`[remediated] ${r.repo}: ${done.join('; ')}`); computeVerdict(r); }
  if (!asJson) printReport(r);
}
if (asJson) console.log(JSON.stringify(reports, null, 2));

const worst = reports.some(r => r.verdict === 'HOLD') ? 'HOLD' : reports.some(r => r.verdict === 'NEEDS_SYNC') ? 'NEEDS_SYNC' : 'SYNCED';
if (!asJson) console.log(`\noverall: ${worst}  (${reports.length} repo${reports.length === 1 ? '' : 's'} audited)`);
process.exit(worst === 'HOLD' ? 2 : 0);
