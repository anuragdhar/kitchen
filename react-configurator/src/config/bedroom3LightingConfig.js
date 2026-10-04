// Bedroom 3 track lighting (owner 2026-10-04). Millimetres in the room frame of roomShellConfig.js bedroom3: x from the
// west wall, z from the north wall; no false ceiling, 48 V magnetic surface track on the slab. Vocabulary as in
// drawingLightingConfig.js; one run = one circuit with its own driver and wall dimmer.
//
// How the room is used (roomShellConfig.js, 2026-10-04): the six-foot bed has its head at the east wall between the two
// bedside cabinets (x 2134-3963, z 948-2778; sleepers about 420 mm either side of z 1863); the east cabinetry carries a
// bridge run at 2200-2650 along the whole east wall (x 3506-3963), so no track may go there; the mirrored dressing cabinet
// is at the north-east (z 150-900, mirror facing west); the wardrobe is the cabinet through the south wall (x 365-1905, phone scan); the
// low chest with artwork is on the west wall; the entry door is at the north-west (x 0-900) and the toilet door at the
// north-east (x 2525-3305, phone scan), both in the north wall; wall art hangs on the north wall at x 2300.
//
// THE FAN POINT: one field. Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04_BEDROOM3.md): the ceiling medallion and the
// fan hub are 2030 from the west wall and 1820 from the north wall (was assumed at the room centre, 1981 / 1863). The
// checks still pass with it anywhere within toleranceMm of the room centre (tests/bedroom3-lighting.test.mjs).
// The same scan moved the toilet door to x 2525-3305 and found the wardrobe at x 365-1905 (roomShellConfig.js).
export const BEDROOM3_CEILING_FAN = {xMm: 2030, zMm: 1820, label: 'Ceiling fan', status: 'position from the phone scan of 2026-10-04; blade size and drop still assumed'}

export const BEDROOM3_LIGHTING = {
  ceilingFans: {status: 'position from the phone scan of 2026-10-04 (medallion and hub); blade diameter and drop still assumed', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 0, toleranceMm: 400,
    fans: [BEDROOM3_CEILING_FAN]},
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // North side, 650 mm off the north wall, from the entry door to just short of the east bridge. A diffused head for the
    // soft layer, a spot on the north-wall art, a reading head aimed at the north sleeper's chest from the foot side (about
    // 24 degrees of tilt: the beam reaches the book, the lamp stays out of the eyes), and a down light over the dressing spot
    // in front of the mirror cabinet.
    {id: 'B1', label: 'Bedroom 3 track 1: north side, dressing and north reading', axis: 'x', atMm: 650, fromMm: 300, toMm: 3350, driverWatts: 60, heads: [
      {kind: 'diffuse', atMm: 1300, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'spot', atMm: 2300, watts: 7, lumens: 600, aim: 'north'},
      {kind: 'reading', atMm: 2950, watts: 12, lumens: 1000, targetMm: {xMm: 3200, zMm: 1450}},
      {kind: 'reading', atMm: 3300, watts: 12, lumens: 1000}]},
    // South side, 626 mm off the south wall: two spots graze the wardrobe fronts (x 365-1905; the spots stand 285 mm inside
    // each end, moved from 450 and 1350 when the scan placed the wardrobe), a
    // diffused head for the soft layer, and the south sleeper's reading head, aimed the same way from the foot side.
    {id: 'B2', label: 'Bedroom 3 track 2: south side, wardrobe and south reading', axis: 'x', atMm: 3100, fromMm: 300, toMm: 3350, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 650, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'diffuse', atMm: 1135, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'spot', atMm: 1620, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'reading', atMm: 2950, watts: 12, lumens: 1000, targetMm: {xMm: 3200, zMm: 2280}}]},
  ]},
}

// Sliders on the Bedroom 3 page, one per circuit: [run id, label] (DrawingLightDimmer.jsx).
export const BEDROOM3_DIMMER_CIRCUITS = [['B1', 'Track 1 (north: dressing, art, north reading)'], ['B2', 'Track 2 (south: wardrobe, south reading)']]

/** What reaches the ceiling: the east cabinet bridge (top at 2650 mm); a run must keep clear of it. */
export function bedroom3Obstacles(room) {
  const c = room.furniture.eastCabinet, b = c.bridge
  return [{x1: room.widthMm - c.depthMm, x2: room.widthMm, z1: b.fromNorthMm, z2: b.fromNorthMm + b.widthMm, label: 'east cabinet bridge'}]
}

/** Floor rectangles the reading heads may shine on: the bed, and the dressing spot in front of the mirror cabinet. */
export function bedroom3DownTargets(room) {
  const bed = room.furniture.bed, c = room.furniture.eastCabinet, n = c.north
  return [
    {x1: room.widthMm - bed.lengthMm, x2: room.widthMm, z1: bed.centerFromNorthMm - bed.widthMm / 2, z2: bed.centerFromNorthMm + bed.widthMm / 2, label: 'bed'},
    {x1: room.widthMm - c.depthMm - 650, x2: room.widthMm - c.depthMm, z1: n.fromNorthMm, z2: n.fromNorthMm + n.widthMm, label: 'dressing spot in front of the mirror'},
  ]
}
