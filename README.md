# QA Automation Portfolio — Web & Mobile

[![CI](https://github.com/DavidMC12/qa-automation-portfolio/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/DavidMC12/qa-automation-portfolio/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

End-to-end test automation for one e-commerce story — login → browse → cart → checkout — on
**web, Android and iOS**, running continuously in CI and publishing real evidence (reports,
traces, per-flow videos) for free, with no third-party accounts.

**Live reports:** <https://davidmc12.github.io/qa-automation-portfolio/> — [Playwright report](https://davidmc12.github.io/qa-automation-portfolio/web/) · [Android evidence gallery](https://davidmc12.github.io/qa-automation-portfolio/mobile/) · [iOS evidence gallery](https://davidmc12.github.io/qa-automation-portfolio/mobile-ios/)

## Highlights

- **Three platforms, one scenario set.** The same user journey is automated with Playwright
  (web) and Maestro (Android, iOS), so behaviour can be compared across platforms.
- **Cross-browser and visual regression.** The web suite runs on Chromium, Firefox and WebKit.
  Visual baselines come from `standard_user`, and a negative test asserts that SauceDemo's
  deliberately broken `visual_user` *is* flagged — the check goes red if the diff ever goes blind.
- **Evidence, not just a green tick.** Failing web tests keep screenshot, video and trace;
  every mobile flow is recorded and published as a gallery.
- **Measured, not guessed, pipeline work.** The Android job was profiled before it was touched:
  re-rendering the videos took ~46 of its 51 minutes while the flows themselves took ~3.5. Each
  flow is now recorded during its single execution, and the job runs in **7 minutes**. The
  reasoning is written down in [`mobile/README.md`](mobile/README.md).
- **Real debugging write-ups.** [`mobile/README.md`](mobile/README.md) documents the traps found
  while stabilising the mobile suite (soft keyboard swallowing scroll gestures, `hideKeyboard`
  being a Back press on Android, cold-emulator launches) and how each was diagnosed.
- **Tooling is tested too.** The evidence-gallery generator was written test-first
  (10 unit tests).

## What is covered

| Suite | Scenarios | Runs | Target |
|---|---:|---|---|
| Web — functional | 19 | Chromium, Firefox and WebKit (57 executions) | [SauceDemo](https://www.saucedemo.com) |
| Web — visual regression | 3 | Chromium | SauceDemo |
| Mobile — Android | 7 flows | Pixel 5 emulator, API 30 | [My Demo App (Android)](https://github.com/saucelabs/my-demo-app-android) 2.2.0 |
| Mobile — iOS | 7 flows | iPhone simulator | [My Demo App (iOS)](https://github.com/saucelabs/my-demo-app-ios) 2.3.0 |
| Unit — evidence gallery generator | 10 | Node test runner | — |

**36 end-to-end scenarios** (22 web, 14 mobile) plus 10 unit tests. The badge above is the
status of the last run on `main`; the suites also run every Monday, because the targets are
third-party apps that can change without a commit here.

To reproduce the numbers:

```bash
(cd web && npx playwright test --list --project=chromium --project=visual)   # web: 22 scenarios
find mobile/flows mobile/flows-ios -name '*.yaml' ! -path '*/_*' ! -name config.yaml | wc -l   # mobile: 14
npm run test:unit                                                            # unit tests
```

## Stack

| Layer | Tool | Target |
|---|---|---|
| Web | Playwright (TypeScript, Page Object Model) | [SauceDemo](https://www.saucedemo.com) |
| Mobile | Maestro | Sauce Labs My Demo App (Android and iOS) |
| CI/CD | GitHub Actions | — |
| Evidence | Playwright HTML report + Maestro per-flow videos | Published to GitHub Pages |

## Repository structure

```
web/                Playwright + TypeScript suite (Page Object Model)
  pages/             one class per screen
  fixtures/          test users and checkout data
  tests/             *.spec.ts (functional)
  tests/visual/      visual regression specs and their baselines

mobile/              Maestro suite
  flows/             Android flows (*.yaml)
  flows-ios/         iOS flows, mirroring the Android scenarios
  scripts/           simulator boot, recording and the evidence gallery generator (tested)

.github/workflows/
  web-tests.yml                 Playwright suite — PRs touching web/
  mobile-tests.yml              Android Maestro suite — PRs touching mobile/
  mobile-ios-tests.yml          iOS Maestro suite (macOS runner) — PRs touching the iOS flows
  pages.yml                     "CI": runs all three suites, deploys the combined report to Pages
  update-visual-baselines.yml   manual: regenerates screenshot baselines on the CI OS
```

## Running locally

### Web

```bash
npm install
npx playwright install chromium firefox webkit
npm run test:web                                          # all browsers + visual
(cd web && npx playwright test --project=firefox)         # a single project
npm run typecheck                                         # tsc over the suite
npm run report --workspace web                            # open the HTML report
```

### Mobile

See [`mobile/README.md`](mobile/README.md) for full setup (Maestro CLI install, pinned APK,
`maestro studio` selector verification, and how the evidence is recorded). iOS flows need macOS
with Xcode; they are exercised in CI on a `macos-15` runner.

## CI/CD

- **`web-tests.yml`** / **`mobile-tests.yml`** / **`mobile-ios-tests.yml`** — fast PR feedback,
  each triggered only when its own folder changes, each also `workflow_call`-reusable.
- **`pages.yml`** — on push to `main` (and weekly), calls the three suites, merges their
  evidence, and deploys a single GitHub Pages site with `/web/`, `/mobile/` and `/mobile-ios/`.
- **`update-visual-baselines.yml`** — run by hand from the Actions tab on a branch; regenerates
  the screenshot baselines on `ubuntu-latest` and commits them back.
- Dependabot keeps the pinned actions and npm packages current.

## Evidence & reporting

- **Web:** Playwright's built-in HTML reporter — screenshots, video, and full traces are kept
  for failing tests only (`retain-on-failure`), so the published report stays focused on what's
  worth inspecting. A failing visual comparison also uploads its expected/actual/diff images.
- **Mobile:** Maestro has no built-in HTML report, so `mobile/scripts/generate-gallery.mjs`
  (unit-tested, see `mobile/scripts/generate-gallery.test.mjs`) turns the JUnit output and the
  recorded `.mp4` files into a static gallery page, one per platform.

## Key decisions

- **SauceDemo + My Demo App**, not unrelated targets — all three are e-commerce demo apps with
  matching accounts (`standard_user`/`locked_out_user` on web, `bod@example.com`/
  `alice@example.com` on Android — the app's own spelling — and `bob@example.com` on iOS), so
  the same login → browse → cart → checkout story is demonstrated on every platform.
- **Maestro over Appium** — Appium requires managing a server, capabilities, and typically more
  brittle XPath locators; Maestro's declarative flows and built-in device/session handling are
  a better fit for a focused portfolio project.
- **No Maestro Cloud** — its cloud plans start at $250/device/month (only a time-limited trial is
  free), so evidence is recorded locally in CI instead, at zero cost: `adb shell screenrecord`
  on Android and `xcrun simctl io recordVideo` on iOS, each wrapped around a single execution of
  the flow.
- **Visual regression in one browser, functional tests in three** — a screenshot baseline is only
  valid for the engine and OS that produced it, so baselines are captured once, on Chromium and
  the CI's Linux, and regenerated there by a workflow rather than on a laptop.
- **`visual_user` is asserted to differ, not to match** — it is a deliberately broken account, so
  the suite checks that it is flagged as different from the `standard_user` baseline. Prices are
  hidden with CSS (layout intact) because that account randomises them on every load.
- **iOS differs from Android where the app differs** — the iOS demo app never validates
  credentials (any non-empty username and password logs in), so the locked-account flow becomes
  a missing-username validation flow. It also has no keyboard handling at all, so its keyboard
  can never be closed and covers the checkout button: the iOS suite stops at shipping-form
  validation instead of completing a purchase. Three workarounds were tried and are recorded in
  [`mobile/README.md`](mobile/README.md).

## Roadmap

- API-level tests alongside the UI suites.
- Accessibility checks (axe) on the web flows.
- Sharding the Android flows across parallel emulators if the suite grows.
