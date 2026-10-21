# CourtUmpire assets

CourtUmpire website image assets, including the brand visuals, icons, and current Android and Wear OS product screenshots in `screenshots/`.

Originals remain intact. New derivatives use the original artwork without cropping:

| Source | Derivative | Dimensions | Encoding |
| --- | --- | --- | --- |
| `app-icon-clean.png` | `app-icon-256.webp` | 256×256 | WebP quality 85 |
| `screenshots/courtumpire-current-splash.jpg` | `screenshots/courtumpire-splash-600.webp` | 600×1300 | WebP quality 85 |
| `app-icon-clean.png` | `social-card.jpg` | 718×718 | JPEG quality 85 |

Generated with Sharp 0.35.5 using `sharp(source).resize({width, withoutEnlargement:true}).webp({quality:85}).toFile(destination)`, or `.jpeg({quality:85})` for the social card. Widths are 256, 600 and 718 respectively. Recheck dimensions, file sizes and visual quality when regenerating; do not overwrite screenshots with unreadable thumbnails. The social image is the CU app icon with its tennis ball, not a new illustration.

Eight app gallery images now use uncropped WebP derivatives in `screenshots/display/`: `sharp(source).resize({width:640,withoutEnlargement:true}).webp({quality:84})`. The watch stays at 454×454. `manifest.json` records dimensions and original/display bytes. Total gallery bytes: 1,269,100 → 306,798 (75.8% less). Original JPG/PNG files remain intact. The build reads the manifest to emit explicit dimensions; regenerating assets does not happen during normal build and adds no production dependency.

The 21 October website update copies the actual app serving-ball image, unchanged, from `C:/05_CourtVoice/app/src/main/res/drawable-nodpi/server_tennis_ball.png` to `server-tennis-ball.png`. The app logo remains `report-logo.webp`. Wordmarks are styled text, following the inspected app sources. `tools/brand.mjs` stores brand assets/colours and the fixed Material EmojiEvents trophy silhouette used instead of emoji (Material Icons, Apache 2.0: https://github.com/google/material-design-icons). No Android/Wear OS source was modified.


`website-qr-rounded-dark.svg` is a local ZXing-generated QR for exactly `https://courtumpire.com/`, error correction M, four-module quiet zone, with gently curved exposed data-module corners and unchanged square finder patterns. The SVG background is transparent. Result cards use a 124 px off-white backing in the dark palette after a transparent inverse-code trial failed reduced-size decoding. PDFs continue using `website-qr.svg`. See `docs/FOCUSED-CORRECTIONS.md`; no website QR dependency or network service is used.
