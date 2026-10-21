# CourtUmpire website

The current candidate is covered by [the release-readiness audit](docs/RELEASE-READINESS.md), including accumulated website improvements and focused fixes. Dedicated draft review branch: `codex/release-readiness`. Production publishing from `main` remains a separate owner-approved step. Earlier local-only handoffs below describe their historical scope.

## Current local website work

The planner, 50 illustrated activities, working scoring tools and club resources are prepared for **local review only**. Advertising remains off; no shop is implemented. Start with [the 100-question/50-activity expansion and current review](docs/EXPANSION-REVIEW.md), [screenshots, PDFs and earlier verified limitations](docs/CURRENT-LOCAL-REVIEW.md), [the current checklists/formats/contact review](docs/CHECKLISTS-FORMATS-UPDATE.md), [email-based Contact review](docs/CONTACT.md), [usage analytics](docs/ANALYTICS-USAGE.md), [the focused corrections](docs/FOCUSED-CORRECTIONS.md), [the 21 October coordinated tools update](docs/CLUB-TOOLS-UPDATE.md), [the tools/SEO/indexing handoff](docs/TOOLS-SEO.md), [the architecture/PDF refinement guide](docs/REFINEMENT.md), [the hierarchy and roadmap](docs/ROADMAP.md), or [the practice/content guide](docs/PRACTICE.md). **Do not push or deploy this branch.** The publishing notes below describe the existing site, not authorization to publish this work.

Plain HTML, CSS and JavaScript for [courtumpire.com](https://courtumpire.com/). This is the website repository, not the Android application. Run `npm run build` after editing shared routes, content or templates; generated HTML is committed. No installed production dependencies are required for the static website. Contact uses your own email app and a local copy-email action, without a submission backend. Product claims and FAQ answers are based on the existing website’s feature descriptions and actual screenshots; only the Android PDF generator/branding was inspected for report styling, not a full application audit.

## Publishing and page maintenance

GitHub Pages settings verified on 17 October 2026: **Deploy from a branch → main → / (root)**, legacy Pages build, custom domain `courtumpire.com`, HTTPS enforced. Keep `CNAME` and this publishing source unchanged. There is no deployment workflow in this repository.

The original app/legal HTML pages are `index.html`, `contact.html`, `privacy.html` and `impressum.html`; the shared static generator adds practice, scoring, club and site-map pages. Each includes `analytics.js` once, a footer Analytics settings button, one absolute canonical, and matching Open Graph/Twitter metadata. The homepage canonical is `https://courtumpire.com/`.

When adding or removing a public canonical page:

1. Update `practice/routes.mjs` and the relevant content/template, then run `npm run build` to synchronize the HTML site map, root XML sitemap, breadcrumbs and analytics path allowlist. Ensure its absolute production canonical maps to an actual HTML file. Do not add `index.html` as a second homepage, anchors, assets or external URLs.
2. Keep the standard sitemap namespace and UTF-8 encoding. Omit `lastmod` unless the date of a significant content modification is known. Do not add `priority` or `changefreq`.
3. Keep `robots.txt` public and its sitemap reference intact. Preserve legitimate crawl directives if more are added later.
4. Add matching metadata, navigation, consent controls and the shared script to the page. The build updates the explicit pathname allowlist in `analytics.js`; test the new content with `test:seo` and the relevant browser suite.

Submit [https://courtumpire.com/sitemap.xml](https://courtumpire.com/sitemap.xml) in the verified domain’s Google Search Console Sitemaps report after deployment.

## Website consent and analytics

See [the current event schema and owner checks](docs/ANALYTICS-USAGE.md). The single integration remains **G-H387MYJ9KJ**, basic opt-in, with advertising denied and no pre-consent queue. Consent version 3 (`website-engagement-v3`) retains the existing storage key/cookie and fixed 180-day lifetime. Old acceptance requires renewal for expanded usage purposes; old valid rejection remains rejected. Production delivery is deliberately blocked by `ACCOUNT_SETTINGS_REVIEWED = false` until automatic-event payload verification and the remaining owner confirmations in the analytics guide are complete. No real Google delivery occurs during local testing.

Local-only `?analytics_debug=1`, after explicit acceptance, exposes a bounded in-memory categorical record list. Names, email, message contents, reminders, event details, logo/filename, full mailto URLs and raw errors are not permitted. Withdrawal clears debug records and disables delivery/cookies before any reload. The owner has reviewed account settings; preserve the chosen automatic-event switches and finish the specific activation checks in the analytics guide. Automatic events have a separate payload scope and must not be counted as confirmed leads. An app-link click is intent, print is a dialog request, and neither proves installation or PDF saving.

`npm.cmd run test:analytics-real` executes the actual tag in a local browser fixture, intercepting all collection before transmission. It never changes the repository delivery guard or GA account. See [the alignment review](docs/ANALYTICS-ALIGNMENT-REVIEW.md) for results, screenshots, reproduction and the remaining automatic-event activation checks. The stub suite alone does not establish real payload safety.

The owner saved automatic Site search OFF; the refreshed real tag passed 64 focused checks with all collection intercepted. All five search-key probes emitted no terms or private markers. Query-free form destinations and the other applicable measurements remain verified. The technical blocker is resolved; keep delivery OFF pending the owner's User Data Collection Acknowledgement and a separately authorized activation release. Saved retention/reset and administrative contact details are owner-confirmed; no administrative email or postal address is published here.

## Contact — email-based local review

Run `npm run preview`, then open `http://127.0.0.1:4173/contact.html`. General contact needs no topic selection; four accessible topic choices prepare an encoded email subject. The visible address and copy button remain available. `npm run test:contact` checks desktop/mobile layout, keyboard behavior, subjects, copy feedback, consent-gated intent and preserved metadata without external requests. See [Contact implementation and removal handoff](docs/CONTACT.md). No contact backend, uploads or new service is used. Stop any preview process you start with Ctrl+C.

## Images and accessibility

Actual artwork and all original full-resolution assets are preserved. The displayed logo and hero use compressed WebP derivatives; screenshots have measured WebP gallery derivatives while all original full-resolution files remain intact. Dimensions reserve image space. The hero is eager/high priority, and below-the-fold app images are lazy. The small 4,904-byte Play badge is unchanged. A JPEG of the existing logo provides social-card compatibility.

| Use | Original bytes | New bytes | Reduction |
| --- | ---: | ---: | ---: |
| Hero splash, 1080×2340 → 600×1300 WebP | 998,560 | 45,496 | 95.4% |
| Display logo, 718×718 PNG → 256×256 WebP | 718,767 | 4,332 | 99.4% |
| Social-only logo, 718×718 JPEG | — | 31,794 | Additional metadata asset |

See `assets/README.md` for derivative recipes. Styles include a skip link, visible keyboard focus, readable muted text, wrapped footer controls and reduced-motion behavior. The five practical FAQ questions and answers are native `details`/`summary` HTML and work without JavaScript. They cover keeping tennis score, connected Wear OS scoring, undoing mistakes, exporting PDFs and account requirements. No FAQ structured data or ranking/rich-result promise is added.

## Verification

Run `node --check analytics.js` and `node tests/verify.cjs` with a current Node.js, Playwright and its Chromium browser available in your development environment. For an already installed Chrome, set `BROWSER_CHANNEL=chrome`. Playwright is for development only; it is not loaded by the website. If using an existing tools bundle, set `NODE_PATH` to its `node_modules`. Optional `SCREENSHOT_DIR` saves full-page screenshots outside the published site.

The test starts its own local HTTP server. It checks all four pages at 360, 390, 768 and 1440 pixels; XML, links/anchors, metadata, image loads/dimensions/alternatives, overflow, text palette contrast, reduced motion, FAQ without JavaScript, keyboard/focus, fresh/rejected/accepted/withdrawn consent, invalid/expired/missing storage, write failures, blocked scripts and Play-link navigation. Production-origin requests are fulfilled from the local server and gtag.js is replaced by a recording stub; every other external request is intercepted. The production hostname check remains unchanged. Assertions about initialization, cookie cleanup and event counts are controlled instrumentation, **not evidence of live GA4 collection**.

### Production checks after deployment

1. Confirm GitHub Pages deployment succeeded for the merge commit, then open the original app/legal pages and representative new HTTPS pages. Check mobile/desktop layout, screenshots, native FAQ, support email, legal details, privacy links, keyboard focus and Play destinations.
2. Fetch `/sitemap.xml` and `/robots.txt`: both should return HTTP 200 with the intended content. Confirm all registered canonical sitemap URLs return the expected pages and canonical URLs, and CNAME/HTTPS still work.
3. In a clean browser profile with extensions disabled, inspect Network and Application storage **before using Tag Assistant**. Before consent there must be no requests to Analytics/Tag Manager and no GA cookies. Reject, navigate and reload; repeat the checks.
4. Use [Google Tag Assistant](https://tagassistant.google.com/) and GA4 Realtime (DebugView if enabled through debugging tools) to check an accepted production visit. Expect one `page_view` per full page load, with ID `G-H387MYJ9KJ`, a query-free canonical page location and blank referrer. Check that no search/hash/email values or unwanted automatic events appear. Debug tools can introduce their own requests, so do not use their traffic as proof of a clean pre-consent baseline.
5. Click each Play placement and confirm one `google_play_click` with the fixed placement and working navigation. Check actual GA4 Realtime receipt separately from observing queued `gtag` calls.
6. Reopen Analytics settings and reject. Confirm tracking stops immediately, accessible GA cookies disappear, reload does not load Google, and rejection persists across pages. Also test blocked cookies/storage and a blocked Analytics script. Inspect expired/invalid stored choices and confirm they do not authorize tracking.
7. Submit the sitemap in Search Console and use URL Inspection to review the deployed homepage/canonical pages. No deployment or live Analytics verification is implied by the local tests.

### Reviewing question queries in Search Console

After the deployed pages have accumulated meaningful impressions and clicks (allow several weeks or longer for a low-traffic site), open the verified `courtumpire.com` property → Performance → Search results. Select Web, a useful date range, and the homepage as the page filter. In the Queries tab, review actual question-style searches about scorekeeping, watches, undo, PDF results and accounts. Use query filters or an optional custom regex **only in the Search Console interface** to group question phrases; no Search Console regex belongs in website code.

Compare equivalent periods and inspect impressions, clicks, CTR and average position, with device/country breakdowns where the sample supports them. Export queries to review wording and identify unanswered practical needs. Low-volume/anonymized queries may be omitted, so absence of a question is not proof of no demand. Improve answers only when the product supports them; avoid repetitive variants. The FAQ improves usefulness, without promising rankings or FAQ rich results. See Google’s [Performance report guidance](https://support.google.com/webmasters/answer/7576553?hl=en).

## Merge, deployment and rollback

Complete the owner checks above, review the PR and its verification record, then merge the dedicated branch into `main` through GitHub’s **Merge pull request** control (squash merge is also suitable). Do not merge until the GA4 account configuration and policy review are complete. No additional build command or hosting change is needed: the existing root-of-main GitHub Pages source publishes the merge. Monitor the repository’s Pages build/deployment and perform the production checklist above.

To roll back, use GitHub’s **Revert** action on the merged PR and merge that revert PR into `main`, or create an equivalent revert commit through a reviewed PR. For a manual merge-commit revert use `git revert -m 1 <merge-sha>`; for a squash commit use `git revert <squash-sha>`. Do not reset or force-push `main`. Pages republishes the reverted root. Confirm deployment and repeat the public URL/consent checks. Reverting site code stops loading this integration on new page loads; it does not erase already-collected GA4 data or cookies in visitors’ browsers.
