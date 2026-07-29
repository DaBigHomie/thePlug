---
name: task-state-machine
description: >
  Verify and transition task states in a gated batch after a session review.
  Ensures every task has required metadata before state changes.
---

# Task State Machine — Gated Batch Transition

> Scope: any task tracking system · Runtime: `npx tsx` · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# Dry run — reports, changes nothing
npx tsx scripts/task-flip.mts --out ./review --session $SESSION_ID --json

# Apply changes
npx tsx scripts/task-flip.mts --out ./review --session $SESSION_ID --apply
```

---

## Two-Stage Gate

| Stage | Action | Blocks On |
|-------|--------|-----------|
| 1 — Metadata audit | Find tasks missing required fields (repo, owner) | Any task with unresolved metadata |
| 2 — Flip | Transition states in one batch | Stage 1 residue > 0 |

⚠️ Stage 2 never runs while stage 1 has residue.

---

## Trigger Condition (Observable, Not Vibes)

```
ALL of:
  - every review packet has a terminal finding (success or noted failure)
  - verified findings exist
  - every raw finding has a verdict
```

⛔ "when the agents stop" is not a trigger — a stalled worker and a finished
worker look identical from outside. Check **artifacts**, not process liveness.

---

## State Transitions

| From | To | When |
|------|----|------|
| `in_progress` | `complete` | Deliverable exists, no HIGH findings reference it |
| `in_progress` | `blocked` | A HIGH finding references the task's files |
| `pending` | `pending` | Untouched this session — never auto-advance |
| any | `failed` | Explicitly marked by operator only |

---

## Valid Values

| Field | Values |
|-------|--------|
| Status | `pending` · `in_progress` · `complete` · `failed` · `blocked` |
| Priority | `P0` · `P1` · `P2` · `P3` |

---

## Output

```json
{
  "ok": true,
  "missing_metadata": 0,
  "backfilled": ["task_..."],
  "flipped": [
    { "id": "task_...", "from": "in_progress", "to": "complete" }
  ],
  "blocked": [
    { "id": "task_...", "reason": "HIGH finding references src/..." }
  ]
}
```

---

## Cross-references

- [session-sunset](session-sunset.md) — full session closeout
- [session-feedback](session-feedback.md) — guardrail pipeline
