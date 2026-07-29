---
name: forensic-review-swarm
description: >
  Build and dispatch a parallel review swarm for session or codebase review —
  multiple dimension-focused workers, each receiving a self-contained packet,
  so no worker re-reads the repo.
---

# Forensic Review Swarm — Parallel Dimension Workers

> Scope: any multi-agent review · Runtime: agent orchestration · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# 1. Collect evidence
npx tsx scripts/session-evidence-collect.mts --out ./review --json
# 2. Build and dispatch worker packets
npx tsx scripts/forensic-dispatch.mts --out ./review --json
```

---

## Why Swarm Instead of Inline Review

| Approach | Agent Tokens | Dimensions Covered |
|----------|-------------|--------------------|
| Inline review, all dimensions | 60k–120k, drops dimensions at low context | Unpredictable |
| Packet dispatch | ~8k per worker, ~2k orchestrator | All 6 guaranteed |

---

## The 6 Review Dimensions

| Worker | Dimension | Question |
|--------|-----------|----------|
| W1 | Regression | Which changes regressed behavior that worked before? |
| W2 | Doc consistency | Which docs now contradict the code or another doc? |
| W3 | Governance | Which changes violate repo rules or layer constraints? |
| W4 | Scope creep | Which changes fall outside the declared scope? |
| W5 | Script formatting | Which scripts violate formatting rules? |
| W6 | Doc formatting | Which markdown files violate format rules? |

---

## Packet Schema

```json
{
  "worker": "W1",
  "dimension": "regression",
  "scope": {
    "files": ["..."],
    "commits": ["..."]
  },
  "question": "single dimension question",
  "finding_schema": {
    "id": "",
    "dimension": "",
    "severity": "HIGH|MED|LOW",
    "claim": "",
    "evidence_path": "",
    "suggested_action": ""
  },
  "budget_tokens": 8000
}
```

---

## Failure Policy

| Condition | Action |
|-----------|--------|
| One worker fails | Skip and note; record unrun dimension |
| Packet build fails | Halt — downstream join has no valid input |
| Worker reports outside its dimension | Reject at join, flag as miscalibrated |

---

## Cross-references

- [cold-verification](cold-verification.md) — verification + join
- [session-sunset](session-sunset.md) — full session closeout
