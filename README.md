# thePlug 🔌

> Git hygiene scripts · AI-agent workflow skills · Session management tools
>
> Battle-tested across 18+ repos with Claude Code, Cursor, and Antigravity. Open-sourced.

---

## What's Here

### Scripts

Portable TypeScript scripts. Run with `npx tsx`.

| Script | What It Does |
|--------|-------------|
| [`repo-sync-guard.mts`](scripts/repo-sync-guard.mts) | Pre-flight audit before commit/push/merge — dirty tree, unpushed branches, stale worktrees, open PRs, migration drift |
| [`branch-hygiene.mts`](scripts/branch-hygiene.mts) | 9-class branch classifier — MERGED, SQUASH_MERGED, CHURN, BOT, GONE, MISMATCH, ACTIVE, HOLD, SQUASH_REUSED |
| [`worktree-lint.mts`](scripts/worktree-lint.mts) | Find linked worktrees, prunable entries, and agent-created worktrees across your workspace |
| [`mine-transcript.mts`](scripts/mine-transcript.mts) | Extract an auditable record from AI coding session transcripts (commands, failures, tool usage) |
| [`collect-agent-context.mts`](scripts/collect-agent-context.mts) | Daily scan of ALL AI coding tools for today's artifacts — Antigravity, Cursor, Claude, Copilot, VSCode |

---

### Skills

Workflow definitions for AI agents. Drop these into your agent config.

#### Git Hygiene

| Skill | What It Does |
|-------|-------------|
| [`repo-sync-guard`](skills/repo-sync-guard.md) | Pre-flight audit workflow with SYNCED / NEEDS_SYNC / HOLD verdicts |
| [`branch-hygiene`](skills/branch-hygiene.md) | 9-class branch classification reference |
| [`worktree-lint`](skills/worktree-lint.md) | Worktree scanning + agent worktree detection |

#### Session Management

| Skill | What It Does |
|-------|-------------|
| [`session-sunset`](skills/session-sunset.md) | 15-phase session closeout routine with resume capability |
| [`session-feedback`](skills/session-feedback.md) | Failure-to-guardrail pipeline — turn session failures into CI/CD checks |
| [`task-state-machine`](skills/task-state-machine.md) | Gated batch task state transitions after review |

#### Review & Verification

| Skill | What It Does |
|-------|-------------|
| [`forensic-review-swarm`](skills/forensic-review-swarm.md) | Parallel multi-dimension review with isolated worker packets |
| [`cold-verification`](skills/cold-verification.md) | Adversarial finding verification — verifier never sees original reasoning |
| [`forensic-auditing`](skills/forensic-auditing.md) | Deterministic codebase alignment auditing rules |
| [`forecast-scrutiny`](skills/forecast-scrutiny.md) | Pre-action blast radius forecasting + adversarial scrutiny |

#### Prompt Engineering

| Skill | What It Does |
|-------|-------------|
| [`prompt-upscaler`](skills/prompt-upscaler.md) | 10-lever prompt specification densifier with emission tiers |

---

### Runbooks

Step-by-step operational guides.

#### Git Hygiene

| Runbook | For |
|---------|-----|
| [`repo-sync-guard`](runbooks/repo-sync-guard.md) | Pre-flight audit |
| [`branch-hygiene`](runbooks/branch-hygiene.md) | Branch cleanup |
| [`worktree-lint`](runbooks/worktree-lint.md) | Worktree cleanup |

#### Session Management

| Runbook | For |
|---------|-----|
| [`session-sunset`](runbooks/session-sunset.md) | Full session closeout |
| [`session-feedback`](runbooks/session-feedback.md) | Failure-to-guardrail extraction |
| [`task-state-machine`](runbooks/task-state-machine.md) | Task state transitions |

#### Review & Verification

| Runbook | For |
|---------|-----|
| [`forensic-review-swarm`](runbooks/forensic-review-swarm.md) | Multi-agent review dispatch |
| [`cold-verification`](runbooks/cold-verification.md) | Adversarial finding verification |
| [`forensic-auditing`](runbooks/forensic-auditing.md) | Codebase auditing |
| [`forecast-scrutiny`](runbooks/forecast-scrutiny.md) | Risk assessment |

#### Scripts

| Runbook | For |
|---------|-----|
| [`mine-transcript`](runbooks/mine-transcript.md) | Transcript mining |
| [`collect-agent-context`](runbooks/collect-agent-context.md) | Agent context collection |
| [`prompt-upscaler`](runbooks/prompt-upscaler.md) | Prompt specification |

---

### References

Deep-dive reference material for skills.

| Reference | Contents |
|-----------|----------|
| [`prompt-upscaler/surface-profiles.md`](references/prompt-upscaler/surface-profiles.md) | Per-surface lever weights |
| [`prompt-upscaler/routines.md`](references/prompt-upscaler/routines.md) | Routine governance patterns |
| [`prompt-upscaler/worked-examples.md`](references/prompt-upscaler/worked-examples.md) | Before/after prompt examples |
| [`prompt-upscaler/worked-example-routine.md`](references/prompt-upscaler/worked-example-routine.md) | Full routine upscale walkthrough |
| [`prompt-upscaler/automation-50x.md`](references/prompt-upscaler/automation-50x.md) | Automation density patterns |

---

## Quick Start

```bash
git clone https://github.com/DaBigHomie/thePlug.git
cd thePlug

# Audit your repo before pushing
npx tsx scripts/repo-sync-guard.mts /path/to/your-repo --fetch

# Classify all branches
npx tsx scripts/branch-hygiene.mts --with-pr-check

# Find stale worktrees
npx tsx scripts/worktree-lint.mts --root=~/projects

# Mine an AI session transcript
npx tsx scripts/mine-transcript.mts transcript.jsonl report.json

# See what your AI agents did today
npx tsx scripts/collect-agent-context.mts --root=~/projects
```

---

## Requirements

| Dependency | Required | Purpose |
|------------|----------|---------|
| Node.js 18+ | ✅ Yes | Runtime |
| `npx tsx` | ✅ Yes | TypeScript execution |
| `git` | ✅ Yes | Repository operations |
| `gh` CLI | ⚠️ Optional | PR checks, squash-merge detection |

---

## License

MIT
