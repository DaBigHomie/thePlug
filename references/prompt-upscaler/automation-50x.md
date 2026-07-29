# Mode R at 50x — Automating for Low Context

Read this when the person says the agent runs out of context during the routine, when the
routine is run repeatedly, or when phases involve gathering evidence the model must then hold
in its head. Contents:

1. The context inversion
2. The judgment slot
3. What to script vs. what to leave to the agent
4. The AGENT_TURN protocol
5. Swarm fan-out as a context strategy
6. Cost shaping by model tier
7. Failure-to-automation feedback

---

## 1. The context inversion

The default assumption in prompt upscaling is that more specification produces better
execution. For routines run at the end of a long session, this inverts: the agent has the least
context available exactly when the routine demands the most. A 14-phase routine specified in
full detail is unexecutable if reading the spec consumes the remaining budget.

So for Mode R under context pressure, the upscale target changes:

| | Normal Mode R | Mode R at 50x |
|---|---|---|
| Goal | Fewer unresolved decisions | Fewer decisions **held in context** |
| Spec lives in | The prompt | A phase manifest a script reads |
| Evidence gathering | Agent reads files | Script emits one digest |
| State | Agent memory | `state.json` on disk |
| Failure recovery | Re-explain and retry | `--resume` from boundary |

The routine does not get shorter. It gets *externalized*.

---

## 2. The judgment slot

Decompose each phase into two parts and be honest about which is which:

- **Mechanical** — gathering, parsing, diffing, formatting, writing, querying, checking. A
  script does this identically every time and costs the agent zero tokens.
- **Judgment** — deciding whether a change regressed something, whether scope was exceeded,
  what the contract should say. Only a model can do this.

A phase should contain exactly one judgment slot, or none. Phases with two judgment slots are
two phases. Phases with zero are pure script and should never reach the agent at all.

This is the highest-leverage move available in Mode R. Most "the agent ran out of context"
problems are actually "the agent spent 40k tokens doing mechanical work a 60-line script does
for free."

---

## 3. What to script

| Script it | Leave to the agent |
|---|---|
| Git refs, diffs, changed files, branch state | Whether a diff constitutes a regression |
| PR and issue metadata | Whether scope was exceeded |
| File existence, link resolution | What the session contract should assert |
| Schema/format lint (line length, table cols, flags) | Whether two docs actually contradict |
| Dedup, ranking, set arithmetic | Whether a claim survives disproof |
| DB reads/writes, state transitions | Which findings matter most |
| Precondition evaluation | Narrative synthesis for humans |

Rule of thumb: if the answer is derivable from files and a deterministic rule, it is mechanical
— even when it feels analytical. Formatting compliance feels like review; it is a lint pass.

---

## 4. The AGENT_TURN protocol

The mechanic that makes a long routine survivable at low context:

```
Script drives the loop
  -> reaches a judgment slot
  -> writes a self-contained brief naming its input, its output path, and its schema
  -> exits with a distinct code (AGENT_TURN)
Agent reads ONLY the brief
  -> emits the named artifact
  -> re-invokes the script with --resume
```

Requirements for this to work:

- **The brief must be self-contained.** If the agent has to go read the repo to act on the
  brief, the protocol has failed and the brief generator is the defect — not the agent.
- **The brief names an exact output path and schema.** Downstream scripts parse it; a
  free-form answer breaks the chain.
- **A distinct exit code.** Reusing "failure" for "your turn" means resume logic cannot tell
  a blocked run from a waiting one.
- **State persists to disk between turns.** The agent is stateless across the boundary; assume
  it remembers nothing.

Per-phase agent context becomes bounded by brief size rather than by session size. That is the
entire 50x claim.

---

## 5. Swarm fan-out as a context strategy

Parallel workers are usually framed as a speed optimization. Under context pressure the more
important property is that **no worker holds the whole problem**.

Six workers each holding one dimension at 8k tokens is not 48k of agent context — it is six
independent 8k contexts, none of which is the orchestrator's. The orchestrator holds only the
packet manifest and the join result.

Design consequences:

- **Packets, not instructions.** Each worker receives a self-contained JSON packet with its
  scope pre-filtered. It never derives its own scope.
- **One question per worker, verbatim.** A worker answering two questions holds two problems.
- **Uniform finding schema.** The join is a script, and a script cannot merge freeform prose.
- **Scope pre-filtering happens in the dispatcher.** Sending all changed files to a
  formatting worker wastes its budget on files it will never flag.

---

## 6. Cost shaping by model tier

Once work is decomposed into packets, each packet can be priced independently. Assign by the
reasoning the dimension actually requires, not uniformly:

| Work character | Tier | Examples |
|---|---|---|
| Governance, security, final sign-off, disproof | Highest | compliance review, cold verification |
| Judgment over code semantics | Mid | regression, scope, schema |
| Rule-checkable sweeps | Lowest | format lint, naming, style |

Verification specifically should not be cheap. A weak verifier confirms everything, which
converts the entire adversarial pass into theater — the most expensive possible failure,
because it produces confidence without checking.

---

## 7. Failure-to-automation feedback

A routine that runs repeatedly should get cheaper each time. That only happens if failures
are captured with a named downstream consumer:

```
failed command -> failure class -> mapped artifact -> next run's preflight check
```

Without the mapping step, a failed-command log is archaeology. With it, each run converts some
of its own friction into a gate that prevents the friction next time. Specify the mapping table
in the routine itself, and make "which artifact does this failure class become" a required
field rather than an exercise for the reader.

The measurable claim: the failure inventory should shrink between runs. If it does not, the
feedback phase is producing a log nobody consumes.
