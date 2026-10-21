# CourtUmpire release-readiness audit — 21 October 2026

**READY FOR OWNER-APPROVED DEPLOYMENT, with analytics delivery kept disabled.** No unresolved release blocker was identified in the checked candidate. This assessment is not a guarantee of zero defects, a penetration test, accessibility certification or legal certification. Deployment requires a separate owner-approved action.

## Candidate, deployment isolation and rollback

Repository: [m-khawaga/courtumpire-landing](https://github.com/m-khawaga/courtumpire-landing). Review branch: `codex/release-readiness`, based on `main` at **`6b710c4366f842b77495a3ca8c93ea1ba0eb32f0`**. The draft PR/final handoff identifies its exact committed HEAD.

An isolated checkout preserves the original `codex/practice-planner-local` tree at `e73a0623972e20b9b8cd94f0265fa5f16b241d99` plus accumulated uncommitted changes. A hashed snapshot copied 203 source/asset files. The original was not reset, staged or committed. Temporary PDFs/screenshots/runtime outputs are excluded. Remote inspection found no open PR or separate security-review branch/change to duplicate or reverse; this does not assert that no private review exists. State is rechecked before pushing.

GitHub Pages reports **legacy branch publishing from `main`, `/`**, custom domain `courtumpire.com`, HTTPS enforced and approved certificate. Its only workflow is GitHub's dynamic `pages-build-deployment`; there are no repository-defined workflows, PR/label triggers or `workflow_run` chains. The `github-pages` environment allows only branch `main`. The CLI token cannot list webhooks, but a signed-in read-only settings inspection resolved that gap: the webhook list is empty and Installed GitHub Apps explicitly says none are installed. No other deployment integration was visible. The dedicated review push/unlabelled draft PR is isolated from the observed publishing configuration. No settings/protections/permissions were changed.

**Verified live baseline:** `6b710c4366f842b77495a3ca8c93ea1ba0eb32f0`, successful Pages build/deployment on 17 October 2026, deployment `7145549612`, workflow `39068118538`. Live `/`, `/contact.html` and `/analytics.js` exactly match that commit's bytes/SHA-256 hashes, independently of default-branch HEAD.

After a later owner-approved deployment, rollback should use a new branch and reviewed PR reverting the release merge/squash commit. Preserve unrelated changes landed afterward. Only the owner's separate approval to merge that rollback should republish via the existing main/Pages process. Use the baseline above as the comparison tree; do not reset/force-push main or change DNS. Keep the reviewed release commit available.

## Findings and status

| Classification / location | Evidence, impact and disposition |
| --- | --- |
| Fixed privacy accuracy — `privacy.html` | Wording initially implied consent alone starts GA despite the disabled account-review guard; an older duplicate email paragraph was narrower than the detailed enquiry section. Current disabled state/future conditional delivery and bounded numeric metrics are explicit; duplicate email wording is removed. Controller/enquiry details remain. Build/SEO and Contact/privacy links checked. |
| Fixed verification reliability — `tests/checklists-formats.cjs` | A personal temporary attachment path was not portable; a one-set export fixture retained an extra set. Use the existing repository sample SVG and explicitly clear the unused set. The 62-check suite passes; application validation still refuses to silently discard entered sets. |
| Fixed release hygiene — `.gitignore`, `scripts/build.mjs` | Untracked PDF outputs were eligible for accidental staging. `output/` is excluded alongside `.local-review/` and `node_modules/`; runtime/test artifacts are not committed. The generator strips trailing line whitespace so regenerated HTML passes staged diff checks consistently; rendered content is unchanged. |
| Passed rendering/file boundaries — `tests/release.cjs` | 56 targeted checks cover hostile names, URL search, reminders, event fields, notes/service order, reload/print escaping, invalid-input recovery, local logos and narrow layouts. No execution, unexpected dialogs, browser errors or external requests. |

No unresolved credible credential exposure, broken consent, unusable checked core flow, publishing defect or serious indexing error was found.

## Security and privacy coverage

Bounded credential-pattern and private-filename scans covered the original 203-file candidate and 82 reachable historical blobs with no matches. Source review followed user text through escaped HTML or DOM text/value assignments and print output. This is not exhaustive secret detection. GitHub secret scanning and Dependabot alerts are **disabled**, so their endpoints could not supply an independent scan; disabled is not an empty-alert result. The application/build declares no npm dependencies and uses browser APIs/Node built-ins. Existing external Playwright/Sharp QA tooling is outside this release dependency inventory. No blanket upgrade was made.

Logo processing accepts PNG/JPEG/WebP only, caps input at 5 MB, checks signatures, decodes, rejects dimensions above 8192 px per side or 24 MP, then resizes/re-encodes locally with bounded saved output. SVG is rejected. Tests verified valid formats, rejected SVG/mismatch/oversize, preservation of the prior logo and removal. Only processed image/dimensions are saved, not original filename/metadata. No upload service exists.

No contact Worker, email binding, dedicated rate-limit backend or Resend dependency remains. Contact is mailto/copy only, with optional topic, encoded subject, general enquiry, selectable address, privacy link and honest copy feedback. Opening email never claims delivery. Tests inspect targets without sending mail. Hosting access logs remain distinct from local processing. The policy explains saved match/history, practice, event/logo/checklist data, reset/deletion/site-data controls and in-memory quiz state. Consent withdrawal does not erase tools. Shared components and actual controller/imprint details are retained. Mailbox provider/safeguard/deletion arrangements and legal review still require owner verification; no unused form-provider or invented retention claim was added.

The dedicated property **G-H387MYJ9KJ** is preserved with **`ACCOUNT_SETTINGS_REVIEWED=false` unchanged**. This candidate sends no production GA even after acceptance. The 290-assertion suite intercepts an HTTPS production origin, enables the guard only in the intercepted response and substitutes a recording Google stub; source/account settings are unchanged and real collection is blocked. It checks fresh/rejected/accepted/persisted/withdrawn/expired/failed-storage states, both-store acceptance, cookie cleanup, no replay, single tag/config/pageview, query/referrer redaction and local exclusion. Additional tests exercise consent-gated categorical/bounded numeric events.

Events distinguish contact intent, successful PNG generation, print-dialog intent, actual completion and confirmed reset. They exclude names, emails, custom text, logos/filenames and full mailto URLs. No per-point stream is added. Automatic Google capture cannot run with delivery off. Before any separately approved activation, the owner must verify Enhanced Measurement/user-provided-data detection, connected tags/destinations, retention, Signals/Ads/sharing, provider terms and actual policy wording. Stub checks do not verify the live account. Do not activate GA incidentally during deployment.

Live HTTP redirects to HTTPS. Home/contact/privacy/imprint/robots/sitemap return 200; a random missing path returns 404. Ordinary live pages had no CSP/HSTS response headers in this observation. GitHub Pages provides no generic application-server/header configuration to this project: adding `_headers`, nginx or Worker files would not configure this host. Header hardening is a capability follow-up, not a migration requirement or fabricated scanner pass. No deployment workflow/actions/credentials are introduced.

## Journeys and content

Exactly **100** questions live in `tools/quiz.mjs`; **50** activities are combined from `practice/catalogue.mjs` and `practice/catalogue-extra.mjs`. All schema/answer/reference/player constraints passed. Beyond counts, the audit read the question/answer bank and reviewed ambiguous/format-dependent cases against the official [ITF Rules of Tennis 2026](https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf), especially errors, lets, doubles order, hindrance, short sets and match tiebreaks. No unresolved answer conflict was identified. This is editorial review, not independent umpire certification; see `QUIZ-SOURCES.md`.

The full activity catalogue's objectives, player counts, equipment, pattern descriptions and rotations were reviewed, with representative renders and planner compatibility checks. Related strokes have different objectives/roles/progressions; the older two solo-service choices remain related activities. No placeholder/video was accepted as complete. Diagrams are schematic; physical trials and independent coaching approval were not performed. See `ACTIVITY-CONTENT.md`.

The live scorer is explicitly **singles/advantage only**. Four/six-game live formats, service/tiebreak/undo/reset/winner/export behavior were tested. Doubles is supported by the helper, rotations, rules and sheets; no doubles/no-ad live engine is claimed or added. Four-game sets use a seven-point win-by-two tiebreak at 4–4 independently of no-ad/no-let options.

Current-run visual journey steps (healthy within stated scope):

1. **Find a drill:** three-player/search filters give one appropriate diagrammed activity; incompatible session offers explicit replace/keep recovery. `01-filtered-library.jpg`.
2. **Open the plan:** selected activity persists, edited total/target difference is clear, edit/start/print/clear controls work. Full generation/print checked automatically. `02-compatible-plan.jpg`.
3. **Contact mobile:** stacked topics and centered selectable address/actions; subjects, keyboard and clipboard failure/success verified. `03-contact-mobile.jpg`. A retained-scroll/sticky-header capture was rejected and replaced with a fresh navigation capture.
4. **Score/reset:** four-game setup and accessible serving identity; reset dialog focuses Cancel, cancellation preserves 15–0. Export/tiebreak/winner cases checked automatically. `04-live-scorer-mobile.jpg`, `05-reset-dialog-mobile.jpg`.
5. **Quiz:** explanation follows submission, answers lock, Next enables without automatic movement. Revisit/reset/missed review checked automatically. `06-quiz-mobile.jpg`.
6. **Club tools:** current-run captures/tests cover compact cards, removed rows, permanent deletion/reload/default restoration, duration/round modes, spare courts/rests, invalidation/recovery, doubles sheets and logo prints.

Keyboard/focus/dialog/status/contrast checks supplement screenshots. Axe/Lighthouse, physical assistive-technology/device testing and a physical printer trial were not performed; full accessibility compliance is not asserted.

## Checks performed in this audit

| Check | Result |
| --- | --- |
| Production build / script-route-title lint | Passed; 76 registered routes, 74 production canonicals |
| Unit tests | 43 passed |
| Site/production-origin consent interception | 290 assertions passed, 16 page/viewport renders |
| Expansion journeys | 185 checks passed |
| Contact | 81 checks passed |
| Release rendering/builders/logo regressions | 56 checks passed |
| Checklists/formats/print | 62 checks passed |
| Generated-page SEO | 10,454 checks passed; 74 canonicals, 160 internal destinations |
| Print/export | Four actual score PNGs; six PDFs / ten pages rendered with backgrounds off; branding, continuation layout, checkmarks/exclusions and representative wrapping inspected |
| QR | 14 exact-destination decodes: four full PNGs, four 540px copies and six PDF first pages at 150 dpi. 90-dpi PDF decoding was unreliable and is not claimed as passing; vector originals unchanged. No physical phone/print scan claim |

These browser suites block real external traffic and reported no page errors/unexpected external requests. Historical broad suites were not all rerun and are not asserted to pass. The final build is regenerated from the committed source convention (generated HTML lives at repository root).

One cold-cache mobile lab run/page used Chrome 390×844, 4× CPU, 150 ms latency and 1.6 Mbit/s downstream. LCP: home 1.488 s, planner 3.680 s, activity 2.580 s, scorer 2.468 s, rotation 2.516 s. CLS was 0 and overflow absent on all five; approximately 114–132 KB transferred. These are local synthetic observations, not field INP/Core Web Vitals or a Lighthouse/accessibility score. Planner cold loading is a non-blocking follow-up.

Production canonicals, robots, metadata, sitemaps, substantive initial activity content and internal destinations passed. Filter/session/print URLs are excluded. The intentional 404 noindex is preserved without production-page leakage. Search Console's older two redirects, one noindex and one duplicate remain unresolved/unverified without affected URLs. Final host module MIME, direct new paths, compression/cache and custom 404 behavior require post-deployment verification.

## Local review and evidence

In the isolated candidate directory, Windows PowerShell:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
$env:PORT='4175'
npm.cmd run preview
```

The owned preview actually printed **http://127.0.0.1:4175**. It is stopped at handoff; restart with these commands, stop with Ctrl+C. No deployment script is needed. Visit Contact, `/practice-planner/`, `/play-score/scoreboard/`, `/play-score/umpire-challenge/` and `/clubs-coaches/tennis-kit/`.

Other commands run: `npm.cmd run test:existing`, `test:expansion`, `test:contact`, `test:release`, `test:checklists-formats`, `test:performance`, `test:seo`. Browser checks used the existing external runtime via `NODE_PATH` and `BROWSER_CHANNEL=chrome`, owned ephemeral loopback servers and blocked collection. No dependencies/runtime folder or temporary outputs are committed. No remote CI was manually dispatched.

Evidence is local/untracked: the original checkout's `.local-review/release-audit/` holds source snapshot, security/content matrices, live hashes and accepted IAB captures. The isolated checkout's `.local-review/` holds current test JSON/screenshots and `release-audit/pdf-renders/`; `output/pdf/` contains the six actual PDFs. Previous review outputs are historical, not substituted as current evidence.

## Follow-ups and post-deployment checklist

Owner follow-ups: keep GA disabled until account/privacy review; verify mailbox/legal arrangements; consider repository scanning/branch protection; investigate planner cold-load performance if reproduced on the host; obtain the Search Console issue URLs; perform physical device/assistive-technology/print checks. These are not represented as completed.

After separately approved deployment:

1. Verify deployed SHA/artifact, HTTPS/certificate/custom domain.
2. Direct-open home, Contact/legal pages, planner, a new drill, scorer, rotations/rules/sheet and a missing URL; check module MIME and custom 404 status.
3. Generate one plan, score image and print/logo example; inspect Games/Points, real status and exact QR destination.
4. Check general/problem mailto and clipboard feedback without unnecessary real enquiries.
5. Verify no Google requests before acceptance, after rejection/withdrawal, and after acceptance while the guard remains false. If separately activated later, use one minimal owner-approved event/DebugView test and confirm automatic capture is off; never send names/full mailto or replay pre-consent activity.
6. Check robots/sitemap/canonicals and the actual Search Console issue URLs. Request indexing only if separately authorized.

Production, DNS/routing, hosting/security settings and the live GA account were not changed. Only a reviewed source commit/review-branch push and one draft PR are authorized remote writes; no merge, auto-merge or deployment is part of this handoff.
