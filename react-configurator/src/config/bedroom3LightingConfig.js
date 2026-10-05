// Bedroom 3 track lighting (owner 2026-10-04). Millimetres in the room frame of roomShellConfig.js bedroom3: x from the
// west wall, z from the north wall; no false ceiling, 48 V magnetic surface track on the slab. Vocabulary as in
// drawingLightingConfig.js; one run = one circuit with its own driver and wall dimmer.
//
// How the room is used (roomShellConfig.js, 2026-10-04): the six-foot bed has its head at the east wall between the two
// east-wall cabinets (x 2134-3963, z 948-2778; sleepers about 420 mm either side of z 1863); the east cabinetry carries a
// bridge run at 2200-2650 (x 3506-3963, z 900-3576) and a full-height storage cabinet at the north-east (z 150-900, to the
// ceiling), so no track may go there; the mirrored dressing cabinet is at the SOUTH-east (z 2826-3576, mirror facing west;
// moved from the north-east by the owner 2026-10-05); the wardrobe is the cabinet through the south wall (x 365-1905, phone scan); the
// low chest with artwork is on the west wall; the entry door is at the north-west (x 0-900) and the toilet door at the
// north-east (x 2525-3305, phone scan), both in the north wall; wall art hangs on the north wall at x 2300.
//
// THE FAN POINT: one field. Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04_BEDROOM3.md): the ceiling medallion and the
// fan hub are 2030 from the west wall and 1820 from the north wall (was assumed at the room centre, 1981 / 1863). The
// checks still pass with it anywhere within toleranceMm of that point (tests/bedroom3-lighting.test.mjs).
// The same scan moved the toilet door to x 2525-3305 and found the wardrobe at x 365-1905 (roomShellConfig.js).
export const BEDROOM3_CEILING_FAN = {xMm: 2030, zMm: 1820, label: 'Ceiling fan', status: 'position from the phone scan of 2026-10-04; blade size and drop still assumed'}

// EXISTING CEILING MOULDINGS (phone scan 2026-10-04, docs/SITE_SCAN_2026-10-04_BEDROOM3.md; measured 2026-10-05; vocabulary
// in drawingLightingConfig.js). Distances are from each wall; the painted border (pink) between wall and band is flat.
// The west figures include the 48 mm by which this room's x = 0 lies outside the scanned west wall face (the scan was
// anchored on the east wall). The corner rings sit inside rounded corners of the band. projectionMm is ASSUMED.
export const BEDROOM3_CEILING_MOULDINGS = {
  source: 'phone scan 2026-10-04 (Scaniverse 2026-10-04 201236.glb), ceiling image at 250 px/m and height/colour profiles',
  accuracy: 'edges +/- 20-30 mm; projection not measurable from the scan (assumed)',
  projectionMm: 15,
  border: {north: {fromMm: 360, toMm: 430}, east: {fromMm: 380, toMm: 450}, south: {fromMm: 380, toMm: 450}, west: {fromMm: 440, toMm: 520}},
  cornerRings: {fromMm: 330, reachMm: {north: 740, east: 780, south: 750, west: 800}},
  medallions: [{xMm: 2030, zMm: 1820, diameterMm: 760, label: 'fan medallion (four-lobed, with its outer ripple rings)'}],
}

export const BEDROOM3_LIGHTING = {
  // toleranceMm was 400 about the room centre while the fan was only assumed. The fan point is now scanned (+/- 50), and
  // the corner rings push both runs inboard, so the checks are held for the fan anywhere within 150 mm of the scanned point.
  ceilingFans: {status: 'position from the phone scan of 2026-10-04 (medallion and hub); blade diameter and drop still assumed', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 0, toleranceMm: 150,
    fans: [BEDROOM3_CEILING_FAN]},
  // MOULDINGS (2026-10-05): both runs were clear of the straight border but started at x 300, across the west moulding
  // (440-520), and ran through the corner rings at both ends (the rings reach 740-800 from the walls; the runs were 650 and
  // 626 off theirs). Both are now 820 mm off their wall, inboard of the rings (70-80 mm clear), and start at x 600, east of
  // the west moulding (80 mm clear). Every head keeps its place along its run. Fan blades: 400 mm from B1, 486 from B2.
  ceilingMouldings: BEDROOM3_CEILING_MOULDINGS,
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // North side, 820 mm off the north wall (was 650, from x 300), from beside the entry door to just short of the east
    // cabinets. A diffused head for the soft layer, a spot on the north-wall art, and a reading head aimed at the north
    // sleeper's chest from the foot side (about 19 degrees of tilt, was 24: the beam reaches the book, the lamp stays out of
    // the eyes). Owner 2026-10-05: the dressing moved to the south end, so its down light (12 W at x 3300) moved to B2; the
    // run keeps its length (nothing needs it shortened; the last 370 mm past the reading head carry no head).
    {id: 'B1', label: 'Bedroom 3 track 1: north side, art and north reading', axis: 'x', atMm: 820, fromMm: 600, toMm: 3150, driverWatts: 60, heads: [ // ends 155 mm short of the 658 mm deep storage cabinet (was 3350; owner deepened the cabinet 2026-10-05)
      {kind: 'diffuse', atMm: 1300, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'spot', atMm: 2300, watts: 7, lumens: 600, aim: 'north'},
      {kind: 'reading', atMm: 2950, watts: 12, lumens: 1000, targetMm: {xMm: 3200, zMm: 1450}}]},
    // South side, 820 mm off the south wall (was 626, from x 300): two spots graze the wardrobe fronts (x 365-1905; the
    // spots stand 285 mm inside each end, moved from 450 and 1350 when the scan placed the wardrobe), a
    // diffused head for the soft layer, and the south sleeper's reading head, aimed the same way from the foot side.
    // Owner 2026-10-05: plus the dressing down light, moved here from B1 with the dressing: straight down at x 3300 over the
    // standing spot in front of the mirror (x 2856-3506, z 2826-3576; this run at z 2906 crosses its north part). That makes
    // 53 W on this run, over 80% of a 60 W driver, so the driver is now 100 W (was 60; 53% loaded).
    {id: 'B2', label: 'Bedroom 3 track 2: south side, wardrobe, dressing and south reading', axis: 'x', atMm: 2906, fromMm: 600, toMm: 3350, driverWatts: 100, heads: [
      {kind: 'spot', atMm: 650, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'diffuse', atMm: 1135, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'spot', atMm: 1620, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'reading', atMm: 2950, watts: 12, lumens: 1000, targetMm: {xMm: 3200, zMm: 2280}},
      {kind: 'reading', atMm: 3300, watts: 12, lumens: 1000}]},
  ]},
}

// Sliders on the Bedroom 3 page, one per circuit: [run id, label] (DrawingLightDimmer.jsx).
export const BEDROOM3_DIMMER_CIRCUITS = [['B1', 'Track 1 (north: art, north reading)'], ['B2', 'Track 2 (south: wardrobe, dressing, south reading)']]

/**
 * What reaches the ceiling: the east cabinet bridge (top at 2650 mm) and, since 2026-10-05, the full-height storage cabinet
 * at the north end (floor to ceiling, its own depthMm); a run must keep clear of both.
 */
export function bedroom3Obstacles(room) {
  const c = room.furniture.eastCabinet, b = c.bridge
  const rows = [{x1: room.widthMm - c.depthMm, x2: room.widthMm, z1: b.fromNorthMm, z2: b.fromNorthMm + b.widthMm, label: 'east cabinet bridge'}]
  for (const unit of [c.north, c.south]) if (unit.kind === 'storage') rows.push({x1: room.widthMm - (unit.depthMm ?? c.depthMm), x2: room.widthMm, z1: unit.fromNorthMm, z2: unit.fromNorthMm + unit.widthMm, label: 'full-height storage cabinet'})
  return rows
}

/**
 * Floor rectangles the reading heads may shine on: the bed, and the standing spot in front of the mirror dressing cabinet
 * (whichever end unit has the mirror: the south one since 2026-10-05), standDepthMm deep.
 */
export function bedroom3DownTargets(room) {
  const bed = room.furniture.bed, c = room.furniture.eastCabinet, d = [c.north, c.south].find(unit => unit.mirrorTopMm != null)
  const front = room.widthMm - (d.depthMm ?? c.depthMm)
  return [
    {x1: room.widthMm - bed.lengthMm, x2: room.widthMm, z1: bed.centerFromNorthMm - bed.widthMm / 2, z2: bed.centerFromNorthMm + bed.widthMm / 2, label: 'bed'},
    {x1: front - (d.standDepthMm ?? 650), x2: front, z1: d.fromNorthMm, z2: d.fromNorthMm + d.widthMm, label: 'dressing spot in front of the mirror'},
  ]
}
