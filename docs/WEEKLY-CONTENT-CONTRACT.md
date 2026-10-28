# Shared contract: courtumpire-weekly/v1

The complete machine-readable JSON Schema is `authoring/schema.json`. It is generated from `weekly-core/contract.mjs`, which also supplies the dependency-free runtime validator used by the editor, importer and build. `authoring/template.json` is a starting template, not a publishable article. `npm run weekly:demo` generates a clearly fictional draft fixture only in ignored `.weekly-private/demo/fixture.json`.

The canonical publication format is exactly one JSON object, no wrapper, extra properties or second CMS format. Every listed object field is required. Optional values use `null`; arrays may be empty subject to the minimums below. All human-facing strings are plain Unicode text, without HTML, Markdown, code blocks or ChatGPT citation tokens. Source references are IDs, not inline proprietary citations. HTTPS URLs are checked; the renderer supplies internal routes itself.

## Top-level fields

| Field | Type / rule |
| --- | --- |
| schemaVersion | Exactly `courtumpire-weekly/v1` |
| id | `cu-weekly-YYYY-MM-DD`; matches issueDate and stays immutable |
| slug | `YYYY-MM-DD-short-descriptive-slug`; lowercase alphanumeric/hyphen segments |
| editionNumber | null in generated drafts; positive integer assigned sequentially by the publisher |
| status | `draft` or `published` |
| title, deck | Required plain text; max 180 / 500 characters |
| language, timezone | `en`, `Europe/Berlin` |
| issueDate | Intended Friday, `YYYY-MM-DD` |
| coverageStart, coverageEnd | ISO timestamps with offset, actual rolling coverage; start < end |
| plannedCutoff | ISO timestamp with offset; coverageEnd must not exceed it |
| factsCheckedAt | ISO timestamp with offset; at/after coverageEnd and source retrievals |
| publishedAt | null until the approved publication step; immutable thereafter |
| updatedAt | null unless genuinely revised; must be later than original publication |
| authorLabel | Plain byline, normally `CourtUmpire Editorial`; no invented person |
| aiAssisted | Boolean |
| seoDescription | Plain description, max 300 characters |
| tags | Array of strings |
| commentsEnabled, reactionsEnabled | Booleans; authoritative source flags |
| sources, sections, corrections | Arrays of the exact objects below |

The publisher rejects invalid dates, inconsistent publication/fact-check ordering, duplicate IDs/slugs/edition numbers, source-reference errors, schema violations and stale updates. No timestamp is taken from build time. Drafts never get silently promoted. Eligibility requires published status, edition number and a non-future publishedAt. Drafts in the public content folder fail the build.

## Source

`{id, title, publisher, url, publishedAt, accessedAt}`. `id` is unique; URL is absolute HTTPS without embedded credentials. `publishedAt` is an ISO timestamp, date-only `YYYY-MM-DD`, or null if undisclosed. `accessedAt` is an actual retrieval timestamp with offset. Use separately relevant results, rankings and news sources; do not invent dates or use a generic homepage as support for everything.

## Section

`{id, heading, paragraphs, tables, timeline, reveal, videos}`. Permitted unique ordered IDs:

`last-week` (optional), `opening`, `at-a-glance`, `turning-point`, `results`, `rankings`, `player-watch`, `incidents`, `watch`, `this-weekend`, `next-week`.

Required IDs: opening, at-a-glance, results, rankings, this-weekend, next-week. Unsupported modules should be omitted unless required; explain missing evidence in a brief editorial paragraph instead of fabricating content or leaving an empty module. Turning-point and player-watch normally appear when supported.

Paragraph: `{text, kind, sourceIds}`. `kind` is fact, analysis or editorial. Facts require evidence. Analysis is visibly labelled and should cite its factual basis when applicable. Editorial questions/transitions may have no sources.

## Table

`{id, variant, caption, scope, asOf, columns, rows, sourceIds, note}`. Variant: results, rankings, player-updates, schedule or general. Caption says **selected** or **all** and explains scope. `asOf` is a verified date or null. `note` is text or null. Columns are `{key, label}` with unique keys. Rows are `{cells, sourceIds}`; cells are strings keyed **exactly** by the columns, and each factual row needs evidence.

- Results keys: tournament, tour, round, date, winner, opponent, score, status. Status is completed, retired or walkover. Walkovers have an empty score, `—`, `N/A` or `not played`, never a played score. Explain whether winners are champions or individual-match winners in the round/scope/caption; the renderer does not infer a champion.
- Rankings: include both atp-top10 and wta-top10 with ordered keys rank, player, points, rank-change, points-change. Changes use the previous published Weekly snapshot and remain N/A when unverified; zero means verified unchanged. Use official singles rankings, with actual publication date in both asOf and caption. No live/Race/doubles mixtures.
- Player-update keys: player, status, reported-issue, announcement-date, return-status. Preserve distinction between injury and an unexplained withdrawal.
- Schedule keys: tournament, tour, location, dates, status. Ongoing, scheduled and postponed matches go here, not into completed results. Do not invent start times.

The validator adds only structural and consistency checks; it cannot verify whether a score or claim is true. Editorial verification remains necessary.

## Optional interactions and media

Timeline item: `{label, text, sourceIds}`. At most one timeline per edition, with three to five evidenced items. No invented probabilities.

Reveal: null or `{label, question, options, answerOptionId, explanation, sourceIds}`. Options are `{id, text}`; two to four unique options; answerOptionId names one. At most one reveal. Explanation is sourced. Native `<details>` permits immediate Show answer and works without JavaScript; no answer submission, poll or result totals exist.

Video: `{title, url, provider, channel, publishedAt, embedAllowed, rightsStatus, rightsNote, sourceIds}`. Provider is youtube or external. Rights status is verified-official-embed, owned, licensed or link-only. Rights provenance must actually be checked by the editor. Use null for undisclosed video publication date; otherwise ISO timestamp/date-only.

Allowed YouTube format: `https://www.youtube.com/watch?v=VIDEO_ID`, with exactly the eleven-character video ID and no other query fields. Phase 1 external link-only allowlist: `https://www.atptour.com/en/video/...` and `https://www.wtatennis.com/videos/...`, without query/hash. Another official provider needs an explicit reviewed allowlist extension, not arbitrary iframe HTML. Non-YouTube media cannot embed. `link-only` requires embedAllowed false. Owned/licensed status needs actual evidence from the owner. The static renderer loads no third-party media/thumbnail; only the explicit video action creates a youtube-nocookie iframe with no autoplay and an ordinary source-link fallback.

Comprehensive spoiler hiding is explicitly deferred: titles, decks, feeds and social cards may reveal outcomes. No incomplete spoiler-protection claim is shown to readers.

## Corrections and publication identity

Correction: `{at, note, sourceIds}`. Timestamp must lie between original publication and the current updatedAt; source IDs must exist. No invented corrections. Original publication time and engagement identity stay intact.

Create and update are distinct CLI operations. Updates require the stable ID plus a current source hash. Published metadata is immutable. Slug changes produce redirects; withdrawals remove static pages and deactivate registry membership after the approved registry sync. See `WEEKLY-RUNBOOK.md` for commands and sequencing.

## Required ATP/WTA ranking profile for v1

The rankings section must contain atp-top10 and wta-top10, each with ordered keys rank, player, points, rank-change, points-change. Use two separate official snapshot dates. Unknown identities keep comparison N/A and a review warning, without blocking the article. Stable identity comes from a verified official player-profile URL in row sourceIds; separate dated ranking evidence supports rank/points. See [WEEKLY-RANKINGS.md](WEEKLY-RANKINGS.md) for the unchanged-schema mapping, exact change strings, optional historical baseline tables and immutable comparison history. The columns are required; their values may be N/A with a truthful missing-data explanation.

## Presentation conventions (v1 unchanged)

Reader typography, numbered citations, date formatting, collapsed sources and table/cards are renderer-owned. All text stays plain Unicode. Put one final editorial discussion paragraph in next-week with prefix `Reader question:`. Verified tournament level belongs in the existing tour cell, preserving tour and discipline. Results/schedules are sorted only from explicit level text, then known dates; unknowns keep stable order. All data remains in mobile cards. Comparison columns always remain in JSON. The reader hides both when the entire tour baseline is unavailable, with one concise note; first edition is stated only when confirmed. Partial baselines retain N/A cells distinct from 0 (unchanged). Detailed evidence checks belong in the private editor, not repeated under each public player name.


Manual dated-snapshot entry is available under Edit → Import a dated official ranking snapshot. Paste exactly ten tab-separated rows (rank, player, points, optional verified official profile URL). Supply the actual official release date, official published-singles URL and actual retrieval timestamp, and confirm source review. The importer rejects a release after the edition cutoff, bad dates, duplicate ranks/identities, missing values and retrieval after the stated fact-check time. It previews the replacement before applying it. Profile URLs establish identity only; the dated ranking source supports rank/points. No automated retrieval or URL-shape check proves factual correctness. Preserve older editions and prepare new releases in a new edition.

Reader behavior: when a tour has no usable prior rank/points baseline, both change columns are omitted, while canonical JSON keeps them. Unknown baseline is never inferred to mean first edition. Current verified values survive unavailable identity/comparisons. Row-level sources are retained in collapsed evidence notes even when repeated inline citations are removed.


Focused results convention (October 2026)
Use weekly-singles, a results table with tournament, tour, category, round, date, winner, opponent, score, status. Tour is ATP/WTA; verified category is 250/500/1000/Grand Slam/Finals. Include all concluded main-draw singles matches in the full window, not only headline matches; qualifying/Challenger/ITF/WTA 125 excluded. Keep doubles separate. Status additionally accepts defaulted. Each table supports up to 1,500 rows within the existing 500 KB import limit.
Use results-coverage (general), with tournament, tour, category, status, verified-count, note. Tour is ATP or WTA. Category contains only the verified level (for example 1000, 500 or 250), without repeating the tour; use N/A with a note if unverified. Each tournament is complete/incomplete/unavailable; count equals actual supplied singles records. Missing boundary completion times, missing rounds or unresolved status mean incomplete. A fully inclusive results claim fails validation if any ledger row is incomplete. Duplicate matches across sections fail validation. Boundary-date rows require an optional completed-at column with a sourced timestamp; completion must lie in [coverageStart, coverageEnd). Use N/A for non-boundary timestamps when that column exists.
The renderer keeps full static HTML. JavaScript progressively limits to five rows, adds tour/tournament filters and real filtered counts, and preserves filters when expanding/collapsing. No data is fetched from third parties by these controls.
Historical rankings: independent verified rank/points remain usable when profile identity or baseline is missing. Each wholly unavailable comparison column is hidden. Unverified numeric snapshots are never enabled by a private-renderer override. Official release date, source URL and actual retrieval timestamp remain separate.
