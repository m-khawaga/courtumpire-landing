# CourtUmpire Weekly editorial guide

**CourtUmpire Weekly — The week turned here.**

Write for a curious tennis reader. Lead with an original observation grounded in a verified event, then develop situation → turning point → consequence. Do not turn every edition into an umpiring lesson. Be the Umpire is a separate future product; the existing scoring quiz is unchanged.

Friday's edition is a rolling seven-day window, normally ending at 16:00 Europe/Berlin and published after review around 18:00. Include the preceding weekend's completed finals and this week's completed matches by the actual cutoff. Clearly separate the coming weekend preview and next-week watchlist. An ongoing tournament is still ongoing; do not manufacture a champion before its final. Record exact coverage bounds and offsets across daylight-saving changes.

Start with an opening and quick summary. Develop the turning point when supported. Include selected results, the official ranking snapshot, player updates and notable incidents where evidence supports them, then the weekend preview and next-week watchlist. A required section with missing evidence gets a brief honest editorial limitation. Do not pad modules, claim comprehensiveness, or confuse opinion with a sourced fact.

Before approving an edition:

1. Open each source. Verify scores, rounds, status, dates, ranking type/publication date, injury wording and event state. Factual paragraphs, table rows, timeline events and reveal explanations need source references.
2. Distinguish champions from individual match winners, retirement from completion and walkover from a played score. Put scheduled/ongoing/postponed events in schedule tables.
3. Read all analysis separately. Label inferences and cite their basis where applicable. Never invent statistics, win probabilities, comments, reactions, quotes or video IDs.
4. Verify byline and AI-assistance disclosure. Leave editionNumber, publishedAt and updatedAt null in new AI-generated drafts. The publisher assigns metadata during the approved release step; a revision preserves the original publication timestamp.
5. Review one optional retrospective reveal and one optional three-to-five-item timeline only if they add value. Readers can reveal immediately; neither is a forecast or public poll.
6. Prefer ordinary official video links. Verify rights-holder provenance and embedding availability before marking an embed allowed. No unlicensed player photography or tournament logos, copied thumbnails, fake documentary images, rehosting, clipping or downloading. The owned typographic social card is generated from title/date.
7. Test the narrow screen layout, all table columns, no-JS reading and source/correction links. Check the exported JSON and its exact production preview.
8. For a genuine correction, preserve the original publication time and ID, set updatedAt and add a visible correction note. A quiet wording revision still records updatedAt; do not fabricate correction activity.

This phase has no scheduled drafting, auto-publication, notification email or comprehensive spoiler mode. The owner decides when to publish each reviewed edition.

Every edition must carry separate Men — ATP singles top 10 and Women — WTA singles top 10 tables (including honest missing-data states), the five specified columns, their official dates and the comparison edition. Verify stable profile identity separately from dated rank/points evidence. Run Calculate ranking changes in the local editor and review all N/A/identity flags. See WEEKLY-RANKINGS.md; never infer movement from row order, assume rank 11/zero points, or replace the previous Weekly snapshot with another date.


Focused results convention (October 2026)
Use weekly-singles, a results table with tournament, tour, category, round, date, winner, opponent, score, status. Tour is ATP/WTA; verified category is 250/500/1000/Grand Slam/Finals. Include all concluded main-draw singles matches in the full window, not only headline matches; qualifying/Challenger/ITF/WTA 125 excluded. Keep doubles separate. Status additionally accepts defaulted. Each table supports up to 1,500 rows within the existing 500 KB import limit.
Use results-coverage (general), with tournament, tour, category, status, verified-count, note. Tour is ATP or WTA. Category contains only the verified level (for example 1000, 500 or 250), without repeating the tour; use N/A with a note if unverified. Each tournament is complete/incomplete/unavailable; count equals actual supplied singles records. Missing boundary completion times, missing rounds or unresolved status mean incomplete. A fully inclusive results claim fails validation if any ledger row is incomplete. Duplicate matches across sections fail validation. Boundary-date rows require an optional completed-at column with a sourced timestamp; completion must lie in [coverageStart, coverageEnd). Use N/A for non-boundary timestamps when that column exists.
The renderer keeps full static HTML. JavaScript progressively limits to five rows, adds tour/tournament filters and real filtered counts, and preserves filters when expanding/collapsing. No data is fetched from third parties by these controls.
Historical rankings: independent verified rank/points remain usable when profile identity or baseline is missing. Each wholly unavailable comparison column is hidden. Unverified numeric snapshots are never enabled by a private-renderer override. Official release date, source URL and actual retrieval timestamp remain separate.
