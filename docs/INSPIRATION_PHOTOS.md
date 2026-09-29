# Inspiration photos and video screenshots

Open **Interior studio -> Inspiration**. Every reference now has **Upload photos / screenshots**. Select several images, edit their captions, choose **Make cover**, or open a thumbnail for full-size viewing. The viewer supports Previous/Next, arrow keys and Escape. The new-reference form also accepts optional photos together with the original HTTPS reference URL.

Limits: 12 photos per reference; JPG, PNG and WebP; source files up to 20 MiB and 40 megapixels. Stored copies preserve aspect ratio and are resized to at most 1600 pixels on the longest edge. HEIC and video files are not upload formats: export HEIC as JPG and upload screenshots from videos. Captured video frames can carry timestamps in their metadata.

## Storage and backups

Browser uploads are stored in IndexedDB, not automatically pushed to GitHub. Reference metadata remains at the existing `home-interior.inspiration.v1` localStorage key. Keep **Export library + photos** ZIP backups before clearing browser data or changing devices. The ZIP includes image bytes and reference metadata. **Import library** accepts that ZIP or the previous JSON format and asks before replacing the browser library. Existing unreadable data is not silently overwritten; recovery metadata and previous images are retained.

**Export metadata JSON** does not contain uploaded image bytes. It is not a portable photo backup. Importing metadata that references missing browser-local images fails explicitly rather than silently losing those images. The ZIP limit is 50 MiB; metadata retains the 2 MB limit.

Project-owned images live under `react-configurator/public/inspiration-media/`; their relative URLs work with the configured Vite base path. After updating the app, **Add project references** explicitly merges new project links and photos. Existing browser notes, decisions, photo captions and cover order win. Removed references/photos are not automatically restored on load. This feature does not change room geometry, render settings or kitchen project files.

## Save browser photos into the project folder (local dev server only)

Uploaded and pasted photos live in the browser, so nobody reading the repository can see them. When the app runs from `npm run dev` on this machine (or a private Codespace), the Inspiration screen shows **Save photos to project folder**. It copies every browser-only photo to `react-configurator/public/inspiration-media/<photo-id>.<ext>` and upserts the affected references into `inspiration/library.json` by reference id (existing references are never removed; the photo ids are kept, so **Add project references** will not duplicate them). Commit those files to keep them.

The endpoint (`scripts/inspiration-sync-plugin.mjs`, `/__inspiration_sync`) exists only under the Vite dev server, accepts same-origin local requests only, sniffs JPG/PNG/WebP bytes, caps each image at 2 MiB and takes file names only from validated photo ids. The production build and GitHub Pages do not have it, so the button is hidden there. Tested with a real browser against a temporary folder; `tests/inspiration-sync.test.mjs` covers the pure checks.

## Existing Pinterest references: capture is NOT completed

On 2026-09-29, all seven URLs in `inspiration/library.json` were inaccessible through the editing environment's web access tools. **Zero original photos or video frames were imported.** The seven reference entries, IDs, room assignments, URLs and notes remain unchanged. No generated pictures, unrelated pins or synthetic test fixtures have been placed in the inspiration library.

`inspiration/capture-status.json` records that access attempt; it is not the output of a successful capture-script run. The screenshot-upload feature works independently of Pinterest access.

## Retry original-media capture locally

From the repository root, in an environment with Pillow installed and `ffmpeg` / `ffprobe` available on PATH:

```powershell
python scripts/capture_inspiration.py
```

This script reads the existing library, attempts public access to each exact pin, and archives available original images/posters plus up to three still frames from an accessible MP4. It records source URLs, timestamps and explicit failures in `inspiration/capture-report.json`. It only accepts Pinterest/Pinimg HTTPS sources and does not bypass sign-in, fetch related recommendations or generate replacement pictures. Pinterest markup changes or inaccessible/private pins may still prevent capture. Live capture and ffmpeg execution were not verified during this change.

Review every captured image against its original pin before committing `inspiration/library.json`, the report and the corresponding `public/inspiration-media` files. Source attribution does not transfer the original creator's rights. The script does not push or merge anything and no background capture workflow is installed.

## Data compatibility

Inspiration schemaVersion remains 1. The optional `photos` array is additive, so old URL-only libraries remain valid. Each photo has `id`, `src`, `caption`, `kind` (`image` or `video-frame`) and optional `sourceUrl`, `sourceMediaUrl`, `capturedAt`, `timeSeconds`. Image sources are restricted to safe `asset:` identifiers or filenames in `/inspiration-media/`; arbitrary remote image URLs, SVG/data URLs and traversal paths are rejected. ZIP import allocates new asset IDs instead of overwriting existing photo blobs.

## Validation recorded for this change

- `node --test tests/inspiration-photos.test.mjs`: **6/6 passed** against copies of the committed schema/room sources. Covers legacy shape, unsafe sources, bounds, additive merge, deduplication and non-mutation.
- JSX syntax/transpilation of `InspirationLibrary.jsx` and `InspirationPhotos.jsx`: **passed**. Syntax checking of `inspirationMedia.mjs`: **passed**. This is not a production Vite build or type-check.
- Isolated Chromium gallery harness with React 18.2 and mocked photo reads: **9 checks passed**, no page errors. Thumbnails, full-size viewer, arrow/Escape keys, cover selection, caption editing, multiple-file callback, mobile overflow and removal were checked. Desktop, mobile and lightbox screenshots were visually reviewed. Images were clearly labeled synthetic test fixtures, not source inspiration content.
- Isolated Chromium media-function harness: **11 checks passed**, no page errors. Real image decoding/compression, 1600-pixel resizing, ZIP image-byte export/import, fresh IDs, metadata preservation and invalid/missing/oversized inputs were exercised. Repository-image HTTP responses and UUID generation were mocked; IndexedDB was not exercised.
- Full `npm run check`, the complete application browser suite, real-origin IndexedDB save/reload/quota behavior and live Pinterest/video capture: **NOT VERIFIED in this environment**. No passing GitHub Actions run was observed. Do not interpret the isolated checks as a full integration pass.

The new metadata tests are included in `npm test`; `npm run test:inspiration` runs the existing reference tests and new photo tests together. Complete the full build and browser persistence checks in the normal local development environment.
