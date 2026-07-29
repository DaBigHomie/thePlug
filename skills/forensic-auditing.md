---
name: forensic-auditing
description: >
  Deep-dive auditing rules to evaluate codebase alignment, forecast execution safety,
  and prevent temporal or semantic drift. Use when auditing pending prompts, verifying
  design alignment, or evaluating execution plans.
---

# Forensic Auditing — Deterministic Codebase Alignment

> Scope: any codebase audit · Runtime: agent workflow · Credit: DaBigHomie / thePlug

---

## Audit Rules

| # | Rule | Anti-Pattern | Correct Approach |
|---|------|-------------|------------------|
| 1 | Evaluate functional payload | Forecasting blast radius from filenames | Read instructions end-to-end |
| 2 | Diff against git HEAD | Executing old patches without checking live state | `git diff HEAD` before authorizing |
| 3 | Trace component abstractions | Literal string matching for compliance | Strip comments, analyze component imports |
| 4 | Deterministic disk checks | Trusting manifest paths without verification | `existsSync()` + fuzzy-match fallback |
| 5 | Enforce pipeline DAGs | Running interdependent operations concurrently | Quarantine, sequence, inject individually |

---

## Decision Matrix

| Condition | Action |
|-----------|--------|
| File passes keyword check but contains unrelated payload | ⛔ Reject — evaluate actual content |
| `package.json` already has the upgrade | ⛔ Skip — already applied |
| Component imports `<Header>` but no raw token import | ✅ Compliant via abstraction |
| Manifest path does not exist on disk | ⚠️ Fuzzy-match across directory tree |
| Multiple pending prompts affect same architecture | ⛔ `HOLD` until DAG sequence established |

---

## Validation Commands

```bash
# Check if target files exist
find ./src -name "*.ts" -maxdepth 4 | head -20

# Diff pending changes against HEAD
git diff HEAD --stat

# Verify no outdated patches
git log --oneline -5
```

---

## Cross-references

- [forecast-scrutiny](forecast-scrutiny.md) — pre-action risk assessment
- [repo-sync-guard](repo-sync-guard.md) — pre-flight hygiene
