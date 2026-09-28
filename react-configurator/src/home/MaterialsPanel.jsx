import React,{useState,useSyncExternalStore} from 'react';
import {HOME_ROOMS} from './rooms.mjs';
import {MATERIALS} from './materialCatalog.mjs';
import {appearanceStore} from './appearanceStore.mjs';
import {getInteriorScenes,subscribeScenes} from '../render/interiorScene.js';
export default function MaterialsPanel(){
  const settings=useSyncExternalStore(appearanceStore.subscribe,appearanceStore.getSnapshot);
  const [room,setRoom]=useState('whole-home'),[error,setError]=useState('');
  const summary=useSyncExternalStore(subscribeScenes,()=>JSON.stringify(getInteriorScenes().map(scene=>({id:scene.id,ready:scene.ready,errors:scene.errors,surfaces:scene.surfaceCount}))));
  const change=(role,id)=>{try{const next=structuredClone(settings);if(room==='whole-home')next[role]=id;else{next.rooms[room]||={};if(id==='inherit')delete next.rooms[room][role];else next.rooms[room][role]=id;}appearanceStore.set(next);setError('');}catch(e){setError(e.message);}};
  return <section aria-label="Whole-home materials"><h3>Wood and plaster</h3><p>Species-specific Poly Haven PBR maps, served locally. Apply finishes throughout tagged woodwork and walls; dimensions and saved kitchen layouts stay unchanged. Choose Original to restore the authored finish.</p>
    {(error||appearanceStore.getError())&&<p role="alert">{error||appearanceStore.getError()}</p>}
    <label>Material scope<select value={room} onChange={e=>setRoom(e.target.value)}><option value="whole-home">Whole home</option>{HOME_ROOMS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
    {['wood','plaster'].map(role=><div key={role}><label>{role==='wood'?'Wood finish':'Wall plaster'}<select value={room==='whole-home'?settings[role]:settings.rooms[room]?.[role]??'inherit'} onChange={e=>change(role,e.target.value)}>{room!=='whole-home'&&<option value="inherit">Inherit whole-home finish</option>}<option value="original">Original authored finish</option>{MATERIALS.filter(m=>m.role===role).map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label><div className="interior-grid">{MATERIALS.filter(m=>m.role===role).map(m=><button className="interior-card" key={m.id} onClick={()=>change(role,m.id)}><span style={{display:'block',height:80,borderRadius:7,background:m.reliefOnly?m.color:`url(${import.meta.env.BASE_URL}materials/${m.asset}/basecolor.jpg) center / cover`}}/><span>{m.label}</span></button>)}</div></div>)}
    <label>Wood grain density (1 = source scale)<input type="range" min="0.25" max="4" step="0.25" value={settings.grainScale} onChange={e=>{try{appearanceStore.set({...settings,grainScale:Number(e.target.value)});}catch(err){setError(err.message);}}}/>{settings.grainScale}×</label>
    <h4>Mounted renderer coverage</h4>{JSON.parse(summary).length?JSON.parse(summary).map(scene=><p key={scene.id}>{scene.id}: {scene.surfaces} tagged surfaces · {scene.ready?'PBR ready':scene.errors.length?scene.errors.join('; '):'Loading maps…'}</p>):<p>Open a room’s 3D view to see live texture coverage. Changes also apply when you next open a room.</p>}
    <small>Veneer grain and plaster relief are visual samples, not a guarantee of a particular supplier’s finish. Ivory/white variants use the plaster relief with a painted colour.</small>
  </section>;
}
