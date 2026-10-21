# Local tools, SEO and indexing handoff

Updated 21 October: [the coordinated club-tools update](CLUB-TOOLS-UPDATE.md) supersedes earlier card/club/print scope. The current build has 42 routes and 40 canonical sitemap URLs. Earlier mobile-lab figures below describe the 20 October baseline.

This work is local only. No push, merge, deployment, hosting/DNS change, live ad integration or Search Console submission is authorized. The original practice library remains free. Ads are off and commerce is extension documentation only.

## Run and review

```powershell
cd C:\courtumpire-landing-pr5-test
npm run build
npm run preview
```

Leave the terminal open and visit `http://127.0.0.1:4173/`. Use the shared Practice, Play & Score and Clubs & Coaches menus. Direct review URLs:

- `/practice/players/`, `/practice-planner/`, `/tennis-drills/`
- `/play-score/scoreboard/`, `/play-score/tiebreak-calculator/`
- `/play-score/result-card/`, `/play-score/umpire-challenge/`
- `/clubs-coaches/rotation-planner/`, `/clubs-coaches/session-checklist/`, `/clubs-coaches/tennis-kit/`
- `/site-map/` (visitor HTML), `/sitemap.xml` (search-engine XML)

Press Ctrl+C to stop. The tests start and stop their own loopback servers. No production dependency installation is needed. Generate committed static HTML with `npm run build` after changing content/routes/templates.

## Working features and limits

The singles scoreboard supports advantage games, a social one tie-break set, best of three regular tie-break sets, or best of three with a 10-point match tiebreak replacing the third. Regular sets are six games, win by two, with a seven-point tiebreak at 6–6. All tiebreaks require a two-point lead; standard six-point end changes apply. Point history allows full undo, service calculation and validated restoration. Completion disables points until undo/new match. The guided demo has its own state and cannot overwrite the real match. Doubles, no-ad, alternative short sets and Android/watch synchronization are outside this version.

The scoring helper requires the first tiebreak server/current game server. It distinguishes serving half from physical court end and explains missing physical-end context. A completed deciding match tiebreak has no next set. Rules were checked against [ITF Rules of Tennis 2026](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf), Rules 5–7, 10, 14, 17 and Appendix VI. The ten-question challenge stores original scenarios, answers, explanations and references separately and is not a certification or claim of expert review.

The result creator validates completed supported formats before drawing/downloading a real PNG. It has two designs and 1080×1080/1080×1350 layouts. Names wrap and shrink, and special characters remain plain text. Results are manually entered, not independently verified. Incomplete/retired matches are explicitly unsupported. Preview/download validation is separate from the active scoreboard state.

The social scheduler supports 4–32 distinct named players, 1–8 fully fillable courts, singles/doubles, 10–360 session minutes, 1–120-minute rounds, 0–15-minute changes and at most 36 rounds. It prioritizes participation then penalizes repeated partners/opponents. It shows elapsed round times, court assignments, rests, per-player playing/resting round minutes, participation spread, repeats, changeover time and unused time. It is deterministic, without an AI API or optimality/round-robin guarantee. Copy has a selectable fallback. Print includes the actual schedule and totals.

The checklist provides eight starting reminders, ticks, custom text, a protected reset, browser-local persistence and print. It sends no email or messages. The kit provides four actual sheets: blank score sheet, scoring/tiebreak reference, organizer checklist and blank rotation worksheet. Each action is honestly labelled **Print / Save PDF**, not a direct PDF download. A4 Chrome/Edge is the verified print target; background graphics may stay off and automatic browser headers/footers should be off.

Storage keys are independent: existing `courtumpire.practice.v1`, `courtumpire.scoreboard.v1`, and `courtumpire.checklist.v1`. Invalid state is ignored safely. Storage failures leave the current tool usable and tell the visitor to copy/print before leaving. No accounts, server storage, uploaded photos or new tracking events were added. Entered names/custom reminders never enter canonical URLs, sitemaps or analytics parameters. Original consent code and denied advertising defaults remain in force.

## Static SEO architecture

`practice/routes.mjs` owns the public route hierarchy and canonical/index inclusion policy. `practice/site-config.mjs` owns navigation. `scripts/build.mjs`, `tools/pages.mjs` and the independent catalogue generate real initial HTML, then `practice/site.mjs` loads interactive code only for relevant page types. The homepage/legal pages do not download the planner/tool engine.

Generated output includes unique descriptive titles/descriptions, one main heading, logical subheadings, introductions, complete drill setup/execution/scoring/rotation/variations, visible references, tool formats/examples, real navigation links, breadcrumbs and related pages. Filtering and saved session generation are not needed to read the public content. There are no thin filter-combination pages. New canonical pages carry BreadcrumbList data agreeing with the visible trail. No fabricated ratings, products, reviewers, review dates or unpublished VideoObject data exist. Original social metadata is preserved; new pages have accurate title/description/URL and the actual brand image.

All images reserve dimensions and have alternatives; diagrams have descriptive SVG titles/descriptions and a stable viewBox. Below-fold app images are lazy. Eight gallery WebP derivatives total **306,798 bytes versus 1,269,100 original bytes (75.8% reduction)**. Original screenshots remain intact; `assets/screenshots/display/manifest.json` records actual dimensions/bytes. No autoplay or external video provider was added.

The HTML visitor map and XML sitemap derive from the same route registry, with their own inclusion rules. Current output: **42 generated/maintained routes, 40 unique production canonical sitemap URLs**. The XML keeps its standard namespace and `https://courtumpire.com/sitemap.xml` destination. `robots.txt` still allows crawling and references that XML. `CNAME` and existing verification material were preserved. The map includes only available content, not saved states, preview queries, the compatibility gateway or missing-page template.

## Indexing audit — affected Search Console URLs still unknown

Reported cases: **two redirected URLs, one noindex URL and one duplicate without a user-selected canonical**. No affected URL list was supplied. These specific cases are **not claimed resolved**. The local report explicitly records `affectedURLsAvailable: false` and `resolved: false`.

`tests/seo.cjs` inspects actual generated HTML with JavaScript disabled, verifies unique metadata and heading structure, canonical tags, robots/googlebot tags, local response X-Robots-Tag, XML parsing/URLs, HTML map coverage, initial instructions/examples, breadcrumb schema, all 90 distinct internal link/fragment destinations and deliberate duplicate variants. It writes `.local-review/seo/indexing-audit.json`, including per-route policies and local redirect checks.

Verified local policy:

| URL class | Canonical / index behavior |
| --- | --- |
| 40 discoverable public pages | Exactly one absolute self canonical on HTTPS production origin; no accidental noindex; included in XML/HTML maps |
| `/tools/` | Existing compatibility page remains usable, canonical to `/practice/`, excluded from maps; not an HTTP redirect |
| `/index.html`, directory `index.html`, preview/personal query variants | Canonical to the corresponding clean public page; absent as separate sitemap entries |
| Directory paths missing trailing slash | Preview server retains 301 to the corresponding slash path; no distinct pages point to the homepage |
| Unknown URL | Local server returns real 404 with helpful static `404.html`, intentional `noindex, follow`, no homepage canonical |
| `/404.html` file | Intentional noindex template, no canonical, excluded from maps |

No `_headers`, `.htaccess`, `netlify.toml` or `vercel.json` header configuration is present. Local responses contain no X-Robots-Tag. No global noindex removal, broad robots block or catch-all homepage redirect was introduced. Local previews are loopback-only; production HTML is not accidentally stamped with local noindex. The supported GitHub Pages custom 404 file replaces any need for an SPA catch-all.

### Hosting-level follow-up (requires actual URLs and separately authorized publishing)

Obtain/export the four affected URLs and their last crawl details. For each, inspect the complete production response chain using GET and final headers, including host/scheme/slash behavior, status, `Location`, `X-Robots-Tag` and any HTTP `Link: ... rel=canonical`. This local build cannot confirm upstream Pages/CDN/proxy headers, current live redirects, cached pages or Google’s selected canonical. Static HTML cannot override an upstream noindex header. Correct such a header only at the responsible hosting/proxy layer, if unintended; retain deliberate exclusions and correct redirects. Do not change hosting now or remove noindex globally. Compare exact page content and canonical preference before deciding whether a distinct page should remain self canonical. Do not canonicalize distinct tools/drills to the homepage.

A redirected URL can be intentionally excluded while its final destination is indexed. A valid canonical is a preference, not an indexing guarantee. References: [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [noindex/meta and response headers](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Verification and evidence

```powershell
npm run build
npm run lint
npm test
$env:NODE_PATH='C:\Users\mKhaw\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:BROWSER_CHANNEL='chrome'
npm run test:browser
npm run test:refinement
npm run test:tools
npm run test:existing
npm run test:seo
npm run test:performance
```

Browser tests use already available development tools, block/intercept external requests, and shut down their servers. The consent regression suite uses recording stubs instead of contacting Google. Local queue/stub results are not live GA collection. See `.local-review/` for machine-readable reports, screenshots, downloaded PNGs, PDFs and rendered pages. `test:tools` verifies real actions and output; the pure engine tests cover scoring/tiebreak completion and bounded schedule constraints. Source/editorial review remains pending for the 16 custom practice formats; no invented professional reviewer or endorsement has been added.

The 20 October baseline mobile lab run used Chrome CDP through existing Playwright: cold cache, 390×844, 4× CPU throttle, 150 ms latency and 1.6 Mbit/s downstream, one run per page. FCP/LCP observed 0.93–1.12 seconds, CLS 0–0.0027, initial transfer 85–208 KB across homepage/planner/drill/scoreboard/rotation. Details are in `.local-review/seo/mobile-performance.json`. These are local synthetic observations, not production/field Core Web Vitals, INP, an automated SEO score or ranking evidence. Chrome DevTools MCP was unavailable; hosting cache/compression/CDN and actual devices were not measured.

Current reports and final review artifacts are listed in `.local-review/REVIEW.md` after the complete regression run. PDF branding reference, the original clipping defect and QR generation are documented in `REFINEMENT.md`.

## Short post-deployment checklist — no action taken now

After separately authorized publishing, use [Search Console URL Inspection](https://support.google.com/webmasters/answer/9012289) on representative new pages and the actual four affected URLs. Compare rendered/crawled content, indexing permission, user-selected and Google-selected canonical, final status and redirect chains; request indexing only where appropriate after fixes are live. Verify that the **existing XML sitemap destination** returns valid XML and the expected canonical URLs, and that robots still references it. Do not submit the HTML site map as a replacement.

Monitor the [Search results Performance report](https://support.google.com/webmasters/answer/7576553) for real queries, impressions, clicks and changes by page/device over comparable periods. Review indexing reports after recrawls rather than treating local tests as case resolution. Monitor existing consented `google_play_click` events by fixed placement in GA4 where permitted; clicks are not installs. No new tracking, Search Console submission or production test was performed during this local task.
