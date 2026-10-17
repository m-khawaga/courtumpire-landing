# CourtUmpire assets

CourtUmpire website image assets, including the brand visuals, icons, and current Android and Wear OS product screenshots in `screenshots/`.

Originals remain intact. New derivatives use the original artwork without cropping:

| Source | Derivative | Dimensions | Encoding |
| --- | --- | --- | --- |
| `app-icon-clean.png` | `app-icon-256.webp` | 256×256 | WebP quality 85 |
| `screenshots/courtumpire-current-splash.jpg` | `screenshots/courtumpire-splash-600.webp` | 600×1300 | WebP quality 85 |
| `app-icon-clean.png` | `social-card.jpg` | 718×718 | JPEG quality 85 |

Generated with Sharp 0.35.5 using `sharp(source).resize({width, withoutEnlargement:true}).webp({quality:85}).toFile(destination)`, or `.jpeg({quality:85})` for the social card. Widths are 256, 600 and 718 respectively. Recheck dimensions, file sizes and visual quality when regenerating; do not overwrite screenshots with unreadable thumbnails. The social image is the CU app icon with its tennis ball, not a new illustration.
