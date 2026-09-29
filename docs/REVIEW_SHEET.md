# Review sheet: share a room with an online AI

**Where:** Drawing Room (or any room) -> Editable workspace -> **Review sheet for AI**.
It builds, in the browser, one 2400 x 1600 PNG plus a matching text brief. Nothing is uploaded anywhere;
you choose what to paste into which chat. Buttons: Download image, Copy image, Copy text brief, Download text brief.

## What is on the sheet

| Area | Content |
| --- | --- |
| Top plan (near-orthographic) | Overall width and length, wall names (the app draws **south at the top**), doors (orange), windows (blue), open sides (dashed green), furniture and fixtures as labelled boxes with their sizes |
| Perspective overview | The whole room with the labelled devices |
| Four wall views | NORTH, EAST, SOUTH and WEST walls, each shot from the room centre at eye height |
| Right panel | Room size and coordinate frame, openings, this layout's items with positions, and what you want from the AI |
| Bottom panel | Measured seating distances and angles, clearances, known problems, reference titles, limits |

The text brief (`src/domain/roomReview.mjs`) repeats every number exactly and adds the reference links with tags and
notes. Paste it together with the image: small print inside a picture is easy for a vision model to misread, and many
models shrink a large image to roughly 1500 px on the long edge before reading it.

## Why these facts

An outside reviewer cannot see what you know, so the sheet states it: which wall is north and how x/z run, what the
openings are and which way the entry door swings, the size and position of every item, distances that matter
(sofa to TV, walking lane, door clearance), the honest limits (concept model, not a survey; walls drawn 85 mm thick),
and instructions for a new render: keep proportions, openings and furniture sizes; change only materials, colour,
lighting and styling.

## Limits

- Only the room workspace is covered; Whole home 3D has no sheet yet.
- The top plan boxes are drawn for the Drawing Room's two layouts. Other rooms get overall dimensions, walls and openings
  only; their furniture is listed in text from `roomShellConfig.js`.
- Reference photos are not embedded (size and other people's rights); their links are in the text brief.
- Views come from the simplified 3D model in the browser's software or GPU renderer, not from the Blender renders.
- Pixel-level output was reviewed by eye for the Drawing Room (both layouts) and Bedroom 1; there is no automated
  image comparison.
