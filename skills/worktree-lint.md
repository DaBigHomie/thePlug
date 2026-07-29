---
name: worktree-lint
description: >
  Scans a workspace root for all git repos and reports linked worktrees,
  prunable entries, and agent-created worktrees (Claude, Cursor, Gemini).
---

# Worktree Lint — Agent Worktree Scanner

> Scope: any workspace root · Runtime: `npx tsx` · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# scan current directory
npx tsx worktree-lint.mts

# scan a specific workspace root
npx tsx worktree-lint.mts --root=~/projects

# JSON output
npx tsx worktree-lint.mts --json
```

---

## What It Reports

| Check | Description |
|-------|-------------|
| Total worktree count | Per-repo worktree inventory |
| Linked worktrees | Non-main worktrees and their branch assignments |
| Prunable entries | Directory deleted but git still tracks the worktree |
| Agent worktrees | Created by `.claude/`, `.cursor/`, `.gemini/` |

---

## Why This Matters

| Problem | Impact |
|---------|--------|
| Agent-created worktrees accumulate | Disk bloat |
| Two worktrees on same branch | Branch conflicts |
| Deleted directory, admin entry remains | Dangling references |

---

## Cross-references

- [worktree-lint runbook](../runbooks/worktree-lint.md)
- [repo-sync-guard](repo-sync-guard.md) — pre-flight hygiene
