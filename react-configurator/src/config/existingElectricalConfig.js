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
        note: 'plate 195 x 260; its east edge is 230 mm from the entry door jamb'},
      {id: 'X-D2', name: 'Distribution board (MCBs)', label: 'MCB board', kind: 'distribution board', wall: 'east', fromMm: 555, toMm: 905, bottomMm: 1500, topMm: 1685, source: SOURCE,
        note: 'plate 350 x 185'},
      {id: 'X-D3', name: 'Door chime', kind: 'chime', wall: 'east', fromMm: 270, toMm: 535, bottomMm: 1520, topMm: 1670, source: SOURCE},
      {id: 'X-D4', name: 'Socket plate', kind: 'socket', wall: 'west', fromMm: 970, toMm: 1165, bottomMm: 255, topMm: 370, source: SOURCE},
      {id: 'X-D5', name: 'Three socket plates', kind: 'socket', wall: 'west', fromMm: 4050, toMm: 4500, bottomMm: 260, topMm: 375, source: SOURCE},
      // The scan gives only the centre ("about 1150 from the north"); the 150 mm width is a guess for drawing it.
      {id: 'X-D6', name: 'Wall light', kind: 'wall light', wall: 'west', fromMm: 1075, toMm: 1225, bottomMm: 2130, topMm: 2350, source: SOURCE,
        assumed: 'width 150 about the measured centre at 1150'},
      // The three ceiling points (rosettes at 1650/1290 and 1580/4075, the medallion at 1600/2705) are already the fan and
      // chandelier positions in drawingLightingConfig.js and C1 in drawingElectricalConfig.js, so they are not repeated here.
    ],
  },
  lobby: {
    measured: {x: 'from the Drawing Room face of the dividing beam, about 40 mm west of this room\'s x = 0', z: 'from the north wall', xOffsetMm: 40},
    points: [
      {id: 'X-L1', name: 'Switchboard', kind: 'switchboard', wall: 'north', fromMm: 415, toMm: 615, bottomMm: 1215, topMm: 1495, source: SOURCE,
        note: 'on the stretch where the Bedroom 1 door is planned to move (owner 2026-10-04)'},
      {id: 'X-L2', name: 'Wall light', kind: 'wall light', wall: 'north', fromMm: 1525, toMm: 1675, bottomMm: 2100, topMm: 2400, source: SOURCE,
        assumed: 'width 150 about the measured centre at about 1600'},
      {id: 'X-L3', name: 'Tube light', kind: 'tube light', wall: 'south', fromMm: 2200, toMm: 3350, bottomMm: 2230, topMm: 2290, source: SOURCE,
        assumed: 'fitting 60 mm tall about the measured centre at about 2260'},
      {id: 'X-L4', name: 'Centre ceiling point (probably a fan)', label: 'Ceiling point, fan?', kind: 'ceiling point', wall: 'ceiling', xMm: 2645, zMm: 1600, diameterMm: 810, source: SOURCE,
        note: 'plaster medallion about 810 across with a dark hub and rod; the scan flattened whatever hangs there'},
      {id: 'X-L5', name: 'Ceiling light (small rosette)', label: 'Ceiling light', kind: 'ceiling point', wall: 'ceiling', xMm: 3810, zMm: 1615, diameterMm: 250, source: SOURCE,
        assumed: 'rosette size 250; the scan gives only its centre'},
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
        note: 'plate about 165 x 130, 485 mm east of the entry door jamb; white area in the scan reaches 1365-1565 x 1230-1490, possibly a second plate above'},
      {id: 'X-B2', name: 'Wall light (dark fitting with a flex)', label: 'Wall light', kind: 'wall light', wall: 'west', fromMm: 1740, toMm: 2020, bottomMm: 2110, topMm: 2350, source: SOURCE},
    ],
  },
}
