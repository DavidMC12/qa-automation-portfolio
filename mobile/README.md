# Mobile — Maestro suite

Target app: [Sauce Labs "My Demo App" (Android)](https://github.com/saucelabs/my-demo-app-android)
- appId: `com.saucelabs.mydemoapp.android`
- Pinned release: `2.2.0` (asset `mda-2.2.0-25.apk`)
- Test accounts: `bob@example.com` / `10203040` (standard), `alice@example.com` / `10203040` (locked)

## ⚠️ Before running these flows

The YAML files in `flows/` are a first draft written from public documentation, not from
driving the real app. **Every flow is marked with a comment noting it needs verification.**
Before trusting them in CI:

```bash
maestro studio
```

Use Studio's inspector against a running instance of the app to confirm real element text/ids,
then update the flows accordingly and remove the draft comments.

## Local setup

```bash
# 1. Install the Maestro CLI (requires Java 17+)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# 2. Download the pinned APK and install it on a running emulator/device
#    (from https://github.com/saucelabs/my-demo-app-android/releases/tag/2.2.0)
adb install -r mda-2.2.0-25.apk

# 3. Run the full suite
maestro test flows --format=JUNIT --output=artifacts/report.xml

# 4. Record a video of one flow (Beta, local rendering — no cloud account)
maestro record flows/checkout/checkout-happy-path.yaml artifacts/videos/checkout-happy-path.mp4 --local
```

## Fallback: `adb shell screenrecord`

`maestro record --local` is Beta. If it proves unreliable (especially in headless CI), fall back
to Android's own screen recorder, which is stable and needs no Maestro-specific support:

```bash
adb shell screenrecord /sdcard/flow.mp4 &
RECORD_PID=$!
maestro test flows/checkout/checkout-happy-path.yaml
kill -INT $RECORD_PID
adb pull /sdcard/flow.mp4 artifacts/videos/checkout-happy-path.mp4
```

## Generating the evidence gallery

After a run produces `artifacts/report.xml` and `artifacts/videos/*.mp4`:

```bash
npm run gallery
```

This reads the JUnit report and the recorded videos and emits `artifacts/gallery/index.html` —
the page published to GitHub Pages under `/mobile/`.
