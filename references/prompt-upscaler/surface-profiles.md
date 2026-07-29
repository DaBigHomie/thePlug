# Surface Profiles

Each profile lists the levers that carry the most weight for that surface, the levers that are usually noise there, and a skeleton. Read only the profile that matches. When a prompt spans two surfaces (e.g. "research the options then write the migration"), split it into two prompts rather than merging the profiles — sequential prompts outperform one prompt with two jobs.

Contents:
1. Agent / code dispatch
2. Research and analysis
3. Generative media (image, video, audio)
4. System prompts and skill instructions
5. Document and deliverable generation
6. Data, SQL, and analytics

---

## 1. Agent / code dispatch

Target: Claude Code, Cursor, a subagent, or any model with tool access acting on a repo.

**Heavy levers:** scope fence, acceptance criteria, verification step, decision authority, context (stack/versions/paths).
**Light levers:** audience, register, examples.

The defining risk is collateral damage — an agent with write access and a vague fence edits eleven files when three were wanted. Fence first, then specify.

Skeleton:

```
Task: <one sentence, the outcome>

Repo / path: <repo name, repo-relative paths>
Stack: <framework + version, only what's load-bearing>

Do:
- <ordered concrete steps, or "approach is yours" if genuinely open>

Do not touch: <files, dirs, layers, migrations, config>

Done when:
- <observable check 1, e.g. `npm run typecheck` passes>
- <observable check 2>

If blocked: stop and report the blocker. Do not guess at <the ambiguous thing>.
```

Notes:
- Name the verification command explicitly. "Make sure it works" is not a lever; `pnpm test src/features/auth` is.
- State whether the agent may create new files, install packages, or touch git. Silence on git is how force-pushes happen.
- If the agent is autonomous (no human between steps), escalate to T3 always.

---

## 2. Research and analysis

Target: a model with search, or a deep-research mode.

**Heavy levers:** objective, scope fence (time window, geography, source types), deliverable contract, uncertainty handling.
**Light levers:** decision authority, examples.

The defining risk is a confident synthesis built on stale or thin sourcing. Force recency bounds and make "I could not find this" an acceptable answer.

Skeleton:

```
Question: <the specific decision this research informs>

Scope:
- Time window: <e.g. published since 2024>
- Geography / market: <...>
- Sources to prefer: <primary sources, filings, docs> / to exclude: <content farms>

Deliver: <format — comparison table with N columns / 500-word brief / ranked list with rationale>

For each claim, cite the source. Where sources conflict, show the conflict rather than picking one.
Where you cannot find evidence, say so explicitly instead of inferring.
```

Notes:
- Naming the *decision* behind the question is the single highest-leverage addition. "Which vendor should we pick" produces a different, better report than "tell me about vendors".
- Specify how to handle disagreement in sources up front; otherwise the model averages them into mush.

---

## 3. Generative media (image, video, audio)

Target: image models, video models, TTS.

**Heavy levers:** examples/reference, deliverable contract (aspect ratio, duration, count), scope fence (what must stay consistent), audience.
**Light levers:** verification step, decision authority, uncertainty handling.

The defining risk is inconsistency across a batch — character drift, palette drift, style drift between shot 3 and shot 19.

Skeleton:

```
Subject: <who/what, with the attributes that must not drift>
Action: <single clear action per shot>
Setting: <location, time of day, weather>
Camera: <shot size, lens, angle, movement>
Light: <source, quality, direction>
Palette / grade: <specific colors or named look>
Style: <medium and rendering, e.g. 35mm film, cel animation>
Negative: <only genuine traps — text artifacts, extra limbs, watermark>

Output: <aspect ratio, duration or frame count, number of variations>
```

Notes:
- Order matters: most models weight earlier tokens more. Subject and action lead.
- For multi-shot sequences, pull every attribute that must stay constant into a shared block reused verbatim across shots, and vary only the per-shot block. Consistency comes from literal repetition, not from "same character as before".
- Concrete nouns beat adjectives. "Cracked terracotta rooftops at golden hour" outperforms "beautiful Mediterranean vibes".

---

## 4. System prompts and skill instructions

Target: instructions that a model will follow repeatedly across many unseen inputs.

**Heavy levers:** scope fence, decision authority, uncertainty handling, examples, acceptance criteria.
**Light levers:** audience (usually implicit), deliverable contract (varies per invocation).

The defining risk is over-fitting to the examples in front of you. These instructions run against inputs you have not imagined, so specify *principles with reasons* rather than enumerated cases — a model that understands why a rule exists generalizes it correctly; a model given only a list fails on the first case outside the list.

Skeleton:

```
Purpose: <what this instruction set makes the model capable of>
Trigger: <when it applies — and, if useful, when it does not>

Behavior:
- <principle, with the reason it matters>

Output format:
<exact structure>

Edge cases:
- When <condition>, <behavior> — because <reason>

Never: <the small number of genuine hard limits>
```

Notes:
- Reserve "never/always" for real invariants. Overuse trains the model to read them as decoration.
- Include one worked example when format matters and one counter-example when a tempting wrong pattern exists.
- State the tie-breaker when two instructions can conflict.

---

## 5. Document and deliverable generation

Target: a written artifact — report, memo, deck, post, spec.

**Heavy levers:** audience, deliverable contract (length, format, file type), examples, register.
**Light levers:** verification, decision authority.

The defining risk is a competent document aimed at the wrong reader.

Skeleton:

```
Produce: <artifact type> for <specific audience and their expertise level>
Purpose: <what the reader should decide, believe, or do afterward>

Must cover:
- <point 1>
- <point 2>

Length: <words / pages / slide count>
Format: <file type and where to save it, or inline>
Register: <sample sentence in the target voice, if voice matters>
Out of scope: <...>
```

Notes:
- "What should the reader do after reading" is the highest-leverage line. It reorders the entire document.
- If a house style or template exists, attach or quote it. Describing a style secondhand loses most of it.

---

## 6. Data, SQL, and analytics

Target: query generation, analysis over a dataset.

**Heavy levers:** context (schema, dialect, grain), acceptance criteria, uncertainty handling.
**Light levers:** register, audience.

The defining risk is a query that runs, returns numbers, and answers a subtly different question — usually via a wrong grain or an implicit filter.

Skeleton:

```
Dialect: <Postgres 15 / BigQuery / DuckDB>
Schema: <tables and the columns that matter, with grain stated>

Question: <the metric, with its exact definition>
Filters: <date range, segment, exclusions such as test accounts>
Grain of result: <one row per what?>

Return: <query only / query plus explanation / results table>
If the schema is insufficient to answer, say what is missing rather than approximating.
```

Notes:
- Grain is the most common silent failure. State it on both the inputs and the output.
- Define metrics that sound obvious but are not — "active user", "revenue", "churn" all have several defensible definitions.
