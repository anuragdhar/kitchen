// Turns a whole-home palette into material specs for the two roles the material system themes (tagged wood and
// tagged plaster). Pure. The built-in "today" palette returns null everywhere, so the renderer keeps using
// Interior studio > Materials exactly as before.
import {getMaterial} from './materialCatalog.mjs';
import {HOME_ROOMS} from './rooms.mjs';
import {paletteSceneMapping,veneerTint} from './palette.mjs';
import {HOME_PALETTES} from '../config/homePaletteConfig.js';

// Average colour of each bundled veneer base-colour map (public/materials/<asset>/basecolor.jpg scaled to 16x16 and
// averaged, 2026-10-05). A palette wood is the nearest species' grain multiplied by a tint that brings this average to
// the palette's hex; it is a preview of tone, not a supplier's sample.
export const VENEER_AVERAGE=Object.freeze({teak:'#af8257','white-oak':'#907962','red-oak':'#c3ab91',cherry:'#e0b084'});
// Scene room ids that are not in the stable room list.
const ROOM_ALIAS=Object.freeze({kitchenShell:'kitchen'});
const cache=new Map();
function sceneMapping(paletteId){
  if(!cache.has(paletteId)){
    const palette=HOME_PALETTES.find(value=>value.id===paletteId);
    cache.set(paletteId,palette?paletteSceneMapping(palette,HOME_ROOMS):null);
  }
  return cache.get(paletteId);
}
/**
 * The material spec for a tagged surface under a palette, or null when the palette does not decide it (the built-in
 * look, an unknown palette id, an unmapped room, or a role the palette leaves alone): the caller then falls back to the
 * saved appearance setting.
 */
export function paletteSurfaceSpec(paletteId,room,role){
  const entry=sceneMapping(paletteId)?.[ROOM_ALIAS[room]||room]?.[role];
  if(!entry||!['wood','plaster'].includes(role))return null;
  // One spec object per finish, so the renderer loads and caches each one once.
  const id=role==='wood'?`palette-${paletteId}-${entry.species}-${entry.hex.slice(1)}`:`palette-${paletteId}-plaster-${entry.hex.slice(1)}`;
  if(!specs.has(id))specs.set(id,Object.freeze(role==='wood'
    ?{...getMaterial(entry.species,'wood'),id,color:veneerTint(entry.hex,VENEER_AVERAGE[entry.species]).tint}
    :{...getMaterial('plaster-ivory','plaster'),id,color:entry.hex}));
  return specs.get(id);
}
const specs=new Map();
