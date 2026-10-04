// Bedroom 1 track lighting (owner 2026-10-04: "the lights thing" in the other rooms, as in the Drawing Room and Lobby).
// Millimetres in the room frame of roomShellConfig.js bedroom1: x from the west wall, z from the north wall; no false
// ceiling, 48 V magnetic surface track on the slab. Same vocabulary as drawingLightingConfig.js: `axis` 'x' runs east-west
// at z = atMm, 'z' runs north-south at x = atMm; a 'spot' points at the wall in `aim`, a 'diffuse' head gives soft general
// light, a 'reading' head points straight down (or at targetMm). One run = one circuit with its own driver and wall dimmer.
//
// How the room is used (roomShellConfig.js): the bed lies along the south wall with its head at the east wall (x 1524-3353,
// z 1716-3240; pillows about 350 mm either side of z 2478); the three-door wardrobe is on the west wall (z 0-1800, 2400
// high); the washroom door is in the north wall (x 766-1416), the lobby door in the south wall (x 100-1000); the AC hangs on
// the west wall south of the wardrobe. Nothing in the room reaches the ceiling (the north-east recess wardrobe sits in its
// recess, outside the room), so the runs only have to clear the fan.
export const BEDROOM1_LIGHTING = {
  // CEILING FAN: not measured. Assumed at the room centre, 1200 mm blades hanging 300 mm (work-plan/OPEN_ITEMS.md, C23).
  ceilingFans: {status: 'assumed at the room centre; not measured', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 0,
    fans: [{xMm: 1676, zMm: 1620, label: 'Ceiling fan', status: 'assumed'}]},
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // Along the wardrobe, 800 mm off the west wall: three spots graze the wardrobe doors (and light the inside when they are
    // open), two diffused heads give the soft general layer. This is the circuit left on in the evening.
    {id: 'B1', label: 'Bedroom 1 track 1: wardrobe and general light', axis: 'z', atMm: 800, fromMm: 300, toMm: 2900, driverWatts: 100, heads: [
      {kind: 'spot', atMm: 400, watts: 7, lumens: 600, aim: 'west'},
      {kind: 'diffuse', atMm: 700, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'spot', atMm: 1000, watts: 7, lumens: 600, aim: 'west'},
      {kind: 'spot', atMm: 1600, watts: 7, lumens: 600, aim: 'west'},
      {kind: 'diffuse', atMm: 2500, watts: 15, lumens: 1400, lengthMm: 300}]},
    // Over the bed, 750 mm from the headboard wall: one reading head straight down over each sleeper's chest (the head of
    // someone lying down is 800 mm further east, outside the beam, so no glare in the eyes), and a spot washing the
    // headboard wall between them. Turn this circuit up to read, off to sleep.
    {id: 'B2', label: 'Bedroom 1 track 2: over the bed', axis: 'z', atMm: 2600, fromMm: 1850, toMm: 3050, driverWatts: 60, heads: [
      {kind: 'reading', atMm: 2130, watts: 12, lumens: 1000},
      {kind: 'spot', atMm: 2480, watts: 7, lumens: 600, aim: 'east'},
      {kind: 'reading', atMm: 2830, watts: 12, lumens: 1000}]},
  ]},
}

// Sliders on the Bedroom 1 page, one per circuit: [run id, label] (DrawingLightDimmer.jsx).
export const BEDROOM1_DIMMER_CIRCUITS = [['B1', 'Track 1 (wardrobe and general)'], ['B2', 'Track 2 (over the bed: reading)']]

/** Floor rectangle of the bed, the only target the reading heads may shine on. */
export function bedroom1DownTargets(room) {
  const bed = room.furniture.bed
  return [{x1: bed.fromWestMm, x2: bed.fromWestMm + bed.lengthMm, z1: room.lengthMm - bed.fromSouthMm - bed.widthMm, z2: room.lengthMm - bed.fromSouthMm, label: 'bed'}]
}
