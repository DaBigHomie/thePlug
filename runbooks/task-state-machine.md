---
name: task-state-machine-runbook
description: "Runbook: Task State Machine — Runbook"
---

# Task State Machine — Runbook

> Credit: DaBigHomie / thePlug

## When to Run

- After a session review is complete
- Before closing out tasks at the end of a session
- When task states need to reflect review findings

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Review findings exist | `findings/verified.json` present |
| All findings have verdicts | `verdicts.json` covers every raw finding |
| Tasks have required metadata | Repo alias, owner populated |

---

## Steps

### 1. Dry run

```bash
npx tsx scripts/task-flip.mts \
  --out ./review \
  --session $SESSION_ID \
  --json
```

Review the output before applying.

### 2. Apply

```bash
npx tsx scripts/task-flip.mts \
  --out ./review \
  --session $SESSION_ID \
  --apply
```

### 3. Verify

Check `flip-report.json`:
- `missing_metadata` should be `0`
- `blocked` array shows tasks held back by HIGH findings
- `flipped` array shows successful transitions

---

## State Transition Rules

| From | To | When |
|------|----|------|
| `in_progress` | `complete` | Deliverable exists, no HIGH findings |
| `in_progress` | `blocked` | HIGH finding references task files |
| `pending` | `pending` | Never auto-advance untouched tasks |
| any | `failed` | Operator explicitly marks |

---

## Key Rules

- ✅ Always dry-run first
- ✅ Stage 1 (metadata audit) must pass before Stage 2 (flip)
- ⛔ Never trigger on "when agents stop" — check artifacts
- ⛔ Never auto-advance `pending` tasks

---

## Cross-references

- [task-state-machine skill](../skills/task-state-machine.md)
- [session-sunset runbook](session-sunset.md)
