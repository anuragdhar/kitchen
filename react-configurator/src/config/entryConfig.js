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
    widthMm: 865, heightMm: 2134, projectionMm: 305, doorCount: 2, projects: 'north-outside',
  },
  shaft: {planX1: 575, planY1: 775, planX2: 688, planY2: 810},
  arrivalDoor: {wallPlanX:575,fromPlanY:810,toPlanY:874,heightMm:2200,openAngleDegrees:80,hinge:'north',opens:'west-outside'},
  outerEntryOpening: {wallPlanX: 688, fromPlanY: 822, toPlanY: 867, heightMm: 2200},
  innerOpening: {wallPlanY: 715, fromPlanX: 515, toPlanX: 570, heightMm: 2100},
  // Owner mark 2026-09-30 (plan x 573-643, y 726-772), confirmed by the owner's screenshot of the dark pocket in the 3D
  // model: on the A501 plan there is a closed rectangle (plan x 577-680, y 726-772, about 925 mm = 3 ft deep and 2 m wide)
  // on the Main Entry side of the wall it shares with the Drawing Room. Nothing is drawn in it and it has no door onto the
  // Entry, so the owner reads it as an empty cavity from floor to ceiling. Between it and the Drawing Room is the wall
  // itself, drawn about 11 px (roughly 220 mm, a 9-inch wall) thick, plan y 715-726. Whether that pocket is really hollow,
  // and whether the 9-inch wall may be opened, is not on the drawing and needs checking on site.
  // Owner, later 2026-09-30, from the Blender render: the pocket has TWO openings. One is on its EAST side (Drawing Room frame;
  // the plan is drawn south-up, so that is the plan-left wall, plan x 575, facing the Entry gallery); the other is the north
  // opening cut from the Drawing Room (room.wallStorage). `eastOpening` is a door-height opening in the plan-left wall: the
  // width (about 800 mm) and 2100 mm head are working sizes, not measured; the wall x is the shaft/pocket wall line, plan x 575.
  wallCavity: {planX1: 577, planX2: 680, planY1: 726, planY2: 772, heightMm: 2700, wallPlanY1: 715, wallPlanY2: 726, status: 'owner says empty floor to ceiling; the drawing shows only a closed rectangle',
    eastOpening: {wallPlanX: 575, fromPlanY: 729, toPlanY: 769, heightMm: 2100}},
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
]

// The plan-left (east) wall of the pocket, from the Drawing Room wall down to the shaft box, with the east opening cut in it.
// Returns [segment, bottomMetres, topMetres] pieces so both 3D views draw the same wall; the other three sides of the pocket are
// ENTRY_WALL_SEGMENTS (Drawing Room wall y 715, shaft box y 775, outer wall x 688).
export function entryPocketEastWallSpans(ceilingM) {
  const w = ENTRY.wallCavity.eastOpening, x = w.wallPlanX, top = w.heightMm / 1000
  return [
    [[x, ENTRY.wallCavity.wallPlanY1, x, w.fromPlanY], 0, ceilingM],
    [[x, w.fromPlanY, x, w.toPlanY], top, ceilingM],
    [[x, w.toPlanY, x, ENTRY.shaft.planY1], 0, ceilingM],
  ]
}
