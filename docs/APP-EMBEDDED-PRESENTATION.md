# Embedded app presentation — local review

Worktree: C:\CourtUmpire-web-embedded. Branch: codex/app-embedded-presentation.
Base: 7f8d1aab72e1d11afc5734c926ce2b5a2f885ff6, freshly fetched origin/main. No push, PR, publishing, deployment, DNS or production-data operation was performed.

## Public presentation changes

- weekly/embedded.mjs and embedded.css: opt-in cu-app=1 and explicit cu-theme=light|dark; scoped palette/layout, removal of duplicate promotional/site chrome, retained privacy/consent controls, internal-link propagation, canonical URL cleaning, and explicit print/PNG requests for the phone.
- practice/site.mjs and weekly/weekly.mjs: load the presentation module only in app mode, tolerate an asset-release lag and retain ordinary-browser behavior. The website live-score engine is not initialized in embedded mode.
- weekly-core/render.mjs: semantic Umpire span and an app-only contents disclosure. The ordinary browser keeps its existing visible contents and wordmark presentation. Article content, dates, sources, rankings and publication contracts are unchanged.
- scripts/weekly-public-build.mjs: includes the two new public presentation assets in the existing Worker allowlist. scripts/weekly-package.mjs includes them in the existing public static package.
- tests/embedded-presentation.test.mjs and embedded-browser.cjs: public URL/theme policy, Worker packaging, browser UI, planner storage, article anchors, privacy access, unchanged form payloads, print requests and ordinary-browser scoring.

Only app-mode scoring links/cards and match setup/score UI are hidden. The normal website scoreboard and navigation remain available in browsers. The phone intercepts scoreboard links, including direct index.html aliases, and selects its existing native Match destination without changing a match. There is no scoring synchronization.

The module does not add fields to forms, change comment/reaction payloads, modify consent choices, add analytics or own tool storage. Existing privacy/analytics settings controls retain their existing listeners. Print media remains governed by existing print styles. Internal anchors remain native links. Native shares/open-in-browser actions use clean canonical URLs; website article shares already use canonical metadata.

## Checks

Existing build and lint passed; default unit suite: 52 passed. Focused presentation/public Worker asset tests: 4 passed. Embedded browser suite: 166 checks passed across 360/390/768 widths and both explicit appearances, including the ordinary browser scoreboard.

Full Weekly suite: 72/75 passed; the same three prompt/schema tests fail on an independently archived copy of the exact base with required generated assets. Existing planner browser suite fails at the same rotation-planner image-loading assertion on both base and feature branch. Neither failure was hidden or fixed outside scope. Local previews and fixtures make no production publishing or moderation calls.

Run locally: npm ci; npm run build; npm run lint; npm test. For Weekly assets/tests run node scripts/weekly-admin-build.mjs and node scripts/weekly-public-build.mjs before npm run test:weekly. For the focused suite run node --test tests/embedded-presentation.test.mjs tests/weekly-public-assets.test.mjs.

For visual/browser review run node scripts/weekly-demo.mjs; node scripts/weekly-package.mjs; npm run weekly:preview in one terminal, then node tests/embedded-browser.cjs in another. The existing read-only preview runs on 127.0.0.1:4187. The demo is fictional and private; it must never be published as content.

Build/demo tooling writes generated HTML, sitemap/routes/catalogue and authoring fixtures in the checkout. Those outputs were restored to the recorded base after local checks, so protected publication/editorial data is not part of the diff. Ignored dist and generated Worker assets are local verification products, not a second article registry or deploy instruction.

## Later, separately authorized release dependencies

GitHub Pages serves the existing root of main; /weekly/* is dynamically served by the existing Worker. Updating Pages alone does not update live Weekly. No hosting source, route, configuration, secret or binding change is needed for this presentation work.

1. In the later authorized release, regenerate the public Worker shell/assets with node scripts/weekly-public-build.mjs from the approved source. The Worker bundle must include the updated weekly-core/render.mjs and generated backend/src/public-assets.generated.mjs. The packaged assets must serve /weekly/embedded.mjs and /weekly/embedded.css alongside weekly.mjs/weekly.css/dates.mjs/engagement.mjs/routes.mjs and existing privacy assets.
2. Release that existing Worker through the project's established separate release procedure, then release the public Pages files: practice/site.mjs, weekly/weekly.mjs, weekly/weekly.css, weekly/embedded.mjs and weekly/embedded.css. Conditional imports provide a functional fallback during a staged release; Worker-first avoids an embedded asset gap.
3. If preparing a static public package, use the updated scripts/weekly-package.mjs so both presentation assets are retained. Do not replace the live catalogue with the empty checked-in weekly/registry.json, re-import articles, build a new registry, or touch publishing/admin/backend logic. Existing live RSS remains the phone teaser source.
4. Verify live opt-in light/dark URLs, article anchors and participation/consent, planner/drill storage, native print/PNG handling and normal browser pages. Shared/browser URLs must omit cu-app/cu-theme/cu-action/cu-data. No D1 migration, article edit, authentication change, analytics change or infrastructure change is required.

Until that separate release, the phone can browse the currently deployed site with native toolbar, errors/retry, native Print and browser fallback. Its native scoreboard guard is already active. Old website chrome and its old fixed theme may remain visible until both public presentation delivery paths are updated. The user's browser has separate saved tools/storage from the phone WebView.


## Follow-up: live publishing versus presentation deployment

The live public handler already derives archive and RSS from published editions in D1 and sends Cache-Control: no-store. Article bodies are stored rendered HTML. The one CSS correction in this follow-up hides the older contents nav only when its replacement .weekly-app-contents actually exists, preserving navigation on already published rows without editing articles or the publication handler. Two extra local browser checks exercise this old-markup fallback; 168 embedded browser checks pass. The existing two-dummy-edition publication test passes against local in-memory D1 and the real handler, with no network publication.

There is one later, separately authorized presentation release: package/release the existing public Worker shell/assets and Pages presentation files as described above. It delivers embedded light/dark styling, chrome/scoreboard-link hiding, internal presentation-parameter propagation, print/PNG controls, and new contents disclosure markup for subsequently rendered articles. Existing stored articles keep their usable contents navigation and receive shared shell/CSS changes. No article rewrite, schema migration, admin change or registry replacement is needed.

After that one-time release, ordinary future Weekly publishing through the established workflow updates live article/archive/RSS immediately. It requires no APK rebuild, app code edit, or repeated deployment of presentation assets. Nothing in the Android defaults points to localhost, /demo/, or the checked-in empty catalogue. If RSS refresh fails, the app's independent Browse all editions link still opens the live archive.

Local review uses npm run weekly:preview on http://127.0.0.1:4187. /demo/?cu-app=1&cu-theme=light (or dark) is fictional content; /weekly/?cu-app=1&cu-theme=light (or dark) is the static checked-in catalogue and can be empty. /practice-planner/?players=2&cu-app=1&cu-theme=light (or dark), /tennis-drills/, /play-score/umpire-challenge/ and /clubs-coaches/ are local tool previews with the same two presentation parameters. These separate browser previews do not replace the phone's live URLs and are not end-to-end WebView tests. Keep the preview server running for user review; stop with Ctrl+C afterward. No deployment or release was performed.
