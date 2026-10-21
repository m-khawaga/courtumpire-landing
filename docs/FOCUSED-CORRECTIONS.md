# Focused local corrections — 21 October 2026

> Current checklist/template, four-game format, optional club logo, navigation, analytics and contact behavior is documented in [the latest local review](CHECKLISTS-FORMATS-UPDATE.md). Earlier exports remain available as historical reviews.

This pass continues `C:\courtumpire-landing-pr5-test` on `codex/practice-planner-local`. Existing changes and version-1 browser records are preserved. No push, merge, deployment, hosting change, Search Console submission, or Android/Wear OS modification is authorized or performed. Advertising remains off; commerce remains documentation only.

## Result cards and clear actions

`tools/result-card.mjs` remains the shared canvas renderer for manual cards and completed-scoreboard imports. Equal 164 px player panels use measured text baselines. Each main score is centered independently under its column heading; raised, lighter parenthesized set-tiebreak points no longer shift the main value. Three-column spacing accommodates the supported three-digit detail. Long names wrap and reduce font size within the name area; the trophy/Winner badge stays nearby without changing row dimensions. A narrow winner accent uses the existing palette. Deciding match-tiebreak scores are plain values under “Match TB / points”; the redundant sentence is removed. The scoring and winner rules are unchanged.

The final dark-card QR uses a **124 px subtly rounded off-white backing**, with a 120 px transparent dark-module SVG including its quiet zone. A transparent light-on-dark trial decoded at full size but failed the 540 px card-width test; the fallback passed. The entire exported card stays opaque. Light cards use dark modules directly; PDFs retain the existing black-on-white QR. All encode exactly `https://courtumpire.com/`.

`scripts/QrTool.java` uses the Android project's already cached ZXing 3.5.3 encoder at error-correction M. Its SVG renderer gently rounds exposed data-module corners with quadratic curves, keeps finder patterns square, and preserves four full quiet-zone modules on every side. It never clips the QR image or deletes modules. Regenerate with the cached ZXing jar on Java's classpath and `scripts/QrTool.java rounded assets/website-qr-rounded-dark.svg dark`. There is no QR runtime dependency or remote request.

The unreadable button was a native `<button>` carrying the link-only `text-link` class. `.section-action` in `tools/tools.css` now provides consistent secondary styling, 14 px separation, a 44 px touch target, contrast in normal/hover/disabled states, and visible keyboard focus. All clear controls are `type="button"`. Optional points clear separately from games; set clears affect only their own row. The deciding action says “Clear match tiebreak”. Every clear immediately validates, refreshes or hides the preview, and updates download availability. Names/settings/other sets persist.

## Rotations and planning modes

`tools/rotations.mjs` treats configured courts as available. Active courts are `min(available courts, floor(players / players-per-court))`. The first configured labels are used in their original order, and the remaining labels stay visible as unused. No incomplete teams or extra court identities are invented.

“Maximize playing time” is the default. “Include rest rounds” uses one fewer court if everyone would otherwise play and at least one full court can remain active; existing surplus-player rests remain in both preferences. If only one complete court can be kept playing, the planner explains why it cannot introduce rests. Least-used participants and longest waits have deterministic priority. Whole-round rest is distinct from between-round breaks. The actual participation spread is reported; when playing places do not divide equally across players, equal rest is explicitly described as impossible for that player/round count. The greedy pairing heuristic does not promise optimal pairings.

`tools/schedule-settings.mjs` owns timing calculations. `planningMode` is `duration` (default for old saved records) or `rounds`. Only the selected budget is parsed/validated; the inactive input is hidden/disabled but its value remains in the saved version-1 settings. Number-of-rounds mode computes `rounds × playing duration + (rounds − 1) × break`; it does not read the total-duration field. The summary, copied text, print metadata and schedule use the same computed result. Civil-date rollover is explicit.

Current bounds: 2–32 singles participants or 4–32 doubles participants; 1–8 available courts; 1–36 complete rounds; playing time 00:01–02:00 and breaks 0–15 minutes. Total-duration mode accepts 00:10–06:00; round-count mode derives duration and can exceed six hours. Clock times are event-local; daylight-saving transitions need organizer review. Levels remain informational, without skill balancing. No partial matches are generated for balance.

## Score sheets

`tools/club-documents.mjs` generates one integrated main score table. Each normal set cell has a games area and a smaller optional TB-points area. A deciding match-TB column has points only. Possible pre-match columns still come from the shared format definitions. The separate TB table and duplicate participant block are removed; names remain in the main table. The required short TB note, service-order information, event details, shared brand/QR header, eight notes rows, final result, optional signatures and notes remain.

Standard samples fit one A4 page with backgrounds off. Long names or event information can legitimately add pages; the shared compact branded continuation header remains available. This is a handwriting sheet, not a fillable PDF form.

## Local review and verification

From PowerShell:

```powershell
Set-Location C:\courtumpire-landing-pr5-test
npm run build
npm run preview
```

Reuse an existing preview on port 4173, or set `$env:PORT='4174'` before `npm run preview` if that port is occupied. Open `/play-score/result-card/`, `/clubs-coaches/rotation-planner/`, and `/clubs-coaches/match-score-sheet/` on the printed local origin. Stop a server you start with Ctrl+C. No installation is needed.

Checks: `npm test` passed 30 tests; `npm run lint` verified 42 routes, unique titles and 40 sitemap canonicals. `npm run test:focused-corrections` passed 42 browser assertions, with no external requests or page errors. Only affected card checks were repeated after the QR fallback/superscript fix (22 passed), and only the affected PDFs were regenerated while correcting observed pagination. Final artifacts include six downloaded PNGs, four actual Chrome PDFs, desktop/mobile screenshots, button-state crops and Poppler-rendered PDF pages. Six full PNGs, six 540 px reductions, and four rendered PDF first pages all decoded exactly with ZXing (16 successful checks). These automated checks establish neither universal phone compatibility nor physical printer output; neither physical test was performed.

The ignored review folder is `C:\courtumpire-landing-pr5-test\.local-review\focused-corrections-2026-10-21`. Start with its `REVIEW.md`; authoritative final files are in `exports/`, `screenshots/` and `pdf-pages/`. Earlier intermediate renders are retained as diagnostic evidence, not final previews. The earlier coordinated-update notes remain historical where this document supersedes them.

The previously reported four Search Console indexing cases remain unverified without their affected URLs. No global noindex removal, redirect change, homepage canonicalization, or hosting-level fix is claimed in this pass.
