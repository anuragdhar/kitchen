// EXISTING electrical points found by the phone scan of 2026-10-04 (docs/SITE_SCAN_2026-10-04.md): what is on the walls and
// ceilings TODAY, as a record. This is not the proposed plan (drawingElectricalConfig.js is); the app draws these as grey
// plates with a blue outline so the owner can see where the switchboards and sockets are, and reports where a planned door,
// panel or piece of furniture would land on one (src/domain/existingElectrical.mjs).
//
// Keyed by room key (EMPTY_ROOM_SHELLS). To add a room: add a key with `points` and, if the scan was measured from
// somewhere other than the room's own west and north walls, a `measured` note with the offset; nothing else changes.
//
// Units: millimetres. Frame as in drawingElectricalConfig.js: x from the room's west wall, z from the north wall, heights
// above the floor. Every point has:
//   id, name, kind ('switchboard' | 'distribution board' | 'socket' | 'wall light' | 'tube light' | 'chime' | 'ceiling point'),
//   wall ('north' | 'south' | 'east' | 'west' | 'ceiling'),
//   wall points:    fromMm/toMm = the plate's extent ALONG the wall (x on north/south walls, z on east/west walls), AS MEASURED;
//                   bottomMm/topMm = its height range above the floor.
//   ceiling points: xMm/zMm = the centre, AS MEASURED; diameterMm = the rosette or medallion size.
//   source: where the figure comes from. Scan accuracy: about +/- 20 mm for these small items (the scan doc).
//   assumed (optional): which figures were not readable and are a guess, so they are not mistaken for measurements.
//   label (optional): a short name for the 3D tag when `name` is too long to read on the wall.
//   disposition (2026-10-05): what the proposed electrical plan does with the point, the fix an electrician would make:
//     action 'keep'      it stays where it is; `accept: true` = it may stay although something planned covers it (say why in note)
//            'relocate'  its job moves to the planned point `to` (an id in drawingElectricalConfig.js / roomElectricalConfig.js);
//                        `oldBox` says what becomes of the old box (emptied and plastered, or a junction box behind an access cover)
//            'blank'     the fitting comes off and the box gets a blank plate (wires made safe or withdrawn)
//     to (optional): the planned point that takes over the job, or that reuses this box;  feeds (optional): planned points
//     wired from this box;  note: one sentence for the owner and the electrician.
//   A conflict found by existingElectrical.mjs is shown as RESOLVED when the point's disposition deals with it. A point
//   without a disposition is an open question. The dispositions are written for the default layouts (Drawing Room layout C).
//
// Lobby caution (the scan doc): its "from the west" was measured from the DRAWING ROOM face of the beam between the two rooms,
// about 40 mm west of the Lobby's x = 0. The figures below are stored AS MEASURED; `measured.xOffsetMm` is subtracted ONCE,
// in existingElectrical.mjs (toRoomFrame), and nowhere else. z (from the north wall) has no offset.
const SOURCE = 'phone scan 2026-10-04'

export const EXISTING_ELECTRICAL = {
  drawing: {
    measured: {x: 'from the west wall', z: 'from the north wall', xOffsetMm: 0},
    points: [
      {id: 'X-D1', name: 'Switchboard', kind: 'switchboard', wall: 'north', fromMm: 1710, toMm: 1905, bottomMm: 1235, topMm: 1495, source: SOURCE,
        note: 'plate 195 x 260; its east edge is 230 mm from the entry door jamb',
        disposition: {action: 'relocate', to: 'E1', oldBox: 'emptied and plastered over before the panelling goes up; only if a cable cannot be re-pulled does it stay as a junction box, behind a screwed access cover cut in the panelling at this spot (behind the TV, reached by lifting the TV off its bracket)',
          note: 'the switches move to the new main switchboard E1 on the east wall (z 1250, 1200 high), 350 mm from the distribution board X-D2, so the circuits are re-run from the board to E1 and nothing live is left buried behind the panelling and the TV'}},
      {id: 'X-D2', name: 'Distribution board (MCBs)', label: 'MCB board', kind: 'distribution board', wall: 'east', fromMm: 555, toMm: 905, bottomMm: 1500, topMm: 1685, source: SOURCE,
        note: 'plate 350 x 185',
        disposition: {action: 'keep', accept: true, note: 'the MCB board stays: it is reached with the entry door closed, which is acceptable for breakers that are rarely touched; keep the wall in front of it clear'}},
      {id: 'X-D3', name: 'Door chime', kind: 'chime', wall: 'east', fromMm: 270, toMm: 535, bottomMm: 1520, topMm: 1670, source: SOURCE,
        disposition: {action: 'keep', accept: true, note: 'the chime stays: it only has to be heard, and the new bell push at the outer door (EN-2, Main entry) is wired to it'}},
      {id: 'X-D4', name: 'Socket plate', kind: 'socket', wall: 'west', fromMm: 970, toMm: 1165, bottomMm: 255, topMm: 370, source: SOURCE,
        disposition: {action: 'keep', note: 'clear in layout C: a spare low socket beside the hidden west cabinet door'}},
      {id: 'X-D5', name: 'Three socket plates', kind: 'socket', wall: 'west', fromMm: 4050, toMm: 4500, bottomMm: 260, topMm: 375, source: SOURCE,
        disposition: {action: 'keep', accept: true, feeds: ['W4', 'W6'],
          note: 'the boxes stay as the feed, hidden behind the west sofa on purpose: the two plates behind the sofa get blank plates (or one keeps a permanently plugged lamp), the third plate, in the gap south of the sofa, stays in use, and the reachable outlets are the new W4 (above the sofa back, 1000 high) and W6 (above the corner table, 700 high), chased straight up from these boxes'}},
      // The scan gives only the centre ("about 1150 from the north"); the 150 mm width is a guess for drawing it.
      {id: 'X-D6', name: 'Wall light', kind: 'wall light', wall: 'west', fromMm: 1075, toMm: 1225, bottomMm: 2130, topMm: 2350, source: SOURCE,
        assumed: 'width 150 about the measured centre at 1150',
        disposition: {action: 'blank', note: 'the old small wall light comes off (owner 2026-10-04: the track lights replace it); blank plate, or plastered over when the wall is painted'}},
      // The three ceiling points (rosettes at 1650/1290 and 1580/4075, the medallion at 1600/2705) are already the fan and
      // chandelier positions in drawingLightingConfig.js and C1 in drawingElectricalConfig.js, so they are not repeated here.
    ],
  },
  lobby: {
    measured: {x: 'from the Drawing Room face of the dividing beam, about 40 mm west of this room\'s x = 0', z: 'from the north wall', xOffsetMm: 40},
    points: [
      {id: 'X-L1', name: 'Switchboard', kind: 'switchboard', wall: 'north', fromMm: 415, toMm: 615, bottomMm: 1215, topMm: 1495, source: SOURCE,
        note: 'on the stretch where the Bedroom 1 door is planned to move (owner 2026-10-04)',
        disposition: {action: 'relocate', to: 'L-N1', oldBox: 'removed with the wall when the door opening is cut; its riser is cut back to a junction box above the new door head (L-N2, x 475, 2300 high, screwed blank plate, reachable from a step stool)',
          note: 'the switches move to the new switchboard L-N1 on the latch side of the Bedroom 1 door (x 1200, 1200 high), wired across the lintel from the junction box L-N2; this must be done before the door opening is cut'}},
      {id: 'X-L2', name: 'Wall light', kind: 'wall light', wall: 'north', fromMm: 1525, toMm: 1675, bottomMm: 2100, topMm: 2400, source: SOURCE,
        assumed: 'width 150 about the measured centre at about 1600',
        disposition: {action: 'keep', note: 'nothing planned lands on it; it stays as a wall light switched at L-N1 until the owner decides whether the track lights replace it'}},
      {id: 'X-L3', name: 'Tube light', kind: 'tube light', wall: 'south', fromMm: 2200, toMm: 3350, bottomMm: 2230, topMm: 2290, source: SOURCE,
        assumed: 'fitting 60 mm tall about the measured centre at about 2260',
        disposition: {action: 'blank', to: 'L-S2', note: 'the tube light comes off; its point is reused as the 230 V feed for the driver of lobby track 1 (L-S2)'}},
      {id: 'X-L4', name: 'Centre ceiling point (probably a fan)', label: 'Ceiling point, fan?', kind: 'ceiling point', wall: 'ceiling', xMm: 2645, zMm: 1600, diameterMm: 810, source: SOURCE,
        note: 'plaster medallion about 810 across with a dark hub and rod; the scan flattened whatever hangs there',
        disposition: {action: 'keep', to: 'L-C2', note: 'stays as the ceiling fan point (L-C2), regulator at L-N1'}},
      {id: 'X-L5', name: 'Ceiling light (small rosette)', label: 'Ceiling light', kind: 'ceiling point', wall: 'ceiling', xMm: 3810, zMm: 1615, diameterMm: 250, source: SOURCE,
        assumed: 'rosette size 250; the scan gives only its centre',
        disposition: {action: 'blank', to: 'L-C3', note: 'the small ceiling light comes off; its point is reused as the 230 V feed for the driver of lobby track 2 (L-C3), 280 mm away'}},
    ],
  },
  // Bedroom 3 (docs/SITE_SCAN_2026-10-04_BEDROOM3.md), measured from the room's own west and north walls. The ceiling fan
  // point (2030 / 1820) is BEDROOM3_CEILING_FAN in bedroom3LightingConfig.js and the AC indoor unit (east wall, 1348-2278
  // from the north, 2280-2600 high) is roomShellConfig.js bedroom3.existing.acUnit, so neither is repeated here. No socket
  // plates could be seen: the bed head, a wall organiser, a daybed and the wardrobe cover the lower walls.
  bedroom3: {
    measured: {x: 'from the west wall', z: 'from the north wall', xOffsetMm: 0},
    points: [
      {id: 'X-B1', name: 'Switchboard', kind: 'switchboard', wall: 'north', fromMm: 1385, toMm: 1550, bottomMm: 1235, topMm: 1365, source: SOURCE,
        note: 'plate about 165 x 130, 485 mm east of the entry door jamb; white area in the scan reaches 1365-1565 x 1230-1490, possibly a second plate above',
        disposition: {action: 'keep', to: 'B3-N1', note: 'stays as the room switchboard (B3-N1): it is already on the latch side of the entry door; new modular plate with the track dimmers and the fan regulator'}},
      {id: 'X-B2', name: 'Wall light (dark fitting with a flex)', label: 'Wall light', kind: 'wall light', wall: 'west', fromMm: 1740, toMm: 2020, bottomMm: 2110, topMm: 2350, source: SOURCE,
        disposition: {action: 'keep', to: 'B3-W2', note: 'stays as a picture light above the artwork on the west wall (B3-W2), switched at B3-N1'}},
    ],
  },
}
