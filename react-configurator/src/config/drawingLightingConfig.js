// Concept fixture centres, measured from the Drawing Room's west and north walls. There is one set per seating
// layout (roomShellConfig.js drawing: "northTv" is the default tvWall layout, "cornerSofas" the alternative).
// The existing chandelier is the only ceiling fixture; walls supply the other layers.
export const DRAWING_LIGHTING = {
  northTv: {
    ambient: [{xMm: 1750, zMm: 3300, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: {fromNorthMm: 4645, heightMm: 1550, label: 'South sofa reading light'},
    sofaGlow: {xMm: 1140, lengthMm: 2250, fromNorthMm: 4810, heightMm: 120, label: 'South sofa low glow'},
  },
  // Layout C: the chandelier stays over the coffee table; reading light over the corner lamp table, low glow under the south sofa.
  southSofas: {
    ambient: [{xMm: 1745, zMm: 3425, label: 'Existing chandelier over oval table'}],
    // Owner 2026-10-04: the old small wall light in the north-west comes off; the track lights replace it.
    wallUplight: null,
    reading: {fromNorthMm: 4645, heightMm: 1550, label: 'South sofa reading light'},
    sofaGlow: {xMm: 1605, lengthMm: 2250, fromNorthMm: 4835, heightMm: 120, label: 'South sofa low glow'},
    // Owner, 2026-10-04: the room has two ceiling fans, one at each end, and the chandelier between them; there is no false
    // ceiling. Fan positions, blade size and drop are ASSUMED until measured (work-plan/OPEN_ITEMS.md, C18).
    ceilingFans: {status: 'positions and blade size assumed, not measured', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 330,
      fans: [{xMm: 1676, zMm: 1150, label: 'North ceiling fan'}, {xMm: 1676, zMm: 4550, label: 'South ceiling fan'}]},
    // Layered lighting without a false ceiling (owner 2026-10-04): surface magnetic track fixed to the slab, with spot heads
    // on the walls and diffused heads for soft general light, placed clear of both fans. `axis` is the direction the run
    // goes: 'x' runs east-west at z = atMm, 'z' runs north-south at x = atMm. A head's atMm is its place along the run;
    // `aim` is the wall a spot points at. Watts and lumens are typical catalogue figures for such heads.
    tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, driverWatts: 100, sectionMm: 22, runs: [
      {id: 'T1', label: 'Track 1: grazes the TV panel wall', axis: 'x', atMm: 440, fromMm: 300, toMm: 2300, heads: [
        {kind: 'spot', atMm: 700, watts: 7, lumens: 600, aim: 'north'},
        {kind: 'spot', atMm: 1300, watts: 7, lumens: 600, aim: 'north'},
        {kind: 'spot', atMm: 1900, watts: 7, lumens: 600, aim: 'north'}]},
      {id: 'T2', label: 'Track 2: west wall, over the west sofa', axis: 'z', atMm: 640, fromMm: 2000, toMm: 4700, heads: [
        {kind: 'diffuse', atMm: 2400, watts: 12, lumens: 1100, lengthMm: 300},
        {kind: 'diffuse', atMm: 3050, watts: 12, lumens: 1100, lengthMm: 300},
        {kind: 'spot', atMm: 3700, watts: 7, lumens: 600, aim: 'west'},
        {kind: 'spot', atMm: 4400, watts: 7, lumens: 600, aim: 'west'}]},
    ]},
  },
  cornerSofas: {
    ambient: [{xMm: 1745, zMm: 1900, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: null,
    sofaGlow: {xMm: 1155, lengthMm: 2250, fromNorthMm: 930, heightMm: 120, label: 'North sofa low glow'},
  },
}
