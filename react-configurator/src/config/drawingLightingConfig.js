// Concept fixture centres, measured from the Drawing Room's west and north walls. There is one set per seating
// layout (roomShellConfig.js drawing: "northTv" is the default tvWall layout, "cornerSofas" the alternative).
// The existing chandelier is the only ceiling fixture; walls supply the other layers.

// EXISTING CEILING MOULDINGS (phone scan 2026-10-04, docs/SITE_SCAN_2026-10-04.md; measured again 2026-10-05 from the
// scan's ceiling image and 20 mm height/colour profiles, docs/changes/2026-10-05-tracks-and-mouldings.md).
// Millimetres. `border` is the raised plaster moulding line: for each wall, fromMm and toMm are its near and far edge
// measured FROM THAT WALL (so the band keeps its wall distance although the app room is 203 mm wider and 59 mm longer than
// the scan). Between the wall and fromMm the ceiling is a flat painted border (orange here): flat slab, a track may sit
// there. `cornerRings`: each corner has a plaster ring and a leaf; together they fill the square from fromMm to
// reachMm[wall] off the two walls of that corner. `medallions`: round plaster rosettes, centre from the west and north
// walls. `projectionMm` is how far the plaster stands below the slab: the scan mesh shows only 5-8 mm because phone LiDAR
// smooths small relief, so 15 is an ASSUMED working figure (to be taped). Accuracy: band edges and ring reach +/- 20-30 mm.
// A track cannot be screwed flat across any of these (domain/drawingLighting.mjs TRACK_TO_MOULDING_MM).
export const DRAWING_CEILING_MOULDINGS = {
  source: 'phone scan 2026-10-04 (Scaniverse 2026-10-04 194853.glb), ceiling image at 250 px/m and height/colour profiles',
  accuracy: 'edges +/- 20-30 mm; projection not measurable from the scan (assumed)',
  projectionMm: 15,
  border: {north: {fromMm: 350, toMm: 430}, east: {fromMm: 350, toMm: 420}, south: {fromMm: 370, toMm: 450}, west: {fromMm: 370, toMm: 440}},
  cornerRings: {fromMm: 310, reachMm: {north: 770, east: 770, south: 800, west: 770}},
  medallions: [
    {xMm: 1600, zMm: 2705, diameterMm: 830, label: 'centre medallion (chandelier)'},
    {xMm: 1650, zMm: 1290, diameterMm: 330, label: 'north fan rosette'},
    {xMm: 1580, zMm: 4075, diameterMm: 350, label: 'south fan rosette'},
  ],
}

export const DRAWING_LIGHTING = {
  northTv: {
    ambient: [{xMm: 1750, zMm: 3300, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: {fromNorthMm: 4645, heightMm: 1550, label: 'South sofa reading light'},
    sofaGlow: {xMm: 1140, lengthMm: 2250, fromNorthMm: 4810, heightMm: 120, label: 'South sofa low glow'},
  },
  // Layout C: reading light over the corner lamp table, low glow under the south sofa. Owner 2026-10-04: the chandelier hangs
  // between the two ceiling fans (it was drawn over the coffee table at 1745, 3425).
  // Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04.md): the three ceiling points are the centres of the plaster rosettes,
  // measured from the west and north walls: the 830 mm centre medallion at (1600, 2705) and a small rosette at each end.
  // Was assumed at x 1676 with the chandelier at z 2850 and the fans at z 1150 and 4550.
  southSofas: {
    ambient: [{xMm: 1600, zMm: 2705, label: 'Existing chandelier, on the centre ceiling medallion'}],
    // Owner 2026-10-04: the old small wall light in the north-west comes off; the track lights replace it.
    wallUplight: null,
    // Owner 2026-10-04: no swing-arm wall reading light; brighter dimmable track heads over the seats do that job instead.
    reading: null,
    sofaGlow: {xMm: 1605, lengthMm: 2250, fromNorthMm: 4835, heightMm: 120, label: 'South sofa low glow'},
    // Owner, 2026-10-04: the room has two ceiling fans, one at each end, and the chandelier between them; there is no false
    // ceiling. The scan flattened the fans into the ceiling, so blade size and drop are still ASSUMED (work-plan/OPEN_ITEMS.md, C18).
    ceilingFans: {status: 'positions from the phone scan of 2026-10-04; blade size and drop assumed, not measured', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 330,
      fans: [{xMm: 1650, zMm: 1290, label: 'North ceiling fan'}, {xMm: 1580, zMm: 4075, label: 'South ceiling fan'}]},
    // Layered lighting without a false ceiling (owner 2026-10-04): surface magnetic track fixed to the slab, with spot heads
    // on the walls and diffused heads for soft general light, placed clear of both fans. `axis` is the direction the run
    // goes: 'x' runs east-west at z = atMm, 'z' runs north-south at x = atMm. A head's atMm is its place along the run;
    // `aim` is the wall a spot points at. A 'reading' head is a stronger spot pointing straight down at a sofa seat
    // (owner 2026-10-04, instead of swing-arm wall lights). Watts and lumens are typical catalogue figures for such heads.
    // CIRCUITS (owner, later 2026-10-04): the heads on a run cannot be dimmed one by one, only the whole run. So each run is
    // ONE circuit with its own 48 V driver (driverWatts, loaded to 80% at most) and its own wall dimmer, and the mix of light
    // on a run is fixed by which heads are clipped on. Track 2 keeps its reading and diffused heads together: turn the whole
    // track up to read, down for TV; the chandelier carries the general light. The former single 150 W driver becomes two.
    // MOULDINGS (2026-10-05): the runs sit on flat slab, clear of the plaster border, corner rings and rosettes above.
    //  Track 1 was at z 440, x 300-2300, spots at 700 / 1300 / 1900. At 440 it lay on the inner edge of the north moulding
    //  (350-430 from the wall) and its west end ran through the north-west corner ring (reach 770). Now z 540, x 820-2320,
    //  spots at 920 / 1420 / 1920: 110 mm inboard of the moulding, 50 mm past the ring, 150 mm from the north fan's blades
    //  (still 50 mm if the fans turn out to be 1400 mm). The spots stay on the panelled stretch, about the TV centre (1415).
    //  Track 2 stays at x 640 (200 mm inboard of the west moulding, 370-440) but ended at z 4700 inside the south-west
    //  corner ring (which starts 800 from the south wall, z 4535). Now z 2000-4450; its last reading head moved from 4600 to
    //  4410 and is aimed at the same seat (640, 4700), about 8 degrees of tilt. It cannot go further inboard instead: past
    //  the ring (x 810) the reading head at 3970 would be 177 mm from the south fan's blades (needs 300).
    ceilingMouldings: DRAWING_CEILING_MOULDINGS,
    tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
      {id: 'T1', label: 'Track 1: grazes the TV panel wall', axis: 'x', atMm: 540, fromMm: 820, toMm: 2320, driverWatts: 60, heads: [
        {kind: 'spot', atMm: 920, watts: 7, lumens: 600, aim: 'north'},
        {kind: 'spot', atMm: 1420, watts: 7, lumens: 600, aim: 'north'},
        {kind: 'spot', atMm: 1920, watts: 7, lumens: 600, aim: 'north'}]},
      {id: 'T2', label: 'Track 2: west wall, over the west sofa', axis: 'z', atMm: 640, fromMm: 2000, toMm: 4450, driverWatts: 100, heads: [
        {kind: 'reading', atMm: 2470, watts: 12, lumens: 1000},
        {kind: 'diffuse', atMm: 2950, watts: 15, lumens: 1400, lengthMm: 300},
        {kind: 'diffuse', atMm: 3500, watts: 15, lumens: 1400, lengthMm: 300},
        {kind: 'reading', atMm: 3970, watts: 12, lumens: 1000},
        {kind: 'reading', atMm: 4410, watts: 12, lumens: 1000, targetMm: {xMm: 640, zMm: 4700}}]},
    ]},
  },
  cornerSofas: {
    ambient: [{xMm: 1745, zMm: 1900, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: null,
    sofaGlow: {xMm: 1155, lengthMm: 2250, fromNorthMm: 930, heightMm: 120, label: 'North sofa low glow'},
  },
}

// Sliders on the Drawing Room page (layout C), one per circuit: [circuit id, label]. 'chandelier' is the existing chandelier;
// the others are the run ids above (DrawingLightDimmer.jsx).
export const DRAWING_DIMMER_CIRCUITS = [
  ['chandelier', 'Chandelier'], ['T1', 'Track 1 (TV wall spots)'], ['T2', 'Track 2 (west wall: general and reading)'],
]
