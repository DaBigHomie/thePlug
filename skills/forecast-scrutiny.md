---
name: forecast-scrutiny
description: >
  Pre-action forecasting + adversarial scrutiny for any risky operation.
  Forecasts blast radius and then scrutinizes the plan adversarially.
  Use before: running sync/deploy/migration scripts, pushing, git rm,
  modifying multiple repos, or touching production.
---

# forecast-scrutiny

Two adversarial passes before a risky action. The goal is to be wrong on paper,
not in production.

**Golden rule: READ the actual code/command. Never forecast from the name.**
A script called `sync` may copy from a source you don't expect; `deploy` may not
distribute what you think. Open it and trace it.

---

## Phase 1 — FORECAST (blast radius)

Trace the real behavior and fill this in:

```
BLAST_RADIUS = {
  reads_from:   [exact source paths/dirs/tables],
  writes_to:    [exact target paths/repos/tables],
  git_ops:      [none | commit | push | branch | worktree | reset],
  db_ops:       [none | select | insert | update | DDL],
  repos_touched:[list every repo/dir written],
  external:     [secrets, network, CI, webhooks, deploys, $ cost],
  reversible:   [yes/no + how to undo each effect],
  idempotent:   [re-run safe? backups taken?],
}
```

Hard checks (answer from the code, not assumed):
- **Source identity** — what does it actually read FROM?
- **Path/machine** — hardcoded paths? Do they match THIS machine?
- **Git scope** — does it push? touch branches/worktrees?
- **Production** — does it write a live DB / deploy?

## Phase 2 — SCRUTINY (adversarial)

Try to make the plan fail. Assume the forecast is optimistic.

- **name != behavior**: does the tool do what its name implies?
- **wrong source/target**: could it copy the wrong direction?
- **hidden defaults**: constructor/env defaults that change scope silently
- **stale assumptions**: "X syncs via Y" — did you verify Y's source?
- **dirty-tree / partial**: what if the run aborts midway?
- **multi-repo / parallel-session**: would it sweep in work from another session?
- **secrets/creds**: writing creds to the right place?

## Phase 3 — VERDICT

```
VERDICT = SAFE | SAFE_WITH_GUARDS | HOLD
guards   = [dry-run first, scope to paths, backup, confirm target, single-repo test]
unknowns = [anything not verifiable from code -> escalate to the user]
```

- **SAFE** — Reversible, single-scope, no prod/push, verified source. Proceed.
- **SAFE_WITH_GUARDS** — Proceed only with the listed guards.
- **HOLD** — A hard check failed or an unknown is material. Get a human decision.
