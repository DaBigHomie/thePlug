---
name: cold-verification
description: >
  Adversarially verify and merge findings across multiple review dimensions
  using cold verification — the verifier never sees the original worker's reasoning.
---

# Cold Verification — Adversarial Finding Review

> Scope: any multi-agent review · Runtime: agent workflow · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
npx tsx scripts/forensic-join.mts --out ./review --json
```

---

## The Isolation Rule

| Given to Verifier | Withheld from Verifier |
|-------------------|------------------------|
| `claim` | Worker's reasoning |
| `evidence_path` | Worker's confidence |
| `git_ref` | Other workers' findings |
| Repo at that ref | Worker identity |

⚠️ A verifier shown the worker's reasoning **anchors** to it and confirms almost
everything. The verifier's job is **disproof**, not review.

---

## Verdict Schema

| Verdict | Meaning | Enters Report |
|---------|---------|---------------|
| `CONFIRMED` | Disproof attempted and failed | ✅ Yes |
| `REFUTED` | Claim broken by counter-evidence | ⛔ No — logged |
| `UNPROVEN` | Evidence insufficient either way | ⛔ No — flagged for follow-up |

---

## Join Rules

| Rule | Behavior |
|------|----------|
| Deduplication | Same path + same ref + overlapping claim → merge, keep highest severity |
| Contradiction | Two CONFIRMED findings asserting opposites → escalate both to `HIGH` |
| Cross-dimension | Finding outside its packet's dimension → reject |
| Ranking | `HIGH` → `MED` → `LOW`, then by dimension count |
| Calibration | Refute rate > 0.4 for any worker → miscalibration warning |

---

## Outputs

| File | Contents |
|------|----------|
| `findings/verified.json` | CONFIRMED only, deduped, ranked |
| `findings/rejected.json` | REFUTED + UNPROVEN with counter-evidence |
| `findings/calibration.json` | Per-worker refute rate, warnings |

---

## Gate

```
Every finding in findings/raw/ has exactly one verdict in verdicts.json.
Unverdicted findings block the join — they cannot be silently dropped.
```

---

## Cross-references

- [forensic-review-swarm](forensic-review-swarm.md) — packet dispatch
- [session-sunset](session-sunset.md) — full session closeout
