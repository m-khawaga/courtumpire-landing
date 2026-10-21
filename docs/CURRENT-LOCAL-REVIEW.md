# CourtUmpire local review — 21 October 2026

**Historical report:** the later [current expansion review](EXPANSION-REVIEW.md) supersedes these counts, screenshots and affected-feature limitations. It includes the revised Contact page, checklists, scoring, 100-question quiz and 50-activity catalogue.

The current Contact page is email-based. Its four optional topics, encoded subjects, email/copy actions, separate Privacy enquiries and consent-gated intent passed **77 focused browser checks**, with no browser errors or external requests. General email also remains usable without JavaScript. No real email was sent. See [Contact handoff](CONTACT.md) for the narrowly removed abandoned backend files and privacy wording.

Current screenshots:

- [Contact desktop](../.local-review/contact-email-2026-10-21/contact-desktop.png)
- [Contact mobile](../.local-review/contact-email-2026-10-21/contact-mobile.png)
- [Copy failure](../.local-review/contact-email-2026-10-21/contact-copy-failure.png)
- [Copy success](../.local-review/contact-email-2026-10-21/contact-copy-success.png)
- [77-check report](../.local-review/contact-email-2026-10-21/verification.json)
- [Session checklist desktop](../.local-review/checklists-formats-2026-10-21/screenshots/checklists-session-desktop.png)
- [Session checklist mobile](../.local-review/checklists-formats-2026-10-21/screenshots/checklists-session-mobile.png)
- [Four-game score sheet](../.local-review/checklists-formats-2026-10-21/screenshots/score-sheet-four-game-desktop.png)

Actual PDF exports, rendered and inspected with background graphics disabled:

- [Session checklist with sample club logo — three pages](../output/pdf/session-checklist-with-logo.pdf)
- [Organizer checklist — one page](../output/pdf/organizer-checklist.pdf)
- [Six-game blank-name score sheet — one page](../output/pdf/score-sheet-six-game-blank.pdf)
- [Four-game doubles score sheet with sample logo — one page](../output/pdf/score-sheet-four-game-doubles-logo.pdf)
- [Rendered first page](../.local-review/checklists-formats-2026-10-21/rendered/session-checklist-with-logo-1.png)
- [Rendered continuation page](../.local-review/checklists-formats-2026-10-21/rendered/session-checklist-with-logo-2.png)

All four rendered QR codes decoded exactly to `https://courtumpire.com/`. Branding, clean blank participant cells, wrapped doubles names and removed-reminder exclusion were inspected. The supplied sample club artwork is for local review only.

The earlier generated-HTML/indexing audit passed 5,257 checks for 40 canonical pages and 92 internal destinations, with zero external requests. It was not restarted after the latest Contact-only scope change; Contact's canonical, footer, HTML/XML site-map entries and privacy anchor were rechecked by the focused suite. Search Console's reported cases remain unresolved without affected URLs.

The current broader tools browser run verified migration/order/checkmarks/restore, independent templates, all three logo formats, invalid-file preservation and stable desktop/mobile navigation, and produced the PDFs above. It stopped at a rules-selector event-order issue, fixed locally by letting select change handling run before preview synchronization. That broader suite was not rerun under the instruction to keep new checks focused on Contact. No complete new browser-pass claim is made for four-game rules/scoring or GA4 account delivery. Four/six-game engine and document behavior had passed unit tests earlier in this run.

Run `npm run preview` and open `/contact.html` on the printed loopback URL. Port 4173 is the default; use `PORT=4174` if occupied. The temporary process owned during this review is stopped at handoff. Existing unrelated preview processes were left alone.

Unrelated practice, navigation, logos, print, SEO/site maps and analytics work is preserved. Advertising remains off; commerce remains documentation only. The existing GA4 account-review guard remains off. No remote changes occurred: Cloudflare/DNS work was read-only, and nothing was pushed, merged, deployed or submitted to Search Console.
