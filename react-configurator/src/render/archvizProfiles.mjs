// Pure resolver shared by browser integration and dependency-free Node tests.
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const keys = (v, expected) => object(v) && Object.keys(v).sort().join('|') === [...expected].sort().join('|');
const fields = new Set(['label','lens','eyeHeight','corner','target','note','native','cameras']);
export function validateRoomProfile(value) {
  if (!object(value) || Object.keys(value).some(k => !fields.has(k))) throw Error('Invalid room profile or unknown field');
  if (typeof value.label !== 'string' || !value.label.trim() || value.label.trim().length > 200) throw Error('Invalid room label');
  if (!number(value.lens,10,150) || !number(value.eyeHeight,.5,3)) throw Error('Invalid lens or eye height');
  for (const key of ['corner','target']) if (!Array.isArray(value[key]) || value[key].length !== 2 || !value[key].every(x => number(x,0,1))) throw Error('Invalid normalized camera coordinates');
  if ('native' in value && (typeof value.native !== 'string' || !/^blender\/[A-Za-z0-9_./-]+\.blend$/.test(value.native) || value.native.split('/').some(p => ['', '.', '..'].includes(p)))) throw Error('Native source must be a repository Blender file');
  if ('cameras' in value && (!Array.isArray(value.cameras) || !value.cameras.length || value.cameras.length > 16 || value.cameras.some(x => typeof x !== 'string' || !x.length || x.length > 200))) throw Error('Invalid authored camera names');
  if ('note' in value && (typeof value.note !== 'string' || value.note.length > 4000)) throw Error('Invalid room note');
  return value;
}
export function resolveArchvizProfiles(manifest, readRoom) {
  if (!object(manifest) || ![1,2].includes(manifest.version) || !keys(manifest,['version','quality','rooms'])) throw Error('Unsupported profile format');
  if (!keys(manifest.quality,['draft','final','portfolio','test'])) throw Error('Invalid quality presets');
  for (const q of Object.values(manifest.quality)) {
    if (!keys(q,['width','height','samples','noiseThreshold']) || ['width','height','samples'].some(k => !Number.isInteger(q[k]) || !number(q[k],1,16384)) || !number(q.noiseThreshold,0,1)) throw Error('Invalid quality values');
  }
  if (!object(manifest.rooms) || !Object.keys(manifest.rooms).length || Object.keys(manifest.rooms).length > 32) throw Error('Invalid room registry');
  const rooms = {};
  for (const [room, entry] of Object.entries(manifest.rooms)) {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(room)) throw Error('Invalid room ID');
    if (manifest.version === 2 && entry !== `archviz/rooms/${room}.json`) throw Error('Room profile must use its canonical path');
    Object.defineProperty(rooms, room, {value:structuredClone(validateRoomProfile(manifest.version === 2 ? readRoom(entry) : entry)), enumerable:true, writable:true, configurable:true});
  }
  return {version:1, quality:structuredClone(manifest.quality), rooms};
}
