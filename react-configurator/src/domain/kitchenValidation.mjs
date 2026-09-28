import {checkLayoutBasics} from './layoutChecks.mjs';

export const REQUIRED_RULE_IDS = [
  'geometry-inputs', 'east-order', 'west-order', 'sink-storage',
  'door-clear-zone', 'walkway-minimum', 'collision', 'bounds',
];

/** One nominal plan measurement for UI and SVG; not an operable-door clearance. */
export function getPlanDimensions(kitchen, eastDepthMm, westDepthMm) {
  const values = [kitchen?.width, kitchen?.length, eastDepthMm, westDepthMm];
  if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)) {
    throw new TypeError('Plan dimensions must be positive finite numbers in millimeters.');
  }
  return {widthMm: kitchen.width, lengthMm: kitchen.length, eastDepthMm, westDepthMm,
    walkwayMm: kitchen.width - eastDepthMm - westDepthMm};
}

/** Retain the browser API shape, but require every rule, not just the two orders. */
export function summarizeValidation(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Validation rows must be an array.');
  const ids = rows.map(row => row?.id);
  const passing = rows.filter(row => row?.status === 'pass').length;
  return {
    eastOk: rows.some(row => row?.id === 'east-order' && row.status === 'pass'),
    westOk: rows.some(row => row?.id === 'west-order' && row.status === 'pass'),
    all: REQUIRED_RULE_IDS.every(id => ids.includes(id)) &&
      ids.every(id => typeof id === 'string' && id.length > 0) &&
      new Set(ids).size === ids.length && passing === rows.length,
    passing, total: rows.length, rows,
  };
}

/** Strict 3D AABB intersection. Touching faces are allowed. Inputs are prevalidated. */
export function findVolumeCollisions(boxes) {
  const overlaps = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.d && b.x < a.x + a.d &&
          a.y < b.y + b.w && b.y < a.y + a.w &&
          a.z < b.z + b.h && b.z < a.z + a.h) overlaps.push([a.id, b.id]);
    }
  }
  return overlaps;
}

/**
 * Executable kitchen rules shared by the UI, API and exported validation.
 * Coordinates: x west->east; y south->north; z upward; w spans y, d spans x.
 * Backsplash slider panels and electrical markers are excluded from collision
 * checks, NOT from input/bounds checks. This retains the existing panel policy.
 * The hob's 900..1020 mm collider retains the legacy effective stove envelope;
 * its legacy h=900 item record is not a literal 900 mm high cooktop.
 * Door swings, installation/service clearances and construction safety are not checked.
 */
export function buildKitchenValidationRows({east, west, kitchen, eastDepthMm, northHobOptionY}) {
  const basic = checkLayoutBasics({room: kitchen, east, west}, {
    eastDepthMm, westDepthMm: kitchen?.westCounterDepth,
    minimumWalkwayMm: kitchen?.walkway?.floor,
    westClearFromMm: kitchen?.westGap?.from, westClearToMm: kitchen?.westGap?.to,
  });
  const rows = [];
  const add = (id, rule, pass, measured, expected, fix, objectIds = []) => {
    rows.push({id, rule, status: pass ? 'pass' : 'fail', measured, expected, fix, objectIds});
  };
  const shapeIssues = basic.issues.filter(issue => ['layout-shape', 'constraints-shape', 'item-shape', 'duplicate-id'].includes(issue.ruleId));
  add('geometry-inputs', 'Geometry inputs and IDs', shapeIssues.length === 0,
    shapeIssues.length ? shapeIssues.map(issue => issue.message).join('; ') : 'finite geometry and unique IDs',
    'finite millimeter coordinates, positive active dimensions, boolean visibility and unique IDs',
    'Correct invalid geometry before checking the layout', shapeIssues.flatMap(issue => issue.objectIds));
  if (shapeIssues.length) return rows; // Incomplete checks must never summarize as valid.

  const active = item => item.hidden !== true;
  const e = east.filter(active), w = west.filter(active);
  const mw = e.find(item => item.id === 'microwave');
  const ag = e.find(item => item.id === 'applianceGarage');
  const gas = e.find(item => item.id === 'gas');
  const sliderE = e.find(item => item.id === 'eastBacksplashSlider');
  const baselineEast = ag?.w === 850 && ag?.d === 600 && [1200, northHobOptionY].includes(gas?.y);
  const refinedEast = ag?.w === 600 && ag?.d === 500 && ag?.h === 420 && [1350, northHobOptionY].includes(gas?.y);
  const eastOk = Boolean(mw && ag && gas && sliderE && mw.y === 0 && ag.y === 0 &&
    (baselineEast || refinedEast) && sliderE.d === 102 && mw.open && ag.open);
  add('east-order', 'East microwave, appliance garage and hob match a saved layout', eastOk,
    `microwave y${mw?.y ?? '?'} garage y${ag?.y ?? '?'} gas y${gas?.y ?? '?'}`,
    'baseline or refined east arrangement', 'Restore the baseline or apply the refined east cooking zone');

  const shaft = w.find(item => item.id === 'shaft');
  const washing = w.find(item => item.id === 'washing');
  const sink = w.find(item => item.id === 'sink');
  const dishwasher = w.find(item => item.id === 'dishwasher');
  const sliderW = w.find(item => item.id === 'westSixInchSlider');
  const rack = w.find(item => item.id === 'sinkUpperDishRack');
  const baselineWest = washing?.y === 610 && sink?.y === 1210 && dishwasher?.y === 1972 && sliderW?.y === 2572;
  const airyWest = washing?.y === 3308 && sink?.y === 2546 && dishwasher?.y === 1946 && sliderW?.y === 1200;
  const westOk = Boolean(washing && sink && dishwasher && sliderW && shaft && (baselineWest || airyWest) &&
    sliderW.d === 152 && shaft.y === kitchen.shaft.y && washing.open && dishwasher.open);
  add('west-order', 'West wet appliances match a saved layout', westOk,
    `washing y${washing?.y ?? '?'} sink y${sink?.y ?? '?'} dishwasher y${dishwasher?.y ?? '?'} shaft y${shaft?.y ?? '?'}`,
    'baseline or airy kitchen arrangement; shaft at north wall', 'Restore the baseline or apply the airy kitchen arrangement');
  add('sink-storage', 'Over-sink storage aligns with sink', Boolean(rack && sink && rack.y === sink.y && rack.w === sink.w),
    `sink y${sink?.y ?? '?'} rack y${rack?.y ?? '?'} rack width ${rack?.w ?? '?'} mm`,
    'rack at the sink position and width', 'Keep dish/utensil storage directly over the west sink');

  const issuesFor = id => basic.issues.filter(issue => issue.ruleId === id);
  const doorIssues = issuesFor('door-clear-zone');
  add('door-clear-zone', `West door clear zone y${kitchen.westGap.from}-y${kitchen.westGap.to} empty`, !doorIssues.length,
    doorIssues.length ? doorIssues.flatMap(issue => issue.objectIds).join(', ') : '0 items in zone',
    'full-height west door volume remains clear, including fixed objects', 'Move objects outside the protected volume',
    doorIssues.flatMap(issue => issue.objectIds));
  add('walkway-minimum', 'Nominal base-run walkway minimum', !issuesFor('walkway-minimum').length,
    `nominal floor ${basic.measurements.walkwayFloorMm} mm`, `nominal floor at least ${kitchen.walkway.floor} mm`,
    'Keep base-run depths within the configured aisle requirement');

  const colliders = [...e, ...w].filter(item => !item.backsplashSlider && !item.powerPoint &&
    !item.id.startsWith('powerPoint')).map(item => ({...item, z: item.z ?? (item.id === 'gas' ? 900 : 0),
    h: item.id === 'gas' ? 120 : item.h}));
  const collisions = findVolumeCollisions(colliders);
  add('collision', 'Cabinet/appliance collision', !collisions.length,
    collisions.length ? collisions.map(pair => pair.join('<->')).join(', ') : 'no checked volumes overlap',
    'separate physical volumes in x, y and z; backing slider panels and electrical markers excluded',
    'Separate overlapping objects; do not hide a failure by marking an object fixed', collisions.flat());
  const boundsIssues = issuesFor('bounds');
  add('bounds', 'Item outside room bounds', !boundsIssues.length,
    boundsIssues.length ? boundsIssues.flatMap(issue => issue.objectIds).join(', ') : 'all active items inside',
    `inside ${kitchen.width} x ${kitchen.length} x ${kitchen.height} mm, including fixed objects`,
    'Keep active object bounds inside the room in all three axes', boundsIssues.flatMap(issue => issue.objectIds));
  return rows;
}
