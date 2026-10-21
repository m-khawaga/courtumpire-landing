# Analytics alignment review — 21 October 2026

Base release and pre-activation rollback reference: `b5fbf203a3166bf8093db922a4dbc5bc7900cd51`. Continued on `codex/analytics-alignment`, preserving all existing work. The owner reviewed final disclosures, completed GA4's User Data Collection Acknowledgement and authorized the normal PR/Pages release on 21 October 2026. **The technical activation blocker is resolved.** `ACCOUNT_SETTINGS_REVIEWED=true` enables optional delivery only after current-scope production consent. No GA account setting, DNS, hosting, advertising or Search Console change is part of this release.

## Saved configuration and refreshed tag

The owner confirmed saving Enhanced Measurement master ON; page loads ON; browser-history page changes OFF; **Site search OFF**; scrolls, outbound clicks, form interactions, video engagement and file downloads ON. Former search keys `q,s,search,query,keyword` remain regression probes; additional search parameters are empty. The tag-level history capability remains distinct from the stream option. These settings do not need another owner confirmation.

Owner-confirmed saved retention is 14 months for both event and user data, with reset on new activity OFF. The owner also confirmed that DPA primary-contact details were saved. The administrative contact email and postal address are not published in this review or the website; all existing public Contact, Privacy and Impressum email addresses are preserved. Do not request these confirmations again.

The actual Google tag was refreshed without modifying its code. Final asset: 530,221 bytes, SHA-256 `4bae4599f0737e3aed6a52a21822b10375e9ec3aaa359966b9b6d13fa2701151`. Its decoded descriptors retain scroll, outbound, form, download and video; the Site search descriptor is absent. Email redaction remains enabled and automatic user-provided data disabled. The exact asset/configuration snapshot is recorded in the ignored JSON report; Google may change its script between runs.

## Isolation and scope

Installed Chrome receives the actual enabled analytics.js at an intercepted production origin, with no enable override. A separate disabled-guard safety fixture changes only its local response to false. Only allowlisted tag JavaScript is fetched read-only, without browser cookies/referrer. **Every collection request is decoded and fulfilled locally with an empty 204 before transmission**, including automated live accepted-consent checks. Other external destinations are blocked, including the app, USTA and ITF navigation attempts. There is no real Google event delivery or GA receipt test. Google code/transports are not monkey-patched; batching is natural, without synthetic unload events.

Completed prior evidence was reused: 49 unit tests, 290 stub integration assertions/16 viewport renders, 81 Contact checks and generation checks. Activation verification covers eight focused consent/form-destination tests, syntax/route checks and the refreshed real-tag test against the enabled source. The broad website audit is not repeated. All eight focused tests and all 64 enabled-source real-tag assertions passed, including the five search exclusions and all applicable events; raw results remain ignored local evidence.

## Observed event matrix

| Event/behavior | Observed | Result and limits |
| --- | ---: | --- |
| `page_view` | 12 | Exactly one per actual visit, checked both in total and per route. Known public locations, no query/fragment, blank referrer, fixed CourtUmpire title. |
| Repeated acceptance/history | 0 extra views | Repeated acceptance, pushState, replaceState and popstate tested. Keep stream history measurement OFF. |
| `scroll` | 1 | 90% threshold; clean common metadata. |
| Outbound `click` | 3 | Actual app, USTA reference and ITF PDF links; fixed public destinations, no entered text/email/mailto. |
| `form_start` | 10 | Actual planner, checklist, result, search filters and dynamic quiz/confirmation interactions. Query-free destinations and fixed field metadata; no entered values. |
| `form_submit` | 1 | Native confirmation-dialog submission. Clean destination; not a tool completion, lead or enquiry. Client-handled tool submissions use custom outcomes. |
| `file_download` | 1 | Existing public ITF rules PDF; public filename, link text and URL verified. PNG blob generation remains the custom export event, not an automatic file-link safety test. |
| `view_search_results` / search terms | 0 | Intentionally disabled. Each of the five query-key probes reached a measured page; none emitted a search event, search-term parameter, additional search parameter or private marker. This verifies exclusion, not the safety of collecting free text with Site search ON. |
| Video events | 0 | Not applicable: no published activity video or YouTube embed. Retest if eligible content is added; absence is not a safety pass. |
| Standalone `user_engagement` | 0 | Not triggered in this final run; no payload-safety claim for absent events. |
| Custom outcomes/intents | 17 | tool_view 5, tool_interaction 4, contact_intent 3, and one each of google_play_click, plan_generated, checklist_action, export_generated, quiz_start. Page views listed separately. Fixed schema/counts; no input content. |

All observed payloads excluded the synthetic query, history, player, reminder, filter-text and email markers, contact address and complete mailto URLs. The automatic PDF event's link text was a fixed ITF rule citation. No personal marker appeared in automatic link/form metadata. Contact's mailto navigation was prevented to avoid opening an email client; its observed intent payloads were verified. No enquiry was sent.

Before consent, after fresh rejection/contact actions, after withdrawal/reload, with the disabled-guard safety fixture and on local/preview hosts, no collection occurred. Old acceptance requires renewed consent; valid old rejection persists. Withdrawal clears real analytics cookies. Actual consent commands kept ad_storage, ad_user_data and ad_personalization denied; captured payloads had G101 and npa=1. No application/tag JavaScript errors occurred. Existing desktop/mobile screenshots and focused Contact keyboard/copy evidence remain applicable.

## Preserved fixes and resolved blocker

Automatic `form_destination` initially inherited a synthetic private planner query even though `page_location` was clean. Static local forms now declare a same-origin public action in the generator; dynamic quiz and method=dialog confirmation forms do likewise. Actions use relative paths, preserving local-preview behavior. Browser payloads and the new regression test confirm that queries/fragments and entered values stay out of these form destinations. No backend or submission service was added.

The previous run demonstrated that automatic Site search independently extracted a synthetic name from all five query keys despite clean page_location values and email redaction. The owner has now saved **Site search OFF only**. The refreshed descriptor and all five measured probes confirm this exclusion; other applicable measurements still fire. No blanket disabling or tag/transport patch was used. Drill filtering/deep links, form destinations and custom outcomes remain functional. Privacy wording now records that automatic search-term collection is disabled and confirms the saved retention. Consent version 3 remains; it does not request free-text search terms.

## Owner acknowledgement and release authorization

The owner confirmed completion of the **User Data Collection Acknowledgement** after reviewing final disclosures and explicitly authorized activation, push, PR, normal protected merge and Pages deployment. Stream settings, retention/reset and saved DPA contact details were already confirmed. No owner setting confirmation is outstanding. Administrative contact details remain unpublished and public addresses are preserved.

Publish only after focused verification and normal repository requirements pass. Confirm the Pages deployment's commit and live source/disclosures. Automated accepted-consent checks must intercept collection locally. The owner will perform the manual accepted visit and GA Realtime check after deployment; network attempts do not establish receipt. Manual steps are in ANALYTICS-USAGE.md. No account setup, DNS, routing, hosting, advertising or Search Console action is requested.

Rollback: create a new branch from current main and revert the activation merge using `git revert -m 1 <activation-merge-commit>`, then use a normal reviewed PR and Pages deployment. Preserve later unrelated work. Do not reset main, force-push or bypass protections. The pre-release Pages build and main were both b5fbf203a3166bf8093db922a4dbc5bc7900cd51; deployment evidence records the final merge identifier.

## Evidence and reproduction

Run `npm.cmd run test:analytics-real` with the documented Node/Playwright runtime and `BROWSER_CHANNEL=chrome`. It needs no preview server, closes its browsers and reports event coverage. It requires measured visits for all five search probes and rejects any search event/term, private marker or missing applicable event. `node --test tests/analytics-consent.test.mjs` covers the actual enabled source, disabled safety fixture, consent and generated form actions. After deployment use `ANALYTICS_REVIEW_LIVE=1` for the same intercepted checks against live site files; that mode verifies the live analytics source matches the reviewed source, allowing only checkout line endings.

Ignored evidence: `.local-review/analytics-activation-release/` for enabled-source tests and `.local-review/analytics-live-release/` for live intercepted checks. Earlier `.local-review/analytics-alignment/` reports/screenshots remain historical comparisons. Payloads contain synthetic IDs/markers only. Do not commit raw collection evidence or downloaded third-party JavaScript. For local manual review run `npm.cmd run preview`, inspect Contact/privacy and stop with Ctrl+C; local and preview hosts never load Google.

Reference: [Google's Enhanced Measurement event/parameter definitions](https://support.google.com/analytics/answer/9216061?hl=en). The file/video applicability and form/link metadata distinctions follow these definitions; the event counts and resolved search-term exclusion above come from captured real-tag payloads.
