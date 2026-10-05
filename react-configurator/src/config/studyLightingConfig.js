// Study (Bedroom 2) track lighting (owner 2026-10-04). Millimetres in the room frame of studyRoomConfig.js: x from the
// west wall, z from the north wall; no false ceiling, 48 V magnetic surface track on the slab. Vocabulary as in
// drawingLightingConfig.js; one run = one circuit with its own driver and wall dimmer. The balcony office through the west
// opening is a separate room and is not lit from here.
//
// How the room is used (studyRoomConfig.js and rooms/study/StudyFurniture.js, kids layout): the glazed bookshelf fills the
// north wall (x 0-2235, 457 deep, 2395 high); a single bed stands against the east wall with its head at the north end
// (x 2339-3239, z 1050-3050); the study desk is in the south-east corner (x 2639-3239, z 3160-3960) with the chair west of
// it; the entry door is at the north end of the east wall, the terrace door in the south wall (x 2039-3039), the balcony
// office opening in the west wall (z 2546-4375). Nothing reaches the ceiling.
export const STUDY_LIGHTING = {
  // CEILING FAN: not measured. Assumed at the room centre, 1200 mm blades hanging 300 mm (work-plan/OPEN_ITEMS.md, C25).
  ceilingFans: {status: 'assumed at the room centre; not measured', bladeDiameterMm: 1200, dropMm: 300, chandelierRadiusMm: 0,
    fans: [{xMm: 1620, zMm: 2454, label: 'Ceiling fan', status: 'assumed'}]},
  // Where the reading heads may shine. These mirror the kids layout drawn in rooms/study/StudyFurniture.js (bed 900 deep
  // against the east wall from z 1050, desk 580 x 800 at x 2929, z 3560), which has no config of its own yet.
  downTargets: [
    {x1: 2339, x2: 3239, z1: 1050, z2: 3050, label: 'bed'},
    {x1: 2639, x2: 3239, z1: 3160, z2: 3960, label: 'desk'},
  ],
  tracks: {type: '48 V magnetic surface track', colour: 'white', kelvin: 3000, sectionMm: 22, circuit: 'one run = one circuit: its own driver and wall dimmer', runs: [
    // Along the bookshelf, 850 mm off the north wall (about 400 in front of the shelf): a spot on each glazed bay and a
    // diffused head for the soft general layer. The everyday evening circuit.
    {id: 'S1', label: 'Study track 1: bookshelf and general light', axis: 'x', atMm: 850, fromMm: 300, toMm: 2900, driverWatts: 60, heads: [
      {kind: 'spot', atMm: 400, watts: 7, lumens: 600, aim: 'north'},
      {kind: 'spot', atMm: 1120, watts: 7, lumens: 600, aim: 'north'},
      {kind: 'spot', atMm: 1860, watts: 7, lumens: 600, aim: 'north'},
      {kind: 'diffuse', atMm: 2500, watts: 15, lumens: 1400, lengthMm: 300}]},
    // Down the east side, 540 mm off the east wall: a reading head aimed at the chest of the child in bed from the foot side
    // (16 degrees of tilt, lamp out of the eyes), a down light on the desk (aimed 250 mm east onto the worktop, 740 high),
    // and two diffused heads so this side of the room has its own soft light when the bookshelf circuit is off.
    {id: 'S2', label: 'Study track 2: bed and desk', axis: 'z', atMm: 2700, fromMm: 1900, toMm: 4500, driverWatts: 100, heads: [
      {kind: 'reading', atMm: 2300, watts: 12, lumens: 1000, targetMm: {xMm: 2790, zMm: 1750}},
      {kind: 'diffuse', atMm: 2900, watts: 15, lumens: 1400, lengthMm: 300},
      {kind: 'reading', atMm: 3560, watts: 12, lumens: 1000, targetMm: {xMm: 2950, zMm: 3560}, targetHeightMm: 740},
      {kind: 'diffuse', atMm: 4250, watts: 15, lumens: 1400, lengthMm: 300}]},
  ]},
}

// Sliders on the Study page, one per circuit: [run id, label] (rooms/shared/RoomLightDimmer.jsx).
export const STUDY_DIMMER_CIRCUITS = [['S1', 'Track 1 (bookshelf and general)'], ['S2', 'Track 2 (bed reading and desk)']]
