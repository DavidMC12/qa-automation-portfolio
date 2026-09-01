# QA Automation Portfolio — Web & Mobile

Cross-platform end-to-end test automation with continuous execution and real evidence, published free of charge with no third-party accounts.

**Live reports:** <https://davidmc12.github.io/qa-automation-portfolio/> — [Playwright report](https://davidmc12.github.io/qa-automation-portfolio/web/) · [Maestro evidence gallery](https://davidmc12.github.io/qa-automation-portfolio/mobile/)

## Stack

| Layer | Tool | Target |
|---|---|---|
| Web | Playwright (TypeScript) | [SauceDemo](https://www.saucedemo.com) |
| Mobile | Maestro | [Sauce Labs My Demo App (Android)](https://github.com/saucelabs/my-demo-app-android) |
| CI/CD | GitHub Actions | — |
| Evidence | Playwright HTML report + Maestro `record --local` videos | Published to GitHub Pages |

## Repository structure

```
web/                Playwright + TypeScript suite (Page Object Model)
  pages/             one class per screen
  fixtures/          test users and checkout data
  tests/             *.spec.ts

mobile/              Maestro suite
  flows/             *.yaml, mirroring the web scenarios
  scripts/           evidence gallery generator (TDD'd)

.github/workflows/
  web-tests.yml       Playwright suite — runs on PRs touching web/
  mobile-tests.yml    Maestro suite — runs on PRs touching mobile/
  pages.yml           runs both suites and deploys the combined report to Pages
```

## Running locally

### Web

```bash
npm install
npx playwright install chromium
npm test --workspace web
npm run report --workspace web   # open the HTML report
```

### Mobile

See [`mobile/README.md`](mobile/README.md) for full setup (Maestro CLI install, pinned APK,
`maestro studio` selector verification, and the `adb shell screenrecord` fallback for evidence
recording).

## CI/CD

Three workflows, split so the expensive mobile emulator job isn't run twice per merge:

- **`web-tests.yml`** / **`mobile-tests.yml`** — fast PR feedback, triggered only when their
  respective folder changes, each also `workflow_call`-reusable.
- **`pages.yml`** — on push to `main`, calls both suites, merges their evidence, and deploys a
  single GitHub Pages site with `/web/` and `/mobile/` sections.

## Evidence & reporting

- **Web:** Playwright's built-in HTML reporter — screenshots, video, and full traces are kept
  for failing tests only (`retain-on-failure`), so the published report stays focused on what's
  worth inspecting.
- **Mobile:** Maestro has no built-in HTML report, so `mobile/scripts/generate-gallery.mjs`
  (unit-tested, see `mobile/scripts/generate-gallery.test.mjs`) turns the JUnit output and the
  recorded `.mp4` files into a static gallery page.

## Key decisions

- **SauceDemo + My Demo App**, not two unrelated targets — both are e-commerce demo apps with
  matching accounts (`standard_user`/`locked_out_user` on web, `bob@example.com`/
  `alice@example.com` on mobile), so the same login → browse → cart → checkout story is
  demonstrated on both platforms.
- **Maestro over Appium** — Appium requires managing a server, capabilities, and typically more
  brittle XPath locators; Maestro's declarative flows and built-in device/session handling are
  a better fit for a focused portfolio project.
- **No Maestro Cloud** — its cloud plans start at $250/device/month (only a time-limited trial is
  free), so evidence is generated locally with `maestro record --local` instead, at zero cost.

## Roadmap

- Visual regression coverage using SauceDemo's `visual_user`.
- Cross-browser runs (Firefox, WebKit) in `web-tests.yml`.
- iOS coverage via `saucelabs/my-demo-app-ios`.
