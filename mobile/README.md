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
  — it dismisses the keyboard, centres the field, types, and dismisses again.

Two CI-only traps, neither of which reproduces on a warm local emulator:
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

# 3. Run the full suite, exactly as CI does. `maestro test flows` is NOT equivalent:
#    it does not recurse into subdirectories, and it would also pick up the
#    `_shared/` helper subflow, which is meaningless without its env vars.
bash scripts/record-flows.sh   # run from the repo root

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
