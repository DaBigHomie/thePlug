#!/usr/bin/env npx tsx
/**
 * mine-transcript.mts — Extract an auditable record from an AI coding session transcript.
 *
 * Works with Claude Code, Cursor, and Antigravity JSONL transcripts.
 *
 * Emits:
 *   - Operator prompts (real human turns)
 *   - Every Bash command executed, with pass/fail
 *   - Failed commands, grouped by failure signature
 *   - Tool-use histogram
 *   - Subagent / workflow dispatches
 *
 * Usage:
 *   npx tsx mine-transcript.mts <transcript.jsonl> <out.json>
 *   npx tsx mine-transcript.mts <transcript.jsonl> <out.json> --force  # overwrite existing
 *
 * Credit: DaBigHomie / thePlug
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [, , inPath, outPath] = process.argv
if (!inPath || !outPath) {
  console.error('Usage: npx tsx mine-transcript.mts <transcript.jsonl> <out.json> [--force]')
  process.exit(2)
}

if (existsSync(outPath) && !process.argv.includes('--force')) {
  console.error(`Refusing to overwrite existing ${outPath} — pass --force to replace it`)
  process.exit(2)
}

type Any = Record<string, unknown>

const lines = readFileSync(inPath, 'utf8').split('\n').filter(Boolean)

const prompts: { i: number; ts: string; text: string }[] = []
const commands: { ts: string; cmd: string; desc: string; ok: boolean; err: string }[] = []
const toolCounts: Record<string, number> = {}
const dispatches: { ts: string; type: string; desc: string }[] = []

const pending = new Map<string, { ts: string; cmd: string; desc: string }>()

const isNoise = (t: string) =>
  t.includes('<system-reminder>') ||
  t.includes('<local-command-') ||
  t.includes('<command-name>') ||
  t.startsWith('Caveat:') ||
  t.includes('[Request interrupted')

for (const line of lines) {
  let rec: Any
  try { rec = JSON.parse(line) } catch { continue }

  const ts = String(rec.timestamp ?? '').slice(0, 19)
  const msg = rec.message as Any | undefined
  if (!msg) continue
  const content = msg.content

  // Operator prompts
  if (rec.type === 'user' && !rec.isMeta) {
    let text = ''
    if (typeof content === 'string') text = content
    else if (Array.isArray(content)) {
      for (const b of content as Any[]) {
        if (b?.type === 'text') text += String(b.text ?? '')
      }
    }
    text = text.trim()
    const hasToolResult = Array.isArray(content) && (content as Any[]).some((b) => b?.type === 'tool_result')
    if (text && !hasToolResult && !isNoise(text)) {
      prompts.push({ i: prompts.length + 1, ts, text })
    }
  }

  // Tool uses
  if (rec.type === 'assistant' && Array.isArray(content)) {
    for (const b of content as Any[]) {
      if (b?.type !== 'tool_use') continue
      const name = String(b.name ?? 'unknown')
      toolCounts[name] = (toolCounts[name] ?? 0) + 1
      const inp = (b.input ?? {}) as Any
      if (name === 'Bash' || name === 'run_command') {
        pending.set(String(b.id), {
          ts,
          cmd: String(inp.command ?? inp.CommandLine ?? ''),
          desc: String(inp.description ?? ''),
        })
      }
      if (['Agent', 'Workflow', 'Task', 'invoke_subagent'].includes(name)) {
        dispatches.push({ ts, type: name, desc: String(inp.description ?? inp.name ?? '') })
      }
    }
  }

  // Tool results
  if (rec.type === 'user' && Array.isArray(content)) {
    for (const b of content as Any[]) {
      if (b?.type !== 'tool_result') continue
      const p = pending.get(String(b.tool_use_id))
      if (!p) continue
      pending.delete(String(b.tool_use_id))
      let out = ''
      if (typeof b.content === 'string') out = b.content
      else if (Array.isArray(b.content)) {
        for (const c of b.content as Any[]) if (c?.type === 'text') out += String(c.text ?? '')
      }
      const isErr = b.is_error === true
      const softFail =
        /^fatal:|\bERR_MODULE_NOT_FOUND\b|\bcommand not found\b|\bNo such file or directory\b|^error:|\bFAIL:|\bBLOCKED\b|Permission denied|not a git repository/m.test(out)
      const ok = !isErr && !softFail
      commands.push({ ts: p.ts, cmd: p.cmd, desc: p.desc, ok, err: ok ? '' : out.slice(0, 400).replace(/\s+/g, ' ').trim() })
    }
  }
}

// Failure signatures
const sigOf = (err: string): string => {
  if (/ERR_MODULE_NOT_FOUND/.test(err)) return 'missing-module'
  if (/fatal: path .* does not exist/.test(err)) return 'git: path absent at ref'
  if (/not a git repository/.test(err)) return 'git: wrong cwd'
  if (/Directory not empty/.test(err)) return 'worktree remove blocked'
  if (/command not found/.test(err)) return 'binary not on PATH'
  if (/bad substitution/.test(err)) return 'shell: bad substitution'
  if (/FAIL:/.test(err)) return 'validator rejected'
  if (/Permission denied/.test(err)) return 'permissions'
  if (/is not a valid|InputValidationError/.test(err)) return 'tool schema violation'
  return 'other'
}

const failed = commands.filter((c) => !c.ok)
const bySig: Record<string, { count: number; samples: string[] }> = {}
for (const f of failed) {
  const s = sigOf(f.err)
  bySig[s] ??= { count: 0, samples: [] }
  bySig[s].count++
  if (bySig[s].samples.length < 3) bySig[s].samples.push(f.cmd.slice(0, 160))
}

const out = {
  generated: new Date().toISOString(),
  source: inPath,
  totals: {
    transcriptLines: lines.length,
    operatorPrompts: prompts.length,
    bashCommands: commands.length,
    bashFailed: failed.length,
    failureRatePct: commands.length ? Math.round((failed.length / commands.length) * 1000) / 10 : 0,
    subagentDispatches: dispatches.length,
    distinctTools: Object.keys(toolCounts).length,
  },
  toolHistogram: Object.fromEntries(Object.entries(toolCounts).sort((a, b) => b[1] - a[1])),
  failureSignatures: Object.fromEntries(
    Object.entries(bySig).sort((a, b) => b[1].count - a[1].count)
  ),
  operatorPrompts: prompts.map((p) => ({ i: p.i, ts: p.ts, chars: p.text.length, text: p.text.slice(0, 600) })),
  dispatches,
  failedCommands: failed.map((f) => ({ ts: f.ts, desc: f.desc, cmd: f.cmd.slice(0, 300), err: f.err.slice(0, 250) })),
}

writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log('=== TOTALS ===')
for (const [k, v] of Object.entries(out.totals)) console.log(`  ${k}: ${v}`)
console.log('\n=== TOOL HISTOGRAM ===')
for (const [k, v] of Object.entries(out.toolHistogram)) console.log(`  ${String(v).padStart(4)}  ${k}`)
console.log('\n=== FAILURE SIGNATURES ===')
for (const [k, v] of Object.entries(out.failureSignatures)) console.log(`  ${String(v.count).padStart(3)}  ${k}`)
console.log(`\nWrote ${outPath}`)
