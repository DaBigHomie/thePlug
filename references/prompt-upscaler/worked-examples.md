# Worked Examples

Calibration for how much structure each tier warrants, and what the Delta table should look like. The point of reading these is to see that the added lines each resolve a real ambiguity — none of them are decoration.

---

## Example 1 — T1 Tighten (low stakes, single turn)

**Original:** "summarize this article for me"

**Upscaled (T1):**

```
Summarize the article below in under 150 words for a reader who has not opened it.
Lead with the central claim, then the two strongest supporting points, then any
stated limitation. Skip background the author treats as common knowledge.

<article>
```

**Delta**

| Lever | Added |
|---|---|
| Deliverable contract | Word budget |
| Audience | Reader who has not seen the source |
| Objective | Ordering by claim strength rather than article order |

Nothing else was added. A summary request does not need acceptance criteria or a verification step, and forcing them in would be bloat.

---

## Example 2 — T2 Structured (the default case)

**Original:** "write me a script to clean up my CSV"

Two things are unknowable from context here and both are load-bearing: what "clean" means, and where the file is. One becomes an open question; the other becomes a parameter.

**Upscaled (T2):**

```
Write a Python 3 script that cleans a CSV and writes a new file, leaving the input untouched.

Input: path passed as the first CLI argument. Output: same name with `.clean.csv` suffix, in the same directory.

Cleaning steps:
- Strip leading/trailing whitespace from all string cells
- Normalize column headers to snake_case
- Drop rows that are entirely empty
- Drop exact duplicate rows, keeping the first occurrence
- Leave all other values as-is, including blanks in partially-filled rows

Print a one-line summary to stdout: rows in, rows out, duplicates dropped.
Use only the standard library. If the file is missing or unreadable, exit with a clear
error message rather than a traceback.
```

**Delta**

| Lever | Added |
|---|---|
| Objective | Defined "clean" as five explicit operations |
| Deliverable contract | Non-destructive output path and naming |
| Context | Python 3, stdlib only |
| Scope fence | Explicit non-goals — no type coercion, no blank-filling |
| Uncertainty handling | Clean error on unreadable input |

**Assumptions**
- [ASSUMPTION] Python, stdlib only. Say the word if this belongs in a Node or TypeScript pipeline instead.

**Open questions**
- Should rows with missing values in required columns be dropped, or is that a separate pass?

---

## Example 3 — T3 Full spec (agent dispatch, irreversible)

**Original:** "have the agent fix the flaky tests in the checkout flow"

Autonomous execution against a repo with write access — this is the case that always escalates to T3, because the cost of a wrong interpretation is real edits to real files.

**Upscaled (T3):**

```
Task: Diagnose and fix the flaky tests in the checkout test suite.

Repo path: `apps/storefront`. Test command: `pnpm test src/features/checkout`.

Step 1 — Reproduce. Run the suite 10 times. Record which tests fail and at what rate.
Report this before changing anything.

Step 2 — Diagnose. For each flaky test, identify the cause: shared mutable state
between tests, real timers, unawaited promises, network calls that should be mocked,
or ordering dependence. Name the cause per test.

Step 3 — Fix. Change test code only. Do not modify application source under
`src/features/checkout/**` — if a test is flaky because the application code has a
genuine race condition, stop and report it rather than fixing it.

Do not touch: application source, `package.json`, CI config, other test suites.

Done when:
- The suite passes 20 consecutive runs
- No test is skipped, `.only`'d, or given an extended timeout to mask the flake
- `pnpm typecheck` passes
- A summary lists each test, its cause, and the fix

If a flake cannot be fixed within test code alone, leave it failing and report it.
A masked flake is worse than a visible one.
```

**Delta**

| Lever | Added |
|---|---|
| Acceptance criteria | 20 consecutive passes plus typecheck |
| Verification | Explicit reproduce-before-fix step |
| Scope fence | Test code only; named do-not-touch paths |
| Decision authority | Stop-and-report on app-level race conditions |
| Uncertainty handling | Banned the masking escape hatches (skip, only, timeout bump) |

Note the last line. Naming the tempting wrong solution is often worth more than describing the right one — an agent under pressure to make tests green will reach for `test.skip` unless it is explicitly off the table.

---

## Example 4 — Failure diagnosis

**Person supplies:** "I asked for 'a chart of our signups by month' and got a pie chart of totals."

**Response shape:**

> The model chose a pie chart because nothing in the prompt named the chart type, and "by month" is ambiguous between *grouped by* and *summed over*. Pie charts cannot show a time series, so that one word decided the output.
>
> Fix the deliverable contract lever:
>
> ```
> Plot a line chart of new signups per calendar month, x-axis = month, y-axis = count.
> Cover Jan 2024 through the latest complete month. Label axes, no legend needed
> for a single series. Return the chart as a PNG.
> ```

The value here is the causal sentence, not the rewrite. One named lever, one fix. Do not rewrite the other nine levers when one caused the failure.
