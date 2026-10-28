# Cloudflare activation record — nothing deployed

Latest reconnected review: see [WEEKLY-READINESS-REVIEW.md](WEEKLY-READINESS-REVIEW.md). Both exact IDs now pass scoped resource reads without the previous account-authorization warning. Access remains not enabled. Recommended account (not configured): `a5646237c003a20af52d12c61b4bd0b7`, using earlier creation time only as a tie-breaker.

Initial read-only inspection: 26 October 2026. No resources were created, deleted or changed. No account is selected for future deployment.

| Exact account ID | Listed account name | Workers | D1 | Zones | Turnstile widgets | Access |
| --- | --- | --- | --- | --- | --- | --- |
| `98702662d9e96f6f96dd8b0e1ba5e2e2` | CourtUmpire | 200, empty list | 200, empty list | 200, empty list | 200, empty list | 403: Access not enabled |
| `a5646237c003a20af52d12c61b4bd0b7` | CourtUmpire | 200, empty list | 200, empty list | 200, empty list | 200, empty list | 403: Access not enabled |

`GET /accounts` returned both exact IDs. The connector additionally emitted a conflicting warning on the Access calls that these two IDs were not in its session-authorized accounts, naming two other accounts instead. Separately scoped resource reads against both IDs succeeded as recorded above. This establishes read visibility for those resources, **not deployment authorization or write capability**. Recheck the intended ID and connection authorization before activation. Do not infer the intended account from the duplicate display name. Neither account was modified; no third account was created.

There is no observed Cloudflare zone for CourtUmpire in either checked account, so this work does not assume Cloudflare proxies `courtumpire.com`. Hosting remains GitHub Pages. Owner decisions are still required for the intended account, API hostname, DNS/zone arrangement and Cloudflare plan. No other account's resources were inspected beyond the account list.

## Configuration to complete after approval

1. Choose the **exact existing account ID**, confirm resource permission, plan and spending/quota controls. Set `account_id` in a reviewed production config and use that same ID for every later Wrangler command. The checked-in local config intentionally has no account ID and a dummy D1 ID.
2. Create one approved D1 database, record its real ID, and apply both migrations in order (`backend/migrations/0001_weekly.sql`, then `0002_comment_reactions.sql`) to that specific remote database only after approval. The local migration has already been exercised.
3. Approve a same-site API hostname such as `weekly-api.courtumpire.com` only after checking DNS/hosting requirements. Do not move the static site off Pages. Set `PUBLIC_ORIGIN=https://courtumpire.com`, exact `ADMIN_ORIGIN=https://APPROVED_API_HOST`, and add the approved route/custom domain. `workers_dev` and `preview_urls` remain false.
4. Enable Cloudflare Access in the chosen account, create a self-hosted application protecting `/admin` and `/admin/*` on the API hostname, and allow only the verified owner identity. Set `ACCESS_ISSUER=https://ACTUAL_TEAM.cloudflareaccess.com`, `ACCESS_AUD=ACTUAL_AUDIENCE`, and `OWNER_EMAILS=VERIFIED_OWNER_EMAIL`. The Worker validates RS256 signature, issuer, audience, required expiry/issued-at/sub/email claims and owner allowlist on **every admin request**, including the HTML/JS. Alternate origins fail the exact admin-origin check even if exposed later. Missing configuration fails closed.
5. Configure Turnstile for the actual public hostname. Use stable actions `weekly_comment`, `weekly_session`, `weekly_report`. Set `TURNSTILE_HOSTNAME=courtumpire.com`, keep the secret server-side, and set only the public sitekey in `weekly-core/config.mjs`. Host/action checks are mandatory. Tokens are single use with a five-minute lifetime; fresh widgets are removed after completion/failure and recreated per action. Real remote success/replay behaviour still needs the activation smoke test.
6. Store `TURNSTILE_SECRET` and an unpredictable `SIGNING_SECRET` (at least 32 characters; use a cryptographic secret generator) with the approved server secret mechanism. Never paste them into chat, browser code, source, command arguments or logs. There is no local-auth environment flag in the production handler. Do not deploy `backend/local-demo.mjs`.
7. Deploy only after explicit approval, verify real Access/Turnstile and closure behaviour, then set the frontend API origin/sitekey. Sync the public registry in the authenticated UI after its matching Pages deployment.

Public requests deliberately use `credentials: omit` and a signed, random, article-scoped bearer token for reactions. They do not depend on third-party cookies. Public CORS accepts only the configured exact website origin and is not treated as authentication. Admin UI and API share the API origin and use Access's browser authentication with same-origin credentials. Every admin mutation also needs a short-lived, subject-bound CSRF token and exact Origin. Private responses are `no-store`, scripts have no analytics and user text is never interpolated as HTML.

## Costs and abuse limits

Recheck these references and the chosen account's plan **at activation**, not just this development date:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): the current table lists 100,000 requests/day and 10 ms CPU/invocation on Free. Paid examples include a $5 subscription plus usage. This is not a promise of permanent free operation.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): current Free allowances list 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. Reads are rows scanned, not merely rows returned. Reaction totals scan that article's indexed reaction rows. Throttling and lazy cleanup also consume reads/writes.
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) and [Access plans](https://www.cloudflare.com/plans/zero-trust-services/): verify eligibility and actual account configuration before use.

Application windows are ten minutes: 8 comment attempts, 8 browser-token issuances, 10 reports, 60 reaction writes and 120 public reads per keyed network/window. These are distributed D1 counters, not in-memory counters. Shared networks can reach them; distributed attackers can evade a single-network limit and consume quotas. CAPTCHA and rate limits reduce abuse, not eliminate it. The signed browser identifier is a best-effort browser constraint, not one-person-one-vote proof. Clearing storage can create another identity after a new anti-abuse challenge.

The config's 20 ms CPU ceiling is a reviewed local example for a plan supporting it; Free's plan limit may be lower. Validate actual CPU use and adjust only with plan/cost approval. No logs of bodies/emails/tokens are emitted by application code; Worker observability is off in this phase. Decide provider access-log retention and account analytics settings before activation. Quota failure returns an honest unavailable state and never prevents static reading. A paid plan is not enabled here.

## Verified implementation references

- [Worker best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [D1 API and atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [D1 backups and Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

Wrangler 4.152.0 and the installed local Workerd runtime were used. Compatibility date is pinned to `2026-08-06`, the newest date supported by the installed runtime; a current-date `2026-10-26` attempt was rejected locally. Regenerate types and rerun tests when deliberately advancing runtime dependencies/date. Development-only `undici` and `sharp` overrides pin patched ranges after npm audit findings; the final installation reported zero vulnerabilities. Lockfile and override compatibility are covered by the local D1 tests and Worker dry-run bundle.


Refinement activation prerequisite: apply migration 0002 before deploying this Worker. It adds article titles and independent comment reactions without replacing existing records. Website registry schemaVersion 2 includes public title; the upgraded API also accepts legacy v1 registries. Deploy/verify the backend before synchronizing a v2 registry. The article content contract remains courtumpire-weekly/v1. No activation has occurred locally.
