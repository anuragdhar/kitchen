// Bedroom 1 layouts and the working assumptions behind their checks (2026-10-05).
//
// NOTHING in Bedroom 1 is measured on site: the room has not been scanned. Room size, openings and fixed furniture come
// from the A501 floor plan (roomShellConfig.js bedroom1); the values below are design choices and working assumptions.
// Millimetres in the room frame of roomShellConfig.js: x east from the west wall, z south from the north wall, y up.
// The balcony continues the same frame past the east wall (x > widthMm).
//
// Two layouts, switched by the Layout button on the Bedroom 1 page:
//  present    "A", the default: the furniture of roomShellConfig.js bedroom1.furniture, unchanged (bed along the south
//             wall, head at the east end). Only the loose pieces listed here were moved (see docs/changes/2026-10-05-bedroom1-design.md).
//  headSouth  "B", the alternative: the same bed turned so its head is on the south wall, with a walkway on both sides,
//             a dressing table on the north wall and one bedside table. Wardrobes, balcony and doors are unchanged.
// Pure checks: src/domain/bedroom1Layout.mjs. Drawing: src/rooms/bedroom1/Bedroom1Layouts.js.
export const BEDROOM1_DESIGN = {
  status: 'not measured on site; the room has not been scanned',
  defaultLayout: 'present',

  // Thresholds used by the checks.
  clearances: {
    walkwayMinMm: 600,            // a person walking; below this is a problem
    bedsidePreferredMm: 750,      // comfortable beside a bed; below this is only a note
    doorApproachMm: 600,          // clear floor inside a door, the full width of the opening
    sliderStandMm: 450,           // standing room in front of sliding wardrobe doors
    personMm: 400,                // floor square a standing person needs
    reachMm: 750,                 // from the middle of that square to the thing being reached (arm about 600)
    stepOverMm: 200,              // anything taller than this cannot be stood on or stepped over
    acFrontClearMm: 600,          // nothing at all this close in front of the window AC
    acThrowMm: 2500,              // nothing taller than the AC's underside this far along its air stream
    acStreamMarginNoteMm: 100,    // a note when something tall stands this close beside the stream
    seatMm: 450,                  // floor a seated person takes up beyond a table front
  },

  // DOOR SWINGS ARE ASSUMED. The lobby door is planned civil work and its leaf is not chosen: it is taken to open INTO the
  // bedroom (the usual way for a bedroom door) and BOTH hinge sides are checked. The washroom door is taken to open into the
  // washroom; what would be in its way if it opens into the bedroom instead is reported as a note. leafMm = the opening width.
  doorSwings: {
    'Lobby / Dining': {opensInto: 'Bedroom 1', hingeKnown: false, status: 'assumed'},
    'Bedroom 1 washroom': {opensInto: 'Bedroom 1 washroom', hingeKnown: false, status: 'assumed'},
  },

  // The bed as drawn (these heights were constants in the drawing code; the footprint is roomShellConfig's bed).
  // headboardMm is inside the 1829 mm length. Pillows lie on the mattress top; headboardTopMm is the tallest point.
  bedProfile: {baseMm: 250, mattressMm: 190, headboardMm: 85, headboardTopMm: 1170, pillowTopMm: 560},

  layouts: {
    present: {
      label: 'A: bed along the south wall (present)',
      // Loose pieces only; everything else is roomShellConfig.js bedroom1.furniture.
      loose: {
        // Was centre (850, 2650): inside the swing of the lobby door whichever side it is hinged. Now on the west wall just
        // south of the wardrobe (which ends at z 1800), outside both possible swings.
        hamper: {centerXmm: 250, centerZmm: 2050, diameterMm: 400, heightMm: 490},
        // Was centre (1050, 2550): the lobby door would have dragged over it. Moved 900 mm north, same size.
        rug: {centerXmm: 1050, centerZmm: 1650, widthMm: 1200, lengthMm: 1300},
        plant: {centerXmm: 2200, centerZmm: 320, diameterMm: 400, heightMm: 1000},
      },
    },
    headSouth: {
      label: 'B: bed head on the south wall, a walkway on both sides',
      // Same bed. Head on the south wall; 150 mm east of the lobby door jamb (x 1000) so either door swing clears it, which
      // leaves 642 mm to the wardrobe front on the west side and 679 mm to the east wall.
      bed: {lengthMm: 1829, widthMm: 1524, headWall: 'south', fromWestMm: 1150, fromSouthMm: 0},
      // On the free stretch of the north wall between the washroom door (ends x 1416) and the recess wardrobe (starts
      // x 2503). 350 deep so that someone can still pass behind a person sitting at it. Mirror on the wall above.
      dressingTable: {fromWestMm: 1510, widthMm: 900, depthMm: 350, heightMm: 750,
        mirror: {widthMm: 700, heightMm: 900, bottomMm: 850},
        stool: {widthMm: 400, depthMm: 300, heightMm: 450}},
      // East side of the bed only; the lobby door leaves no room for one on the west side.
      bedsideTable: {side: 'east', gapMm: 20, widthMm: 400, depthMm: 350, heightMm: 550},
      // The medicine cabinet in the closed old door (bedroom1ClosedDoor.js) is behind the bed head in this layout. PROPOSED
      // for this layout only: its two doors start above the headboard and the part below is a fixed panel, so both leaves
      // open over the pillows and the bedside table. The cabinet itself (config and Whole home 3D) is NOT changed.
      medicineCabinet: {doorBottomMm: 1250},
      loose: {
        hamper: {centerXmm: 250, centerZmm: 2050, diameterMm: 400, heightMm: 490},
        rug: {centerXmm: 1912, centerZmm: 900, widthMm: 1500, lengthMm: 700},
      },
      // What moves in bedroom1LightingConfig.js if this layout is built: track B1 (wardrobe) stays; track B2 (over the bed)
      // turns to run east-west, 720 mm from the south (headboard) wall (30 mm closer than today's 750, to keep its reading heads
      // 300 mm off the assumed fan's blades), one reading head over each sleeper.
      lighting: {replaces: 'B2', run: {id: 'B2', label: 'Bedroom 1 track 2: over the bed (layout B)', axis: 'x', atMm: 2520, fromMm: 1300, toMm: 2520, driverWatts: 60, heads: [
        {kind: 'reading', atMm: 1560, watts: 12, lumens: 1000},
        {kind: 'spot', atMm: 1912, watts: 7, lumens: 600, aim: 'south'},
        {kind: 'reading', atMm: 2264, watts: 12, lumens: 1000}]}},
    },
  },
}

export const BEDROOM1_LAYOUT_KEYS = Object.keys(BEDROOM1_DESIGN.layouts)

/** The lighting config for a layout: the default config with the layout's replacement run swapped in. */
export function bedroom1LightingFor(lighting, layoutKey, design = BEDROOM1_DESIGN) {
  const change = design.layouts[layoutKey]?.lighting
  if (!change) return lighting
  return {...lighting, tracks: {...lighting.tracks, runs: lighting.tracks.runs.map(run => run.id === change.replaces ? change.run : run)}}
}
