# Report publication themes

Based on the approved foldable-phone version at `afda9c1`. Theme review controls and standalone preview pages are not part of the published source.

## Date contract

This public repository contains generated static HTML, not the report generator or a deployment workflow. Existing `share-data` JSON contains `meta.day` (YYYY-MM-DD); each report's canonical URL and visible TODAY date agree with it. The root and `/radar/` are copies of the latest issue, not reports for the visitor's current day.

`node scripts/prepare-report-themes.cjs` validates publisher `meta.day` against the canonical issue URL, then adds `meta[name=report-date]` and the shared theme assets to all five HTML pages. It is idempotent and validates all pages before writing. An invalid date or a conflicting canonical URL stops preparation. It never derives publication date from system time, Git history, file timestamps or visitor timezone.

The smallest ongoing integration is to run that command after HTML generation and before publishing. Alternatively, have the external generator emit the same three head elements directly using its issue publication day. This external producer is not available in the public repository and has not been changed. A publisher that overwrites HTML without this integration will remove the theme hooks.

Runtime uses UTC weekday arithmetic on the explicit date-only publication field. Monday #4568FF; Tuesday #FF7138; Wednesday #F45BAA; Thursday #C8F169; Friday #C47C60; Saturday inherits the existing purple page accents including #b48ae5/#8350bb/#693998/#462064; Sunday #72F5D0. Missing/invalid metadata or disabled JavaScript preserves the original purple. New reports need a real publication day, not a collection-window or next-scheduled-run date.

## Scope

Colors affect existing accent variables, translucent decorative gradients, border and hover effects, phone edge shadow, heading underlines and data highlights. GPT. and A badges use lighter tonal gradients derived from each day's accent, including a softer purple on Saturday. Their lettering, dimensions and positions remain unchanged. Text/font/layout and the dark neutral background stops are unchanged. Phone transforms, timing, source selection, media events, share rendering and navigation code are unchanged. Hardware photography remains unchanged.

Native video controls receive CSS `accent-color`. Native progress bar rendering is controlled by the browser and is not guaranteed to adopt this value on every browser, especially iOS. Embedded platform players cannot be recolored from this page. No replacement player or new playback controls were introduced.

## Changed files

- `assets/style.css`: existing purple translucent effects use a theme RGB variable with their exact original values as fallbacks.
- `assets/report-theme.js`: strict publication date validation and weekday tokens; synchronous head execution avoids an initial purple flash.
- `assets/report-theme.css`: paint-only phone, title, data and interaction effects.
- `index.html`, `radar/index.html`, `radar/2026-10-23/index.html`, `radar/2026-10-24/index.html`, `radar/2026-10-25/index.html`: only three head entries added; body content untouched.
- `scripts/prepare-report-themes.cjs`: publisher integration.
- `scripts/test-report-themes.cjs`: repeatable browser regression checks.
- `THEME-INTEGRATION.md`: integration, verification and deployment notes.

## Verification

Run `node scripts/prepare-report-themes.cjs`, then `node scripts/test-report-themes.cjs` with Playwright installed and Microsoft Edge available. Set `PLAYWRIGHT_MODULE` to a module location if needed; `THEME_TEST_OUTPUT` chooses the screenshots/evidence folder.

Run `node scripts/test-report-badges.cjs` for dependency-free palette and contrast checks. Browser regression comparisons use the approved pre-theme commit `afda9c1` as their baseline; override with `THEME_BASELINE_REF` when deliberately updating that baseline.

Tests compare all seven themes against the published baseline at 1440, 390 and 320 pixels. The existing random video shuffle is held constant. External thumbnail images use a fixture; local hardware and media images remain real. Tests assert exact theme tokens, unchanged text, link targets, measured heading/statistics/media positions, white body text, no horizontal overflow and unchanged Saturday gradients. Five actual pages are checked in three timezones. Invalid/missing dates fall back to purple.

A browser-encoded local WebM tests real decoded playback, five-second fold opening, continuous video, pause/resume, sound toggle, inline media handoff, close controls and embedded-player creation. Third-party media availability is not certified by this fixture. Browser coverage is desktop Chromium/Edge with mobile viewport emulation, not physical iOS/Android devices.

## Deployment after approval

1. Review this change against the latest `gh-pages`; preserve any newer report or animation changes.
2. Add the preparation step to the external publisher (or add the three head elements to its template). Run preparation after each report generation.
3. Run the checks above and inspect screenshots.
4. Only after explicit approval, commit the reviewed files and push to `gh-pages` using the site's existing GitHub Pages publishing setup. This implementation has not changed Pages settings.
5. Verify the live root and `/radar/` show the latest issue's weekday, old dated URLs retain their own colors, all new assets load and the phone/player still work.
