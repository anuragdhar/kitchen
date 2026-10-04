// Lobby / Dining lighting (owner 2026-10-04: track lights here too, for flexibility; no false ceiling).
// Millimetres in the room frame: x from the west wall, z from the north wall. Same track vocabulary as the Drawing Room
// (drawingLightingConfig.js): `axis` 'x' runs east-west at z = atMm, 'z' runs north-south at x = atMm; a 'spot' points at
// the wall named in `aim`, a 'diffuse' head gives soft general light, a 'reading' head is a stronger spot pointing straight
// down at a work spot. Both runs hug a wall, so the middle of the ceiling stays free for a ceiling fan.
// Circuits (owner 2026-10-04): one run = one circuit with its own 48 V driver (driverWatts, loaded to 80% at most) and its
// own wall dimmer; the heads on a run dim together. The former single 100 W driver becomes one 60 W driver per run.
// Watts and lumens are typical catalogue figures.
export const LOBBY_LIGHTING = {
  // Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04.md): what is on the ceiling today, at the centres of the plaster
  // rosettes. x here is from the Drawing Room face of the dividing beam, which is about 40 mm west of this room's x = 0.
  // The scan flattened whatever hangs there, so 'probably a fan' is read from the photo texture, not confirmed
  // (work-plan/OPEN_ITEMS.md, C22). Recorded only: nothing is drawn from these and the track checks do not use them.
  existingCeilingPoints: [
    {xMm: 2645, zMm: 1600, label: 'Centre medallion, about 810 across, dark hub and rod: probably a ceiling fan'},
    {xMm: 3810, zMm: 1615, label: 'Small rosette with a domed ceiling light'},
  ],
  // The linear pendant over the dining table stays (RoomTaskLighting.js draws it at the table centre); it is its own circuit.
  pendant: {label: 'Dining pendant', lengthMm: 900, bottomMm: 1657},
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // South wall, east of the toilet door (x 1000-1900): washes the wall and lights the walkway to the east opening.
    {id: 'L1', label: 'Lobby track 1: south wall', axis: 'x', atMm: 2740, fromMm: 2100, toMm: 4700, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 2500, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'spot', atMm: 3100, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'diffuse', atMm: 3700, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'diffuse', atMm: 4300, watts: 15, lumens: 1400, lengthMm: 300}]},
    // In front of the east-wall ironing storage (z 650-2100): a down spot over the pulled-out ironing board, and a spot on the doors.
    {id: 'L2', label: 'Lobby track 2: in front of the ironing storage', axis: 'z', atMm: 4050, fromMm: 500, toMm: 2000, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 800, watts: 7, lumens: 600, aim: 'east'},
      {kind: 'reading', atMm: 1375, watts: 12, lumens: 1000}]},
  ]},
}

// Sliders shown on the Lobby page, one per circuit: [circuit id, label]. 'chandelier' is the dining pendant; the others are
// the run ids above (DrawingLightDimmer.jsx).
export const LOBBY_DIMMER_CIRCUITS = [
  ['chandelier', 'Dining pendant'], ['L1', 'Lobby track 1 (south wall)'], ['L2', 'Lobby track 2 (ironing storage)'],
]
