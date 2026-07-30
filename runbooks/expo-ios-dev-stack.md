---
name: expo-ios-dev-stack-runbook
description: "Runbook: Expo iOS Dev Stack — Runbook"
---

# Expo iOS Dev Stack — Runbook

> Credit: DaBigHomie / thePlug

## When to Use

- Starting local iOS development with Expo
- Debugging a failing Expo dev client
- Rebuilding native binaries after dependency changes

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Node.js 18+ | `node --version` |
| Xcode installed | `xcode-select -p` |
| iOS simulator available | `xcrun simctl list devices available` |
| CocoaPods | `pod --version` |
| `pnpm` or `npm` | `pnpm --version` |

---

## Steps

### 1. Start the full stack

```bash
pnpm dev:stack:ios
```

### 2. If Expo fails to start

Fall back to Metro-only:

```bash
cd apps/mobile && npx expo start --dev-client --port 8081
xcrun simctl launch booted <BUNDLE_ID>
```

### 3. If the binary is stale

Full native rebuild:

```bash
# Regenerate ios/
cd apps/mobile && npx expo prebuild --platform ios --clean

# Build with xcodebuild
cd apps/mobile/ios && xcodebuild \
  -workspace <App>.xcworkspace \
  -scheme <App> \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "id=$(xcrun simctl list devices booted \
    | grep -oE '[A-F0-9-]{36}' | head -1)" \
  build

# Install and launch
xcrun simctl install booted \
  ~/Library/Developer/Xcode/DerivedData/<App>-*/\
  Build/Products/Debug-iphonesimulator/<App>.app
xcrun simctl launch booted <BUNDLE_ID>

# Start Metro
cd apps/mobile && npx expo start --dev-client --port 8081
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `setImmediate` crash | Full native rebuild |
| `LinearGradient` error | Full native rebuild |
| `expo run:ios` broken (Xcode 26) | Use `xcodebuild` directly |
| Port 8081 in use | `lsof -i :8081` then kill the process |
| Simulator not booting | `xcrun simctl boot <DEVICE_ID>` |
| CocoaPods out of date | `cd ios && pod install --repo-update` |

---

## Cross-references

- [expo-ios-dev-stack skill](../skills/expo-ios-dev-stack.md)
- [expo-ios-testing runbook](expo-ios-testing.md)
