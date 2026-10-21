# Website hierarchy and extension boundaries

Local review only on `codex/practice-planner-local`. See [the 21 October club-tools update](CLUB-TOOLS-UPDATE.md) for current configurable document/result features. The latest implementation request supersedes the earlier roadmap-only deferral of scoring and club tools. Do not push, merge, deploy, change hosting, submit Search Console URLs, activate ads or implement commerce.

## Available pages

```text
Home / The App (homepage app sections)
Practice /practice/
├─ Build a practice /practice-planner/
├─ Practice for 1–4 players /practice/players/
│  └─ Solo / 2 / 3 / 4 player collections → illustrated activity pages
└─ Find a drill /tennis-drills/
Play & Score /play-score/
├─ Score a match /play-score/scoreboard/ (includes separate guided demo)
├─ Understand scoring /play-score/tiebreak-calculator/
├─ Share a result /play-score/result-card/
└─ You’re the Umpire /play-score/umpire-challenge/
Clubs & Coaches /clubs-coaches/
├─ Create a rotation schedule /clubs-coaches/rotation-planner/
├─ Printable club kit /clubs-coaches/tennis-kit/
│  ├─ Tournament rules /clubs-coaches/tournament-rules/
│  └─ Match score sheet /clubs-coaches/match-score-sheet/
└─ Session checklist /clubs-coaches/session-checklist/
Get the App → existing Google Play destination
Footer → Site map / Privacy / Legal Notice / Contact / Analytics settings
```

All listed destinations work locally. `/tools/` remains a compatibility gateway with canonical `/practice/`; existing valid URLs are preserved. The custom `404.html` is intentionally excluded from discovery and indexing. There is no public demo, advertising-preview or saved-session route. Preview is a loopback-only query on an existing page.

## Implemented boundaries

- Navigation lives in `practice/site-config.mjs`; route identity, parentage and inclusion policy live in `practice/routes.mjs`. The build creates the shared header/footer, breadcrumbs, HTML map and XML sitemap. Header disclosure menus are exclusive, keyboard/touch operable and active on direct reload. The gallery has manual controls, position, native swipe/trackpad and keyboard navigation without an exposed scrollbar.
- `practice/catalogue.mjs` contains the independent activity data and stable IDs; `practice/core.mjs` owns deterministic practice selection. Layouts and diagrams stay in the renderer/build. The planner selects training activities, not social court assignments.
- `tools/scoring.mjs` is the pure shared singles engine and result validator. Scoreboard, isolated demo, helper and result creator use it. Quiz data/explanations are separate in `tools/quiz.mjs`. See `TOOLS-SEO.md` for supported formats and bounds.
- `tools/rotations.mjs` owns deterministic timed social assignments. It uses no AI API and makes no optimality or complete round-robin claim. Participation differences and repeated pairings are displayed.
- `tools/checklist.mjs` owns versioned plain-text checklist state. `tools/kit.mjs` holds four real print sheets. `tools/print.mjs` reuses verified practice-report branding, logo and QR.
- The existing four app/legal HTML files retain their content and consent integration. Useful public page content is generated to static HTML; interaction progressively enhances it. No framework migration or backend was added.

## Future advertising

**Off** remains the release default. There is no provider. `live` fails closed even with a URL/config change. Loopback-only `?ads=preview` shows labelled local sample placements. The central independent placement flags, dimensions, consent boundary, safe sponsor card and stable failure fallback are documented in `PRACTICE.md`. Analytics acceptance never authorizes advertising. Provider requirements, applicable privacy rules and disclosures need separate review before any future activation.

## Future commerce — maintainability only

Keep a future commerce module separate from practice content/state, scoring and scheduling. Reuse the central navigation and page layout, and add working routes only after a separate product scope is agreed. Stable activity IDs allow future curated packs without copying instructions or restricting access to this free initial library/planner.

The possible future scope includes physical tennis accessories, personalized 3D-printed products and club/tournament bundles; catalogue/detail pages; colour, size and attachment variants; names, initials and approved club artwork; personalization previews; made-to-order lead times and stock; shipping and bulk enquiries; and an external checkout or commerce provider.

No shop pages, empty links, listings, product schemas/databases, configurator, cart, payments, accounts, orders, purchase tracking or commerce dependencies exist. Those concerns need separately defined products, fulfilment, personalization permissions and provider boundaries when authorized. Static page routing does not prevent that later work.

See `TOOLS-SEO.md` for the current implementation, local verification and indexing follow-up; `REFINEMENT.md` for the Android PDF reference; `PRACTICE.md` for activity, video and advertising details.
