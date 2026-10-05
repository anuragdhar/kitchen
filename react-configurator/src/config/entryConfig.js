// The A501 whole-home floor-plan PNG (Interior/home a 501 floor - unmodified.png),
// shared by HomeApp.jsx's plan hotspots and WholeHome3D.jsx's plan-to-metres
// conversion. Keep both readers pointed at this instead of repeating the pixel
// size as separate magic numbers (previously 800/875 in one file and the
// equivalent /8, /8.75 percentage divisors in the other).
export const PLAN_IMAGE = {widthPx: 800, heightPx: 875}

export const ENTRY = {
  planBounds: {x1: 515, y1: 715, x2: 688, y2: 874},
  planScale: {xMetresPerPixel: 4.993 / 260, zMetresPerPixel: 3.277 / 163},
  approachLengthMm: 2134,
  clearWidthMm: 1000,
  mainDoorWidthMm: 900,
  wallHeightMm: 2700,
  shoeRack: {
    planX1: 522, planX2: 567, planNorthY: 874,
    // projectionMm is the rack's depth. Owner 2026-10-04: 15 in (381 mm), so shoes go in lengthwise (was 305). The height is
    // still the earlier 7 ft; the owner is considering about 6 1/2 ft and will confirm (work-plan task carp-shoe-rack).
    widthMm: 865, heightMm: 2134, projectionMm: 381, doorCount: 2, projects: 'north-outside',
    // PROPOSAL, not decided (owner 2026-10-05): the Drawing Room AC's OUTDOOR unit stands on the rack's platform, in the
    // bottom of the rack where it projects outside the north wall, inside a fixed grille; a sealed service door on the
    // gallery side is the only way to reach it (the flat is on an upper floor); a closed, insulated divider separates it
    // from the shoes above. Shown only by the "AC outdoor unit under the shoe rack" toggle on the Main entry page; the rack
    // is drawn without it by default. Millimetres.
    //  orientation 'across': the long fan face looks straight out (the owner's first idea). 'lengthwise' (the owner's
    //              follow-up, "put it in the long way"): turned a quarter turn, so the long side runs outward, the fan
    //              blows out through one SIDE of the cage (dischargeSide) and the coil breathes through the other side;
    //              the service valves are at the inner end, right behind the service door.
    //  wallThicknessMm  the outer wall the rack passes through, ASSUMED 9 inches (work-plan/OPEN_ITEMS.md A3). The unit
    //              must stand beyond it, or masonry blocks the air at its sides.
    //  heightMm    clear height of the bay, platform to the underside of the divider
    //  unit        a TYPICAL compact 1.5 ton inverter outdoor unit including its valve cover; the chosen model governs
    //  clearance   typical installation-manual figures: behind the coil, beside the coil end (intake side), beside the
    //              service valves, above the casing, the designed gap from the fan face to the grille and the most it may
    //              be (further back and the hot air comes round into the intake), the pads under the unit, and the free
    //              air needed beyond the grille on the discharge side.
    //  grille      fixed bars on the outer face and both sides of the bay
    //  outsideClearMm  free air beyond the grille on the discharge side: NOT measured (the owner: "the area in front is clear")
    acBay: {
      status: 'proposal by the owner 2026-10-05, not decided; nothing measured',
      orientation: 'lengthwise', dischargeSide: 'east', wallThicknessMm: 230, wallThicknessAssumed: true,
      heightMm: 800, dividerMm: 40,
      unit: {label: 'typical compact 1.5 ton inverter outdoor unit', widthMm: 800, heightMm: 550, depthMm: 300, weightKg: 35, serviceSide: 'west'},
      clearance: {rearMm: 100, intakeSideMm: 100, serviceSideMm: 300, topMm: 150, frontGapMm: 40, frontToGrilleMaxMm: 50, feetMm: 50, outsideFrontMm: 1000},
      grille: {barMm: 10, pitchMm: 60},
      outsideClearMm: null,
    },
  },
  shaft: {planX1: 575, planY1: 775, planX2: 688, planY2: 810},
  // PROPOSAL 2026-10-06: retain the north hinge, reverse the wooden leaf into the gallery; a 60-degree stop avoids its
  // east wall. Existing 45 mm frame / leaf thickness and 70 mm head allowance were in EntryArrivalDoor.js.
  // The 35 mm leaf-to-jamb allowance and face offsets are proposed hardware space, NOT surveyed joinery.
  arrivalDoor: {wallPlanX:575,fromPlanY:810,toPlanY:874,heightMm:2200,openAngleDegrees:60,maxOpenAngleDegrees:60,hinge:'north',opens:'east-inside',
    faceOffsetMm:-60,frameMm:45,leafJambGapMm:35,leafThicknessMm:45,headAllowanceMm:70},
  outerEntryOpening: {wallPlanX: 688, fromPlanY: 822, toPlanY: 867, heightMm: 2200},
  // Owner 2026-10-06: "Where this steel door is, it's just an opening; we are not allowed to put a door there. So let's move
  // this door inside, where the current wooden door is." outerEntryOpening stays completely door-free.
  // PROPOSAL 2026-10-06: safety door + retained wooden main door at arrivalDoor, steel on the corridor face, opening west.
  // Face offset 100, jamb allowance 35 and opening stop 85 degrees are proposals for clearance, not surveyed hardware.
  // Keep the outerDoor key and the 2026-10-04 stainless material, finish, ventilation and lock. Panels are listed from the
  // bottom of the leaf upward and must meet each other exactly: `sheet` is solid 1.2 mm plate, `grille` is vertical square bars
  // at `pitchMm` with a fine insect mesh behind them (`meshOpenFraction` of the mesh is open). The hinge side is a working
  // choice, the same hand as the arrival door; `hingeKnown` is false until the fabricator and the owner settle it.
  outerDoor: {
    mountedAt: 'arrivalDoor', faceOffsetMm: 100, leafJambGapMm: 35, maxOpenAngleDegrees: 85,
    material: 'stainless steel, grade 304 (316 if the site is near the coast)', finish: 'brushed (hairline)',
    frameMm: 45, leafThicknessMm: 40, floorGapMm: 10, sheetMm: 1.2,
    hinge: 'north', opens: 'west-outside', hingeKnown: false, openAngleDegrees: 0,
    panels: [
      {kind: 'sheet', fromMm: 0, toMm: 300, note: 'kick plate'},
      {kind: 'grille', fromMm: 300, toMm: 925, barMm: 12, pitchMm: 100, meshOpenFraction: 0.6},
      {kind: 'sheet', fromMm: 925, toMm: 1075, note: 'lock rail'},
      {kind: 'grille', fromMm: 1075, toMm: 2000, barMm: 12, pitchMm: 100, meshOpenFraction: 0.6},
      {kind: 'sheet', fromMm: 2000, toMm: 2145, note: 'top rail'},
    ],
    lock: {type: 'mortise lock with a lever handle, a deadbolt and a night latch, keyed from both sides', heightMm: 1000},
    status: 'owner 2026-10-06: landing opening must have no door; steel moved to arrivalDoor; paired leaves, offsets, stops, bar pattern, finish, lock and hinge side are proposals; opening not measured',
  },
  // ASSUMPTIONS 2026-10-06 for the pure swing check: existing builders use 85 mm walls, rack front -5 and pulls to -53.
  // Hardware envelopes include existing handles; 10 mm obstacle margin and 0.5-degree sampling are proposed checks,
  // with an extra arc-chord error margin. The 700 mm passage warning is a planning assumption, not a code requirement.
  doorPair: {wallThicknessMm:85,obstacleMarginMm:10,sampleDegrees:0.5,preferredPassageMm:700,
    rackFrontOffsetMm:5,rackPullProjectionMm:53,woodHandleReachMm:64,steelHandleReachMm:56,
    woodHandleFromTipMm:140,woodHandleWidthMm:25,steelHandleFromTipMm:112.5,steelHandleWidthMm:135,
    electricalFaceMm:45,electricalHalfWidthMm:50,electricalDepthMm:20,corridorSwitchAlongMm:350,bellAlongMm:550,gallerySwitchFromDoorMm:150,
    northWallFromPlanX:570,keyStationHalfWidthMm:110,keyStationHalfDepthMm:55}, // ASSUMPTION: existing wall start and conservative tray/hooks envelope.
  // ASSUMPTION 2026-10-06: extracted unchanged from EntryFoldSeat.js (2026-09-29 owner's fold-seat request).
  foldSeat: {wallPlanX:515,centrePlanY:810,heightMm:460,depthMm:340,widthMm:360},
  // PROPOSAL 2026-10-06: move the existing tray/hooks out of the shared doorway onto the solid gallery-side shaft wall.
  // Existing tray/hook heights and sizes stay; position moves from x575 +45 mm, y830 to x575 -65 mm, y795.
  keyStation: {wallPlanX:575,planY:795,faceOffsetMm:-65},
  innerOpening: {wallPlanY: 715, fromPlanX: 515, toPlanX: 570, heightMm: 2100},
  // Owner mark 2026-09-30 (plan x 573-643, y 726-772), confirmed by the owner's screenshot of the dark pocket in the 3D
  // model: on the A501 plan there is a closed rectangle (plan x 577-680, y 726-772, about 925 mm = 3 ft deep and 2 m wide)
  // on the Main Entry side of the wall it shares with the Drawing Room. Nothing is drawn in it and it has no door onto the
  // Entry, so the owner reads it as an empty cavity from floor to ceiling. Between it and the Drawing Room is the wall
  // itself, drawn about 11 px (roughly 220 mm, a 9-inch wall) thick, plan y 715-726. Whether that pocket is really hollow,
  // and whether the 9-inch wall may be opened, is not on the drawing and needs checking on site.
  // Owner, 2026-10-03 (marked plan x 575-682, y 726-773): the pocket is TWO SEPARATE CABINETS opening in different directions,
  // "shown correctly in the Blender model" (public/models/A501-blender-lighting.glb), which has:
  //  - a full-height partition at plan x 649-650 (`partitionPlanX`), from the Drawing Room wall to the shaft box;
  //  - EAST cabinet (plan x 577-649): its whole east side (plan-left, x 575, facing the Entry gallery) is open, no wall and no
  //    lintel (`eastOpening`, floor to ceiling over the full depth);
  //  - WEST cabinet (plan x 650-688): reached from the SOUTH, i.e. through the Drawing Room wall at its extreme west end, by a
  //    two-leaf door at plan x 653-684, 2100 mm high (`westDoorPlan`, the Blender reference), with shelves 380 mm deep at the
  //    back (plan y 754-773). Its Drawing Room-frame sizes are room.wallStorage in roomShellConfig.js; a test keeps them equal.
  // None of this is measured on site.
  wallCavity: {planX1: 577, planX2: 680, planY1: 726, planY2: 772, heightMm: 2700, wallPlanY1: 715, wallPlanY2: 726, status: 'owner says empty floor to ceiling; the drawing shows only a closed rectangle',
    partitionPlanX: 650,
    eastOpening: {wallPlanX: 575, fromPlanY: 715, toPlanY: 775, heightMm: 2700},
    westDoorPlan: {fromPlanX: 653, toPlanX: 684, heightMm: 2100, shelfFromPlanY: 754},
    // Owner, 2026-10-03 (marked on a Whole home 3D screenshot): a cabinet EXISTS in the east compartment. It fills the
    // compartment from the open east side back to the partition, floor to ceiling. Only its presence and position are the
    // owner's; the doors (two leaves on the east face, a loft pair above doorHeightMm), shelves and panel size are assumed.
    eastCabinet: {planX1: 577, planX2: 648, planY1: 726, planY2: 772, heightMm: 2700, doorHeightMm: 2100, doorCount: 2, panelMm: 18,
      shelfHeightsMm: [450, 900, 1350, 1800], status: 'owner says it exists; doors, shelves and exact size assumed, not measured'}},
  ownerMark: {planX1: 573, planX2: 643, planY1: 726, planY2: 772},
  source: 'A501 floor plan entry and shoe-area dimensions',
}

// Both the whole-home and dedicated entry views use these exact plan segments.
// The drawingStorage span (649-684) is not a walk-through opening: it is the
// back of Bedroom 1's northEastRecessWardrobe (roomShellConfig.js), confirmed
// against the owner's own floor-plan mark (owner feedback 2026-09-29). Keep
// this wall solid so the Entry/Drawing Room side doesn't show an unexplained
// gap into a room that is not part of either scene.
export const ENTRY_WALL_SEGMENTS = [
  [515, 715, 515, 874],
  [515, 874, ENTRY.shoeRack.planX1, 874],
  [570, 715, 688, 715],
  [688, 715, 688, ENTRY.outerEntryOpening.fromPlanY],
  [688, ENTRY.outerEntryOpening.toPlanY, 688, 874],
  [570, 874, 688, 874],
  [ENTRY.shaft.planX1, ENTRY.shaft.planY1, ENTRY.shaft.planX2, ENTRY.shaft.planY1],
  [ENTRY.shaft.planX1, ENTRY.shaft.planY1, ENTRY.shaft.planX1, ENTRY.shaft.planY2],
  [ENTRY.shaft.planX1, ENTRY.shaft.planY2, ENTRY.shaft.planX2, ENTRY.shaft.planY2],
  // Partition between the pocket's two cabinets (ENTRY.wallCavity.partitionPlanX).
  [ENTRY.wallCavity.partitionPlanX, 715, ENTRY.wallCavity.partitionPlanX, ENTRY.shaft.planY1],
]

// The plan-left (east) wall of the pocket, from the Drawing Room wall down to the shaft box, with the east opening cut in it.
// Returns [segment, bottomMetres, topMetres] pieces so both 3D views draw the same wall (zero-length or zero-height pieces are
// skipped by the views); the other three sides of the pocket are ENTRY_WALL_SEGMENTS (Drawing Room wall y 715, shaft box
// y 775, outer wall x 688). With the current fully open east side every piece is empty.
export function entryPocketEastWallSpans(ceilingM) {
  const w = ENTRY.wallCavity.eastOpening, x = w.wallPlanX, top = w.heightMm / 1000
  return [
    [[x, ENTRY.wallCavity.wallPlanY1, x, w.fromPlanY], 0, ceilingM],
    [[x, w.fromPlanY, x, w.toPlanY], top, ceilingM],
    [[x, w.toPlanY, x, ENTRY.shaft.planY1], 0, ceilingM],
  ]
}
