# Website-managed native Explore

The public route registry in practice/routes.mjs owns tool identities, labels and URLs. Optional explore metadata selects the entries offered by the phone. practice/explore-catalogue.mjs derives and validates the public schema-v1 document; practice/explore.v1.json is the generated delivery file. There is no new database, publication handler or second tool implementation.

Public endpoint: https://courtumpire.com/practice/explore.v1.json. It is a Pages/static asset outside the /weekly/* Worker namespace. The existing public Worker falls through to the origin for this path; no routing/backend/configuration edit is required. scripts/weekly-package.mjs includes it through its existing public practice JSON allowlist. The ordinary build and packaging entry points regenerate it automatically.

## Add or edit a tool

1. Implement a real public web tool and register its canonical route/unique stable id in practice/routes.mjs, using the existing website workflow. Do not list drafts or nonexistent pages.
2. Add explore metadata to that route. The title comes from the existing label, and the URL comes from its path and productionOrigin. Example for an existing registered tool:

       explore: {description:'Make a result card', category:'Play & learn', order:25, icon:'tool'}

3. Run node scripts/explore-catalogue-build.mjs, then node scripts/explore-catalogue-build.mjs --check. Do not maintain a second hand-edited list in the generated JSON.
4. Run node scripts/weekly-package.mjs and node --test tests/explore-catalogue.test.mjs tests/embedded-presentation.test.mjs tests/weekly-public-assets.test.mjs. Public Worker asset tests require the existing node scripts/weekly-public-build.mjs first.
5. In a later authorized website release, deliver the generated JSON and the real tool assets. Refresh Explore in the same installed phone app. Normal CDN propagation still applies; manual refresh bypasses the phone cache and requests HTTP revalidation.

Change description/category/order/icon in explore metadata; change the route label to rename it. Lower order values appear first; categories appear in first-entry order. Keep ids stable. Set visible:false to hide a card, or remove its explore metadata to remove it from the catalogue. Neither action removes the underlying browser tool. An empty valid catalogue is supported; native Practice and Weekly access remain available.

## Supported contract

Schema: {schemaVersion:1, entries:[{id,title,description,category,order,url,icon,visible?}]}.

- At most 60 entries and 64 KiB UTF-8. Stable ids use lower-case ASCII letters/digits/hyphens, at most 48 characters.
- Title 1–80 characters, description 1–180, category 1–40, integer order 0–10000. Text is rendered as native text, never HTML/native code.
- Icons: drills, quiz, groups, tool, guide, practice. An unknown remote icon falls back to tool on the phone; author validation catches unsupported icons before publishing.
- URLs are canonical HTTPS courtumpire.com routes under /practice/, /practice-planner/, /tennis-drills/, /play-score/ or /clubs-coaches/. No credentials, arbitrary ports/schemes, queries/fragments, encoded/traversal paths, admin/API/editor paths, or scoreboard descendants. Author validation also requires an actual registered route with the same id.
- Website live scoring is never a catalogue entry. Native Match remains the only in-app live scoring destination. Article editions are not catalogue entries: Weekly uses live RSS and the independent complete live archive.
- New entries reuse existing web navigation only. New URL families, native features or icon types may require a separate app change; a supported web tool under the existing families does not.

## Phone cache and failures

The built-in offline snapshot contains the three existing web discovery destinations: Drills, Umpire Challenge and Clubs & Coaches. The independent native Practice/Weekly discovery remains. The phone reads a validated last-good JSON file from its own UI resource cache and refreshes in the background on Explore entry/foreground resume. Successful responses are reused for five minutes; failed automatic attempts retry after thirty seconds. Concurrent requests coalesce. Refresh Explore bypasses the TTL.

Malformed JSON, unsupported schema, duplicate ids, oversized payloads, and a nonempty response with no valid entries keep the last-good/fallback list. Individual incomplete/unsafe entries are skipped, false visibility hides entries, and an empty valid list is accepted. A failed network refresh never disables native scoring or the live Weekly archive. Catalogue cache files do not own match/history/settings or Wear state.

## One-time embedded presentation delivery

The pending feature still needs its separately authorized public asset release. Generate the existing Worker public shell/assets with node scripts/weekly-public-build.mjs, then deliver the approved Worker public asset bundle and Pages public files through the existing release procedure. Include weekly/embedded.mjs, weekly/embedded.css, the already pending weekly/weekly.mjs and weekly/weekly.css imports, practice/site.mjs, and practice/explore.v1.json (plus generated static public pages/assets as required by the existing packaging procedure). No article re-import, D1 migration, admin/auth/analytics/consent change or infrastructure edit is needed. Do not deploy the empty checked-in article catalogue over live published data.

The existing opt-in mode removes duplicate navigation/acquisition chrome, preserves compact privacy/consent access and tool/article controls, and applies light/dark colors. Its idempotent startEmbeddedPresentation export is also used by the native WebView after redirects that lose app parameters, without reloading forms. Normal browser visits remain opt-out. Native URL-derived toolbar titles, current-page sharing/browser actions and Back/Forward are app changes and need a replacement APK.

Before that later release, record the actual current production Worker version ID and Pages deployment ID, and retain their approved public asset bundles. Roll back only these public presentation/catalogue assets using those recorded deployment IDs and the established deployment rollback procedure. The local pre-follow-up Git checkpoint 17f3074821bac23e270324f39d145b320ca775cf is not a verified production rollback target; do not revert publication data or schemas. The phone keeps its last-good catalogue or built-in fallback if the endpoint disappears. Native Match interception and scoring remain independent. Backward-compatible conditional imports permit a staged asset release; Worker-first avoids a missing /weekly/* presentation module during that release.

Normal future article publishing remains the existing live workflow: article/archive/RSS change without an APK rebuild or repeated presentation deployment. Adding a supported tool requires its normal website/catalogue asset publication, then refresh, with no APK rebuild.

## Verification limits

Local browser checks are separate from Android WebView tests. Android fixture tests intercept approved HTTPS requests with local public assets and a clearly fictional article; they do not permit cleartext, bypass TLS or change production origins. A new article destination, catalogue add/remove/reorder, cache failures, theme changes, history and native Match interception can be simulated in the same installed emulator APK. These are not production publication tests. Keep emulator/test fixture installs separate from the Play-signed physical phone and released watch; current local signing incompatibility is not changed here.

## Reproduce the local phone fixtures

After packaging/public-asset generation, run node tests/prepare-phone-webview-fixtures.cjs <absolute-output-directory>. This copies public assets and renders two fictional editions with the existing public renderer and test fixture. No editorial catalogue, database or production page is written. Push that directory to the emulator app external-files catalogue-site-fixture directory and run the phone androidTest suite as described in the Android delivery notes. The second archive file is swapped locally by the test to demonstrate discovery after publication without rebuilding. Separate browser checks run with node tests/embedded-browser.cjs; they are not Android WebView tests.
