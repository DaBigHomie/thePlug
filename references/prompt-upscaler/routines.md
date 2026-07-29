# Routines, Loops, and Workflows (Mode R)

Read this before emitting any Mode R output. Contents:

1. What makes a routine different
2. Phase design
3. The artifact chain
4. Loop constructs and their required parameters
5. Fan-out, join, and adversarial verification
6. Dependency hoisting
7. Resumability and failure policy
8. Teardown gating
9. Knowledge transfer

---

## 1. What makes a routine different

A single prompt has one output and one chance to be wrong. A routine has N outputs, and errors compound silently — phase 4 consuming phase 2's half-finished artifact produces something that looks complete and is not. The person usually cannot tell which phase failed, because the routine emits one final artifact.

So the upscale objective for a routine is **separability**: every phase must be independently runnable, independently verifiable, and independently resumable. If a phase cannot be described in terms of "consumes X, emits Y, advance when Z", it is not yet a phase — it is two phases, or it is prose.

A useful test: could a different agent, given only the phase spec and the named input artifact, execute the phase correctly with no memory of the earlier phases? If not, the phase is leaning on shared context that will not survive a fresh session, a subagent boundary, or a resume.

---

## 2. Phase design

Each phase carries six fields. Omit none; write NONE where a field genuinely does not apply.

```
### Phase N — <verb phrase>
Invokes: <skill / slash command / "inline">
Input:   <named artifact from a prior phase, or "none — entry point">
Do:      <steps, imperative>
Emits:   <named artifact + path>
Gate:    <the condition that must hold to advance>
On failure: <halt | skip and note | retry up to N>
```

**Gates are checks, not hopes.** A good gate is something an agent can evaluate: "the index file exists and contains at least one entry per merged PR in the window", "typecheck exits 0", "every finding has a linked file path". A bad gate is "the index looks complete".

**Phase granularity.** Split when a phase changes tool surface (git → database → browser), when it becomes independently resumable, or when its failure should not roll back prior work. Merge when two steps always succeed or fail together and share the same tools.

**Numbering.** Keep phase numbers stable across revisions of the routine — people reference them in handoffs and incident notes. Insert `Phase 3b` rather than renumbering 4 through 9.

---

## 3. The artifact chain

The chain is the routine's actual data model. Draw it explicitly before writing phases:

```
Phase 1 → index.json      ─┐
Phase 2 → forensic.json   ─┼→ Phase 5 (synthesis) → handoff.md → Phase 7 (board)
Phase 3 → findings/*.json ─┘
```

Rules that prevent the common failures:

- **Every artifact gets a path**, repo-relative or parameterized. An artifact with no declared location is an artifact the next phase cannot find and the handoff cannot link.
- **Every artifact has exactly one producing phase.** Two phases writing the same file is a race, not a merge.
- **Consumers are named.** If nothing consumes an artifact, either it is a terminal deliverable (say so) or it is dead work (cut the phase).
- **Prefer append-only intermediate artifacts.** A phase that rewrites its predecessor's file destroys the evidence needed to debug the run.

---

## 4. Loop constructs

Every loop needs a bound and a non-convergence action. An unbounded loop in an autonomous routine is the single most expensive defect available.

**Bounded iteration** — known finite set.
```
For each <item> in <explicitly enumerated or query-defined set>:
  <steps>
Set definition: <how the set is computed — not "all the relevant ones">
On per-item failure: <policy>
```
The set definition is the lever people skip. "For each affected doc" is not a set; "for each file under `docs/` that references a symbol changed in this session's diff" is.

**Until-converged** — repeat until a condition holds.
```
Repeat until <observable exit condition>:
  <steps>
Max iterations: <N>
On reaching max without convergence: <report state and halt | accept current | escalate>
```
Never write "until it's clean". Write the check. And always name the non-convergence action, because that is the branch that actually fires on the hard cases.

**Retry** — same operation, transient failure.
```
Attempt <operation>, up to <N> times, backing off <interval>.
Retry only on <transient class: network, lock contention, rate limit>.
On <deterministic failure class>: do not retry — halt and report.
```
Retrying a deterministic failure N times is N times the cost for the same error. Separate the classes.

**Escalating loop** — retry with a changed approach rather than the same one. Requires stating what changes between attempts ("attempt 2 adds verbose logging; attempt 3 falls back to the manual path"). Without that, it is just retry with extra steps.

---

## 5. Fan-out, join, and adversarial verification

**Fan-out** parallelizes independent work. The requirements:

- **Independence check.** Workers must not write the same artifact or depend on each other's output. If they do, it is a sequence wearing a parallelism costume.
- **Explicit worker count and assignment.** Name each worker and its dimension. When the person says "N dimensions" and then lists a different number, resolve the mismatch out loud before proceeding.
- **A join phase.** Fan-out with no synthesizer produces N disconnected reports. The join phase deduplicates overlapping findings, resolves contradictions between workers, and ranks by severity. Name it as its own phase with its own gate.
- **A uniform finding schema.** Workers must emit the same shape or the join cannot merge them. Specify it: `{dimension, severity, claim, evidence_path, suggested_action}`.

**Adversarial verification** is a distinct pattern from review. Ordinary review asks "is this good?" and gets agreement. Adversarial verification hands the checker a *claim* and the burden of disproving it:

```
For each finding from the fan-out:
  Verifier (separate invocation, given only the finding and the repo — not the
  worker's reasoning) attempts to disprove it.
  Emit: {finding_id, verdict: CONFIRMED | REFUTED | UNPROVEN, counter-evidence}
Only CONFIRMED findings enter the report. REFUTED and UNPROVEN are logged
separately rather than dropped — a pattern of REFUTED findings from one
dimension means that worker's prompt is miscalibrated.
```

The isolation matters. A verifier shown the worker's reasoning anchors to it and confirms almost everything. Give it the claim and the source material only.

---

## 6. Dependency hoisting

Incoming routines bury skill requirements mid-sentence — "use /forensic-agents (create-skill) to review your work". Hoist all of them into Phase 0 as a table:

```
## Phase 0 — Preflight

| Dependency | Type | Status | Action if MISSING |
|---|---|---|---|
| /session-chapter-index | skill | EXISTS | — |
| /forensic-work-audit | skill | MISSING | author before Phase 3, or run Phase 3 inline |

Halt if any MISSING dependency has no action. Do not author skills mid-routine.
```

The reason is practical: authoring a skill is itself a multi-step task with its own context requirements. Doing it in the middle of a forensic run means the agent context-switches away from the analysis, and the skill it writes is shaped by whatever happened to be in scope at that moment rather than by the general case.

If a MISSING dependency cannot be resolved before the run, the honest options are (a) defer that phase and note the gap in the handoff, or (b) run the phase inline with the steps spelled out in the routine itself. Both are fine. Silent mid-run authoring is not.

---

## 7. Resumability and failure policy

**Resume points.** Name the phase boundaries that are safe re-entry points, and say what must be true at each. A routine with no resume points forces a full re-run after any failure — which, for a 40-minute forensic sweep, means it will simply not be re-run.

```
## Resume points
- After Phase 2: index.json exists and validates → resume at Phase 3
- After Phase 5: handoff.md exists → resume at Phase 6
Phases 3–4 are not individually resumable; re-run both.
```

**Idempotency.** State whether re-running a phase is safe. Phases that append to a log, create branches, or post to external systems usually are not, and need either a guard ("skip if artifact exists and its hash matches") or an explicit warning.

**Failure policy per phase.** Three options, chosen by what the downstream phases need:
- **Halt** — downstream phases depend on this artifact. Default for anything in the critical chain.
- **Skip and note** — the phase is enrichment. Record the gap in the final report so the absence is visible rather than silent.
- **Retry** — transient failure class only (see §4).

A routine where every phase is "halt" is brittle; one where every phase is "skip" produces confidently incomplete output. Choose per phase, deliberately.

---

## 8. Teardown gating

Destructive teardown — deleting worktrees, branches, temp directories, sessions, containers — is where routines cause real loss, because it runs last, when attention is lowest, and it runs on the evidence.

```
## Teardown
Precondition (ALL must hold):
  - <terminal deliverable exists at its declared path>
  - <every link in the handoff resolves>
  - <work is merged or pushed to a durable remote>
Removes:
  - <explicitly enumerated paths / branch patterns>
Never removes: <the durable artifacts>
If any precondition fails: skip teardown entirely, report what was left behind
and the exact commands to clean up manually.
```

Two rules worth stating in the emitted routine itself:

- **Skipping teardown is always the safe failure.** Leftover branches cost disk. Deleted unmerged work costs the session.
- **Enumerate, do not pattern-match, when the pattern could over-match.** `git branch -D agent/*` deletes agent branches that this routine never created.

---

## 9. Knowledge transfer

A routine that ends without a durable artifact has taught the next session nothing. Specify:

- **The terminal artifact and its path** — handoff doc, board, report.
- **Its required links** — git refs (commit SHAs, PR numbers, branch names), file paths for each artifact in the chain, the command log, and the findings report. Links, not descriptions: "the forensic pass found 6 issues" is not resumable; a path to the findings file is.
- **What the next session should do first** — the single next action, not a summary of the past.
- **Lessons learned as inputs to tooling.** When a routine captures the person's prompts, the commands run, and the commands that failed, say what that capture is *for* — a failed-command log exists so that recurring failures become guardrails, checks, or new skills. Name that downstream consumer, or the log is just archaeology.

Compact by default: the handoff should be readable in two minutes and drillable to full depth via its links.
