---
name: forensic-auditing-runbook
description: "Runbook: Runbook: forensic-auditing"
---

# Runbook: forensic-auditing

> Deep-dive auditing to prevent drift and regressions.

## When to use

- Before executing old/pending prompts or plans
- When auditing codebase alignment with design specs
- After a long gap between planning and execution
- When multiple agents have been working on the same codebase

## The 5 rules

### Rule 1: Evaluate Payload, Not Filenames

**Problem:** A file called `ui-polish.md` might contain a 24-point backend infrastructure upgrade.

**Action:** Read the full contents of any document before forecasting its impact. Never trust the filename.

### Rule 2: Diff Against Git HEAD

**Problem:** Executing a 3-week-old plan on a codebase that has evolved since then.

**Action:**
```bash
# Before running any old plan:
git diff HEAD -- package.json              # is the dep already upgraded?
ls supabase/migrations/                     # is the schema change applied?
git log --oneline --since="3 weeks ago"    # what changed since the plan?
```

### Rule 3: Trace Abstractions

**Problem:** Crude regex search says a component is "non-compliant" because it doesn't use a raw token.

**Action:** Check if the component imports a wrapper that applies the token. Modern codebases use layers of abstraction.

### Rule 4: Verify on Disk

**Problem:** A manifest says a route exists. The file system disagrees.

**Action:**
```bash
# Verify a route actually exists
test -f src/app/dashboard/page.tsx && echo "EXISTS" || echo "MISSING"

# Fuzzy-match if the path has drifted
find src/app -name "page.tsx" -path "*dashboard*"
```

### Rule 5: Enforce Pipeline DAGs

**Problem:** Running a DB migration, API upgrade, and UI polish concurrently.

**Action:**
1. List all pending operations
2. Identify dependencies between them
3. Flag overlapping operations as HOLD
4. Execute sequentially in dependency order

## Checklist

- [ ] Read the full payload of every pending document
- [ ] Diff pending changes against current HEAD
- [ ] Verify target files exist on disk
- [ ] Check for abstraction layers before flagging non-compliance
- [ ] Sequence operations into a DAG — no concurrent chaos
