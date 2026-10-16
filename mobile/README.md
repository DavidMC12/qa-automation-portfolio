# Mobile — Maestro suite

Target app: [Sauce Labs "My Demo App" (Android)](https://github.com/saucelabs/my-demo-app-android)
- appId: `com.saucelabs.mydemoapp.android`
- Pinned release: `2.2.0` (asset `mda-2.2.0-25.apk`)
- Test accounts (tap the pre-filled entry on the login screen to auto-fill both fields):
  `bod@example.com` / `10203040` (standard — note the app's own spelling, not "bob"),
  `alice@example.com` / `10203040` (locked out)

## Selector provenance

The flows in `flows/` were written against the app's actual source (layout XML + fragment
Java in `saucelabs/my-demo-app-android`, release 2.2.0), not guessed — each file has a comment
naming the source files used. They were validated end-to-end in CI (`mobile-tests.yml`) against
a real emulator. If a future app release changes the UI, re-derive selectors from the updated
source, or use `maestro studio` against a running instance to confirm interactively.

Five things worth knowing about this app, since each one cost a CI cycle to find:
- Login isn't the first screen — the app opens on the product catalog. Reach the login form via
  the hamburger menu ("View menu" content-description) → "Log In".
- **Only the product image is clickable in the catalog.** `ProductsAdapter` attaches the click
  listener to `productIV`; tapping the product *title* silently does nothing. Flows therefore tap
  `id: ...:id/productIV` with an index, not the product name.
- "Add to cart" lives on the **product detail** screen, below the fold inside a `ScrollView`, so
  it needs `scrollUntilVisible`. The app's own `DashboardToCheckout` Espresso test uses
  `scrollTo()` there for the same reason.
- Checkout is three screens in sequence: shipping address ("To Payment", also inside the scroll
  view) → card details ("Review Order") → order review ("Place Order"). The "billing address is
  the same as shipping" checkbox ships **checked**, so those fields stay hidden and unfilled.
- **Anything below the fold is invisible to Maestro, and the soft keyboard makes the fold move.**
  `assertVisible` and `tapOn` only match what is actually on screen, so two elements in the same
  `ScrollView` may each need their own `scrollUntilVisible` (on the detail screen, "Add to cart"
  and "Product Highlights" are never both visible). On the checkout forms the keyboard opened by
  one field covers the next, which is why every field goes through `flows/_shared/fill-field.yaml`
  — it scrolls the field into view, taps, types, and only then dismisses the keyboard.

Four traps worth knowing, none of which reproduces on a warm local emulator:
- `hideKeyboard` is a **Back press** on Android (`AndroidDriver` runs `input keyevent 4`), so it
  dismisses the keyboard only when one is actually up. Call it when there is no keyboard and it
  navigates the app backwards instead — which looks like every field on the next screen suddenly
  having a broken selector. The rule that follows: never call it *before* typing, only *after*,
  where `inputText` has just guaranteed a keyboard is open.
- **The soft keyboard swallows the scroll gesture, not just the pixels.** `scrollUntilVisible`
  swipes from the centre of the *screen*, not of the app's remaining viewport. With a keyboard up
  that centre lands on the keys, so the swipe never reaches the `ScrollView` at all: the step
  burns its full 20s timeout while the form sits perfectly still. This is why dismissing the
  keyboard after each field is load-bearing rather than cosmetic — and why "it scrolls, it just
  doesn't scroll far enough" is the wrong diagnosis. The recorded video is the fastest way to
  tell the two apart: compare two frames ten seconds apart and see whether anything moved.
- `scrollUntilVisible` only ever swipes in the direction you give it, so `centerElement: true`
  is actively harmful for an element that is already **above** the centre — scrolling `DOWN`
  pushes it off screen and the step fails with "No visible element found" on a field that was
  visible to begin with. Only centre elements you know start below the fold.
- On a freshly booted CI emulator the first launch after `adb install` can take longer than
  Maestro's default element-lookup timeout. `launchApp` still reports success and then every
  subsequent step fails with a missing element, which looks exactly like a suite full of broken
  selectors. `flows/_shared/open-app.yaml` absorbs this with an `extendedWaitUntil` on the
  catalog; if a whole run fails at its first step, suspect this before touching a selector.

A trap worth flagging: several content-descriptions have resource *names* that read like a
sentence but hold a shorter *value* — `tap_to_view_menu` is `"View menu"` and
`tap_to_view_you_cart` is `"View cart"`. Always read the value in `strings.xml`, never infer it
from the resource id.

## Local setup

```bash
# 1. Install the Maestro CLI (requires Java 17+)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# 2. Download the pinned APK and install it on a running emulator/device
#    (from https://github.com/saucelabs/my-demo-app-android/releases/tag/2.2.0)
adb install -r mda-2.2.0-25.apk

# 3. Run the full suite and record a video of every flow, exactly as CI does.
#    `maestro test flows` is NOT equivalent: it does not recurse into
#    subdirectories, and it would also pick up the `_shared/` helper subflow,
#    which is meaningless without its env vars. Run from the repo root.
bash mobile/scripts/record-flows.sh

# 4. Run a single flow
maestro test mobile/flows/checkout/checkout-happy-path.yaml
```

## How the evidence is recorded

Each flow runs once, wrapped by `adb shell screenrecord`, so the video shows the exact
execution that produced the pass/fail verdict.

This replaced `maestro record --local`, which replays a flow under xvfb to render a video. On a
green CI run the replay accounted for roughly 46 of the job's 51 minutes, against about 3.5
minutes for the seven flows themselves — so the job went from "an hour" to "a coffee".
`screenrecord` caps a file at 180 seconds; the longest flow (checkout) takes under two.

## Generating the evidence gallery

After a run produces `artifacts/report/*.xml` (one JUnit file per flow) and
`artifacts/videos/*.mp4`:

```bash
cd mobile && npm run gallery
```

This merges the per-flow reports and the recorded videos into
`artifacts/gallery/index.html` — the page published to GitHub Pages under `/mobile/`. An optional
fourth argument sets the page title (`generate-gallery.mjs <reports> <videos> <out> "<title>"`),
which is how the iOS gallery gets its own heading.

## iOS

Target app: [Sauce Labs "My Demo App" (iOS)](https://github.com/saucelabs/my-demo-app-ios)
- bundle id: `com.saucelabs.mydemo.app.ios`
- Pinned release: `2.3.0`, asset `SauceLabs-Demo-App.Simulator.zip` (a simulator build with both
  `arm64` and `x86_64` slices, so it runs on Apple-silicon runners)
- Flows live in `flows-ios/` and mirror the Android scenarios.

### What differs from Android

- **Selectors are accessibility identifiers**, not visible text or resource ids. The storyboards
  at tag 2.3.0 set them (`Catalog-screen`, `Cart-tab-item`, `ProceedToCheckout`, ...), and the
  app's own XCUITest page objects (`MyDemoAppUITests/PageObjects/PageObject.swift`) use the same
  ones.
- **There is no locked-out account.** `LoginViewController` accepts any non-empty username and
  password, so `login/missing-username.yaml` covers the validation path instead.
- **Product names are runtime accessibility labels.** The storyboard sets the identifier
  `Product Name` on every card and `CatalogViewController.cellForItemAt` copies the real name
  into `accessibilityLabel`. Match the identifier to tap "the first product" and the label to
  assert a specific one.
- **Recording uses `xcrun simctl io recordVideo`**, wrapped around each flow and stopped with
  SIGINT (a plain kill leaves an unplayable file). One JUnit file is written per flow.

### Running locally

Needs macOS with Xcode and the Maestro CLI.

```bash
gh release download 2.3.0 -R saucelabs/my-demo-app-ios -p 'SauceLabs-Demo-App.Simulator.zip' -O ios-app.zip
unzip -q ios-app.zip -d ios-app
bash mobile/scripts/boot-ios-simulator.sh "ios-app/Payload/My Demo App.app"   # exports IOS_UDID in CI
IOS_UDID=<printed UDID> bash mobile/scripts/record-flows-ios.sh
```
