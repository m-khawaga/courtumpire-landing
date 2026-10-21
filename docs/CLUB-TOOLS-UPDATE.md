# CourtUmpire coordinated club-tools update — 21 October 2026

> Current checklist/template, four-game format, optional club logo, navigation, analytics and contact behavior is documented in [the latest local review](CHECKLISTS-FORMATS-UPDATE.md). Earlier exports remain available as historical reviews.

> The later [focused corrections](FOCUSED-CORRECTIONS.md) supersede the card layout/QR, spare-court handling, planning modes and integrated score-sheet details in this historical update. Use that guide for the current behavior and review exports.

Local work in `C:\courtumpire-landing-pr5-test`, branch `codex/practice-planner-local`. Existing uncommitted work was retained. No push, merge, deployment, publishing, hosting/DNS change, app modification, advertising activation or commerce implementation.

## Local preview

```powershell
cd C:\courtumpire-landing-pr5-test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/`, then review:

- `/play-score/result-card/` — manual completed-result editor.
- `/play-score/scoreboard/` — real singles scoring and separate guided demo.
- `/clubs-coaches/rotation-planner/` — filled schedules and configured blank worksheets.
- `/clubs-coaches/tournament-rules/` — rules and information handout builder.
- `/clubs-coaches/match-score-sheet/` — singles/doubles score-sheet builder.
- `/clubs-coaches/tennis-kit/` — prominent builder links, scoring reference and quick-print resources.
- `/practice-planner/`, `/site-map/`, `/sitemap.xml` — preserved practice and search/discovery pages.

Print actions open the browser’s **Print / Save PDF** dialog. They are not pre-generated download links. Use current Chrome/Edge, A4, default scale, automatic browser headers/footers off. Background graphics can remain off. CSS chooses landscape for schedules with more than two courts. Ctrl+C stops the preview. QA servers close after checks; start the review server with the commands above.

## Actual causes and fixes

| Finding reproduced / inspected | Implementation |
| --- | --- |
| Alex 6–3, 6–4, 7–6 was correctly invalid, but only a generic “Remove rows…” message and three permanently visible rows were offered | Tennis-labelled conditional sets; a winner-specific inline error, accessible summary and explicit Clear Set 3. Entered scores survive errors and reloads. |
| No input/model for normal-set tiebreak detail; the card renderer could only draw game scores | Optional separate point pairs, target/margin/winner validation, recorded live-match detail handoff, and each player’s own parenthesized superscript. Omitted detail remains omitted. Deciding match TB uses distinct bracketed point scores. |
| Preview/download had no clear refresh state; rendering did not wait for brand assets/fonts | Revision-guarded offscreen rendering, readiness message, disabled stale download and final revision check inside the PNG callback. Recoverable input stays in the editor. |
| First-server labels were static Player A/B options | Names update immediately; stable player indices/IDs preserve which player was selected. Empty values use fallbacks. Names can update an active match; format/initial-server setup changes apply to a new match. |
| A conditional Serving paragraph increased just one column’s height and moved point buttons | Actual app ball in equal reserved score-side spaces, shared grid rows and aligned buttons. Accessible serving text remains available. No emoji is used. |
| Set completion resets engine point/game counters, and the UI displayed those reset zeros after match completion | Dedicated completed presentation, fixed vector trophy, Winner label and final set table. Undo returns to active point/service state and invalidates the previous scored-result handoff. |
| Completed real matches had no path into the existing result-card editor | Create result card sends validated names, format, sets and recorded TB points through a separate local handoff. Manual drafts, scored-card drafts, real matches and demo state stay separate. |
| Numeric minute controls had no clock start, and courts were always labelled from 1 | Strict elapsed hh:mm parsing, separate start time/date, inclusive ranges/custom labels, concrete round clocks, explicit rollover, breaks only between rounds, finish/unused time and honest rest/wait totals. |
| Each old report placed title/subtitle in a fixed brand-header box | One shared print renderer: brand and QR above divider; title, event details and subtitle below. Event rows wrap, continuation branding/page numbers remain, and tables repeat headers. |
| Score sheets and blank rotations were hard-coded generic documents | Builder-generated potential set columns, distinct deciding TB/normal TB spaces, singles/doubles names, shared event data and a blank output mode in the existing scheduler. Quick-print kit sheets use the same document generators. |

## Shared modules and state

- `tools/match-formats.mjs`: supported website scoring formats, set-column definitions and stable player identity constants. The live engine remains singles/advantage only. Document-only custom rules do not change it.
- `tools/scoring.mjs`: pure score transitions, completed-result validation, TB validation and conversion of completed real matches.
- `tools/result-editor.mjs`, `tools/result-card.mjs`: conditional editor, draft separation, validation UI and one PNG renderer for manual/scored results, both themes and both sizes.
- `tools/brand.mjs`: real logo, real serving ball, QR address, verified print colours and fixed Material trophy path.
- `tools/event.mjs`: shared, bounded, plain-text event data and form binding.
- `tools/schedule-settings.mjs`, `tools/rotations.mjs`, `tools/rotation-controller.mjs`: elapsed/clock parsing, labels, migration, common round arithmetic, deterministic assignment and filled/blank rendering.
- `tools/club-documents.mjs`, `tools/club-controller.mjs`: rule sentences, score-sheet columns, conditional editing and print actions.
- `tools/print.mjs`: shared report/preview template, used by club tools and `practice/print-plan.mjs`.
- `tools/updated-pages.mjs`: generated initial HTML for new/refined tools. Public content is readable without creating private state.

Local keys: existing practice/scoreboard/checklist keys are preserved; new independent keys are `courtumpire.event.v1`, `courtumpire.result-draft.v1`, `courtumpire.scored-result.v1`, `courtumpire.scored-card-draft.v1`, `courtumpire.rotation.v1`, `courtumpire.rules.v1`, `courtumpire.score-sheet.v1`. Rotation migration accepts the previous numeric duration/round representation when present. Event inputs are reused across club documents. Private values never enter generated public metadata, canonical URLs, sitemaps or analytics events. The `?from=scoreboard` flag contains no names or scores.

No production dependency, backend, account, cloud synchronization or heavy export framework was added. Storage failures retain current in-memory use and give a specific message. A cross-page scored-card handoff requires usable browser storage; if unavailable, the scoreboard explains that the manual creator remains available.

## Verified app references (read only)

App source was available at `C:\05_CourtVoice`:

- `ui/match/MatchReportExporter.kt`: A4, 40pt app margins, Android sans-serif, 18pt brand, dark `#020817`, green `#74b024`, logo and divider.
- `ui/common/DisplaySetScoreText.kt` and `ui/home/MatchShareCardExporter.kt`: each player’s own set-TB points in parenthesized superscript; share-card scale 0.62 and rise 0.34 of main score font. Match TB is separate main-size points.
- `res/mipmap-xxxhdpi/ic_launcher_foreground.webp`: the real logo already copied to `assets/report-logo.webp`.
- `res/drawable-nodpi/server_tennis_ball.png`: copied unchanged to `assets/server-tennis-ball.png`.
- `TennisBallIndicator.kt` and `MatchScreen.kt`: actual serving ball and Material EmojiEvents vector trophy; no platform emoji substitutions.

The requested title-below-divider layout adapts verified app branding for website documents; it is not claimed as a pixel-identical complete Android export. No missing app reference blocks review. No Android/Wear OS file was edited.

Rule presets were checked against [ITF Rules of Tennis 2026](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf), Rules 5–7, 10, 29 and Appendix VI. Standard six-game tie-break sets, the no-ad alternative and short sets to four with a 4–4 TB are explicit presets. A set TB finishes its set; a seven/ten-point match TB replaces the deciding set. Other edited structures and timed arrangements are labelled organizer-defined. The five-point short-set TB with its different deciding-point/service arrangements is not exposed as an ITF preset. Additional notes are escaped document content, not executable rules or new engine modes.

## Bounds and limitations

- Live scoring: existing singles advantage formats only, up to 5,000 saved points. No unrelated doubles scorer rebuild, Android/watch sync or retired/incomplete completed-result exports. Demo walks through a game and is not exported as a real result.
- Schedules: 4–32 participants, 1–8 fully fillable courts, at most 36 rounds, 00:10–06:00 available time, 00:01–02:00 per round, 0–15-minute breaks. Eight doubles courts need 32 players; eight singles courts need 16. Insufficient players cause a clear error rather than fictitious assignments or truncated ranges.
- Participation is prioritized and repeat partners/opponents penalized; no optimality, perfect fairness or complete round-robin guarantee. Levels are informational only. Waiting = resting-round minutes plus shared breaks; unused time is separate.
- Clock dates roll over explicitly. Times are event-local clock times without a timezone/DST engine; organizers must review daylight-saving transitions.
- Wide schedules are split into court groups and may span landscape pages. They retain readable type, repeated headings and enough space for names/writing instead of forcing one tiny page.
- Standard/custom rules handouts do not imply official approval. Custom practice drills retain their existing editorial-review status. No physical printer test was performed.

## SEO, consent and exclusions

Current generated output has **42 routes / 40 production canonical sitemap URLs**. Both new builders are real public pages under Clubs & Coaches / Printable Club Kit, with unique title/description, initial instructions/examples, breadcrumbs and related links. Both site maps and shared navigation/footer derive from the existing registry/config. No generated personal document, draft, handoff state or preview query is indexed as a separate page. Existing valid URLs, `CNAME`, `robots.txt` and verification material remain intact.

Advertising remains off and live mode fails closed. Existing consent and analytics behavior, denied advertising consent and future commerce boundaries are preserved. No shop links or commerce implementation were added. The four previously reported Search Console cases remain unverified because their affected URLs are unavailable; live response headers/redirect chains still need the separately documented hosting follow-up. No Search Console action was taken.

## Verification and review exports

```powershell
npm run build
npm run lint
npm test
$env:NODE_PATH='C:\Users\mKhaw\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:BROWSER_CHANNEL='chrome'
npm run test:club-update
npm run test:result-variants
npm run test:browser
npm run test:existing
npm run test:seo
```

The browser suites use already available development-only tools, start local servers, and block/intercept external traffic. Actual PNG downloads, real browser Print / Save PDF output, rendered pages and decoded QR destinations are inspected. No live analytics collection or physical printing is claimed. Final results and exact artifact links are in `.local-review/club-update-2026-10-21/REVIEW.md`; that folder contains the required TB result card, scored-match card, rules handout, named doubles sheet, non-default-court filled schedule and configured blank worksheet, plus screenshots and machine-readable evidence.
