
# Embedded PDF save contract v1

Website resources supply the report content, document layout, page size and orientation, pagination, metadata and suggested filename. The website catalogue supplies discovery. Android exposes the same save capability across approved catalogue URLs, including compatible resources added after the APK was built.

- Existing resources can call `printDocument(title, metadata, body, options)` from `tools/print.mjs`. This keeps the existing browser print report and uses it as input to the app-only PDF template.
- A resource with a prepared report element can import `supportsEmbeddedPdf` and `saveEmbeddedPdf` from `/tools/embedded-pdf.mjs`. Check support before showing **Save PDF**. Call `saveEmbeddedPdf(report, {version: 1, filename})` with the current report. If it returns false, tell the user direct saving is unavailable and use the resource’s existing print flow. Catch generation errors and show an error.
- Reports support headings, text, lists, checklist state, column-spanning tables and local images. The shared website template sets A4 by default, white pages, margins, branding, page numbers and repeated table headers. Existing browser print CSS and its template remain the ordinary-browser and older-app path.
- Android advertises `data-cu-native-pdf="1"` and dispatches `cu-native-pdf-ready`. The bridge uses a main-frame, same-origin and same-path GET signal with only `cu-action=save-resource-pdf`. Android reads the one-shot result from `window.courtUmpireTakeResourcePdf()`. Its v1 object contains `version`, `filename` and `base64`.
- The app accepts a bounded PDF up to 8 MiB and a simple ASCII filename ending in `.pdf`. It asks Android’s document picker for a destination and writes only there. The document bytes, title and filename never enter the signal URL or analytics. The engine and fonts are first-party static files loaded on demand, and document generation stays in the WebView.
- The browser engine is pdfmake 0.3.13 with its distributed Roboto font bundle. The bundled files and licenses live in `tools/vendor/pdfmake-0.3.13/`. Changing the website template, fonts, a resource, or its page dimensions within the v1 payload is a website release. Changing MIME type, exceeding the byte cap, extending the approved catalogue URL policy, or changing the handoff or destination behavior requires an explicit new app capability. Use the print fallback for unsupported versions.

The included font covers the tested Latin names. Resources using other scripts should verify their glyphs or add the appropriate font on the website.
