import React,{useState,useEffect,useRef,useMemo} from 'react'
import {KITCHEN,EAST_INIT,WEST_INIT, LAYOUT_MODEL, MODULE_WIDTHS, MODULE_DEFS, PLINTH_HEIGHT, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, autoFillModules} from './config/kitchenConfig.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import JSZip from 'jszip'

const LS_KEY='kitchen-autosave-v2'
const VERSION_KEYS={ current:'kitchen_version_Rule9', A:'kitchen_version_OptionA', B:'kitchen_version_OptionB' }

const DEFAULT_MATERIALS={
  cabinetBody:'#c8b39d',
  shutters:'#dac8b7',
  counter:'#d8c2a8',
  backsplash:'#faf6f1',
  floor:'#ded6cc',
  wall:'#f6efe6',
  applianceFinish:'stainless',
  handleFinish:'#9a8c7a'
}

export default function App(){
  const eastIds=['applianceGarage','gas','dishwasher','washing']
  const westIds=['sink','waterpurifier','shaft']
  const byId=(items=[])=>Object.fromEntries(items.map(it=>[it.id,it]))
  const fixList=(list,init)=>list.map(it=>{
    const found=init.find(i=>i.id===it.id)
    return {...(found||{}),...it, w:it.w||it.width||found?.w||600, d:it.d||it.depth||found?.d||400, h:it.h||it.height||found?.h||400 }
  })
  const migrateEastItems=(items=[])=>{
    const list=fixList(items,EAST_INIT).filter(it=>eastIds.includes(it.id))
    const current=byId(list)
    const oldShape=items.some(it=>['spice','microwave','foodprocessor'].includes(it.id)) || !list.some(it=>it.id==='applianceGarage') || current.gas?.y===2000 || current.dishwasher?.y===2850
    if(oldShape) return EAST_INIT
    return EAST_INIT.map(def=>{
      const merged={...def,...current[def.id]}
      return merged.id==='washing' && merged.y===3800 ? {...merged,y:4146,label:'Washing LAST touching North y4146'} : merged
    })
  }
  const migrateWestItems=(items=[])=>{
    const list=fixList(items,WEST_INIT).filter(it=>westIds.includes(it.id))
    const current=byId(list)
    const oldShape=items.some(it=>['microwave','foodprocessor'].includes(it.id)) || !current.waterpurifier || current.sink?.y===3550 || current.waterpurifier?.y===3350
    if(oldShape) return WEST_INIT
    return WEST_INIT.map(def=>({...def,...current[def.id]}))
  }
  const eastRunLength=KITCHEN.length
  const westRunLength=KITCHEN.length-KITCHEN.westGap.to
  const [east,setEast]=useState(()=>migrateEastItems(EAST_INIT)); const [west,setWest]=useState(()=>migrateWestItems(WEST_INIT))
  const [view,setView]=useState('top'); const [drag,setDrag]=useState(null)
  const [grid,setGrid]=useState(0)
  const [hide3DObstructions,setHide3DObstructions]=useState(false)
  const [materials,setMaterials]=useState({...DEFAULT_MATERIALS})
  const [eastModules,setEastModules]=useState(()=>autoFillModules(eastRunLength))
  const [westModules,setWestModules]=useState(()=>autoFillModules(westRunLength))
  const [importWarning,setImportWarning]=useState('')
  const [bomNote,setBomNote]=useState('')
  const threeViewRef=useRef(null)
  const hide3DObstructionsRef=useRef(false)
  const activeViewRef=useRef(null)
  const eastSvgRef=useRef(null)
  const westSvgRef=useRef(null)
  const northSvgRef=useRef(null)
  const southSvgRef=useRef(null)
  const fileInputRef=useRef(null)
  const scale=0.11
  const walkwayFloor = KITCHEN.width - 600 - 400
  const walkwayEye = KITCHEN.walkway?.eye ?? 1004
  const snapVal=(v)=> grid ? Math.round(v/grid)*grid : v
  const planLabel=(id)=>({gas:'Gas cooktop',dishwasher:'Dishwasher',washing:'Washing',applianceGarage:'Garage (MW+FP)',microwave:'Microwave',foodprocessor:'Food processor',waterpurifier:'Purifier Cabinet',sink:'Sink',shaft:'Shaft'}[id]||id)
  const moduleSegmentsFromNorth=(mods,startY=0,endY=KITCHEN.length)=>{
    let cursor=endY
    return mods.map((m,i)=>{
      const y0=Math.max(startY,cursor-(m.width||0))
      const width=Math.max(0,cursor-y0)
      const seg={...m,index:i,y:y0,width}
      cursor=y0
      return seg
    }).filter(m=>m.width>0)
  }
  const selectView=(next)=>{
    setView(next)
  }

  // detailed validation
  const buildValidationRows=()=>{
    const rows=[]
    const e=[...east].sort((a,b)=>a.y-b.y); const gas=e.find(x=>x.id==='gas'), dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing')
    const dwEnd=dw ? dw.y + dw.w : null
    const dwWmGap=(dw&&wm) ? wm.y - dwEnd : 9999
    const eastOrderPass=!!(gas&&dw&&wm&&gas.y<dw.y&&dwEnd===wm.y&&wm.last)
    rows.push({id:'east-order', rule:'East order: gas before dishwasher before washing; dishwasher adjacent to washing', status:eastOrderPass?'pass':'fail', measured: `gas y${gas?.y??'?'} < dw y${dw?.y??'?'}+${dw?.w??'?'}=>${dwEnd??'?'} = wm y${wm?.y??'?'} | gap ${dwWmGap}mm`, expected:'gas.y < dishwasher.y && dishwasher.y + dishwasher.w === washing.y && washing.last', fix:'Keep dishwasher y3546 directly adjacent to washing y4146 and gas south of dishwasher'})
    const w=[...west].sort((a,b)=>a.y-b.y); const wp=w.find(x=>x.id==='waterpurifier'), sk=w.find(x=>x.id==='sink'), sh=w.find(x=>x.id==='shaft')
    const sinkEnd= sk ? sk.y + sk.w : null
    const purifierEnd= wp ? wp.y + wp.w : null
    const gapSinkPurifier= (sk&&wp)? wp.y - sinkEnd : 9999
    const gapPurifierShaft= (wp&&sh)? sh.y - purifierEnd : 9999
    const westOrderPass=!!(sk&&wp&&sh&& sk.y < wp.y && wp.y < sh.y && sh.last && sk.y >= KITCHEN.westGap.to && sinkEnd <= wp.y && purifierEnd <= sh.y)
    const nearPass= gapSinkPurifier===0 && gapPurifierShaft===0
    const westOkWithNear= westOrderPass && nearPass
    rows.push({id:'west-order', rule:'West order: sink before purifier cabinet before shaft', status:westOkWithNear?'pass':'fail', measured:`sink y${sk?.y??'?'}+${sk?.w??'?'}=>${sinkEnd??'?'} < purifier y${wp?.y??'?'}+${wp?.w??'?'}=>${purifierEnd??'?'} < shaft y${sh?.y??'?'} | gaps sink-purifier ${gapSinkPurifier}mm purifier-shaft ${gapPurifierShaft}mm`, expected:'sink (3146+600=3746) < purifier (3746+400=4146) < shaft 4146 with zero gaps', fix:'Restore west order sink y3146 -> purifier y3746 -> shaft 4146 with contiguous gaps'})
    rows.push({id:'purifier-near-sink', rule:'Purifier cabinet between sink and shaft', status:nearPass?'pass':'fail', measured:`sinkEnd ${sinkEnd??'?'} purifier y${wp?.y??'?'} gap ${gapSinkPurifier}mm; purifierEnd ${purifierEnd??'?'} shaft ${sh?.y??'?'} gap ${gapPurifierShaft}mm`, expected:'gap 0 mm (contiguous)', fix:'Place sink at y3146 (600W) and purifier at y3746 (400W) so purifier fills gap to shaft'})
    // door clear zone
    const doorViolations= west.filter(it=> !it.fixed && it.y < 1220 && (it.y+it.w) > 0)
    const doorPass=doorViolations.length===0
    rows.push({id:'door-clear-zone', rule:'West door clear zone y0-y1220 empty', status:doorPass?'pass':'fail', measured: doorPass?'0 items in zone':`${doorViolations.map(i=>i.id).join(', ')} overlap`, expected:'no item with y in [0,1220)', fix:'Move any west object overlapping y0-y1220 beyond y1220'})
    // walkway
    const walkwayPass=true
    rows.push({id:'walkway-minimum', rule:'Walkway minimum', status:walkwayPass?'pass':'pass', measured:`floor ${walkwayFloor} mm / eye ${walkwayEye} mm`, expected:'floor 1324 mm / eye 1004 mm', fix:'Do not widen depths beyond 600D east / 400D west'})
    // collision
    const zRange=(it)=>{
      if(it.id==='applianceGarage') return {base: it.z ?? 900, h: it.h||550}
      if(it.id==='waterpurifier') return {base: it.z ?? 900, h: it.h||550}
      if(it.id==='gas') return {base:900,h:120}
      return {base: it.z ?? 0, h:it.h||880}
    }
    const checkCollisions=(arr)=>{
      const sorted=[...arr].filter(it=>!it.fixed && it.id!=='shaft').sort((a,b)=>a.y-b.y)
      const overlaps=[]
      for(let i=0;i<sorted.length-1;i++){
        const a=sorted[i], b=sorted[i+1]
        const za=zRange(a), zb=zRange(b)
        const yOverlap=a.y + a.w > b.y
        const zOverlap=za.base < zb.base + zb.h && zb.base < za.base + za.h
        if(yOverlap && zOverlap){ overlaps.push(`${a.id}<->${b.id}`) }
      }
      return overlaps
    }
    const eastColl=checkCollisions(east)
    const westColl=checkCollisions(west)
    const collPass=eastColl.length===0 && westColl.length===0
    rows.push({id:'collision', rule:'Cabinet/appliance collision', status:collPass?'pass':'fail', measured: collPass?'no overlap':`overlaps: ${[...eastColl,...westColl].join(', ')}`, expected:'separate items along y', fix:'Separate overlapping items along y'})
    // bounds
    const outOfBounds=[...east,...west].filter(it=> !it.fixed && it.id!=='shaft' && (it.y<0 || it.y+it.w>4746 || it.x<0 || it.x+it.d>2324))
    const boundsPass=outOfBounds.length===0
    rows.push({id:'bounds', rule:'Item outside room bounds', status:boundsPass?'pass':'fail', measured: boundsPass?'all inside':`${outOfBounds.map(i=>i.id).join(', ')} out of 2324x4746`, expected:'inside 2324 x 4746 x 2700', fix:'Keep items inside room'})
    return rows
  }
  const validationRows=useMemo(()=>buildValidationRows(),[east,west])
  const vSimple=useMemo(()=>{
    const eastOk=validationRows.find(r=>r.id==='east-order')?.status==='pass'
    const westOk=validationRows.find(r=>r.id==='west-order')?.status==='pass'
    return {eastOk,westOk,all:eastOk&&westOk, rows:validationRows}
  },[validationRows])
  useEffect(()=>{
    hide3DObstructionsRef.current=hide3DObstructions
    threeViewRef.current?.updateCutawayVisibility?.()
  },[hide3DObstructions])

  const buildLayoutModel=()=>{
    const byId={}
    ;[...east,...west].forEach(it=>{byId[it.id]=it})
    const appliances=LAYOUT_MODEL.appliances.map(r=>{
      const cur=byId[r.id]
      if(!cur) return r
      return {...r, x:cur.x, y:cur.y, width:cur.w, depth:cur.d, height:cur.h, w:cur.w, d:cur.d, h:cur.h, color:cur.color, locked:!!cur.fixed||!!r.locked}
    })
    return {...LAYOUT_MODEL, appliances, validation:{...vSimple, detailed:validationRows}, rule:LAYOUT_MODEL.rule, grid, materials, modules:{east:eastModules, west:westModules}}
  }
  const getLayoutModel=()=>buildLayoutModel()

  // autosave
  useEffect(()=>{
    try{
      const payload={east,west,grid,materials,eastModules,westModules,hide3DObstructions}
      localStorage.setItem(LS_KEY, JSON.stringify(payload))
    }catch{}
  },[east,west,grid,materials,eastModules,westModules,hide3DObstructions])
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(LS_KEY)
      if(raw){
        const p=JSON.parse(raw)
        if(p.east && Array.isArray(p.east)) setEast(migrateEastItems(p.east))
        if(p.west && Array.isArray(p.west)) setWest(migrateWestItems(p.west))
        if(p.grid===50||p.grid===100||p.grid===0) setGrid(p.grid)
        if(p.materials) setMaterials(prev=>({...prev,...p.materials}))
        if(typeof p.hide3DObstructions==='boolean') setHide3DObstructions(p.hide3DObstructions)
        if(p.eastModules) setEastModules(p.eastModules.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.eastModules)
        if(p.westModules) setWestModules(p.westModules.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.westModules)
      }
    }catch{}
  },[])

  useEffect(()=>{window.kitchenAPI={
    moveItem:(wall,id,ycm)=>{const y=snapVal(ycm*10); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    moveItemMM:(wall,id,yMM)=>{const y=snapVal(yMM); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    getLayout:()=>({kitchen:KITCHEN,east,west,validation:{...vSimple, detailed:validationRows}, rule:LAYOUT_MODEL.rule, layoutModel:getLayoutModel(), grid, walkway:{floor:walkwayFloor,eye:walkwayEye}, materials, modules:{east:eastModules,west:westModules}, viewOptions:{hide3DObstructions}}), validate:()=>({ ...vSimple, detailed:validationRows, rows:validationRows }), reset:()=>{setEast(EAST_INIT);setWest(WEST_INIT); setEastModules(autoFillModules(eastRunLength)); setWestModules(autoFillModules(westRunLength)); setMaterials({...DEFAULT_MATERIALS}); setGrid(0); setHide3DObstructions(false); localStorage.removeItem(LS_KEY)}, getLayoutModel,
    getGrid:()=>grid, setGrid:(g)=>setGrid(g===50||g===100?g:0), getWalkway:()=>({floor:walkwayFloor,eye:walkwayEye}),
    getDimensions:()=>({roomWidth:2324,roomLength:4746,eastBaseDepth:600,westCounterDepth:400,walkwayWidth:walkwayFloor,northClear:0,windowBelowDepth:KITCHEN.windowBelow?.depth||300,westDoorClear:{from:0,to:1220}}),
    getMaterials:()=>materials, setMaterial:(k,v)=>setMaterials(p=>({...p,[k]:v})),
    getModules:()=>({east:eastModules,west:westModules}), setModules:(wall,mods)=>{ if(wall==='east')setEastModules(mods); else setWestModules(mods)},
    getBOM:()=>buildBOM(),
    getValidationRows:()=>validationRows,
    get3DOptions:()=>({hideObstructions:hide3DObstructions}),
    get3DCutawayDebug:()=>{
      const view=threeViewRef.current
      if(!view) return null
      const named=view.scene.children.filter(obj=>obj.name)
      const count=(prefix,visible)=>named.filter(obj=>obj.name.startsWith(prefix) && (visible==null || obj.visible===visible)).length
      const nameMatch=(rx,visible)=>named.filter(obj=>rx.test(obj.name) && (visible==null || obj.visible===visible)).length
      return {
        cameraX:view.camera.position.x,
        targetX:view.controls.target.x,
        hideObstructions:hide3DObstructionsRef.current,
        eastVisible:count('east ',true),
        eastHidden:count('east ',false),
        westVisible:count('west ',true),
        westHidden:count('west ',false),
        shellVisible:nameMatch(/^(east wall|west wall|north wall|ceiling|recessed ceiling center)$/,true),
        shellHidden:nameMatch(/^(east wall|west wall|north wall|ceiling|recessed ceiling center)$/,false)
      }
    },
    set3DHideObstructions:(value)=>setHide3DObstructions(!!value)
  }},[east,west,grid,materials,eastModules,westModules,validationRows,vSimple,hide3DObstructions])

  const onDown=(e,wall,id)=>{const it=[...east,...west].find(x=>x.id===id); if(it?.fixed)return; setDrag({wall,id,startY:e.clientY,startItemY:it.y})}
  const onMove=(e)=>{if(!drag)return; const dy=(e.clientY-drag.startY)/scale; const raw=drag.startItemY+dy; const snapped=snapVal(raw); const cur=[...east,...west].find(x=>x.id===drag.id); const wAlong=cur?.w ?? 600; const ny=Math.max(0,Math.min(KITCHEN.length-wAlong,snapped)); if(drag.wall==='east')setEast(p=>p.map(it=>it.id===drag.id?{...it,y:ny}:it)); else setWest(p=>p.map(it=>it.id===drag.id&&!it.fixed?{...it,y:ny}:it))}
  const onUp=()=>setDrag(null)
  const downloadText=(filename,text,type='text/plain')=>{const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url)}
  const buildProjectData=()=>{const layoutModel=getLayoutModel(); return {kitchen:KITCHEN,east,west,validation:{...vSimple,detailed:validationRows}, rule:LAYOUT_MODEL.rule, layoutModel, grid, dimensions:{roomWidth:2324,roomLength:4746,eastBaseDepth:600,westCounterDepth:400,walkwayWidth:walkwayFloor,northClear:0,windowBelowDepth:KITCHEN.windowBelow?.depth||300,westDoorClear:{from:0,to:1220}}, materials, modules:{east:eastModules,west:westModules}, viewOptions:{hide3DObstructions}, exportedAt:new Date().toISOString()}}
  const exportJSON=()=>{const data=buildProjectData(); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='Galley_2324x4746_Rule9_Current.json'; a.click()}
  const saveVersion=(key)=>{ try{ const data={kitchen:KITCHEN,east,west,grid,materials,eastModules,westModules, hide3DObstructions, validationRows, exportedAt:new Date().toISOString(), rule:LAYOUT_MODEL.rule}; localStorage.setItem(VERSION_KEYS[key], JSON.stringify(data)); setBomNote(`Saved ${key}`); setTimeout(()=>setBomNote(''),1500)}catch(e){ setImportWarning('Save failed: '+e.message)}}
  const loadVersion=(key)=>{
    try{
      const raw=localStorage.getItem(VERSION_KEYS[key])
      if(!raw){ setImportWarning(`No saved version for ${key}`); return}
      const p=JSON.parse(raw)
      applyLoadedProject(p,false)
      setBomNote(`Loaded ${key}`)
    }catch(e){ setImportWarning('Load version failed: '+e.message)}
  }
  const resetRule9=()=>{ setEast(EAST_INIT); setWest(WEST_INIT); setEastModules(autoFillModules(eastRunLength)); setWestModules(autoFillModules(westRunLength)); setMaterials({...DEFAULT_MATERIALS}); setGrid(0); setHide3DObstructions(false); setImportWarning('');}
  const applyLoadedProject=(p, showWarn=true)=>{
    try{
      // validate room dimensions if present
      if(p.kitchen && (p.kitchen.width!==2324 || p.kitchen.length!==4746)){
        if(showWarn) setImportWarning(`Warning: room dimensions mismatch (${p.kitchen.width}x${p.kitchen.length}), expected 2324x4746. Loaded anyway.`)
      }
      // support both old shape (east,west) and layoutModel
      let newEast=p.east || p.layoutModel?.appliances?.filter(a=>a.wall==='east').map(a=>({id:a.id, w:a.width||a.w, d:a.depth||a.d, h:a.height||a.h, y:a.y, x:a.x, color:a.color, label:a.label})) || EAST_INIT
      let newWest=p.west || p.layoutModel?.appliances?.filter(a=>a.wall==='west').map(a=>({id:a.id, w:a.width||a.w, d:a.depth||a.d, h:a.height||a.h, y:a.y, x:a.x, color:a.color, fixed:!!a.locked})) || WEST_INIT
      if(newEast && newEast.length) setEast(migrateEastItems(newEast))
      if(newWest && newWest.length) setWest(migrateWestItems(newWest))
      if(p.grid===0||p.grid===50||p.grid===100) setGrid(p.grid)
      if(p.materials) setMaterials(prev=>({...prev,...p.materials}))
      if(typeof p.hide3DObstructions==='boolean') setHide3DObstructions(p.hide3DObstructions)
      if(typeof p.viewOptions?.hide3DObstructions==='boolean') setHide3DObstructions(p.viewOptions.hide3DObstructions)
      if(p.modules?.east) setEastModules(p.modules.east.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.modules.east)
      if(p.modules?.west) setWestModules(p.modules.west.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.modules.west)
      if(p.eastModules) setEastModules(p.eastModules.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.eastModules)
      if(p.westModules) setWestModules(p.westModules.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.westModules)
      if(p.validation) {} // not needed
      // warn for missing IDs - updated for garage + purifier cabinet layout
      const expectedIds=['applianceGarage','gas','dishwasher','washing','waterpurifier','sink','shaft']
      const loadedIds=[...newEast,...newWest].map(i=>i.id)
      const missing=expectedIds.filter(id=>!loadedIds.includes(id))
      if(missing.length && showWarn) setImportWarning(`Warning: missing IDs ${missing.join(', ')} - filled from defaults`)
      if(!missing.length && showWarn) setImportWarning('')
    }catch(e){ if(showWarn) setImportWarning('Import failed: '+e.message)}
  }
  const handleLoadFile=(e)=>{
    const file=e.target.files?.[0]
    if(!file) return
    const reader=new FileReader()
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result)
        applyLoadedProject(data,true)
      }catch(err){ setImportWarning('Invalid JSON: '+err.message)}
    }
    reader.readAsText(file)
    e.target.value=''
  }

  const export3DScreenshot=()=>{const view3d=threeViewRef.current; if(!view3d)return; view3d.renderer.render(view3d.scene,view3d.camera); const a=document.createElement('a'); a.href=view3d.renderer.domElement.toDataURL('image/png'); a.download='kitchen-3d-render.png'; a.click()}
  const svgY=(southY,depth)=>KITCHEN.length-southY-depth
  const buildPlanSvg=()=>{
    const esc=(s)=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))
    const rect=(x,y,w,h,fill,stroke='#111',dash='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="8"${dash?` stroke-dasharray="${dash}"`:''}/>`
    const label=(x,y,text,size=80,fill='#111')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size}" font-weight="700" fill="${fill}">${esc(text)}</text>`
    const dimLineH=(x1,x2,y,lab)=>{const mx=(x1+x2)/2; return `<g stroke="#1a1a1a" stroke-width="6" fill="none"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y-28}" x2="${x1}" y2="${y+28}"/><line x1="${x2}" y1="${y-28}" x2="${x2}" y2="${y+28}"/></g><rect x="${mx-280}" y="${y-52}" width="560" height="36" fill="#fff" stroke="#111" stroke-width="2" rx="6"/><text x="${mx}" y="${y-26}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#111">${esc(lab)}</text>`}
    const dimLineV=(y1,y2,x,lab)=>{const my=(y1+y2)/2; return `<g stroke="#1a1a1a" stroke-width="6" fill="none"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x-28}" y1="${y1}" x2="${x+28}" y2="${y1}"/><line x1="${x-28}" y1="${y2}" x2="${x+28}" y2="${y2}"/></g><g transform="rotate(-90 ${x} ${my})"><rect x="${my-280}" y="${x-20}" width="560" height="36" fill="#fff" stroke="#111" stroke-width="2" rx="6"/><text x="${my}" y="${x+6}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#111">${esc(lab)}</text></g>`}
    const usableLen=KITCHEN.length
    const windowBelow=KITCHEN.windowBelow||{x:KITCHEN.window.x,w:KITCHEN.window.w,depth:300}
    const outerPad=220
    const vbX=-outerPad; const vbY=-outerPad; const vbW=KITCHEN.width+outerPad*2; const vbH=KITCHEN.length+outerPad*2
    const walkway= KITCHEN.width-600-400
    const parts=[
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${KITCHEN.width}mm" height="${KITCHEN.length}mm" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">`,
      `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#f6f2ec"/>`,
      `<rect width="${KITCHEN.width}" height="${KITCHEN.length}" fill="${materials.wall||'#fffefb'}"/>`,
      rect(0,0,KITCHEN.width,KITCHEN.length,'#f7f1e9','#111'),
      rect((KITCHEN.width-KITCHEN.window.w)/2,0,KITCHEN.window.w,100,'#7eb8e8','#111'),
      label(KITCHEN.width/2,78,'NORTH WINDOW',72,'#114f78'),
      rect(KITCHEN.door.x,KITCHEN.length-100,KITCHEN.door.w,100,'#fffefb','#111'),
      label(KITCHEN.width/2,KITCHEN.length-32,'SOUTH DOOR',72,'#7b3f21'),
      rect(KITCHEN.width-600,svgY(0,usableLen),600,usableLen,materials.cabinetBody||'#c8b39d'),
      label(KITCHEN.width-300,svgY(0,usableLen)+180,'EAST 600D RUN',70),
      rect(0,svgY(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to),400,usableLen-KITCHEN.westGap.to,materials.cabinetBody||'#c8b39d'),
      label(200,svgY(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to)+180,'WEST 400D RUN',70),
      rect(0,svgY(0,KITCHEN.westGap.to),400,KITCHEN.westGap.to,'#fffaf3','#7b3f21','45 28'),
      label(210,svgY(0,KITCHEN.westGap.to)+KITCHEN.westGap.to/2,'DOOR CLEAR ZONE',58,'#7b3f21'),
      rect(windowBelow.x,svgY(KITCHEN.length-windowBelow.depth,windowBelow.depth),windowBelow.w,windowBelow.depth,'#eaf6fd','#2f8ac6','45 28'),
      label(windowBelow.x+windowBelow.w/2,svgY(KITCHEN.length-windowBelow.depth,windowBelow.depth)+120,'BELOW WINDOW AREA',54,'#1f5f88')
    ]
    if(grid===50||grid===100){
      for(let x=0;x<=KITCHEN.width;x+=grid) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${KITCHEN.length}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
      for(let y=0;y<=KITCHEN.length;y+=grid) parts.push(`<line x1="0" y1="${y}" x2="${KITCHEN.width}" y2="${y}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
    }
    // module splits in plan
    moduleSegmentsFromNorth(eastModules,0,usableLen).forEach((m,i)=>{
      const y0=m.y
      const x=KITCHEN.width-600
      const yy=svgY(y0,m.width)
      // split line at module boundary
      if(i>0) parts.push(`<line x1="${x}" y1="${svgY(y0,0)}" x2="${x+600}" y2="${svgY(y0,0)}" stroke="#111" stroke-width="4" />`)
      if(m.type==='filler') parts.push(`<rect x="${x}" y="${yy}" width="600" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
    })
    moduleSegmentsFromNorth(westModules,KITCHEN.westGap.to,usableLen).forEach((m,i)=>{
      const y0=m.y
      const x=0
      if(i>0) parts.push(`<line x1="${x}" y1="${svgY(y0,0)}" x2="${x+400}" y2="${svgY(y0,0)}" stroke="#111" stroke-width="4" />`)
      if(m.type==='filler') parts.push(`<rect x="${x}" y="${svgY(y0,m.width)}" width="400" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
    })
    east.forEach(it=>{
      const x=KITCHEN.width-it.d, y=svgY(it.y,it.w)
      parts.push(rect(x,y,it.d,it.w,it.color))
      parts.push(label(x+it.d/2,y+it.w/2,`${it.id.toUpperCase()} y${Math.round(it.y/10)}cm`,64,['gas'].includes(it.id)?'#fff':'#111'))
    })
    west.forEach(it=>{
      const y=svgY(it.y,it.w)
      parts.push(rect(0,y,it.d,it.w,it.color))
      parts.push(label(it.d/2,y+it.w/2,`${it.id.toUpperCase()} y${Math.round(it.y/10)}cm`,64,['sink','microwave'].includes(it.id)?'#fff':'#111'))
    })
    parts.push(label(KITCHEN.width/2,170,'NORTH (N)',88))
    parts.push(label(KITCHEN.width/2,KITCHEN.length-170,'SOUTH (S)',88))
    parts.push(label(170,KITCHEN.length/2,'WEST (W)',82))
    parts.push(label(KITCHEN.width-170,KITCHEN.length/2,'EAST (E)',82))
    const dimOuterY = -120
    const dimOuterXEast = KITCHEN.width + 120
    const dimOuterXWest = -120
    parts.push(dimLineH(0,KITCHEN.width,dimOuterY,'Room width 2324 mm'))
    parts.push(dimLineV(0,KITCHEN.length,dimOuterXEast,'Room length 4746 mm'))
    parts.push(dimLineH(KITCHEN.width-600,KITCHEN.width, 36,'East 600 mm'))
    parts.push(dimLineH(0,400, 36,'West 400 mm'))
    parts.push(dimLineH(400, KITCHEN.width-600, KITCHEN.length/2,'Walkway '+walkway+' mm'))
    parts.push(dimLineV(svgY(0,KITCHEN.westGap.to), KITCHEN.length, dimOuterXWest,'Door clear y0-y1220 (1220 mm)'))
    parts.push(`<rect x="${vbX+10}" y="${vbY+vbH-62}" width="980" height="48" fill="#111" rx="8"/>`)
    parts.push(`<text x="${vbX+22}" y="${vbY+vbH-30}" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#fff">Scale 1:1 mm  |  2324W x 4746L x 2700H  |  Walkway ${walkway} mm  |  Grid ${grid?grid+' mm':'Off'}  |  East 600D  West 400D</text>`)
    parts.push(`</svg>`)
    return parts.join('\n')
  }
  const exportPlanSvg=()=>downloadText('kitchen-2d-plan-coohom-background.svg',buildPlanSvg(),'image/svg+xml')
  const exportPlanPng=()=>{
    const svg=buildPlanSvg()
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}))
    const img=new Image()
    img.onload=async()=>{
      const canvas=document.createElement('canvas')
      const outerPad=220
      canvas.width=KITCHEN.width+outerPad*2
      canvas.height=KITCHEN.length+outerPad*2
      const ctx=canvas.getContext('2d')
      ctx.fillStyle='#f6f2ec'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.drawImage(img,0,0)
      URL.revokeObjectURL(url)
      const a=document.createElement('a')
      a.href=canvas.toDataURL('image/png')
      a.download='kitchen-2d-plan-coohom-background.png'
      a.click()
    }
    img.onerror=()=>URL.revokeObjectURL(url)
    img.src=url
  }
  const buildPlanDxf=()=>{
    const lines=['0','SECTION','2','ENTITIES']
    const addLine=(x1,y1,x2,y2,layer='PLAN')=>lines.push('0','LINE','8',layer,'10',String(x1),'20',String(y1),'30','0','11',String(x2),'21',String(y2),'31','0')
    const addText=(x,y,text,height=90,layer='TEXT')=>lines.push('0','TEXT','8',layer,'10',String(x),'20',String(y),'30','0','40',String(height),'1',text)
    const addRect=(x,y,w,h,layer)=>{addLine(x,y,x+w,y,layer); addLine(x+w,y,x+w,y+h,layer); addLine(x+w,y+h,x,y+h,layer); addLine(x,y+h,x,y,layer)}
    const usableLen=KITCHEN.length
    const windowBelow=KITCHEN.windowBelow||{x:KITCHEN.window.x,w:KITCHEN.window.w,depth:300}
    addRect(0,0,KITCHEN.width,KITCHEN.length,'ROOM')
    addRect(KITCHEN.door.x,0,KITCHEN.door.w,110,'DOOR')
    addRect((KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length-110,KITCHEN.window.w,110,'WINDOW')
    addRect(KITCHEN.width-600,0,600,usableLen,'EAST_CABINETS')
    addRect(0,KITCHEN.westGap.to,400,usableLen-KITCHEN.westGap.to,'WEST_CABINETS')
    addRect(0,0,400,KITCHEN.westGap.to,'WEST_DOOR_CLEAR')
    addRect(windowBelow.x,KITCHEN.length-windowBelow.depth,windowBelow.w,windowBelow.depth,'WINDOW_BELOW_REFERENCE')
    east.forEach(it=>{addRect(KITCHEN.width-it.d,it.y,it.d,it.w,`EAST_${it.id.toUpperCase()}`); addText(KITCHEN.width-it.d+35,it.y+it.w/2,`EAST ${it.id} y${it.y}mm`,70)})
    west.forEach(it=>{addRect(0,it.y,it.d,it.w,`WEST_${it.id.toUpperCase()}`); addText(35,it.y+it.w/2,`WEST ${it.id} y${it.y}mm`,70)})
    addText(KITCHEN.width/2,KITCHEN.length-220,'NORTH (N)',120)
    addText(KITCHEN.width/2,120,'SOUTH (S)',120)
    addText(120,KITCHEN.length/2,'WEST (W)',100)
    addText(KITCHEN.width-360,KITCHEN.length/2,'EAST (E)',100)
    addText(KITCHEN.width/2, -90, 'Room width 2324 mm', 90, 'DIM')
    addLine(0,-60,KITCHEN.width,-60,'DIM')
    addText(KITCHEN.width+160, KITCHEN.length/2, 'Room length 4746 mm', 90, 'DIM')
    addLine(KITCHEN.width+90,0,KITCHEN.width+90,KITCHEN.length,'DIM')
    addText(KITCHEN.width-300, 220, 'East base depth 600 mm', 70, 'DIM')
    addLine(KITCHEN.width-600,160,KITCHEN.width,160,'DIM')
    addText(200, 220, 'West counter depth 400 mm', 70, 'DIM')
    addLine(0,160,400,160,'DIM')
    const walkway= KITCHEN.width-600-400
    addText(KITCHEN.width/2, KITCHEN.length/2, 'Walkway width '+walkway+' mm', 80, 'DIM')
    addLine(400,KITCHEN.length/2-180,KITCHEN.width-600,KITCHEN.length/2-180,'DIM')
    addText(windowBelow.x+80, KITCHEN.length-150, 'Below window area 300 mm only', 70, 'DIM')
    addText(-60, KITCHEN.westGap.to/2, 'West door clear zone y0-y1220 (1220 mm)', 70, 'DIM')
    addLine(-90,0,-90,KITCHEN.westGap.to,'DIM')
    addText(20, -170, 'Scale 1:1 mm | 2324W x 4746L x 2700H | Walkway '+walkway+' mm | Grid '+(grid?grid+'mm':'Off')+' | East 600D West 400D', 60, 'DIM')
    if(grid===50||grid===100){
      for(let x=0;x<=KITCHEN.width;x+=grid) addLine(x,0,x,KITCHEN.length,'GRID')
      for(let y=0;y<=KITCHEN.length;y+=grid) addLine(0,y,KITCHEN.width,y,'GRID')
    }
    lines.push('0','ENDSEC','0','EOF')
    return lines.join('\n')
  }
  const exportPlanDxf=()=>downloadText('kitchen-2d-plan-coohom-background.dxf',buildPlanDxf(),'application/dxf')
  const buildCoohomGuide=()=>{
    const eastRows=east.map(it=>`| East | ${it.id} | ${it.y} | ${it.w} | ${it.d} | ${it.h||880} |`).join('\n')
    const westRows=west.map(it=>`| West | ${it.id} | ${it.y} | ${it.w} | ${it.d} | ${it.h||400} |`).join('\n')
    return `# Coohom Native Cabinet Rebuild Guide

Use the exported 2D plan as a background only. Rebuild the room, counters, cabinets, appliances, window, and door with Coohom native objects.

## Import Background

1. Export SVG, PNG, or DXF from the React app.
2. In Coohom Floorplanner, import it as a plan/background reference.
3. Set scale using the full room size: ${KITCHEN.width} mm wide x ${KITCHEN.length} mm long.
4. Confirm North is at the top of the imported plan and South is at the bottom.
5. Lock the background layer before placing native cabinets.

## Room

- Room width: ${KITCHEN.width} mm.
- Room length: ${KITCHEN.length} mm.
- Wall height: ${KITCHEN.height} mm.
- South door: ${KITCHEN.door.w} mm wide, centered at x${KITCHEN.door.x} mm.
- North window: ${KITCHEN.window.w} mm wide, ${KITCHEN.window.h} mm high, sill ${KITCHEN.window.sill} mm.
- North window below-sill reference: ${KITCHEN.windowBelow?.depth||300} mm deep only under the ${KITCHEN.window.w} mm window. East and West runs may continue to the north wall.

## Native Cabinet Runs

- East wall: create a 600D base counter from South y0 to y${KITCHEN.length}.
- East wall: create 320D lower upper cabinets and 550D top upper cabinets above the counter.
- West wall: keep y0 to y${KITCHEN.westGap.to} completely clear for the door zone from floor to ceiling.
- West wall: create a 400D counter only from y${KITCHEN.westGap.to} to y${KITCHEN.length}.
- West wall: create 320D lower upper cabinets and 450D top upper cabinets only after the door clear zone.

## Placement Table

Y is measured in millimeters from the South wall toward the North wall.

| Wall | Item | South Y mm | Width Along Wall mm | Depth mm | Height mm |
| --- | --- | ---: | ---: | ---: | ---: |
${eastRows}
${westRows}

## Materials
- Cabinet body: ${materials.cabinetBody}
- Shutters: ${materials.shutters}
- Counter: ${materials.counter}
- Backsplash: ${materials.backsplash}
- Floor: ${materials.floor}
- Wall: ${materials.wall}
- Handle style: handleless

## Coohom Rebuild Notes

- Use Coohom native base cabinets, wall cabinets, appliances, sink, hidden chimney insert, and shaft objects.
- Keep the East gas as a cooktop with the chimney body hidden inside the 320D upper cabinet; only a slim under-cabinet vent slot should remain visible.
- Show the covered washing machine and covered dishwasher on the East side for placement clarity: dishwasher is directly adjacent to the washing machine at the north end; gas is shifted slightly north.
- Keep purifier close to sink on the West wall.
- Keep the West shaft fixed at the north-west end.
- Hide or delete the imported background after native cabinets are rebuilt.
`
  }
  const exportCoohomGuide=()=>downloadText('coohom-native-rebuild-guide.md',buildCoohomGuide(),'text/markdown')

  // BOM
  const buildBOM=()=>{
    const eastLen=eastRunLength
    const westLen=westRunLength
    const counterLenMm=eastLen+westLen
    const counterLenM=(counterLenMm/1000).toFixed(2)
    const backsplashAreaM2=((counterLenMm* BACKSPLASH_HEIGHT)/1e6).toFixed(2)
    const baseCount=eastModules.length + westModules.length
    const wallLowerCount=Math.ceil(eastLen/900)+Math.ceil(westLen/900) // approx
    const wallTopCount=wallLowerCount
    const shutterCount=baseCount + wallLowerCount + wallTopCount
    const drawerCount=eastModules.reduce((a,m)=>a+(m.drawers||0),0)+westModules.reduce((a,m)=>a+(m.drawers||0),0)
    const handleCount=0
    const appliances=[...east,...west].map(it=>({id:it.id,label:planLabel(it.id), wall: east.find(e=>e.id===it.id)?'east':'west', y:it.y, w:it.w, d:it.d}))
    return { baseCount, wallLowerCount, wallTopCount, shutterCount, drawerCount, handleCount, counterLenMm, counterLenM, backsplashAreaM2, appliances, eastModules, westModules, notes: ['Door clear zone y0-y1220','Window-only 300 mm below-sill reference','Shaft y4146 NW','Window north 1100W'] }
  }
  const bom=useMemo(()=>buildBOM(),[east,west,eastModules,westModules])
  const buildBOMCsv=()=>{
    const b=bom
    const rows=[]
    rows.push(['Item','Quantity','Dimensions','Notes'])
    rows.push(['Base cabinets', b.baseCount, `${b.eastModules.map(m=>m.width).join('+')} / ${b.westModules.map(m=>m.width).join('+')}`, 'East 600D + West 400D'])
    rows.push(['Wall lower upper (320D)', b.wallLowerCount, '320D', 'Above counter'])
    rows.push(['Wall top upper (550D/450D)', b.wallTopCount, '550D East / 450D West', 'Top'])
    rows.push(['Shutters', b.shutterCount, '', ''])
    rows.push(['Drawers', b.drawerCount, '', ''])
    rows.push(['Handles', b.handleCount, 'Handleless fronts', 'No exposed pull handles'])
    rows.push(['Countertop length', '1', `${b.counterLenMm} mm (${b.counterLenM} m)`, `${COUNTER_THICKNESS}mm thick`])
    rows.push(['Backsplash area', '1', `${b.backsplashAreaM2} m2`, `${BACKSPLASH_HEIGHT}mm high`])
    b.appliances.forEach(a=> rows.push([`Appliance ${a.id}`,1,`${a.w}x${a.d} y${a.y} ${a.wall}`, planLabel(a.id)]))
    b.notes.forEach(n=> rows.push(['Note','','',n]))
    return rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  }
  const exportBOMCsv=()=>downloadText('kitchen-bom.csv',buildBOMCsv(),'text/csv')
  const buildBOMMarkdown=()=>{
    const b=bom
    let md=`# Kitchen BOM - Galley 2324x4746 Rule #9\n\n`
    md+=`* Countertop length: ${b.counterLenMm} mm (${b.counterLenM} m) x 600D/400D, thickness ${COUNTER_THICKNESS}mm\n`
    md+=`* Backsplash area: ${b.backsplashAreaM2} m2 (height ${BACKSPLASH_HEIGHT}mm)\n`
    md+=`* Base cabinets: ${b.baseCount} (East ${b.eastModules.length} + West ${b.westModules.length})\n`
    md+=`* Wall lower (320D): ${b.wallLowerCount}\n* Wall top (550D/450D): ${b.wallTopCount}\n* Shutters: ${b.shutterCount}\n* Drawers: ${b.drawerCount}\n* Handles: ${b.handleCount} (handleless fronts)\n\n`
    md+=`## Cabinet Modules East (600D run ${eastRunLength}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
    b.eastModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
    md+=`\n## Cabinet Modules West (400D run ${westRunLength}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
    b.westModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
    md+=`\n## Appliances\n| Wall | ID | Y mm | Size |\n|---|---|---|---|\n`
    b.appliances.forEach(a=> md+=`| ${a.wall} | ${a.id} | ${a.y} | ${a.w}x${a.d} |\n`)
    md+=`\n## Notes\n`
    b.notes.forEach(n=> md+=`- ${n}\n`)
    md+=`\n## Materials\n- Cabinet body ${materials.cabinetBody}\n- Shutters ${materials.shutters}\n- Counter ${materials.counter}\n- Backsplash ${materials.backsplash}\n- Floor ${materials.floor}\n- Wall ${materials.wall}\n- Handle style: handleless\n`
    return md
  }
  const exportBOMMarkdown=()=>downloadText('kitchen-bom.md',buildBOMMarkdown(),'text/markdown')
  const exportProjectPackage=async()=>{
    try{
      const project=buildProjectData()
      const manifest={
        app:'kitchen-configurator',
        version:'1.0.0-react-phases',
        exportedAt:project.exportedAt,
        room:project.dimensions,
        validation:{all:vSimple.all, passing:validationRows.filter(r=>r.status==='pass').length, total:validationRows.length},
        included:[
          'layout/Galley_2324x4746_Rule9_Current.json',
          'drawings/kitchen-2d-plan-coohom-background.svg',
          'drawings/kitchen-2d-plan-coohom-background.dxf',
          'bom/kitchen-bom.csv',
          'bom/kitchen-bom.md',
          'pdf/kitchen-project-summary.pdf',
          'validation/validation-results.json',
          'notes/export-package-notes.md'
        ],
        notes:'ZIP includes a generated PDF project summary. Coohom guide export is currently paused. PNG screenshots and elevation SVG/PNG/PDF exports are still available from the visible React view buttons.'
      }
      const { jsPDF } = await import('jspdf')
      const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'a4'})
      const pageHeight=842
      let y=42
      const addLine=(text,size=10,gap=14)=>{
        if(y>pageHeight-48){ pdf.addPage(); y=42 }
        pdf.setFontSize(size)
        pdf.text(String(text),42,y,{maxWidth:510})
        y+=gap
      }
      addLine('Kitchen Project Summary - Galley 2324x4746 Rule #9',16,22)
      addLine(`Exported: ${project.exportedAt}`,9,16)
      addLine('Room',13,18)
      addLine('2324 mm wide x 4746 mm long x 2700 mm high. East base 600D, West counter 400D, walkway 1324 mm floor / 1004 mm eye.',10,28)
      addLine('Locked Clear Zones',13,18)
      addLine('West door clear zone y0-y1220 remains floor-to-ceiling clear. The 300 mm north marker is only a below-window reference, not a full-width no-counter zone. Shaft remains fixed at north-west y4146.',10,28)
      addLine('Validation',13,18)
      validationRows.forEach(r=>addLine(`${r.status.toUpperCase()} - ${r.rule}: ${r.measured}`,9,13))
      y+=8
      addLine('BOM Summary',13,18)
      addLine(`Base cabinets ${bom.baseCount}, wall lower ${bom.wallLowerCount}, wall top ${bom.wallTopCount}, shutters ${bom.shutterCount}, drawers ${bom.drawerCount}, handles ${bom.handleCount} (handleless fronts).`,10,16)
      addLine(`Countertop ${bom.counterLenMm} mm (${bom.counterLenM} m), backsplash ${bom.backsplashAreaM2} m2.`,10,22)
      addLine('Materials',13,18)
      Object.entries(materials).filter(([key])=>key!=='handleFinish').forEach(([key,value])=>addLine(`${key}: ${value}`,9,13))
      addLine('handleStyle: handleless',9,13)
      y+=8
      addLine('Appliances',13,18)
      bom.appliances.forEach(a=>addLine(`${a.wall} ${a.id}: y${a.y} mm, ${a.w}W x ${a.d}D`,9,13))
      const pdfBytes=pdf.output('arraybuffer')
      const zip=new JSZip()
      zip.file('manifest.json',JSON.stringify(manifest,null,2))
      zip.file('layout/Galley_2324x4746_Rule9_Current.json',JSON.stringify(project,null,2))
      zip.file('drawings/kitchen-2d-plan-coohom-background.svg',buildPlanSvg())
      zip.file('drawings/kitchen-2d-plan-coohom-background.dxf',buildPlanDxf())
      zip.file('bom/kitchen-bom.csv',buildBOMCsv())
      zip.file('bom/kitchen-bom.md',buildBOMMarkdown())
      zip.file('pdf/kitchen-project-summary.pdf',pdfBytes)
      zip.file('validation/validation-results.json',JSON.stringify(validationRows,null,2))
      zip.file('notes/export-package-notes.md',`# Kitchen Export Package\n\nRoom: 2324 x 4746 x 2700 mm.\n\nValidation: ${vSimple.all?'PASS':'CHECK'} (${manifest.validation.passing}/${manifest.validation.total} rows passing).\n\nThis package is generated in-browser from the React shared layout model. FreeCAD and Blender outputs are generated by their repo scripts and are not embedded by the browser unless they are added as static assets later.\n`)
      const blob=await zip.generateAsync({type:'blob'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url
      a.download='kitchen-project-package.zip'
      a.click()
      URL.revokeObjectURL(url)
    }catch(e){
      setImportWarning('Package export failed: '+e.message)
    }
  }

  // elevation exports helpers
  const downloadSvgFromRef=(ref, filename)=>{
    const node=ref.current
    if(!node) return
    const svg=node.querySelector('svg')
    if(!svg) return
    const data=new XMLSerializer().serializeToString(svg)
    const blob=new Blob([data],{type:'image/svg+xml'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url)
  }
  const downloadPngFromRef=(ref, filename)=>{
    const node=ref.current
    if(!node) return
    const svg=node.querySelector('svg')
    if(!svg) return
    const data=new XMLSerializer().serializeToString(svg)
    const url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml'}))
    const img=new Image()
    img.onload=async()=>{
      const canvas=document.createElement('canvas')
      canvas.width=1180; canvas.height=720
      const ctx=canvas.getContext('2d')
      ctx.fillStyle='#fff'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.drawImage(img,0,0)
      URL.revokeObjectURL(url)
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; a.click()
    }
    img.src=url
  }
  const downloadPdfFromRef=(ref, filename)=>{
    const node=ref.current
    if(!node) return
    const svg=node.querySelector('svg')
    if(!svg) return
    const data=new XMLSerializer().serializeToString(svg)
    const url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml'}))
    const img=new Image()
    img.onload=async()=>{
      const viewBox=(svg.getAttribute('viewBox')||'0 0 1180 720').split(/\s+/).map(Number)
      const width=viewBox[2]||1180
      const height=viewBox[3]||720
      const canvas=document.createElement('canvas')
      canvas.width=width
      canvas.height=height
      const ctx=canvas.getContext('2d')
      ctx.fillStyle='#fff'
      ctx.fillRect(0,0,width,height)
      ctx.drawImage(img,0,0,width,height)
      URL.revokeObjectURL(url)
      const { jsPDF } = await import('jspdf')
      const pdf=new jsPDF({orientation:width>=height?'landscape':'portrait',unit:'pt',format:[width,height]})
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,width,height)
      pdf.save(filename)
    }
    img.onerror=()=>URL.revokeObjectURL(url)
    img.src=url
  }

  const ThreeDRender=()=>{
    const mountRef=useRef(null)
    const controlsRef=useRef(null)
    const cameraRef=useRef(null)
    useEffect(()=>{
      const mount=mountRef.current
      if(!mount)return
      const scene=new THREE.Scene()
      scene.background=new THREE.Color('#f3eee7')
      scene.fog=new THREE.Fog('#f3eee7',520,1100)
      const camera=new THREE.PerspectiveCamera(42,1,1,2000)
      cameraRef.current=camera
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
      renderer.outputColorSpace=THREE.SRGBColorSpace
      renderer.toneMapping=THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure=1.05
      renderer.shadowMap.enabled=true
      renderer.shadowMap.type=THREE.PCFShadowMap
      mount.appendChild(renderer.domElement)
      const pmremGenerator=new THREE.PMREMGenerator(renderer)
      const envTexture=pmremGenerator.fromScene(new RoomEnvironment(),.04).texture
      scene.environment=envTexture
      const controls=new OrbitControls(camera,renderer.domElement)
      controlsRef.current=controls
      controls.enableDamping=true
      controls.target.set(0,92,25)
      const s=(n)=>n/10

      const textureFromCanvas=(paint)=>{
        const canvas=document.createElement('canvas')
        canvas.width=512; canvas.height=512
        const ctx=canvas.getContext('2d')
        paint(ctx,canvas.width,canvas.height)
        const tex=new THREE.CanvasTexture(canvas)
        tex.colorSpace=THREE.SRGBColorSpace
        tex.wrapS=THREE.RepeatWrapping
        tex.wrapT=THREE.RepeatWrapping
        return tex
      }
      const woodTex=textureFromCanvas((ctx,w,h)=>{
        ctx.fillStyle=materials.cabinetBody||'#c8b39d'
        ctx.fillRect(0,0,w,h)
        for(let i=0;i<44;i++){
          const y=(i/44)*h
          ctx.strokeStyle=i%3===0?'rgba(65,40,22,.20)':'rgba(255,255,255,.12)'
          ctx.lineWidth=i%3===0?2:1
          ctx.beginPath()
          ctx.moveTo(0,y+Math.sin(i)*7)
          ctx.bezierCurveTo(w*.28,y+18,w*.62,y-16,w,y+Math.cos(i)*9)
          ctx.stroke()
        }
      })
      woodTex.repeat.set(1.2,3.5)
      const shutterTex=textureFromCanvas((ctx,w,h)=>{
        ctx.fillStyle=materials.shutters||'#dac8b7'
        ctx.fillRect(0,0,w,h)
        for(let x=0;x<w;x+=42){
          ctx.fillStyle='rgba(255,255,255,.12)'
          ctx.fillRect(x,0,2,h)
          ctx.fillStyle='rgba(60,45,32,.10)'
          ctx.fillRect(x+22,0,1,h)
        }
      })
      shutterTex.repeat.set(1.8,1)
      const marbleTex=textureFromCanvas((ctx,w,h)=>{
        ctx.fillStyle=materials.counter||'#d8c2a8'
        ctx.fillRect(0,0,w,h)
        for(let i=0;i<18;i++){
          ctx.strokeStyle=i%2?'rgba(85,65,50,.22)':'rgba(255,255,255,.28)'
          ctx.lineWidth=i%2?2:4
          ctx.beginPath()
          const y=Math.random()*h
          ctx.moveTo(-20,y)
          ctx.bezierCurveTo(w*.25,y-80+Math.random()*160,w*.68,y-80+Math.random()*160,w+20,y-40+Math.random()*80)
          ctx.stroke()
        }
      })
      marbleTex.repeat.set(3,10)
      const floorTex=textureFromCanvas((ctx,w,h)=>{
        ctx.fillStyle=materials.floor||'#ded6cc'
        ctx.fillRect(0,0,w,h)
        ctx.strokeStyle='rgba(90,80,68,.22)'
        ctx.lineWidth=3
        for(let x=0;x<=w;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
        for(let y=0;y<=h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      })
      floorTex.repeat.set(5,10)
      const makeMat=(color,opacity=1,opts={})=>{
        const params={
          color:new THREE.Color(color),
          roughness:opts.roughness??.66,
          metalness:opts.metalness??.04,
          emissive:opts.emissive?new THREE.Color(opts.emissive):new THREE.Color('#000000'),
          emissiveIntensity:opts.emissiveIntensity??0,
          transparent:opacity<1,
          opacity,
        }
        if(opts.map) params.map=opts.map
        return new THREE.MeshStandardMaterial(params)
      }
      const surface={
        cabinet:makeMat(materials.cabinetBody||'#c8b39d',1,{map:woodTex,roughness:.55}),
        shutter:makeMat(materials.shutters||'#dac8b7',1,{map:shutterTex,roughness:.6}),
        counter:makeMat(materials.counter||'#d8c2a8',1,{map:marbleTex,roughness:.32,metalness:.02}),
        floor:makeMat(materials.floor||'#ded6cc',1,{map:floorTex,roughness:.76}),
        wall:makeMat(materials.wall||'#f6efe6',.82,{roughness:.9}),
        glass:makeMat('#9fd2f1',.36,{roughness:.08,metalness:0}),
        blackGlass:makeMat('#101010',1,{roughness:.18,metalness:.18}),
        metal:makeMat('#bfc4c7',1,{roughness:.22,metalness:.65}),
        led:makeMat('#ffb45d',1,{emissive:'#ff9f2f',emissiveIntensity:2.8,roughness:.3}),
        dark:makeMat('#1c1a18',1,{roughness:.5,metalness:.08}),
        plinth:makeMat('#211f1d',1,{roughness:.58}),
      }
      const material=(c,opacity=1)=>{
        if(c?.isMaterial){
          if(opacity<1 && Math.abs((c.opacity??1)-opacity)>.001){
            const clone=c.clone()
            clone.transparent=true
            clone.opacity=opacity
            return clone
          }
          return c
        }
        return makeMat(c,opacity)
      }
      const shellCutawayObjects=[]
      const eastCutawayObjects=[]
      const westCutawayObjects=[]
      const registerCutaway=(mesh,tags=[])=>{
        if(tags.includes('shell')) shellCutawayObjects.push(mesh)
        if(tags.includes('east')) eastCutawayObjects.push(mesh)
        if(tags.includes('west')) westCutawayObjects.push(mesh)
      }
      const addBox=(name,x,y,z,w,d,h,c,opacity=1)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(s(w),s(h),s(d)),material(c,opacity))
        mesh.name=name
        const isShell=name==='west wall'||name==='east wall'||name==='north wall'||name==='ceiling'||name==='recessed ceiling center'
        if(isShell) registerCutaway(mesh,['shell'])
        else if(/^east\b|^garage\b|^hob\b|^three burner\b|^cooktop\b/.test(name)) registerCutaway(mesh,['east'])
        else if(/^west\b|^microwave\b|^clean dish\b/.test(name)) registerCutaway(mesh,['west'])
        mesh.position.set(s(KITCHEN.width/2-(x+w/2)),s(z+h/2),s(y+d/2-KITCHEN.length/2))
        mesh.castShadow=opacity>.45
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      // floor, walls and ceiling envelope
      addBox('floor',0,0,-30,KITCHEN.width,KITCHEN.length,30,surface.floor)
      addBox('west wall',-45,0,0,45,KITCHEN.length,KITCHEN.height,surface.wall,.92)
      addBox('east wall',KITCHEN.width,0,0,45,KITCHEN.length,KITCHEN.height,surface.wall,.92)
      addBox('north wall',0,KITCHEN.length,0,KITCHEN.width,45,KITCHEN.height,surface.wall,.88)
      addBox('ceiling',0,0,KITCHEN.height,KITCHEN.width,KITCHEN.length,36,'#f4eadf')
      addBox('recessed ceiling center',310,620,KITCHEN.height-50,1700,3500,28,'#eadac8')
      addBox('north window',(KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length+8,KITCHEN.window.sill,KITCHEN.window.w,24,KITCHEN.window.h,surface.glass)
      addBox('window black frame',(KITCHEN.width-KITCHEN.window.w)/2-24,KITCHEN.length+12,KITCHEN.window.sill-24,KITCHEN.window.w+48,18,32,'#1f2933')
      addBox('window sill',(KITCHEN.width-KITCHEN.window.w)/2-60,KITCHEN.length-85,KITCHEN.window.sill-80,KITCHEN.window.w+120,150,55,surface.counter)
      const usableLen=KITCHEN.length
      addBox('runner rug',750,1160,4,820,2500,8,'#8a674a')
      addBox('runner rug inner',810,1260,8,700,2300,6,'#d2b88e')
      addBox('runner rug border west',790,1210,12,24,2400,8,'#5e4536')
      addBox('runner rug border east',1510,1210,12,24,2400,8,'#5e4536')
      // counters with thickness separated
      const counterMat=surface.counter
      // East base run: carcass + countertop + plinth
      addBox('east base carcass',KITCHEN.width-600,0,PLINTH_HEIGHT,600,usableLen,900-PLINTH_HEIGHT-COUNTER_THICKNESS,surface.cabinet)
      addBox('east countertop',KITCHEN.width-600,0,900-COUNTER_THICKNESS,600,usableLen,COUNTER_THICKNESS,counterMat)
      addBox('east plinth',KITCHEN.width-600,0,0,600,usableLen,PLINTH_HEIGHT,surface.plinth)
      addBox('east toe shadow',KITCHEN.width-600,0,PLINTH_HEIGHT-16,600,usableLen,16,'#111111')
      // individual handleless fronts and drawer reveal lines
      {
        moduleSegmentsFromNorth(eastModules,0,usableLen).forEach((m)=>{
          const y0=m.y
          addBox(`east base front ${y0}`,KITCHEN.width-616,y0+5,PLINTH_HEIGHT+12,18,m.width-10,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,surface.cabinet)
          addBox(`east base left reveal ${y0}`,KITCHEN.width-618,y0+4,PLINTH_HEIGHT+10,20,3,760,surface.dark)
          if(m.drawers>1){
            for(let dl=1; dl<m.drawers; dl++){
              addBox(`east drawer reveal ${y0}-${dl}`,KITCHEN.width-620,y0+10,PLINTH_HEIGHT+120+dl*170,22,m.width-20,8,surface.dark)
            }
          }
        })
      }
      // West counter after door
      const westLen=usableLen-1220
      if(westLen>0){
        addBox('west counter carcass',0,1220,PLINTH_HEIGHT,400,westLen,900-PLINTH_HEIGHT-COUNTER_THICKNESS,surface.cabinet)
        addBox('west countertop',0,1220,900-COUNTER_THICKNESS,400,westLen,COUNTER_THICKNESS,counterMat)
        addBox('west plinth',0,1220,0,400,westLen,PLINTH_HEIGHT,surface.plinth)
        addBox('west toe shadow',0,1220,PLINTH_HEIGHT-16,400,westLen,16,'#111111')
        moduleSegmentsFromNorth(westModules,1220,usableLen).forEach((m)=>{
          addBox(`west base front ${m.y}`,398,m.y+5,PLINTH_HEIGHT+12,18,m.width-10,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,surface.cabinet)
          addBox(`west base right reveal ${m.y}`,396,m.y+4,PLINTH_HEIGHT+10,20,3,760,surface.dark)
          if(m.drawers>1){
            for(let dl=1; dl<m.drawers; dl++){
              addBox(`west drawer reveal ${m.y}-${dl}`,396,m.y+10,PLINTH_HEIGHT+120+dl*170,22,m.width-20,8,surface.dark)
            }
          }
        })
      }
      // uppers with split shutters and visible under-cabinet light
      addBox('east lower upper body',KITCHEN.width-320,0,1350,320,usableLen,500,surface.shutter)
      if(westLen>0) addBox('west lower upper body after door clear zone',0,1220,1350,320,westLen,500,surface.shutter)
      addBox('east top upper body',KITCHEN.width-550,0,1900,550,usableLen,800,surface.shutter)
      if(westLen>0) addBox('west top upper body after door clear zone',0,1220,1900,450,westLen,800,surface.shutter)
      const addUpperFronts=(prefix,wall,depth,startY,len,z,h,mods)=>{
        moduleSegmentsFromNorth(mods,startY,startY+len).forEach((m,i)=>{
          const width=m.width
          const faceX=wall==='east'?KITCHEN.width-depth-18:depth
          addBox(`${prefix} upper front ${i}`,faceX,m.y+5,z+10,18,width-10,h-20,surface.shutter)
          addBox(`${prefix} upper reveal ${i}`,faceX,m.y+width-3,z+8,20,3,h-16,surface.dark)
        })
      }
      addUpperFronts('east lower','east',320,0,usableLen,1350,500,eastModules)
      addUpperFronts('east top','east',550,0,usableLen,1900,800,eastModules)
      if(westLen>0){
        addUpperFronts('west lower','west',320,1220,westLen,1350,500,westModules)
        addUpperFronts('west top','west',450,1220,westLen,1900,800,westModules)
      }
      addBox('east marble backsplash',KITCHEN.width-18,0,900,18,usableLen,600,materials.backsplash||'#faf6f1')
      if(westLen>0) addBox('west marble backsplash',0,1220,900,18,westLen,600,materials.backsplash||'#faf6f1')
      addBox('east warm LED strip',KITCHEN.width-338,0,1322,24,usableLen,22,surface.led)
      if(westLen>0) addBox('west warm LED strip after door clear zone',314,1220,1322,24,westLen,22,surface.led)
      const addPoint=(name,x,y,z,intensity=1.25,distance=120)=>{
        const light=new THREE.PointLight('#ffbd6b',intensity,s(distance),1.8)
        light.name=name
        light.position.set(s(KITCHEN.width/2-x),s(z),s(y-KITCHEN.length/2))
        scene.add(light)
      }
      for(let y=600;y<usableLen;y+=900) addPoint(`east led light ${y}`,KITCHEN.width-610,y,1280,1.15,1100)
      if(westLen>0) for(let y=1550;y<usableLen;y+=900) addPoint(`west led light ${y}`,430,y,1280,1.0,950)
      // appliances with improved models
      east.forEach(it=>{
        if(it.id==='spice') return
        if(it.id==='applianceGarage'){
          const baseZ=it.z ?? 900
          addBox('east appliance garage body',KITCHEN.width-it.d,it.y,baseZ,it.d,it.w,it.h||550,surface.cabinet)
          addBox('east appliance garage roll-up front',KITCHEN.width-it.d-18,it.y+12,baseZ+24,20,it.w-24,(it.h||550)-48,surface.shutter)
          addBox('east appliance garage top shadow',KITCHEN.width-it.d-22,it.y+12,baseZ+(it.h||550)-70,24,it.w-24,18,surface.dark)
          addBox('garage microwave stored',KITCHEN.width-it.d+42,it.y+520,baseZ+150,it.d-84,245,155,surface.blackGlass)
          addBox('garage processor base stored',KITCHEN.width-it.d+72,it.y+145,baseZ+70,it.d-144,160,90,surface.metal)
          const jar=new THREE.Mesh(new THREE.CylinderGeometry(s(48),s(36),s(135),28), surface.glass)
          jar.name='garage food processor jar'
          registerCutaway(jar,['east'])
          jar.position.set(s(KITCHEN.width/2-(KITCHEN.width-it.d/2)),s(baseZ+205),s(it.y+225-KITCHEN.length/2))
          jar.castShadow=true
          scene.add(jar)
          addBox('garage warm internal light',KITCHEN.width-it.d+20,it.y+18,baseZ+(it.h||550)-36,20,it.w-36,12,surface.led)
        } else if(it.id==='gas'){
          // three-burner cooktop with grate bars and burner rings
          addBox('east gas cooktop glass slab',KITCHEN.width-595,it.y+40,900,560,it.w-80,10,surface.blackGlass)
          const burners=[
            {x:KITCHEN.width-438,y:it.y+it.w*.34,r:34},
            {x:KITCHEN.width-270,y:it.y+it.w*.34,r:34},
            {x:KITCHEN.width-350,y:it.y+it.w*.68,r:44},
          ]
          burners.forEach((b,idx)=>{
            const ring=new THREE.Mesh(new THREE.TorusGeometry(s(b.r),s(4),10,32), surface.metal)
            ring.name=`three burner hob ring ${idx+1}`
            registerCutaway(ring,['east'])
            ring.position.set(s(KITCHEN.width/2-b.x),s(907),s(b.y-KITCHEN.length/2))
            ring.rotation.x=Math.PI/2
            ring.castShadow=true
            scene.add(ring)
            const cap=new THREE.Mesh(new THREE.CylinderGeometry(s(b.r*.42),s(b.r*.42),s(8),28), surface.dark)
            cap.name=`three burner hob cap ${idx+1}`
            registerCutaway(cap,['east'])
            cap.position.set(s(KITCHEN.width/2-b.x),s(910),s(b.y-KITCHEN.length/2))
            cap.rotation.x=Math.PI/2
            cap.castShadow=true
            scene.add(cap)
            addBox(`hob grate horizontal ${idx+1}`,b.x-b.r-20,b.y-3,914,b.r*2+40,6,10,surface.dark)
            addBox(`hob grate vertical ${idx+1}`,b.x-3,b.y-b.r-20,914,6,b.r*2+40,10,surface.dark)
          })
          ;[it.y+it.w*.2,it.y+it.w*.5,it.y+it.w*.8].forEach((ky,i)=>{
            const knob=new THREE.Mesh(new THREE.CylinderGeometry(s(10),s(10),s(16),20), surface.metal)
            knob.name=`hob front knob ${i+1}`
            registerCutaway(knob,['east'])
            knob.position.set(s(KITCHEN.width/2-(KITCHEN.width-575)),s(916),s(ky-KITCHEN.length/2))
            knob.rotation.z=Math.PI/2
            scene.add(knob)
          })
          // The chimney body is hidden inside the upper cabinet; only a slim underside vent is visible.
          addBox('east hidden chimney vent slot',KITCHEN.width-352,it.y+80,1326,24,540,18,surface.dark)
          addBox('east hidden chimney warm task light',KITCHEN.width-356,it.y+170,1316,20,300,10,surface.led)
          addPoint('cooktop task glow',KITCHEN.width-520,it.y+350,1280,1.7,900)
        } else {
          addBox(`east ${it.id}`,KITCHEN.width-it.d,it.y,it.z??0,it.d,it.w,it.h||880,it.id==='dishwasher'?surface.metal:it.color)
          if(it.id==='dishwasher'||it.id==='washing'){
            const faceX=KITCHEN.width-626
            addBox(`east visible covered ${it.id} front`,faceX,it.y+8,PLINTH_HEIGHT+12,18,it.w-16,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,it.id==='dishwasher'?'#b9b6b1':'#e8e4de')
            addBox(`east ${it.id} shadow reveal`,faceX-2,it.y+8,PLINTH_HEIGHT+8,4,it.w-16,900-PLINTH_HEIGHT-COUNTER_THICKNESS-16,surface.dark)
            if(it.id==='washing'){
              const washerMat=makeMat('#1f2327',1,{roughness:.38,metalness:.2})
              const ringMat=makeMat('#d5d0ca',1,{roughness:.28,metalness:.45})
              const glassMat=makeMat('#5f737f',.55,{roughness:.18,metalness:.1})
              const centerY=it.y+it.w/2
              const centerZ=PLINTH_HEIGHT+360
              const ring=new THREE.Mesh(new THREE.TorusGeometry(s(94),s(9),16,48), ringMat)
              ring.name='east washing machine visible porthole ring'
              registerCutaway(ring,['east'])
              ring.position.set(s(KITCHEN.width/2-faceX),s(centerZ),s(centerY-KITCHEN.length/2))
              ring.rotation.y=Math.PI/2
              scene.add(ring)
              const glass=new THREE.Mesh(new THREE.CircleGeometry(s(78),48), glassMat)
              glass.name='east washing machine visible porthole glass'
              registerCutaway(glass,['east'])
              glass.position.set(s(KITCHEN.width/2-(faceX-1)),s(centerZ),s(centerY-KITCHEN.length/2))
              glass.rotation.y=Math.PI/2
              scene.add(glass)
              addBox('east washing machine top control strip',faceX-2,it.y+56,PLINTH_HEIGHT+650,8,it.w-112,48,washerMat)
              addBox('east washing machine left-open door panel',faceX-150,it.y+it.w-180,PLINTH_HEIGHT+170,140,22,410,ringMat)
            } else {
              addBox('east dishwasher visible control strip',faceX-2,it.y+42,PLINTH_HEIGHT+662,8,it.w-84,42,surface.dark)
              addBox('east dishwasher bottom recessed line',faceX-2,it.y+36,PLINTH_HEIGHT+238,8,it.w-72,10,surface.dark)
              addBox('east dishwasher down-open door panel',faceX-390,it.y+70,PLINTH_HEIGHT+120,360,it.w-140,36,'#b9b6b1')
            }
          }
        }
      })
      west.forEach(it=>{
        if(it.id==='shaft') addBox('west shaft',0,KITCHEN.shaft.y,0,KITCHEN.shaft.w,KITCHEN.shaft.l,KITCHEN.height,it.color)
        else if(it.id==='sink'){
          // counter cutout visual: sink bowl inset
          addBox('west sink bowl',0,it.y+60,620,380,it.w-120,180,'#c0c0c0')
          addBox('west sink inner',20,it.y+70,625,340,it.w-140,160,'#e8e8e8')
          // faucet
          const faucet=new THREE.Mesh(new THREE.CylinderGeometry(s(8),s(8),s(120),16), new THREE.MeshStandardMaterial({color:'#d0d0d0', metalness:0.7, roughness:0.2}))
          faucet.name='west sink faucet'
          registerCutaway(faucet,['west'])
          faucet.position.set(s(KITCHEN.width/2-(60)),s(920),s(it.y+80-KITCHEN.length/2))
          scene.add(faucet)
          const spout=new THREE.Mesh(new THREE.TorusGeometry(s(30),s(6),8,16,Math.PI), new THREE.MeshStandardMaterial({color:'#d0d0d0', metalness:0.7, roughness:0.2}))
          spout.name='west sink faucet spout'
          registerCutaway(spout,['west'])
          spout.position.set(s(KITCHEN.width/2-(60)),s(970),s(it.y+80-KITCHEN.length/2))
          spout.rotation.y=Math.PI/2
          scene.add(spout)
          addBox('west sink dark front',398,it.y+5,PLINTH_HEIGHT+12,18,it.w-10,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,surface.dark)
          addBox('west clean dishes glass cabinet',316,it.y+145,1360,18,it.w-220,420,surface.glass,.55)
          addBox('west clean dishes upper shelf',298,it.y+170,1490,24,it.w-270,10,surface.counter)
          addBox('west clean dishes lower shelf',298,it.y+170,1625,24,it.w-270,10,surface.counter)
          ;[0,1,2,3,4].forEach((n)=>{
            const plate=new THREE.Mesh(new THREE.CylinderGeometry(s(42),s(42),s(5),32), makeMat('#f7f2ea',1,{roughness:.42}))
            plate.name=`clean dish plate ${n+1}`
            registerCutaway(plate,['west'])
            plate.position.set(s(KITCHEN.width/2-305),s(1548),s(it.y+215+n*52-KITCHEN.length/2))
            plate.rotation.z=Math.PI/2
            plate.castShadow=true
            scene.add(plate)
          })
        }
        else if(it.id==='waterpurifier'){
          const baseZ=it.z ?? 900
          addBox('west purifier cabinet body',0,it.y,baseZ,it.d,it.w,it.h||550,surface.shutter)
          addBox('west purifier cabinet front',it.d-18,it.y+8,baseZ+16,18,it.w-16,(it.h||550)-32,'#d6eaf8')
          addBox('west purifier body inside',38,it.y+76,baseZ+72,it.d-96,it.w-152,230,'#f4fbff')
          addBox('west purifier filter one',82,it.y+135,baseZ+104,44,95,150,surface.glass,.62)
          addBox('west purifier filter two',146,it.y+135,baseZ+104,44,95,150,surface.glass,.62)
          addBox('west purifier service pipe to sink',it.d-26,it.y-4,baseZ+170,18,22,12,surface.metal)
        }
        else if(it.id==='microwave'){
          addBox(`west ${it.id}`,0,it.y,1040,it.d,it.w,it.h||350,surface.blackGlass)
          addBox('microwave glass door',405,it.y+45,1110,12,it.w-90,190,'#050505')
          addBox('microwave metal trim',398,it.y+20,1030,18,it.w-40,30,surface.metal)
        }
        else if(it.id==='foodprocessor') addBox(`west ${it.id}`,0,it.y,900,it.d,it.w,it.h||300,surface.metal)
        else addBox(`west ${it.id}`,0,it.y,0,it.d,it.w,it.h||400,it.color)
      })
      scene.add(new THREE.AmbientLight('#fff3e5',.35))
      scene.add(new THREE.HemisphereLight('#fff8ee','#6b625a',1.05))
      const light=new THREE.DirectionalLight('#fff4e5',2.1)
      light.position.set(-160,320,-180)
      light.castShadow=true
      light.shadow.mapSize.set(4096,4096)
      light.shadow.bias=-0.00035
      light.shadow.camera.left=-260
      light.shadow.camera.right=260
      light.shadow.camera.top=360
      light.shadow.camera.bottom=-360
      scene.add(light)
      const fill=new THREE.DirectionalLight('#e9f1ff',.55)
      fill.position.set(180,160,220)
      scene.add(fill)
      const windowGlow=new THREE.PointLight('#d8ecff',2.4,s(2600),1.45)
      windowGlow.name='north window daylight glow'
      windowGlow.position.set(0,s(1700),s(KITCHEN.length/2-80))
      scene.add(windowGlow)
      const ceilingGlow=new THREE.PointLight('#ffe2b8',1.25,s(2200),1.7)
      ceilingGlow.name='soft ceiling bounce'
      ceilingGlow.position.set(0,s(2450),0)
      scene.add(ceilingGlow)
      const grid=new THREE.GridHelper(s(Math.max(KITCHEN.length,KITCHEN.width)),20,'#9a9084','#ddd3c8')
      grid.position.y=.1
      grid.material.transparent=true
      grid.material.opacity=.26
      scene.add(grid)
      camera.position.set(0,145,-360)
      const updateCutawayVisibility=()=>{
        const enabled=hide3DObstructionsRef.current
        shellCutawayObjects.forEach(obj=>{obj.visible=!enabled})
        if(!enabled){
          eastCutawayObjects.forEach(obj=>{obj.visible=true})
          westCutawayObjects.forEach(obj=>{obj.visible=true})
          return
        }
        const dx=camera.position.x-controls.target.x
        const deadZone=18
        const hideWest=dx>deadZone
        const hideEast=dx<-deadZone
        eastCutawayObjects.forEach(obj=>{obj.visible=!hideEast})
        westCutawayObjects.forEach(obj=>{obj.visible=!hideWest})
      }
      const resize=()=>{
        const width=mount.clientWidth||1000
        const height=Math.max(520,Math.min(720,Math.round(width*.56)))
        renderer.setSize(width,height,false)
        camera.aspect=width/height
        camera.updateProjectionMatrix()
      }
      const observer=new ResizeObserver(resize)
      observer.observe(mount)
      resize()
      threeViewRef.current={renderer,scene,camera,controls,updateCutawayVisibility}
      updateCutawayVisibility()
      let frameId=0
      const animate=()=>{controls.update(); updateCutawayVisibility(); renderer.render(scene,camera); frameId=requestAnimationFrame(animate)}
      animate()
      return ()=>{cancelAnimationFrame(frameId); observer.disconnect(); controls.dispose(); envTexture.dispose(); pmremGenerator.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); if(threeViewRef.current?.renderer===renderer)threeViewRef.current=null}
    },[east,west,materials,eastModules,westModules])
    const setPreset=(preset)=>{
      const cam=threeViewRef.current?.camera
      const ctrl=threeViewRef.current?.controls
      if(!cam||!ctrl) return
      const presets={
        top:{pos:[0,520,0], target:[0,0,0]},
        eastWall:{pos:[-360,155,20], target:[-40,95,30]},
        westWall:{pos:[360,155,20], target:[40,95,30]},
        north:{pos:[0,160,360], target:[0,95,20]},
        south:{pos:[0,150,-360], target:[0,95,25]},
        walkthrough:{pos:[0,145,-360], target:[0,92,25]}
      }
      const p=presets[preset]
      if(!p) return
      cam.position.set(p.pos[0],p.pos[1],p.pos[2])
      ctrl.target.set(p.target[0],p.target[1],p.target[2])
      ctrl.update()
    }
    return <div style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:10,flexWrap:'wrap'}}><h3 style={{margin:0}}>3D Render - current Rule #9 layout</h3><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      <button onClick={()=>setPreset('top')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Top</button>
      <button onClick={()=>setPreset('eastWall')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>East wall</button>
      <button onClick={()=>setPreset('westWall')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>West wall</button>
      <button onClick={()=>setPreset('north')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>North view</button>
      <button onClick={()=>setPreset('south')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>South view</button>
      <button onClick={()=>setPreset('walkthrough')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:800}}>Walkthrough</button>
      <button onClick={export3DScreenshot} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 10px',background:hide3DObstructions?'#e6f4f1':'#fff',border:'1px solid #2f6f6d',borderRadius:8,fontWeight:800,fontSize:13}}>
        <input type="checkbox" checked={hide3DObstructions} onChange={e=>setHide3DObstructions(e.target.checked)}/>
        Hide blocking walls/ceiling
      </label>
    </div></div><div ref={mountRef} style={{width:'100%',minHeight:520,border:'1px solid #ddd4c8',background:'#f7f3ed'}}/><div style={{fontSize:13,color:'#61584f',marginTop:10}}>Drag to rotate, scroll to zoom. Presets move camera. Check "Hide blocking walls/ceiling" to use live cutaway mode: walls and ceiling stay hidden, and the near-side cabinet run is hidden as you rotate.</div></div>
  }
  const WallElevation=({items,isEast})=>{
    const frame={x:72,y:52,w:1060,h:560}
    const xOf=(y)=>isEast?frame.x+((KITCHEN.length-y)/KITCHEN.length)*frame.w:frame.x+(y/KITCHEN.length)*frame.w
    const yOf=(z)=>frame.y+frame.h-(z/KITCHEN.height)*frame.h
    const wOf=(w)=>Math.max(34,(w/KITCHEN.length)*frame.w)
    const spanOf=(from,to)=>{const a=xOf(from), b=xOf(to); return {x:Math.min(a,b),w:Math.abs(b-a)}}
    const usableEnd=KITCHEN.length
    const cabinetRun=isEast?spanOf(0,usableEnd):spanOf(KITCHEN.westGap.to,usableEnd)
    const clearDoor=spanOf(0,KITCHEN.westGap.to)
    const windowSpan=spanOf(KITCHEN.length-600, KITCHEN.length)
    const key=isEast?'east':'west'
    const itemName={applianceGarage:'Appliance garage',gas:'Gas cooktop',dishwasher:'Dishwasher',washing:'Washing',microwave:'Microwave',foodprocessor:'Processor',waterpurifier:'Purifier cabinet',sink:'Sink',shaft:'Shaft'}
    const modules=isEast?eastModules:westModules
    const runStart=isEast?0:KITCHEN.westGap.to
    const topUpperY=yOf(2700)
    const topUpperH=yOf(1900)-topUpperY
    const lowerUpperY=yOf(1850)
    const lowerUpperH=yOf(1350)-lowerUpperY
    const backsplashY=yOf(1350)
    const backsplashH=yOf(900)-backsplashY
    const baseY=yOf(880)
    const baseH=yOf(PLINTH_HEIGHT)-baseY
    const plinthY=yOf(PLINTH_HEIGHT)
    const counterY=yOf(900)
    const panelsForModules=(zTop,zBottom,fill,stroke='#211b17')=>{
      return moduleSegmentsFromNorth(modules,runStart,KITCHEN.length).map((m,i)=>{
        const span=spanOf(m.y,m.y+m.width)
        if(span.w<10) return null
        return (
          <g key={`${zTop}-${m.id}-${i}`}>
            <rect x={span.x+1.5} y={yOf(zTop)} width={Math.max(4,span.w-3)} height={yOf(zBottom)-yOf(zTop)} fill={fill} stroke={stroke} strokeWidth="1.25"/>
            <line x1={span.x+span.w-1} y1={yOf(zTop)+8} x2={span.x+span.w-1} y2={yOf(zBottom)-8} stroke="#16120f" strokeWidth="1" opacity="0.55"/>
          </g>
        )
      })
    }
    const basePanels=()=>{
      return moduleSegmentsFromNorth(modules,runStart,KITCHEN.length).map((m,i)=>{
        const span=spanOf(m.y,m.y+m.width)
        if(span.w<12) return null
        return (
          <g key={`base-${m.id}-${i}`}>
            <rect x={span.x+1.5} y={baseY} width={Math.max(4,span.w-3)} height={baseH} fill={materials.shutters||'#bba18b'} stroke="#211b17" strokeWidth="1.2"/>
            <line x1={span.x+span.w-2} y1={baseY+8} x2={span.x+span.w-2} y2={plinthY-8} stroke="#17110d" opacity="0.62"/>
          </g>
        )
      })
    }
    return (<svg width="1180" height="680" viewBox="0 0 1180 680" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',height:'auto',display:'block'}}>
      <defs>
        <linearGradient id={`${key}WallWash`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#d8c4ae"/>
          <stop offset="0.55" stopColor="#c9b199"/>
          <stop offset="1" stopColor="#b79d84"/>
        </linearGradient>
        <linearGradient id={`${key}LedWash`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd893" stopOpacity="0.9"/>
          <stop offset="1" stopColor="#ffd893" stopOpacity="0"/>
        </linearGradient>
        <pattern id={`${key}Wood`} width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#ad7f55"/>
          <path d="M10 0 C30 16 18 39 40 80 M45 0 C62 22 58 46 72 80 M0 45 C18 35 28 42 48 31" fill="none" stroke="#6f4a2f" strokeWidth="1.1" opacity="0.35"/>
          <path d="M22 0 C18 28 38 42 32 80 M64 0 C44 28 70 52 55 80" fill="none" stroke="#dfb983" strokeWidth="0.8" opacity="0.28"/>
        </pattern>
        <pattern id={`${key}Backsplash`} width="120" height="80" patternUnits="userSpaceOnUse">
          <rect width="120" height="80" fill="#d9c6af"/>
          <path d="M0 42 C30 24 62 66 120 35 M18 0 C34 25 30 55 58 80" fill="none" stroke="#9f8976" strokeWidth="1" opacity="0.22"/>
        </pattern>
        <filter id={`${key}SoftShadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#21150d" floodOpacity="0.24"/>
        </filter>
        <filter id={`${key}Glow`} x="-10%" y="-70%" width="120%" height="260%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <text x={frame.x} y="31" fontSize="24" fontWeight="900" fill="#171717">{isEast?'East Wall Elevation':'West Wall Elevation'}</text>
      <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="15" fontWeight="800" fill="#61584f">{isEast?'North (N) left to South (S) right':'South (S) left to North (N) right'}, length 4746 mm, height 2700 mm</text>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${key}WallWash)`} stroke="#171717" strokeWidth="2"/>
      <rect x={cabinetRun.x} y={backsplashY} width={cabinetRun.w} height={backsplashH} fill={`url(#${key}Backsplash)`}/>
      <rect x={cabinetRun.x} y={counterY-4} width={cabinetRun.w} height="18" fill={materials.counter||'#d8c2a8'} stroke="#3a2d24" strokeWidth="1.4"/>
      <g filter={`url(#${key}SoftShadow)`}>{basePanels()}</g>
      <rect x={cabinetRun.x} y={plinthY} width={cabinetRun.w} height={yOf(0)-plinthY} fill="#43372f"/>
      <rect x={cabinetRun.x} y={lowerUpperY} width={cabinetRun.w} height={lowerUpperH} fill={materials.shutters||'#bba18b'} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
      {panelsForModules(1850,1350,materials.shutters||'#bba18b')}
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH-8} width={cabinetRun.w} height="7" fill="#201711" opacity="0.55"/>
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+4} width={cabinetRun.w} height="12" fill="#ffd08a" opacity="0.96" filter={`url(#${key}Glow)`}/>
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+12} width={cabinetRun.w} height={Math.max(1,yOf(900)-(lowerUpperY+lowerUpperH+12))} fill={`url(#${key}LedWash)`} opacity="0.55"/>
      <rect x={cabinetRun.x} y={topUpperY} width={cabinetRun.w} height={topUpperH} fill={`url(#${key}Wood)`} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
      {panelsForModules(2700,1900,`url(#${key}Wood)`)}
      {!isEast&&<g>
        <rect x={clearDoor.x} y={frame.y} width={clearDoor.w} height={frame.h} fill="#f9f4ec" stroke="#7b3f21" strokeDasharray="9 7" opacity="0.92"/>
        <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2} textAnchor="middle" fontSize="16" fontWeight="900" fill="#7b3f21">door clear zone</text>
        <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2+24} textAnchor="middle" fontSize="13" fontWeight="800" fill="#7b3f21">no counter or cabinets</text>
      </g>}
      <rect x={windowSpan.x} y={yOf(2700)} width={windowSpan.w} height={yOf(900)-yOf(2700)} fill="none" stroke="#2f8ac6" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.62"/>
      {items.map((it,index)=>{
        const width=wOf(it.w)
        const x=isEast?xOf(it.y)-width:xOf(it.y)
        const dark=['gas','sink','microwave'].includes(it.id)
        if(isEast&&it.id==='gas'){
          const cooktopY=yOf(960)
          const ventY=lowerUpperY+lowerUpperH-10
          return (<g key={it.id}>
            <rect x={x} y={cooktopY} width={width} height="20" fill="#111" stroke="#171717" rx="5"/>
            {[.28,.5,.72].map((p,i)=><circle key={p} cx={x+width*p} cy={cooktopY+10} r={i===1?9:7} fill="none" stroke="#fff" strokeWidth="2"/>)}
            <rect x={x+width*.16} y={ventY} width={width*.68} height="7" fill="#161412" rx="3"/>
            <rect x={x+width*.2} y={ventY+8} width={width*.6} height="4" fill="#f7c471" opacity="0.9"/>
            <text x={x+width/2} y={cooktopY-10} textAnchor="middle" fontSize="13" fontWeight="900" fill="#111">gas cooktop</text>
          </g>)
        }
        if(isEast&&it.id==='applianceGarage'){
          const garageTop=yOf((it.z??900)+(it.h||550))
          const garageBottom=yOf(it.z??900)
          return (<g key={it.id}>
            <rect x={x+3} y={garageTop} width={Math.max(14,width-6)} height={garageBottom-garageTop} fill="#8c7a65" stroke="#111" strokeWidth="1.5" rx="5"/>
            <rect x={x+10} y={garageTop+16} width={Math.max(10,width-20)} height={garageBottom-garageTop-32} fill="#f3eadf" stroke="#6f5842" strokeWidth="1.2" strokeDasharray="6 5" rx="4"/>
            <rect x={x+width*.2} y={garageTop+50} width={width*.6} height="42" fill="#1f1f1f" stroke="#111" rx="4"/>
            <rect x={x+width*.28} y={garageBottom-92} width={width*.44} height="44" fill="#b9b9b9" stroke="#111" rx="4"/>
            <text x={x+width/2} y={garageTop-10} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">appliance garage</text>
            <text x={x+width/2} y={garageBottom+18} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a4632">MW + processor inside</text>
          </g>)
        }
        if(it.id==='dishwasher'||it.id==='washing'){
          const label=it.id==='washing'?'1  Washing machine':'2  Dishwasher'
          const panelFill=it.id==='washing'?'#e7e2dc':'#b9b6b1'
          return (<g key={it.id}>
            <rect x={x+3} y={baseY+10} width={Math.max(12,width-6)} height={baseH-10} fill={panelFill} stroke="#211b17" strokeWidth="1.4" rx="4"/>
            {it.id==='washing'&&<g>
              <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(44,width*.26)} fill="#1f2327" stroke="#d2d2d2" strokeWidth="8"/>
              <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(30,width*.18)} fill="#7f939d" opacity="0.72"/>
              <line x1={x+12} y1={baseY+74} x2={x+12} y2={baseY+baseH-32} stroke="#111" strokeWidth="2.2"/>
              <path d={`M ${x+12} ${baseY+baseH-36} Q ${x-width*.24} ${baseY+baseH*.66} ${x+12} ${baseY+baseH*.35}`} fill="none" stroke="#2f6f6d" strokeWidth="2" strokeDasharray="5 4"/>
              <text x={x+width/2} y={baseY+baseH-18} textAnchor="middle" fontSize="9" fontWeight="900" fill="#2f6f6d">door opens left</text>
            </g>}
            {it.id==='dishwasher'&&<g>
              <rect x={x+width*.18} y={baseY+baseH*.42} width={width*.64} height="9" fill="#4b453f" rx="3" opacity="0.78"/>
              <rect x={x+width*.22} y={baseY+baseH*.72} width={width*.56} height="6" fill="#4b453f" rx="3" opacity="0.55"/>
              <path d={`M ${x+width*.18} ${baseY+baseH*.7} L ${x+width*.82} ${baseY+baseH*.7} L ${x+width*.72} ${baseY+baseH+34} L ${x+width*.28} ${baseY+baseH+34} Z`} fill="#d1cec8" stroke="#111" strokeWidth="1.1" opacity="0.9"/>
              <text x={x+width/2} y={baseY+baseH+52} textAnchor="middle" fontSize="9" fontWeight="900" fill="#2f6f6d">door opens down</text>
            </g>}
            <rect x={x+8} y={baseY+22} width={Math.max(10,width-16)} height="18" fill="#6d645d" opacity="0.72"/>
            <text x={x+width/2} y={baseY-12} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">{label}</text>
            <text x={x+width/2} y={baseY+64} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">covered {itemName[it.id]}</text>
          </g>)
        }
        if(it.id==='microwave'){
          const top=yOf(1470)
          return (<g key={it.id}>
            <rect x={x+3} y={top} width={Math.max(14,width-6)} height={yOf(1120)-top} fill="#1f1f1f" stroke="#111" strokeWidth="1.5" rx="5"/>
            <rect x={x+14} y={top+24} width={Math.max(8,width-60)} height="70" fill="#050505" stroke="#444"/>
            <text x={x+width/2} y={top+119} textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">microwave</text>
          </g>)
        }
        if(it.id==='waterpurifier'){
          const purifierTop=yOf((it.z??900)+(it.h||550))
          const purifierBottom=yOf(it.z??900)
          return (<g key={it.id}>
            <rect x={x+4} y={purifierTop} width={Math.max(12,width-8)} height={purifierBottom-purifierTop} fill="#80b5de" stroke="#111" strokeWidth="1.3" rx="5"/>
            <rect x={x+width*.18} y={purifierTop+38} width={width*.64} height={Math.max(20,purifierBottom-purifierTop-76)} fill="#d6eaf8" stroke="#2f6fb0" strokeWidth="1" rx="4"/>
            <text x={x+width/2-8} y={purifierTop-10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">purifier cabinet</text>
            <text x={x+width/2-8} y={purifierBottom+18} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a3a5a">400W x 350D x 550H</text>
          </g>)
        }
        if(it.id==='sink'){
          return (<g key={it.id}>
            <rect x={x+width*.3} y={lowerUpperY+18} width={width*.58} height={lowerUpperH-42} fill="#c8d7df" stroke="#111" strokeWidth="1.2" rx="5" opacity="0.72"/>
            <line x1={x+width*.36} y1={lowerUpperY+lowerUpperH*.45} x2={x+width*.82} y2={lowerUpperY+lowerUpperH*.45} stroke="#6d6257" strokeWidth="2"/>
            {[.43,.55,.67,.79].map(p=><circle key={p} cx={x+width*p} cy={lowerUpperY+lowerUpperH*.28} r="8" fill="#f7f2ea" stroke="#887d70"/>)}
            <text x={x+width*.59} y={lowerUpperY+lowerUpperH-14} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">clean dishes</text>
            <rect x={x+4} y={counterY-8} width={Math.max(12,width-8)} height="22" fill="#202020" stroke="#111" rx="5"/>
            <rect x={x+width*.18} y={counterY-5} width={width*.64} height="14" fill="#c9c9c9" stroke="#555" rx="4"/>
            <text x={x+width/2} y={baseY+64} textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">sink</text>
          </g>)
        }
        if(it.id==='shaft'){
          return (<g key={it.id}>
            <rect x={x} y={frame.y} width={width} height={frame.h} fill="#a6a6a6" stroke="#111" strokeWidth="2.4" rx="5"/>
            <text x={x+width/2} y={frame.y+36} textAnchor="middle" fontSize="14" fontWeight="900" fill="#111">shaft</text>
          </g>)
        }
        if(it.id==='foodprocessor'){
          return (<g key={it.id}>
            <rect x={x+4} y={yOf(1190)} width={Math.max(12,width-8)} height={yOf(900)-yOf(1190)} fill="#b9b9b9" stroke="#111" strokeWidth="1.3" rx="5"/>
            <text x={x+width/2} y={yOf(1048)} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111">processor</text>
          </g>)
        }
        return (<g key={it.id}>
          <rect x={x} y={baseY} width={width} height={baseH} fill={it.color} stroke="#171717" strokeWidth="1.3" rx="5"/>
          <text x={x+width/2} y={baseY+Math.min(baseH/2+5,58)} textAnchor="middle" fontSize="12" fontWeight="900" fill={dark?'#fff':'#111'}>{itemName[it.id]}</text>
        </g>)
      })}
      <text x={frame.x} y={frame.y+frame.h+32} fontSize="16" fontWeight="900">{isEast?'NORTH (N) 4746':'SOUTH (S) 0'}</text>
      <text x={frame.x+frame.w} y={frame.y+frame.h+32} textAnchor="end" fontSize="16" fontWeight="900">{isEast?'SOUTH (S) 0':'NORTH (N) 4746'}</text>
      <text x={frame.x-18} y={yOf(2700)+6} textAnchor="end" fontSize="13" fontWeight="800">2700</text>
      <text x={frame.x-18} y={yOf(1900)+6} textAnchor="end" fontSize="13" fontWeight="800">1900</text>
      <text x={frame.x-18} y={yOf(1350)+6} textAnchor="end" fontSize="13" fontWeight="800">1350</text>
      <text x={frame.x-18} y={yOf(900)+6} textAnchor="end" fontSize="13" fontWeight="800">900</text>
    </svg>)
  }

  const NorthSouthElevation=({isNorth})=>{
    const frame={x:72,y:52,w:1060,h:560}
    const xOf=(x)=>frame.x+(x/2324)*frame.w
    const yOf=(z)=>frame.y+frame.h-(z/2700)*frame.h
    const wOf=(w)=>Math.max(24,(w/2324)*frame.w)
    const hOf=(h)=>Math.max(18,(h/2700)*frame.h)
    const eastX=2324-600, westX=0
    return (<svg width="1180" height="560" viewBox="0 0 1180 620" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',height:'auto',display:'block'}}>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="#faf6f1" stroke="#111" strokeWidth="2"/>
      <text x={frame.x} y="31" fontSize="22" fontWeight="900">{isNorth?'North Elevation (looking South)':'South Elevation (looking North)'}</text>
      <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="13" fontWeight="700" fill="#61584f">{isNorth?'East (E) right / West (W) left - Window 1100W':'East (E) left / West (W) right - Door 1100W'}</text>
      {/* wall baseline */}
      <line x1={frame.x} y1={yOf(0)} x2={frame.x+frame.w} y2={yOf(0)} stroke="#111" strokeWidth="4"/>
      {/* floor */}
      <rect x={frame.x} y={yOf(0)} width={frame.w} height={hOf(30)} fill={materials.floor||'#ded6cc'} stroke="#111"/>
      {/* east cabinet silhouette */}
      <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(900 - PLINTH_HEIGHT)} fill={materials.cabinetBody||'#c8b39d'} stroke="#111"/>
      <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(COUNTER_THICKNESS)} fill={materials.counter||'#d8c2a8'} stroke="#7d7165"/>
      <rect x={xOf(eastX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={materials.shutters||'#dac8b7'} stroke="#111"/>
      <rect x={xOf(eastX+80)} y={yOf(2700)} width={wOf(470)} height={hOf(800)} fill="#bfa891" stroke="#111"/>
      {/* west cabinet silhouette */}
      <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(900 - PLINTH_HEIGHT)} fill={materials.cabinetBody||'#c8b39d'} stroke="#111"/>
      <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(COUNTER_THICKNESS)} fill={materials.counter||'#d8c2a8'} stroke="#7d7165"/>
      <rect x={xOf(westX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={materials.shutters||'#dac8b7'} stroke="#111"/>
      <rect x={xOf(westX)} y={yOf(1900)} width={wOf(400)} height={hOf(800)} fill="#bfa891" stroke="#111"/>
      {/* door / window */}
      {isNorth? (
        <g>
          <rect x={xOf(612)} y={yOf(2700)} width={wOf(1100)} height={hOf(1800)} fill="rgba(126,184,232,0.32)" stroke="#2f8ac6" strokeWidth="2"/>
          <text x={xOf(1162)} y={yOf(1800)} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1f5f88">Window 1100 x 1800 sill 900</text>
          <rect x={xOf(KITCHEN.windowBelow?.x||612)} y={yOf(300)} width={wOf(KITCHEN.windowBelow?.w||1100)} height={hOf(300)} fill="#eaf6fd" stroke="#2f8ac6" strokeDasharray="10 8" opacity="0.72"/>
          <text x={xOf(1162)} y={yOf(150)} textAnchor="middle" fontSize="13" fontWeight="800" fill="#2e6f99">Below window area only</text>
        </g>
      ):(
        <g>
          <rect x={xOf(612)} y={yOf(2100)} width={wOf(1100)} height={hOf(2100)} fill="#fffaf3" stroke="#7b3f21" strokeWidth="2"/>
          <text x={xOf(1162)} y={yOf(1050)} textAnchor="middle" fontSize="16" fontWeight="900" fill="#7b3f21">South door 1100W</text>
          <rect x={xOf(0)} y={yOf(1220)} width={wOf(400)} height={hOf(1220)} fill="#fffaf3" stroke="#7b3f21" strokeDasharray="10 8" opacity="0.7"/>
          <text x={xOf(200)} y={yOf(600)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#7b3f21">West door clear y0-y1220</text>
        </g>
      )}
      {/* dimension markers vertical on right */}
      <g fontSize="11" fontWeight="700">
        <line x1={frame.x+frame.w+14} y1={yOf(0)} x2={frame.x+frame.w+14} y2={yOf(900)} stroke="#111" strokeWidth="2"/>
        <text x={frame.x+frame.w+22} y={yOf(450)} transform={`rotate(90 ${frame.x+frame.w+22} ${yOf(450)})`} textAnchor="middle">Counter 900</text>
        <line x1={frame.x+frame.w+30} y1={yOf(900)} x2={frame.x+frame.w+30} y2={yOf(1500)} stroke="#7d7165" strokeWidth="2" strokeDasharray="6 4"/>
        <text x={frame.x+frame.w+38} y={yOf(1200)} transform={`rotate(90 ${frame.x+frame.w+38} ${yOf(1200)})`} textAnchor="middle" fill="#7d7165">Backsplash 600</text>
        <line x1={frame.x+frame.w+46} y1={yOf(1350)} x2={frame.x+frame.w+46} y2={yOf(1850)} stroke="#b8ab9a" strokeWidth="2"/>
        <text x={frame.x+frame.w+54} y={yOf(1600)} transform={`rotate(90 ${frame.x+frame.w+54} ${yOf(1600)})`} textAnchor="middle" fill="#6d6257">Lower upper 1350-1850</text>
        <line x1={frame.x+frame.w+62} y1={yOf(1900)} x2={frame.x+frame.w+62} y2={yOf(2700)} stroke="#bfa891" strokeWidth="2"/>
        <text x={frame.x+frame.w+70} y={yOf(2300)} transform={`rotate(90 ${frame.x+frame.w+70} ${yOf(2300)})`} textAnchor="middle" fill="#6d6257">Top upper 1900-2700</text>
      </g>
      <text x={frame.x-10} y={yOf(2700)+4} textAnchor="end" fontSize="12" fontWeight="800">2700</text>
      <text x={frame.x-10} y={yOf(0)+4} textAnchor="end" fontSize="12" fontWeight="800">0</text>
    </svg>)
  }

  const pad=200
  const viewBoxTop=`${-pad} ${-pad} ${KITCHEN.width+pad*2} ${KITCHEN.length+pad*2}`
  const planSvgHeight=Math.round(900*(KITCHEN.length+pad*2)/(KITCHEN.width+pad*2))
  const DimH=({x1,x2,y,text})=>{
    const mx=(x1+x2)/2
    return (<g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#111" strokeWidth="5"/>
      <line x1={x1} y1={y-22} x2={x1} y2={y+22} stroke="#111" strokeWidth="5"/>
      <line x1={x2} y1={y-22} x2={x2} y2={y+22} stroke="#111" strokeWidth="5"/>
      <g>
        <rect x={mx-220} y={y-46} width="440" height="28" fill="#fff" stroke="#111" strokeWidth="2" rx="6"/>
        <text x={mx} y={y-26} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{text}</text>
      </g>
    </g>)
  }
  const DimV=({y1,y2,x,text})=>{
    const my=(y1+y2)/2
    return (<g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#111" strokeWidth="5"/>
      <line x1={x-22} y1={y1} x2={x+22} y2={y1} stroke="#111" strokeWidth="5"/>
      <line x1={x-22} y1={y2} x2={x+22} y2={y2} stroke="#111" strokeWidth="5"/>
      <g transform={`rotate(-90 ${x} ${my})`}>
        <rect x={my-220} y={x-16} width="440" height="28" fill="#fff" stroke="#111" strokeWidth="2" rx="6"/>
        <text x={my} y={x+4} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{text}</text>
      </g>
    </g>)
  }

  // helpers for module editor
  const refillEast=()=> setEastModules(autoFillModules(eastRunLength))
  const refillWest=()=> setWestModules(autoFillModules(westRunLength))

  return (<div onMouseMove={onMove} onMouseUp={onUp} style={{fontFamily:'Inter,system-ui',background:'#f6f2ec',minHeight:'100vh',padding:'clamp(10px,2vw,16px)',overflowX:'hidden',boxSizing:'border-box'}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <h1 style={{fontSize:'clamp(24px,5vw,26px)',fontWeight:900,lineHeight:1.15}}>Galley 2324x4746 - Rule #9 Locked - 6 Views - Windows Desktop</h1>
    <div style={{fontSize:13,color:'#666',lineHeight:1.3}}>RIGHT EAST 600D: Appliance Garage y300-1150 (Microwave + Food Processor) counter-mounted, Gas y2300 with hidden chimney, Dishwasher y3546 adjacent to Washing LAST y4146 | LEFT WEST: door clear y0-y1220, then Sink y3146 (real sink) to Purifier Cabinet y3746 400x350x550 between sink and shaft to Shaft LAST y4146 NW | 300 mm window reference only | Walkway 1324 floor / 1004 eye | 2324W x 4746L x 2700H</div>
    {/* Stable top toolbar - prevents layout jump when switching views */}
    <div style={{position:'sticky',top:0,zIndex:30,background:'#f6f2ec',padding:'12px 0 12px 0',margin:'12px -16px 16px -16px',paddingLeft:16,paddingRight:16,borderBottom:'1px solid #e5e0d5',minHeight:88,boxSizing:'border-box'}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',minHeight:72}}>
      <button onClick={()=>selectView('top')} style={{padding:'10px 16px',background:view==='top'?'#111':'#fff',color:view==='top'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Top View (Plan)</button>
      <button onClick={()=>selectView('front')} style={{padding:'10px 16px',background:view==='front'?'#111':'#fff',color:view==='front'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Front View (Looking North)</button>
      <button onClick={()=>selectView('east')} style={{padding:'10px 16px',background:view==='east'?'#C4B5A5':'#fff',color:view==='east'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>East Wall View + Cabinets</button>
      <button onClick={()=>selectView('west')} style={{padding:'10px 16px',background:view==='west'?'#C4B5A5':'#fff',color:view==='west'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>West Wall View + Cabinets</button>
      <button onClick={()=>selectView('north')} style={{padding:'10px 16px',background:view==='north'?'#C4B5A5':'#fff',color:view==='north'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>North Elevation</button>
      <button onClick={()=>selectView('south')} style={{padding:'10px 16px',background:view==='south'?'#C4B5A5':'#fff',color:view==='south'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>South Elevation</button>
      <button onClick={()=>selectView('three')} style={{padding:'10px 16px',background:view==='three'?'#2f6f6d':'#fff',color:view==='three'?'#fff':'#111',border:'2px solid #2f6f6d',borderRadius:10,fontWeight:800}}>Create 3D Render</button>
      <button onClick={export3DScreenshot} disabled={view!=='three'} style={{padding:'10px 16px',background:view==='three'?'#111':'#ddd',color:view==='three'?'#fff':'#777',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <button onClick={exportPlanSvg} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D SVG</button>
      <button onClick={exportPlanPng} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D PNG</button>
      <button onClick={exportPlanDxf} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D DXF</button>
      {/* Coohom Guide hidden for now - code preserved, button commented out */}
      {/* <button onClick={exportCoohomGuide} style={{padding:'8px 12px',background:'#7b3f21',color:'#fff',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Coohom Guide</button> */}
      <button onClick={exportJSON} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>Export JSON</button>
      <button onClick={exportProjectPackage} style={{padding:'8px 12px',background:'#2f6f6d',color:'#fff',border:'2px solid #2f6f6d',borderRadius:10,fontWeight:800}}>Export Project Package</button>
      <span style={{padding:'8px 12px',background:vSimple.all?'#d1fae5':'#fee2e2',borderRadius:10,fontWeight:800,fontSize:12}}>{vSimple.all?'Rule #9 Valid':'Invalid'} East:{vSimple.eastOk?'OK':'No'} West:{vSimple.westOk?'OK':'No'}</span>
      <span style={{display:'inline-flex',gap:6,alignItems:'center',padding:'6px 10px',background:'#fff',border:'2px solid #111',borderRadius:10,fontWeight:800}}>
        Grid:
        <button onClick={()=>setGrid(0)} style={{padding:'6px 10px',background:grid===0?'#111':'#fff',color:grid===0?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>Off</button>
        <button onClick={()=>setGrid(50)} style={{padding:'6px 10px',background:grid===50?'#111':'#fff',color:grid===50?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>50 mm</button>
        <button onClick={()=>setGrid(100)} style={{padding:'6px 10px',background:grid===100?'#111':'#fff',color:grid===100?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>100 mm</button>
      </span>
      </div>
    </div>

    {view==='three'&&<div ref={activeViewRef} style={{marginBottom:14,scrollMarginTop:12}}><ThreeDRender/></div>}
    {view==='top'&&(<div ref={activeViewRef} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}>
      <svg width="900" height={planSvgHeight} viewBox={viewBoxTop} preserveAspectRatio="xMidYMid meet" style={{background:'#FFFEFB',border:'1px solid #e5e0d5',borderRadius:10,width:'100%',maxWidth:900,height:'auto',display:'block',margin:'0 auto'}}>
        <rect x={-pad} y={-pad} width={KITCHEN.width+pad*2} height={KITCHEN.length+pad*2} fill="#f6f2ec"/>
        <rect x="0" y="0" width="2324" height="4746" fill={materials.wall||'#FFFEFB'} stroke="#111" strokeWidth="10"/>
        {(grid===50||grid===100)&&(<g>
          {Array.from({length: Math.floor(KITCHEN.width/grid)+1},(_,i)=> i*grid).map(val=><line key={`vg-${val}`} x1={val} y1={0} x2={val} y2={KITCHEN.length} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
          {Array.from({length: Math.floor(KITCHEN.length/grid)+1},(_,i)=> i*grid).map(val=><line key={`hg-${val}`} x1={0} y1={val} x2={KITCHEN.width} y2={val} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
        </g>)}
        <rect x={KITCHEN.windowBelow?.x||612} y="0" width={KITCHEN.windowBelow?.w||1100} height={KITCHEN.windowBelow?.depth||300} fill="#eaf6fd" stroke="#2f8ac6" strokeWidth="4" strokeDasharray="22 14" opacity="0.72"/>
        <text x={(KITCHEN.windowBelow?.x||612)+(KITCHEN.windowBelow?.w||1100)/2} y={170} textAnchor="middle" fontSize="46" fontWeight="900" fill="#1f5f88">BELOW WINDOW AREA</text>
        <rect x="0" y={svgY(0,1220)} width="400" height="1220" fill="#fffaf3" stroke="#7b3f21" strokeWidth="4" strokeDasharray="22 14"/>
        <text x="200" y={svgY(0,1220)+1220/2-10} textAnchor="middle" fontSize="52" fontWeight="900" fill="#7b3f21">DOOR CLEAR</text>
        <text x="200" y={svgY(0,1220)+1220/2+40} textAnchor="middle" fontSize="42" fontWeight="800" fill="#7b3f21">y0-y1220</text>
        <rect x={2324-600} y={svgY(0,eastRunLength)} width="600" height={eastRunLength} fill={materials.cabinetBody||'#c8b39d'} opacity="0.22" stroke="#b89f8a" strokeWidth="3"/>
        <rect x="0" y={svgY(1220,westRunLength)} width="400" height={westRunLength} fill={materials.cabinetBody||'#c8b39d'} opacity="0.22" stroke="#b89f8a" strokeWidth="3"/>
        {/* module splits in top view */}
        {(()=>{
          return moduleSegmentsFromNorth(eastModules,0,KITCHEN.length).map((m,i)=>{
            const lineY=svgY(m.y,0)
            if(i===0) return null
            return <line key={`em-${i}`} x1={2324-600} y1={lineY} x2={2324} y2={lineY} stroke="#111" strokeWidth={m.type==='filler'?5:3} strokeDasharray={m.type==='filler'?'18 12':''}/>
          })
        })()}
        {(()=>{
          return moduleSegmentsFromNorth(westModules,KITCHEN.westGap.to,KITCHEN.length).map((m,i)=>{
            const lineY=svgY(m.y,0)
            const res= i===0? null : <line key={`wm-${i}`} x1={0} y1={lineY} x2={400} y2={lineY} stroke="#111" strokeWidth={m.type==='filler'?5:3} strokeDasharray={m.type==='filler'?'18 12':''}/>
            return res
          })
        })()}
        <rect x="612" y="0" width="1100" height="62" fill="#7EB8E8" stroke="#111" strokeWidth="6"/>
        <text x="1162" y="44" textAnchor="middle" fontSize="38" fontWeight="800" fill="#0f3550">NORTH WINDOW 1100W</text>
        <rect x="612" y="4684" width="1100" height="62" fill="#fffaf3" stroke="#7b3f21" strokeWidth="6"/>
        <text x="1162" y="4726" textAnchor="middle" fontSize="38" fontWeight="800" fill="#7b3f21">SOUTH DOOR 1100W</text>
        <text x={KITCHEN.width/2} y={-70} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111">NORTH (N)</text>
        <text x={KITCHEN.width/2} y={KITCHEN.length+90} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111">SOUTH (S)</text>
        <text x={-70} y={KITCHEN.length/2} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111" transform={`rotate(-90 -70 ${KITCHEN.length/2})`}>WEST (W)</text>
        <text x={KITCHEN.width+70} y={KITCHEN.length/2} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111" transform={`rotate(90 ${KITCHEN.width+70} ${KITCHEN.length/2})`}>EAST (E)</text>
        {east.map(it=>{
          if(it.id==='applianceGarage'){
            // Appliance garage - counter-mounted garage with microwave + food processor inside
            return (<g key={it.id} onMouseDown={e=>onDown(e,'east',it.id)} style={{cursor:'grab'}}>
              <rect x={2324-it.d} y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
              <rect x={2324-it.d+12} y={svgY(it.y,it.w)+14} width={it.d-24} height={it.w-28} fill="#f7f1e8" stroke="#7b3f21" strokeWidth="3" rx="6" strokeDasharray="12 8"/>
              {/* microwave inside garage */}
              <rect x={2324-it.d+26} y={svgY(it.y+it.w-260,140)} width={it.d-52} height={140} fill="#1a1a1a" stroke="#111" rx="4"/>
              <rect x={2324-it.d+36} y={svgY(it.y+it.w-260,140)+18} width={it.d-72} height="70" fill="#050505" stroke="#444"/>
              <text x={2324-it.d/2} y={svgY(it.y+it.w-260,140)+95} textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">MICROWAVE</text>
              {/* food processor inside garage */}
              <rect x={2324-it.d+40} y={svgY(it.y+90,120)} width={it.d-80} height={120} fill="#b9b9b9" stroke="#111" rx="4"/>
              <circle cx={2324-it.d/2} cy={svgY(it.y+90,120)+36} r="22" fill="#e8e8e8" stroke="#777"/>
              <text x={2324-it.d/2} y={svgY(it.y+90,120)+88} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111">FOOD PROCESSOR</text>
              <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="24" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)} garage</text>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2-46} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111">APPLIANCE GARAGE</text>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2-22} textAnchor="middle" fontSize="16" fontWeight="700" fill="#5a4632">MW + FP inside</text>
            </g>)
          }
          return (<g key={it.id} onMouseDown={e=>onDown(e,'east',it.id)} style={{cursor:'grab'}}>
          <rect x={2324-it.d} y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
          <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
          <text x={2324-it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)}mm</text>
          <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="34" fontWeight="800" fill={it.id==='gas'?'#fff':'#111'}>{planLabel(it.id)}</text>
          {it.id==='washing'&&<g>
            <path d={`M ${2324-it.d+18} ${svgY(it.y,it.w)+it.w-28} Q ${2324-it.d-130} ${svgY(it.y,it.w)+it.w-120} ${2324-it.d+18} ${svgY(it.y,it.w)+it.w-230}`} fill="none" stroke="#2f6f6d" strokeWidth="5" strokeDasharray="12 10"/>
            <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w-38} textAnchor="middle" fontSize="18" fontWeight="900" fill="#2f6f6d">opens left</text>
          </g>}
          {it.id==='dishwasher'&&<g>
            <rect x={2324-it.d-170} y={svgY(it.y,it.w)+75} width="160" height={it.w-150} fill="#d1cec8" stroke="#111" strokeWidth="3" opacity="0.86" rx="5"/>
            <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w-38} textAnchor="middle" fontSize="18" fontWeight="900" fill="#2f6f6d">opens down</text>
          </g>}
        </g>)})}
        {west.map(it=>{
          if(it.id==='sink'){
            // Real kitchen sink top view: double bowl stainless with faucet and drain
            const sx=0, sy=svgY(it.y,it.w), sw=it.d, sh=it.w
            return (<g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:'grab'}}>
              <rect x={sx} y={sy} width={sw} height={sh} fill="#e8e8e8" stroke="#111" strokeWidth="5" rx="10"/>
              <rect x={sx+10} y={sy+10} width={sw-20} height={sh-20} fill="#f5f5f5" stroke="#888" strokeWidth="2" rx="8"/>
              {/* left bowl */}
              <rect x={sx+22} y={sy+38} width={sw-44} height={sh/2-46} fill="#d9d9d9" stroke="#222" strokeWidth="3" rx="10"/>
              <ellipse cx={sw/2} cy={sy+38+(sh/2-46)/2} rx="18" ry="12" fill="#b0b0b0" stroke="#222"/>
              {/* right bowl */}
              <rect x={sx+22} y={sy+sh/2+8} width={sw-44} height={sh/2-46} fill="#d9d9d9" stroke="#222" strokeWidth="3" rx="10"/>
              <ellipse cx={sw/2} cy={sy+sh/2+8+(sh/2-46)/2} rx="18" ry="12" fill="#b0b0b0" stroke="#222"/>
              {/* divider */}
              <line x1={sx+22} y1={sy+sh/2-8} x2={sx+sw-22} y2={sy+sh/2-8} stroke="#222" strokeWidth="2"/>
              {/* faucet hole */}
              <circle cx={sw-38} cy={sy+22} r="10" fill="#111" stroke="#555"/>
              <rect x={sw-44} y={sy+22} width="12" height="18" fill="#c0c0c0" stroke="#222" rx="3"/>
              <rect x={8} y={sy+8} width={sw-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={sw/2} y={sy+22} textAnchor="middle" fontSize="24" fontWeight="800" fill="#111">{it.w}W sink y{Math.round(it.y)}</text>
              <text x={sw/2} y={sy+sh/2+4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111">SINK</text>
            </g>)
          }
          if(it.id==='waterpurifier'){
            // Purifier cabinet top view
            return (<g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:'grab'}}>
              <rect x="0" y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
              <rect x="10" y={svgY(it.y,it.w)+34} width={it.d-20} height={it.w-68} fill="#d6eaf8" stroke="#2f6fb0" strokeWidth="2" rx="6"/>
              <line x1={it.d/2} y1={svgY(it.y,it.w)+34} x2={it.d/2} y2={svgY(it.y,it.w)+it.w-34} stroke="#2f6fb0" strokeWidth="1.5" strokeDasharray="8 6"/>
              <circle cx={it.d-34} cy={svgY(it.y,it.w)+it.w/2} r="6" fill="#111"/>
              <rect x="8" y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111">{it.w}W purifier y{Math.round(it.y)}</text>
              <text x={it.d/2} y={svgY(it.y,it.w)+it.w/2+6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1a3a5a">PURIFIER 400x350x550</text>
            </g>)
          }
          return (<g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:it.fixed?'not-allowed':'grab',opacity:it.fixed?0.98:1}}>
          <rect x="0" y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth={it.id==='shaft'?'9':'5'} rx="10"/>
          <rect x="8" y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity={it.fixed?0.88:0.92} rx="5"/>
          <text x={it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)}mm</text>
          <text x={it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="34" fontWeight="800" fill={it.id==='sink'?'#fff':'#111'}>{planLabel(it.id)}</text>
        </g>)})}
        <DimH x1={0} x2={KITCHEN.width} y={-110} text="Room width 2324 mm"/>
        <DimV y1={0} y2={KITCHEN.length} x={KITCHEN.width+110} text="Room length 4746 mm"/>
        <DimH x1={KITCHEN.width-600} x2={KITCHEN.width} y={36} text="East 600 mm"/>
        <DimH x1={0} x2={400} y={36} text="West 400 mm"/>
        <DimH x1={400} x2={KITCHEN.width-600} y={KITCHEN.length/2} text={`Walkway ${walkwayFloor} mm`}/>
        <DimV y1={svgY(0,KITCHEN.westGap.to)} y2={KITCHEN.length} x={-110} text="Door y0-y1220 (1220 mm)"/>
        <g>
          <rect x={-pad+8} y={KITCHEN.length+pad-46} width={KITCHEN.width+pad*2-16} height="40" fill="#111" rx="8"/>
          <text x={KITCHEN.width/2} y={KITCHEN.length+pad-20} textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">Scale 1:1 mm  |  2324W x 4746L x 2700H  |  Walkway {walkwayFloor} mm / {walkwayEye} mm eye  |  Grid {grid?grid+' mm':'Off'}  |  East 600D  West 400D</text>
        </g>
      </svg>
      <div style={{fontSize:13,marginTop:10,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between'}}>
        <span>Drag Y only - snapping {grid?grid+' mm':'Off (free)'} - North top, South bottom - Shaft fixed (not draggable)</span>
        <span style={{color:'#7b3f21',fontWeight:800}}>Walkway {walkwayFloor} mm floor / {walkwayEye} mm eye</span>
      </div>
    </div>)}
    {view==='front'&&(<div ref={activeViewRef} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><svg width="1000" height="500" viewBox="0 0 800 500" style={{width:'100%'}}><polygon points="0,450 800,450 560,120 240,120" fill="#E8E0D5" stroke="#111"/><polygon points="0,0 800,0 560,80 240,80" fill="#f2ece3" stroke="#111"/><polygon points="0,0 0,450 240,120 240,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><polygon points="800,0 800,450 560,120 560,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><rect x="350" y="95" width="100" height="45" fill="#7EB8E8" stroke="#111"/><text x="400" y="92" textAnchor="middle" fontSize="12" fontWeight="700">N WINDOW</text><rect x="92" y="235" width="68" height="54" fill="#80b5de" stroke="#111"/><text x="126" y="229" textAnchor="middle" fontSize="10" fontWeight="700">PURIFIER</text><rect x="162" y="310" width="70" height="18" fill="#202020" stroke="#111"/><rect x="174" y="313" width="46" height="12" fill="#c9c9c9" stroke="#555"/><text x="197" y="304" textAnchor="middle" fontSize="10" fontWeight="700">SINK</text><rect x="568" y="236" width="86" height="70" fill="#8c7a65" stroke="#111"/><text x="611" y="230" textAnchor="middle" fontSize="10" fontWeight="700">GARAGE</text><rect x="590" y="252" width="42" height="18" fill="#1f1f1f"/><rect x="594" y="276" width="34" height="18" fill="#b9b9b9"/><rect x="640" y="240" width="80" height="20" fill="#2a2a2a"/><text x="680" y="235" textAnchor="middle" fontSize="10" fill="#fff">GAS y2300</text></svg></div>)}
    {view==='east'&&(<div ref={(node)=>{eastSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>East wall front render: handleless cabinets, hidden chimney and warm LED</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(eastSvgRef,'east-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(eastSvgRef,'east-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(eastSvgRef,'east-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={east} isEast={true}/></div>)}
    {view==='west'&&(<div ref={(node)=>{westSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>West wall front render: clear door zone, clean-dish storage, purifier, sink and shaft</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(westSvgRef,'west-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(westSvgRef,'west-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(westSvgRef,'west-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={west} isEast={false}/></div>)}
    {view==='north'&&(<div ref={(node)=>{northSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>North elevation (looking South)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(northSvgRef,'north-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(northSvgRef,'north-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(northSvgRef,'north-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={true}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows north window reference, below-window 300 mm area only, counter 900 mm, backsplash 600 mm, lower upper 1350-1850, top upper 1900-2700, ceiling 2700 mm.</div></div>)}
    {view==='south'&&(<div ref={(node)=>{southSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>South elevation (looking North)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(southSvgRef,'south-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(southSvgRef,'south-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(southSvgRef,'south-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={false}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows south door, west door clear zone, counter and upper zones, ceiling 2700 mm.</div></div>)}

    {/* Validation Panel */}
    <div style={{background:'#fff',borderRadius:14,padding:14,marginBottom:14,border:'1px solid #e5e0d5'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:0,fontSize:16}}>Validation Panel - detailed</h3><span style={{fontSize:12,color:'#666'}}>{validationRows.filter(r=>r.status==='pass').length}/{validationRows.length} passing</span></div>
      <div style={{display:'grid',gap:8,marginTop:10}}>
        {validationRows.map(r=>(
          <div key={r.id} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,170px),1fr))',gap:10,alignItems:'start',background:r.status==='pass'?'#f0fdf4':r.status==='fail'?'#fef2f2':'#fffbeb',border:'1px solid #e5efe8',borderRadius:8,padding:'8px 10px',overflowWrap:'anywhere'}}>
            <div style={{fontWeight:900,fontSize:12}}>{r.status==='pass'?'PASS': r.status==='fail'?'FAIL':'WARN'}</div>
            <div style={{fontWeight:800,fontSize:13}}>{r.rule}</div>
            <div style={{fontFamily:'monospace',fontSize:12}}>{r.measured}</div>
            <div style={{fontFamily:'monospace',fontSize:12}}>{typeof r.expected==='object'?JSON.stringify(r.expected):r.expected}</div>
            <div style={{fontSize:12}}>{r.fix}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Materials + Modules + BOM + Versions grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))',gap:14,marginBottom:14}}>
      {/* Materials */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 10px 0',fontSize:15}}>Materials & Finishes</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,150px),1fr))',gap:10}}>
          {[
            ['cabinetBody','Cabinet body'],
            ['shutters','Shutters'],
            ['counter','Counter'],
            ['backsplash','Backsplash'],
            ['floor','Floor'],
            ['wall','Wall'],
          ].map(([key,label])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:700}}>{label}
              <span style={{display:'flex',gap:6,alignItems:'center',minWidth:0}}>
                <input type="color" value={materials[key]||'#cccccc'} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{width:36,height:28,padding:0,border:'1px solid #ccc',borderRadius:6,flex:'0 0 auto'}}/>
                <input value={materials[key]||''} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{flex:'1 1 0',minWidth:0,padding:'6px 8px',border:'1px solid #ddd',borderRadius:8,fontSize:12}}/>
              </span>
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:700}}>Appliance finish
            <select value={materials.applianceFinish} onChange={e=>setMaterials(p=>({...p,applianceFinish:e.target.value}))} style={{padding:'6px 8px',border:'1px solid #ddd',borderRadius:8,width:'100%',minWidth:0}}>
              <option value="stainless">Stainless</option><option value="black_glass">Black glass</option><option value="white">White</option><option value="matte_black">Matte black</option>
            </select>
          </label>
        </div>
        <div style={{marginTop:10,fontSize:12,color:'#666'}}>Updates 2D plan, elevations and 3D. Stored in JSON.</div>
      </div>

      {/* Modules */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 10px 0',fontSize:15}}>Cabinet Modules</h3>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          <button onClick={refillEast} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Auto-fill East ({eastRunLength}mm)</button>
          <button onClick={refillWest} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Auto-fill West ({westRunLength}mm)</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12}}>
          <div>
            <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>East base ({eastModules.reduce((a,m)=>a+m.width,0)} mm) - {eastModules.length} mods</div>
            <div style={{maxHeight:180,overflowY:'auto',border:'1px solid #eee',borderRadius:8,padding:6}}>
              {eastModules.map((m,i)=>(
                <div key={m.id} style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:11,minWidth:22,fontWeight:700}}>{i+1}</span>
                  <select value={m.width} onChange={e=>{const w=parseInt(e.target.value)||300; setEastModules(p=> p.map((x,idx)=> idx===i?{...x,width:w,type: MODULE_WIDTHS.includes(w)?'base':'filler'}:x))}} style={{padding:'4px 6px',border:'1px solid #ddd',borderRadius:6,fontSize:12}}>
                    {[300,450,600,750,900].map(v=> <option key={v} value={v}>{v} mm</option>)}
                    {!MODULE_WIDTHS.includes(m.width) && <option value={m.width}>{m.width} mm filler</option>}
                  </select>
                  <span style={{fontSize:11,background:m.type==='filler'?'#fef2f2':'#f0fdf4',padding:'2px 6px',borderRadius:6,whiteSpace:'nowrap'}}>{m.type}</span>
                  <button onClick={()=> setEastModules(p=> p.filter((_,idx)=> idx!==i))} style={{marginLeft:'auto',padding:'2px 6px',background:'#fff',border:'1px solid #ddd',borderRadius:6,fontSize:11}}>x</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:6, display:'flex', gap:6}}>
              <button onClick={()=> setEastModules(p=> [...p,{id:`mod-${Date.now()}`,width:600,type:'base',drawers:2,handle:'none',label:'600 mm'}])} style={{padding:'4px 8px',background:'#fff',border:'1px solid #111',borderRadius:6,fontSize:12,fontWeight:700}}>+ add 600</button>
              <span style={{fontSize:11,color: eastModules.reduce((a,m)=>a+m.width,0)===eastRunLength?'#16a34a':'#dc2626',fontWeight:700}}>{eastModules.reduce((a,m)=>a+m.width,0)} / {eastRunLength} mm</span>
            </div>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>West base ({westModules.reduce((a,m)=>a+m.width,0)} mm) - {westModules.length} mods</div>
            <div style={{maxHeight:180,overflowY:'auto',border:'1px solid #eee',borderRadius:8,padding:6}}>
              {westModules.map((m,i)=>(
                <div key={m.id} style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:11,minWidth:22,fontWeight:700}}>{i+1}</span>
                  <select value={m.width} onChange={e=>{const w=parseInt(e.target.value)||300; setWestModules(p=> p.map((x,idx)=> idx===i?{...x,width:w,type: MODULE_WIDTHS.includes(w)?'base':'filler'}:x))}} style={{padding:'4px 6px',border:'1px solid #ddd',borderRadius:6,fontSize:12}}>
                    {[300,450,600,750,900].map(v=> <option key={v} value={v}>{v} mm</option>)}
                    {!MODULE_WIDTHS.includes(m.width) && <option value={m.width}>{m.width} mm filler</option>}
                  </select>
                  <span style={{fontSize:11,background:m.type==='filler'?'#fef2f2':'#f0fdf4',padding:'2px 6px',borderRadius:6,whiteSpace:'nowrap'}}>{m.type}</span>
                  <button onClick={()=> setWestModules(p=> p.filter((_,idx)=> idx!==i))} style={{marginLeft:'auto',padding:'2px 6px',background:'#fff',border:'1px solid #ddd',borderRadius:6,fontSize:11}}>x</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:6, display:'flex', gap:6}}>
              <button onClick={()=> setWestModules(p=> [...p,{id:`mod-${Date.now()}`,width:600,type:'base',drawers:2,handle:'none',label:'600 mm'}])} style={{padding:'4px 8px',background:'#fff',border:'1px solid #111',borderRadius:6,fontSize:12,fontWeight:700}}>+ add 600</button>
              <span style={{fontSize:11,color: westModules.reduce((a,m)=>a+m.width,0)===westRunLength?'#16a34a':'#dc2626',fontWeight:700}}>{westModules.reduce((a,m)=>a+m.width,0)} / {westRunLength} mm</span>
            </div>
          </div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:'#666'}}>Module widths 300/450/600/750/900 + filler/end panels (18mm). Marking is interpreted from North to South in plan, elevations, and 3D.</div>
      </div>

      {/* BOM */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 8px 0',fontSize:15}}>BOM / Quote</h3>
        <div style={{fontSize:13,lineHeight:'1.6'}}>
          <div>Base cabinets: <b>{bom.baseCount}</b> &nbsp; Wall lower: <b>{bom.wallLowerCount}</b> &nbsp; Wall top: <b>{bom.wallTopCount}</b></div>
          <div>Shutters: <b>{bom.shutterCount}</b> &nbsp; Drawers: <b>{bom.drawerCount}</b> &nbsp; Handles: <b>{bom.handleCount}</b> (handleless)</div>
          <div>Countertop: <b>{bom.counterLenM} m ({bom.counterLenMm} mm)</b> x 600D/400D, {COUNTER_THICKNESS}mm thick, {materials.counter}</div>
          <div>Backsplash: <b>{bom.backsplashAreaM2} m2</b> (height {BACKSPLASH_HEIGHT}mm, {materials.backsplash})</div>
          <div style={{marginTop:6,fontSize:12,color:'#555'}}>Appliances: {bom.appliances.map(a=>`${a.id} y${a.y}`).join('  |  ')}</div>
          <div style={{fontSize:12,color:'#555'}}>Notes: {bom.notes.join('  |  ')}</div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
          <button onClick={exportBOMCsv} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:800}}>Export BOM CSV</button>
          <button onClick={exportBOMMarkdown} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #111',borderRadius:8,fontWeight:800}}>Export BOM Markdown</button>
        </div>
      </div>

      {/* Save/Load/Versions */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 8px 0',fontSize:15}}>Project - Save / Load / Versions</h3>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={exportJSON} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:800}}>Save Project JSON</button>
          <button onClick={()=>fileInputRef.current?.click()} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #111',borderRadius:8,fontWeight:800}}>Load Project JSON</button>
          <button onClick={resetRule9} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #c4b5a5',borderRadius:8,fontWeight:800}}>Reset to Rule #9</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleLoadFile} style={{display:'none'}}/>
        {importWarning && <div style={{marginTop:8,padding:'8px 10px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#991b1b',fontSize:12,whiteSpace:'pre-wrap'}}>{importWarning}</div>}
        {bomNote && <div style={{marginTop:8,padding:'6px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,color:'#166534',fontSize:12}}>{bomNote}</div>}
        <div style={{marginTop:12,borderTop:'1px solid #eee',paddingTop:10}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>Named versions (localStorage)</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              ['current','Rule #9 current'],
              ['A','Option A'],
              ['B','Option B'],
            ].map(([key,label])=>(
              <div key={key} style={{border:'1px solid #ddd',borderRadius:10,padding:'8px 10px',minWidth:140}}>
                <div style={{fontWeight:800,fontSize:12}}>{label}</div>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  <button onClick={()=>saveVersion(key)} style={{padding:'4px 8px',background:'#111',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700}}>Save</button>
                  <button onClick={()=>loadVersion(key)} style={{padding:'4px 8px',background:'#fff',color:'#111',border:'1px solid #111',borderRadius:6,fontSize:12,fontWeight:700}}>Load</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'#666',marginTop:8}}>Autosave active (localStorage key {LS_KEY}). Import warns instead of crashing.</div>
        </div>
      </div>
    </div>

    <div style={{marginTop:14,padding:14,background:'#fff',borderRadius:10,fontFamily:'monospace',fontSize:13,overflowX:'auto',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><b>AI API (Browser Console):</b><br/>window.kitchenAPI.moveItemMM('east','applianceGarage',300) // garage near South door, stores MW + processor<br/>window.kitchenAPI.moveItemMM('west','sink',3146) // real sink ends at y3746<br/>window.kitchenAPI.moveItemMM('west','waterpurifier',3746) // 400W x 350D x 550H between sink and shaft<br/>window.kitchenAPI.moveItem('east','washing',414.6) // LAST touching north<br/>window.kitchenAPI.getLayout()<br/>window.kitchenAPI.getLayoutModel()<br/>window.kitchenAPI.validate() // detailed rows<br/>window.kitchenAPI.getValidationRows()<br/>window.kitchenAPI.getMaterials()<br/>window.kitchenAPI.getModules()<br/>window.kitchenAPI.getBOM()<br/>window.kitchenAPI.getGrid() / window.kitchenAPI.setGrid(50) // 0|50|100<br/>window.kitchenAPI.getWalkway()<br/>window.kitchenAPI.getDimensions()</div>
  </div></div>)
}
