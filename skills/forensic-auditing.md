---
name: forensic-auditing
description: >
  Deep-dive auditing rules to evaluate codebase alignment, forecast execution safety,
  and prevent temporal or semantic drift. Use when auditing pending prompts, verifying
  design alignment, or evaluating execution plans.
---

# Forensic Auditing

Deterministic rules for auditing codebase alignment. Never rely on heuristics, names, or assumptions.

## 1. Evaluate Functional Payload, Not Filenames

Do not forecast blast radius based on file names or document titles.
- **Rule:** Evaluate the actual functional payload of a document or script.
- **Example:** A document that passes a UI keyword check may contain a 24-point backend infrastructure upgrade. Read the instructions end-to-end.

## 2. Diff Pending Actions Against Git HEAD

Codebases are living systems. Old patches or outdated prompts guarantee conflicts.
- **Rule:** Before authorizing execution, dynamically check the live state of the target.
- **Example:** Check `package.json` for existing dependency upgrades. Scan migrations to see if a schema change is already applied.

## 3. Trace Component Abstractions

Modern codebases use dependency abstraction. A file may not use a raw token directly.
- **Rule:** Forensic auditing requires stripping code comments and analyzing component-level abstractions. Do not rely on literal string matching.
- **Example:** A file importing `<Header>` is compliant even if the explicit import of a design token is absent.

## 4. Execute Deterministic Disk Checks

A design manifest is a statement of intent, not reality.
- **Rule:** Use deterministic file-system validation.
- **Example:** Verify the existence of target files. If a path from a manifest fails, run a fuzzy-match across the directory tree.

## 5. Enforce Pipeline DAGs

You cannot run multiple interdependent operations concurrently.
- **Rule:** Operations must be quarantined, sequenced, and injected individually.
- **Example:** If multiple pending prompts affect the same architecture, flag them as `HOLD` until a DAG sequence is established.
