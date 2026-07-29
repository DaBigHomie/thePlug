---
name: session-sunset
description: >
  Low-context state-machine driver for session closeout routines. Runs the full
  evidence-collect, review, verify, report, handoff, and teardown sequence as
  scripted phases with resume capability.
---

# Session Sunset — Low-Context Routine Driver

> Scope: any AI coding session · Runtime: `npx tsx` · Exit: 0/1/2/3 · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# Start the sunset routine
npx tsx scripts/routine-run.mts --repo <REPO_SLUG> --session <SESSION_ID> --start

# Resume after an agent turn
npx tsx scripts/routine-run.mts --resume

# Check status
npx tsx scripts/routine-run.mts --status --json
```

---

## Why This Exists

| Problem | Without Orchestrator | With Orchestrator |
|---------|---------------------|-------------------|
| Context at sunset | Already low; routine needs the most | Scripts hold state, agent holds ~1 phase |
| Evidence gathering | Dozens of reads/greps per phase | One `evidence.json`, read once |
| Mid-run failure | Full restart | `--resume` from last clean boundary |
| Ordering drift | Prose order != dependency order | Manifest declares gates |
| Teardown risk | Runs on hope | Gated by `teardown-guard.mts` |

---

## Exit Codes

| Code | Meaning | Agent Action |
|------|---------|--------------|
| `0` | Phase/run complete | Continue or report |
| `1` | Gate failed | Read `state.json` → fix → `--resume` |
| `2` | Script error | Report; do not blindly resume |
| `3` | `AGENT_TURN` — judgment needed | Read brief, emit artifact, `--resume` |

---

## Phase Manifest

| # | Phase | Kind | Emits | Gate |
|---|-------|------|-------|------|
| 0 | Preflight | script | `preflight.json` | All deps exist |
| 1 | Evidence collect | script | `evidence.json` | Git + PR + command log captured |
| 2 | Index coverage | script | `session-index.json` | Every commit/PR indexed |
| 3 | Session contract | agent | `session-contract.md` | Names every repo |
| 4 | Review dispatch | script | `packets/W1..W6.json` | 6 packets, schema-valid |
| 5 | Review fan-out | agent | `findings/raw/W*.json` | All 6 terminal |
| 6 | Adversarial verify | agent | `findings/verdicts.json` | Every finding has verdict |
| 7 | Join | script | `findings/verified.json` | Deduped + ranked |
| 8 | Feedback | script | `session-feedback.md` | Prompt/cmd/fail extracted |
| 9 | Handoff assemble | script | `handoff.md` | Every link resolves |
| 10 | Task flip | script | `flip-report.json` | Zero tasks missing metadata |
| 11 | Related docs | script | `docs-updated.json` | Set rule applied |
| 12 | Continuity check | script | `continuity.json` | Resumable from session ID |
| 13 | Board | agent | board URL | URL resolves |
| 14 | Teardown | script | `teardown.json` | All preconditions pass |

---

## Agent-Turn Protocol

When exit `3` fires:

```bash
# 1. Read the brief — the ONLY context you need
cat ./review/briefs/phase-N.md

# 2. Produce the artifact it names, at the path it names

# 3. Resume
npx tsx scripts/routine-run.mts --resume
```

⛔ Do not re-read the repo
⛔ Do not re-derive evidence
✅ The brief is self-contained by construction

---

## Resume Points

| After Phase | Condition | Resumes At |
|-------------|-----------|------------|
| 2 | `session-index.json` validates | 3 |
| 7 | `verified.json` exists | 8 |
| 9 | `handoff.md` links resolve | 10 |

---

## Cross-references

- [forensic-review-swarm](forensic-review-swarm.md) — review dispatch
- [cold-verification](cold-verification.md) — adversarial verify
- [session-feedback](session-feedback.md) — failure-to-guardrail
