// Which whole-home palette the live 3D views preview. Stored on its own key, apart from the kitchen project and from
// home-interior.appearance.v1: choosing a palette never rewrites the saved wood/plaster choice, and going back to
// "today" restores exactly what that setting shows. No geometry lives here.
export const PALETTE_KEY='home-interior.palette.v1';
export const TODAY_PALETTE_ID='today';
const ID=/^[a-z0-9][a-z0-9-]{1,40}$/;
export function validatePaletteChoice(input){
  if(!input||input.schemaVersion!==1)throw new Error('Unsupported palette choice schema.');
  if(typeof input.palette!=='string'||!ID.test(input.palette))throw new Error('Invalid palette id.');
  return Object.freeze({schemaVersion:1,palette:input.palette});
}
export function parsePaletteChoice(raw){if(typeof raw!=='string'||raw.length>1000)throw new Error('Palette choice is too large.');return validatePaletteChoice(JSON.parse(raw));}
let state=validatePaletteChoice({schemaVersion:1,palette:TODAY_PALETTE_ID}),lastRaw=null,error='';
const listeners=new Set();
// An unreadable stored value leaves the default look in place; it is copied to .previous when a palette is next chosen.
try{if(typeof localStorage!=='undefined'){lastRaw=localStorage.getItem(PALETTE_KEY);if(lastRaw!==null)state=parsePaletteChoice(lastRaw);}}catch(e){error=e.message;}
const emit=()=>listeners.forEach(listener=>listener());
export const paletteStore={
  getSnapshot:()=>state,
  getError:()=>error,
  subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
  set(palette){
    const clean=validatePaletteChoice({schemaVersion:1,palette}),raw=JSON.stringify(clean);
    if(clean.palette===state.palette&&!error)return state;
    try{
      if(typeof localStorage!=='undefined'){
        if(lastRaw!==null&&lastRaw!==raw)localStorage.setItem(`${PALETTE_KEY}.previous`,lastRaw);
        localStorage.setItem(PALETTE_KEY,raw);
      }
    }catch(e){error=e.message;emit();throw e;}
    state=clean;lastRaw=raw;error='';emit();return state;
  },
};
