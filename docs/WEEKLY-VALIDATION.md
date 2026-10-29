# CourtUmpire Weekly — local validation and review

Follow-up: [the final readiness review](WEEKLY-READINESS-REVIEW.md) resolves the local Jekyll artifact gap and records the reconnected Cloudflare result. The official Pages builder produced 200 files with all nine private markers excluded. The original results below are retained as history.

Date: 26 October 2026. **No push, merge, deployment, cloud configuration change, schedule or real article publication.**

Feature branch: `codex/courtumpire-weekly` (local, uncommitted).

Implementation worktree: `C:\courtumpire-landing-pr5-test\.local-review\weekly-feature`.

Base: `a4abd3b60857149371499851ae9353f75c5e995b`. Read-only GitHub inspection matched main to the latest successful Pages deployment, run `40028148905`. Existing hosting is legacy GitHub Pages from main `/`. The original dirty checkout and Android/Wear work were not edited. A separate empty app-managed worktree was created during setup but contains no implementation; the app refused its archival because it is marked primary. Review the implementation path above.

## Implemented and reviewable

- Generated static Weekly archive, published-only Home teaser, complete articles/tables without JavaScript, navigation, RSS, sitemap, social PNG, source/correction metadata, optional reveal/timeline and explicit media loading.
- Exact `courtumpire-weekly/v1` schema, runtime validation, private fictional fixture generator, blank template, static browser editor, import/update/unpublish commands, stable publication identity, optimistic source-hash checks and slug redirects.
- Two ATP/WTA singles tables using tour plus stable official profile identity. Dated ranking evidence is separate. Changes compare immutable previous-edition snapshots, with arrows/text, zero versus N/A, first-edition message, explicit missing-data review, and optional verified historical baselines. Renamed comparison editions retain working links; withdrawn editions retain the snapshot and show a withdrawal label instead of linking to a removed page.
- Worker/D1 public comments, reports and browser-level reactions; real local database moderation UI; signed Access identity/owner authorization, CSRF, distributed throttling, Turnstile verifier, idempotency, closure precedence and registry synchronization. Production config fails closed; local test authentication exists only in the separate Node demo harness.
- Draft/editor/backend exclusions in the filtered public package and legacy Pages configuration. Private fixtures, logs, screenshots, D1 state and authoring drafts are Git-ignored.

## Validation results

| Gate | Result |
| --- | --- |
| `npm run build` | Pass; 74 generated routes, 78 public routes including existing hand-authored pages |
| `npm run lint` | Pass; JavaScript syntax and route/title checks |
| `npm test` | 52 passing existing/analytics-consent tests |
| Weekly tests | 18 passing tests: 4 contract/build/import, 6 ranking, 8 backend; the final ranking addition was run separately after the original 17-test suite |
| `npm run test:weekly:browser` | 58 checks, no errors; local Edge/Playwright |
| Local D1 migration | Pass; actual Miniflare/SQLite D1, no remote database |
| Wrangler Worker bundle | Pass with `--dry-run`; no deployment |
| Dependency audit | Zero reported vulnerabilities after patched development dependency overrides |
| Whitespace diff | `git diff --check` passes |

Meaningful coverage includes draft/private source exclusion from `dist`, empty/unpublished selection, 16-edition pagination/month filters, stale generated page removal, source escaping and references, timestamp checks, immutable publication metadata, expected-hash rejection, ranking snapshots, pending/rejected/email non-disclosure, XSS inertness, JWT signature/owner/expiry rejection, CSRF, D1 throttling across handlers, concurrent reactions, retry deduplication and atomic registry conflict rollback.

Browser checks cover 390, 768 and 1440 px archive/article/Home layouts; desktop navigation fit and mobile menu; keyboard skip/reveal navigation; complete no-JavaScript reading; actual local submission/moderation/reactions; editor import/edit/export; API-offline reading; no video network before the explicit load action; and axe WCAG 2 A/AA + 2.1 AA checks including contrast at all three sizes and the admin view. Automated checks are not a guarantee of full accessibility conformance. Analytics tests verify consent gating and reject text/email payloads.

Screenshots are private review artifacts in `.weekly-private/screenshots/`: `archive-{390,768,1440}.png`, `edition-{390,768,1440}.png`, `home-{390,768,1440}.png` and `moderation-1440.png`. The exact browser check summary is `.weekly-private/browser-results.json`.

## Local demonstration

- [Public launch state](http://127.0.0.1:4187/weekly/)
- [Fictional article](http://127.0.0.1:4187/demo/)
- [Private authoring editor](http://127.0.0.1:4187/authoring/)
- [Fictional article with local engagement](http://127.0.0.1:4187/demo/engagement.html)
- [Local-only test-auth moderation](http://127.0.0.1:8797/admin)

The two loopback servers must remain running. The runbook explains restarting and stopping them. The fictional article deliberately shows missing ranking data rather than inventing official top-10 facts. Synthetic ranking calculations are covered in tests.

## Explicit limits and remaining activation work

No real backend, Access login, Turnstile widget or remote moderation was deployed. Local verifier tests include wrong hostname/action, failure, expiry and replay responses; real provider tokens must be smoke-tested after separately approved activation. The normal production Worker rejects missing auth configuration.

The actual remote legacy Jekyll deployment artifact has not been built/inspected here: Ruby/Bundler are unavailable and the installed Docker daemon is not running. The explicit allowlisted `dist` artifact was tested. `_config.yml` protects legacy Pages output, but the first approved Pages artifact still needs inspection. Do not add a root `.nojekyll` or commit private drafts.

Both named Cloudflare account IDs were visible in the account list and separately scoped resource reads. Workers, D1, zones and Turnstile widgets were empty in each; Access returned not enabled. A conflicting connector authorization warning means read visibility must not be treated as deployment authorization. No intended account has been selected. See [exact account IDs and configuration steps](WEEKLY-CLOUD-SETUP.md).

The nested privacy 404 is historical: deployed source already uses root-relative `/privacy.html` and `/privacy.html#website-analytics`. The former relative consent link was fixed in `fea8a299` on 21 October 2026. Current live nested pages and all generated local links were checked; no duplicate page or blanket redirect was added. Search Console's exact historical referring crawl was not available. See [evidence](PRIVACY-LINK-INVESTIGATION.md).

## Handoff

Start with [the beginner runbook and concrete approval checklist](WEEKLY-RUNBOOK.md). It covers import, preview, explicit publication approval, updates, withdrawal, legacy Pages build order, registry synchronization, moderation, retention, backups and disabling engagement. [Cloud setup](WEEKLY-CLOUD-SETUP.md) records exact remaining server configuration, account selection and pricing/abuse limits. [Rankings](WEEKLY-RANKINGS.md) and the [generation prompt](WEEKLY-GENERATION-PROMPT.txt) keep the authoring process aligned with v1.

[Exact changed-file manifest](WEEKLY-FILES.txt). Many existing HTML files change only because the shared generated navigation gains Weekly. No real edition JSON is present in `content/weekly/`.
