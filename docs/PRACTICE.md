# Practice planner: local review

The current navigation/PDF refinement is documented in [REFINEMENT.md](REFINEMENT.md), with the full feature hierarchy and implementation order in [ROADMAP.md](ROADMAP.md). Practice is now the primary hub; `/tools/` remains only as a compatible bookmark gateway. The new visitor HTML site map is separate from the search-engine XML sitemap.

This release is prepared for **local review only** on `codex/practice-planner-local`. Do not push, deploy, merge, change DNS or modify hosting. The repository’s existing GitHub Pages configuration and `CNAME` are unchanged. Generic deployment notes elsewhere in the README are not instructions to publish this work.

## Start the website

Install a current Node.js if it is not already available. There are **no dependencies to install** for the website, static generation or unit tests. In PowerShell:

```powershell
cd C:\courtumpire-landing-pr5-test
npm run build
npm run preview
```

Leave that terminal open. Open [the homepage](http://127.0.0.1:4173/), [the planner](http://127.0.0.1:4173/practice-planner/), [the library](http://127.0.0.1:4173/tennis-drills/) or [Practice](http://127.0.0.1:4173/practice/) in your browser. Press Ctrl+C in the terminal when finished. This is a server on this Windows computer, not a remote preview or a deployment. If port 4173 is busy, stop the earlier preview or set `$env:PORT='4174'` before starting and use that port in the URLs.

## Review the planner

- **1 player:** generate 30 minutes with no wall. Confirm shadow recovery and serve practice; wall practice must not be selected. Add a permitted wall if you want wall activities.
- **2 players:** generate 45 minutes. Try Intermediate to include serve-and-return. Search/filter in the library, add a drill, return to the planner, and check the updated total. Deliberate repeats require confirmation.
- **3 players:** generate 60 minutes. Check that two-against-one uses all three players, the feeder observes for only three rallies, and the challenger scorer rests for only four points.
- **4 players:** generate 90 minutes. Check team roles and partner/serving rotations. Try Mixed guidance and Advanced variations.
- For each count, try reordering, changing minutes, removing and swapping. A swap uses the first unused compatible activity that fits the block; it is unavailable when none fits. Regeneration asks before replacing a nonempty plan.
- Reload to restore the saved session. Start session shows one complete activity at a time. Print / Save PDF includes all instructions and diagrams, even if the browser print command is invoked from courtside. Copy has a selectable-text fallback.
- A 15-minute custom request can be too short for the required three blocks; it gives a minimum-duration explanation. Focus is a preference within a varied session, not an exclusive restriction. Larger and smaller target adaptations are optional practice changes.

The browser uses `courtumpire.practice.v1` for the versioned session. Unknown versions, IDs, malformed data, incompatible settings and invalid durations are rejected. Storage failures leave the current visit usable with a copy/print reminder. Sessions are not sent to a server. Clear saved session removes this key and reports a failed removal honestly.

## Maintain content and pages

- `practice/catalogue.mjs` is the catalogue entry point, with the 34 additions in `practice/catalogue-extra.mjs`. `practice/catalogue.d.ts` defines its content contract. Stable IDs power persistence, planner blocks and detail routes. All 50 activities have one explicit supported player count; do not add another count without its complete adaptation.
- Each entry contains written instructions, scoring, roles, variations, requirements, source references, editorial status, and diagram configuration. `practice/render.mjs` renders the same content for cards, detail pages, plans and print. Court diagrams are original SVG with accessible descriptions and distinguishable ball/movement arrows. Starting positions are schematic.
- `practice/core.mjs` owns deterministic selection, compatible swaps, timing, session validation and persistence helpers. Generated plans contain a gradual introductory activity, main block and finish. One minute between blocks is added explicitly; retrieval and short pauses within drills are part of the activity time. No runtime AI, backend or tracking dependency is involved.
- `practice/routes.mjs` owns route identities, parents and canonical inclusion; `practice/site-config.mjs` owns navigation, and `practice/player-pages.mjs` owns player-count introductions. `scripts/build.mjs` owns shared page structure, metadata, registry-derived breadcrumbs, both site maps and generation of real directory-index routes. Generated HTML is checked in for the existing static host and useful without JavaScript. Run `npm run build` after changing source content, navigation, rendering or layouts. Do not edit generated practice HTML by hand.
- Existing homepage app features, screenshot files, old anchors, Play destination, legal/contact content and consent controls remain available. The consent policy link was made root-relative to work on nested routes. Only the analytics pathname allowlist was extended; the measurement ID, opt-in policy, denied advertising consent flags and local-host analytics guard remain intact. No new analytics events or providers were added.

### Editorial review

**The original 16 and 34 additional custom practice formats require editorial review before public release.** No professional approval is claimed. Public activity pages expose this status in Sources & editorial status. USTA’s [instruction library](https://www.usta.com/en/home/improve/tips-and-instruction.html) and [at-home resource](https://www.usta.com/en/home/play/adult-tennis/tennis-at-home.html), and LTA’s [improve-your-game resource](https://www.lta.org.uk/play/improve-your-game/) were consulted for general context. They do not verify these exact scoring systems, timings, diagrams or rotations. No proprietary drill text or media was copied. All scoring changes are labelled as optional practice rules, including the short doubles format. A coach/editor should test each complete sequence on court and record the reviewer/date in its catalogue status when reviewed.

### Add a reviewed video later

Keep written instructions and SVG usable independently. Add local media below `assets/videos/`, then add optional `video` metadata to the activity:

```js
video: {
  status: 'draft', // Change to ready only after editorial review.
  source: '/assets/videos/activity.mp4', // mp4 or webm
  title: 'Activity: purpose, setup and demonstration',
  poster: '/assets/videos/activity-poster.webp',
  captions: '/assets/videos/activity.en.vtt',
  transcript: 'Full narration and meaningful visual descriptions…',
  language: 'en',
  duration: '01:20',
  credits: 'Record creator, tools, permissions and editorial review here.'
}
```

Use the sequence **Purpose → Setup → Demonstration → Rotation → Scoring** for a future AI-generated narrated video. Confirm that narration, diagram, people, targets, rules and captions agree; retain provenance and rights information. Only `ready` plus a valid local source, language and accessible title renders a player. Poster/caption paths are validated. Native controls use `preload="none"`; sources attach near the viewport, no autoplay or external embeds. Errors return the reader to illustrated instructions. `practice/video.mjs` owns this behavior. No video has been generated, fetched or published in this release.

## Advertising and sponsorship: OFF

`practice/ads-config.mjs` is the central placement/mode/dimension configuration. `advertising.mode` is **off**, `provider` is **null**, and the separate advertising consent boundary returns **unknown**. `live` deliberately resolves to off in this release, regardless of a URL parameter, provider value or consent. Implementing/configuring a future provider is a separate task.

Off produces no slot nodes, reserved gaps, provider scripts, advertising cookies, tracking or third-party advertising requests. The lightweight local configuration module is read by the application; the advertising renderer is dynamically imported **only for local preview**. There is no management platform or advertising dependency.

### Review sample placements

Use `?ads=preview` **only on localhost, 127.0.0.1 or IPv6 loopback**. It cannot enable anything on a public/preview domain. To return to off, remove the parameter. No setting is persisted, no consent choice is changed and no real sponsor is represented.

- [Library preview](http://127.0.0.1:4173/tennis-drills/?ads=preview): `library-between-groups`, once after six cards when both groups have results.
- [Activity preview](http://127.0.0.1:4173/tennis-drills/two-against-one/?ads=preview): `activity-after-instructions`, below the complete diagram, written instructions, video state and editorial note, before related activities.
- [Player page preview](http://127.0.0.1:4173/tennis-drills/3-players/?ads=preview): `players-after-introduction`, below useful introductory advice.

Each placement has an independent `enabled` flag and `kind` (`network` sample or `sponsor` sample). The shared `AdSlot` boundary in `practice/ads.mjs` is independent of catalogue/planner data. Maximum one placement per eligible page. There are no placements on homepage/tools/legal pages, in planner controls, courtside, over navigation/video/downloads, or between diagrams and instructions. Print CSS suppresses advertising in every context. No pop-ups, interstitials, sticky overlays, autoplay or functional-looking ad buttons exist.

Dimensions are configured once and passed as slot CSS variables: **300 × 250 CSS px below 761px**, **728 × 120 CSS px on wider screens**, constrained to available width. Preview mounts before layout review; future live must reserve the same fixed box before requesting creative. Do not insert a late, unreserved slot above content.

The sponsor-card renderer accepts name, local image/logo, short text and destination URL. It uses text nodes, local creative, a visible **Sponsored** label and `rel="sponsored noopener noreferrer"` on paid outbound links. Preview uses only **Sample sponsor**, a local generic star and a self-link; these are not a real partnership. No sponsor assets or real outbound sponsor links are active.

### Future live activation boundary

No network SDK, approval request or new consent popup is implemented. Preserve the existing analytics consent UI; **analytics acceptance does not cover advertising**. Before a future live integration:

1. Review the selected provider’s requirements, applicable privacy requirements and site disclosures; define provider-specific advertising consent and withdrawal behavior separately. Unknown/denied consent must result in no advertising requests and no provider import.
2. Explicitly implement and configure a provider adapter behind the off-by-default mode boundary. A query parameter must never enable live mode. Only import provider code lazily after mode, placement and provider-specific consent permit it. Keep all failures/timeouts outside planner/content logic; no rejected ad promise should break the page.
3. Reserve dimensions before a request. On blocked, failed or unfilled inventory, retain the same box and show a quiet first-party fallback such as an internal practice-library message. It must require no provider retry, tracking or external image and must not claim sponsorship. Do not collapse a mounted box and cause a content jump. Off and unknown-consent states never mount that box in the first place.
4. Test consent denial/withdrawal, blocked SDKs, timeouts, unfilled inventory, navigation, responsive layout, print/courtside exclusion and independent placement switches. Review any image/redirect tracking in direct sponsorship separately.

App claims remain scoped to the **Android app** having no ads. No promise is made that the website will always be advertising-free.

## Future commerce: extension points only

Practice content remains free, independent of page layouts and independent of any future commerce module. Navigation is centrally maintained; add a Shop or Practice Packs link only when a separately scoped, working product exists. The shared page generator/layout can serve future catalogue/detail routes without changing planner state or activity IDs. Curated activity packs could reference stable catalogue IDs rather than copying instructions; do not impose paid access on this initial catalogue or planner.

A future separately defined commerce scope may cover physical tennis accessories, personalized 3D-printed products and club/tournament bundles; catalogue/product pages; colour, size and attachment variants; names, initials and approved club artwork; personalization previews; made-to-order lead times and stock availability; shipping and bulk enquiries; external checkout or a provider integration. Keep its product, personalization, inventory, order and checkout concerns in a separate module/provider when that work is authorized. Nothing in the current static routes prevents product detail pages or an external checkout later.

There are **no shop pages or empty navigation links, product listings/schemas, configurators, carts, payments, accounts, order management, purchase tracking, paid-access restrictions or commerce dependencies** in this release. Actual commerce needs its own product decisions and scope.

## Checks and screenshots

```powershell
npm run build
npm run lint
npm test
```

The lint command checks script syntax, real static routes, canonicals, unique titles and absence of accidental noindex without installing a lint framework. Unit tests cover 320 normal player/time/level/goal combinations as well as compatibility, wall availability, minimum time, deterministic output, swaps, additions, totals, malformed storage, advertising gates and video states.

Browser tests need development-only Playwright and a browser, as in the existing README. On this machine the bundled package is already available:

```powershell
$env:NODE_PATH='C:\Users\mKhaw\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:BROWSER_CHANNEL='chrome'
npm run test:browser
npm run test:existing
```

For another computer without Playwright, optional local test setup is `npm install --no-save --package-lock=false playwright` then `npx playwright install chromium`; omit `BROWSER_CHANNEL` to use Chromium. This is test tooling only; no production dependency is needed.

The suites start temporary loopback servers and close them. All external browser requests are blocked/intercepted. The existing consent suite stubs Google requests; it does not contact or verify live analytics. Screenshots, browser report and a sample printed plan are under ignored `.local-review/`, outside published source assets. Review `screenshots/home-*.png`, `library-*.png`, `activity-*.png`, `plan-*.png`, `ads-library-*.png`, `ads-activity-*.png`, `ads-players-*.png` and `courtside-desktop.png`. Mobile screenshots use 390px; all routes are also checked at 360, 768 and 1440px.

Nothing has been pushed or deployed. Public release still requires the activity editorial review and the pre-existing owner analytics/account checks described in the README.
