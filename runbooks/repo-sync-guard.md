---
name: repo-sync-guard-runbook
description: "Runbook: Runbook: repo-sync-guard"
---

# Runbook: repo-sync-guard

> Pre-flight audit before committing, pushing, or merging.

## Prerequisites

- Node.js 18+ and `npx tsx` available
- `gh` CLI (optional — for PR/issue checks)
- A git repo (or a directory of git repos)

## Quick Start

```bash
# Clone thePlug
git clone https://github.com/DaBigHomie/thePlug.git
cd thePlug

# Audit the current repo
npx tsx scripts/repo-sync-guard.mts

# Audit a specific repo
npx tsx scripts/repo-sync-guard.mts /path/to/my-repo --fetch

# Audit all repos under a workspace root
npx tsx scripts/repo-sync-guard.mts --root ~/projects
```

## Flags

| Flag | Description |
|------|------------|
| `--fetch` | Run `git fetch --all --prune` before auditing |
| `--json` | Output machine-readable JSON |
| `--remediate` | Safe cleanup only (prune stale worktrees) |
| `--help` | Show usage |

## Reading the output

The script emits one of three verdicts:

| Verdict | Meaning | What to do |
|---------|---------|------------|
| **SYNCED** | Everything is clean | Safe to proceed |
| **NEEDS_SYNC** | Unpushed/behind work, dirty tree, or stashes | Push/pull/commit first |
| **HOLD** | Dirty tree AND unpushed commits | Stop. Resolve before doing anything |

## Example output

```
[NEEDS_SYNC] my-project  (/home/user/projects/my-project)
  - unpushed: feature-branch(+3)
  - dirty tree: 0 staged / 2 unstaged / 1 untracked
  next:
    * review & commit/stash dirty files
    * git push the unpushed branch(es)

overall: NEEDS_SYNC  (1 repo audited)
```

## Integration ideas

- Run as a **pre-commit hook**: exit code 2 = HOLD (block the commit)
- Run in **CI**: audit before deploy to catch unpushed migrations
- Run across **multiple machines**: the audit compares local vs remote — run it on each machine

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "not a git repo" | Make sure you're pointing at a directory with `.git` |
| PRs show as `null` | Install and authenticate `gh` CLI |
| Migration warnings | Verify your DB state with your migration tool (Prisma/Supabase CLI) |
