# Search Console nested privacy 404

Investigated on 26 October 2026, alongside the local Weekly feature. No link fix or redirect was necessary.

Reported URL: `https://courtumpire.com/tennis-drills/serve-toss-and-catch/privacy.html`.

The defect existed in earlier consent UI source: the parent of commit `fea8a299` used `href="privacy.html#website-analytics"` in `analytics.js`. On the nested drill page, that relative href resolves to the reported malformed path. Commit `fea8a299` (21 October 2026) changed it to root-relative `href="/privacy.html#website-analytics"`. That fix is present in the verified deployed commit `a4abd3b60857149371499851ae9353f75c5e995b`.

Direct live HTTP checks returned:

| URL | Status | Privacy destination in returned content |
| --- | --- | --- |
| `/tennis-drills/serve-toss-and-catch/privacy.html` | 404 | Error-page footer links to `/privacy.html` |
| `/tennis-drills/serve-toss-and-catch/` | 200 | `/privacy.html` |
| `/tennis-drills/crosscourt-rally/` | 200 | `/privacy.html` |
| `/clubs-coaches/session-checklist/` | 200 | `/privacy.html` |
| `/privacy.html` | 200 | Self canonical `https://courtumpire.com/privacy.html` |
| `/analytics.js` | 200 | `/privacy.html#website-analytics` |

The shared `footerMarkup()` in `scripts/build.mjs` already uses `/privacy.html`, as does the current consent UI. Inspection of all 78 generated local public routes found 82 privacy links, all resolving to `/privacy.html`; none resolved into a nested folder. The public package retains these generated links. No duplicate privacy document was created and the malformed path continues to return a real 404.

The old consent href is a concrete historical source capable of generating this URL. Search Console's exact discovery/referring-page history was not available in this session, so attributing that particular crawl conclusively to the consent link remains an inference. The report may persist until recrawling; this task did not change Search Console or request indexing.
