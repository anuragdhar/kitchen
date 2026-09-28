import {DEFAULT_LIGHTING,parseLighting,validateLighting} from './lighting.mjs';
// No geometry lives here. Kitchen persistence and its recovery keys remain independent.
export const LIGHTING_KEY='home-interior.lighting.v1';
let state=validateLighting(DEFAULT_LIGHTING),revision=0,lastRaw=null,blocked=false,error='';
const listeners=new Set();
try{if(typeof localStorage!=='undefined'){lastRaw=localStorage.getItem(LIGHTING_KEY);if(lastRaw!==null)state=parseLighting(lastRaw);}}catch(e){blocked=true;error=e.message;}
const emit=()=>listeners.forEach(listener=>listener());
export const lightingStore={
  getSnapshot:()=>state,
  getRevision:()=>revision,
  getError:()=>error,
  subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
  set(next,expectedRevision=revision){
    if(expectedRevision!==revision)throw new Error('Interior settings changed; refresh the proposal.');
    if(blocked)throw new Error(`Stored interior settings are protected: ${error}`);
    const clean=validateLighting(next),raw=JSON.stringify(clean);
    if(raw===JSON.stringify(state))return state;
    try{
      if(typeof localStorage!=='undefined'){
        if(localStorage.getItem(LIGHTING_KEY)!==lastRaw)throw new Error('Another tab changed interior settings. Reload before editing.');
        if(lastRaw!==null)localStorage.setItem(`${LIGHTING_KEY}.previous`,lastRaw);
        localStorage.setItem(LIGHTING_KEY,raw);
      }
    }catch(e){error=e.message;emit();throw e;}
    state=clean;revision++;lastRaw=raw;error='';emit();return state;
  },
};
