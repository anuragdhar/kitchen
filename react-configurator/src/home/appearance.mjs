import {assertRoom} from './rooms.mjs';
import {getMaterial} from './materialCatalog.mjs';
// The kitchen starts in white oak (owner inspiration 2026-10-03: a light knotty oak finish); other rooms keep teak.
// A saved appearance in the browser still wins: choose it there under Interior studio > Materials.
export const DEFAULT_APPEARANCE=Object.freeze({schemaVersion:1,wood:'teak',plaster:'plaster-ivory',grainScale:1,rooms:Object.freeze({kitchen:Object.freeze({wood:'white-oak'})})});
export function validateAppearance(input){
  if(!input||input.schemaVersion!==1)throw new Error('Unsupported interior appearance schema.');
  getMaterial(input.wood,'wood');getMaterial(input.plaster,'plaster');
  if(typeof input.grainScale!=='number'||!Number.isFinite(input.grainScale)||input.grainScale<.25||input.grainScale>4)throw new Error('Grain scale must be between 0.25 and 4.');
  if(!input.rooms||typeof input.rooms!=='object'||Array.isArray(input.rooms))throw new Error('Expected room overrides.');
  const rooms={};
  for(const [id,override] of Object.entries(input.rooms)){
    assertRoom(id);if(!override||typeof override!=='object'||Array.isArray(override))throw new Error('Invalid room override.');
    rooms[id]={};
    for(const [role,value] of Object.entries(override)){
      if(!['wood','plaster'].includes(role))throw new Error('Unknown override property.');
      getMaterial(value,role);rooms[id][role]=value;
    }
    Object.freeze(rooms[id]);
  }
  return Object.freeze({schemaVersion:1,wood:input.wood,plaster:input.plaster,grainScale:input.grainScale,rooms:Object.freeze(rooms)});
}
export function effectiveMaterials(settings,room){return {wood:settings.rooms[room]?.wood??settings.wood,plaster:settings.rooms[room]?.plaster??settings.plaster,grainScale:settings.grainScale};}
export function parseAppearance(raw){if(typeof raw!=='string'||raw.length>100_000)throw new Error('Interior settings exceed 100 KB.');return validateAppearance(JSON.parse(raw));}
