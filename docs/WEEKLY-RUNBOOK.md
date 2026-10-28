# CourtUmpire Weekly: local review and manual publishing

Owner: Mahmoud Khawaga. Website only. The Android/Wear app is unchanged.

This version has **not been pushed, deployed or activated**. There are no real published editions. The public archive is an honest launch state and Home has no empty teaser. The local fictional example lives in ignored `.weekly-private/`; it is not publication source.

## Open the local demonstration

Use Node 24 LTS. In PowerShell:

```powershell
cd C:\courtumpire-landing-pr5-test\.local-review\weekly-feature
npm ci
npm run build
npm run weekly:demo
npm run weekly:package
npm run weekly:preview
```

Keep that terminal open. Visit:

- `http://127.0.0.1:4187/weekly/` — actual public launch state.
- `http://127.0.0.1:4187/demo/` — clearly fictional, private article layout.
- `http://127.0.0.1:4187/authoring/` — private browser editor.

In a second terminal in the same folder:

```powershell
npm run backend:demo
```

Then visit `http://127.0.0.1:4187/demo/engagement.html` and `http://127.0.0.1:8797/admin`. The banner identifies **local test authentication** and fictional data. The local preview server substitutes a simulated anti-abuse check only in its in-memory response; the packaged public module has no bypass. The Node-only demo harness is not the deployed Worker entry. It uses its own persisted local D1 in `.weekly-private/demo-db`, not a remote database. Both servers bind only to `127.0.0.1`. Ctrl+C stops each.

The normal `npm run backend:dev` uses the actual fail-closed Worker, so its admin UI will refuse access without real Access configuration. That is intentional. The working demo is not evidence that remote moderation is deployed.

## Each Friday: the short workflow

1. Use `docs/WEEKLY-GENERATION-PROMPT.txt` together with the complete `authoring/schema.json` and `docs/WEEKLY-CONTENT-CONTRACT.md`. Check the source links and every factual claim yourself. Proposed cutoff is Friday 16:00 Europe/Berlin, target publication around 18:00, with no automatic scheduling.
2. Open the editor, import/paste the JSON and choose **Validate & preview**. Fix the field-specific errors. The form lets you edit title, deck, SEO description, byline, section headings, paragraph text, captions and every table cell. Dates and existing timeline text also have normal fields. Use Advanced JSON for structural edits, sources, video and correction records. The untouched blank template does not show validation errors until requested.
3. Choose **Prepare for publication / export**. This downloads a validated file; it is not live. Unsaved changes trigger a navigation warning. Nothing is uploaded, and the editor receives no GitHub token or secret.
4. Save exports under `.weekly-private/`. Import a new edition with:

```powershell
npm run weekly:import -- create .weekly-private\my-edition.json
```

The file is stored in `.weekly-private/drafts/cu-weekly-YYYY-MM-DD.json`. Keep the printed source hash. **Do not put draft files into `content/weekly` or commit private review notes.** A build rejects drafts in that public source folder.

5. Review the exact rendering in the editor. Approve editorial content and the publication operation before the next step. No publication step has been run for a real edition in this task.

## Approved publication step — future, not run in this task

Immediately before the approved release, promote the already imported draft:

```powershell
npm run weekly:import -- update .weekly-private\drafts\cu-weekly-YYYY-MM-DD.json --expected SOURCE_HASH --approve-publication
npm run build
npm run weekly:package
npm run lint
npm test
npm run test:weekly
```

The promotion assigns the next edition number and records the actual approval/publication preparation timestamp **once**. Builds never regenerate it. This is the publisher's explicit release step, not a claim that GitHub deployment has completed. If deployment is delayed or cancelled before the first public release, review the timestamp and source deliberately before committing; do not keep an automatically scheduled future timestamp. No automatic scheduler exists.

Review the staged source and generated pages before any commit/push approval. Publication source is one JSON file per edition in `content/weekly/`. `weekly-core/publication-history.json` preserves allocated edition numbers/IDs and original publication times, including withdrawals. `weekly-core/redirects.json` maps former slugs to stable IDs. Both contain public metadata only.

### Existing GitHub Pages workflow

Read-only inspection on 26 October 2026 found Pages `build_type=legacy`, source `main`, path `/`, custom domain `courtumpire.com`. The latest successful deployment was Actions run `40028148905`, commit `a4abd3b60857149371499851ae9353f75c5e995b`. This feature branch is based on that exact source, not the dirty older checkout.

Keep that existing hosting workflow: after approval, commit the source **and generated static files** on the feature branch, review/merge through the owner's chosen GitHub flow, then let Pages build `main`. Do not change hosting mode or add CI permissions implicitly. `npm run build` is required before committing because legacy Pages does not run the Node generator.

`_config.yml` excludes `content`, `authoring`, `weekly-core`, `backend`, scripts, tests, docs, dependencies and review folders from Jekyll's output. **Do not add `.nojekyll` to the repository root:** it would bypass these exclusions. Private drafts are also ignored by Git, which is necessary because excluding a file from the deployed site does not make a public repository private.

`npm run weekly:package` separately creates `dist/` from an explicit public allowlist. The local public preview and package-exclusion tests use those exact bytes. It contains no article source JSON, editor, backend or private notes; `weekly/registry.json` contains only public identities, titles, paths and flags (registry v2). The `.nojekyll` inside this already filtered artifact is safe. An eventual switch to artifact-based Actions deployment would require separate approval; this task does not make that switch. The final readiness review reproduced this legacy artifact locally with GitHub’s official Pages builder: 206 files, nine private markers excluded. Run `node scripts/weekly-pages-audit.mjs` with Docker running to repeat it. Inspect the first remote artifact during the approved deployment; nothing has been built remotely here.

After Pages succeeds, inspect the live canonical page, RSS, sitemap, Home teaser and privacy links. Then download the deployed `/weekly/registry.json` and import it in the authenticated moderation UI. Confirm its version and sync. The registry batch checks an expected current version and either succeeds atomically or rolls back. A failed sync leaves new editions readable but their engagement unavailable. Do not sync a private preview registry.

### Update an existing edition

Import the current source into the editor; keep its ID, edition number and `publishedAt`. Change content, set a genuine later `updatedAt`, and add a visible correction when appropriate. Compute the current source hash without exposing private content:

```powershell
node scripts/weekly-hash.mjs content/weekly/cu-weekly-YYYY-MM-DD.json
npm run weekly:import -- update .weekly-private\revised.json --expected SOURCE_HASH
```

The importer checks the stable ID and exact expected version. A stale hash rejects the update rather than overwriting another edit. The importer serializes operations with a local lock. If a process crashes, inspect `.weekly-private/import.lock` and running processes before removing only that stale lock. Private pre-update backups remain ignored.

Changing a slug creates an old-to-new static redirect without changing the ID or engagement. GitHub Pages supports the generated meta-refresh/canonical/link fallback; this is not an HTTP 301. Slug collisions with other live editions or redirects fail.

To withdraw an edition, close its engagement first in admin, then:

```powershell
npm run weekly:import -- unpublish content/weekly/cu-weekly-YYYY-MM-DD.json --expected SOURCE_HASH
npm run weekly:package
```

The content moves into private drafts, the public JSON is removed, and the build removes old generated HTML, Home links, feed entries, sitemap entries and registry entries. Review the Git deletions as part of the approved release. Sync the deployed registry to deactivate the ID. During the deployment/sync window, keep the global/article admin closure enabled. Reopening an admin override cannot bypass a disabled source flag or an inactive registry entry. Re-publication uses the private preserved source, its stable metadata and `--approve-publication`; it never reassigns the ID/number.

## Moderate, once the real backend is activated

Sign in at the approved API host's `/admin`. Filter by article, status, reports, text/name or date. Pages contain at most 30 comments; public pages load at most 20. Select items and confirm approve/reject/spam/hide/restore/delete. Delete erases live text, email and reports; the minimal audit retains only keyed moderator identity, action, record ID and time. Visitor text uses `textContent` in both interfaces. No visitor nickname gets verified-admin styling. Reports do not automatically remove content. There are no moderator replies, notifications, attachments or threads in phase 1.

The **Run retention purge** button is part of the manual review routine. No scheduled job is active. Proposed defaults, requiring owner approval before launch:

- Pending/rejected/spam comments: purge after 30 days; private email: erase after 30 days even on approved comments.
- Approved and hidden comments: retained until human deletion or an owner-approved retention change. Unpublishing deactivates access; it does not silently erase the moderation record.
- Rate-limit identifiers expire after their 10-minute window. Reaction retry records expire after 24 hours. Traffic performs bounded lazy cleanup; an inactive service needs the manual purge to physically remove expired rows.
- Reports lose their network-derived keyed identifier after 24 hours during lazy/manual cleanup, retaining an unlinked report count for moderation.
- Minimal audit: purge after 90 days. Browser token: 180-day expiry. No raw IP in the D1 application tables; providers may independently process network/access logs.

Confirm the legal basis, provider contracts/transfers, age guidance, retention, backup handling and privacy notice before activation. This is not a claim of automatic GDPR compliance. Do not enable request-body logging, comment/email analytics, automatic email or subscriptions.

## Backup, restore and disable

Use a restricted local directory outside any public repository for backups. Exports contain private comments/emails. Never attach them to a public PR or upload them to Pages.

After confirming the exact account ID and approved database, the future maintenance commands are:

```powershell
# FUTURE REMOTE OPERATIONS — require separate authorization and account verification.
# Set CLOUDFLARE_ACCOUNT_ID to the exact approved account, not its display name.
npx wrangler d1 export weekly --remote --config backend/wrangler.jsonc --output PRIVATE_BACKUP_PATH.sql
# Restore to a separately approved empty recovery database first, then inspect it:
npx wrangler d1 execute APPROVED_RECOVERY_DATABASE --remote --file PRIVATE_BACKUP_PATH.sql --config APPROVED_RECOVERY_CONFIG
```

Do not restore over a live database without an explicit recovery decision. A restore can resurrect deleted data: reapply deletion records and retention before re-enabling access. Review [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) and the account's actual retention window; private exports have their own deletion policy.

To disable interaction immediately, close comments and reactions globally in admin; later set `apiOrigin`/sitekey empty in `weekly-core/config.mjs`, rebuild and release through approval. Reading remains static. Removing API DNS/Worker resources is a separate decision, not necessary for disabling the UI. No blanket 404 redirects are used.

## Validation commands

```powershell
npm run build
npm run weekly:demo
npm run weekly:package
npm run lint
npm test
npm run test:weekly
npm run backend:migrate
# With the two local demo servers running:
npm run test:weekly:browser
```

The local browser checks use installed Microsoft Edge and write screenshots to ignored `.weekly-private/screenshots/`. Network/D1/browser tools may need local sandbox permission for loopback connections. They do not require cloud credentials.

## Approval checklist before the first deployment

- [ ] Review the feature diff, contract, schema, fictional screenshots and test report. Confirm no draft/private notes are staged.
- [ ] Keep the current GitHub Pages root/legacy workflow and approve `_config.yml` exclusions. Verify no root `.nojekyll`. Inspect the first actual Pages artifact for excluded paths before announcing the feature.
- [ ] Decide whether to launch the empty/static Weekly experience first (supported with no cloud resources).
- [ ] For engagement, explicitly choose an existing **account ID** from the inspection report. Recheck connection scope and resource access. Do not create/delete an account or select by the shared name.
- [ ] Approve Worker/D1 creation, region/jurisdiction choice, plan/cost limits and Access setup separately. Configure exact admin origin, issuer, audience and owner allowlist. Recheck alternate `workers.dev`/preview endpoints.
- [ ] Approve API hostname/DNS separately; no assumption that `courtumpire.com` is already proxied. Pages remains the website host.
- [ ] Configure real Turnstile for the approved production hostname, and server-only secrets. Test a real token once, expired/replayed tokens, blocked scripts and wrong hostname/action.
- [ ] Verify unauthenticated/non-owner/forged/expired admin requests fail on every hostname, and CSRF rejects foreign origins. Test cookies in the owner's browser at the same-origin admin UI.
- [ ] Approve retention/privacy text and run purge/backup/restore exercises with dummy data. Recheck current pricing and quotas, including D1 writes from throttling and cleanup.
- [ ] Approve the first real article and its publication timestamp separately. Build, inspect, commit/merge/publish only with authorization.
- [ ] After deployment, verify generated links, article/no-JS rendering, media consent and analytics exclusions; then sync the exact deployed registry and smoke-test moderation/reactions with dummy data.
- [ ] Keep automatic article generation, schedules, spoiler mode and Be the Umpire out of this release.

## Ranking preparation

Before export, use Calculate ranking changes. The editor loads the local previous published snapshot and pins historical comparisons during approved import. Read [WEEKLY-RANKINGS.md](WEEKLY-RANKINGS.md). Include `weekly-core/ranking-history.json` in the approved publication diff; never delete old entries. Unknown player identities are flagged with N/A rather than guessed. The complete generation prompt includes the exact ATP/WTA identity/source requirements.


## The three files from ChatGPT

- Article JSON: the only canonical content source. Import it into the local editor, review normal fields, validate, calculate ranking changes and export. All other supported data survives normal edits.
- Human-readable preview TXT: a convenient reading copy, not an importer input or a second website source. Regenerate it if the canonical JSON changes.
- Private editor handoff TXT: verification gaps, source limitations and checks for the owner. Keep it in the ignored private folder; never commit or publish it. It does not replace visible factual limitations required in the article itself.

The complete replacement prompt is docs/WEEKLY-GENERATION-PROMPT.txt. Both tour tables still have all five canonical JSON columns; hiding unusable comparison columns is a reader presentation rule, not a schema change. For manual official rankings, use the dated-snapshot panel, check the source yourself, review its preview, then apply. Do not overwrite an older article with a newer ranking release.

## Removing an edition locally

The editor is static import/export: it does not write or delete files on your computer. Clear editor clears browser memory only. Saved sources live in .weekly-private/drafts; imported downloads and private backups are separate.

1. To delete a never-published saved draft, use the command displayed in the editor's removal disclosure: node scripts/weekly-remove.mjs draft ID --expected HASH --confirm "DELETE ID". It checks the exact saved hash, uses the import lock, rejects public/previously published sources and refuses symlink paths.
2. For a published edition, first use weekly:import unpublish FILE --expected HASH. This removes its public source and rebuilds all generated pages, Home/archive, feed, sitemap, previous/next links and registry. Review locally. A later approved website deployment and registry synchronization are necessary to withdraw it live.
3. Optional permanent local removal uses weekly-remove.mjs permanent with the same hash/confirmation arguments on the already withdrawn saved source. Redirects are removed; publication-ID/number tombstones and historical comparison snapshots remain to prevent reuse and preserve other editions. Build failure is reported; resolve it before any release. Downloads, backups and Git history are not erased.
4. Associated engagement is retained by unpublishing. Only after the registry marks the article inactive can Advanced settings → Delete withdrawn edition engagement remove its comments, private emails, reports and article/comment reactions. Type the exact edition ID. The server requires authenticated owner + CSRF and rechecks inactivity inside the transaction. Provider backups/private exports are outside this scope. No real edition deletion was performed during implementation; tests use disposable sources and databases.

## Moderation and comment reactions

Use Pending, Approved, Reported, Hidden or Spam tabs; counts respect article/search/date filters. Pick articles by title. Review the text and optional Contact details, then use an individual action or select up to 30 for a confirmed bulk action. Restore means approved, not text editing. Reports do not automatically hide a comment. Registry, retention and withdrawal deletion are under Advanced settings.

Each approved comment has its own persistent like/dislike totals. The existing random article-scoped browser token supports one current choice per comment; changing/removing uses versioned transactional writes and retry keys. This is not one-human-one-vote verification. Pending/hidden/deleted comments reject public reactions; closure/source flags apply on the server. Deleting comments cascades reaction records. Retry records expire after 24 hours, cleaned by requests/manual purge; retained NULL choice rows preserve version history. No email or IP-derived identifier is public. Local fictional reaction seeds are in the Node-only harness, never the deployed Worker or Pages artifact.
