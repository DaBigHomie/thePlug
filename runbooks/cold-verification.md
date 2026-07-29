# Cold Verification — Runbook

> Credit: DaBigHomie / thePlug

## When to Run

- After forensic review workers have produced raw findings
- Before accepting any multi-agent review results
- When you need adversarial validation of claims

---

## The Core Principle

A verifier shown the original reasoning **anchors to it** and confirms everything.
The verifier's job is **disproof**, not review — it succeeds by breaking the claim.

---

## Steps

### 1. For each finding, provide the verifier ONLY:

| Provided | Withheld |
|----------|----------|
| The claim | Worker's reasoning |
| The evidence path | Worker's confidence |
| The git ref | Other workers' findings |
| Access to the repo at that ref | Worker identity |

### 2. Verifier attempts disproof

The verifier tries to BREAK the claim, not confirm it.

### 3. Record verdict

| Verdict | Meaning |
|---------|---------|
| `CONFIRMED` | Disproof attempted and failed |
| `REFUTED` | Claim broken by counter-evidence |
| `UNPROVEN` | Evidence insufficient either way |

### 4. Join findings

```bash
npx tsx scripts/forensic-join.mts --out ./review --json
```

### 5. Check calibration

If any worker has a refute rate > 40%, that worker's packet is
miscalibrated — fix the packet, not the verifier.

---

## Rules

- ✅ REFUTED findings are retained, never deleted
- ✅ Contradictions escalate both findings to `HIGH`
- ⛔ Never pass unverdicted findings through the join
- ⛔ Never show the verifier the original worker's reasoning

---

## Cross-references

- [cold-verification skill](../skills/cold-verification.md)
- [forensic-review-swarm runbook](forensic-review-swarm.md)
