---
name: repo-sync-guard
description: >
  Pre-flight git-hygiene + regression-risk audit for a repo BEFORE you commit,
  push, merge, or land work. Checks dirty/staged/untracked files, stashes,
  branches ahead/behind/diverged, stale worktrees, open PRs, and migration drift.
  Emits a verdict: SYNCED | NEEDS_SYNC | HOLD.
---

# repo-sync-guard

Read-only pre-flight that answers one question: **would landing work here regress code or lose work?**

## When to run

Before any commit / push / merge / branch land, before cleaning up worktrees or branches, and
when reconciling work across machines.

## How to run

```bash
# audit one repo (default: current dir)
npx tsx repo-sync-guard.mts <repoDir>

# refresh remote refs first, then audit
npx tsx repo-sync-guard.mts <repoDir> --fetch

# audit every git repo under a root
npx tsx repo-sync-guard.mts --root ~/projects

# machine-readable JSON verdict
npx tsx repo-sync-guard.mts <repoDir> --json
```

## What it checks

| Check | What it catches |
|-------|----------------|
| Dirty tree / stashes | Staged, unstaged, untracked counts; pending stashes |
| Branches vs remote | Ahead (unpushed), behind, diverged, or gone upstream |
| Worktrees | Lists them; flags prunable (already-deleted) entries |
| Open PRs / issues | Via `gh` CLI (read-only) when present and authed |
| Migration safety | Local migration files (Supabase/Prisma) vs applied state |

## Verdict

- **SYNCED** — Clean tree, no unpushed/behind/gone, no stash. Safe to proceed.
- **NEEDS_SYNC** — Unpushed/behind/diverged work, dirty tree, or stashes. Push/pull/commit first.
- **HOLD** — Dirty tree AND unpushed commits (work-loss risk). Stop; resolve first.

## Remediation

`--remediate` performs ONLY safe, reversible cleanup (`git worktree prune`) and
prints recommended commands for everything else. It never auto-commits or auto-pushes.
