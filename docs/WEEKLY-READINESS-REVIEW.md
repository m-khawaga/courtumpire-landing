# Final Weekly readiness review — 26 October 2026

Everything remains local. Cloudflare/GitHub calls were reads only. No push, merge, deployment, resource creation, DNS change or account deletion occurred.

## Reconnected Cloudflare access

| Exact account ID | Account detail | Workers / D1 / zones / Turnstile | Access applications |
| --- | --- | --- | --- |
| `98702662d9e96f6f96dd8b0e1ba5e2e2` | GET 200; created 21 October 2026, 12:32:03 UTC | All GET 200, empty lists | HTTP 403, `access.api.error.not_enabled` |
| `a5646237c003a20af52d12c61b4bd0b7` | GET 200; created 21 October 2026, 12:29:11 UTC | All GET 200, empty lists | HTTP 403, `access.api.error.not_enabled` |

The earlier warning that these IDs were outside the session-authorized accounts did **not** recur. The current Access error explicitly reports that Access is not enabled and that reconnecting will not help; the connector reports the relevant Access scopes are present. Read access is confirmed, but no write permission was tested by making a mutation. No extra account resources were inspected.

Recommendation: **`a5646237c003a20af52d12c61b4bd0b7`**. Both accounts are otherwise equivalent for this feature. It is the older account, so use creation order as a transparent tie-breaker and designate that exact ID in the later approved production config. This does not prove historical owner intent or confer a technical advantage. Neither account is deleted or changed, and the local config still selects neither account.

## Actual proposed Pages artifact

Read-only GitHub inspection still reports legacy Pages, source `main`, path `/`, CNAME `courtumpire.com`; main remains `a4abd3b60857149371499851ae9353f75c5e995b`.

The previous `dist/` test was not sufficient to prove this workflow's output. This review now reproduces the **GitHub Pages build**, using the official `ghcr.io/actions/jekyll-build-pages:v1.0.13` image pinned to digest `sha256:6791ebfd912185ed59bfb5fb102664fa872496b79f87ff8b9cfba292a7345041`, github-pages 232 and Jekyll 3.10.0. The command is the same `github-pages build` used by its entrypoint; an empty token variable was unset so public metadata could be fetched without credentials. No GitHub/Cloudflare token was supplied to the container.

The source was a separate ignored copy of the proposed tracked/non-ignored files, using the actual `_config.yml`. Nine unique private markers were added only to this isolated copy: draft JSON, editor notes, fictional demo HTML, unpublished content JSON, authoring notes, docs notes, backend credential file, test-auth code and test-article JSON. The resulting **200-file `_site` passed** all path/content checks. All nine markers were absent. No content/editor/backend/tests/docs/private paths, credential files, test-auth markers or private-key markers were emitted. The public registry contains zero articles. The only Weekly output is its empty archive, privacy page, feed/registry/routes and public CSS/JS; there is no fictional article route.

The versioned file-hash manifest, source path, output path and findings are recorded in `.weekly-private/pages-audit-latest.json` and its referenced `report.json`. Build logs show Jekyll explicitly excluding authoring, backend, content, docs, scripts, tests and weekly-core. This is a locally reproduced deployment artifact, not a remote release. The first authorized remote deployment should still be compared with this result. Public source code in GitHub is a separate exposure boundary: never commit private drafts or notes.

Reproduce with Docker running:

```powershell
cd C:\courtumpire-landing-pr5-test\.local-review\weekly-feature
node scripts/weekly-pages-audit.mjs
```

The audit copies source into a fresh ignored directory, runs a disposable local container and preserves its report. It does not deploy. A portable Windows Ruby attempt failed on missing native build dependencies; the successful Docker build supersedes that attempt. Docker Desktop was started locally; the audit container exited. Other containers were not stopped or changed.

Official references: [Pages dependency versions](https://pages.github.com/versions/) and [GitHub's builder action](https://github.com/actions/jekyll-build-pages).

## Ranking prompt consistency

Checked `docs/WEEKLY-GENERATION-PROMPT.txt` against the shared validator, editor, CLI calculator, importer/history store and renderer:

- Same v1 schema; both ATP/WTA table IDs, five ordered cell keys, per-tour dates and column labels.
- Stable tour/profile ID matching, separate dated ranking evidence, no name/row-position matching.
- Previous published edition snapshots, immutable history, linked comparison edition, first-edition message, arrows/text, verified zero versus unavailable N/A.
- Unknown identity flags review without blocking the whole article; entrants do not acquire assumed rank 11 or zero points; optional historical baseline requires the earlier snapshot date and separate evidence.
- Source truth cannot be proven from URL shape. Human verification remains necessary.

Two documentation inconsistencies were corrected locally, without changing the schema or renderer:

1. The contract guide still had an earlier “optional movement” sentence above its superseding five-column addendum. It now consistently requires both change columns, permitting N/A values.
2. The ranking guide implied all CLI imports enforce deltas. Draft import checks structure and may retain placeholders; editor export, approved publication import and public build enforce comparisons. The prompt now explicitly directs the publisher to calculate missing changes before approval. It also clarifies that an unavailable WTA dataset does not erase independently verified ATP data, or vice versa.

No unresolved ranking-format mismatch was found after these wording fixes. The downloaded original `CourtUmpire_Weekly_Codex_Prompt.txt` is the implementation brief; the repository's `WEEKLY-GENERATION-PROMPT.txt` is the article-generation prompt to use with the schema and guide.

## Four-minute local walkthrough

All four URLs returned HTTP 200, and opening them in the Codex panel was requested (the app reported queued).

1. [Archive](http://127.0.0.1:4187/weekly/): check the truthful launch message and Weekly navigation. No real edition exists, so there is no Home teaser or invented latest issue.
2. [Fictional article](http://127.0.0.1:4187/demo/engagement.html): read the dates, sources and two ranking sections; these intentionally explain missing data. Try Show answer, copy/share, a reaction and a dummy comment. A submitted comment should say it awaits moderation. Use dummy data only.
3. [Editor](http://127.0.0.1:4187/authoring/): click Load fictional example, change a title or table cell, then Validate & preview. Calculate ranking changes shows the first-edition N/A state. Prepare for publication / export downloads JSON only; it does not publish. Create new edition opens the blank template with required-field errors until filled.
4. [Moderation](http://127.0.0.1:8797/admin): the banner must say local test authentication. Filter Pending, inspect the dummy comment, approve it and reload the article. Try hide/restore, then permanently delete only your dummy submission. Optional email stays in this private view. This is not deployed Access authentication.

## Future execution order — backend setup

These are approval steps, not operations performed in this review.

1. Approve the exact recommended account ID, owner allowlist, retention/privacy choices, region and plan/abuse budget. Recheck current quotas/pricing and write authorization. Set that exact account ID explicitly in the reviewed production config.
2. Decide the API hostname and supported DNS/zone arrangement. Neither checked account contains a zone. Do not assume a CNAME alone works or that courtumpire.com is proxied. Any DNS onboarding/change needs separate approval and must preserve the existing GitHub Pages website records/hosting.
3. Create the approved D1 database and apply migrations. Configure Access protection for `/admin` and `/admin/*`, verified owner policy, exact issuer/audience/origin. Create the Turnstile widget for the actual website hostname. Store signing/Turnstile secrets server-side and configure real binding IDs.
4. After approval, deploy only the backend and the approved hostname mapping. Keep workers.dev/preview endpoints disabled and the article registry empty. Do not use the Node local-demo harness in production.
5. Test real Access owner/non-owner/forged/expired requests, alternate-host rejection, CSRF, Turnstile success/expiry/reuse/hostname/action, moderation privacy, closure controls, quota/offline behaviour, backup/restore and purge with dummy records. Remove those dummy records. No claim of remote readiness until these pass.

## Future execution order — website publication

1. Review and approve the static feature independently; it can launch with the empty archive and engagement disabled, even before backend activation. If enabling engagement, do so only after backend checks pass: set the public API origin/sitekey and approve the final privacy text.
2. For a real first issue, verify every fact/source and both ranking snapshots, calculate comparisons, explicitly approve publication, and promote via the documented expected-hash importer. This sets the permanent number/publication timestamp once. No real issue is prepared in this review.
3. Build generated pages, package and inspect them; repeat the Pages artifact audit for the final source. Review staged files for private data. Keep `_config.yml` and avoid a root `.nojekyll`.
4. Only with publication approval, commit/push/review/merge through the existing GitHub process. Let legacy Pages build main; verify the deployed artifact, reading/no-JS behaviour, canonical/feed/sitemap/privacy links and analytics/media consent.
5. Download the **deployed** public registry and sync it through authenticated admin. Verify its version, then smoke-test engagement with dummy data and remove that data. Registry failure must leave reading available; do not substitute a private preview registry.

## Tests reused and changes this review

Reused the completed 52 existing/consent tests, 18 Weekly/backend/rankings tests and 58 browser checks/screenshots. No application behaviour changed, so those suites were not broadly rerun. New checks were the exact-account API reads, four HTTP preview checks, the official Pages artifact build and the new audit script's syntax. Documentation and file manifest were updated; application source, secrets, account selection and cloud configuration remain unchanged.
