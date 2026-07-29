# Session Feedback — Runbook

> Credit: DaBigHomie / thePlug

## When to Run

- End of any AI coding session
- When you want to know what commands failed and why
- When converting session patterns into reusable automation

---

## Steps

### 1. Extract feedback

```bash
npx tsx scripts/session-feedback-extract.mts --out ./review --json
```

### 2. Review the failure inventory

The output maps every failure class to a concrete automation artifact:

| Failure Signature | Creates |
|-------------------|---------|
| Command retried ≥3× | Skill or `--help` improvement |
| `command not found` | Preflight check |
| Wrong repo | Repo-guard hook |
| Hardcoded path | Portable-path lint rule |
| Destructive without dry-run | Pre-dispatch gate |
| Same lint error ≥2× | CI check |

### 3. Prioritize guardrail candidates

Rank by recurrence count. A failure that happened once is noise;
a failure that happened three times is a missing guardrail.

### 4. Create the automation

For each high-priority candidate, create the actual artifact:
- Skill file → `skills/`
- Pre-flight check → session bootstrap
- Lint rule → CI workflow

---

## Redaction

⛔ Always redact before writing:
- Service role keys → `[REDACTED]`
- API tokens (`sk-`, `ghp_`, `sbp_`) → `[REDACTED]`
- Absolute paths → relative paths

---

## Cross-references

- [session-feedback skill](../skills/session-feedback.md)
- [mine-transcript runbook](mine-transcript.md)
