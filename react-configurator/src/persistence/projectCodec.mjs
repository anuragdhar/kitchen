/** Versioned kitchen project documents. No React, storage, or geometry mutations. */
export const PROJECT_FORMAT = 'kitchen-project';
export const PROJECT_SCHEMA_VERSION = 1;
export const MAX_PROJECT_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS = 1000;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const firstDefined = (first, second) => first === undefined ? second : first;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = message => { throw new Error(message); };
const finite = value => typeof value === 'number' && Number.isFinite(value);
const color = value => typeof value === 'string' && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value);

// Reject non-JSON values before serialization can silently turn NaN into null.
// Bound nested metadata and disallow keys that could affect object prototypes.
function checkJSON(value, depth = 0, budget = {nodes: 0}) {
  if (depth > 24 || ++budget.nodes > 100000) fail('Project metadata is too large or too deeply nested.');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!finite(value)) fail('Numbers must be finite.'); return; }
  if (typeof value === 'string') { if (value.length > MAX_PROJECT_BYTES) fail('Project text is too large.'); return; }
  if (Array.isArray(value)) {
    for (const entry of value) checkJSON(entry, depth + 1, budget);
    return;
  }
  if (!isObject(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('Expected plain JSON data.');
  for (const [key, entry] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(`Unsupported metadata key: ${key}`);
    checkJSON(entry, depth + 1, budget);
  }
}

function readInput(input) {
  if (typeof input === 'string') {
    if (new TextEncoder().encode(input).length > MAX_PROJECT_BYTES) fail('Project file exceeds 2 MiB.');
    try { input = JSON.parse(input.replace(/^\uFEFF/, '')); }
    catch { fail('Invalid project JSON.'); }
  }
  checkJSON(input);
  if (!isObject(input)) fail('Project must be a JSON object.');
  const text = JSON.stringify(input);
  if (new TextEncoder().encode(text).length > MAX_PROJECT_BYTES) fail('Project file exceeds 2 MiB.');
  return JSON.parse(text); // Detached data, including all retained item metadata.
}

function checkRoom(room, expected, legacy) {
  if (room === undefined && legacy) return;
  if (!isObject(room)) fail('Project room dimensions are missing.');
  for (const key of ['width', 'length', 'height']) {
    if (legacy && key === 'height' && room[key] === undefined) continue;
    if (!finite(room[key]) || room[key] !== expected[key]) {
      fail(`Room ${key} does not match this kitchen (${expected[key]} mm). No layout was applied.`);
    }
  }
  if (room.unit !== undefined && room.unit !== 'mm') fail('Room units must be mm.');
}

function checkItems(items, wall, ids) {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) fail(`${wall} must contain at most ${MAX_ITEMS} items.`);
  for (const item of items) {
    if (!isObject(item) || typeof item.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(item.id)) fail(`Invalid ${wall} item ID.`);
    if (ids.has(item.id)) fail(`Duplicate item ID: ${item.id}`);
    ids.add(item.id);
    for (const key of ['hidden', 'fixed', 'locked', 'open', 'noCover', 'wallMounted', 'backsplashSlider', 'sliderDoor']) {
      if (own(item, key) && typeof item[key] !== 'boolean') fail(`${item.id}.${key} must be boolean.`);
    }
    for (const key of ['x', 'y', 'w', 'd', 'h']) {
      if (!finite(item[key]) || Math.abs(item[key]) > 1000000) fail(`${item.id}.${key} must be a finite millimeter value.`);
    }
    if (own(item, 'z') && (!finite(item.z) || Math.abs(item.z) > 1000000)) fail(`${item.id}.z must be finite.`);
    for (const key of ['w', 'd', 'h']) {
      if (item[key] < 0 || (item.hidden !== true && item[key] === 0)) fail(`${item.id}.${key} must be positive for an active item.`);
    }
    if (own(item, 'color') && !color(item.color)) fail(`${item.id}.color must be a hex color.`);
    if (own(item, 'label') && typeof item.label !== 'string') fail(`${item.id}.label must be text.`);
  }
}

function checkModules(modules, wall) {
  if (!Array.isArray(modules) || modules.length > MAX_ITEMS) fail(`Invalid ${wall} module list.`);
  const ids = new Set();
  for (const module of modules) {
    if (!isObject(module) || typeof module.id !== 'string' || !module.id || ids.has(module.id)) fail(`Invalid or duplicate ${wall} module ID.`);
    ids.add(module.id);
    if (!finite(module.width) || module.width <= 0 || module.width > 1000000) fail(`Invalid ${wall} module width.`);
    if (module.drawers !== undefined && (!Number.isInteger(module.drawers) || module.drawers < 0)) fail('Drawer count must be a nonnegative integer.');
  }
}

/** Validate serializable state, not design approval. Invalid design drafts remain savable. */
export function checkProjectState(state, kitchen) {
  if (!isObject(state)) fail('Missing project state.');
  const ids = new Set();
  checkItems(state.east, 'east', ids);
  checkItems(state.west, 'west', ids);
  if (![0, 50, 100].includes(state.grid)) fail('Grid must be 0, 50, or 100 mm.');
  if (typeof state.hide3DObstructions !== 'boolean') fail('Cutaway option must be boolean.');
  for (const key of ['eastTopUpperDepth', 'westTopUpperDepth']) {
    if (!finite(state[key]) || state[key] <= 0 || state[key] > kitchen.width) fail(`Invalid ${key}.`);
  }
  if (!isObject(state.materials)) fail('Materials must be an object.');
  for (const [key, value] of Object.entries(state.materials)) {
    // Existing finish values are textual; color entries must remain safe SVG attributes.
    if (key.toLowerCase().includes('finish') && !color(value)) {
      if (typeof value !== 'string' || !/^[\w .()/-]{1,100}$/.test(value)) fail(`Invalid material finish: ${key}`);
    } else if (!color(value)) fail(`Material ${key} must be a hex color.`);
  }
  checkModules(state.eastModules, 'east');
  checkModules(state.westModules, 'west');
}

function fromLegacyItem(item, defaults, model) {
  if (!isObject(item)) fail('Every imported item must be an object.');
  const known = [...defaults.east, ...defaults.west].find(candidate => candidate.id === item.id);
  const result = {...known, ...item};
  // The rich shaft model uses global width/depth; short aliases are already wall-local.
  const shaft = model && (item.id === 'shaft' || item.category === 'shaft');
  for (const [short, long] of [['w', shaft ? 'depth' : 'width'], ['d', shaft ? 'width' : 'depth'], ['h', 'height']]) {
    result[short] = firstDefined(item[short], item[long]);
  }
  // Never invent/repair geometry from a default merely because a field is absent.
  result.x = item.x; result.y = item.y;
  if (own(item, 'locked') && !own(item, 'fixed')) result.fixed = item.locked;
  if (!own(item, 'color') && !known?.color) result.color = '#cccccc';
  return result;
}

/** v0 adapters are shape-based, never keyed by appliance position. */
export function decodeProject(input, {kitchen, defaults}) {
  const data = readInput(input);
  const legacy = !own(data, 'schemaVersion');
  if (!legacy && (data.schemaVersion !== PROJECT_SCHEMA_VERSION || data.format !== PROJECT_FORMAT)) {
    fail(`Unsupported project schema or format (${String(data.schemaVersion)}). Original file was not changed.`);
  }
  if ((!legacy || own(data, 'unit')) && data.unit !== 'mm') fail('Project units must be mm.');
  const model = data.layoutModel;
  if (model?.unit !== undefined && model.unit !== 'mm') fail('Layout model units must be mm.');
  checkRoom(firstDefined(data.kitchen, model?.room), kitchen, legacy);
  const warnings = legacy ? ['Imported legacy project without moving or resetting any supplied item.'] : [];
  let east, west;
  if (own(data, 'east') || own(data, 'west')) {
    if (!Array.isArray(data.east) || !Array.isArray(data.west)) fail('Both east and west item arrays are required.');
    east = data.east; west = data.west;
    if (legacy) {
      east = east.map(item => fromLegacyItem(item, defaults, false));
      west = west.map(item => fromLegacyItem(item, defaults, false));
    }
  } else if (legacy && isObject(model) && Array.isArray(model.appliances)) {
    if (model.appliances.some(item => !isObject(item) || !['east', 'west'].includes(item.wall))) fail('Unsupported or missing appliance wall.');
    east = model.appliances.filter(item => item.wall === 'east').map(item => fromLegacyItem(item, defaults, true));
    west = model.appliances.filter(item => item.wall === 'west').map(item => fromLegacyItem(item, defaults, true));
    warnings.push('Converted layoutModel geometry to wall-local dimensions; inspect the imported design before use.');
  } else fail('No supported kitchen layout found.');
  if (data.modules !== undefined && !isObject(data.modules)) fail('Modules must contain east and west lists.');
  if (data.viewOptions !== undefined && !isObject(data.viewOptions)) fail('Invalid view options.');
  const required = (value, fallback, name) => {
    if (value !== undefined) return value;
    if (!legacy) fail(`Missing project field: ${name}`);
    warnings.push(`Missing ${name}; used the documented default.`);
    return structuredClone(fallback);
  };
  const state = {
    east, west,
    grid: required(data.grid, defaults.grid, 'grid'),
    materials: required(data.materials, defaults.materials, 'materials'),
    eastModules: required(firstDefined(data.modules?.east, data.eastModules), defaults.eastModules, 'east modules'),
    westModules: required(firstDefined(data.modules?.west, data.westModules), defaults.westModules, 'west modules'),
    eastTopUpperDepth: required(data.eastTopUpperDepth, defaults.eastTopUpperDepth, 'east upper depth'),
    westTopUpperDepth: required(data.westTopUpperDepth, defaults.westTopUpperDepth, 'west upper depth'),
    hide3DObstructions: required(firstDefined(data.viewOptions?.hide3DObstructions, data.hide3DObstructions), defaults.hide3DObstructions, 'cutaway option'),
  };
  if (legacy) {
    // Fill missing appearance keys deterministically, never from the currently open project.
    if (!isObject(state.materials)) fail('Materials must be an object.');
    state.materials = {...defaults.materials, ...state.materials};
  }
  checkJSON(state);
  checkProjectState(state, kitchen);
  if (!legacy && Object.keys(defaults.materials).some(key => !own(state.materials, key))) fail('Missing required material entries.');
  return {state, warnings, migratedFrom: legacy ? 0 : PROJECT_SCHEMA_VERSION};
}

export function encodeProject(state, kitchen) {
  checkJSON(state);
  checkProjectState(state, kitchen);
  const document = {
    format: PROJECT_FORMAT, schemaVersion: PROJECT_SCHEMA_VERSION, unit: 'mm',
    kitchen, east: state.east, west: state.west, grid: state.grid, materials: state.materials,
    modules: {east: state.eastModules, west: state.westModules},
    eastTopUpperDepth: state.eastTopUpperDepth, westTopUpperDepth: state.westTopUpperDepth,
    viewOptions: {hide3DObstructions: state.hide3DObstructions},
  };
  return readInput(document);
}
