---
name: worktree-lint
description: >
  Scans a workspace root for all git repos and reports linked worktrees,
  prunable entries, and agent-created worktrees (Claude, Cursor, Gemini).
---

# worktree-lint

Flags linked worktrees vs real clones under your workspace root.
Especially useful when AI coding agents (Claude Code, Cursor, Antigravity)
create worktrees that accumulate over time.

## Usage

```bash
# scan current directory
npx tsx worktree-lint.mts

# scan a specific workspace root
npx tsx worktree-lint.mts --root=~/projects

# JSON output
npx tsx worktree-lint.mts --json
```

## What it reports

For each repo under the root:
- Total worktree count
- Linked (non-main) worktrees and their branch assignments
- Prunable worktrees (the directory was deleted but git still tracks it)
- Agent-created worktrees (`.claude/worktrees`, `.cursor/worktrees`, `.gemini/worktrees`)

## Why this matters

AI coding agents frequently create worktrees for parallel tasks. Over time these
accumulate and can:
- Bloat disk usage
- Cause branch conflicts (two worktrees on the same branch)
- Leave dangling admin entries after the worktree directory is removed

Run this periodically to keep your workspace clean.
