---
name: branch-hygiene-runbook
description: "Runbook: Runbook: branch-hygiene"
---

# Runbook: branch-hygiene

> Classify and clean up local branches with a 9-class system.

## Prerequisites

- Node.js 18+ and `npx tsx` available
- `gh` CLI (optional — for squash-merge detection)

## Quick Start

```bash
# Classify all branches in the current repo
npx tsx scripts/branch-hygiene.mts

# With squash-merge detection
npx tsx scripts/branch-hygiene.mts --with-pr-check

# JSON output for scripting
npx tsx scripts/branch-hygiene.mts --json
```

## Flags

| Flag | Description |
|------|------------|
| `--repo=<path>` | Target a specific repo (default: cwd) |
| `--json` | Output JSON for piping to other tools |
| `--with-pr-check` | Enable squash-merge detection via GitHub API |

## Understanding the 9 classes

```
[DROP] MERGED (3):
   old-feature — ancestor of origin/main
   bugfix-123 — ancestor of origin/main
   hotfix — ancestor of origin/main

[DROP] SQUASH_MERGED (1):
   feature-x — tip matches merged PR head

[DROP] CHURN (2):
   experiment — 45d stale
   wip-thing — 90d stale

[DROP] BOT (1):
   dependabot/npm_and_yarn/lodash-4.17.21 — bot-generated branch

[PASS] ACTIVE (2):
   main — current/default
   my-current-work — active branch

Summary: 9 branches, 7 auto-deletable
```

## Suggested workflow

1. **Audit**: `npx tsx branch-hygiene.mts --with-pr-check`
2. **Review**: Check the CHURN and GONE branches — are they really done?
3. **Delete safely**: `git branch -d <branch>` for MERGED branches
4. **Force delete carefully**: `git branch -D <branch>` for SQUASH_MERGED (safe) or CHURN (review first)
5. **Never auto-delete**: SQUASH_REUSED, HOLD, or MISMATCH branches

## Why squash-merge detection matters

When you squash-merge a PR on GitHub, the original branch tip is never an ancestor
of `main` (the squash creates a new SHA). Without `--with-pr-check`, these branches
fall through to BOT/CHURN/ACTIVE — making cleanup confusing.

With `--with-pr-check`, the script matches the local branch tip against the merged
PR's `headRefOid` and correctly classifies it as SQUASH_MERGED.
