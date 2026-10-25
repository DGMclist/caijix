# Automatic report publication themes

The existing report template already loads `assets/site.js` and `assets/style.css`. Theme runtime and theme CSS are now bundled into these two existing assets. A newly generated report works even if the generator does not emit the three dedicated theme head tags. No per-report manual preparation command is required for normal HTML-only generation.

## Date contract

At page initialization, the existing `share-data` JSON's `meta.day` is authoritative. The optional `meta[name=report-date]` is an early-render hint used before report JSON is available. At deferred initialization, actual report data wins over a stale head hint. Dates are strictly validated as YYYY-MM-DD with UTC weekday arithmetic. A dated canonical URL, when present, must agree. Invalid/corrupt report data or a conflicting canonical date falls back to the original purple. No visitor clock, timezone, file timestamp or fabricated report date is used.

A report dated 2026-10-25 remains Sunday's mint even if opened on Monday. A newly generated report dated 2026-10-26 uses Monday's blue.

## Colors and behavior

Monday #4568FF; Tuesday #FF7138; Wednesday #F45BAA; Thursday #C8F169; Friday #C47C60; Saturday retains the original purple page accents; Sunday #72F5D0. GPT. and A badges use lighter tonal gradients in each day's hue, including softer purple on Saturday. Original dimensions, text, layout, dark background, video playback and folding logic remain intact.

## Source maintenance

- `assets/report-theme.js` is the authoritative theme runtime.
- `assets/report-theme.css` is the authoritative theme-specific CSS.
- `node scripts/install-report-theme-assets.cjs` updates the bounded, clearly marked theme blocks in the existing site.js and style.css. Run this when changing theme source or rebuilding shared assets, not once per report.
- `node scripts/prepare-report-themes.cjs` is an optional publisher validation/early-render optimization: it validates all reports, installs shared theme blocks and writes the three head hints. The runtime fallback makes those hints optional.

The public repository does not include the external report generator. That generator has not been modified or claimed to be modified. Instead, automatic date integration is implemented inside the existing website entry points, and tested against generated HTML with all dedicated theme tags removed. Shared assets must be deployed from the updated repository, as with any website change.

## Verification

`node scripts/test-report-badges.cjs`: seven palettes, valid and invalid dates, original Saturday page accents, badge text contrast (minimum 5.90:1).

`node scripts/test-report-theme-autowire.cjs`: all seven weekdays and all five reports without dedicated theme tags; stale metadata; invalid/corrupt/conflicting dates; return to original Saturday accents; shared runtime/CSS inclusion; idempotent asset installer.

The existing optional browser regression script remains `scripts/test-report-themes.cjs`, with baseline commit afda9c1f405d5a882c2a4ab38642a4fa052d86d8 (override via THEME_BASELINE_REF). It requires Playwright and Microsoft Edge. Its date fixtures now update report data and canonical URL together, matching the stricter publication date contract. Browser tests have not been rerun for this integration update; deterministic source/date integration checks have been run.
