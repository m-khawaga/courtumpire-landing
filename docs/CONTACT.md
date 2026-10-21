# Email-based Contact — current local review

Contact remains `/contact.html`, with its existing canonical, footer link and XML sitemap entry. The navy/lime shared header/footer and moderate H1 are preserved. Four native, single-selection radio choices use two desktop columns and one mobile column. No topic is required; **Use general contact** clears a choice. Selection prepares the fixed `info@courtumpire.com` address with an encoded subject. Problem-report guidance reserves its space, keeping actions stable. Privacy enquiries have a separate quiet email link.

**Open email app** is a mailto action, not a website submission. The address is visible/selectable. **Copy email address** announces success only after the Clipboard promise resolves; blocked/failed copying explains manual selection. Copying is guarded while pending. Without JavaScript the general mailto and privacy link still work. No form backend, uploads, accounts or external service is used.

`tools/contact.mjs` binds once and uses the existing consent-gated `contact_intent` event for topic selection, email intent and copy outcome. It sends only enum category/action/result values, never email, full mailto, message contents or submission success. Rejection preserves all Contact functionality. Local testing never sends production analytics; `?analytics_debug=1` shows only bounded in-memory categorical events after acceptance. `ACCOUNT_SETTINGS_REVIEWED=false` remains unchanged.

## Removed abandoned backend work

Removed only feature-exclusive local files: the contact Worker handler/entry, native email binding/Wrangler configuration, dedicated rate-limit/idempotency Durable Object, secret examples, local submission mock server, backend unit tests and frontend endpoint configuration. Removed the associated package scripts, test entries and ignore paths, submission-event schema, provider-specific setup documentation and draft Cloudflare/Resend form-provider privacy statements. No production dependencies had been installed for that backend, so none needed uninstalling. Shared event/logo/checklist/scoring/print/navigation/consent code and other website changes were retained.

No remote resources were created, changed or removed. Earlier Cloudflare account listing and public DNS lookups were read-only. No verification email or real delivery was requested, and no DNS, routing, hosting, account, paid-service or remote configuration changed. GitHub Pages remains the host. No push, merge or deployment occurred.

The Privacy Policy now describes actual email enquiries and existing optional analytics, without unactivated form providers or invented provider retention. Actual mailbox arrangements/retention/safeguards remain an owner documentation responsibility; no new email service is activated by this change.

## Focused review

Run `npm run preview`, then visit `http://127.0.0.1:4173/contact.html`. Stop your process with Ctrl+C. If that port is already used, set `PORT=4174` in the environment before starting the same script. `npm run test:contact` uses an owned ephemeral loopback server and closes it afterward. It blocks all external traffic, simulates clipboard success/delay/failure, inspects mailto targets without opening an external app, and saves results/screenshots in `.local-review/contact-email-2026-10-21/`.

The latest focused run passed **81 checks**, with no browser errors or external requests. It additionally checks the address centered over both actions and its increased typography. Current screenshots and `verification.json` are in `.local-review/expansion-2026-10-21/contact/`; see [the current review](EXPANSION-REVIEW.md). The earlier 77-check artifacts are retained as history.

Review desktop/mobile screenshots, radio keyboard arrows, clear-to-general, focus/hover contrast, stable actions, exact encoded subjects, honest copy failure/success, working rejected-consent actions and bounded contact-intent records. The test checks Contact canonical/title, one H1, footer/site-map/XML presence and direct privacy links. The later expansion also required a broader generated-page SEO check, recorded in the current review. No real email sending, mail-client delivery or physical phone testing is claimed.
