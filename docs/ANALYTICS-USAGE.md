# Consent-gated usage analytics

The single existing GA4 integration remains `analytics.js`, measurement ID **G-H387MYJ9KJ**. `ACCOUNT_SETTINGS_REVIEWED = false` deliberately blocks production tag loading and event delivery until the owner verifies account settings. No GA4 Admin changes or real collection tests were performed. Advertising remains denied.

Consent version 2 adds scope `tool-usage-v2`, preserving the same key `courtumpire.analytics.v1`, preference cookie and fixed 180-day lifetime. Previous version-1 acceptance requires a fresh choice for expanded purposes; an unexpired previous rejection remains rejected. Both cookie and storage must agree for acceptance. Withdrawal disables GA immediately, clears accessible integration cookies/debug records, saves rejection and reloads if the tag started. Failed stores fail closed; no pre-consent actions are queued or replayed.

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

Before future activation, verify the correct existing GA4 stream, turn Enhanced Measurement off (including history views, forms, outbound clicks, scroll, downloads, site search and video), disable automatic user-provided data detection, inspect connected tags/destinations and event-creation rules, and keep Signals/Ads/remarketing/personalization off. Review sharing, granular device/location settings, applicable terms/DPAs and international transfers. Choose and record actual event/user retention and reset-on-activity settings; standard-property 2/14-month settings do not govern every aggregate report. Update privacy against actual settings before changing the code guard.

Useful later event-scoped dimensions: `tool_id`, `document_type`, `checklist_type`, `contact_category`, `planning_mode`, `games_per_set`, `placement`. Potential key events: successful plan generation, successful PNG generation and Google Play clicks, with honest labels. Build a usage funnel from tool view → first interaction → generated output/print intent; never interpret a print request as a saved PDF or app click as installation. Real GA4/DebugView delivery remains unverified.

References: [basic consent](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [manual/history pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en), [retention](https://support.google.com/analytics/answer/7667196?hl=en), [disable controls](https://developers.google.com/tag-platform/security/guides/privacy).

The expanded quiz remains in memory; no quiz persistence purpose or visitor ID was introduced. Starts before consent are dropped, not backfilled. Its optional categorical/count metrics and confirmed reset actions fit the existing version-2 tool-usage purpose; rejection/withdrawal and the production account-review guard remain unchanged. Never enable Enhanced Measurement mailto/outbound/form capture to replace this explicit allowlist. Bounded numeric validation accepts quiz score totals only when they are integers between zero and the approved question count. The scoreboard’s direct export reports `match_status`; it records successful PNG generation, not confirmed download/opening.
