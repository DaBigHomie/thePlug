# Forensic Review Swarm — Runbook

> Credit: DaBigHomie / thePlug

## When to Run

- End-of-session review across multiple quality dimensions
- Codebase audit that needs more coverage than one agent can hold
- Any review where you need parallel, isolated analysis

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Evidence collected | `evidence.json` exists |
| Session index built | `session-index.json` exists |
| At least one commit in scope | `git log` shows work |

---

## Steps

### 1. Collect evidence

```bash
npx tsx scripts/session-evidence-collect.mts --out ./review --json
```

### 2. Build worker packets

```bash
npx tsx scripts/forensic-dispatch.mts --out ./review --json
```

This emits 6 packets (`packets/W1..W6.json`), one per dimension.

### 3. Dispatch workers

Each packet is self-contained. Assign each to a separate agent or context:

| Worker | Dimension | Model Tier |
|--------|-----------|------------|
| W1 | Regression | Standard |
| W2 | Doc consistency | Light |
| W3 | Governance | Heavy |
| W4 | Scope creep | Standard |
| W5 | Script formatting | Light |
| W6 | Doc formatting | Light |

### 4. Collect findings

Each worker writes to `findings/raw/W*.json`.

### 5. Run cold verification

See [cold-verification runbook](cold-verification.md).

### 6. Join findings

```bash
npx tsx scripts/forensic-join.mts --out ./review --json
```

---

## Key Rules

- ✅ Each worker answers exactly ONE question
- ✅ Workers receive only their packet — no repo context
- ⛔ Workers must not report across dimensions
- ⛔ Do not skip verification — unverified findings are claims

---

## Cross-references

- [forensic-review-swarm skill](../skills/forensic-review-swarm.md)
- [cold-verification runbook](cold-verification.md)
