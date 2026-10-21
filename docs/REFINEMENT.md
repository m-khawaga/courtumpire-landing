# Local architecture, usability and PDF review

21 October update: see [the coordinated tools update](CLUB-TOOLS-UPDATE.md). Every document now uses the shared brand strip above a divider and a prominent title/event area below it. The previous title-inside-brand layout described in older notes has been superseded.

Continue on `codex/practice-planner-local`. All work remains local and unpushed. No deployment, hosting, DNS, Search Console, advertising or commerce activation is authorized.

The current scope includes implemented scoring and club tools; earlier roadmap-only deferrals are superseded. See [the current tools/SEO/indexing handoff](TOOLS-SEO.md), [the complete hierarchy and roadmap](ROADMAP.md) and [the existing practice/content guide](PRACTICE.md).

## Preview

No website dependencies need installing. In PowerShell:

```powershell
cd C:\courtumpire-landing-pr5-test
npm run build
npm run preview
```

Leave that terminal open, then open:

- [Homepage](http://127.0.0.1:4173/)
- [Practice](http://127.0.0.1:4173/practice/)
- [Clubs & Coaches](http://127.0.0.1:4173/clubs-coaches/)
- [Visitor site map](http://127.0.0.1:4173/site-map/)
- [Planner](http://127.0.0.1:4173/practice-planner/)
- [Drill library](http://127.0.0.1:4173/tennis-drills/)
- [XML sitemap](http://127.0.0.1:4173/sitemap.xml) (production URLs are intentional)

Press Ctrl+C to stop the preview. Tests start and stop their own temporary loopback servers. The QA preview server is stopped after review; use the commands above to start your own.

## Navigation, home and shared styles

The active top level is **The App / Practice / Play & Score / Clubs & Coaches / Get the App**, with Home on the logo. All visible destinations work. Shop remains absent. Practice and Clubs & Coaches use native disclosure menus that work with touch, Enter/Space and without JavaScript; Only one menu opens at a time; selecting a destination, outside click or Escape closes it. `aria-expanded` and actual-page `aria-current` agree with the state and direct reload. Deeper pages include registry-derived breadcrumbs through Practice, the drill library and the relevant player collection.

The homepage now has one introduction, direct working task links, one practice/player-count section, one app area containing preserved features/screenshots/FAQ/download, and compact useful resources. Actual app screenshots have a manual gallery with Previous/Next, position, keyboard access, native swipe/trackpad and no exposed scrollbar. There is one app feature grid. The old hero download CTA was removed with the redundant app introduction; existing header/download analytics placements remain. The measurement ID, consent policy and denied advertising defaults are unchanged. No new tracking events or providers were introduced.

The reported hover failure came from a secondary action inheriting the primary button's light hover background while also inheriting green text. Primary/secondary states now explicitly define text and background for default, visited, hover, focus and active. Actions wrap without fixed heights. Task cards use a shared flex layout with bottom-aligned actions on desktop and natural stacking on mobile; drill-card actions use consistent two-row layouts.

## PDF branding reference and the missing-header fix

The Android reference was **available and read only**:

- `C:\05_CourtVoice\app\src\main\java\com\mahmoud\courtvoice\ui\match\MatchReportExporter.kt`, particularly `renderReport`, `drawPageHeader` and `drawPageFooter`.
- Actual exporter logo: `app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp`, copied without modification to `assets/report-logo.webp`.
- The user-supplied Match Report header image confirms the split dark/green wordmark, logo, bold report subtitle and rule.

The available exporter uses A4 595×842 points, 40-point margins, Arial/platform sans-serif-like normal/bold weights, 18-point brand text, 10.5-point body/subtitle, 9.5-point small text, 13-point section headings, dark `RGB(2,8,23)` and green `RGB(116,176,36)`. The website template follows these verified branding choices with a browser sans-serif and a 10-point instruction body for readable complete activity sections. Its title is **Practice Plan**, not Match Report. It adapts layout to practice content; an exact pixel match to a complete app-exported PDF has not been claimed. The source and supplied header are sufficient references for this release; a full app-exported sample would permit an additional visual comparison.

The first PDF preview's missing header was a **print-CSS clipping defect**, not a missing design or unavailable reference. A fixed header with a negative top offset was clipped outside Chrome's printable content. It has been replaced by a normal-flow full first-page header, plus a compact CourtUmpire continuation header and numbered footer in CSS page-margin boxes. The report includes player count, planned/target duration, level, focus, goal, readable website address, diagrams, complete instructions, rotations and variations. `practice/print-plan.mjs` consumes the same catalogue and instruction renderer as the website. The temporary print DOM is removed afterwards, and printing from courtside includes the entire session and restores the current activity.

The QR is a local black/white SVG with a quiet zone and encodes **exactly `https://courtumpire.com/`**. `scripts/QrTool.java` used the Android project's already cached ZXing core to generate it. No new library was installed or added to the website. Java/ZXing is only an optional development utility for regenerating/decoding the committed asset; ordinary build, planner and print do not use Java.

Logo/QR are real image elements, court markings are SVG strokes, and report content does not depend on background fills. Both short and multipage A4 outputs are generated with **background graphics disabled** and have been rendered for inspection. The actual QR in each rendered PDF is decoded; merely seeing a square pattern is not accepted as verification.

### Browser print settings

Use a current Chrome/Edge browser supporting CSS page-margin boxes for the branded continuation header and `Page n of N` footer. Choose **Print / Save PDF → Paper: A4 → Scale: 100% (default)**. Turn **Headers and footers off** in the browser print dialog to remove the browser's automatic title/date/URL. Background graphics may remain **off**. The template supplies its own readable address and page numbers. Other browsers may print the activity content but omit CSS margin-box running headers/footers; use Chrome/Edge for the verified output.

Do not select a custom large print margin or shrinking scale if matching the reviewed layout. Normal catalogue content and planner remain independent of print support. The sample plans are one page and three pages respectively, with no navigation, editing controls or advertising.

## Validation and review artifacts

```powershell
npm run build
npm run lint
npm test
$env:NODE_PATH='C:\Users\mKhaw\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:BROWSER_CHANNEL='chrome'
npm run test:refinement
npm run test:browser
npm run test:existing
```

The optional browser-tool setup for other computers is in `PRACTICE.md`. `test:refinement` checks navigation/keyboard use, button contrast, action alignment, both site maps and footer links, courtside-print restoration, and produces fresh screenshots/PDFs. `test:browser` preserves all planner/filter/persistence/video/ad regression checks. `test:existing` exercises consent and app/legal links using recording stubs, without contacting live analytics. External requests are blocked in browser QA.

Current verification includes 18 pure-logic tests and generated-HTML auditing of 40 routes / 38 production canonicals. Browser suites cover the planner, new tools, navigation, consent and responsive layout; the final reports are listed in `.local-review/REVIEW.md`. The HTML map covers all 38 available canonical pages and the XML retains its existing destination. No third-party requests, broken local resources or page errors occurred. Final PDFs are one and three A4 pages with page counts and continuation headers verified; both QR codes were independently decoded from rendered pages to exactly `https://courtumpire.com/`. The available app generator/logo and supplied header image were sufficient references; no missing reference blocks this local review.

Ignored `.local-review/refinement/` contains:

- `home-intro-desktop.png`, `home-intro-mobile.png`, full `home-*.png`, `practice-*.png`, `clubs-*.png`, `navigation-*.png` and `site-map-*.png`.
- `courtumpire-short.pdf` and `courtumpire-multipage.pdf`.
- Rendered `short-page-1.png` and `multi-page-1.png` through `multi-page-3.png`.
- `results.json` and `pdf-checks.json`.

To regenerate the QR using the existing local cache (not needed to build the website):

```powershell
$taskJava='C:\Program Files\Android\Android Studio\jbr\bin\java.exe'
$taskZxing='C:\Users\mKhaw\.gradle\caches\modules-2\files-2.1\com.google.zxing\core\3.5.3\ca1349214a356cd7958651b2d5a0e1f3811a9c4b\core-3.5.3.jar'
& $taskJava --class-path $taskZxing scripts/QrTool.java generate assets/website-qr.svg
# After rendering the PDF page to PNG with Poppler:
& $taskJava --class-path $taskZxing scripts/QrTool.java decode .local-review/refinement/short-page-1.png
& $taskJava --class-path $taskZxing scripts/QrTool.java decode .local-review/refinement/multi-page-1.png
```

All 16 custom practice formats retain their existing editorial-review status. Ads stay off, consent behavior is preserved, and commerce remains documentation/extension points only. No mobile-app file was changed. No push, merge, publication, deployment or Search Console submission was performed.
