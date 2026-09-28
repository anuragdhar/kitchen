import {DEFAULT_APPEARANCE,parseAppearance,validateAppearance} from './appearance.mjs';
// No geometry lives here. Kitchen persistence and its recovery keys remain independent.
export const APPEARANCE_KEY='home-interior.appearance.v1';
let state=validateAppearance(DEFAULT_APPEARANCE),revision=0,lastRaw=null,blocked=false,error='';
const listeners=new Set();
try{if(typeof localStorage!=='undefined'){lastRaw=localStorage.getItem(APPEARANCE_KEY);if(lastRaw!==null)state=parseAppearance(lastRaw);}}catch(e){blocked=true;error=e.message;}
const emit=()=>listeners.forEach(listener=>listener());
export const appearanceStore={
  getSnapshot:()=>state,
  getRevision:()=>revision,
  getError:()=>error,
  subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
  set(next,expectedRevision=revision){
    if(expectedRevision!==revision)throw new Error('Interior settings changed; refresh the proposal.');
    if(blocked)throw new Error(`Stored interior settings are protected: ${error}`);
    const clean=validateAppearance(next),raw=JSON.stringify(clean);
    if(raw===JSON.stringify(state))return state;
    try{
      if(typeof localStorage!=='undefined'){
        if(localStorage.getItem(APPEARANCE_KEY)!==lastRaw)throw new Error('Another tab changed interior settings. Reload before editing.');
        if(lastRaw!==null)localStorage.setItem(`${APPEARANCE_KEY}.previous`,lastRaw);
        localStorage.setItem(APPEARANCE_KEY,raw);
      }
    }catch(e){error=e.message;emit();throw e;}
    state=clean;revision++;lastRaw=raw;error='';emit();return state;
  },
};
