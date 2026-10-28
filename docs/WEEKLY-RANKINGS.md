# Weekly rankings and historical comparisons

The article contract remains **courtumpire-weekly/v1**. No row/player properties were added outside the existing `cells`, `sourceIds`, table and source capabilities.

Every edition's `rankings` section has two separate `variant: "rankings"` tables:

| ID | Heading | Ordered column keys / labels |
| --- | --- | --- |
| `atp-top10` | Men’s Top 10 · ATP | `rank` / Rank, `player` / Player, `points` / Points, `rank-change` / Rank change, `points-change` / Points change |
| `wta-top10` | Women’s Top 10 · WTA | The same five columns |

Each table has its own actual official `asOf` ranking date, also included in its caption when available. Keep ATP and WTA separate. Do not mix official singles with live, Race or doubles rankings. The renderer identifies and links the comparison edition and displays the previous tour-specific snapshot date; these dates may differ between the two tours.

## Two different kinds of source evidence

Each ranking row's `sourceIds` should contain:

1. A **verified official player-profile source** for identity. ATP identity is the tour plus four-character stable player code parsed from an official `/en/players/<display-slug>/<code>/...` URL. WTA identity is the tour plus numeric identifier from an official `/players/<id>/...` URL. Display names, URL slugs, www spelling, row positions and current ranks are not identities. Do not invent a URL or infer a profile ID from a player's name.
2. A **separate dated official singles-ranking source** supporting the rank and points. The accepted source paths are ATP `/en/rankings/singles...` and WTA `/rankings/singles...` on their official domains. Save the actual ranking date in table `asOf`; an official page URL alone does not prove a historical snapshot. The editor must verify the dated source. The profile URL does not establish historical rank or points.

If profile identity cannot be verified, omit the guessed profile source. The edition can still render: comparison is **N/A** and the private editor displays a detailed review warning with source links. Missing identity alone does not block the entire article. Conflicting duplicate verified identities or impossible duplicate current ranks are validation errors.

If dated ranking evidence is missing, rank/points are displayed as N/A with one explanation; no automatic incomplete heading is added. Empty tables remain present with an explicit explanation, not fictional top-10 entries. `asOf: null`, `rows: []`, and an explanatory `note` are supported. A table is presented as complete only with ten distinct verified identities, unique ranks 1–10, dated supporting ranking sources and numeric points. Metadata cannot prove source truth; human source checking is required before approval.

## Changes are between Weekly editions

Use the snapshot from the **previous published CourtUmpire Weekly edition**, not an assumed previous Monday or the row above. Rank change = previous rank minus current rank. Points change = current points minus previous points. Match on stable tour/player identity.

Examples of canonical cell values produced by Calculate ranking changes:

- `↑ 2 (up 2 places)` / `↓ 1 (down 1 place)`
- `↑ 150 (up 150 points)` / `↓ 80 (down 80 points)`
- `0 (unchanged)`
- `N/A`

Arrows and words convey direction independently of colour. Zero means an actual verified unchanged value. N/A means a baseline/current value or identity was unavailable. A confirmed published edition 1 shows **First edition — no comparison.** and hides the two change columns in the reader only. JSON always retains both N/A cells. A draft with no established baseline must say comparisons are unavailable, never assume it is first. The renderer never assumes rank 11 or zero points.

**New to top 10** is a separate label in the player cell. It is shown only when the previous saved top 10 was complete and the verified current identity was absent. If the previous top 10 was incomplete, absence cannot prove entry and is not labelled new. Current values may be verified while their comparison remains N/A.

## Verified baseline for a player outside the previous top 10

Optionally add a `variant: "general"` table in the same section with ID `atp-comparison-baseline` or `wta-comparison-baseline`. Use columns `rank`, `player`, `points`; factual row sourceIds include the same stable profile identity and **separate historical ranking evidence**. Its `asOf` must equal the previous Weekly edition's official snapshot date for that tour, not the current date. Caption says selected/all and explains this is historical comparison input. Include a note explaining the verification. This table is visible and sourced, not a hidden guessed value.

Only uniquely matched, dated and evidenced baseline rows are eligible. A missing/wrong date, ambiguous identity or profile-only source produces N/A. An evidenced historical rank of 14 may be used; rank 11 is never assumed. Rank/points are checked independently so an unavailable component stays N/A.

## Editor, importer and immutable history

The local editor reads only a local context of eligible published snapshots. **Calculate ranking changes** updates the two change cells deterministically, shows warnings and renders the production comparison. A draft export keeps exactly the shared article schema. The CLI alternative is:

```powershell
node scripts/weekly-rankings.mjs .weekly-private/input.json .weekly-private/with-comparisons.json
```

It refuses to overwrite an existing output file. Draft import validates the article structure and source references; it can retain N/A cells awaiting calculation. The editor export, approved publication import and public build verify supplied change values against the same comparison logic. Publication rejects stale or fabricated deltas. Run Calculate ranking changes before export/promotion; a structurally imported draft is not publication-ready.

At approved publication, `weekly-core/ranking-history.json` records an immutable, content-addressed derived ranking snapshot and pins that edition's comparison snapshot. It is not a second article authoring format. The canonical article remains its single v1 JSON file. The history stores public ranking data, dated public source references and public edition metadata only, and is excluded from the website artifact. Keep it in Git with the publication source. Earlier snapshots remain when editions are corrected, renamed or withdrawn; editing an older article does not silently recalculate a later edition's published comparison. Published ranking corrections require an explicit new source revision, updatedAt and correction record, followed by review of any newly created comparison. Never edit old snapshot entries in place.

The comparison edition's old slug continues through its generated redirect when renamed. If it is later withdrawn, its historical snapshot is retained for audit; review how that withdrawal should be explained in linked later editions before publishing the withdrawal. No historical values are erased merely to make a table look complete.

Pinned comparison links follow the prior edition's current slug without changing its stored ranking values. When the prior edition is withdrawn, the renderer retains the historical snapshot, labels the withdrawal and links back to the archive.

## Reader and local evidence review

Current rank/points eligibility, profile identity, and baseline availability are independent. A source URL is only an eligibility check, never factual verification. Review source contents/date and player mapping before publication. The editor lists these three checks separately with the exact source links. The local rehearsal alone opts into supplied secondary numbers with the visible note “Secondary-source snapshot; official verification incomplete.” Public build never enables that option. No snapshots are changed for presentation. Reader headings no longer add automatic selected/incomplete labels; captions retain the author’s truthful scope.


Manual dated-snapshot entry is available under Edit → Import a dated official ranking snapshot. Paste exactly ten tab-separated rows (rank, player, points, optional verified official profile URL). Supply the actual official release date, official published-singles URL and actual retrieval timestamp, and confirm source review. The importer rejects a release after the edition cutoff, bad dates, duplicate ranks/identities, missing values and retrieval after the stated fact-check time. It previews the replacement before applying it. Profile URLs establish identity only; the dated ranking source supports rank/points. No automated retrieval or URL-shape check proves factual correctness. Preserve older editions and prepare new releases in a new edition.

Reader behavior: when a tour has no usable prior rank/points baseline, both change columns are omitted, while canonical JSON keeps them. Unknown baseline is never inferred to mean first edition. Current verified values survive unavailable identity/comparisons. Row-level sources are retained in collapsed evidence notes even when repeated inline citations are removed.
