# CourtUmpire website

Plain HTML, CSS and JavaScript for [courtumpire.com](https://courtumpire.com/). This is the website repository, not the Android application. No build step or production dependencies are required. Product claims and FAQ answers are based on the existing website’s feature descriptions and actual screenshots; the Android source was not audited.

## Publishing and page maintenance

GitHub Pages settings verified on 17 October 2026: **Deploy from a branch → main → / (root)**, legacy Pages build, custom domain `courtumpire.com`, HTTPS enforced. Keep `CNAME` and this publishing source unchanged. There is no deployment workflow in this repository.

The public HTML pages are `index.html`, `contact.html`, `privacy.html` and `impressum.html`. Each includes `analytics.js` once, a footer Analytics settings button, one absolute canonical, and matching Open Graph/Twitter metadata. The homepage canonical is `https://courtumpire.com/`.

When adding or removing a public canonical page:

1. Update root `sitemap.xml` with its absolute production canonical URL and ensure it maps to an actual published HTML file. Do not add `index.html` as a second homepage, anchors, assets or external URLs.
2. Keep the standard sitemap namespace and UTF-8 encoding. Omit `lastmod` unless the date of a significant content modification is known. Do not add `priority` or `changefreq`.
3. Keep `robots.txt` public and its sitemap reference intact. Preserve legitimate crawl directives if more are added later.
4. Add matching metadata, navigation, consent controls and the shared script to the page. Update the explicit pathname allowlist in `analytics.js` and `pages` in `tests/verify.cjs`.

Submit [https://courtumpire.com/sitemap.xml](https://courtumpire.com/sitemap.xml) in the verified domain’s Google Search Console Sitemaps report after deployment.

## Website consent and analytics

`analytics.js` uses basic opt-in for **G-H387MYJ9KJ**. Until explicit acceptance, no Google script is inserted and no analytics requests or cookieless pings are sent. The site remains usable after rejection, with blocked scripts, and without JavaScript. Choices appear in a section in normal document flow, so content is never covered by an overlay. Footer settings reopen the controls and move focus to the choices; closing returns focus to the opener.

Explicit choices last **180 days from the choice**, without sliding renewal on navigation. Local storage key `courtumpire.analytics.v1` contains `{version: 1, choice: "accepted"|"rejected", savedAt, expiresAt}` with millisecond timestamps. Preference cookie `cu_consent` contains the choice and timestamp and uses `Path=/`, `SameSite=Lax`, and `Secure` on HTTPS. Both stores must confirm the same acceptance. Missing, malformed, future-dated, expired or unreadable choices never authorize tracking. Failed acceptance writes leave analytics off. The preference cookie is not an analytics identifier.

Only HTTPS on the exact hostname `courtumpire.com` and the known public paths can start Google. Localhost, GitHub previews, alternate hosts and HTTP do not send production analytics even after acceptance. There is no testing override for this restriction.

After acceptance, denied consent defaults and privacy configuration are queued before configuration/events. Only `analytics_storage` becomes granted. `ad_storage`, `ad_user_data` and `ad_personalization` remain denied; Google Signals, advertising personalization and URL passthrough are disabled. Automatic config pageviews are disabled; one explicit `page_view` is queued per document. Reopening/reaccepting does not duplicate it. Nothing backfills earlier interactions. Google may still generate standard session/engagement bookkeeping after consent; this is distinct from the explicit events below.

The page URL is constructed from the allowlisted production path, mapping `index.html` to `/`, with no query or fragment. Referrer is always an empty string, including on the config and each explicit event. No arbitrary link URL, link text, email, match data, user ID or user property is sent. The script fetch uses `no-referrer`. Enhanced Measurement **must be disabled in the GA4 account before deployment**, as explained below, to prevent its automatic URL/event collection.

| Event | Meaning | Parameters |
| --- | --- | --- |
| `page_view` | One page viewed after consent, per full page load | Fixed page URL/title, blank referrer, measurement ID |
| `google_play_click` | One click on an existing Google Play link; **not an installation** | `placement`: `header`, `hero`, or `download_section`; fixed page URL, blank referrer, measurement ID |

Clicks keep their normal new-tab behavior. No redirect delays or synthetic clicks are used. Before consent, clicks are neither measured nor queued.

Withdrawal sets Google’s `ga-disable-G-H387MYJ9KJ` flag immediately, then updates consent to denied, deletes accessible integration cookies (`cu_ga*`, plus accessible legacy `_ga*` cookies at `/` on the host/production domain), saves rejection, and reloads if the script had started. GA cookie lifetime is configured to the remaining consent period and does not renew on page load. HTTP-only cookies cannot be cleared by JavaScript; this integration creates none. Missing/revoked consent is rechecked on storage events, focus, visibility changes, page restoration and clicks; an expiry timer also stops a long-lived page.

If rejection cannot be verified in both stores, `analytics=off` is added to the reload URL and all internal links. It takes precedence over stale acceptance, retries saving rejection, and is removed only when rejection is saved successfully (or acceptance is explicitly saved again). This guard also covers browsers that fail both storage writes after a previous acceptance. It is excluded from analytics data.

### Required owner checks before merging/deploying

- Confirm the correct web stream and ID. In GA4 Admin → Data streams → web stream, **turn Enhanced Measurement off**. In particular disable history-based page views, outbound clicks, scrolls, site search, forms, video and file downloads. `send_page_view: false` alone does not stop history-triggered pageviews. Do not enable automatic/user-provided data collection, connected site tags, extra destinations or duplicate Google tags. Check for account event-creation rules that could duplicate these events.
- Verify Google Signals is off and advertising personalization, Ads linking/remarketing and other advertising features are disabled. Code-level flags do not replace checking the account configuration.
- Review actual event/user data retention and whether resets on activity are enabled; record the selected settings. No account retention period is asserted in the policy.
- Review data-sharing settings, granular location/device settings, applicable Google Analytics terms/data processing terms, provider details, international transfer information, and the published privacy policy against the actual account. No specific agreement or legal compliance certification is claimed.
- Optionally register `placement` as an event-scoped custom dimension for reporting. A click must not be named or presented as an app installation.

Official references checked during implementation: [Google consent ordering](https://developers.google.com/tag-platform/security/guides/consent), [manual pageviews and history-event caveat](https://developers.google.com/analytics/devguides/collection/ga4/views), [privacy controls and disable flag](https://developers.google.com/tag-platform/security/guides/privacy), [configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en), [Analytics cookies](https://support.google.com/analytics/answer/11397207?hl=en), [regional data/privacy information](https://support.google.com/analytics/answer/12017362?hl=en), and [Google’s use of partner-site information](https://policies.google.com/technologies/partner-sites).

## Images and accessibility

Actual artwork and all original full-resolution assets are preserved. The displayed logo and hero use compressed WebP derivatives; screenshots retain their original readable files. Dimensions reserve image space. The hero is eager/high priority, and below-the-fold app images are lazy. The small 4,904-byte Play badge is unchanged. A JPEG of the existing logo provides social-card compatibility.

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

1. Confirm GitHub Pages deployment succeeded for the merge commit, then open all four HTTPS pages. Check mobile/desktop layout, screenshots, native FAQ, support email, legal details, privacy links, keyboard focus and Play destinations.
2. Fetch `/sitemap.xml` and `/robots.txt`: both should return HTTP 200 with the intended content. Confirm all four sitemap URLs return the expected pages and canonical URLs, and CNAME/HTTPS still work.
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
