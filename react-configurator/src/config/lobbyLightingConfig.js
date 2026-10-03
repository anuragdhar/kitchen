// Lobby / Dining lighting (owner 2026-10-04: track lights here too, for flexibility; no false ceiling).
// Millimetres in the room frame: x from the west wall, z from the north wall. Same track vocabulary as the Drawing Room
// (drawingLightingConfig.js): `axis` 'x' runs east-west at z = atMm, 'z' runs north-south at x = atMm; a 'spot' points at
// the wall named in `aim`, a 'diffuse' head gives soft general light, a 'reading' head is a stronger spot pointing straight
// down at a work spot. Both runs hug a wall, so the middle of the ceiling stays free for a ceiling fan: whether the lobby
// has one, and where, is NOT known (work-plan/OPEN_ITEMS.md). Watts and lumens are typical catalogue figures.
export const LOBBY_LIGHTING = {
  // The linear pendant over the dining table stays (RoomTaskLighting.js draws it at the table centre).
  pendant: {label: 'Dining pendant', lengthMm: 900, bottomMm: 1657},
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, driverWatts: 100, sectionMm: 22, runs: [
    // South wall, east of the toilet door (x 1000-1900): washes the wall and lights the walkway to the east opening.
    {id: 'L1', label: 'Lobby track 1: south wall', axis: 'x', atMm: 2740, fromMm: 2100, toMm: 4700, heads: [
      {kind: 'spot', atMm: 2500, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'spot', atMm: 3100, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'diffuse', atMm: 3700, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'diffuse', atMm: 4300, watts: 15, lumens: 1400, lengthMm: 300}]},
    // In front of the east-wall ironing storage (z 650-2100): a down spot over the pulled-out ironing board, and a spot on the doors.
    {id: 'L2', label: 'Lobby track 2: in front of the ironing storage', axis: 'z', atMm: 4050, fromMm: 500, toMm: 2000, heads: [
      {kind: 'spot', atMm: 800, watts: 7, lumens: 600, aim: 'east'},
      {kind: 'reading', atMm: 1375, watts: 12, lumens: 1000}]},
  ]},
}

// Sliders shown on the Lobby page (kind, label), for DrawingLightDimmer.
export const LOBBY_DIMMER_KINDS = [
  ['chandelier', 'Dining pendant'], ['spot', 'Track spots (on the walls)'], ['diffuse', 'Track diffused (general light)'], ['reading', 'Ironing spot'],
]
