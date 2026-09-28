import React,{useState,useSyncExternalStore} from 'react';
import {HOME_ROOMS} from './rooms.mjs';
import {LAYERS,MODES,lightingAt} from './lighting.mjs';
import {lightingStore} from './lightingStore.mjs';
export default function LightingPanel(){
 const state=useSyncExternalStore(lightingStore.subscribe,lightingStore.getSnapshot),[room,setRoom]=useState('whole-home'),[error,setError]=useState('');
 const edit=patch=>{try{let next=structuredClone(state);if(room==='whole-home')Object.assign(next,patch);else next.rooms[room]={...next.rooms[room],...patch};lightingStore.set(next);setError('');}catch(e){setError(e.message);}};
 const selected=room==='whole-home'?state:state.rooms[room]||{};
 const now=new Date(),current=lightingAt(state,room==='whole-home'?'entry':room,now.getHours()+now.getMinutes()/60);
 return <section aria-label="Layered lighting"><h3>Layered light, from daylight to warm evenings</h3><p>Day 4500 K · Evening 3300 K · Night 2700 K. Auto follows this browser’s local clock while the app is open. These are visual design presets, not an electrical or lux calculation.</p>
 {(error||lightingStore.getError())&&<p role="alert">{error||lightingStore.getError()}</p>}
 <label>Lighting scope<select aria-label="Lighting scope" value={room} onChange={e=>setRoom(e.target.value)}><option value="whole-home">Whole home</option>{HOME_ROOMS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
 <label>Lighting mode<select aria-label="Lighting mode" value={selected.mode??'inherit'} onChange={e=>{if(e.target.value==='inherit'){const next=structuredClone(state);delete next.rooms[room];try{lightingStore.set(next);}catch(err){setError(err.message);}}else edit({mode:e.target.value});}}>{room!=='whole-home'&&<option value="inherit">Inherit whole home</option>}{MODES.map(m=><option key={m} value={m}>{m==='original'?'Original authored lights':m}</option>)}</select></label>
 <p>Current preview: <strong>{current.mode}, {current.kelvin} K</strong></p>
 <div className="interior-grid">{LAYERS.map(layer=><label key={layer}><input aria-label={layer} type="checkbox" checked={selected.layers?.[layer]??state.layers[layer]} onChange={e=>edit({layers:{...(selected.layers||{}),[layer]:e.target.checked}})}/>{layer==='cabinet'?'Cabinet / wardrobe strips':layer==='cove'?'Cove / indirect strips':layer}</label>)}</div>
 <label>Room light level<input type="range" min="0" max="3" step="0.1" value={selected.intensity??state.intensity} onChange={e=>edit({intensity:Number(e.target.value)})}/>{selected.intensity??state.intensity}×</label>
 {room==='whole-home'&&<fieldset><legend>Automatic schedule — local hour</legend><div className="interior-grid">{Object.entries(state.schedule).map(([key,value])=><label key={key}>{key}<input type="number" min="0" max="23" value={value} onChange={e=>edit({schedule:{...state.schedule,[key]:Number(e.target.value)}})}/></label>)}</div></fieldset>}
 <p>Individual room views render separate area-light layers. The whole-home preview combines illumination per room to keep interactive rendering affordable; exported Blender fixtures remain separate. Area-light shadows and bounce lighting are resolved in Blender, not calibrated in this preview.</p>
 </section>;
}
