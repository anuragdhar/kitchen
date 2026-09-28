/**
 * Basic checks for legacy kitchen geometry, all in millimeters.
 * w is the y extent; d is the x extent; h is height; omitted z means zero.
 * This is NOT a collision, export, installation, or construction-safety validator.
 * @param {{room: object, east: object[], west: object[]}} layout
 * @param {{eastDepthMm: number, westDepthMm: number, minimumWalkwayMm: number,
 *   westClearFromMm: number, westClearToMm: number}} constraints
 * @returns {{valid: boolean, issues: object[], measurements: object}}
 */
export function checkLayoutBasics(layout, constraints) {
  const issues = [];
  const measurements = {};
  const issue = (ruleId, objectIds, message, measured = {}) =>
    issues.push({ruleId, objectIds, message, measured});
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const finish = () => ({valid: issues.length === 0, issues, measurements});

  if (!object(layout) || !object(layout.room) ||
      !['width', 'length', 'height'].every(key => finite(layout.room[key]) && layout.room[key] > 0) ||
      !Array.isArray(layout.east) || !Array.isArray(layout.west)) {
    issue('layout-shape', [], 'Expected positive finite room dimensions and east/west arrays.');
    return finish();
  }
  const keys = ['eastDepthMm', 'westDepthMm', 'minimumWalkwayMm', 'westClearFromMm', 'westClearToMm'];
  if (!object(constraints) || !keys.every(key => finite(constraints[key]) && constraints[key] >= 0) ||
      constraints.westClearFromMm > constraints.westClearToMm ||
      constraints.westClearToMm > layout.room.length) {
    issue('constraints-shape', [], 'Expected finite nonnegative depths, minimum aisle, and an in-room clear interval.');
    return finish();
  }
  const {room} = layout;
  measurements.walkwayFloorMm = room.width - constraints.eastDepthMm - constraints.westDepthMm;
  if (measurements.walkwayFloorMm < constraints.minimumWalkwayMm) {
    issue('walkway-minimum', [], 'Nominal base-run aisle is below the requested minimum.', {
      actualMm: measurements.walkwayFloorMm, minimumMm: constraints.minimumWalkwayMm,
    });
  }
  const ids = new Set();
  for (const wall of ['east', 'west']) {
    for (const item of layout[wall]) {
      if (!object(item) || typeof item.id !== 'string' || !item.id.trim()) {
        issue('item-shape', [], 'Each item requires a nonempty stable string ID.', {wall});
        continue;
      }
      if (ids.has(item.id)) issue('duplicate-id', [item.id], 'IDs must be unique across both walls.');
      ids.add(item.id);
      if (item.hidden !== undefined && typeof item.hidden !== 'boolean') {
        issue('item-shape', [item.id], 'hidden must be a boolean when supplied.');
        continue;
      }
      if (item.hidden === true) continue; // Retained zero-sized historical placeholders are inactive.
      const z = item.z === undefined ? 0 : item.z;
      if (!['x', 'y', 'w', 'd', 'h'].every(key => finite(item[key])) || !finite(z) ||
          !['w', 'd', 'h'].every(key => item[key] > 0)) {
        issue('item-shape', [item.id], 'Active items need finite coordinates and positive dimensions.');
        continue;
      }
      if (item.x < 0 || item.y < 0 || z < 0 || item.x + item.d > room.width ||
          item.y + item.w > room.length || z + item.h > room.height) {
        issue('bounds', [item.id], 'Active item extends outside the room.', {wall});
      }
      // Test real 3D overlap with the protected volume; touching its edge is allowed.
      const overlapMm = Math.min(item.y + item.w, constraints.westClearToMm) -
        Math.max(item.y, constraints.westClearFromMm);
      if (wall === 'west' && overlapMm > 0 && item.x < constraints.westDepthMm &&
          item.x + item.d > 0 && z < room.height && z + item.h > 0) {
        issue('door-clear-zone', [item.id], 'Item overlaps the full-height west door zone.', {overlapMm});
      }
    }
  }
  return finish();
}
