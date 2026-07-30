---
name: collect-agent-context-runbook
description: "Runbook: Runbook: collect-agent-context"
---

# Runbook: collect-agent-context

> Daily scan of ALL AI coding tools for today's artifacts.

## Prerequisites

- Node.js 18+ and `npx tsx` available
- A workspace root containing git repos

## Quick Start

```bash
# Scan all repos under the current directory
npx tsx scripts/collect-agent-context.mts

# Specify a workspace root
npx tsx scripts/collect-agent-context.mts --root=~/projects

# Scan for a specific date
npx tsx scripts/collect-agent-context.mts --date=2026-07-28

# JSON output
npx tsx scripts/collect-agent-context.mts --json
```

## Flags

| Flag | Description |
|------|------------|
| `--root=<path>` | Workspace root (default: cwd) |
| `--date=YYYY-MM-DD` | Target date (default: today) |
| `--json` | Full JSON output |

## What it scans

| Source | What it finds |
|--------|---------------|
| **Antigravity** | Conversations, artifacts, knowledge items |
| **Cursor** | Modified rules (.mdc), notepads, chat/composer sessions |
| **Claude Code** | Settings changes, worktrees |
| **GitHub Copilot** | Modified instructions, agent definitions, workflows |
| **VSCode** | Modified config files |
| **Git** | Commits for the target date, stashes, worktrees |
| **Checkpoints** | Modified checkpoint docs |

## Example output

```
=== Agent Context Collection — 2026-07-29 ===

  Workspace: /home/user/projects
  Repos discovered: 8
  Antigravity: 3 conversations, 1 KI updates
  [my-app] 5 commits, 2 cursor rules
  [api-server] 3 commits, claude settings
  [docs] no activity

  --- Summary ---
  Total commits:     8
  Total checkpoints: 0
  Cursor rules:      2
  Copilot agents:    1
  Antigravity:       3 conversations
```

## Use cases

- **Daily standup prep**: What happened across all repos today?
- **Multi-agent audit**: Which AI tools modified which files?
- **Knowledge tracking**: Are Antigravity knowledge items being updated?
- **Rule drift detection**: Which Cursor/Copilot rules changed today?
