import React,{useState,useSyncExternalStore} from 'react';
import profiles from '../../../configs/archviz-profiles.json';
import {getInteriorScenes,subscribeScenes} from '../render/interiorScene.js';
import {exportArchvizBundle,downloadArchvizBundle} from '../render/archvizExport.js';
import {validateRenderGallery} from '../render/archvizContract.mjs';

export default function ArchvizPanel(){
  const summary=useSyncExternalStore(subscribeScenes,()=>JSON.stringify(getInteriorScenes().map(r=>({id:r.id,ready:r.ready,errors:r.errors}))));
  const records=JSON.parse(summary);
  const [selectedScene,setSelectedScene]=useState(''),[room,setRoom]=useState(''),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState(''),[gallery,setGallery]=useState(null);
  const sceneId=records.some(r=>r.id===selectedScene)?selectedScene:records[0]?.id||'';
  const ready=records.find(r=>r.id===sceneId)?.ready;
  async function download(){
    setBusy(true);setMessage('Capturing the actual editable scene, textures and camera…');
    try{
      const {blob,manifest}=await exportArchvizBundle(sceneId,room);
      downloadArchvizBundle(blob,room);
      setMessage(`Exported ${manifest.meshes.length} source meshes with a checksum and reference screenshot. This is a render input package, not a completed Blender render.`);
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  async function load(){
    setBusy(true);
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}renders/archviz/manifest.json`,{cache:'no-store'});
      if(!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('No completed room renders found. Run Blender first, then load again.');
      setGallery(validateRenderGallery(await response.json()));setMessage('Completed stills loaded. Their visual review status is shown below.');
    }catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  return <section aria-label="Current design Blender export">
    <h3>Current design → Blender</h3>
    <p>Use this for the kitchen and balcony office: it exports the <strong>actual editable 3D scene</strong>, not the older whole-home Blender model. Furniture positions, selected finishes, desk height and visible cabinet state travel with the export.</p>
    <p>Open the room’s <strong>Editable workspace</strong> and its 3D view first. Choose an interior camera and the intended door/wall visibility. The room profile below controls photographic treatment; it does not crop or replace the source geometry.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12}}>
      <label>Source 3D scene<select aria-label="Source 3D scene" value={sceneId} onChange={e=>setSelectedScene(e.target.value)} disabled={busy}>
        {!records.length&&<option value="">Open an editable 3D room first</option>}
        {records.map(r=><option key={r.id} value={r.id}>{r.id} — {r.ready?'ready':r.errors.length?r.errors.join('; '):'loading'}</option>)}
      </select></label>
      <label>Room render profile<select aria-label="Room render profile" value={room} onChange={e=>setRoom(e.target.value)} disabled={busy}>
        <option value="">Select the room shown in the source scene</option>
        {Object.entries(profiles.rooms).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}
      </select></label>
    </div>
    {room&&<p>{profiles.rooms[room].note||'Retain the authored furnishings and finishes; use a room-specific camera and lighting pass.'}</p>}
    <div className="interior-row" style={{marginTop:12,flexWrap:'wrap'}}>
      <button disabled={busy||!ready||!room} onClick={download}>{busy?'Working…':'Export current design for Blender'}</button>
      <button disabled={busy} onClick={load}>Load completed room renders</button>
    </div>
    <p role="status" aria-live="polite">{message}</p>
    <details><summary>Run the exported room</summary>
      <p>From the repository root, using your installed Blender executable:</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>blender --background --python-exit-code 1 --python blender/render_archviz.py -- --bundle "path/to/A501-{room||'room'}-archviz.zip" --quality draft</pre>
      <p>The ZIP contains the model, source audit and reference screenshot. Use <code>--quality final</code> or <code>--quality portfolio</code> after reviewing the draft. Blender prints a progress heartbeat every 30 seconds during each render.</p>
      <p>Drawing Room and Bedroom 3 can also render their detailed authored Blender sources with <code>--room drawing</code> or <code>--room bedroom3</code>. These are explicitly identified as snapshots, not current browser edits.</p>
    </details>
    <p><small>No existing saved project, layout, source model or baked interactive preview is overwritten. Images still need visual review; geometry checks do not certify construction clearances.</small></p>
    {gallery&&gallery.renders.filter(r=>!room||r.room===room).map(render=><section key={render.room}>
      <h4>{profiles.rooms[render.room]?.label||render.room} · {render.quality}</h4>
      <p><small>{render.sourceKind} · {render.reviewStatus||'unreviewed'} · job {render.job}</small></p>
      <div className="interior-grid">{render.images.map(image=><figure className="interior-card" key={image.url} style={{margin:0}}>
        <img loading="lazy" src={`${import.meta.env.BASE_URL}${image.url.replace(/^\//,'')}`} alt={`${render.room}: ${image.label}`} style={{width:'100%',height:'auto'}}/>
        <figcaption>{image.label}</figcaption>
      </figure>)}</div>
    </section>)}
  </section>;
}
