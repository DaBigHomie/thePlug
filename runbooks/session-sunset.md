---
name: session-sunset-runbook
description: "Runbook: Session Sunset — Runbook"
---

# Session Sunset — Runbook

> Credit: DaBigHomie / thePlug

## When to Run

- End of a coding session before switching contexts
- Before handing off work to another agent or person
- When context is getting low and you need a clean closeout

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Node.js 18+ | `node --version` |
| `npx tsx` available | `npx tsx --version` |
| Git repo with commits | `git log -1` |
| `gh` CLI (optional) | `gh auth status` |

---

## Steps

### 1. Start the routine

```bash
npx tsx scripts/routine-run.mts \
  --repo <REPO_SLUG> \
  --session <SESSION_ID> \
  --start
```

### 2. Handle agent turns

When the script exits with code `3`:

```bash
# Read the brief
cat ./review/briefs/phase-N.md

# Produce the artifact, then resume
npx tsx scripts/routine-run.mts --resume
```

### 3. Check status anytime

```bash
npx tsx scripts/routine-run.mts --status --json
```

### 4. On failure

| Exit Code | Action |
|-----------|--------|
| `0` | Continue |
| `1` | Read `state.json` → `last_error`, fix, resume |
| `2` | Script error — do not blindly resume |
| `3` | Agent turn — read brief, produce artifact, resume |

---

## Phase Summary

| Phase | What It Does |
|-------|--------------|
| 0 — Preflight | Checks all deps exist |
| 1 — Evidence | Collects git + PR + command log |
| 2 — Index | Indexes every commit/PR |
| 3 — Contract | Agent writes session contract |
| 4–7 — Review | Dispatch → fan-out → verify → join |
| 8 — Feedback | Extracts failures → guardrail candidates |
| 9 — Handoff | Assembles handoff doc |
| 10 — Task flip | Transitions task states |
| 11–12 — Docs | Updates related docs, checks continuity |
| 13 — Board | Posts to project board |
| 14 — Teardown | Cleans up, gated by preconditions |

---

## Tips

- ✅ Always let the script drive — don't re-read the repo during agent turns
- ✅ The brief is self-contained by construction
- ⛔ Never skip the preflight phase
- ⛔ Never force teardown without passing all gates

---

## Cross-references

- [session-sunset skill](../skills/session-sunset.md)
- [forensic-review-swarm](../skills/forensic-review-swarm.md)
- [cold-verification](../skills/cold-verification.md)
