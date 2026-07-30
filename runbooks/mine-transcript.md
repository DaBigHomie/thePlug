---
name: mine-transcript-runbook
description: "Runbook: Runbook: mine-transcript"
---

# Runbook: mine-transcript

> Extract an auditable record from an AI coding session.

## Prerequisites

- Node.js 18+ and `npx tsx` available
- A JSONL transcript file (from Claude Code, Cursor, or Antigravity)

## Quick Start

```bash
# Mine a transcript
npx tsx scripts/mine-transcript.mts session-transcript.jsonl report.json

# Overwrite an existing report
npx tsx scripts/mine-transcript.mts session-transcript.jsonl report.json --force
```

## What it extracts

| Section | What you get |
|---------|-------------|
| **Operator prompts** | Every real human message (noise filtered) |
| **Bash commands** | Every command run, with pass/fail status |
| **Tool histogram** | How many times each tool was called |
| **Failure signatures** | Failed commands grouped by failure type |
| **Subagent dispatches** | Agent/workflow/task invocations |

## Reading the output

```
=== TOTALS ===
  transcriptLines: 2847
  operatorPrompts: 23
  bashCommands: 156
  bashFailed: 12
  failureRatePct: 7.7
  subagentDispatches: 4
  distinctTools: 8

=== FAILURE SIGNATURES ===
    5  missing-module
    3  git: path absent at ref
    2  binary not on PATH
    1  permissions
    1  other
```

## Where to find transcripts

| Tool | Transcript location |
|------|--------------------|
| Claude Code | `~/.claude/projects/<project>/conversations/<id>/transcript.jsonl` |
| Antigravity | `~/.gemini/antigravity-cli/brain/<id>/.system_generated/logs/transcript.jsonl` |
| Cursor | `~/.cursor/conversations/` (varies by version) |

## Use cases

- **Session review**: What did the AI agent actually do?
- **CI/CD signal**: Which commands keep failing? (failure signatures)
- **Cost analysis**: How many tool calls per session?
- **Governance**: Audit trail of human instructions vs agent actions
