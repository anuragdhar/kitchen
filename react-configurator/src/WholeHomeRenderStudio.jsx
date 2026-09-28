import React,{useState} from 'react'
import {BLENDER_ROOM_VIEWS} from './config/homeRoomViews.js'
import {ENTRY} from './config/entryConfig.js'
import {ARTIFACTS,PRESETS,QUALITIES,buildHomeRenderJob,readRenderIndex} from './domain/wholeHomeRender.mjs'

const button={padding:'9px 14px',border:'1px solid #b9afa2',borderRadius:8,background:'#fff',color:'#30281f',cursor:'pointer'}
const control={...button,width:'100%',marginTop:5}

async function readJson(url){
  const response=await fetch(url,{cache:'no-store'})
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('No generated output is available yet. Run the Blender command shown below, then load again.')
  return response.json()
}

export default function WholeHomeRenderStudio(){
  const [room,setRoom]=useState('drawing')
  const [preset,setPreset]=useState('day')
  const [quality,setQuality]=useState('draft')
  const [selections,setSelections]=useState({})
  const [surfaces,setSurfaces]=useState([])
  const [renders,setRenders]=useState(null)
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const selected=selections[room]||[]

  async function load(kind){
    setBusy(true)
    setMessage('')
    try{
      const value=await readJson(`/renders/whole-home-realistic/${kind==='surfaces'?'surfaces':'manifest'}.json`)
      if(kind==='surfaces'){
        if(value.schema!=='a501.render-surfaces'||value.version!==1||!Array.isArray(value.surfaces)||value.surfaces.length>20000)throw new Error('Invalid surface inventory.')
        const valid=value.surfaces.every(s=>typeof s.room==='string'&&typeof s.object==='string'&&Array.isArray(s.kinds)&&s.kinds.every(k=>ARTIFACTS.some(a=>a.id===k))&&Array.isArray(s.bounds)&&s.bounds.length===2&&s.bounds.every(b=>Array.isArray(b)&&b.length===3&&b.every(Number.isFinite)))
        if(!valid)throw new Error('Invalid support-surface coordinates.')
        setSurfaces(value.surfaces)
        setMessage(`${value.surfaces.length} candidate surfaces loaded. Confirm the chosen object is furniture intended to support decor, not seating.`)
      }else{
        setRenders(readRenderIndex(value))
        setMessage('Generated Blender stills loaded. The existing interactive model is unchanged.')
      }
    }catch(error){setMessage(error.message)}finally{setBusy(false)}
  }

  function choose(kind,support){
    setSelections(previous=>({...previous,[room]:[
      ...(previous[room]||[]).filter(item=>item.kind!==kind),
      ...(support?[{kind,support}]:[]),
    ]}))
  }

  function download(){
    try{
      const job=buildHomeRenderJob(BLENDER_ROOM_VIEWS,ENTRY.planScale,selections,preset,quality)
      const url=URL.createObjectURL(new Blob([JSON.stringify(job,null,2)+'\n'],{type:'application/json'}))
      const link=document.createElement('a')
      link.href=url
      link.download='whole-home-render-job.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
      setMessage('Render job downloaded. Save it to blender/whole_home/realistic/job.json, then run Blender. This download does not start a render or change your saved layout.')
    }catch(error){setMessage(error.message)}
  }

  return <section aria-labelledby="whole-home-render-title" style={{padding:20,marginBottom:24,border:'1px solid #ded3c5',borderRadius:12,background:'#f1e9dc',color:'#30281f'}}>
    <h2 id="whole-home-render-title" style={{margin:'0 0 8px'}}>Whole-home Blender render studio</h2>
    <p style={{maxWidth:850,lineHeight:1.5}}>Use the drawing-room finish approach across the existing home: warm plaster, walnut, linen, limestone and bronze. Select small decorative artifacts on existing surfaces. Blender produces the images locally; these controls never move furniture or modify saved projects.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,210px),1fr))',gap:14}}>
      <label>Room<select value={room} onChange={event=>setRoom(event.target.value)} style={control}>
        {Object.values(BLENDER_ROOM_VIEWS).map(item=><option key={item.key} value={item.key}>{item.name}</option>)}
      </select></label>
      <label>Lighting<select value={preset} onChange={event=>setPreset(event.target.value)} style={control}>
        {PRESETS.map(value=><option key={value}>{value}</option>)}
      </select></label>
      <label>Render quality<select value={quality} onChange={event=>setQuality(event.target.value)} style={control}>
        {QUALITIES.map(value=><option key={value}>{value}</option>)}
      </select></label>
    </div>
    <fieldset style={{border:'1px solid #cfc1b0',borderRadius:8,margin:'18px 0',padding:14}}>
      <legend>Pick artifacts for {BLENDER_ROOM_VIEWS[room].name}</legend>
      <p style={{fontSize:13,marginTop:0}}>All pieces are original procedural models. No third-party downloads or paid assets are required. Surface coordinates below are metres, Blender Z-up. Choose at most one piece per surface.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',gap:14}}>
        {ARTIFACTS.map(asset=><label key={asset.id}>{asset.label}<select style={control} value={selected.find(item=>item.kind===asset.id)?.support||''} onChange={event=>choose(asset.id,event.target.value)}>
          <option value="">Do not add</option>
          {surfaces.filter(surface=>surface.room===room&&surface.kinds.includes(asset.id)).map(surface=>
            <option key={surface.object} value={surface.object}>{surface.object} · top {surface.bounds[1][2].toFixed(2)} m · x {((surface.bounds[0][0]+surface.bounds[1][0])/2).toFixed(2)}, y {((surface.bounds[0][1]+surface.bounds[1][1])/2).toFixed(2)}</option>)}
        </select></label>)}
      </div>
      {!surfaces.length&&<p style={{fontSize:13}}>Generate and load the surface inventory before selecting decor. A job without decor still renders every room.</p>}
    </fieldset>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button type="button" style={button} onClick={download}>Download render job</button>
      <button type="button" style={button} disabled={busy} onClick={()=>load('surfaces')}>Load Blender surfaces</button>
      <button type="button" style={button} disabled={busy} onClick={()=>load('renders')}>Load completed renders</button>
    </div>
    <p role="status" aria-live="polite" style={{fontSize:13,lineHeight:1.5}}>{message}</p>
    <details style={{marginTop:12}}><summary style={{cursor:'pointer',fontWeight:700}}>Local Blender commands</summary>
      <p>Run from the repository root. Use your Blender executable's full path when it is not on PATH.</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12,background:'#fffaf2',padding:12,borderRadius:8}}>{`node react-configurator/scripts/export-home-render-job.mjs\nblender --background --python-exit-code 1 --python blender/render_whole_home_realistic.py -- --inspect\n# Load Blender surfaces above, pick decor, download job and save to:\n# blender/whole_home/realistic/job.json\nblender --background --python-exit-code 1 --python blender/render_whole_home_realistic.py -- --device AUTO`}</pre>
      <p style={{fontSize:13}}>AUTO chooses a supported GPU, otherwise CPU. Review draft images before final quality. The source home and current baked GLBs are not overwritten; see docs/WHOLE_HOME_REALISTIC.md.</p>
    </details>
    {renders&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:12,marginTop:20}}>
      {renders.rooms.map(item=><figure key={item.id} style={{margin:0,background:'#fff',borderRadius:8,overflow:'hidden'}}>
        <img loading="lazy" src={item.image} alt={`${item.name}, Blender ${renders.preset} render`} style={{display:'block',width:'100%',height:'auto'}}/>
        <figcaption style={{padding:10}}>{item.name} · {renders.quality}</figcaption>
      </figure>)}
    </div>}
  </section>
}
