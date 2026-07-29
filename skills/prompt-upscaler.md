---
name: prompt-upscaler
description: >
  Rewrite thin, vague, or half-formed prompts into dense, executable specifications.
  Turn repeated multi-step prompt chains into governed, resumable routines.
---

# Prompt Upscaler — Specification Densifier

> Scope: any AI model prompt · Runtime: agent workflow · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# Paste a prompt → get a upscaled version with gap analysis
# Works with: coding agents, image generators, system prompts, research queries
```

---

## Core Loop

| Step | Action | Output |
|------|--------|--------|
| 1 | Read for intent, not wording | Identify the actual artifact wanted |
| 2 | Classify target surface | Coding agent / image gen / system prompt / research |
| 3 | Diagnose gaps against lever checklist | List what is missing |
| 4 | Resolve or flag | Fill from context or mark `[ASSUMPTION]` |
| 5 | Emit at requested tier (T1/T2/T3) | Upscaled prompt |
| 6 | Show the delta | Which levers were missing |

---

## The 10 Levers

| Lever | Question It Answers | Symptom When Missing |
|-------|--------------------|-----------------------|
| Objective | What is the one outcome? | Model optimizes wrong sub-goal |
| Acceptance criteria | How is "done" verified? | Endless polish or premature stop |
| Deliverable contract | Exact artifact, format, destination, length | Answer arrives in chat when file was wanted |
| Context / inputs | Stack, versions, file paths, prior decisions | Model re-derives or contradicts known facts |
| Scope fence | What is explicitly out of scope? | Collateral edits, scope creep |
| Audience & register | Who reads output, at what expertise? | Wrong depth, wrong tone |
| Decision authority | Choose independently vs ask first | Paralysis or unwanted unilateral choices |
| Uncertainty handling | What to do when blocked or unsure | Fabrication presented confidently |
| Verification step | Self-check before returning | Broken code, unrun tests |
| Examples | One good sample, or a rejected one | Style drift |

---

## Emission Tiers

| Tier | When to Use | Length |
|------|-------------|--------|
| T1 — Tightened | Fix gaps in a mostly-good prompt | ~same length |
| T2 — Upscaled | Standard rewrite with all levers addressed | 2–3× original |
| T3 — Full spec | Mission-critical prompt or system prompt | Structured doc with sections |

---

## Anti-Patterns

| Pattern | Why It Fails |
|---------|--------------|
| Role cosplay ("You are an expert...") | Wastes tokens, rarely changes behavior |
| Ceremonial politeness ("Please kindly...") | Zero impact on output quality |
| Invented constraints | Narrows model into worse answers |
| All 10 levers forced into every prompt | Bloat — drop levers that are already unambiguous |

---

## Surface Profiles

| Surface | Heavy Levers | Light Levers |
|---------|-------------|---------------|
| Coding agent | Scope fence, deliverable, verification | Audience, examples |
| Image/video gen | Examples, deliverable contract | Decision authority, scope fence |
| System prompt | Scope fence, uncertainty handling | Examples |
| Research query | Objective, acceptance criteria | Deliverable contract |

---

## Cross-references

- [forensic-auditing](forensic-auditing.md) — deep-dive codebase audit
- [forecast-scrutiny](forecast-scrutiny.md) — pre-action risk assessment
