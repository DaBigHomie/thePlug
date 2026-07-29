---
name: expo-ios-dev-stack
description: >
  Start an Expo iOS development stack with optional backend services.
  Covers full-stack boot, Metro-only fallback, and Xcode native rebuild.
---

# Expo iOS Dev Stack — Full-Stack Boot

> Scope: Expo + React Native iOS · Runtime: shell · Credit: DaBigHomie / thePlug

## 🚀 Quick Run

```bash
# Full stack (DB + API + iOS simulator)
pnpm dev:stack:ios

# With fixtures enabled
EXPO_PUBLIC_PARITY_FIXTURE=1 pnpm dev:stack:ios

# iOS + API + optional web
npx tsx scripts/mobile-dev-boot.mts --ios --with-web
```

---

## Boot Options

| Mode | Command | What It Starts |
|------|---------|----------------|
| Full stack | `pnpm dev:stack:ios` | DB + API + Expo iOS dev client |
| With web | `npx tsx scripts/mobile-dev-boot.mts --ios --with-web` | Simulator + API + Web app |
| Metro only | `npx expo start --dev-client --port 8081` | Metro bundler only (existing binary) |
| With fixtures | `EXPO_PUBLIC_PARITY_FIXTURE=1 pnpm dev:stack:ios` | Full stack + test fixtures |

---

## Metro-Only Fallback

When the full stack script fails to start Expo:

```bash
# Start Metro manually
cd apps/mobile && npx expo start --dev-client --port 8081

# Launch the app in simulator
xcrun simctl launch booted <BUNDLE_ID>
```

---

## Xcode Native Rebuild

Use when: binary is stale, `setImmediate` crash, `LinearGradient` error, or
after `pnpm install` changes native deps.

```bash
# 1. Regenerate ios/
cd apps/mobile && npx expo prebuild --platform ios --clean

# 2. Build
cd apps/mobile/ios && xcodebuild \
  -workspace <AppName>.xcworkspace \
  -scheme <AppName> \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "id=$(xcrun simctl list devices booted \
    | grep -oE '[A-F0-9-]{36}' | head -1)" \
  build 2>&1 > /tmp/xcode-build.log
echo "EXIT=$?"; tail -5 /tmp/xcode-build.log

# 3. Install + launch
xcrun simctl install booted \
  ~/Library/Developer/Xcode/DerivedData/<AppName>-*/\
  Build/Products/Debug-iphonesimulator/<AppName>.app
xcrun simctl launch booted <BUNDLE_ID>

# 4. Start Metro
cd apps/mobile && npx expo start --dev-client --port 8081
```

---

## Decision Matrix

| Symptom | Action |
|---------|--------|
| App launches normally | Use full stack boot |
| Expo fails to start | Use Metro-only fallback |
| `setImmediate` crash | Native rebuild required |
| `LinearGradient` error | Native rebuild required |
| After `pnpm install` with native deps | Native rebuild required |
| `expo run:ios` broken (Xcode 26) | Use `xcodebuild` directly |

---

## Cross-references

- [expo-ios-testing](expo-ios-testing.md) — automated testing
- [expo-ios-dev-stack runbook](../runbooks/expo-ios-dev-stack.md)
