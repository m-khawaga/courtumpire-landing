# Current local review — 21 October 2026

This supersedes the earlier local-review reports for the affected features. The existing static GitHub Pages site and unrelated working changes are preserved. Nothing was pushed, merged, deployed, submitted to Search Console or changed remotely. No contact backend, new provider, production analytics, advertising or shop was activated.

## Implemented

- Contact's selectable address is larger and centered over both actions. Optional topics, encoded subjects, general contact, privacy link and honest copy feedback remain. The active navigation tab has one continuous, reserved underline; focus and one-open-menu behavior remain.
- Printable-kit cards size to content. One selected, full-width configuration panel follows the cards, with a document preview and links into the existing editors. Mobile selection focuses and scrolls to that panel. Ordinary content has no nested scrolling.
- Removed checklist rows match active-row width and have labelled Restore/Delete actions. The compact section includes its count and disappears when empty. Confirmed permanent deletion persists in the selected checklist; matching legacy entries are pruned only after the current save succeeds. Default restoration explicitly adds missing defaults without losing checked active/custom items or duplicating entries. Deleted custom reminders stay deleted. Active printed items retain checkmarks; removed/deleted items are excluded.
- The scorer has stable Undo, Export and quiet Reset actions. Confirmed reset retains configuration/names, restores the configured first server and clears points, sets, winner and undo history. Cancellation preserves the match. The serving ball has fixed reserved space on both sides, including AD, long names and four-digit tiebreak points at narrow widths.
- Completed and unfinished score exports share the existing card renderer, CourtUmpire/optional club branding and QR. Unfinished cards say “In progress”, retain completed sets/current games/points and declare no winner. Export failures preserve the match and give feedback.
- Understand score now uses shared four/six-game definitions with singles/doubles service-order examples. Four-game sets follow the established site/app convention: tiebreak at 4–4, resulting set 5–4. Six-game sets trigger at 6–6, resulting set 7–6. Both use seven-point, win-by-two set tiebreaks; no-ad, no-let and deciding-match-tiebreak options remain independent. Accurate Games/Points sublabels appear in scoring and printable tables.
- The local quiz offers 5, 10 (default), 20 or all 100 questions, shuffled without duplicates. Answer submission gates explanations/navigation; submitted answers lock. Revisits preserve answers, reset/count changes confirm loss, and completion provides score/missed-answer review. No persistent quiz history or visitor identifier is created.
- All 50 activities participate in static activity pages, player collections, filters, related links, planner selection and printable plans. Existing IDs/URLs and saved-plan compatibility remain. Requirements, safety guidance and accessible SVG descriptions accompany the activities. No fake video or VideoObject markup is added.

## Content and its limits

The quiz contains **100** distinct entries in [tools/quiz.mjs](../tools/quiz.mjs), preserving the original IDs. Each includes category, difficulty, answer, explanation and source/rule reference. The editorial check used the official [ITF Rules of Tennis 2026](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf); see [source review and assumptions](QUIZ-SOURCES.md). This is an editorial source review, not independent expert certification or ITF endorsement.

The activity catalogue contains **50** activities: the original 16 in [practice/catalogue.mjs](../practice/catalogue.mjs) plus 34 in [practice/catalogue-extra.mjs](../practice/catalogue-extra.mjs). Coverage is 10 solo, 14 two-player, 13 three-player and 13 four-player activities. Counts are derived from the combined catalogue. See [content review](ACTIVITY-CONTENT.md). The new activities received an editorial feasibility/diagram review, not physical court trials or independent coaching certification.

## Privacy, storage, analytics and SEO

Contact remains mailto/copy only. Actual email-enquiry information and the contact URL, canonical, footer and sitemap link remain. The abandoned local contact Worker, email binding/configuration, dedicated rate-limit/idempotency Durable Object, backend mock/tests/scripts, endpoint configuration and provider-only draft privacy/setup wording were removed earlier in this run. No production backend dependencies had been installed. Shared features were retained; no remote resources were created or removed. [Removal details](CONTACT.md).

The Privacy Policy now explains saved practice, match configuration/history, shared event/logo and checklist data (including removed entries), and their reset/deletion/site-data controls. Quiz order and answers remain in memory. Permanent deletion reports a storage failure instead of promising persistence.

Existing consent gating, rejection/withdrawal and the production account-review guard remain. Useful categorical events cover quiz start/completion, drill use, confirmed reset, successful exports and contact intent. Numeric question/correct counts are bounded; pre-consent actions are dropped, not replayed. Names, reminders, logo data, email addresses, message contents and complete mailto links are excluded. Local tests block external requests and never send production analytics. [Event schema and later account checks](ANALYTICS-USAGE.md).

All 50 activity pages have substantive initial HTML, unique metadata, canonical URLs and internal links. XML/human sitemaps now contain 74 production canonicals. Filter/session/print/preview combinations remain excluded; the compatibility route and intentional 404 behavior remain. Production robots/canonicals were checked. Previously reported Search Console cases remain unresolved without the affected URLs; no live account or hosting-header changes were made. Future ad/shop architecture remains inactive.

## Verification actually performed

- `npm run build`: successful static generation; 76 registered routes, 74 production canonical pages.
- `npm run lint`: 67 scripts and route/sitemap consistency passed.
- `npm test`: 43 unit tests passed.
- `npm run test:expansion`: **185 checks** passed, exactly 100 questions/50 activities, no page errors/external requests. Covers layouts, checklist migration/deletion/default restoration, reset/cancel, stable serving indicators, export failure/live/completed/tiebreak cards, helper formats, quiz gating/scoring, activity filters/planner and consent boundaries. [Machine report](../.local-review/expansion-2026-10-21/verification.json).
- `npm run test:contact`: **81 checks** passed; desktop/mobile, selection/keyboard, encoded subjects, success/failure feedback, consent/metadata. [Report](../.local-review/expansion-2026-10-21/contact/verification.json).
- `npm run test:seo`: **10,455 checks** passed across 74 canonicals and 160 internal destinations, with zero external requests.
- Two actual PDFs were generated with background graphics disabled, rendered and inspected: active checklist (one page), expanded practice plan (three pages). Full first-page branding, compact continuation branding, sample club logo, active checkmarks, exclusions and QR were checked. Four actual score PNG downloads cover ordinary live, set-tiebreak live, deciding-tiebreak live and completed four-game results. Ten QR decodes (four PNGs, four reduced-to-540px PNGs, two first-page PDF renders) matched exactly `https://courtumpire.com/`.

No real email was sent, physical printer/device trial performed, remote CI triggered or live analytics delivery verified. Older broad browser suites were not rerun; their earlier limitations remain historical rather than new pass claims.

## Local commands and review

From PowerShell in `C:\courtumpire-landing-pr5-test`:

```powershell
npm run build
npm run lint
npm test
$env:PORT='4174'
npm run preview
```

The preview actually used during review printed **http://127.0.0.1:4174**. The owned preview process is stopped at handoff; restart it with the commands above and stop it with Ctrl+C. An unrelated pre-existing process on 4173 was left alone.

Browser checks use the existing runtime, without installing dependencies:

```powershell
$env:NODE_PATH='C:/Users/mKhaw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
$env:BROWSER_CHANNEL='chrome'
$env:CONTACT_REVIEW_DIR='.local-review/expansion-2026-10-21/contact'
npm run test:contact
npm run test:expansion
npm run test:seo
```

Review `/contact.html`, `/clubs-coaches/tennis-kit/`, `/clubs-coaches/session-checklist/`, `/play-score/scoreboard/`, `/play-score/tiebreak-calculator/`, `/play-score/umpire-challenge/` and `/tennis-drills/`. Canonical routes are defined in `practice/routes.mjs`.

## Review artifacts

All current captures are under [.local-review/expansion-2026-10-21](../.local-review/expansion-2026-10-21/):

- [Contact desktop](../.local-review/expansion-2026-10-21/contact/contact-desktop.png), [mobile](../.local-review/expansion-2026-10-21/contact/contact-mobile.png), copy-success/failure and focus captures in the same folder.
- [Kit desktop](../.local-review/expansion-2026-10-21/screenshots/kit-checklists-desktop.png), [mobile](../.local-review/expansion-2026-10-21/screenshots/kit-checklists-mobile.png).
- [Checklists desktop](../.local-review/expansion-2026-10-21/screenshots/checklists-desktop.png), [mobile](../.local-review/expansion-2026-10-21/screenshots/checklists-mobile.png).
- [Scorer desktop](../.local-review/expansion-2026-10-21/screenshots/scorer-export-desktop.png), [mobile](../.local-review/expansion-2026-10-21/screenshots/scorer-export-mobile.png), [live score PNG](../.local-review/expansion-2026-10-21/exports/score-in-progress.png), [completed PNG](../.local-review/expansion-2026-10-21/exports/score-completed.png). Live set/deciding tiebreak exports and reduced sharing copies are in `exports/`.
- [Understand score](../.local-review/expansion-2026-10-21/screenshots/understand-score-desktop.png), [quiz desktop](../.local-review/expansion-2026-10-21/screenshots/quiz-desktop.png), [mobile](../.local-review/expansion-2026-10-21/screenshots/quiz-mobile.png), [completed review](../.local-review/expansion-2026-10-21/screenshots/quiz-completed.png).
- [Activity desktop](../.local-review/expansion-2026-10-21/screenshots/activity-desktop.png), [mobile](../.local-review/expansion-2026-10-21/screenshots/activity-mobile.png).
- [Checklist PDF](../output/pdf/expansion-2026-10-21/checklist-active-items.pdf), [practice PDF](../output/pdf/expansion-2026-10-21/practice-expanded-library.pdf), raster inspections in `rendered/`. “Sample Tennis Club” is test artwork, not an affiliation.
