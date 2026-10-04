# Existing switchboards and sockets shown in the app (2026-10-04)

Owner question: "Will the location of switchboards be visible in the map?" Now it is.

## Where to click

- **Drawing Room** page or **Lobby / Dining** page: the button **Show existing electrical points** at the right end of the
  toolbar. It works in the 3D view, the Top view and the wall views (they are one scene). A list appears under the picture
  with every point and, in red, every conflict with the planned design.
- **Whole home 3D**: a button of the same name shows the same plates in both rooms (no list there; the list is on each
  room's own page).
- **Review sheet for AI** (both rooms): the text brief now has a section "Existing electrical points (site scan)" with the
  points and the conflicts, so an outside reviewer sees them too.

How they look: grey plates with a blue outline at the true size and height of each plate, with a square white tag
"Existing: Switchboard 195x260". Ceiling points are blue rings the size of the plaster rosette. The proposed plan's points
("Show electrical points") stay as coloured pins with rounded tags, so the two cannot be confused.

## What was added

- `react-configurator/src/config/existingElectricalConfig.js`: the points from the phone scan of 2026-10-04
  (`docs/SITE_SCAN_2026-10-04.md`), keyed by room (`drawing`, `lobby`). Every point has an id, a name, a kind, a wall, its
  extent along the wall and its height range (or x/z and a diameter for a ceiling point) and `source: 'phone scan 2026-10-04'`.
- `src/domain/existingElectrical.mjs`: positions for drawing, the conflict checks, and the lines for the review brief. No
  React, Three.js or DOM.
- `src/rooms/shared/ExistingElectricalPoints.js`: the plates, rings and tags (Three.js).
- `src/home/ExistingElectricalPanel.jsx`: the list under the toolbar.
- `tests/existing-electrical.test.mjs` (registered in `npm test`): the config is well formed and inside the rooms, the Lobby
  offset is applied once, plates land on the right wall, and every conflict below is found (plus synthetic ones in a
  window, an open side and the hidden cabinet door, and a clear point that is NOT reported).
- Thin call sites: `EmptyRoomGallery.jsx` (one state, one scene line, one toggle, one effect, one panel line),
  `WholeHome3D.jsx` (same, two rooms), `roomReview.mjs` (one import, two lines), `package.json` (one test path).
- `docs/DRAWING_ROOM_ELECTRICAL.md`: a section "Existing points".

No room geometry, furniture or proposed point was changed.

## Conflicts found

Drawing Room, layout C (the default):

1. The **switchboard** (north wall, x 1710-1905, 1235-1495 high) would be covered by the planned fluted wall panelling and
   sits behind the TV (both the 55- and the 65-inch). Move it (the proposed plan already puts the main switchboard E1 on the
   east wall), or cut the panelling and the TV bracket around it and keep it reachable.
2. The **distribution board** (east wall, z 555-905) is partly, and the **door chime** (z 270-535) fully, behind the entry door
   leaf when the door stands open (the leaf covers the first 850 mm of the east wall). Fine for MCBs that are rarely touched
   and harmless for a chime; keep a clear way to the board.
3. The **three socket plates** (west wall, z 4050-4500, 260-375 high) are partly behind the west sofa (z 2095-4345): plugs
   there cannot be reached without moving the sofa. Use them for a lamp or a permanently plugged device, or move them.

The list follows the layout: in layout B the west sofa covers the other socket plate (z 970-1165) instead and the east-wall
TV covers the distribution board; in layout A the TV cabinet covers the switchboard.

Lobby / Dining:

4. The **switchboard** (north wall, x 375-575, 1215-1495 high) is inside the planned Bedroom 1 door opening (x 100-1000). It
   has to be moved before the door is cut. (Already known from the scan; now the app says it too.)

## Decisions taken without asking

- The Lobby "from the west" figures were measured from the Drawing Room face of the dividing beam, 40 mm west of the Lobby's
  x = 0. The config stores the figures AS MEASURED plus `measured.xOffsetMm: 40`; the domain module subtracts it in one
  function (`toRoomFrame`). z is not offset. The app, the list and the review brief show the converted figures and say so.
- Widths that the scan did not give were assumed so the plates can be drawn: both wall lights 150 mm wide about the measured
  centre, the Lobby tube light 60 mm tall about its measured centre, the small Lobby rosette 250 mm across. Each is marked
  `assumed` in the config and shown as "(assumed: ...)" in the list.
- The Drawing Room's three ceiling points (rosettes and medallion) are NOT repeated as existing points: they are already the
  fan and chandelier positions in `drawingLightingConfig.js` and C1 in the proposed plan, and drawing a second ring under
  the drawn fans would only add clutter.
- The plates are drawn on top of everything (no depth test), so a plate behind the panelling, the TV or a sofa is still
  seen; that is the point of showing them.
- "Hidden behind" uses the same rules as the proposed-plan checks: a sofa within 250 mm of a wall counts as standing against
  it and hides anything below 950 mm; an entry door hinged within 300 mm of a side wall lays its open leaf along that wall.
- The toggle is shown only on rooms that have data (`hasExistingElectrical(roomKey)`), so Bedroom 1 and 3 get it the moment
  their points are added to the config.

## How to add another room

Add a key to `EXISTING_ELECTRICAL` in `existingElectricalConfig.js`:

```js
bedroom3: {
  measured: {x: 'from the west wall', z: 'from the north wall', xOffsetMm: 0},
  points: [
    {id: 'X-B1', name: 'Switchboard', kind: 'switchboard', wall: 'north', fromMm: 1200, toMm: 1400, bottomMm: 1200, topMm: 1460, source: 'phone scan 2026-10-04'},
    {id: 'X-B2', name: 'Ceiling fan point', kind: 'ceiling point', wall: 'ceiling', xMm: 1980, zMm: 1860, diameterMm: 300, source: 'phone scan 2026-10-04'},
  ],
},
```

The toggle, the list, the review brief and the whole-home button (for rooms it draws) pick it up from the key; the test
checks the new points stay inside the room. Wall-mounted furniture to check against lives in `plannedBlockers()` in
`existingElectrical.mjs` (the Lobby's ironing storage is the example for a non-Drawing room). For the balcony office, which
has its own page (`BalconyOffice3D.jsx`), only the config and the checks apply; its scene would need its own call site.

## Checks run

- `npm test`: 298 tests, 291 pass, 7 fail: exactly the known "Windows: ..." launcher tests, nothing else.
- `npm run build`: passes.
- `node scripts/room-shots.cjs` on port 5185 (GPU, no page errors): Drawing Room (Overview, Top, North wall view) and
  Lobby / Dining (Overview, Top) with the toggle on and off, and Whole home 3D Top with it on. Looked at: the switchboard sits
  inside the east part of the drawn TV, the MCB board and chime beside the entry door on the east wall, the sockets low on the
  west wall (the south three behind the west sofa's arm), the wall light high on the west wall; in the Lobby the switchboard
  at the west end of the north wall where the Bedroom 1 door is drawn, the tube light on the south wall, the two rings on the
  ceiling. With the toggle off nothing is drawn.

## Not verified

- The screenshots are smoke evidence, not approved baselines (docs/TESTING.md).
- Whole home 3D was looked at only in the Top view with the toggle on; its perspective view and the measure tool were not
  exercised with the plates showing.
- The review-sheet IMAGE was not regenerated; only the text brief was checked (tests).
- The assumed widths above, and everything the scan itself could not see (behind curtains and furniture, wall thickness).
- `npm run test:browser`, `test:persistence`, `visual:qa`: not run (not affected; no kitchen or persistence change).
