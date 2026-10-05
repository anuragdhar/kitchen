// Lobby / Dining lighting (owner 2026-10-04: track lights here too, for flexibility; no false ceiling).
// Millimetres in the room frame: x from the west wall, z from the north wall. Same track vocabulary as the Drawing Room
// (drawingLightingConfig.js): `axis` 'x' runs east-west at z = atMm, 'z' runs north-south at x = atMm; a 'spot' points at
// the wall named in `aim`, a 'diffuse' head gives soft general light, a 'reading' head is a stronger spot pointing straight
// down at a work spot. Both runs hug a wall, so the middle of the ceiling stays free for a ceiling fan.
// Circuits (owner 2026-10-04): one run = one circuit with its own 48 V driver (driverWatts, loaded to 80% at most) and its
// own wall dimmer; the heads on a run dim together. The former single 100 W driver becomes one 60 W driver per run.
// Watts and lumens are typical catalogue figures.
//
// FRAME NOTE. The scan measured this room from the Drawing Room face of the dividing beam, about 40 mm west of this
// room's x = 0, and found it 5165 wide from there (5125 in this frame) against the 4993 the app draws. So anything placed
// from the west (the two ceiling points) may really be up to about 130 mm further west relative to the east wall than
// drawn. The border and corner rings below are stored as distances from EACH wall, which is how a fitter meets them.

// EXISTING CEILING MOULDINGS (phone scan 2026-10-04; measured 2026-10-05; vocabulary in drawingLightingConfig.js).
// The west band is further in because the dividing beam takes the first 215 mm of this frame. The painted border between
// wall and band is flat. projectionMm is ASSUMED (the scan mesh shows about 5 mm; phone LiDAR smooths small relief).
export const LOBBY_CEILING_MOULDINGS = {
  source: 'phone scan 2026-10-04 (Scaniverse 2026-10-04 194853.glb), ceiling image at 250 px/m and height/colour profiles',
  accuracy: 'edges +/- 20-30 mm; the faint north-west and south-west rings +/- 50 mm; projection assumed',
  projectionMm: 15,
  border: {north: {fromMm: 390, toMm: 450}, east: {fromMm: 450, toMm: 520}, south: {fromMm: 370, toMm: 440}, west: {fromMm: 580, toMm: 640}},
  cornerRings: {fromMm: 300, reachMm: {north: 770, east: 820, south: 790, west: 960}},
  medallions: [
    {xMm: 2605, zMm: 1600, diameterMm: 810, label: 'centre medallion (probably the fan point)'},
    {xMm: 3770, zMm: 1615, diameterMm: 440, label: 'rosette of the domed ceiling light'},
  ],
}

export const LOBBY_LIGHTING = {
  // Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04.md): what is on the ceiling today, at the centres of the plaster
  // rosettes. x here is from the Drawing Room face of the dividing beam, which is about 40 mm west of this room's x = 0.
  // The scan flattened whatever hangs there, so 'probably a fan' is read from the photo texture, not confirmed
  // (work-plan/OPEN_ITEMS.md, C22). Kept as the raw record; the fan and the mouldings use the room frame (x - 40).
  existingCeilingPoints: [
    {xMm: 2645, zMm: 1600, label: 'Centre medallion, about 810 across, dark hub and rod: probably a ceiling fan'},
    {xMm: 3810, zMm: 1615, label: 'Small rosette with a domed ceiling light'},
  ],
  // CEILING FAN (2026-10-05): the centre medallion's dark hub and rod are almost certainly a fan, so it is modelled at the
  // medallion (room frame: 2645 - 40) and the track checks now include it. Blade size and drop are ASSUMED, as elsewhere.
  ceilingFans: {status: 'probable, from the scan', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 0,
    fans: [{xMm: 2605, zMm: 1600, label: 'Ceiling fan', status: 'probable, from the scan'}]},
  ceilingMouldings: LOBBY_CEILING_MOULDINGS,
  // Owner 2026-10-06, with the planter-shelf photo: "Let's use this as a dining table light."
  // 2026-10-05: there is NO ceiling point over the table (2200, 620). The two real points are on the room's centre line
  // (existingCeilingPoints); the nearest is the fan medallion about 1060 mm away, which the fan occupies. The feed STILL
  // needs a NEW point or a swag, undecided. The old 750 x 100 bar canopy crossed the north moulding (z 390-450).
  // PROPOSAL 2026-10-06: light oak shelf, north-south like the table. All dimensions/weights/render settings below are
  // proposals, not measured hardware. Underside 1780 (was 1657) gives 1035 above the 745 table: higher for sight lines,
  // but NOT standing headroom when leaning beneath it. Four separate mounts at x +/-110, z +/-320 avoid the moulding;
  // the small central cap is for the unresolved electrical feed, not the structural support. Keep the legacy keys/id.
  pendant: {label: 'Dining shelf light', kind: 'planterShelf', lengthMm: 1000, bottomMm: 1780, bodyWidthMm: 300,
    canopyLengthMm: 80, canopyWidthMm: 60, canopyDepthMm: 20, axis: 'z', thicknessMm: 40,
    rods: {endInsetMm: 180, sideInsetMm: 40, diameterMm: 6, mountDiameterMm: 40, mountDepthMm: 12},
    led: {kelvin: 3000, lengthMm: 880, widthMm: 16, thicknessMm: 2, recessMm: 2,
      channelLengthMm: 900, channelWidthMm: 22, channelDepthMm: 8, cableDiameterMm: 3},
    plants: {alongMm: [-310, 0, 310], heightMm: 350, spreadMm: 220,
      trailDropMm: 240, trailOverhangMm: 35, leafLengthMm: 55, leafWidthMm: 32, stemDiameterMm: 3,
      // Conservative plan envelope includes leaves, for the table-edge/leaning check; keep growth trimmed inside it.
      envelopeOverhangMm: 65},
    load: {boardDensityKgM3: 700, wetPotKg: 2, hardwareKg: 1.6},
    // ASSUMPTION: the existing fan sketch puts the lower blade face 14 below its nominal drop (10 offset + 4 half-thickness).
    clearance: {standingHeightMm: 1800, headReachOverEdgeMm: 150, anchorToBladeMm: 100, anchorToMouldingMm: 40, fanBladeBelowDropMm: 14},
    appearance: {oak: '#d5bb91', metal: '#b9b4aa', glowIntensity: .7,
      // Existing point-light preview strength retained; offset below the shelf prevents the wood masking it.
      lightIntensity: 1.4, lightRangeM: 5, lightDecay: 1.5, lightBelowMm: 60},
    ceilingPoint: {status: 'none exists over the table; a new point or a swag is needed, not decided'}},
  // MOULDINGS (2026-10-05): both runs sit on flat slab.
  //  L1 stays 537 mm off the south wall (97 mm inboard of the south moulding, 370-440) but ran x 2100-4700, through the
  //  south-east corner ring (reach 820 from the east wall, x 4173) and across the east moulding. Now x 2100-4100 (a 2 m
  //  length); the two diffused heads moved from 3700 / 4300 to 3550 / 3930. The spots are unchanged.
  //  L2 was at x 4050 (943 off the east wall), only 60 mm from the rosette of the domed light as placed from the west.
  //  Now x 4100 (893 off the east wall): 110 mm from that rosette and 73 mm from the north-east corner ring, so it clears
  //  both whichever wall the scan positions are taken from (see FRAME NOTE). Heads unchanged along the run.
  //  The probable fan: L1 is 540 mm and L2 895 mm outside its blade circle.
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // South wall, east of the toilet door (x 1060-1665): washes the wall and lights the walkway toward the east opening.
    {id: 'L1', label: 'Lobby track 1: south wall', axis: 'x', atMm: 2740, fromMm: 2100, toMm: 4100, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 2500, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'spot', atMm: 3100, watts: 7, lumens: 600, aim: 'south'},
      {kind: 'diffuse', atMm: 3550, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'diffuse', atMm: 3930, watts: 15, lumens: 1400, lengthMm: 300}]},
    // In front of the east-wall ironing storage (z 650-2100): a down spot over the pulled-out ironing board, and a spot on the doors.
    {id: 'L2', label: 'Lobby track 2: in front of the ironing storage', axis: 'z', atMm: 4100, fromMm: 500, toMm: 2000, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 800, watts: 7, lumens: 600, aim: 'east'},
      {kind: 'reading', atMm: 1375, watts: 12, lumens: 1000}]},
  ]},
}

// Sliders shown on the Lobby page, one per circuit: [circuit id, label]. 'chandelier' is the dining shelf light; the others are
// the run ids above (rooms/shared/RoomLightDimmer.jsx).
export const LOBBY_DIMMER_CIRCUITS = [
  ['chandelier', 'Dining shelf light'], ['L1', 'Lobby track 1 (south wall)'], ['L2', 'Lobby track 2 (ironing storage)'],
]
