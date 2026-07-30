---
name: worktree-lint-runbook
description: "Runbook: Runbook: worktree-lint"
---

# Runbook: worktree-lint

> Find and clean up worktrees across your workspace.

## Prerequisites

- Node.js 18+ and `npx tsx` available

## Quick Start

```bash
# Scan repos in the current directory
npx tsx scripts/worktree-lint.mts

# Scan a specific workspace root
npx tsx scripts/worktree-lint.mts --root=~/projects
```

## Flags

| Flag | Description |
|------|------------|
| `--root=<path>` | Workspace root to scan (default: cwd) |
| `--json` | Machine-readable JSON output |

## What to look for

### Prunable worktrees
These are worktrees where the directory was deleted but git still tracks the admin entry.
Fix with:
```bash
cd /path/to/repo && git worktree prune
```

### Agent-created worktrees
AI coding agents (Claude Code, Cursor, Antigravity) create worktrees in:
- `.claude/worktrees/`
- `.cursor/worktrees/`
- `.gemini/worktrees/`

These can safely be removed after the agent session ends:
```bash
git worktree remove /path/to/.claude/worktrees/some-branch
```

### Linked worktrees on the same branch
Two worktrees can't safely share a branch. If you see this, one should be removed
or moved to a different branch.

## Suggested schedule

Run weekly or after heavy AI-assisted coding sessions to prevent disk bloat.
