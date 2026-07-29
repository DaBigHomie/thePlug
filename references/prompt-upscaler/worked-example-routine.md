# Worked Example — Mode R Routine Upscale

A real session-handoff routine, as pasted by a user, upscaled into a governed routine. Read this to calibrate how far to decompose, how to hoist buried requirements, and how to report defects in the original without rewriting the person's intent.

---

## The original

> `/session-chapter-index prime-orchestration-handoff /handoff-sunset-v30` then be sure to create the following - session contract, `/prime-orchestration-write-handoff`. Does your session index include the work before the session was indexed? if not `/ide-store-forensic-index` followed by `/session-chapter-index` to create an accurate index. use `/forensic-agents` (create-skill) to review your work and identify fixes, suggestions, edits, deletions, plans, runbooks etc (expand) that were or was not aligned with the sessions work or regressed the prev work. Conduct a Forensic review (create-skill `/forensic-work-audit`) 4 dimensions (regression, doc consistency, governance compliance, scope creep, script formatting, doc formatting) in parallel, each finding adversarially re-checked before being reported. update your handoff with explicit note on top with links to git records, files, commands log, session contract, lessons learned. Create a Session Feedback for CI/CD Doc (create-skill) { Use forensic agents to identify my prompts, the commands ran by you and other agents, the failed commands ran by you and other agents. So it can be audited by Prime Governance and Automation Tools, Prompts and Skills can be created for CI/CD. } flip your cortex tasks (create-skill) when the subagents stop. and update any related docs (expand on related) - be sure your work can be continued via `/prime-orchestration-continue` (existing skill). verify your cortex tasks have the repo alias. and flip your tasks. create a final `/claude-board` (existing skill) or cursor-board or gemini-board and open it in the browser. capturing all work performed, diagrams, features, gap analysis. Remove your agent worktrees and branches when completed safely.

The intent is sound and complete — this is a person who knows exactly what they want. The problems are all structural.

## Defects found in the original

| # | Defect | Consequence |
|---|---|---|
| D1 | Count mismatch: "4 dimensions" followed by six listed dimensions | Agent arbitrarily drops two, or runs six and reports "4 of 4 complete" |
| D2 | Coverage conditional buried mid-paragraph | Contract and handoff get written against an incomplete index, then never revisited |
| D3 | Four `(create-skill)` markers embedded mid-sentence | Agent stops a forensic run to author a skill, losing analysis context |
| D4 | Ordering ambiguity ("then", "followed by", "and") with no gates | Phases interleave; handoff written before findings exist |
| D5 | `(expand)` and `(expand on related)` unbounded | Scope is whatever the agent feels like; unrepeatable between runs |
| D6 | "flip your cortex tasks when the subagents stop" — not an observable trigger | Flip fires early, mid-fan-out, or never |
| D7 | Board tool unresolved (claude / cursor / gemini) | Agent picks one; next session looks in the wrong place |
| D8 | Teardown qualified only by "safely" | Worktrees removed before the board and handoff links are verified |
| D9 | Adversarial re-check not isolated from the finding's author | Verifier anchors on the worker's reasoning and confirms nearly everything |

D2 and D8 are the two that cost real work. Everything else costs consistency.

---

## Split recommendation

At full specification this exceeds the single-routine size limit. It is two routines with a clean seam at the point where analysis ends and reporting begins:

- **Routine A — SESSION-FORENSIC-INDEX** (Phases 0–5): index, contract, forensic fan-out, verified findings.
- **Routine B — SESSION-SUNSET-REPORT** (Phases 6–12): handoff finalize, CI/CD feedback, task flip, board, teardown.

The seam matters operationally: A is re-runnable and read-only-ish; B mutates task state and destroys branches. Splitting them means a bad forensic pass can be re-run without re-triggering teardown.

Both are shown below.

---

## Routine A — SESSION-FORENSIC-INDEX

```
Purpose: Produce a verified, complete session index and an adversarially-checked
         forensic findings set for the current session.
Trigger: End of a working session, before handoff.
Reversibility: Read-only except for artifact writes under the session output dir.

### Phase 0 — Preflight
Parameters (resolve before starting; halt if unresolved):
  REPO_ALIAS      = <alias as registered in CORTEX>
  SESSION_ID      = <...>
  OUT             = <repo-relative session output dir>
  BOARD_TOOL      = claude-board | cursor-board | gemini-board   [D7]

Dependency table:
| Dependency                        | Type    | Status  | Action if MISSING          |
|-----------------------------------|---------|---------|----------------------------|
| /session-chapter-index            | skill   | EXISTS  | —                          |
| /prime-orchestration-handoff      | skill   | EXISTS  | —                          |
| /handoff-sunset-v30               | skill   | EXISTS  | —                          |
| /prime-orchestration-write-handoff| skill   | EXISTS  | —                          |
| /ide-store-forensic-index         | skill   | EXISTS  | —                          |
| /prime-orchestration-continue     | skill   | EXISTS  | —                          |
| /forensic-agents                  | skill   | MISSING | author before run, or defer |
| /forensic-work-audit              | skill   | MISSING | author before run, or defer |
| session-feedback-cicd             | skill   | MISSING | author before run, or defer |
| cortex-task-flip                  | skill   | MISSING | author before run, or defer |

Gate: every MISSING row has a chosen action. Do not author skills mid-routine. [D3]

### Phase 1 — Index coverage check          [D2 — hoisted from mid-paragraph]
Do: Determine whether the session index covers work performed before indexing began.
    Coverage check: every commit on the session branch, every merged PR in the session
    window, and every CORTEX row for SESSION_ID appears in the index.
Gate: coverage check passes.
On gap: run /ide-store-forensic-index, then /session-chapter-index, then re-check.
        Max 2 rebuild attempts; on third failure halt and report the uncovered set.
Emits: $OUT/session-index.json

### Phase 2 — Session contract
Input: $OUT/session-index.json
Do: Write the session contract — scope in, scope out, invariants asserted, repos touched.
Emits: $OUT/session-contract.md
Gate: contract names every repo appearing in the index.

### Phase 3 — Draft handoff
Invokes: /prime-orchestration-write-handoff
Input: session-index.json, session-contract.md
Emits: $OUT/handoff.md  (draft; finalized in Routine B Phase 7)

### Phase 4 — Forensic fan-out (6 workers, parallel)     [D1 — six, not four]
Workers, one dimension each:
  W1 regression          W4 scope creep
  W2 doc consistency     W5 script formatting
  W3 governance compliance W6 doc formatting
Each worker reviews the session's fixes, edits, deletions, plans, and runbooks against
the session contract and the prior state, and reports misalignment or regression.
Finding schema (uniform, required for join):
  {id, dimension, severity: HIGH|MED|LOW, claim, evidence_path, git_ref, suggested_action}
Emits: $OUT/findings/raw/W{1..6}.json
On worker failure: skip and note — record the unrun dimension in the report. Do not halt.

### Phase 5 — Adversarial verification + join            [D9 — isolation required]
For each raw finding:
  A verifier invocation receives ONLY {claim, evidence_path, git_ref} and the repo.
  It does not receive the worker's reasoning.
  It attempts to DISPROVE the claim.
  Emits: {finding_id, verdict: CONFIRMED | REFUTED | UNPROVEN, counter_evidence}
Join: deduplicate CONFIRMED findings across dimensions, resolve contradictions,
      rank by severity.
Emits: $OUT/findings/verified.json   (CONFIRMED only)
       $OUT/findings/rejected.json   (REFUTED + UNPROVEN, retained — a cluster of
                                      REFUTED from one dimension means that worker's
                                      prompt is miscalibrated)
Gate: every raw finding has a verdict.

## Resume points
- After Phase 1: session-index.json validates → resume at Phase 2
- After Phase 4: all six raw files present → resume at Phase 5
Phases 4–5 re-run together if either fails.
```

## Routine B — SESSION-SUNSET-REPORT

```
Precondition: Routine A completed; $OUT/findings/verified.json exists.

### Phase 6 — Session feedback for CI/CD
Do: Extract from the session record — (a) the operator's prompts, (b) commands run by
    this agent and subagents, (c) commands that FAILED, with exit codes and context.
Purpose of the capture (state it in the doc): failed-command clusters become the input
    for new guardrails, pre-flight checks, and skills. Name that consumer explicitly so
    the log is actionable rather than archaeological.
Emits: $OUT/session-feedback-cicd.md — structured for Prime Governance audit.

### Phase 7 — Finalize handoff                            [D4 — now gated]
Input: handoff.md (draft), verified.json, session-contract.md, session-feedback-cicd.md
Do: Prepend an explicit status note at the top of handoff.md linking to:
    git records (commit SHAs, PR numbers, branch names), each artifact path,
    the command log, the session contract, and lessons learned.
Gate: every link resolves. Descriptions are not links — a finding count is not resumable,
      a path to the findings file is.
Emits: $OUT/handoff.md (final)

### Phase 8 — CORTEX task flip                            [D6 — observable trigger]
Trigger: all Phase 4 workers have terminated (success or recorded failure) AND
         Phase 5 has written verified.json. Not "when the subagents stop."
Do: Verify every CORTEX task for SESSION_ID carries REPO_ALIAS. Backfill any missing.
    Then flip task states.
Gate: zero tasks for SESSION_ID lacking a repo alias.
On failure: halt. Do not proceed to teardown with unaliased tasks.

### Phase 9 — Related docs update                         [D5 — set defined]
Set definition: every doc under docs/ that (a) references a file changed in this
    session's diff, (b) is named in a CONFIRMED finding, or (c) is linked from the
    session contract. Not "any related docs."
Emits: list of updated docs, appended to handoff.md.

### Phase 10 — Continuity verification
Do: Confirm the session state is resumable via /prime-orchestration-continue —
    the handoff, contract, index, and CORTEX task state are all discoverable from
    SESSION_ID alone.
Gate: continuation check passes. This gate protects teardown.

### Phase 11 — Board
Invokes: $BOARD_TOOL
Do: Generate the board capturing work performed, diagrams, features, and gap analysis;
    open in browser.
Emits: board artifact + URL, linked from handoff.md.

### Phase 12 — Teardown                                   [D8 — gated]
Precondition (ALL must hold):
  - Phase 10 continuity check passed
  - Board artifact exists and its URL resolves
  - Every link in handoff.md resolves
  - All session branches are merged OR pushed to remote
Removes: agent worktrees created this session (enumerated by path, not by glob);
         agent branches created this session (enumerated by name, not by pattern —
         `agent/*` over-matches branches this routine never created).
Never removes: $OUT, the handoff, the board artifact, findings.
If any precondition fails: SKIP teardown entirely. Report what was left behind and
the exact commands to clean it up manually. Leftover branches cost disk; deleted
unmerged work costs the session.
```

---

## Delta

| Lever | What was added / fixed |
|---|---|
| Phase decomposition | One paragraph → 13 phases across 2 routines |
| Gate condition | Gates on index coverage, findings verdicts, link resolution, alias presence, continuity |
| Artifact chain | Every phase emits a named path under `$OUT`; consumers declared |
| Dependency resolution | 4 buried `(create-skill)` markers hoisted to a Phase 0 table |
| Fan-out / join | 6 workers named, uniform finding schema, explicit join phase |
| Adversarial verification | Verifier isolated from worker reasoning; REFUTED findings retained as calibration signal |
| Loop bounds | Index rebuild capped at 2 attempts with a defined halt |
| Scope fence | `(expand)` replaced with a computed set rule |
| Resumability | Resume points named at phase boundaries |
| Failure policy | Per-phase halt / skip-and-note chosen deliberately |
| Teardown precondition | "safely" replaced with four checkable conditions; skip-is-safe stated |
| Knowledge transfer | Handoff links required to resolve; CI/CD log's downstream consumer named |

## Assumptions

- [ASSUMPTION] The six named `EXISTS` skills perform what their names imply; their internal steps were not modified, only their sequencing and gating.
- [ASSUMPTION] CORTEX task "flip" is a state transition on task rows keyed by session, and "repo alias" is a field on those rows.
- [ASSUMPTION] `$OUT` is a per-session directory; substitute the actual convention.
- [ASSUMPTION] Session-branch commits, merged PRs in the window, and CORTEX rows are the right coverage denominator for Phase 1.

## Open questions

1. Is `BOARD_TOOL` fixed per repo, or chosen per session? If fixed, move it out of parameters into a repo config lookup.
2. Should REFUTED findings block the run when they cluster in one dimension, or only be logged for later calibration?
3. Does teardown need to survive a failed board generation, or is the board a hard gate?
