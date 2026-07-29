---
name: branch-hygiene
description: >
  9-class branch classifier. Read-only: classifies every local branch as
  MERGED | SQUASH_MERGED | SQUASH_REUSED | CHURN | BOT | ACTIVE | GONE | MISMATCH | HOLD.
  Squash-merge aware via opt-in GitHub PR lookup.
---

# Branch Hygiene — 9-Class Branch Classifier

> Scope: any git repo · Runtime: `npx tsx` · Credit: DaBigHomie / thePlug

## The 9 classes

| Class | Meaning | Safe to delete? |
|-------|---------|----------------|
| MERGED | Ancestor of origin/main | Yes |
| SQUASH_MERGED | Tip SHA matches a merged PR's headRefOid | Yes |
| SQUASH_REUSED | Merged PR exists but tip differs (post-merge commits) | No — review first |
| CHURN | No commits in 30+ days | Usually yes |
| BOT | Created by Claude/Copilot/Dependabot/Renovate | Usually yes |
| ACTIVE | Currently checked out or recently active | No |
| GONE | Upstream branch was pruned from remote | Review — may be leftover |
| MISMATCH | Local and remote SHA differ | Investigate |
| HOLD | Unable to classify safely | Do not touch |

## Usage

```bash
# classify all branches in the current repo
npx tsx branch-hygiene.mts

# target a specific repo
npx tsx branch-hygiene.mts --repo=/path/to/repo

# JSON output for scripting
npx tsx branch-hygiene.mts --json

# enable squash-merge detection (requires `gh` CLI)
npx tsx branch-hygiene.mts --with-pr-check
```

## Important notes

- This script is **read-only** — it never deletes branches
- `--with-pr-check` makes exactly ONE batched `gh pr list` call
- Offline-graceful: if `gh` is unavailable, squash detection is skipped silently
- `SQUASH_REUSED` branches are deliberately excluded from the "auto-deletable" count
