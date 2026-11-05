# Website repository audit — 5 November 2026

## Scope and starting state

Repository root: `C:/CourtUmpire-web-embedded`, remote `m-khawaga/courtumpire-landing` (public). Current branch: `codex/app-embedded-presentation`, starting at `e7d132571e1692cfd7a1a58d3790356ce0773992`. Working tree/index were clean, with no untracked files; review archives and generated files were already ignored.

Fetched all remote branch refs without merging or changing application files. The normal configured fetch refspec previously fetched only `main`; the additional branch refs were explicitly fetched for coverage without changing that configuration. GitHub's default branch is `main`, at `8fbfd53938bcf29213465dbae91caae61358e937`. Remote feature branch is `e7d132571e1692cfd7a1a58d3790356ce0773992`. Four intervening commits on `main` are PR merge commits; the starting feature tree and current remote main tree are identical. No website source changes were waiting to be committed.

## Security and history findings

Gitleaks 8.30.1 was obtained from its official release and verified against its published archive checksum. All reachable local/fetched branch history was scanned with `--all --full-history` (51 patch-bearing commits; merges counted separately in the local inventory). The initial outgoing feature range was empty. Tracked/index paths and working files, including ignored local review archives and generated Worker packages, were inspected too.

The history scan flagged 24 generic-key matches: Cloudflare Access audience/account/application/policy/IdP identifiers, an admin-origin URL, and browser storage-key names. The local scan flagged 71 occurrences of the same public configuration/storage identifiers, including copies in a baseline ZIP, extracted baseline and generated distribution. These are not bearer tokens, API keys, private keys, client secrets or authentication grants. GA4 ID `G-H387MYJ9KJ`, Turnstile site keys, public origins and database/resource binding identifiers are public configuration and remain unchanged.

Targeted checks of password/token assignments, credential-bearing URLs, private-key markers and service-account patterns found fixture values, a test-only credential-bearing URL used to verify rejection, and code reading runtime environment/session values. No real hardcoded credential was found. Secret binding *names* and deployment flags are not credential values. No genuine secret or private editorial/moderation payload was identified in reachable remote history. No credential rotation is indicated by these findings.

## File classification and hygiene

| Material | Treatment |
| --- | --- |
| Public website source/assets, published article source, tests, public configuration and concise documentation | Retained in Git unchanged |
| `tools/vendor/pdfmake-0.3.13` browser/app document dependency | Required production source asset, retained; not mistaken for generated evidence |
| `.local-review/` review screenshots/PDFs/reports/baseline archive and `.weekly-private/` authoring/deployment/rollback material | Already ignored; preserved at original locations, not relocated or deleted |
| `dist/`, `node_modules/`, generated Worker asset modules, `.wrangler/`, `.dev.vars` and generated type files | Existing ignores retained; no tracked build outputs needing index removal were found |
| `.env` / `.env.*`, root or nested `.dev.vars` variants | Added narrow credential ignores; public `.env.example` files remain eligible |
| Detailed inventories/redacted scanner reports/preservation manifests | Kept outside Git in the coordinated local audit directory |

No index-only removal was necessary. Existing required website images and concise source-controlled reports were not removed. This commit adds only this audit note and credential-ignore rules; no publishing/moderation executable logic, bindings, flags, authentication, consent, analytics, database, content, routes, Worker assets or normal printing behavior changes.

## Preservation and readiness

Existing Android signed APK, exact R8 mapping and Samsung evidence are separately recorded in the Android audit note; this website commit is not an Android release source. Across both repositories and the Samsung evidence directory, 626 release/rollback/acceptance files were hashed before hygiene work and are checked again afterward. Current local review galleries retain their media paths. One older archived Android delivery-metadata gallery had pre-existing broken relative image links; originals remain intact and no gallery is relocated.

The website feature branch is suitable for a normal explicit feature-branch push after this local hygiene commit, from a repository security/hygiene perspective. It still tracks `origin/main`; that upstream setting was preserved. Its production-source tree was identical to main before this documentation/ignore change, so a future PR must contain only the intended hygiene/documentation delta. Do not substitute a deployment or main-branch push. Re-fetch/review immediately before a future push. No push, PR merge, Pages publication, Worker deployment or history rewrite was performed.

Validation: inspect the explicit two-file diff, check credential-ignore behavior with `git check-ignore`, scan the staged diff, and compare application/source asset trees with the starting release. Runtime/SEO tests are unnecessary for an ignore/documentation-only change; no live requests, analytics traffic or production mutations are needed.

Limitations: scanners are heuristic. Coverage includes reachable fetched branch history, not deleted/unreachable objects, PR-only refs, GitHub Actions logs/artifacts, releases or account-level secret storage. Dependency caches and binary media are not exhaustive credential audits; local ZIP text members were additionally inspected. Detailed private local reports remain outside Git. No claim of absolute absence of secrets or a deployment approval is made.
