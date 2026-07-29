# thePlug 🔌

Git hygiene scripts and AI-agent workflow skills — battle-tested, open-sourced for the community.

Born from managing 18+ repos with multiple AI coding agents (Claude Code, Cursor, Antigravity). These tools keep your workspace clean, your branches classified, and your deploys safe.

## What's here

### Scripts

Portable TypeScript scripts. Run with `npx tsx`.

| Script | What it does |
|--------|-------------|
| [`repo-sync-guard.mts`](scripts/repo-sync-guard.mts) | Pre-flight audit before commit/push/merge — dirty tree, unpushed branches, stale worktrees, open PRs, migration drift |
| [`branch-hygiene.mts`](scripts/branch-hygiene.mts) | 9-class branch classifier — MERGED, SQUASH_MERGED, CHURN, BOT, GONE, MISMATCH, ACTIVE, HOLD, SQUASH_REUSED |
| [`worktree-lint.mts`](scripts/worktree-lint.mts) | Find linked worktrees, prunable entries, and agent-created worktrees across your workspace |
| [`mine-transcript.mts`](scripts/mine-transcript.mts) | Extract an auditable record from AI coding session transcripts (commands, failures, tool usage) |
| [`collect-agent-context.mts`](scripts/collect-agent-context.mts) | Daily scan of ALL AI coding tools for today's artifacts — Antigravity, Cursor, Claude, Copilot, VSCode |

### Skills

Workflow definitions for AI agents. Drop these into your agent config.

| Skill | What it does |
|-------|-------------|
| [`repo-sync-guard`](skills/repo-sync-guard.md) | Pre-flight audit workflow |
| [`branch-hygiene`](skills/branch-hygiene.md) | Branch classification reference |
| [`worktree-lint`](skills/worktree-lint.md) | Worktree scanning workflow |
| [`forecast-scrutiny`](skills/forecast-scrutiny.md) | Pre-action blast radius forecasting + adversarial scrutiny |
| [`forensic-auditing`](skills/forensic-auditing.md) | Deep-dive codebase alignment auditing |

### Runbooks

Step-by-step guides for each tool.

| Runbook | For |
|---------|-----|
| [`repo-sync-guard`](runbooks/repo-sync-guard.md) | Pre-flight audit |
| [`branch-hygiene`](runbooks/branch-hygiene.md) | Branch cleanup |
| [`worktree-lint`](runbooks/worktree-lint.md) | Worktree cleanup |
| [`mine-transcript`](runbooks/mine-transcript.md) | Transcript mining |
| [`collect-agent-context`](runbooks/collect-agent-context.md) | Agent context collection |
| [`forecast-scrutiny`](runbooks/forecast-scrutiny.md) | Risk assessment |
| [`forensic-auditing`](runbooks/forensic-auditing.md) | Codebase auditing |

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

## Requirements

- **Node.js 18+** with `npx tsx` (TypeScript execution)
- **git** (obviously)
- **gh** CLI (optional — enables PR checks and squash-merge detection)

## License

MIT
