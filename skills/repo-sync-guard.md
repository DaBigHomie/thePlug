---
name: repo-sync-guard
description: >
  Pre-flight git-hygiene + regression-risk audit for a repo BEFORE you commit,
  push, merge, or land work. Checks dirty/staged/untracked files, stashes,
  branches ahead/behind/diverged, stale worktrees, open PRs, and migration drift.
  Emits a verdict: SYNCED | NEEDS_SYNC | HOLD.
---

# Repo Sync Guard — Pre-Flight Hygiene Audit

> Scope: any git repo · Runtime: `npx tsx` · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

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

---

## What It Checks

| Check | What It Catches |
|-------|----------------|
| Dirty tree / stashes | Staged, unstaged, untracked counts; pending stashes |
| Branches vs remote | Ahead (unpushed), behind, diverged, or gone upstream |
| Worktrees | Lists them; flags prunable (already-deleted) entries |
| Open PRs / issues | Via `gh` CLI (read-only) when present and authed |
| Migration safety | Local migration files (Supabase/Prisma) vs applied state |

---

## Verdict

| Verdict | Meaning | Action |
|---------|---------|--------|
| `SYNCED` | Clean tree, no unpushed/behind/gone, no stash | ✅ Safe to proceed |
| `NEEDS_SYNC` | Unpushed/behind/diverged work, dirty tree, or stashes | ⚠️ Push/pull/commit first |
| `HOLD` | Dirty tree AND unpushed commits (work-loss risk) | ⛔ Stop; resolve first |

---

## Remediation

| Flag | Behavior |
|------|----------|
| `--remediate` | Safe, reversible cleanup only (`git worktree prune`) |
| No flag | Read-only report with recommended commands |

⛔ Never auto-commits or auto-pushes

---

## Cross-references

- [repo-sync-guard runbook](../runbooks/repo-sync-guard.md)
- [branch-hygiene](branch-hygiene.md) — branch classification
