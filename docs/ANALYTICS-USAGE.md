# Consent-gated usage analytics

The single existing GA4 integration remains `analytics.js`, measurement ID **G-H387MYJ9KJ**. `ACCOUNT_SETTINGS_REVIEWED = false` deliberately blocks production tag loading and event delivery until the remaining rollout checks below are complete. The owner reviewed GA4 settings manually on 21 October 2026; live GA receipt is not yet verified. Advertising remains denied.

Consent version 3 adds scope `website-engagement-v3`, preserving the same key `courtumpire.analytics.v1`, preference cookie and fixed 180-day lifetime. Previous version-1 or version-2 acceptance requires a fresh choice for expanded purposes; an unexpired previous rejection remains rejected. Both cookie and storage must agree for acceptance. Withdrawal disables GA immediately, clears accessible integration cookies/debug records, saves rejection and reloads if the tag started. Failed stores fail closed; no pre-consent actions are queued or replayed.

Only exact HTTPS `courtumpire.com`, known public paths, reviewed account settings and explicit valid consent can deliver. Local `?analytics_debug=1` enables an in-memory, maximum-100-record categorical debug array **after consent only**; it never loads Google and is cleared on rejection. It cannot activate production tracking or ads. Do not use production GA during local QA.

| Event | Meaning and allowed parameters |
| --- | --- |
| `page_view` | Once per document after consent; no arbitrary parameters |
| `tool_view` | Implemented tool viewed; `tool_id` |
| `tool_interaction` | First trusted control/input action per tool/document; `tool_id` |
| `plan_generated` | Successful practice/rotation generation; `tool_id`, optional `planning_mode` |
| `match_completed` | Real live match reaches completion, excluding guided demo/restored completion; `tool_id`, `match_format`, `games_per_set` |
| `export_generated` | A valid local PNG blob has been generated; `tool_id`, `document_type`, `export_format`, optional match format/length and `match_status` (in_progress/completed) |
| `print_requested` | Prepared, image/font-ready print dialog requested; `document_type`; **not proof of PDF save/printing** |
| `google_play_click` | Existing app-link intent; `placement`; **not installation** |
| `checklist_selected` | Template selected; `tool_id`, `checklist_type` |
| `checklist_action` | `tool_id`, `checklist_type`, `action` (add/check/remove/restore/restore_defaults/delete) |
| `tool_error` | `tool_id`, `error_category` (validation/storage/export/asset) |
| `navigation_selected` | Known header/footer destination; `destination_id`, `source_placement` |
| `quiz_start` | Randomized run starts after consent; `tool_id`, `question_count` (5/10/20/100) |
| `quiz_complete` | Finished run; `tool_id`, `question_count`, `correct_count` (integer 0–count) |
| `score_reset` | Confirmed score/history reset; `tool_id` |
| `drill_used` | Successful addition to a practice plan; `player_count` (1–4), `source_context` |
| `contact_intent` | Topic selection or fixed email/copy action; `contact_category`, `contact_action`, optional `copy_result` |

Exact enum lists and per-event schemas are centralized in `analytics.js`; unknown events, parameter names or values are rejected. Tool IDs are contact, practice_planner, scoreboard, tiebreak_calculator, result_card, rotation, checklists, rules, score_sheet, umpire_challenge and club_kit. Contact categories: general/help/problem/improvement/clubs/privacy. No per-point event stream, match state, names, reminders, logo/filename, message body, email, full mailto, raw errors or free text enters analytics. URLs are fixed allowlisted production paths without query/fragment; referrer is blank and title fixed to CourtUmpire. First interaction and page/tool views deduplicate per document. Actual successful output and print intent are distinct.

## Account review and remaining activation checks — 21 October 2026

Confirmed from owner screenshots and discussion:
- Website stream G-H387MYJ9KJ (16150036647), tag GT-K8G6D3F9; existing sole destination is CourtUmpire website.
- Owner confirmed the saved stream configuration: Enhanced Measurement master ON; page loads ON; browser-history page changes OFF; **Site search OFF**; scroll, outbound clicks, form interactions, video and file downloads ON. The five former search keys `q,s,search,query,keyword` remain regression probes, with no additional search parameters. The tag-level automatic-detection capability switches remain ON; the stream's history setting is separate. Do not request another master-setting confirmation or blanket-disable useful measurements.
- Google Signals OFF. User-provided data OFF at the property and tag levels. Email redaction ON.
- Granular device/location collection ON. Ads personalization allowed in all regions in the account, unchanged by request. Website advertising consent remains denied; there are no linked Google Ads accounts. Future publisher ad monetization is a separate integration, not enabled by this GA setting.
- Account sharing: Technical support ON; Google products/services, modeling contributions/business insights and business recommendations OFF. These are account-wide; do not change unrelated properties.
- Owner confirmed DPA acceptance and that the administrative primary-contact details were saved. Do not request this confirmation again. The administrative email and postal address are not published here; existing public Contact, Privacy and Impressum addresses remain unchanged.
- Owner confirmed saved retention: event 14 months, user 14 months, reset on new activity OFF. Do not request these confirmations again.

The published Google tag configuration was fetched read-only during this review: automatic detection flags ON, user-provided data disabled, Signals disallowed, email redaction enabled, and only the purchase rule marked as a conversion in that configuration. Fetching a tag is not proof of event delivery. Do not commit the third-party downloaded script.

The refreshed real-tag review confirms the owner's saved Site search OFF configuration: 64 focused assertions passed, all five search-key probes reached measured pages without emitting search events/terms or private markers, and the search descriptor is absent from the actual tag. Other applicable automatic and custom events still work, twelve real visits produce twelve page views, and consent/withdrawal protections remain intact. The explicit same-origin public form actions remain in place. The earlier form-query and search-term issues are resolved for this verified configuration. See [the observed event matrix and evidence](ANALYTICS-ALIGNMENT-REVIEW.md). Every collection request was intercepted locally; none was transmitted. No account settings were changed by this work.

Still required before changing `ACCOUNT_SETTINGS_REVIEWED`:
1. Complete the owner's **User Data Collection Acknowledgement** against the final disclosures. This is the only outstanding owner confirmation. Stream settings, retention/reset and saved DPA contact details are already confirmed; do not request them again.
2. Obtain separate activation authorization and change the guard only in a reviewed release. Preserve Site search OFF, stream history measurement OFF, the other confirmed measurements, consent version 3, old rejection, local/preview exclusion and all advertising denials. Current instructions explicitly keep the guard false and prohibit publishing or test delivery.
3. For that later authorized release, use normal PR protections and verify live consent plus one expressly authorized accepted visit in GA Realtime. Intercepted payloads alone are not receipt confirmation.

Reuse the completed browser evidence for unaffected behavior. Keep the explicit query-free form actions and the five-key search-exclusion regression. Automatic video is not applicable until eligible content is introduced; absence is not a safety pass. Generated PNG blobs use custom `export_generated`; the existing public ITF PDF exercises automatic `file_download`. Future new forms/links/content must keep entered text, personal link text and visitor query strings out of metadata. Do not monkey-patch Google's code or browser transports to filter production analytics.

Keep the saved stream history-based page-view option OFF independently of `send_page_view:false`. The only application History API call is the consent URL fallback; it skips no-op replacements. The focused real-tag test covers repeated acceptance plus pushState, replaceState and popstate; actual document visits must each produce one page view.

Automatic `click`, `file_download`, `form_start` and `form_submit` events are diagnostic engagement, not leads. Do not sum them with custom Google Play clicks, exports or contact intent as separate conversions. Report the custom outcome events as the authoritative tool funnel. An email action remains intent, never a sent enquiry. Blob-based generated files may not trigger automatic file-download detection; retain `export_generated`.

No heatmap, replay, ads SDK, new contact service, backend, Google Ads link, or shop integration is introduced. Existing ad-slot architecture remains available for the future monetization phase.

Useful later event-scoped dimensions: `tool_id`, `document_type`, `checklist_type`, `contact_category`, `planning_mode`, `games_per_set`, `placement`. Potential key events: successful plan generation, successful PNG generation and Google Play clicks, with honest labels. Build a usage funnel from tool view → first interaction → generated output/print intent; never interpret a print request as a saved PDF or app click as installation. Real GA4/DebugView delivery remains unverified.

References: [basic consent](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [manual/history pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en), [retention](https://support.google.com/analytics/answer/7667196?hl=en), [disable controls](https://developers.google.com/tag-platform/security/guides/privacy).

The expanded quiz remains in memory; no quiz persistence purpose or visitor ID was introduced. Starts before consent are dropped, not backfilled. Its optional categorical/count metrics and confirmed reset actions remain covered by the expanded version-3 purpose; rejection/withdrawal and the production account-review guard remain unchanged. Automatic engagement complements, and must not replace, the explicit custom outcome allowlist. Verify its separate payloads before activation. Bounded numeric validation accepts quiz score totals only when they are integers between zero and the approved question count. The scoreboard’s direct export reports `match_status`; it records successful PNG generation, not confirmed download/opening.
