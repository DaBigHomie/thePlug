#!/usr/bin/env npx tsx
/**
 * collect-agent-context.mts — Scan ALL AI coding tools for today's artifacts.
 *
 * Sources:
 *   1. Antigravity  (~/.gemini/antigravity/brain/)
 *   2. Cursor       ({repo}/.cursor/)
 *   3. Claude Code  ({repo}/.claude/)
 *   4. Copilot      ({repo}/.github/)
 *   5. VSCode       ({repo}/.vscode/)
 *   6. Git          (git log --since today)
 *   7. Checkpoints  ({repo}/docs/checkpoints/)
 *
 * Usage:
 *   npx tsx collect-agent-context.mts                      # all repos under --root, today
 *   npx tsx collect-agent-context.mts --root=~/projects     # specify workspace root
 *   npx tsx collect-agent-context.mts --date=2026-05-07     # specific date
 *   npx tsx collect-agent-context.mts --json                # JSON output
 *
 * Credit: DaBigHomie / thePlug
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

// Types
interface ConversationInfo { id: string; summary: string; artifact_count: number; steps: number; }
interface FileInfo { file: string; summary: string; }
interface CheckpointInfo { file: string; title: string; preview: string; }
interface CommitInfo { hash: string; author: string; subject: string; body: string; }
interface AgentContext {
  project_slug: string;
  date: string;
  antigravity: { conversations: ConversationInfo[]; knowledge_items: FileInfo[]; };
  cursor_data: { rules_modified: FileInfo[]; notepads: FileInfo[]; };
  claude_data: { settings_changed: boolean; worktrees: string[]; };
  copilot_data: { instructions_modified: FileInfo[]; agents: FileInfo[]; workflows: FileInfo[]; };
  vscode_data: { configs_modified: FileInfo[]; };
  git_data: { commits: CommitInfo[]; stashes: number; worktrees: string[]; };
  checkpoints: CheckpointInfo[];
}

// CLI args
const HOME = homedir();
const ROOT = process.argv.find(a => a.startsWith('--root='))?.split('=')[1]
  ?? process.cwd();
const JSON_OUT = process.argv.includes('--json');
let dateArg = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--date=')) dateArg = arg.slice('--date='.length);
}
const targetDate = dateArg || new Date().toISOString().slice(0, 10);
const midnight = new Date(targetDate + 'T00:00:00');

function isModifiedToday(filePath: string): boolean {
  try { return fs.statSync(filePath).mtime >= midnight; } catch { return false; }
}
function safeRead(p: string, maxLen = 500): string {
  try { return fs.readFileSync(p, 'utf8').slice(0, maxLen); } catch { return ''; }
}
function safeExec(cmd: string, cwd: string): string {
  try { return execSync(cmd, { cwd, timeout: 10000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); } catch { return ''; }
}
function listDir(dir: string): string[] {
  try { return fs.readdirSync(dir); } catch { return []; }
}

// Auto-discover repos under ROOT
function discoverRepos(): { slug: string; path: string }[] {
  const resolved = ROOT.startsWith('~') ? ROOT.replace('~', HOME) : ROOT;
  const repos: { slug: string; path: string }[] = [];
  for (const entry of listDir(resolved)) {
    const full = path.join(resolved, entry);
    try {
      if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, '.git'))) {
        repos.push({ slug: entry, path: full });
      }
    } catch { /* skip */ }
  }
  return repos;
}

// Scanners
function scanAntigravity(): { conversations: ConversationInfo[]; knowledge_items: FileInfo[] } {
  const brainDir = path.join(HOME, '.gemini', 'antigravity', 'brain');
  const knowledgeDir = path.join(HOME, '.gemini', 'antigravity', 'knowledge');
  const conversations: ConversationInfo[] = [];
  const knowledge_items: FileInfo[] = [];

  for (const convId of listDir(brainDir)) {
    const convDir = path.join(brainDir, convId);
    const overviewPath = path.join(convDir, '.system_generated', 'logs', 'overview.txt');
    if (!fs.existsSync(overviewPath) || !isModifiedToday(overviewPath)) continue;
    const lines = safeRead(overviewPath, 50000).split('\n').filter(l => l.trim().startsWith('{'));
    let summary = '';
    let stepCount = 0;
    for (const line of lines.slice(0, 100)) {
      try {
        const step = JSON.parse(line);
        stepCount++;
        if (step.type === 'USER_INPUT' && !summary) {
          const content = step.content || '';
          const match = content.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
          summary = (match?.[1] || content).slice(0, 200).replace(/\n/g, ' ').trim();
        }
      } catch { /* skip */ }
    }
    const artifactDir = path.join(convDir, 'artifacts');
    const artifacts = listDir(artifactDir).filter(f => f.endsWith('.md') && !f.endsWith('.metadata.json'));
    conversations.push({ id: convId, summary: summary || '(no summary)', artifact_count: artifacts.length, steps: stepCount });
  }

  for (const kiName of listDir(knowledgeDir)) {
    const metaPath = path.join(knowledgeDir, kiName, 'metadata.json');
    if (fs.existsSync(metaPath) && isModifiedToday(metaPath)) {
      let title = kiName;
      try { title = JSON.parse(safeRead(metaPath, 1000)).title || kiName; } catch { /* use dir name */ }
      knowledge_items.push({ file: kiName, summary: title });
    }
  }
  return { conversations, knowledge_items };
}

function scanCursor(repoPath: string): { rules_modified: FileInfo[]; notepads: FileInfo[] } {
  const cursorDir = path.join(repoPath, '.cursor');
  const rules_modified: FileInfo[] = [];
  const notepads: FileInfo[] = [];
  for (const f of listDir(path.join(cursorDir, 'rules'))) {
    const fp = path.join(cursorDir, 'rules', f);
    if (isModifiedToday(fp)) rules_modified.push({ file: f, summary: safeRead(fp, 200).split('\n')[0] || f });
  }
  for (const f of listDir(path.join(cursorDir, 'notepads'))) {
    const fp = path.join(cursorDir, 'notepads', f);
    if (isModifiedToday(fp)) notepads.push({ file: f, summary: safeRead(fp, 300).replace(/\n/g, ' ') });
  }
  for (const sub of ['chat', 'composer']) {
    for (const f of listDir(path.join(cursorDir, sub))) {
      const fp = path.join(cursorDir, sub, f);
      if (isModifiedToday(fp)) notepads.push({ file: `${sub}/${f}`, summary: `${sub} session (modified today)` });
    }
  }
  return { rules_modified, notepads };
}

function scanClaude(repoPath: string): { settings_changed: boolean; worktrees: string[] } {
  const claudeDir = path.join(repoPath, '.claude');
  const settings_changed = fs.existsSync(path.join(claudeDir, 'settings.local.json')) && isModifiedToday(path.join(claudeDir, 'settings.local.json'));
  const worktrees: string[] = [];
  for (const w of listDir(path.join(claudeDir, 'worktrees'))) worktrees.push(w);
  return { settings_changed, worktrees };
}

function scanCopilot(repoPath: string): { instructions_modified: FileInfo[]; agents: FileInfo[]; workflows: FileInfo[] } {
  const ghDir = path.join(repoPath, '.github');
  const instructions_modified: FileInfo[];
  const agents: FileInfo[];
  const workflows: FileInfo[];
  for (const f of listDir(path.join(ghDir, 'instructions'))) {
    const fp = path.join(ghDir, 'instructions', f);
    if (isModifiedToday(fp)) instructions_modified.push({ file: f, summary: safeRead(fp, 200).split('\n')[0] || f });
  }
  const rootInstr = path.join(ghDir, 'copilot-instructions.md');
  if (fs.existsSync(rootInstr) && isModifiedToday(rootInstr)) instructions_modified.push({ file: 'copilot-instructions.md', summary: safeRead(rootInstr, 200).split('\n')[0] });
  for (const f of listDir(path.join(ghDir, 'agents'))) {
    if (f.endsWith('.agent.md')) {
      const fp = path.join(ghDir, 'agents', f);
      agents.push({ file: f, summary: isModifiedToday(fp) ? safeRead(fp, 200).split('\n')[0] : `${f} (not modified today)` });
    }
  }
  for (const f of listDir(path.join(ghDir, 'workflows'))) {
    if (f.startsWith('copilot') && isModifiedToday(path.join(ghDir, 'workflows', f))) workflows.push({ file: f, summary: 'Modified today' });
  }
  return { instructions_modified, agents, workflows };
}

function scanVscode(repoPath: string): { configs_modified: FileInfo[] } {
  const vsDir = path.join(repoPath, '.vscode');
  const configs_modified: FileInfo[] = [];
  for (const f of listDir(vsDir)) {
    const fp = path.join(vsDir, f);
    if (isModifiedToday(fp)) configs_modified.push({ file: f, summary: `${f} modified today` });
  }
  return { configs_modified };
}

function scanGit(repoPath: string, date: string): { commits: CommitInfo[]; stashes: number; worktrees: string[] } {
  const commits: CommitInfo[] = [];
  const raw = safeExec(`git log --since="${date} 00:00" --until="${date} 23:59" --format="%H|||%ae|||%s|||%b" --all`, repoPath);
  for (const line of raw.split('\n').filter(Boolean)) {
    const parts = line.split('|||');
    if (parts.length >= 3) {
      commits.push({ hash: parts[0].slice(0, 8), author: parts[1] || '', subject: parts[2] || '', body: (parts[3] || '').slice(0, 300).trim() });
    }
  }
  const stashes = safeExec('git stash list', repoPath).split('\n').filter(Boolean).length;
  const worktrees = safeExec('git worktree list', repoPath).split('\n').filter(Boolean).map(l => l.split(' ')[0]);
  return { commits, stashes, worktrees };
}

function scanCheckpoints(repoPath: string): CheckpointInfo[] {
  const cpDir = path.join(repoPath, 'docs', 'checkpoints');
  const results: CheckpointInfo[] = [];
  for (const f of listDir(cpDir)) {
    if (!f.endsWith('.md') && !f.endsWith('.html')) continue;
    const fp = path.join(cpDir, f);
    if (isModifiedToday(fp)) {
      const content = safeRead(fp, 600);
      const title = content.split('\n').find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || f;
      results.push({ file: f, title, preview: content.slice(0, 500).replace(/\n/g, ' ') });
    }
  }
  return results;
}

// Main
async function main() {
  const repos = discoverRepos();
  const antigravity = scanAntigravity();
  const results: AgentContext[] = [];
  let totalCommits = 0, totalCheckpoints = 0, totalCursorRules = 0, totalAgents = 0;

  if (!JSON_OUT) {
    console.log(`\n=== Agent Context Collection — ${targetDate} ===\n`);
    console.log(`  Workspace: ${path.resolve(ROOT)}`);
    console.log(`  Repos discovered: ${repos.length}`);
    console.log(`  Antigravity: ${antigravity.conversations.length} conversations, ${antigravity.knowledge_items.length} KI updates`);
  }

  for (const repo of repos) {
    const cursor = scanCursor(repo.path);
    const claude = scanClaude(repo.path);
    const copilot = scanCopilot(repo.path);
    const vscode = scanVscode(repo.path);
    const gitData = scanGit(repo.path, targetDate);
    const checkpoints = scanCheckpoints(repo.path);

    results.push({
      project_slug: repo.slug, date: targetDate,
      antigravity, cursor_data: cursor, claude_data: claude,
      copilot_data: copilot, vscode_data: vscode, git_data: gitData, checkpoints,
    });

    totalCommits += gitData.commits.length;
    totalCheckpoints += checkpoints.length;
    totalCursorRules += cursor.rules_modified.length;
    totalAgents += copilot.agents.length;

    if (!JSON_OUT) {
      const activity = [
        gitData.commits.length ? `${gitData.commits.length} commits` : null,
        checkpoints.length ? `${checkpoints.length} checkpoints` : null,
        cursor.rules_modified.length ? `${cursor.rules_modified.length} cursor rules` : null,
        claude.settings_changed ? 'claude settings' : null,
        copilot.agents.length ? `${copilot.agents.length} agents` : null,
        vscode.configs_modified.length ? 'vscode changes' : null,
      ].filter(Boolean).join(', ');
      console.log(`  [${repo.slug}] ${activity || 'no activity'}`);
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n  --- Summary ---`);
    console.log(`  Total commits:     ${totalCommits}`);
    console.log(`  Total checkpoints: ${totalCheckpoints}`);
    console.log(`  Cursor rules:      ${totalCursorRules}`);
    console.log(`  Copilot agents:    ${totalAgents}`);
    console.log(`  Antigravity:       ${antigravity.conversations.length} conversations\n`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
