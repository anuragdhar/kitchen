import React,{useCallback,useEffect,useRef,useState} from 'react'
import {DxfViewer} from 'dxf-viewer'
import defaultDxfUrl from '../../docs/FloorPlan/floorplan_final.dxf?url'

const sourceName='floorplan_final.dxf'

export default function DxfWorkspace(){
  const mountRef=useRef(null)
  const viewerRef=useRef(null)
  const objectUrlRef=useRef(null)
  const [activeUrl,setActiveUrl]=useState(defaultDxfUrl)
  const [fileName,setFileName]=useState(sourceName)
  const [status,setStatus]=useState('Preparing drawing…')
  const [progress,setProgress]=useState(0)
  const [layers,setLayers]=useState([])
  const [visibleLayers,setVisibleLayers]=useState({})
  const [stats,setStats]=useState(null)

  const loadDrawing=useCallback(async(url,name)=>{
    const viewer=viewerRef.current
    if(!viewer) return
    setStatus(`Loading ${name}…`)
    setProgress(0)
    setLayers([])
    setStats(null)
    try{
      await viewer.Load({
        url,
        progressCbk:(_phase,processed,total)=>setProgress(total?Math.round((processed/total)*100):0),
      })
      const nextLayers=[...viewer.GetLayers(true)]
      const bounds=viewer.GetBounds()
      const dxf=viewer.GetDxf?.()
      setLayers(nextLayers)
      setVisibleLayers(Object.fromEntries(nextLayers.map(layer=>[layer.name,true])))
      setStats({entities:dxf?.entities?.length??0,layers:nextLayers.length,bounds})
      setStatus(`${name} ready`)
      setProgress(100)
    }catch(error){
      console.error(error)
      setStatus(`Could not open ${name}: ${error?.message||'Unknown DXF error'}`)
    }
  },[])

  useEffect(()=>{
    if(!mountRef.current) return
    const viewer=new DxfViewer(mountRef.current,{
      autoResize:true,
      clearColor:0x111827,
      clearAlpha:1,
      antialias:true,
      blackWhiteInversion:true,
      retainParsedDxf:true,
    })
    viewerRef.current=viewer
    loadDrawing(activeUrl,fileName)
    return ()=>{
      viewer.Destroy()
      viewerRef.current=null
      if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  },[])

  const handleFile=event=>{
    const file=event.target.files?.[0]
    if(!file) return
    if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url=URL.createObjectURL(file)
    objectUrlRef.current=url
    setActiveUrl(url)
    setFileName(file.name)
    loadDrawing(url,file.name)
    event.target.value=''
  }

  const toggleLayer=(name,show)=>{
    viewerRef.current?.ShowLayer(name,show)
    setVisibleLayers(current=>({...current,[name]:show}))
  }

  const fitDrawing=()=>{
    const viewer=viewerRef.current
    const bounds=viewer?.GetBounds()
    const origin=viewer?.GetOrigin()
    if(!bounds||!origin) return
    viewer.FitView(bounds.minX-origin.x,bounds.maxX-origin.x,bounds.minY-origin.y,bounds.maxY-origin.y,0.08)
  }

  return <main style={{minHeight:'calc(100vh - 68px)',background:'#e9edf2',padding:'clamp(16px,3vw,36px)'}}>
    <div style={{maxWidth:1440,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'end',flexWrap:'wrap',marginBottom:18}}>
        <div>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:'.12em',color:'#2563eb'}}>OPEN-SOURCE CAD TOOL</div>
          <h1 style={{fontSize:'clamp(30px,5vw,52px)',letterSpacing:'-.04em',margin:'7px 0 5px',color:'#111827'}}>DXF workspace</h1>
          <div style={{color:'#5b6472'}}>Pan, zoom, inspect layers, open another DXF, and keep the drawing ready for assisted edits.</div>
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
          <label style={{padding:'10px 15px',borderRadius:10,background:'#2563eb',color:'#fff',fontWeight:900,cursor:'pointer'}}>Open DXF<input type="file" accept=".dxf" onChange={handleFile} style={{display:'none'}}/></label>
          <button onClick={fitDrawing} style={{padding:'10px 15px',borderRadius:10,border:'1px solid #cbd5e1',background:'#fff',fontWeight:900,cursor:'pointer'}}>Fit drawing</button>
          <a href={activeUrl} download={fileName} style={{padding:'10px 15px',borderRadius:10,border:'1px solid #cbd5e1',background:'#fff',fontWeight:900,color:'#111827',textDecoration:'none'}}>Download source</a>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(230px,300px)',gap:16}} className="dxf-workspace-grid">
        <section style={{background:'#111827',borderRadius:18,overflow:'hidden',boxShadow:'0 18px 45px rgba(15,23,42,.18)',minWidth:0}}>
          <div style={{height:54,padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,color:'#e5e7eb',borderBottom:'1px solid #293244'}}>
            <div style={{fontWeight:900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fileName}</div>
            <div style={{fontSize:12,color:'#9ca3af',whiteSpace:'nowrap'}}>{status}{progress>0&&progress<100?` · ${progress}%`:''}</div>
          </div>
          <div ref={mountRef} style={{width:'100%',height:'min(72vh,760px)',minHeight:480,position:'relative'}}/>
        </section>

        <aside style={{display:'grid',gap:14,alignContent:'start'}}>
          <section style={{background:'#fff',borderRadius:16,padding:16,border:'1px solid #d6dde5'}}>
            <h2 style={{fontSize:15,margin:'0 0 12px'}}>Drawing information</h2>
            <div style={{display:'grid',gap:8,fontSize:13,color:'#4b5563'}}>
              <div>Entities <b style={{float:'right',color:'#111827'}}>{stats?.entities??'—'}</b></div>
              <div>Layers <b style={{float:'right',color:'#111827'}}>{stats?.layers??'—'}</b></div>
              {stats?.bounds&&<div style={{paddingTop:8,borderTop:'1px solid #edf0f3',fontFamily:'monospace',fontSize:11,lineHeight:1.55}}>X {Math.round(stats.bounds.minX)} to {Math.round(stats.bounds.maxX)}<br/>Y {Math.round(stats.bounds.minY)} to {Math.round(stats.bounds.maxY)}</div>}
            </div>
          </section>

          <section style={{background:'#fff',borderRadius:16,padding:16,border:'1px solid #d6dde5'}}>
            <h2 style={{fontSize:15,margin:'0 0 10px'}}>Layers</h2>
            <div style={{display:'grid',gap:7,maxHeight:310,overflow:'auto'}}>
              {layers.length===0&&<div style={{fontSize:13,color:'#6b7280'}}>Layers will appear after loading.</div>}
              {layers.map(layer=><label key={layer.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer'}}>
                <input type="checkbox" checked={visibleLayers[layer.name]!==false} onChange={event=>toggleLayer(layer.name,event.target.checked)}/>
                <span style={{width:10,height:10,borderRadius:99,background:`#${layer.color.toString(16).padStart(6,'0')}`,border:'1px solid #cbd5e1'}}/>
                <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{layer.displayName||layer.name}</span>
              </label>)}
            </div>
          </section>

          <section style={{background:'#eff6ff',borderRadius:16,padding:16,border:'1px solid #bfdbfe',fontSize:13,lineHeight:1.5,color:'#1e3a5f'}}>
            <b>Edit safely</b>
            <div style={{marginTop:5}}>The included A501 DXF is the default. We can make changes to a copy, verify it here, and keep the original drawing intact.</div>
          </section>
        </aside>
      </div>
    </div>
    <style>{`@media(max-width:900px){.dxf-workspace-grid{grid-template-columns:1fr!important}}`}</style>
  </main>
}
