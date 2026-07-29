# Expo iOS Testing — Runbook

> Credit: DaBigHomie / thePlug

## When to Use

- Running automated UI tests before merging
- Validating core app flows after changes
- Regression testing across iOS and web

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Maestro CLI | `maestro --version` |
| iOS simulator booted | `xcrun simctl list devices booted` |
| App installed | App visible in simulator |
| Metro running | Dev server on port 8081 |

---

## Steps

### 1. Start the dev stack

See [expo-ios-dev-stack runbook](expo-ios-dev-stack.md).

### 2. Run iOS validation (fast)

```bash
pnpm validate:ios
```

### 3. Run iOS clickthrough (full)

```bash
pnpm clickthrough:ios
```

### 4. Run web clickthrough

```bash
pnpm clickthrough:web
```

---

## Test Selection

| Goal | Command |
|------|--------|
| Quick smoke test | `pnpm validate:ios` |
| Full iOS regression | `pnpm clickthrough:ios` |
| Web parity | `pnpm clickthrough:web` |
| All platforms | Run all three in sequence |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Maestro can't find app | Verify app is installed: `xcrun simctl list apps booted` |
| Tests timeout | Check Metro is running on port 8081 |
| Flaky tap targets | Increase Maestro wait time or add `waitForElement` |
| Web tests fail | Verify dev server is running for web |

---

## Cross-references

- [expo-ios-testing skill](../skills/expo-ios-testing.md)
- [expo-ios-dev-stack runbook](expo-ios-dev-stack.md)
