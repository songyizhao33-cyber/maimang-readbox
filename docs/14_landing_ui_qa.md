# Landing UI QA

## Acceptance Date

2026-05-13

## Commit Under Test

- Application commit: `ccc7a4f feat: redesign landing page with bilingual experience`
- QA artifact commit: see git history after T60 is committed

## Production URL

https://maimang-readbox.vercel.app

## Scope

T60 validates the T59 landing page redesign after deployment. The scope is browser-level landing page QA, bilingual switching, responsive layout checks, key public route checks, copy safety, and MVP smoke validation. It does not add product features or change backend behavior.

## Desktop Checks

- Viewport: 1440 x 1000
- Default Chinese landing page rendered.
- English switch rendered the English title.
- Refresh preserved `maimang-locale=en`.
- Switching back to Chinese wrote `maimang-locale=zh`.
- Primary CTA was visible and navigated to `/register`.
- Authors, Login, Register, and API Health links were present and reachable.
- No horizontal overflow was detected.
- Dark product-principle area met readable text contrast checks.

## Tablet Checks

- Viewport: 768 x 1024
- Chinese and English titles rendered without overflow.
- Navigation wrapped without horizontal overflow.
- Language switch remained clickable.
- Primary CTA remained clickable.
- Dark section text remained readable.

## Mobile Checks

- Viewport: 390 x 844
- Chinese and English titles rendered without horizontal overflow.
- Top navigation remained visible and wrapped instead of overflowing.
- Primary CTA and language switch remained clickable.
- Footer remained readable.
- No black-on-black text was detected in the dark section.

## Language Checks

- Default locale: Chinese.
- English switch: passed.
- `localStorage` persistence key: `maimang-locale`.
- Refresh persistence for `en`: passed.
- Refresh persistence for `zh`: passed.
- No locale route prefix or full i18n framework was introduced.

## CTA And Route Checks

- Main CTA: visible, non-empty, and clickable.
- Main CTA target for anonymous users: `/register`.
- Secondary CTA target: `/authors`.
- `/authors`: 200.
- `/login`: 200.
- `/register`: 200.
- `/api/health`: 200.
- API Health is present in the footer and not in the hero CTA area.

## Copy And Safety Checks

The landing page was checked for absence of:

- `核心闭环`
- `明确不做`
- `MVP navigation`
- `Product boundary`
- `T59`
- `Txx` task markers

The landing page was checked for absence of sensitive or internal data strings:

- `userId`
- `user_id`
- `email`
- `service_role`
- `token`
- `original_content`
- `extracted_content`

## Screenshots

Screenshot capture is supported by `tests/landing-qa.mjs` with:

```powershell
$env:LANDING_QA_SCREENSHOTS="1"
$env:LANDING_QA_SCREENSHOT_DIR="docs/qa-screenshots"
node --use-env-proxy tests/landing-qa.mjs
```

T60 does not commit screenshot PNG files by default to keep the repository small. The browser QA script captures:

- `docs/qa-screenshots/landing-desktop-zh.png`
- `docs/qa-screenshots/landing-desktop-en.png`
- `docs/qa-screenshots/landing-mobile-zh.png`
- `docs/qa-screenshots/landing-mobile-en.png`

## Smoke Result

- Local production smoke: passed.
- Production smoke: passed.
- Smoke scope remained users=3, published articles=2, externalItems=1, collections=1, public article traces, and reading traces.

## Known Issues

- No Playwright dependency is currently installed in the project.
- The committed QA script uses the locally installed Chromium-compatible browser through Chrome DevTools Protocol instead of adding a new dependency.
- Screenshot PNGs are generated on demand and are not committed by default.

## Go / No-Go

Go.

The T59 landing page is acceptable for small-scope user review. No backend, schema, RLS, or smoke harness changes were required.
