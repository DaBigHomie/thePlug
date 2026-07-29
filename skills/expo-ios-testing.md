---
name: expo-ios-testing
description: >
  Run automated Maestro tests for Expo iOS and web apps.
  Covers clickthrough automation and core flow validation.
---

# Expo iOS Testing — Maestro Automation

> Scope: Expo + Maestro · Runtime: shell · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# iOS clickthrough tests
pnpm clickthrough:ios

# iOS core flow validation
pnpm validate:ios

# Web clickthrough tests
pnpm clickthrough:web
```

---

## Test Types

| Type | Command | What It Tests |
|------|---------|---------------|
| iOS clickthrough | `pnpm clickthrough:ios` | Full UI automation flow |
| iOS validation | `pnpm validate:ios` | Core app flows via Maestro |
| Web clickthrough | `pnpm clickthrough:web` | Web UI automation flow |

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Maestro CLI installed | `maestro --version` |
| iOS simulator running | `xcrun simctl list devices booted` |
| App installed in simulator | `xcrun simctl list apps booted` |
| Dev server running | Metro bundler on port 8081 |

---

## Decision Matrix

| Scenario | Test to Run |
|----------|------------|
| Pre-merge validation | `pnpm validate:ios` |
| Full regression | `pnpm clickthrough:ios` |
| Web parity check | `pnpm clickthrough:web` |
| Quick smoke test | `pnpm validate:ios` (fastest) |

---

## Cross-references

- [expo-ios-dev-stack](expo-ios-dev-stack.md) — starting the dev stack
- [expo-ios-testing runbook](../runbooks/expo-ios-testing.md)
