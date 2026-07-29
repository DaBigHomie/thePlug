# Runbook: forecast-scrutiny

> Pre-action risk assessment for any risky operation.

## When to use

Before running ANY of these:
- Deploy / migration scripts
- `git push` / `git push --force`
- `git rm` / `git reset`
- Multi-repo sync scripts
- Secret rotation
- Production database changes

## The 3-phase process

### Phase 1: FORECAST

Answer these questions by reading the actual code (not the filename):

1. **What does it read from?** (exact paths, tables, APIs)
2. **What does it write to?** (exact targets)
3. **What git operations?** (none / commit / push / reset)
4. **What DB operations?** (none / select / insert / DDL)
5. **Which repos are touched?**
6. **External effects?** (secrets, network, CI, webhooks, cost)
7. **Is it reversible?** (how to undo each effect)
8. **Is it idempotent?** (safe to re-run?)

### Phase 2: SCRUTINY

Try to make the plan fail. Ask:

- Does the tool do what its **name** implies? Or something different?
- Could it copy the **wrong direction**?
- Are there **hidden defaults** that change scope?
- What if the target has **uncommitted changes**?
- Would it sweep in work from **another session**?
- Are **secrets/creds** going to the right place?

### Phase 3: VERDICT

| Verdict | Meaning |
|---------|---------|
| **SAFE** | Reversible, single-scope, no prod, verified source |
| **SAFE_WITH_GUARDS** | Proceed only with specific guards (dry-run, explicit paths) |
| **HOLD** | A hard check failed. Get a human decision |

## Example

**Action:** "Run `sync-configs.ts` to roll the hook to all repos."

**FORECAST:**
- reads_from: `workflow-configs/` (verify it's the right source)
- writes_to: 9 repos' main checkout
- git_ops: none (verified by reading code)
- reversible: yes (backups + git)

**SCRUTINY:**
- name != behavior: "sync my work" is misleading — source is `workflow-configs/`, not your current work
- Hardcoded path that doesn't exist on this machine

**VERDICT:** HOLD — wrong tool for the goal
