---
name: prompt-upscaler-runbook
description: "Runbook: Prompt Upscaler — Runbook"
---

# Prompt Upscaler — Runbook

> Credit: DaBigHomie / thePlug

## When to Use

- A prompt produced a bad result and you want to know why
- Writing instructions for another model, agent, or image generator
- Long run-on prompts that chain skills/phases/workflows
- Any time someone says "upscale", "spec this out", or "write me a prompt for X"

---

## Steps

### 1. Identify intent

Ask: What artifact does the person actually want back, and how would they know it was right?

### 2. Classify the target surface

| Surface | Description |
|---------|-------------|
| Coding agent | Claude Code, Cursor, Antigravity, Copilot |
| Image/video gen | DALL-E, Midjourney, Imagen, Runway |
| System prompt | Persistent instructions for a model |
| Research query | One-shot information retrieval |

### 3. Run the 10-lever checklist

| # | Lever | Ask Yourself |
|---|-------|-------------|
| 1 | Objective | Is there exactly one outcome? |
| 2 | Acceptance criteria | How do we verify "done"? |
| 3 | Deliverable contract | File vs chat? Format? Length? |
| 4 | Context / inputs | Stack? Versions? Prior decisions? |
| 5 | Scope fence | What is explicitly out of scope? |
| 6 | Audience & register | Who reads this, at what level? |
| 7 | Decision authority | Choose vs ask? |
| 8 | Uncertainty handling | What to do when blocked? |
| 9 | Verification step | Self-check before returning? |
| 10 | Examples | Good sample or rejected one? |

### 4. Choose emission tier

| Tier | When |
|------|------|
| T1 — Tightened | Fix gaps in mostly-good prompt |
| T2 — Upscaled | Standard rewrite (default) |
| T3 — Full spec | Mission-critical or system prompt |

### 5. Emit and show delta

Always show which levers were missing — the person learns more from the gap
analysis than from the rewrite itself.

---

## Anti-Patterns to Avoid

- ⛔ Role cosplay ("You are an expert...") — wastes tokens
- ⛔ Ceremonial politeness — zero impact on quality
- ⛔ Forcing all 10 levers into every prompt — only address real gaps
- ⛔ More words as the goal — fewer unresolved decisions is the goal

---

## Cross-references

- [prompt-upscaler skill](../skills/prompt-upscaler.md)
