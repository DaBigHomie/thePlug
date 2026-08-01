# AGENTS.md — thePlug (Public Repo)

> Owner: DaBigHomie · Repo: `DaBigHomie/thePlug` · License: MIT
> Governance tracked in: `maximus-ai/docs/thePlug/`

---

## Repo Purpose

Public repo sharing AI coding workflow tools — scripts, skills, runbooks,
and references. All content is remixed from internal tooling with internal
references removed.

---

## Rules (Non-Negotiable)

### Branch Safety

- ⛔ NEVER commit directly to `main`
- ✅ ALWAYS create a feature branch (`feat/`, `fix/`, `docs/`)
- ✅ ALWAYS push the branch and open a PR
- ✅ Merge via PR only

### Pre-Commit Gate (run ALL before every commit)

```bash
# 1. Confirm branch is NOT main
git branch --show-current  # must not be 'main'

# 2. Internal reference scan — must return CLEAN
grep -rlE '(CORTEX|cortex_|MALFIG|eccpracfbrocmkzuogec|maximus_prime|management-git)' \
  --include="*.md" --include="*.mts" . | grep -v .git

# 3. Secret scan — must return CLEAN
grep -rlE '(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|sbp_[a-zA-Z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY=)' \
  --include="*.md" --include="*.mts" . | grep -v .git

# 4. Portable path check — must return CLEAN
#    Exception: /Users/ inside example pattern tables is OK
grep -rn '/Users/dame' --include="*.md" --include="*.mts" . | grep -v .git

# 5. Doc-standards format check
#    - YAML frontmatter (--- block with name + description)
#    - H1 title with em-dash: # Topic — Subtitle
#    - Metadata subheading: > Scope: ... · Runtime: ...
#    - Lines ≤ 300, table cols ≤ 7, code blocks ≤ 30 lines
#    - Zero prose in skills/runbooks (tables/code/matrices only)

# 6. README link integrity — all internal links must resolve
grep -oE '\[[^]]+\]\([^http][^)]+\)' README.md | while read link; do
  target=$(echo "$link" | sed 's/.*](//' | sed 's/).*//');
  [ ! -f "$target" ] && echo "BROKEN: $target";
done
```

### Remix Rules (Internal → Public)

- ⛔ NEVER copy internal files verbatim — always remix first
- ⛔ NEVER include: CORTEX DB refs, Supabase project IDs, agent IDs,
  cluster/swarm IDs, internal session IDs, MALFIG gate references
- ⛔ NEVER include: hardcoded `/Users/<name>/...` or absolute home-dir paths
- ⛔ NEVER include: SQL with `cortex_tasks`, `cortex_knowledge`, `cortex_sessions`
- ✅ Replace internal concepts with generic equivalents
- ✅ Keep the PATTERNS and WORKFLOWS — these are the value
- ✅ Credit: DaBigHomie / thePlug in every file

### Doc-Standards Format (every .md file)

| Rule | Requirement |
|------|-------------|
| Frontmatter | YAML `---` block with `name`, `description` |
| Title | `# Topic — Subtitle` with em-dash |
| Subheading | `> Scope: ... · Runtime: ... · Credit: DaBigHomie / thePlug` |
| Separators | `---` between major sections |
| Cross-refs | `[FILENAME](path)` — relative links only |
| Line length | ≤ 100 chars |
| Table columns | ≤ 7 |
| Doc length | ≤ 300 lines |
| Code blocks | ≤ 30 lines |
| Prose | ⛔ Zero prose in skills/runbooks |
| Symbols | ✅ ⛔ ⚠️ ❌ 🚀 |

### Commit Format

`{type}({scope}): {description}`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`

---

## File Structure

```
thePlug/
├── README.md
├── AGENTS.md              # this file
├── scripts/               # .mts scripts — run with npx tsx
├── skills/                # .md skill definitions for AI agents
├── runbooks/              # .md step-by-step operational guides
└── references/            # .md deep-dive reference material
```

---

## Lessons Learned (from session 2026-07-29)

| Mistake | Rule Added |
|---------|-----------|
| 3 commits went directly to `main` | Branch safety: never commit to main |
| No gate ran before any commit | Pre-commit gate: 6-step checklist |
| `references/` files copied verbatim with CORTEX refs | Remix rules: never copy without remix |
| 15 runbooks shipped without YAML frontmatter | Doc-standards: frontmatter mandatory |
| Ad-hoc grep used instead of actual Prime validators | Gate checklist is now explicit |
| MALFIG review ran after commit, not before | Gate runs BEFORE commit, not after |

---

## Governance

Until `theplug-validate.mts` and `theplug-gate.mts` are built (maximus-ai #647),
the pre-commit gate above is the enforcement mechanism. Run it manually.

Plans and tracking live in `maximus-ai/docs/thePlug/`.
