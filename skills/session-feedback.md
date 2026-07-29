---
name: session-feedback
description: >
  Extract operator prompts, every command run, and every failure into an
  auditable feedback doc. Convert recurring failures into concrete CI/CD
  guardrail candidates.
---

# Session Feedback — Failure-to-Guardrail Pipeline

> Scope: any AI coding session · Runtime: `npx tsx` · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
npx tsx scripts/session-feedback-extract.mts --out ./review --json
```

---

## What Gets Extracted

| Set | Source | Purpose |
|-----|--------|---------|
| Operator prompts | Session transcript / shell history | Prompt patterns → skills |
| Commands run | Command log, shell history | Workflow steps → scripts |
| Commands FAILED | Non-zero exits, retried commands | Guardrail candidates |
| Corrections | Operator messages after failure | The rule that was missing |

---

## Failure → Automation Mapping

| Failure Signature | Artifact to Create | Where |
|-------------------|--------------------|-------|
| Same command retried ≥3× | Skill or `--help` improvement | Skills directory |
| `command not found` / missing dep | Preflight check | Session bootstrap |
| Wrong repo (missing `cd`) | Repo-guard hook | Pre-command gate |
| Path with `/Users/` | Portable-path lint rule | Audit script |
| Destructive op without dry-run | Forecast-scrutiny trigger | Pre-dispatch gate |
| Same lint/type error ≥2× | ESLint rule or CI check | CI workflows |

---

## Redaction Rules

| Pattern | Replacement |
|---------|-------------|
| Service role keys | `[REDACTED]` |
| `sk-`, `ghp_`, `sbp_` tokens | `[REDACTED]` |
| `Authorization: Bearer ...` | `[REDACTED]` |
| Absolute `/Users/...` paths | Relative paths |

---

## Cross-references

- [session-sunset](session-sunset.md) — full session closeout
- [mine-transcript](../runbooks/mine-transcript.md) — transcript mining
