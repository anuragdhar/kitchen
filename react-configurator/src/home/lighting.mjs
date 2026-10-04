import {HOME_ROOMS,assertRoom} from './rooms.mjs';
export const LAYERS=Object.freeze(['daylight','ambient','cove','task','accent','cabinet']);
export const MODES=Object.freeze(['auto','day','evening','night','original']);
export const DEFAULT_LIGHTING=Object.freeze({schemaVersion:1,mode:'auto',intensity:1,layers:Object.freeze(Object.fromEntries(LAYERS.map(k=>[k,true]))),schedule:Object.freeze({dayStart:7,eveningStart:18,nightStart:21}),rooms:Object.freeze({})});
export const ROOM_LIGHTING=Object.freeze(Object.fromEntries(HOME_ROOMS.map(r=>[r.id,Object.freeze({
  label:r.label,
  task:r.id==='kitchen'?[.22,.49,.5]:r.id==='study'||r.id==='balcony'?[.65,.42,.66]:r.id.startsWith('bedroom')?[.2,.4,.56]:[.32,.55,.58],
  cabinet:r.id==='kitchen'?[.09,.5,.5]:r.id.startsWith('bedroom')?[.1,.72,.48]:r.id==='entry'?[.22,.75,.94]:[.16,.64,.42],
  taskGain:['kitchen','study','balcony'].includes(r.id)?1.3:.65,
  // Rooms that draw their own fixtures do not get the generic strip meshes of this overlay (the lights themselves stay):
  // the Drawing Room's floated in mid-air over the west sofa (owner 2026-10-04), and the Lobby's white strips along the north
  // and south walls and in the Pooja alcove were leftovers of the earlier design once the track lights came (owner, later
  // 2026-10-04: "old strip lights ... remove them"). Bedroom 1, Bedroom 3, the Study (Bedroom 2) and the Kitchen got track
  // lights the same day (config/*LightingConfig.js); the kitchen also draws its real under-cabinet LED strips itself.
  // The Main entry draws its own ROUND panel lights (rooms/entry/EntryCeilingLights.js): the owner wants circular lights
  // there, and these strips were showing as linear lights (owner 2026-10-04).
  ownFixtures:['drawing','entry','lobby','pooja','bedroom1','bedroom3','study','kitchen'].includes(r.id),
})])));
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function layers(value,partial=false){if(!object(value))throw Error('Invalid lighting layers.');const out={};for(const [key,v] of Object.entries(value)){if(!LAYERS.includes(key)||typeof v!=='boolean')throw Error('Unknown layer or non-boolean switch.');out[key]=v;}if(!partial&&LAYERS.some(k=>!(k in out)))throw Error('Missing lighting layer.');return Object.freeze(out);}
function strength(v){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>3)throw Error('Lighting intensity must be between 0 and 3.');return v;}
function mode(v){if(!MODES.includes(v))throw Error('Unknown lighting mode.');return v;}
export function validateLighting(input){
 if(!object(input)||input.schemaVersion!==1||!object(input.rooms)||!object(input.schedule))throw Error('Invalid lighting schema.');
 const {dayStart,eveningStart,nightStart}=input.schedule;if(![dayStart,eveningStart,nightStart].every(v=>Number.isInteger(v)&&v>=0&&v<24)||!(dayStart<eveningStart&&eveningStart<nightStart))throw Error('Schedule requires increasing day, evening and night start hours.');
 const rooms={};for(const [id,v] of Object.entries(input.rooms)){assertRoom(id);if(!object(v)||Object.keys(v).some(k=>!['mode','intensity','layers'].includes(k)))throw Error('Invalid lighting override.');rooms[id]=Object.freeze({...('mode'in v?{mode:mode(v.mode)}:{}),...('intensity'in v?{intensity:strength(v.intensity)}:{}),...('layers'in v?{layers:layers(v.layers,true)}:{})});}
 return Object.freeze({schemaVersion:1,mode:mode(input.mode),intensity:strength(input.intensity),layers:layers(input.layers),schedule:Object.freeze({dayStart,eveningStart,nightStart}),rooms:Object.freeze(rooms)});
}
export function parseLighting(raw){if(typeof raw!=='string'||raw.length>100000)throw Error('Lighting document exceeds 100 KB.');return validateLighting(JSON.parse(raw));}
export function lightingAt(settings,room,hour){
 assertRoom(room);if(typeof hour!=='number'||!Number.isFinite(hour)||hour<0||hour>=24)throw Error('Hour must be within [0,24).');
 const override=settings.rooms[room]||{},requested=override.mode??settings.mode;
 const {dayStart,eveningStart,nightStart}=settings.schedule;
 const resolved=requested==='auto'?(hour>=dayStart&&hour<eveningStart?'day':hour>=eveningStart&&hour<nightStart?'evening':'night'):requested;
 const profiles={day:{kelvin:4500,ambient:.55,cove:.35,task:1,accent:.3,cabinet:.8,daylight:1},evening:{kelvin:3300,ambient:.8,cove:.8,task:.85,accent:.65,cabinet:.8,daylight:.16},night:{kelvin:2700,ambient:.32,cove:.5,task:.4,accent:.32,cabinet:.4,daylight:.015},original:{kelvin:4500,ambient:0,cove:0,task:0,accent:0,cabinet:0,daylight:1}};
 const p=profiles[resolved],enabled={...settings.layers,...override.layers},intensity=override.intensity??settings.intensity;
 return {mode:resolved,kelvin:p.kelvin,levels:Object.fromEntries(LAYERS.map(k=>[k,(enabled[k]?p[k]:0)*intensity]))};
}
/** Approximate display RGB for warm/cool previews; Blender can use the Kelvin metadata. */
export function kelvinRgb(kelvin){
 if(!Number.isFinite(kelvin)||kelvin<1000||kelvin>12000)throw Error('Kelvin out of preview range.');
 const t=kelvin/100,clamp=n=>Math.max(0,Math.min(255,n))/255;
 return [clamp(t<=66?255:329.698727446*(t-60)**-.1332047592),clamp(t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*(t-60)**-.0755148492),clamp(t>=66?255:t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307)];
}
