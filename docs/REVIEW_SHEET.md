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

## If the AI says it cannot see your room (2026-09-30)

A reviewer once answered "the attached image is still Drawing Room Layout B" for a Lobby brief: the text brief had been
pasted for the Lobby but an older picture was still attached. The app now:

- names the expected picture in the first lines of the text brief (`The attached image should have the title "..." in its
  top-left corner`), so a mismatch is obvious to the AI and to you;
- says which sheet was copied ("Image copied: "Lobby / Dining"") and clears the sheet when you switch room or layout, so
  an old sheet cannot be copied for the wrong room;
- lists every plan box with its exact x and z range in the text, and draws boxes for the Lobby and both bedrooms too.

Check the title in the top-left of the picture before you send it. When in doubt, download the image and attach the file
instead of pasting, and start a fresh chat for each room.

## Limits

- Only the room workspace is covered; Whole home 3D has no sheet yet.
- Labelled plan boxes exist for the Drawing Room (all layouts), the Lobby and Bedrooms 1 and 3. Any other room gets overall
  dimensions, walls and openings only, with its furniture listed in text from `roomShellConfig.js`. Items outside the room
  outline (the Pooja alcove, recess wardrobes) are described in text, not drawn.
- Reference photos are not embedded (size and other people's rights); their links are in the text brief.
- Views come from the simplified 3D model in the browser's software or GPU renderer, not from the Blender renders.
- Pixel-level output was reviewed by eye for the Drawing Room (both layouts) and Bedroom 1; there is no automated
  image comparison.
