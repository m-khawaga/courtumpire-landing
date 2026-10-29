# CourtUmpire Weekly — first release approval package

Prepared 27 October 2026. **Preparation only: no push, merge, deployment, cloud resource creation, DNS change, schedule or article publication.** This document supersedes dated readiness statements in the earlier validation/readiness reports. Accepted design and architecture are unchanged.

## Release identity and boundary

Implementation: `C:\courtumpire-landing-pr5-test\.local-review\weekly-feature`, branch `codex/courtumpire-weekly`, base/HEAD `a4abd3b60857149371499851ae9353f75c5e995b`. GitHub main and latest successful Pages run `40028148905` still match that commit. The feature remains uncommitted. Other checkouts and Android work are untouched.

The private package `.weekly-private/release-2026-10-27/` contains the exact changed-file SHA-256 manifest, tracked patch, added-source snapshot, website artifact, production Worker bundle, migrations, setup examples, checks and authoring handoff. The manifest is the commit review list; never use an indiscriminate `git add .`. It includes the existing Weekly work, not just this preparation turn. The two untracked pnpm bootstrap files are preserved locally but excluded from the npm-based release. All other modifications were inspected as Weekly integration, shared generated navigation, consent/analytics integration, privacy/help, build/import/editor/backend/tests or documentation. Existing unrelated features remain in the site artifact.

Development tools and deliberately fictional test harness source may belong in the repository, but are excluded from Pages and the Worker bundle. Actual drafts, private notes, screenshots, example article, editor exports, local database and sample engagement remain ignored under `.weekly-private/`. Do not commit the release package or its populated example into the public repository. `authoring/` is generic tool source, not stored private editorial content.

Only preparation changes this turn: exclude two pnpm metadata files from Pages, align and complete the standalone generation prompt, add this release plan and private package/evidence. No product feature or redesign.

## Functionality versus article evidence

Implemented locally: static article/archive/feed/SEO, empty launch state, published-only Home teaser, source-safe importer/editor/export, immutable publication identity/history, ranking comparisons, results grouping/five-row preview/expansion/filter state, anonymous moderated comments, persistent article and comment reactions, reports, closure controls, deletion/retention, protected moderation, Turnstile verifier and atomic registry synchronization.

The October 19 ranking discrepancy was resolved in the previous review using the official dated ATP and WTA selectors. All 20 retained ranks/points matched that release; the contrasting screenshots showed another release. Evidence: ATP `https://www.atptour.com/en/rankings/singles?dateWeek=2026-10-19`, WTA `https://www.wtatennis.com/rankings/singles?date=2026-10-19`; the private source ledger records actual retrieval separately. No current figures were relabelled October 19. Missing identity/comparison evidence does not erase independently verified current figures.

This does **not** make the October 23 rehearsal publication-ready. It contains 102 reconciled singles matches across seven events, plus a separately labelled doubles final. All seven coverage-ledger entries remain incomplete: boundary-day completion times and some conflicting/blank match records remain unresolved. Unsupported candidates were held out rather than fabricated. Other narrative claims have not received a new comprehensive factual sign-off. The validated example preserves these warnings and draft metadata.

Results functionality supports the complete stated ATP/WTA main-tour main-draw singles scope, all rounds, exact weekly window, deduplication, status distinctions, per-tournament coverage ledger and truthful filtered counts. It cannot prove that a researcher found every match. Comprehensive content still requires calendar/draw/results reconciliation each week. Rankings and tiny tables have no redundant filters; larger results retain one Tour/Tournament filter row.

First release: **zero published articles**, no rehearsal routes, no sample engagement, empty public registry/feed and no Home latest-edition teaser. The archive displays the truthful launch state.

## Read-only production inventory

GitHub Pages is legacy branch publishing from `main` at `/`, custom domain `courtumpire.com`, HTTPS enforced. It builds with Jekyll; it does not run the Node generator. Generated HTML must be reviewed and committed with source. Keep `_config.yml`; never add a root `.nojekyll`. `dist/` is a separate filtered local package, not the current hosting configuration.

Both exact Cloudflare accounts were read successfully on 27 October:

| Account ID | Workers / D1 / zones / Turnstile | Access |
| --- | --- | --- |
| `98702662d9e96f6f96dd8b0e1ba5e2e2` | All empty, successful reads | Apps and organization report not enabled |
| `a5646237c003a20af52d12c61b4bd0b7` | All empty, successful reads | Apps and organization report not enabled |

The earlier account authorization warning did not recur. Read access does not demonstrate write authorization. Recommend **a5646237c003a20af52d12c61b4bd0b7** as the older of two otherwise equivalent empty accounts; that is a transparent tie-breaker, not proof of historical intent. Neither account has been changed or deleted.

DNS currently uses `nsc1` through `nsc4.squarespacedns.com`. Apex A records are GitHub Pages' `185.199.108.153` through `185.199.111.153`; `www` points to `m-khawaga.github.io`. `weekly-api.courtumpire.com` does not exist. No full DNS zone export or registrar control has been verified.

## Exact proposed Cloudflare changes — approval required

1. Designate account **a5646237c003a20af52d12c61b4bd0b7** in every command/config. Create no additional account.
2. For the recommended `weekly-api.courtumpire.com` Worker Custom Domain, onboard `courtumpire.com` as an active Cloudflare DNS zone. Before any nameserver switch, obtain and reconcile the complete current DNS export (including mail/TXT/CAA/DNSSEC and other services), review its exact diff and Cloudflare-assigned nameservers, and obtain approval. Preserve Pages apex A/www CNAME and existing services, preferably DNS-only for the website records. This changes authoritative DNS, **not website hosting**. DNSSEC/DS handling needs a separate verified plan if enabled. No blind nameserver switch or guessed CNAME to workers.dev. If DNS migration is declined, pause and agree a different API hosting/domain plan; it is not already configured.
3. Create one D1 database `courtumpire-weekly-production`, proposed EU jurisdiction (confirm availability at creation), binding `DB`. Apply `0001_weekly.sql` then additive `0002_comment_reactions.sql`. No demo database import, seed script or rehearsal registry. Only the required singleton settings row is seeded by migrations.
4. Enable Zero Trust/Access in this same account, choose its team hostname and configure the owner's verified login identity (prefer an MFA-protected identity provider). Create a self-hosted Access application covering both `/admin` and `/admin/*` at `weekly-api.courtumpire.com`. Allow only the approved owner email; no Bypass/Everyone policy. Keep `/api/*` public for anonymous visitors. Record the application audience and issuer. Do not protect the entire public API with a visitor login.
5. Create one Managed Turnstile widget for **courtumpire.com** only. No localhost or test widget in production. Server expects hostname `courtumpire.com` and actions `weekly_comment`, `weekly_session`, `weekly_report`. Set `TURNSTILE_SECRET` and a fresh cryptographically random `SIGNING_SECRET` of at least 32 characters as Worker secrets, never browser/repository values.
6. Deploy Worker `courtumpire-weekly` from `backend/src/worker.mjs`. Pin compatibility date/flags as tested. Bind the real D1 ID. Set PUBLIC_ORIGIN=https://courtumpire.com, ADMIN_ORIGIN=https://weekly-api.courtumpire.com, ACCESS_ISSUER, ACCESS_AUD, OWNER_EMAILS and TURNSTILE_HOSTNAME. Keep workers.dev and preview URLs disabled, observability/body logging disabled and no schedules. The package has separate bootstrap (no route) and final custom-domain config examples. Bootstrap with no public route, set secrets, verify Access settings, then attach the custom domain. Configuration placeholders must be resolved first.
7. After backend negative/security checks pass, set `weekly-core/config.mjs` to the real API origin and public Turnstile site key. Keep reaction labels unchanged. Rebuild/review the Pages output and publish only the approved feature changes. Secrets never enter this file. The current checkout retains empty API/site-key values until activation approval.

Public requests use exact-origin CORS with credentials omitted and signed article-scoped random browser tokens. Admin operates on the API origin with Access login and a subject-bound CSRF token. CORS is not authentication. Worker code independently verifies Access JWT signature, issuer, audience, expiry and owner allowlist on every admin request; canonical admin origin is also enforced. Missing config fails closed. Alternate hostnames cannot grant admin access. Neither analytics consent nor an account login is required for public comments/reactions; Turnstile and the separate privacy notice still apply.

A Free-plan trial is the recommendation, subject to confirmation and real CPU measurements. The package omits the existing sample's 20ms CPU override because Free permits 10ms. Current published limits: Workers 100,000 requests/day; D1 5 million rows read/day, 100,000 rows written/day, 5GB total storage. Queries, rate counters and polling consume quota. Turnstile has a Free tier. Paid Workers has a $5/month minimum plus metered usage; no paid activation is authorized or implied. Check Access plan terms and all prices at activation. Set usage notifications and review metrics; an alert is not a hard spending cap. Quota failures must leave articles readable and engagement honestly unavailable.

## Deployment and verification order

All steps below are future actions, not actions performed in preparation.

1. Approve account/domain/DNS inventory, owner identity, EU database and plan/privacy/retention choices. Save current site revision, complete DNS export and configuration before changing anything.
2. Prepare DNS/Access/Turnstile/D1, apply both migrations, bootstrap Worker without a route, set secrets, then enable the protected custom domain. Record Worker version and database ID privately. The package's COMMANDS.txt gives exact CLI templates; replace only documented placeholders.
3. Verify unauthenticated `/admin`, script and every admin API get Access login/denial and never HTML/data. Verify missing/forged assertions, wrong audience/issuer/expiry/owner and alternate hostname rejection at Worker layer (locally covered; repeat remotely as possible without opening an auth bypass). Confirm authenticated owner works; missing/wrong CSRF and wrong Origin reject mutations. Check private/no-store caching. Confirm workers.dev/preview stay disabled.
4. With the empty registry, unknown/draft article IDs must reject; do not register a fictional article in production to force a success test. Check CORS accepts only the website, invalid/reused/expired/wrong-action Turnstile tokens reject, and provider failure reports unavailable. Genuine token happy paths cannot all be proven until an eligible real article exists; local D1 tests already cover positive behavior.
5. Configure frontend public connection values, regenerate pages, run focused config/artifact checks, review exact Git diff and publish through the existing approved GitHub workflow. Keep Pages hosting unchanged. Verify the real site, empty archive/feed/registry, desktop/mobile navigation, privacy links, no Home teaser, no draft/editor/backend/sample routes and no unexpected third-party calls before consent/action. Compare the remote artifact/public files with the approved manifest.
6. Download the **deployed** `/weekly/registry.json`; authenticated admin → Advanced settings → Published article registry → review and sync. The expected current version prevents concurrent overwrites; failure keeps reading working and new IDs closed to engagement. Initial registry is empty. There is no automatic CI registry sync.
7. After separate first-article approval/publication and registry sync, verify from the actual courtumpire.com article against the real API: anonymous pending comment, email absent from public response, owner approve/hide/report/delete, article and comment reaction add/change/remove/retry, reload persistence, close controls, no PII in analytics and correct consent. Use clearly labelled operator test submissions, never fake public participation; remove test records afterwards. Do not declare remote moderation verified before these checks actually pass.

## Actual manual weekly workflow

Generate and fact-check the three content outputs. Paste/import article JSON into the local editor, review errors, calculate ranking changes using repository published history, preview and export. **Export does not publish or save to the repository.** Keep preview and editor-notes TXT files private.

From the implementation worktree:

```powershell
npm run weekly:import -- create .weekly-private\incoming\cu-weekly-2026-10-30.json
```

This validates and saves a private draft. Existing ID? Use `update`, not create; obtain the current stored hash with `node scripts/weekly-hash.mjs .weekly-private/drafts/cu-weekly-2026-10-30.json` and pass `--expected HASH`. Keep input and saved files separate when editing. Duplicate IDs/slugs/edition numbers and stale hashes reject rather than overwrite silently.

After explicit article publication approval, and only then:

```powershell
npm run weekly:import -- update .weekly-private\incoming\cu-weekly-2026-10-30.json --expected CURRENT_SAVED_HASH --approve-publication
npm run build
npm run weekly:package
```

The publisher assigns edition 1 and real `publishedAt` once, writes `content/weekly/cu-weekly-2026-10-30.json`, pins ranking/publication history and generates pages. Publication becomes live only after the approved GitHub commit/PR/merge to main and successful legacy Pages build. The CLI's publication timestamp records the approved promotion time; it is not a claim that Pages deployed instantly. Review source, generated HTML/social asset, archive/Home/feed/sitemap/registry and history together. Push/merge remain explicit deployment actions, not editor functions. Then sync the deployed registry as above.

For later revisions use stable ID, current public-source hash and normal `update`; preserve original number/publishedAt, add real correction notes when appropriate. Slug changes generate static redirects, not server HTTP 301 rules. Unpublishing requires closing submissions first, the implemented `unpublish FILE --expected HASH`, build/Pages deployment and registry sync. Never reuse an edition identity/number or replace its preserved ranking baseline with today's values.

## Friday 30 October 2026

First real edition, no previous published baseline. Coverage **23 October 16:00 CEST (+02:00) inclusive to 30 October 16:00 CET (+01:00) exclusive**. This is seven local calendar days and 169 elapsed hours across the DST change. Cutoff is 15:00 UTC on 30 October; publication after review, approximately 18:00 CET if ready. No schedule is activated and no future match results are generated.

Use the complete FINAL prompt and blank template in the package, plus FIRST_EDITION_REQUEST.txt at/after cutoff. The validated example is optional structure reference, **not** a baseline or current facts. Later attach the actual previous published JSON (with publication metadata) and URL; never the historical rehearsal. Prompt includes the exact current schema and all three required outputs: article JSON, readable preview TXT and private editor-notes TXT.

Blank template is intentionally not valid for import/publication until required IDs, slug, title/deck/description, Friday date, offset timestamps and factual material are filled. Optional components remain null/empty; do not invent sources or table rows. The package's AUTHORING-GUIDE.txt lists required checks. Every new generated article still needs application validation and human source review; AI output is not guaranteed error-free.

## Rollback and operations

Website: keep the last good commit and approved file manifest. Close engagement first if an article or release is withdrawn. Use a new reviewed revert commit through the existing GitHub workflow; never reset/force-push another checkout. Restore the complete matching generated/source/config set. Verify Pages completes, then sync the registry of the restored live site. If reverting the entire feature removes the registry endpoint, close all submissions and retain D1; do not leave formerly public IDs writable by stale clients.

Backend: retain the prior Worker version/config. For a later regression, redeploy/roll back to the compatible known-good version, preserving D1 and secrets. For this first release there is no earlier Worker: close controls if possible, disable the API route or publish the frontend with blank API configuration if necessary; article reading stays static. Do not delete the account, database, widget or Access configuration as routine rollback.

Database: migrations are additive; do not reverse them by deleting tables. Before future migrations make a private D1 SQL export and record a Time Travel bookmark. An app rollback normally keeps the newer compatible schema. Restore into a separately approved recovery database, verify counts/relations, reapply deletions made since backup, then switch the binding during a controlled closed-write window. Restores can resurrect personal data; retain a deletion ledger without deleted content. Time Travel currently retains 7 days on Free/30 on Paid; provider backups cannot be promised immediately erased. No remote export/restore was performed here.

DNS: rollback only from the captured complete zone/registrar settings, including DNSSEC. Never improvise a partial zone rollback. Website A/www remain Pages throughout; no hosting transfer is proposed.

Retention is manual, not scheduled: pending/rejected/spam and optional emails 30 days; audit metadata 90 days; short-lived abuse/rate/retry records use the implemented cleanup; approved/hidden content until owner deletion. Private backups require access control and a retention decision. Owner must approve actual privacy/provider disclosures and purge responsibilities; this package is not a claim of automatic legal compliance.

## Validation and remaining gates

Reuse prior feature tests and 31 final filter/browser checks across eight tables (desktop/mobile, zero axe violations, no-JS all 102 rows). Do not confuse those with a fresh complete test-suite run. Current additional release checks: Wrangler dry run, production bundle exclusion scan, 112 denied admin requests, prompt/runtime/editor schema identity, private draft/public-empty checks, whitespace check, current official Pages builder artifact audit (204 files, nine canaries excluded, zero errors). Latest report paths/hashes are included privately. New final deliverables additionally receive importer/editor/export/re-import checks.

Remaining blockers: no real backend resources/auth/bot keys, no active Cloudflare zone or API DNS, owner login/plan/privacy decisions, and no approved first real article. Full DNS inventory and post-activation smoke tests are release gates. A backend or site preview is not evidence of remote working moderation.

## References checked during preparation

- GitHub Pages run: https://github.com/m-khawaga/courtumpire-landing/actions/runs/40028148905
- Worker Custom Domains require an active zone: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Access integration: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Turnstile server validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- D1 location: https://developers.cloudflare.com/d1/configuration/data-location/
- Workers/D1 pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Turnstile plans: https://developers.cloudflare.com/turnstile/plans/
- D1 backups: https://developers.cloudflare.com/d1/reference/time-travel/
