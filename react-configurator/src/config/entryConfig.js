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
