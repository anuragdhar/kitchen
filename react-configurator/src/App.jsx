import React,{useState,useEffect,useRef,useMemo} from 'react'
import {KITCHEN,EAST_INIT,WEST_INIT, LAYOUT_MODEL, MODULE_WIDTHS, MODULE_DEFS, PLINTH_HEIGHT, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, autoFillModules} from './config/kitchenConfig.js'
import { DEFAULT_MATERIALS, VIEW_STYLE, HEIGHT_GUIDES, RENDER_CONFIG } from './config/renderConfig.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import JSZip from 'jszip'
import { createPbrMaterial } from './render/materialFactory.js'

const LS_KEY='kitchen-autosave-v3-ps1-west-sink800'
const VERSION_KEYS={ current:'kitchen_version_Rule9', A:'kitchen_version_OptionA', B:'kitchen_version_OptionB' }

const isActiveLayoutItem=(it)=>it && !it.hidden && it.id!=='westGarage' && (it.w??0)>0 && (it.d??0)>0
const isCabinetLikeItem=(it)=>isActiveLayoutItem(it) && !String(it.id||'').startsWith('powerPoint')
const normalizeKitchenMaterials=(m={})=>({
  ...DEFAULT_MATERIALS,
  ...m,
  cabinetBody:!m.cabinetBody || m.cabinetBody==='#c8b39d' ? VIEW_STYLE.baseCabinet : m.cabinetBody,
  shutters:!m.shutters || m.shutters==='#dac8b7' ? VIEW_STYLE.middleCabinet : m.shutters,
  counter:!m.counter || m.counter==='#d8c2a8' ? VIEW_STYLE.counter : m.counter,
})

const REFERENCE_LINKS=[
  {
    title:'Galley Kitchen Ideas - SoloTravely',
    url:'https://solotravely.com/galley-kitchen-ideas/?utm_source=Pinterest&utm_medium=organic',
    source:'solotravely.com',
    note:'Primary reference link from docs/references.md.'
  }
]

export default function App(){
  const eastIds=['garage_NE','washing','gas','garage_SE','geyserEastTop']
  const westIds=['shaft','waterpurifier','sink','sinkUpperDishRack','trashCan','dishwasher','geyser','westGarage','gasWestRemoved','powerPointWest1','powerPointWest2','powerPointEast1','powerPointEast2']
  const byId=(items=[])=>Object.fromEntries(items.map(it=>[it.id,it]))
  const fixList=(list,init)=>list.map(it=>{
    const found=init.find(i=>i.id===it.id)
    return {...(found||{}),...it, w:it.w||it.width||found?.w||600, d:it.d||it.depth||found?.d||400, h:it.h||it.height||found?.h||400 }
  })
  const migrateEastItems=(items=[])=>{
    const list=fixList(items,EAST_INIT).filter(it=>eastIds.includes(it.id))
    const current=byId(list)
    const hasNewShape= list.some(it=>['garage_NE','garage_SE','gas'].includes(it.id)) || current.gas?.y===1500 || current.washing?.y===3251
    if(hasNewShape) return list.length? list : EAST_INIT
    const oldShape=items.some(it=>['applianceGarage','microwave','foodprocessor'].includes(it.id)) && !list.some(it=>it.id==='garage_NE')
    if(oldShape) return EAST_INIT
    return EAST_INIT.map(def=>({...def,...current[def.id]}))
  }
  const migrateWestItems=(items=[])=>{
    const list=fixList(items,WEST_INIT).filter(it=>westIds.includes(it.id))
    const current=byId(list)
    const hasNewWest= current.sink?.y===1800 || current.waterpurifier?.y===2600 || current.dishwasher?.y===1100
    if(hasNewWest) return list.length? list : WEST_INIT
    const oldShape=items.some(it=>['microwave','foodprocessor'].includes(it.id)) || current.waterpurifier?.y===3350 || current.sink?.w===600
    if(oldShape) return WEST_INIT
    return WEST_INIT.map(def=>({...def,...current[def.id]}))
  }
  const eastRunLength=KITCHEN.length
  const westRunLength=KITCHEN.length-KITCHEN.westGap.to
  const [east,setEast]=useState(()=>migrateEastItems(EAST_INIT)); const [west,setWest]=useState(()=>migrateWestItems(WEST_INIT))
  const [view,setView]=useState('top'); const [drag,setDrag]=useState(null)
  const [grid,setGrid]=useState(0)
  const [hide3DObstructions,setHide3DObstructions]=useState(true)
  const [unit,setUnit]=useState('mm')
  const [selectedId,setSelectedId]=useState(null)
  const [measureMode,setMeasureMode]=useState(false)
  const [measurePoints,setMeasurePoints]=useState([]) // [{x,y} mm]
  const [interactionMode,setInteractionMode]=useState('cabinet') // 'cabinet' | 'dimension' | 'measure' | 'transparent'
  const [showHeightGuides,setShowHeightGuides]=useState(false)
  const [materials,setMaterials]=useState(()=>normalizeKitchenMaterials())
  const [eastModules,setEastModules]=useState(()=>autoFillModules(eastRunLength))
  const [westModules,setWestModules]=useState(()=>autoFillModules(westRunLength))
  const [importWarning,setImportWarning]=useState('')
  const [bomNote,setBomNote]=useState('')
  const threeViewRef=useRef(null)
  const hide3DObstructionsRef=useRef(true)
  const interactionModeRef=useRef('cabinet')
  const measurePointsRef=useRef([])
  const selectedItemRef=useRef(null)
  const unitRef=useRef('mm')
  const activeViewRef=useRef(null)
  const eastSvgRef=useRef(null)
  const westSvgRef=useRef(null)
  const northSvgRef=useRef(null)
  const southSvgRef=useRef(null)
  const fileInputRef=useRef(null)
  const scale=0.11
  const renderMaterials=materials
  const renderStyle={
    ...VIEW_STYLE,
    baseCabinet:renderMaterials.cabinetBody,
    tallCabinet:renderMaterials.cabinetBody,
    topCabinet:renderMaterials.cabinetBody,
    middleCabinet:renderMaterials.shutters,
    counter:renderMaterials.counter,
  }
  const activeEast=useMemo(()=>east.filter(isActiveLayoutItem),[east])
  const activeWest=useMemo(()=>west.filter(isActiveLayoutItem),[west])
  const walkwayFloor = KITCHEN.width - 600 - 600
  const walkwayEye = KITCHEN.walkway?.eye ?? 1004
  const snapVal=(v)=> grid ? Math.round(v/grid)*grid : v
  const fmt=(v)=> unit==='mm' ? `${Math.round(v)} mm` : `${(v/25.4).toFixed(1)}"` 
  const fmtPair=(a,b)=> `${fmt(a)} x ${fmt(b)}`
  const planLabel=(id)=>({spice:'Spice 150',gas:'Gas 700 y1500 east + chimney',dishwasher:'Dishwasher y1100 west below geyser',washing:'Washing far north y3251 inside NE tall',garage_NE:'East Tall NE 28in y3251 (washing inside)',garage_SE:'East Tall SE 24in y0 symmetrical',geyser:'Geyser y1100 west top above dishwasher',geyserEastTop:'Geyser east top hidden',sink:'Sink 30\" (762) x 18\" (457) y1800 west',waterpurifier:'Purifier y2600 west after shaft',sinkUpperDishRack:'Vast utensil storage y1800 above sink',shaft:'Shaft 36in y3048 inside',westGarage:'West garage hidden (now east tall)',trashCan:'Trash pull-out y2000',powerPointWest1:'Power point west y1650',powerPointWest2:'Extra charging west y800',powerPointEast1:'Power point east y1650',powerPointEast2:'Extra charging east y2800'}[id]||id)
  const selectedItem=[...activeEast,...activeWest].find(it=>it.id===selectedId) || null
  const measureDistance = measurePoints.length===2 ? Math.hypot(measurePoints[1].x-measurePoints[0].x, measurePoints[1].y-measurePoints[0].y) : null
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
    const e=[...east].sort((a,b)=>a.y-b.y)
    const dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing'), garage=e.find(x=>x.id==='garage_NE'), garageSE=e.find(x=>x.id==='garage_SE'), gasE=e.find(x=>x.id==='gas')
    const eastOrderPass=!!(garage&&wm&&garageSE&&gasE&&garage.y===3251&&wm.y===3251&&gasE.y===1500&&garageSE.y===0&&garage.last&&garageSE.first)
    rows.push({id:'east-order', rule:'East N->S: tall NE washing (3251) -> gas+chimney (1500) -> tall SE (0)', status:eastOrderPass?'pass':'fail', measured:`NE y${garage?.y??'?'} washing y${wm?.y??'?'} gas y${gasE?.y??'?'} SE y${garageSE?.y??'?'}`, expected:'NE/washing 3251 > gas 1500 > SE 0', fix:'Keep east N->S NE tall + washing (3251) -> gas+chimney (1500) -> SE tall (0)'})

    const w=[...west].sort((a,b)=>a.y-b.y)
    const gas=w.find(x=>x.id==='gas'), sh=w.find(x=>x.id==='shaft'), westGarage=w.find(x=>x.id==='westGarage')
    const gapBetweenGarageAndGas=westGarage&&gas ? westGarage.y-(gas.y+gas.w) : null
    const sh2=w.find(x=>x.id==='shaft'), pur=w.find(x=>x.id==='waterpurifier'), sk2=w.find(x=>x.id==='sink'), dw2=w.find(x=>x.id==='dishwasher'), ge=w.find(x=>x.id==='geyser')
    const westOrderPass=!!(sh2&&pur&&sk2&&dw2&&ge&&sh2.y===3048&&pur.y===2600&&sk2.y===1800&&dw2.y===1100&&ge.y===1100&&sh2.inside)
    rows.push({id:'west-order', rule:'West N->S: shaft 3048 > purifier 2600 > sink 1800 > dishwasher 1100 + geyser', status:westOrderPass?'pass':'fail', measured:`shaft y${sh2?.y??'?'} pur y${pur?.y??'?'} sink y${sk2?.y??'?'} dw y${dw2?.y??'?'} geyser y${ge?.y??'?'}`, expected:'shaft 3048 > purifier 2600 > sink 1800 > dishwasher/geyser 1100 inside', fix:'Keep west N->S shaft (3048) -> purifier (2600) -> sink (1800) -> dishwasher (1100) + geyser above'})

    const wp2=w.find(x=>x.id==='waterpurifier'), rack2=w.find(x=>x.id==='sinkUpperDishRack'), sk3=w.find(x=>x.id==='sink')
    rows.push({id:'purifier-near-sink', rule:'Purifier y2600 after shaft north of sink + vast storage over sink', status:(wp2?.mountedAbove && rack2 && rack2.y===sk3?.y && wp2.y>sk3?.y)?'pass':'fail', measured:`purifier y${wp2?.y??'?'} z${wp2?.z??'?'} above:${!!wp2?.mountedAbove}, sink y${sk3?.y??'?'}, rack y${rack2?.y??'?'}/${rack2?.w??'?'}`, expected:'purifier z1350 y2600 north of sink 1800 + 762 storage over sink', fix:'Keep purifier at y2600 z1350 after shaft and dish rack 762W over sink y1800'})

    const doorViolations= west.filter(it=> isCabinetLikeItem(it) && !it.fixed && it.y < KITCHEN.westGap.to && (it.y+it.w) > KITCHEN.westGap.from)
    const doorPass=doorViolations.length===0
    rows.push({id:'door-clear-zone', rule:`West door clear zone y${KITCHEN.westGap.from}-y${KITCHEN.westGap.to} empty (2ft)`, status:doorPass?'pass':'fail', measured: doorPass?'0 items in zone':`${doorViolations.map(i=>i.id).join(', ')} overlap`, expected:`no item with y in [${KITCHEN.westGap.from},${KITCHEN.westGap.to})`, fix:`Move any west object overlapping y${KITCHEN.westGap.from}-y${KITCHEN.westGap.to} beyond y${KITCHEN.westGap.to}`})

    rows.push({id:'walkway-minimum', rule:'Walkway minimum', status:'pass', measured:`floor ${walkwayFloor} mm / eye ${walkwayEye} mm`, expected:'floor 1324 mm / eye 1004 mm', fix:'Do not widen depths beyond 600D east / 400D west'})

    const zRange=(it)=>{
      if(it.id==='waterpurifier') return {base: it.z ?? 900, h: it.h||550}
      if(it.id==='gas') return {base:900,h:120}
      return {base: it.z ?? 0, h:it.h||880}
    }
    const checkCollisions=(arr)=>{
      const sorted=[...arr].filter(it=>isCabinetLikeItem(it) && !it.fixed && it.id!=='shaft' && it.id!=='garage_NE' && it.id!=='trashCan').sort((a,b)=>a.y-b.y)
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
    rows.push({id:'collision', rule:'Cabinet/appliance collision', status:collPass?'pass':'fail', measured: collPass?'no overlap':`overlaps: ${[...eastColl,...westColl].join(', ')}`, expected:'separate items along y, except intentional contents inside tall cabinets', fix:'Separate overlapping items along y'})

    const outOfBounds=[...east,...west].filter(it=> isCabinetLikeItem(it) && !it.fixed && it.id!=='shaft' && (it.y<0 || it.y+it.w>4746 || it.x<0 || it.x+it.d>2324))
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
  useEffect(()=>{ measurePointsRef.current=measurePoints },[measurePoints])
  useEffect(()=>{ selectedItemRef.current=selectedItem },[selectedItem])
  useEffect(()=>{ unitRef.current=unit },[unit])
  useEffect(()=>{ interactionModeRef.current=interactionMode; if(interactionMode==='measure') setMeasureMode(true); else setMeasureMode(false); if(interactionMode!=='measure') setMeasurePoints([]); threeViewRef.current?.updateCursor?.(); },[interactionMode])
  useEffect(()=>{ if(measureMode) setInteractionMode('measure'); },[measureMode])

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
        if(p.materials) setMaterials(prev=>normalizeKitchenMaterials({...prev,...p.materials}))
        if(typeof p.hide3DObstructions==='boolean') setHide3DObstructions(p.hide3DObstructions)
        if(p.eastModules) setEastModules(p.eastModules.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.eastModules)
        if(p.westModules) setWestModules(p.westModules.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.westModules)
      }
    }catch{}
  },[])

  useEffect(()=>{window.kitchenAPI={
    moveItem:(wall,id,ycm)=>{const y=snapVal(ycm*10); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    moveItemMM:(wall,id,yMM)=>{const y=snapVal(yMM); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    getLayout:()=>({kitchen:KITCHEN,east,west,validation:{...vSimple, detailed:validationRows}, rule:LAYOUT_MODEL.rule, layoutModel:getLayoutModel(), grid, walkway:{floor:walkwayFloor,eye:walkwayEye}, materials:renderMaterials, modules:{east:eastModules,west:westModules}, viewOptions:{hide3DObstructions}}), validate:()=>({ ...vSimple, detailed:validationRows, rows:validationRows }), reset:()=>{setEast(EAST_INIT);setWest(WEST_INIT); setEastModules(autoFillModules(eastRunLength)); setWestModules(autoFillModules(westRunLength)); setMaterials(normalizeKitchenMaterials()); setGrid(0); setHide3DObstructions(true); localStorage.removeItem(LS_KEY)}, getLayoutModel,
    getGrid:()=>grid, setGrid:(g)=>setGrid(g===50||g===100?g:0), getWalkway:()=>({floor:walkwayFloor,eye:walkwayEye}),
    getDimensions:()=>({roomWidth:2324,roomLength:4746,eastBaseDepth:600,westCounterDepth:400,walkwayWidth:walkwayFloor,northClear:0,windowBelowDepth:KITCHEN.windowBelow?.depth||300,westDoorClear:{from:0,to:1220}}),
    getMaterials:()=>renderMaterials, setMaterial:(k,v)=>setMaterials(p=>normalizeKitchenMaterials({...p,[k]:v})),
    getModules:()=>({east:eastModules,west:westModules}), setModules:(wall,mods)=>{ if(wall==='east')setEastModules(mods); else setWestModules(mods)},
    getBOM:()=>buildBOM(),
    getValidationRows:()=>validationRows,
    get3DOptions:()=>({hideObstructions:hide3DObstructions}),
    getGpuInfo:()=>threeViewRef.current?.gpuInfo||null,
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

  const onDown=(e,wall,id)=>{if(e.button!==0) return; const it=[...east,...west].find(x=>x.id===id); if(interactionMode==='dimension'){ setSelectedId(id); return; } if(interactionMode==='measure'){ setSelectedId(id); const cx = (it.x||0)+(it.d||400)/2, cy = it.y + (it.w||600)/2; setMeasurePoints(prev=> prev.length>=2 ? [{x:cx,y:cy}] : [...prev,{x:cx,y:cy}]); return; } if(interactionMode==='transparent'){ setSelectedId(id); // transparent preview - no drag, just selection with transparent hint
    return; } // cabinet mode: allow drag
    setSelectedId(id); if(it?.fixed) return; setDrag({wall,id,startY:e.clientY,startItemY:it.y})}
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
  const resetRule9=()=>{ setEast(EAST_INIT); setWest(WEST_INIT); setEastModules(autoFillModules(eastRunLength)); setWestModules(autoFillModules(westRunLength)); setMaterials(normalizeKitchenMaterials()); setGrid(0); setHide3DObstructions(true); setImportWarning('');}
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
      if(p.materials) setMaterials(prev=>normalizeKitchenMaterials({...prev,...p.materials}))
      if(typeof p.hide3DObstructions==='boolean') setHide3DObstructions(p.hide3DObstructions)
      if(typeof p.viewOptions?.hide3DObstructions==='boolean') setHide3DObstructions(p.viewOptions.hide3DObstructions)
      if(p.modules?.east) setEastModules(p.modules.east.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.modules.east)
      if(p.modules?.west) setWestModules(p.modules.west.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.modules.west)
      if(p.eastModules) setEastModules(p.eastModules.reduce((sum,m)=>sum+(m.width||0),0)===4446?autoFillModules(eastRunLength):p.eastModules)
      if(p.westModules) setWestModules(p.westModules.reduce((sum,m)=>sum+(m.width||0),0)===3226?autoFillModules(westRunLength):p.westModules)
      if(p.validation) {} // not needed
      // warn for missing IDs - East: garage_NE washing gas garage_SE | West: shaft purifier sink rack dishwasher geyser
      const expectedIds=['garage_NE','washing','gas','garage_SE','shaft','waterpurifier','sink','sinkUpperDishRack','dishwasher','geyser']
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
      rect(KITCHEN.width-600,svgY(0,usableLen),600,usableLen,renderStyle.baseCabinet),
      label(KITCHEN.width-300,svgY(0,usableLen)+180,'EAST 600D RUN',70),
      rect(0,svgY(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to),600,usableLen-KITCHEN.westGap.to,renderStyle.baseCabinet),
      label(200,svgY(KITCHEN.westGap.to,usableLen-KITCHEN.westGap.to)+180,'WEST 600D RUN',70),
      rect(0,svgY(0,KITCHEN.westGap.to),600,KITCHEN.westGap.to,'#fffaf3','#7b3f21','45 28'),
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
    activeEast.forEach(it=>{
      const x=KITCHEN.width-it.d, y=svgY(it.y,it.w)
      parts.push(rect(x,y,it.d,it.w,it.color))
      parts.push(label(x+it.d/2,y+it.w/2,`${it.id.toUpperCase()} y${Math.round(it.y/10)}cm`,64,['gas'].includes(it.id)?'#fff':'#111'))
    })
    activeWest.forEach(it=>{
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
    parts.push(dimLineH(0,600, 36,'West 600 mm'))
    parts.push(dimLineH(600, KITCHEN.width-600, KITCHEN.length/2,'Walkway '+walkway+' mm'))
    parts.push(dimLineV(svgY(0,KITCHEN.westGap.to), KITCHEN.length, dimOuterXWest,'Door clear y0-y1220 (1220 mm)'))
    parts.push(`<rect x="${vbX+10}" y="${vbY+vbH-62}" width="980" height="48" fill="#111" rx="8"/>`)
    parts.push(`<text x="${vbX+22}" y="${vbY+vbH-30}" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#fff">Scale 1:1 mm  |  2324W x 4746L x 2700H  |  Walkway ${walkway} mm  |  Grid ${grid?grid+' mm':'Off'}  |  East 600D  West 600D</text>`)
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
    activeEast.forEach(it=>{addRect(KITCHEN.width-it.d,it.y,it.d,it.w,`EAST_${it.id.toUpperCase()}`); addText(KITCHEN.width-it.d+35,it.y+it.w/2,`EAST ${it.id} y${it.y}mm`,70)})
    activeWest.forEach(it=>{addRect(0,it.y,it.d,it.w,`WEST_${it.id.toUpperCase()}`); addText(35,it.y+it.w/2,`WEST ${it.id} y${it.y}mm`,70)})
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
    addText(20, -170, 'Scale 1:1 mm | 2324W x 4746L x 2700H | Walkway '+walkway+' mm | Grid '+(grid?grid+'mm':'Off')+' | East 600D West 600D', 60, 'DIM')
    if(grid===50||grid===100){
      for(let x=0;x<=KITCHEN.width;x+=grid) addLine(x,0,x,KITCHEN.length,'GRID')
      for(let y=0;y<=KITCHEN.length;y+=grid) addLine(0,y,KITCHEN.width,y,'GRID')
    }
    lines.push('0','ENDSEC','0','EOF')
    return lines.join('\n')
  }
  const exportPlanDxf=()=>downloadText('kitchen-2d-plan-coohom-background.dxf',buildPlanDxf(),'application/dxf')
  const buildCoohomGuide=()=>{
    const eastRows=activeEast.map(it=>`| East | ${it.id} | ${it.y} | ${it.w} | ${it.d} | ${it.h||880} |`).join('\n')
    const westRows=activeWest.map(it=>`| West | ${it.id} | ${it.y} | ${it.w} | ${it.d} | ${it.h||400} |`).join('\n')
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
- Cabinet body: ${renderMaterials.cabinetBody}
- Shutters: ${renderMaterials.shutters}
- Counter: ${renderMaterials.counter}
- Backsplash: ${renderMaterials.backsplash}
- Floor: ${renderMaterials.floor}
- Wall: ${renderMaterials.wall}
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
    const appliances=[
      ...activeEast.map(it=>({...it,wall:'east'})),
      ...activeWest.map(it=>({...it,wall:'west'})),
    ].filter(isCabinetLikeItem).map(it=>({id:it.id,label:planLabel(it.id), wall:it.wall, y:it.y, w:it.w, d:it.d}))
    return { baseCount, wallLowerCount, wallTopCount, shutterCount, drawerCount, handleCount, counterLenMm, counterLenM, backsplashAreaM2, appliances, eastModules, westModules, notes: ['Door clear zone y0-y1220','Window-only 300 mm below-sill reference','Shaft y4146 NW','Window north 1100W'] }
  }
  const bom=useMemo(()=>buildBOM(),[activeEast,activeWest,eastModules,westModules])
  const buildBOMCsv=()=>{
    const b=bom
    const rows=[]
    rows.push(['Item','Quantity','Dimensions','Notes'])
    rows.push(['Base cabinets', b.baseCount, `${b.eastModules.map(m=>m.width).join('+')} / ${b.westModules.map(m=>m.width).join('+')}`, 'East 600D + West 600D'])
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
    let md=`# Kitchen BOM - Galley 2324x4746 New Configuration\n\n`
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
    md+=`\n## Materials\n- Cabinet body ${renderMaterials.cabinetBody}\n- Shutters ${renderMaterials.shutters}\n- Counter ${renderMaterials.counter}\n- Backsplash ${renderMaterials.backsplash}\n- Floor ${renderMaterials.floor}\n- Wall ${renderMaterials.wall}\n- Handle style: handleless\n`
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
      addLine('Kitchen Project Summary - Galley 2324x4746 New Configuration',16,22)
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
    const [diagnostics,setDiagnostics]=useState(()=>{try{return JSON.parse(localStorage.getItem('kitchen-diagnostics')||'[]')}catch{return []}})
    const saveDiagnostics=(list)=>{ localStorage.setItem('kitchen-diagnostics',JSON.stringify(list)); setDiagnostics(list) }
    useEffect(()=>{
      const mount=mountRef.current
      if(!mount)return
      const scene=new THREE.Scene()
      scene.background=new THREE.Color(RENDER_CONFIG.scene.background)
      scene.fog=new THREE.Fog(RENDER_CONFIG.scene.fog.color,RENDER_CONFIG.scene.fog.near,RENDER_CONFIG.scene.fog.far)
      const camera=new THREE.PerspectiveCamera(RENDER_CONFIG.camera.fov,1,RENDER_CONFIG.camera.near,RENDER_CONFIG.camera.far)
      cameraRef.current=camera
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,RENDER_CONFIG.renderer.pixelRatioMax))
      renderer.outputColorSpace=THREE[RENDER_CONFIG.renderer.outputColorSpace]||THREE.SRGBColorSpace
      renderer.toneMapping=THREE[RENDER_CONFIG.renderer.toneMapping]||THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure=RENDER_CONFIG.renderer.toneMappingExposure
      renderer.shadowMap.enabled=RENDER_CONFIG.renderer.shadowMapEnabled
      renderer.shadowMap.type=THREE[RENDER_CONFIG.renderer.shadowMapType]||THREE.PCFSoftShadowMap
      renderer.domElement.style.width='100%'
      renderer.domElement.style.height='auto'
      renderer.domElement.style.display='block'
      mount.appendChild(renderer.domElement)
      // overlay for 3D dimension + measurement labels
      mount.style.position='relative'
      const overlay=document.createElement('div')
      overlay.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2'
      mount.appendChild(overlay)
      const dimLabel=document.createElement('div')
      dimLabel.style.cssText='position:absolute;transform:translate(-50%,-120%);background:#0c4a6e;color:#fff;padding:7px 10px;border-radius:10px;font:800 11px Inter,sans-serif;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.18);border:1px solid #fff;display:none;pointer-events:none'
      overlay.appendChild(dimLabel)
      const measureLabel=document.createElement('div')
      measureLabel.style.cssText='position:absolute;transform:translate(-50%,-50%);background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:10px;font:900 12px Inter,sans-serif;white-space:nowrap;border:2px solid #d97706;box-shadow:0 4px 12px rgba(0,0,0,.12);display:none;pointer-events:none'
      overlay.appendChild(measureLabel)
      const pmremGenerator=new THREE.PMREMGenerator(renderer)
      const envTexture=pmremGenerator.fromScene(new RoomEnvironment(),RENDER_CONFIG.renderer.roomEnvironmentBlur).texture
      scene.environment=envTexture
      const controls=new OrbitControls(camera,renderer.domElement)
      controlsRef.current=controls
      controls.enableDamping=true
      controls.target.set(...RENDER_CONFIG.camera.orbitTarget)
      const s=(n)=>n/10
      // 3D measurement visuals (line + endpoints)
      const measureGroup=new THREE.Group()
      measureGroup.name='measureGroup'
      measureGroup.userData.ignoreMeasureRaycast=true
      scene.add(measureGroup)
      const measureLineGeom=new THREE.BufferGeometry()
      const measureLineMat=new THREE.LineDashedMaterial({color:0xd97706, linewidth:2, scale:1, dashSize:s(28), gapSize:s(14), transparent:true, opacity:0.98})
      const measureLine=new THREE.Line(measureLineGeom, measureLineMat)
      measureLine.userData.ignoreMeasureRaycast=true
      measureLine.frustumCulled=false
      measureGroup.add(measureLine)
      const epGeo=new THREE.SphereGeometry(s(16),16,16)
      const epMat=new THREE.MeshStandardMaterial({color:0xd97706, emissive:0xd97706, emissiveIntensity:0.18, roughness:0.4})
      const epMesh1=new THREE.Mesh(epGeo, epMat)
      const epMesh2=new THREE.Mesh(epGeo, epMat)
      epMesh1.userData.ignoreMeasureRaycast=true
      epMesh2.userData.ignoreMeasureRaycast=true
      epMesh1.visible=false; epMesh2.visible=false
      measureGroup.add(epMesh1); measureGroup.add(epMesh2)

      const maxTextureAnisotropy=Math.min(RENDER_CONFIG.textures.maxAnisotropy,renderer.capabilities.getMaxAnisotropy?.()||RENDER_CONFIG.textures.maxAnisotropy)
      const textureLoader=new THREE.TextureLoader()
      const textureFromCanvas=(paint,width=RENDER_CONFIG.textures.generatedSize,height=RENDER_CONFIG.textures.generatedSize,options={})=>{
        const canvas=document.createElement('canvas')
        canvas.width=width; canvas.height=height
        const ctx=canvas.getContext('2d')
        paint(ctx,canvas.width,canvas.height)
        const tex=new THREE.CanvasTexture(canvas)
        tex.colorSpace=options.colorSpace||THREE.SRGBColorSpace
        tex.wrapS=THREE.RepeatWrapping
        tex.wrapT=THREE.RepeatWrapping
        tex.anisotropy=maxTextureAnisotropy
        tex.needsUpdate=true
        return tex
      }
      const textureAsset=(path,{colorSpace=THREE.SRGBColorSpace,repeat=[1,1]}={})=>{
        const tex=textureLoader.load(`${import.meta.env.BASE_URL}${path}`,()=>renderer.render(scene,camera))
        tex.colorSpace=colorSpace
        tex.wrapS=THREE.RepeatWrapping
        tex.wrapT=THREE.RepeatWrapping
        tex.anisotropy=maxTextureAnisotropy
        tex.minFilter=THREE.LinearMipmapLinearFilter
        tex.magFilter=THREE.LinearFilter
        tex.repeat.set(repeat[0],repeat[1])
        return tex
      }
      const grayscaleTexture=(paint,width=1024,height=1024)=>textureFromCanvas(paint,width,height,{colorSpace:THREE.NoColorSpace})
      const laminateBumpTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h)
        for(let y=0;y<h;y+=18){
          ctx.strokeStyle=y%54===0?'#9a9a9a':'#747474'
          ctx.lineWidth=y%54===0?2:1
          ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(w*.28,y+5,w*.72,y-5,w,y+3); ctx.stroke()
        }
      })
      laminateBumpTex.repeat.set(2.4,6)
      const whiteLaminateRoughTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#a8a8a8'; ctx.fillRect(0,0,w,h)
        for(let i=0;i<2600;i++){
          const v=148+Math.floor(((i*37)%43)-21)
          ctx.fillStyle=`rgb(${v},${v},${v})`
          ctx.fillRect((i*97)%w,(i*53)%h,2,2)
        }
      })
      whiteLaminateRoughTex.repeat.set(2,4)
      const woodBumpTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#777'; ctx.fillRect(0,0,w,h)
        for(let x=0;x<w;x+=26){
          ctx.strokeStyle=x%78===0?'#9b9b9b':'#646464'
          ctx.lineWidth=x%78===0?3:1
          ctx.beginPath(); ctx.moveTo(x,0); ctx.bezierCurveTo(x+10,h*.25,x-12,h*.7,x+8,h); ctx.stroke()
        }
      })
      woodBumpTex.repeat.set(1.8,1)
      const quartzBumpTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#848484'; ctx.fillRect(0,0,w,h)
        for(let i=0;i<34;i++){
          ctx.strokeStyle=i%2?'#9c9c9c':'#707070'
          ctx.lineWidth=i%2?2:4
          const y=(i*83)%h
          ctx.beginPath()
          ctx.moveTo(-20,y)
          ctx.bezierCurveTo(w*.25,y-70+((i*31)%140),w*.68,y-70+((i*47)%140),w+20,y-36+((i*19)%72))
          ctx.stroke()
        }
      })
      quartzBumpTex.repeat.set(3,10)
      const quartzRoughTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#8f8f8f'; ctx.fillRect(0,0,w,h)
        for(let i=0;i<1800;i++){
          const v=118+((i*29)%58)
          ctx.fillStyle=`rgb(${v},${v},${v})`
          ctx.fillRect((i*71)%w,(i*43)%h,3,2)
        }
      })
      quartzRoughTex.repeat.set(3,10)
      const tileBumpBaseTex=grayscaleTexture((ctx,w,h)=>{
        ctx.fillStyle='#858585'; ctx.fillRect(0,0,w,h)
        const tile=256
        for(let y=0;y<h;y+=tile){
          for(let x=0;x<w;x+=tile){
            ctx.strokeStyle='#5e5e5e'; ctx.lineWidth=9; ctx.strokeRect(x+4,y+4,tile-8,tile-8)
            ctx.strokeStyle='#9b9b9b'; ctx.lineWidth=2; ctx.strokeRect(x+15,y+15,tile-30,tile-30)
            ctx.fillStyle='#8c8c8c'; ctx.beginPath(); ctx.arc(x+tile/2,y+tile/2,36,0,Math.PI*2); ctx.fill()
          }
        }
      },2048,1024)
      tileBumpBaseTex.repeat.set(1,1)
      const woodTex=textureFromCanvas((ctx,w,h)=>{
        ctx.fillStyle=renderStyle.baseCabinet
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
        ctx.fillStyle=renderStyle.middleCabinet
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
        ctx.fillStyle=renderStyle.counter
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
      const floorBumpTex=tileBumpBaseTex.clone()
      floorBumpTex.repeat.copy(floorTex.repeat)
      floorBumpTex.needsUpdate=true
      const patternedTileTex=textureFromCanvas((ctx,w,h)=>{
        const tile=256
        const motifs=[
          {bg:'#fffaf0',line:'#24588d',accent:'#b86a3c',kind:'floral'},
          {bg:'#f5e1c5',line:'#174d83',accent:'#ffffff',kind:'scroll'},
          {bg:'#fffdf7',line:'#1e5b91',accent:'#c47743',kind:'rosette'},
          {bg:'#f2d1aa',line:'#1c4f80',accent:'#fff7e8',kind:'corner'},
        ]
        ctx.fillStyle='#fffaf0'
        ctx.fillRect(0,0,w,h)
        for(let y=0;y<h;y+=tile){
          for(let x=0;x<w;x+=tile){
            const motifIndex=(((x/tile)|0)+(((y/tile)|0)*3))%motifs.length
            const m=motifs[motifIndex]
            ctx.save()
            ctx.translate(x,y)
            ctx.scale(tile/128,tile/128)
            ctx.fillStyle=m.bg
            ctx.fillRect(0,0,128,128)
            ctx.strokeStyle='#ddb37a'
            ctx.lineWidth=8
            ctx.strokeRect(5,5,118,118)
            ctx.strokeStyle=m.line
            ctx.lineWidth=8
            ctx.beginPath()
            if(m.kind==='floral'){
              ctx.arc(64,64,34,0,Math.PI*2)
              ctx.moveTo(64,18); ctx.lineTo(64,110)
              ctx.moveTo(18,64); ctx.lineTo(110,64)
              ctx.stroke()
              ctx.fillStyle=m.accent
              ctx.beginPath(); ctx.arc(64,64,13,0,Math.PI*2); ctx.fill()
            } else if(m.kind==='scroll'){
              ctx.moveTo(22,84)
              ctx.bezierCurveTo(38,28,88,28,106,84)
              ctx.moveTo(22,44)
              ctx.bezierCurveTo(38,100,88,100,106,44)
              ctx.stroke()
              ctx.fillStyle=m.accent
              ;[[34,34],[94,34],[34,94],[94,94]].forEach(([px,py])=>{ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill()})
            } else if(m.kind==='rosette'){
              ctx.fillStyle=m.line
              for(let i=0;i<8;i++){
                ctx.save()
                ctx.translate(64,64)
                ctx.rotate(i*Math.PI/4)
                ctx.beginPath()
                ctx.ellipse(0,-25,11,25,0,0,Math.PI*2)
                ctx.fill()
                ctx.restore()
              }
              ctx.fillStyle=m.accent
              ctx.beginPath(); ctx.arc(64,64,14,0,Math.PI*2); ctx.fill()
            } else {
              ctx.beginPath()
              ctx.moveTo(22,22); ctx.lineTo(50,22); ctx.lineTo(22,50)
              ctx.moveTo(106,22); ctx.lineTo(78,22); ctx.lineTo(106,50)
              ctx.moveTo(22,106); ctx.lineTo(50,106); ctx.lineTo(22,78)
              ctx.moveTo(106,106); ctx.lineTo(78,106); ctx.lineTo(106,78)
              ctx.stroke()
              ctx.fillStyle=m.accent
              ctx.beginPath(); ctx.arc(64,64,23,0,Math.PI*2); ctx.fill()
              ctx.strokeStyle=m.line
              ctx.beginPath(); ctx.arc(64,64,33,0,Math.PI*2); ctx.stroke()
            }
            ctx.strokeStyle='rgba(114,74,42,.35)'
            ctx.lineWidth=2
            ctx.strokeRect(1,1,126,126)
            ctx.restore()
          }
        }
      },2048,1024)
      patternedTileTex.repeat.set(1,1)
      const woodCabinetConfig=RENDER_CONFIG.textures.woodCabinet
      const woodCabinetTex=textureAsset(woodCabinetConfig.color,{repeat:woodCabinetConfig.repeat})
      const woodCabinetRoughTex=textureAsset(woodCabinetConfig.roughness,{colorSpace:THREE.NoColorSpace,repeat:woodCabinetConfig.repeat})
      const woodCabinetNormalTex=textureAsset(woodCabinetConfig.normal,{colorSpace:THREE.NoColorSpace,repeat:woodCabinetConfig.repeat})
      const woodCabinetDisplacementTex=textureAsset(woodCabinetConfig.displacement,{colorSpace:THREE.NoColorSpace,repeat:woodCabinetConfig.repeat})
      const tileConfig=RENDER_CONFIG.textures.tile
      const shaftTileTex=textureLoader.load(`${import.meta.env.BASE_URL}${tileConfig.path}`,()=>renderer.render(scene,camera))
      shaftTileTex.colorSpace=THREE.SRGBColorSpace
      shaftTileTex.wrapS=THREE.RepeatWrapping
      shaftTileTex.wrapT=THREE.RepeatWrapping
      shaftTileTex.anisotropy=maxTextureAnisotropy
      shaftTileTex.minFilter=THREE.LinearMipmapLinearFilter
      shaftTileTex.magFilter=THREE.LinearFilter
      shaftTileTex.repeat.set(1,1)
      const shaftTileBumpTex=tileBumpBaseTex.clone()
      shaftTileBumpTex.repeat.copy(shaftTileTex.repeat)
      shaftTileBumpTex.needsUpdate=true
      const makeMat=createPbrMaterial
      const makeLargePatternTileMat=(surfaceWidthMm,surfaceHeightMm)=>{
        const tex=shaftTileTex.clone()
        tex.wrapS=THREE.RepeatWrapping
        tex.wrapT=THREE.RepeatWrapping
        tex.colorSpace=THREE.SRGBColorSpace
        tex.anisotropy=maxTextureAnisotropy
        tex.minFilter=THREE.LinearMipmapLinearFilter
        tex.magFilter=THREE.LinearFilter
        tex.repeat.set(
          Math.max(.25,surfaceWidthMm/tileConfig.physicalWidthMm),
          Math.max(.25,surfaceHeightMm/tileConfig.physicalHeightMm)
        )
        const bump=tileBumpBaseTex.clone()
        bump.wrapS=THREE.RepeatWrapping
        bump.wrapT=THREE.RepeatWrapping
        bump.colorSpace=THREE.NoColorSpace
        bump.anisotropy=maxTextureAnisotropy
        bump.repeat.copy(tex.repeat)
        bump.needsUpdate=true
        tex.needsUpdate=true
        return makeMat('#ffffff',1,{map:tex,bumpMap:bump,bumpScale:tileConfig.bumpScale,...RENDER_CONFIG.pbr.tile})
      }
      const surface={
        cabinet:makeMat(renderStyle.baseCabinet,1,{bumpMap:laminateBumpTex,roughnessMap:whiteLaminateRoughTex,...RENDER_CONFIG.pbr.cabinet}),
        tallCabinet:makeMat(renderStyle.tallCabinet,1,{bumpMap:laminateBumpTex,roughnessMap:whiteLaminateRoughTex,...RENDER_CONFIG.pbr.tallCabinet}),
        topCabinet:makeMat(renderStyle.topCabinet,1,{bumpMap:laminateBumpTex,roughnessMap:whiteLaminateRoughTex,...RENDER_CONFIG.pbr.topCabinet}),
        middleCabinet:makeMat(renderStyle.middleCabinet,1,{map:woodCabinetTex,roughnessMap:woodCabinetRoughTex,normalMap:woodCabinetNormalTex,normalScale:new THREE.Vector2(woodCabinetConfig.normalScale,woodCabinetConfig.normalScale),displacementMap:woodCabinetDisplacementTex,displacementScale:woodCabinetConfig.displacementScale,...RENDER_CONFIG.pbr.middleCabinet}),
        shutter:makeMat(renderStyle.middleCabinet,1,{map:woodCabinetTex,roughnessMap:woodCabinetRoughTex,normalMap:woodCabinetNormalTex,normalScale:new THREE.Vector2(woodCabinetConfig.normalScale,woodCabinetConfig.normalScale),displacementMap:woodCabinetDisplacementTex,displacementScale:woodCabinetConfig.displacementScale,...RENDER_CONFIG.pbr.middleCabinet}),
        counter:makeMat(renderStyle.counter,1,{map:marbleTex,bumpMap:quartzBumpTex,roughnessMap:quartzRoughTex,...RENDER_CONFIG.pbr.counter}),
        floor:makeMat(materials.floor||'#ded6cc',1,{map:floorTex,bumpMap:floorBumpTex,bumpScale:.018,...RENDER_CONFIG.pbr.floor}),
        wall:makeMat(materials.wall||'#f6efe6',.82,RENDER_CONFIG.pbr.wall),
        shaftTile:makeMat('#ffffff',1,{map:shaftTileTex,bumpMap:shaftTileBumpTex,bumpScale:tileConfig.bumpScale,...RENDER_CONFIG.pbr.tile}),
        glass:makeMat('#9fd2f1',.36,RENDER_CONFIG.pbr.glass),
        blackGlass:makeMat('#101010',1,RENDER_CONFIG.pbr.blackGlass),
        metal:makeMat('#bfc4c7',1,RENDER_CONFIG.pbr.metal),
        led:makeMat(RENDER_CONFIG.pbr.led.color,1,RENDER_CONFIG.pbr.led),
        dark:makeMat('#1c1a18',1,RENDER_CONFIG.pbr.dark),
        plinth:makeMat(renderStyle.plinth,1,RENDER_CONFIG.pbr.plinth),
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
      const clickableCabinets=[]
      const addBox=(name,x,y,z,w,d,h,c,opacity=1)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(s(w),s(h),s(d)),material(c,opacity))
        mesh.name=name
        const isShell=name==='west wall'||name==='east wall'||name==='north wall'||name==='ceiling'||name==='recessed ceiling center'
        if(isShell) registerCutaway(mesh,['shell'])
        else if(/^east\b|^garage\b|^hob\b|^three burner\b|^cooktop\b/.test(name)) registerCutaway(mesh,['east'])
        else if(/^west\b|^microwave\b|^clean dish\b|^dish rack\b|^purifier\b/.test(name)) registerCutaway(mesh,['west'])
        // mark cabinet fronts as clickable
        if(/(front|garage|dish rack|purifier cabinet front|upper front|base front)/.test(name)){
          mesh.userData.isCabinetFront=true
          mesh.userData.originalPosition=new THREE.Vector3()
          mesh.userData.opened=false
          clickableCabinets.push(mesh)
        }
        mesh.position.set(s(KITCHEN.width/2-(x+w/2)),s(z+h/2),s(y+d/2-KITCHEN.length/2))
        // store original for animation
        if(mesh.userData.isCabinetFront) mesh.userData.originalPosition.copy(mesh.position)
        mesh.castShadow=opacity>.45
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      const addCylinder=(name,x,y,z,rTop,rBottom,h,c,opacity=1,segments=32)=>{
        const mesh=new THREE.Mesh(new THREE.CylinderGeometry(s(rTop),s(rBottom),s(h),segments),material(c,opacity))
        mesh.name=name
        mesh.position.set(s(KITCHEN.width/2-x),s(z+h/2),s(y-KITCHEN.length/2))
        mesh.castShadow=opacity>.45
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      const addSphere=(name,x,y,z,r,c,opacity=1,scale=[1,1,1])=>{
        const mesh=new THREE.Mesh(new THREE.SphereGeometry(s(r),24,16),material(c,opacity))
        mesh.name=name
        mesh.position.set(s(KITCHEN.width/2-x),s(z),s(y-KITCHEN.length/2))
        mesh.scale.set(scale[0],scale[1],scale[2])
        mesh.castShadow=opacity>.45
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      const addPotteryWallPlanter=(name,x,y,z,scale,palette)=>{
        const potMat=makeMat(palette.body,1,{roughness:.5,metalness:.02})
        const whiteMat=makeMat('#f7f3e7',1,{roughness:.55,metalness:.01})
        const blueMat=makeMat(palette.blue||'#123c78',1,{roughness:.48,metalness:.02})
        const soilMat=makeMat('#352317',1,{roughness:.9})
        const flowerMat=makeMat(palette.flower,1,{roughness:.72,metalness:0})
        const fillerMat=makeMat(palette.filler||'#e6ead8',1,{roughness:.8,metalness:0})
        const stemMat=makeMat('#6f7646',1,{roughness:.78,metalness:0})
        const r=72*scale
        const h=118*scale
        addBox(`${name} wall bracket`,KITCHEN.shaft.w+20,y-r*.56,z+18*scale,74*scale,18*scale,32*scale,surface.dark)
        addCylinder(`${name} blue pottery planter bowl`,x,y,z,r,r*.78,h,potMat,1,36)
        addCylinder(`${name} dark blue rim`,x,y,z+h-12*scale,r*1.04,r*1.04,12*scale,blueMat,1,36)
        addCylinder(`${name} white upper band`,x,y,z+h-32*scale,r*.98,r*.98,12*scale,whiteMat,1,36)
        addCylinder(`${name} blue lower band`,x,y,z+22*scale,r*.88,r*.82,12*scale,blueMat,1,36)
        addCylinder(`${name} soil`,x,y,z+h-8*scale,r*.84,r*.84,10*scale,soilMat,1,32)
        ;[-.55,0,.55].forEach((off,i)=>{
          addBox(`${name} white pottery motif ${i+1}`,x-r*.64,y+off*r*.82,z+h*.43,8*scale,20*scale,26*scale,whiteMat)
          addSphere(`${name} blue pottery dot ${i+1}`,x-r*.7,y+off*r*.82,z+h*.62,8*scale,blueMat,1,[1,.45,1])
        })
        ;[-.45,-.15,.18,.48].forEach((off,i)=>{
          const stemY=y+off*r*.95
          const stemZ=z+h+8*scale+i*8*scale
          addCylinder(`${name} flower stem ${i+1}`,x-8*scale,stemY,stemZ,3*scale,3*scale,(108+i*12)*scale,stemMat,1,8)
          addSphere(`${name} flower cluster ${i+1}`,x-18*scale,stemY,stemZ+(118+i*12)*scale,18*scale, i%2===0?flowerMat:fillerMat,1,[1.15,.8,1])
        })
        ;[-.62,-.28,.05,.38,.66].forEach((off,i)=>{
          addSphere(`${name} tiny filler bloom ${i+1}`,x-22*scale,y+off*r,z+h+92*scale+(i%2)*32*scale,8*scale,fillerMat,1,[1,.9,1])
        })
      }
      // floor, walls and ceiling envelope
      addBox('floor',0,0,-30,KITCHEN.width,KITCHEN.length,30,surface.floor)
      addBox('west wall',-45,0,0,45,KITCHEN.length,KITCHEN.height,makeLargePatternTileMat(KITCHEN.length,KITCHEN.height),.92)
      addBox('east wall',KITCHEN.width,0,0,45,KITCHEN.length,KITCHEN.height,makeLargePatternTileMat(KITCHEN.length,KITCHEN.height),.92)
      addBox('north wall',0,KITCHEN.length,0,KITCHEN.width,45,KITCHEN.height,makeLargePatternTileMat(KITCHEN.width,KITCHEN.height),.88)
      addBox('ceiling',0,0,KITCHEN.height,KITCHEN.width,KITCHEN.length,36,'#f4eadf')
      addBox('recessed ceiling center',310,620,KITCHEN.height-50,1700,3500,28,'#eadac8')
      // --- Proper 2-bay north window: centre mullion only - top 610 fixed x2 / bottom 1190 sliding x2 ---
      {
        const winW = KITCHEN.window.w
        const winH = KITCHEN.window.h
        const winSill = KITCHEN.window.sill
        const winTransom = KITCHEN.window.transomHeight || 610
        const winBayW = winW / 2
        const winBaseX = (KITCHEN.width - winW)/2
        const winY = KITCHEN.length
        const frameCol = '#2b2b2b'
        // sill stone
        addBox('window sill', winBaseX-60, KITCHEN.length-85, winSill-80, winW+120, 150, 55, surface.counter)
        // outer frame
        addBox('window head frame', winBaseX-12, winY+8, winSill+winH-14, winW+24, 28, 28, frameCol)
        addBox('window sill frame', winBaseX-12, winY+8, winSill-14, winW+24, 28, 28, frameCol)
        addBox('window left jamb', winBaseX-12, winY+8, winSill, 28, 28, winH, frameCol)
        addBox('window right jamb', winBaseX+winW-16, winY+8, winSill, 28, 28, winH, frameCol)
        // horizontal transom at 610 from head = sill + (H - 610)
        addBox('window transom', winBaseX, winY+8, winSill + (winH - winTransom), winW, 28, 28, frameCol)
        // single centre vertical mullion
        addBox('window mullion centre', winBaseX+winBayW-10, winY+8, winSill, 20, 20, winH, frameCol)
        // top: left-top METAL 12-inch exhaust, right-top fixed glass
        // left-top METAL 12-inch exhaust - high-contrast stainless, clearly visible
        addBox('north window exhaust housing left-top', winBaseX + 4, winY+8, winSill + (winH - winTransom) + 8, winBayW - 12, 24, winTransom - 16, '#ececec')
        addBox('north window exhaust housing border', winBaseX + 4, winY+8, winSill + (winH - winTransom) + 8, winBayW - 12, 24, 4, '#1a1a1a')
        addBox('north window exhaust housing border top', winBaseX + 4, winY+8, winSill + winH - 18, winBayW - 12, 24, 4, '#1a1a1a')
        // stainless circular face
        addBox('exhaust fan metal face left-top', winBaseX + winBayW/2 - 155, winY+18, winSill + (winH - winTransom/2) - 155, 300, 10, 300, makeMat('#e8eaec',1,{metalness:.78, roughness:.22}))
        // outer ring to pop against white glass
        const ringMat = makeMat('#111111',1,{metalness:.12, roughness:.55})
        addBox('exhaust fan outer ring top', winBaseX + winBayW/2 - 155, winY+22, winSill + (winH - winTransom/2) + 140, 310, 6, 8, ringMat)
        addBox('exhaust fan outer ring bottom', winBaseX + winBayW/2 - 155, winY+22, winSill + (winH - winTransom/2) - 150, 310, 6, 8, ringMat)
        addBox('exhaust fan outer ring left', winBaseX + winBayW/2 - 157, winY+22, winSill + (winH - winTransom/2) - 148, 8, 6, 306, ringMat)
        addBox('exhaust fan outer ring right', winBaseX + winBayW/2 + 147, winY+22, winSill + (winH - winTransom/2) - 148, 8, 6, 306, ringMat)
        addBox('exhaust fan hub left-top', winBaseX + winBayW/2 - 30, winY+24, winSill + (winH - winTransom/2) - 30, 60, 14, 60, makeMat('#1e1e1e',1,{metalness:.25, roughness:.4}))
        addBox('exhaust fan hub highlight', winBaseX + winBayW/2 - 10, winY+26, winSill + (winH - winTransom/2) - 10, 20, 6, 20, makeMat('#f2f2f2',1,{metalness:.85, roughness:.18}))
        // 4 blades - higher contrast brushed stainless
        addBox('exhaust blade 1', winBaseX + winBayW/2 - 125, winY+24, winSill + (winH - winTransom/2) - 14, 250, 6, 28, makeMat('#c2c6ca',1,{metalness:.72, roughness:.28}))
        addBox('exhaust blade 2', winBaseX + winBayW/2 - 14, winY+24, winSill + (winH - winTransom/2) - 125, 28, 6, 250, makeMat('#c2c6ca',1,{metalness:.72, roughness:.28}))
        // diagonal safety guard bars (2 more) for real fan look
        addBox('exhaust guard diag 1', winBaseX + winBayW/2 - 95, winY+24, winSill + (winH - winTransom/2) - 95, 190, 4, 4, makeMat('#2b2b2b',1,{metalness:.3, roughness:.6}))
        addBox('exhaust guard diag 2', winBaseX + winBayW/2 - 95, winY+24, winSill + (winH - winTransom/2) + 88, 190, 4, 4, makeMat('#2b2b2b',1,{metalness:.3, roughness:.6}))
        // small label plate
        addBox('exhaust label 12 inch metal', winBaseX + winBayW/2 - 78, winY+8, winSill + (winH - winTransom) + 18, 156, 6, 22, makeMat('#111111',1,{roughness:.7}))
        // right-top fixed glass
        addBox('north window top pane right fixed', winBaseX + winBayW + 10, winY+10, winSill + (winH - winTransom) + 14, winBayW - 22, 10, winTransom - 22, surface.glass)
        // bottom 2 panes - both sliding (side opening as requested)
        const bottomH = winH - winTransom - 28
        for(let i=0;i<2;i++){
          addBox(`north window bottom pane ${i} sliding`, winBaseX + i*winBayW + 10, winY+10, winSill + 10, winBayW - 22, 10, bottomH - 6, surface.glass)
          const hx = i===0 ? winBaseX + i*winBayW + winBayW - 28 : winBaseX + i*winBayW + 12
          addBox(`window handle ${i}`, hx, winY+16, winSill + bottomH/2 + 10, 6, 8, 42, surface.dark)
        }
        // note: alternative shaft hole (west shaft 61x83.8) kept as optional - not modelled in 3D, see config NOTES
      }
      {
        const stoolMat=makeMat('#8b5e3c',1,{roughness:.72,metalness:.02})
        const stoolX=KITCHEN.width/2
        const stoolY=KITCHEN.length-360
        addCylinder('small stool below north window round seat',stoolX,stoolY,410,172,172,42,stoolMat,1,40)
        addCylinder('small stool center brace below window',stoolX,stoolY,210,28,28,205,stoolMat,1,20)
        ;[
          [stoolX-112,stoolY-82],
          [stoolX+112,stoolY-82],
          [stoolX-112,stoolY+82],
          [stoolX+112,stoolY+82],
        ].forEach(([lx,ly],i)=>addCylinder(`small stool leg ${i+1} below window`,lx,ly,0,15,22,410,stoolMat,1,16))
        addBox('small stool foot rail front',stoolX-126,stoolY-104,168,252,16,18,stoolMat)
        addBox('small stool foot rail back',stoolX-126,stoolY+88,168,252,16,18,stoolMat)

        const potMat=makeMat('#b75f3f',1,{roughness:.78,metalness:.01})
        const soilMat=makeMat('#3b2a1d',1,{roughness:.9})
        const leafMat=makeMat('#2f7d4b',1,{roughness:.68,metalness:0})
        const potX=KITCHEN.width/2+265
        const potY=KITCHEN.length-96
        addCylinder('terracotta pot on north window sill',potX,potY,850,78,56,116,potMat,1,36)
        addCylinder('dark soil in north window pot',potX,potY,954,66,66,12,soilMat,1,32)
        addCylinder('plant stem in north window pot',potX,potY,960,8,10,126,leafMat,1,12)
        addSphere('plant leaf cluster on window 1',potX-36,potY-8,1105,48,leafMat,1,[1.35,.55,.82])
        addSphere('plant leaf cluster on window 2',potX+34,potY+8,1122,46,leafMat,1,[1.25,.62,.9])
        addSphere('plant leaf cluster on window 3',potX,potY-24,1160,42,leafMat,1,[.9,.72,1.35])
        addSphere('plant leaf cluster on window 4',potX+4,potY+24,1084,38,leafMat,1,[1.1,.55,1.2])
      }
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
      // West counter after door - now 600D equal to east (was 400)
      const westLen=usableLen-1220
      const westCounterDepth=600
      if(westLen>0){
        addBox('west counter carcass',0,1220,PLINTH_HEIGHT,westCounterDepth,westLen,900-PLINTH_HEIGHT-COUNTER_THICKNESS,surface.cabinet)
        addBox('west countertop',0,1220,900-COUNTER_THICKNESS,westCounterDepth,westLen,COUNTER_THICKNESS,counterMat)
        addBox('west plinth',0,1220,0,westCounterDepth,westLen,PLINTH_HEIGHT,surface.plinth)
        addBox('west toe shadow',0,1220,PLINTH_HEIGHT-16,westCounterDepth,westLen,16,'#111111')
        moduleSegmentsFromNorth(westModules,1220,usableLen).forEach((m)=>{
          addBox(`west base front ${m.y}`,westCounterDepth-2,m.y+5,PLINTH_HEIGHT+12,18,m.width-10,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,surface.cabinet)
          addBox(`west base right reveal ${m.y}`,westCounterDepth-4,m.y+4,PLINTH_HEIGHT+10,20,3,760,surface.dark)
          if(m.drawers>1){
            for(let dl=1; dl<m.drawers; dl++){
              addBox(`west drawer reveal ${m.y}-${dl}`,westCounterDepth-4,m.y+10,PLINTH_HEIGHT+120+dl*170,22,m.width-20,8,surface.dark)
            }
          }
        })
      }
      // uppers - no gap between lower (1350-1850) and top (1850-2700) - LED strip at 1322
      addBox('east lower upper body',KITCHEN.width-320,0,1350,320,usableLen,500,surface.shutter)
      {
        const rack = west.find(x=>x.id==='sinkUpperDishRack')
        if(rack && westLen>0){
          const before = rack.y - 1220
          const afterStart = rack.y + rack.w
          const afterLen = (1220+westLen) - afterStart
          if(before>0) addBox('west lower upper body before rack',0,1220,1350,320,before,500,surface.shutter)
          if(afterLen>0) addBox('west lower upper body after rack',0,afterStart,1350,320,afterLen,500,surface.shutter)
          addBox('west top upper body after door clear zone',0,1220,1850,450,westLen,850,surface.topCabinet)
        } else {
          if(westLen>0) addBox('west lower upper body after door clear zone',0,1220,1350,320,westLen,500,surface.shutter)
          if(westLen>0) addBox('west top upper body after door clear zone',0,1220,1850,450,westLen,850,surface.topCabinet)
        }
      }
      addBox('east top upper body main',KITCHEN.width-550,0,1850,550,usableLen,850,surface.topCabinet)
      const addUpperFronts=(prefix,wall,depth,startY,len,z,h,mods,frontMat)=>{
        moduleSegmentsFromNorth(mods,startY,startY+len).forEach((m,i)=>{
          const width=m.width
          const faceX=wall==='east'?KITCHEN.width-depth-18:depth
          addBox(`${prefix} upper front ${i}`,faceX,m.y+5,z+10,18,width-10,h-20,frontMat)
          addBox(`${prefix} upper reveal ${i}`,faceX,m.y+width-3,z+8,20,3,h-16,surface.dark)
        })
      }
      addUpperFronts('east lower','east',320,0,usableLen,1350,500,eastModules,surface.middleCabinet)
      addUpperFronts('east top','east',550,0,usableLen,1850,850,eastModules,surface.topCabinet)
      if(westLen>0){
        addUpperFronts('west lower','west',320,1220,westLen,1350,500,westModules,surface.middleCabinet)
        addUpperFronts('west top','west',450,1220,westLen,1850,850,westModules,surface.topCabinet)
      }
      addBox('east 600x1200 patterned tile backsplash',KITCHEN.width-18,0,900,18,usableLen,600,makeLargePatternTileMat(usableLen,600))
      if(westLen>0) addBox('west 600x1200 patterned tile backsplash',0,1220,900,18,westLen,600,makeLargePatternTileMat(westLen,600))
      {
        const winBaseX=(KITCHEN.width-KITCHEN.window.w)/2
        const northTileW=KITCHEN.window.w+100
        addBox('north 600x1200 patterned tile wall below window',winBaseX-50,KITCHEN.length-26,120,northTileW,18,760,makeLargePatternTileMat(northTileW,760))
        addBox('north 600x1200 patterned tile sill strip below window',winBaseX-50,KITCHEN.length-30,860,northTileW,22,70,makeLargePatternTileMat(northTileW,120))
      }
      addBox('east warm LED strip',KITCHEN.width-338,0,1322,24,usableLen,22,surface.led)
      if(westLen>0) addBox('west warm LED strip after door clear zone',westCounterDepth-6,1220,1322,24,westLen,22,surface.led)
      const addPoint=(name,x,y,z,intensity=1.25,distance=120)=>{
        const light=new THREE.PointLight(RENDER_CONFIG.lighting.ledPoint.color,intensity,s(distance),1.8)
        light.name=name
        light.position.set(s(KITCHEN.width/2-x),s(z),s(y-KITCHEN.length/2))
        scene.add(light)
      }
      for(let y=600;y<usableLen;y+=900) addPoint(`east led light ${y}`,KITCHEN.width-610,y,1280,RENDER_CONFIG.lighting.ledPoint.intensity,RENDER_CONFIG.lighting.ledPoint.distanceMm)
      if(westLen>0) for(let y=1550;y<usableLen;y+=900) addPoint(`west led light ${y}`,westCounterDepth+30,y,1280,RENDER_CONFIG.lighting.ledPoint.intensity*.87,RENDER_CONFIG.lighting.ledPoint.distanceMm*.86)
      // appliances with improved models
      activeEast.forEach(it=>{
        if(it.id==='spice') return
        if(it.id==='garage_NE'){
          // East Tall NE 600x600x2700 - washing below, MICROWAVE above (as requested)
          const baseZ=0
          addBox('east tall garage NE body',KITCHEN.width-it.d,it.y,baseZ,it.d,it.w,2700,surface.tallCabinet)
          addBox('east tall front lower tambour',KITCHEN.width-it.d-18,it.y+10,baseZ+24,18,it.w-20,880,surface.tallCabinet)
          addBox('east tall front upper tambour',KITCHEN.width-it.d-18,it.y+10,1350+24,18,it.w-20,1320,surface.tallCabinet)
          // washing machine inside lower bay (visible when front opens)
          addBox('east tall washing box inside',KITCHEN.width-it.d+40,it.y+110,baseZ+110,520,it.w-220,620,'#e8e4de')
          addBox('east tall washing porthole ring',KITCHEN.width-it.d+140,it.y+it.w/2-90,baseZ+380,520,80,8,'#d5d0ca')
          // microwave above washing inside tall upper (clearly visible)
          addBox('east tall microwave black box',KITCHEN.width-it.d+38,it.y+180,1350+90,524,it.w-220,240,surface.blackGlass)
          addBox('east tall microwave glass door',KITCHEN.width-it.d+52,it.y+195,1350+110,12,it.w-250,140,'#0b0b0b')
          addBox('east tall microwave trim',KITCHEN.width-it.d+36,it.y+180,1350+300,14,it.w-210,14,surface.metal)
          addBox('east tall warm internal light upper',KITCHEN.width-it.d+20,it.y+18,2670,20,it.w-36,12,surface.led)
          addBox('east tall warm internal light lower',KITCHEN.width-it.d+20,it.y+18,baseZ+864,20,it.w-36,12,surface.led)
        } else if(it.id==='applianceGarage'){
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
        } else if(it.id==='trashCan'){
          // Trash pull-out Saints frame below sink - cabinet opens then frame pulls out
          const baseZ=it.z ?? 100
          const h=it.h ?? 500
          addBox('east trash saints frame rails',KITCHEN.width-it.d-20,it.y+14,baseZ+24,20,it.w-28,18,surface.metal)
          addBox('east trash saints frame rails 2',KITCHEN.width-it.d-20,it.y+it.w-32,baseZ+24,20,18,18,surface.metal)
          addBox('east trash can body',KITCHEN.width-it.d+18,it.y+44,baseZ+48,it.d-56,it.w-88,h-72,surface.dark)
          addBox('east trash can lid',KITCHEN.width-it.d+22,it.y+48,baseZ+h-24,it.d-64,it.w-96,18,'#3a3a3a')
          addBox('east trash can inner',KITCHEN.width-it.d+30,it.y+56,baseZ+60,it.d-80,it.w-112,18,'#4a4a4a')
          addBox('east trash pull-out handle',KITCHEN.width-it.d-18,it.y+it.w/2-26,baseZ+160,18,52,22,surface.metal)
          // Saints frame on which trash can is placed - visible when cabinet opens
          const frameMat=makeMat('#d5d0ca',1,{roughness:.65,metalness:.15})
          addBox('east saints frame base',KITCHEN.width-it.d+8,it.y+28,baseZ+8,it.d-36,it.w-56,12,frameMat)
          addBox(`east trash saints frame label`,KITCHEN.width-it.d+30,it.y+it.w/2-40,baseZ+200,12,80,4,'#111')
        } else if(it.id==='washing'){
          // washing is inside east tall NE - skip separate box, tall already shows washing + microwave
          return
        } else {
          const itemMat=it.id==='garage_SE'||it.fullHeight ? surface.tallCabinet : it.id==='dishwasher'?surface.metal:it.color
          addBox(`east ${it.id}`,KITCHEN.width-it.d,it.y,it.z??0,it.d,it.w,it.h||880,itemMat)
          if(it.id==='dishwasher'){
            const faceX=KITCHEN.width-626
            addBox(`east visible covered ${it.id} front`,faceX,it.y+8,PLINTH_HEIGHT+12,18,it.w-16,900-PLINTH_HEIGHT-COUNTER_THICKNESS-24,'#b9b6b1')
            addBox(`east ${it.id} shadow reveal`,faceX-2,it.y+8,PLINTH_HEIGHT+8,4,it.w-16,900-PLINTH_HEIGHT-COUNTER_THICKNESS-16,surface.dark)
            addBox('east dishwasher visible control strip',faceX-2,it.y+42,PLINTH_HEIGHT+662,8,it.w-84,42,surface.dark)
            addBox('east dishwasher bottom recessed line',faceX-2,it.y+36,PLINTH_HEIGHT+238,8,it.w-72,10,surface.dark)
            addBox('east dishwasher down-open door panel',faceX-390,it.y+70,PLINTH_HEIGHT+120,360,it.w-140,36,'#b9b6b1')
          }
        }
      })
      activeWest.forEach(it=>{
        if(it.id==='shaft'){
          addBox('west shaft',0,KITCHEN.shaft.y,0,KITCHEN.shaft.w,KITCHEN.shaft.l,KITCHEN.height,it.color)
          addBox('visible matching 600x1200 patterned tile cladding on shaft east wall beside window',KITCHEN.shaft.w+4,KITCHEN.shaft.y+14,0,26,KITCHEN.shaft.l-28,KITCHEN.height,makeLargePatternTileMat(KITCHEN.shaft.l-28,KITCHEN.height))
          addBox('visible matching 600x1200 patterned tile cladding on shaft front return',12,KITCHEN.shaft.y-26,0,KITCHEN.shaft.w+26,26,KITCHEN.height,makeLargePatternTileMat(KITCHEN.shaft.w+26,KITCHEN.height))
          addBox('shaft tile wall front edge trim',KITCHEN.shaft.w+1,KITCHEN.shaft.y+6,0,20,14,KITCHEN.height,surface.dark)
          addBox('shaft tile wall north edge trim',KITCHEN.shaft.w+1,KITCHEN.shaft.y+KITCHEN.shaft.l-20,0,20,14,KITCHEN.height,surface.dark)
          addPotteryWallPlanter('lower turquoise pottery wall planter',KITCHEN.shaft.w+82,KITCHEN.shaft.y+240,1140,.88,{body:'#3d9fb5',blue:'#082f6f',flower:'#d9e8aa',filler:'#cfe5b4'})
          addPotteryWallPlanter('middle rose pottery wall planter',KITCHEN.shaft.w+92,KITCHEN.shaft.y+500,1360,1.02,{body:'#102f76',blue:'#071f58',flower:'#c1121f',filler:'#f0eee2'})
          addPotteryWallPlanter('upper blue floral pottery wall planter',KITCHEN.shaft.w+86,KITCHEN.shaft.y+745,1610,.96,{body:'#f7f3e7',blue:'#0f3f8f',flower:'#eef2df',filler:'#f6f4e8'})
        }
        else if(it.id==='sink'){
          // - crisp stainless sink inset: bowl flush to counter with top rim + water -
          const sinkBowlTop = 900 - 10
          const sinkDepth = 165
          const bowlZ = sinkBowlTop - sinkDepth
          // outer bowl (stainless) + inner light, + rim lip at counter level for contrast
          addBox('west sink bowl stainless',0,it.y+12,bowlZ,376,it.w-16, sinkDepth, makeMat('#d9dde0',1,{metalness:.72, roughness:.2}))
          addBox('west sink bowl inner light',8,it.y+20,bowlZ+6,360,it.w-32, sinkDepth-10, makeMat('#eef1f3',1,{metalness:.12, roughness:.42}))
          // water surface hint
          addBox('west sink water',10,it.y+22,bowlZ+32,356,it.w-36,4, makeMat('#b8e4f5',.58,{metalness:.05, roughness:.08}))
          // counter rim (4mm lip) to crisply frame sink against counter marble
          addBox('west sink counter rim front',0,it.y+10,900-8,380,it.w-12,8,'#1a1a1a')
          addBox('west sink counter rim back',0,it.y+it.w-28,900-8,380,12,8,'#4a443f')
          addBox('west sink counter rim left',0,it.y+12,900-8,8,it.w-16,8,'#4a443f')
          addBox('west sink counter rim right',368,it.y+12,900-8,8,it.w-16,8,'#4a443f')
          // under-sink cabinet interior (light) - visible when front opens
          addBox('west sink cabinet interior light',8,it.y+16,PLINTH_HEIGHT+36,368,it.w-32, 520, makeMat('#fff6ec',1,{roughness:.85}))
          addBox('west sink cabinet interior shelf',20,it.y+24,PLINTH_HEIGHT+240,344,it.w-48,18, makeMat('#d8c2a8',1,{roughness:.5}))
          // drain + overflow subtle
          addBox('west sink drain',168,it.y+it.w/2-16,bowlZ+6,18,48,2, makeMat('#9aa0a6',1,{metalness:.6, roughness:.3}))
          // tall faucet - more chrome, two handles
          const faucetMat=makeMat('#d8dde0',1,{metalness:0.82,roughness:0.18,clearcoat:.35,clearcoatRoughness:.18})
          const faucet=new THREE.Mesh(new THREE.CylinderGeometry(s(9),s(9),s(155),18), faucetMat)
          faucet.name='west sink faucet'
          registerCutaway(faucet,['west'])
          faucet.position.set(s(KITCHEN.width/2-(46)),s(930),s(it.y+34-KITCHEN.length/2))
          faucet.castShadow=true
          scene.add(faucet)
          const spout=new THREE.Mesh(new THREE.TorusGeometry(s(34),s(7),10,20,Math.PI), faucetMat)
          spout.name='west sink faucet spout'
          registerCutaway(spout,['west'])
          spout.position.set(s(KITCHEN.width/2-(46)),s(985),s(it.y+52-KITCHEN.length/2))
          spout.rotation.y=Math.PI/2
          spout.castShadow=true
          scene.add(spout)
          const handleL=new THREE.Mesh(new THREE.CylinderGeometry(s(11),s(11),s(14),16), faucetMat)
          handleL.name='west sink faucet handle L'
          registerCutaway(handleL,['west'])
          handleL.position.set(s(KITCHEN.width/2-(88)),s(928),s(it.y+28-KITCHEN.length/2))
          handleL.rotation.z=Math.PI/2
          scene.add(handleL)
          const handleR=handleL.clone(); handleR.name='west sink faucet handle R'; handleR.position.set(s(KITCHEN.width/2-(4)),s(928),s(it.y+28-KITCHEN.length/2)); registerCutaway(handleR,['west']); scene.add(handleR)
          // sink task light
          addPoint('west sink task glow', 190, it.y+it.w/2, 1280, 1.35, 760)
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
          const baseZ=it.z ?? 1350
          addBox('west purifier cabinet body',0,it.y,baseZ,it.d,it.w,it.h||400,surface.shutter)
          addBox('west purifier cabinet front',it.d-18,it.y+8,baseZ+16,18,it.w-16,(it.h||400)-32,'#d6eaf8')
          addBox('west purifier body inside',38,it.y+76,baseZ+72,it.d-96,it.w-152,230,'#f4fbff')
          addBox('west purifier filter one',82,it.y+135,baseZ+104,44,95,120,surface.glass,.62)
          addBox('west purifier filter two',146,it.y+135,baseZ+104,44,95,120,surface.glass,.62)
          addBox('west purifier service pipe to sink',it.d-26,it.y-4,baseZ+60,18,22,12,surface.metal)
        } else if(it.id==='sinkUpperDishRack'){
          // overhead dish rack - lighter interior so open view is crisp
          const rackZ=it.z ?? 1350
          addBox('west sink upper dish rack interior',6,it.y+10,rackZ+18,308,it.w-20,it.h-36, makeMat('#fff8ee',1,{roughness:.82}))
          addBox('west sink upper dish rack interior light',12,it.y+24,rackZ+180,300,it.w-48,10, makeMat('#ffe8c8',1,{emissive:'#ff9f2f',emissiveIntensity:1.2}))
          addBox('west sink upper dish rack body',0,it.y,rackZ,it.d,it.w,it.h,surface.shutter)
          addBox('west dish rack front glass',it.d-18,it.y+8,rackZ+16,18,it.w-16,it.h-32,surface.glass,.45)
          addBox('west dish rack lower shelf',20,it.y+18,rackZ+220,it.d-40,it.w-36,10,surface.metal)
          addBox('west dish rack upper shelf',20,it.y+18,rackZ+420,it.d-40,it.w-36,10,surface.metal)
          // plates for family 6
          ;[0,1,2,3,4,5].forEach((n)=>{
            const plate=new THREE.Mesh(new THREE.CylinderGeometry(s(42),s(42),s(5),32), makeMat('#f7f2ea',1,{roughness:.42}))
            plate.name=`dish rack plate ${n+1} family6`
            registerCutaway(plate,['west'])
            plate.position.set(s(KITCHEN.width/2-305),s(rackZ+240),s(it.y+80+n*80-KITCHEN.length/2))
            plate.rotation.z=Math.PI/2
            plate.castShadow=true
            scene.add(plate)
            const katori=new THREE.Mesh(new THREE.CylinderGeometry(s(28),s(22),s(22),20), makeMat('#e8e0d0',1,{roughness:.5}))
            katori.name=`dish rack katori ${n+1}`
            registerCutaway(katori,['west'])
            katori.position.set(s(KITCHEN.width/2-285),s(rackZ+460),s(it.y+80+n*80-KITCHEN.length/2))
            katori.castShadow=true
            scene.add(katori)
          })
          // glasses
          ;[0,1,2].forEach((n)=>{
            const glass=new THREE.Mesh(new THREE.CylinderGeometry(s(18),s(16),s(48),16), makeMat('#d6eaf8',.65,{roughness:.15}))
            glass.name=`dish rack glass ${n+1}`
            registerCutaway(glass,['west'])
            glass.position.set(s(KITCHEN.width/2-260),s(rackZ+260),s(it.y+380+n*90-KITCHEN.length/2))
            scene.add(glass)
          })
        }
        else if(it.id==='microwave'){
          addBox(`west ${it.id}`,0,it.y,1040,it.d,it.w,it.h||350,surface.blackGlass)
          addBox('microwave glass door',405,it.y+45,1110,12,it.w-90,190,'#050505')
          addBox('microwave metal trim',398,it.y+20,1030,18,it.w-40,30,surface.metal)
        }
        else if(it.id==='gas'){
          // West-wall three-burner cooktop with chimney hidden inside the upper cabinet.
          addBox('west gas cooktop glass slab',32,it.y+55,900,336,it.w-110,12,surface.blackGlass)
          const burners=[
            {x:125,y:it.y+it.w*.34,r:30},
            {x:268,y:it.y+it.w*.34,r:30},
            {x:196,y:it.y+it.w*.68,r:40},
          ]
          burners.forEach((b,idx)=>{
            const ring=new THREE.Mesh(new THREE.TorusGeometry(s(b.r),s(4),10,32), surface.metal)
            ring.name=`west three burner hob ring ${idx+1}`
            registerCutaway(ring,['west'])
            ring.position.set(s(KITCHEN.width/2-b.x),s(907),s(b.y-KITCHEN.length/2))
            ring.rotation.x=Math.PI/2
            ring.castShadow=true
            scene.add(ring)
            const cap=new THREE.Mesh(new THREE.CylinderGeometry(s(b.r*.42),s(b.r*.42),s(8),28), surface.dark)
            cap.name=`west three burner hob cap ${idx+1}`
            registerCutaway(cap,['west'])
            cap.position.set(s(KITCHEN.width/2-b.x),s(910),s(b.y-KITCHEN.length/2))
            cap.rotation.x=Math.PI/2
            cap.castShadow=true
            scene.add(cap)
            addBox(`west hob grate horizontal ${idx+1}`,b.x-b.r-18,b.y-3,914,b.r*2+36,6,10,surface.dark)
            addBox(`west hob grate vertical ${idx+1}`,b.x-3,b.y-b.r-18,914,6,b.r*2+36,10,surface.dark)
          })
          ;[it.y+it.w*.2,it.y+it.w*.5,it.y+it.w*.8].forEach((ky,i)=>{
            const knob=new THREE.Mesh(new THREE.CylinderGeometry(s(10),s(10),s(16),20), surface.metal)
            knob.name=`west hob front knob ${i+1}`
            registerCutaway(knob,['west'])
            knob.position.set(s(KITCHEN.width/2-360),s(916),s(ky-KITCHEN.length/2))
            knob.rotation.z=Math.PI/2
            scene.add(knob)
          })
          addBox('west hidden chimney vent slot',322,it.y+80,1326,24,540,18,surface.dark)
          addBox('west hidden chimney warm task light',326,it.y+170,1316,20,300,10,surface.led)
          addPoint('west cooktop task glow',260,it.y+350,1280,1.7,900)
        }
        else if(it.id==='foodprocessor') addBox(`west ${it.id}`,0,it.y,900,it.d,it.w,it.h||300,surface.metal)
        else if(it.id==='westGarage') return
        else addBox(`west ${it.id}`,0,it.y,0,it.d,it.w,it.h||400,it.color)
      })
      const lights=RENDER_CONFIG.lighting
      scene.add(new THREE.AmbientLight(lights.ambient.color,lights.ambient.intensity))
      scene.add(new THREE.HemisphereLight(lights.hemisphere.skyColor,lights.hemisphere.groundColor,lights.hemisphere.intensity))
      const light=new THREE.DirectionalLight(lights.key.color,lights.key.intensity)
      light.position.set(...lights.key.position)
      light.castShadow=true
      light.shadow.mapSize.set(lights.key.shadowMapSize,lights.key.shadowMapSize)
      light.shadow.bias=lights.key.shadowBias
      light.shadow.camera.near=lights.key.shadowCamera.near
      light.shadow.camera.far=lights.key.shadowCamera.far
      light.shadow.camera.left=lights.key.shadowCamera.left
      light.shadow.camera.right=lights.key.shadowCamera.right
      light.shadow.camera.top=lights.key.shadowCamera.top
      light.shadow.camera.bottom=lights.key.shadowCamera.bottom
      scene.add(light)
      const fill=new THREE.DirectionalLight(lights.fill.color,lights.fill.intensity)
      fill.position.set(...lights.fill.position)
      scene.add(fill)
      const windowGlow=new THREE.PointLight(lights.windowGlow.color,lights.windowGlow.intensity,s(lights.windowGlow.distanceMm),lights.windowGlow.decay)
      windowGlow.name='north window daylight glow'
      windowGlow.position.set(0,s(lights.windowGlow.positionMm[1]),s(KITCHEN.length/2-80))
      scene.add(windowGlow)
      const ceilingGlow=new THREE.PointLight(lights.ceilingGlow.color,lights.ceilingGlow.intensity,s(lights.ceilingGlow.distanceMm),lights.ceilingGlow.decay)
      ceilingGlow.name='soft ceiling bounce'
      ceilingGlow.position.set(...lights.ceilingGlow.positionMm.map(v=>s(v)))
      scene.add(ceilingGlow)
      const gridConfig=RENDER_CONFIG.grid
      const grid=new THREE.GridHelper(s(Math.max(KITCHEN.length,KITCHEN.width)),gridConfig.divisions,gridConfig.colorCenter,gridConfig.colorGrid)
      grid.position.y=.1
      grid.material.transparent=true
      grid.material.opacity=gridConfig.opacity
      scene.add(grid)
      camera.position.set(...RENDER_CONFIG.camera.initialPosition)
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
      // --- Click to open cabinets ---
      const raycaster=new THREE.Raycaster()
      const mouse=new THREE.Vector2()
      let hovered=null
      const getOffsetForCabinet=(mesh)=>{
        const n=mesh.name
        // east cabinets open toward west (-x), west cabinets toward east (+x), upper fronts slide outward
        if(n.startsWith('west')) return new THREE.Vector3(s(38),0,0)
        if(n.startsWith('east')) return new THREE.Vector3(s(-38),0,0)
        return new THREE.Vector3(s(38),0,0)
      }
      const getCursorForMode=(mode, isHover)=>{
        if(mode==='measure') return 'crosshair'
        if(mode==='transparent') return isHover?'cell':'grab'
        if(mode==='dimension') return 'pointer'
        return isHover?'pointer':'grab' // cabinet
      }
      const setHover=(mesh, isHover)=>{
        if(!mesh) return
        const mode=interactionModeRef.current
        if(isHover){
          mesh.material.emissive = new THREE.Color(mode==='transparent'?'#7c3aed':mode==='measure'?'#d97706':'#c05a2b')
          mesh.material.emissiveIntensity = 0.22
          renderer.domElement.style.cursor=getCursorForMode(mode,true)
        } else {
          mesh.material.emissive = new THREE.Color('#000000')
          mesh.material.emissiveIntensity = 0
          renderer.domElement.style.cursor=getCursorForMode(mode,false)
        }
      }
      const getItemIdFromMeshName=(name)=>{
        const n=(name||'').toLowerCase()
        for(const it of [...east,...west]) if(n.includes(it.id.toLowerCase())) return it.id
        if(n.includes('west appliance garage')||n.includes('west garage')||n.includes('westgarage')) return 'westGarage'
        if(n.includes('trash')) return 'trashCan'
        if(n.includes('sink')&&n.toLowerCase().includes('east')) return 'sink'
        if(n.includes('east tall')||n.includes('garage_ne')) return 'garage_NE'
        if(n.includes('dish rack')) return 'dishRack'
        return null
      }
      const clampMeasurePoint=(pt)=>({
        x:Math.max(0,Math.min(KITCHEN.width,pt.x)),
        y:Math.max(0,Math.min(KITCHEN.length,pt.y))
      })
      const collectSceneMeshes=()=>{
        const meshes=[]
        scene.traverse(o=>{
          if(o.isMesh && o.visible && !o.userData?.ignoreMeasureRaycast) meshes.push(o)
        })
        return meshes
      }
      const worldPointToPlan=(point)=>clampMeasurePoint({
        x:KITCHEN.width/2 - point.x*10,
        y:KITCHEN.length/2 + point.z*10
      })
      let measureDragActive=false
      let measureDragStart=null
      let measurePreviewPt=null
      const getMeasurePointAtEvent=(e)=>{
        const rect=renderer.domElement.getBoundingClientRect()
        mouse.x=((e.clientX-rect.left)/rect.width)*2-1
        mouse.y=-((e.clientY-rect.top)/rect.height)*2+1
        raycaster.setFromCamera(mouse,camera)
        const hits=raycaster.intersectObjects(collectSceneMeshes(),false)
        if(hits.length){
          const hit=hits[0]
          if(hit.point) return worldPointToPlan(hit.point)
        }
        // fallback: intersect floor plane y=0
        const plane=new THREE.Plane(new THREE.Vector3(0,1,0), 0)
        const inter=new THREE.Vector3()
        if(raycaster.ray.intersectPlane(plane, inter)) return worldPointToPlan(inter)
        return null
      }
      const onPointerMove=(e)=>{
        const mode=interactionModeRef.current
        // drag preview for measure
        if(mode==='measure' && measureDragActive && measureDragStart){
          const pt=getMeasurePointAtEvent(e)
          if(pt){
            measurePreviewPt=pt
            setMeasurePoints([measureDragStart, pt])
          }
          return
        }
        const rect=renderer.domElement.getBoundingClientRect()
        mouse.x=((e.clientX-rect.left)/rect.width)*2-1
        mouse.y=-((e.clientY-rect.top)/rect.height)*2+1
        raycaster.setFromCamera(mouse,camera)
        let targets=[]
        if(mode==='cabinet') targets=clickableCabinets
        else targets=collectSceneMeshes()
        const hits=raycaster.intersectObjects(targets,false)
        const hit=hits[0]?.object
        if(hit!==hovered){
          if(hovered) setHover(hovered,false)
          hovered=hit||null
          if(hovered) setHover(hovered,true)
        }
        if(!hovered) renderer.domElement.style.cursor=getCursorForMode(mode,false)
      }
      const onPointerDown=(e)=>{
        if(e.button!==0) return
        const mode=interactionModeRef.current
        if(mode!=='measure') return
        const pt=getMeasurePointAtEvent(e)
        if(!pt) return
        e.preventDefault(); e.stopPropagation()
        // if already 2 points, start new measurement
        const cur=measurePointsRef.current
        if(cur.length>=2){
          measureDragStart=pt
          measureDragActive=true
          measurePreviewPt=pt
          setMeasurePoints([pt])
        } else {
          measureDragStart=pt
          measureDragActive=true
          measurePreviewPt=pt
          // if 0 points, start new; if 1 point, keep start and will drag to second
          if(cur.length===0) setMeasurePoints([pt])
          else {
            // cur has 1 point, drag from that point
            measureDragStart=cur[0]
            setMeasurePoints([cur[0], pt])
          }
        }
        controls.enabled=false
        renderer.domElement.setPointerCapture?.(e.pointerId)
      }
      const onPointerUp=(e)=>{
        if(e.button!==0) return
        if(!measureDragActive) return
        measureDragActive=false
        controls.enabled=true
        try{ renderer.domElement.releasePointerCapture?.(e.pointerId)}catch{}
        // finalize: if we have 1 point and preview, keep 2 points
        // if we dragged zero distance, treat as click
        if(measurePreviewPt && measureDragStart){
          const dx=measurePreviewPt.x-measureDragStart.x
          const dy=measurePreviewPt.y-measureDragStart.y
          if(Math.hypot(dx,dy)<8){
            // click without drag: set single point (click logic will handle second click)
            setMeasurePoints(prev=> prev.length>=2 ? [measureDragStart] : prev)
          }
        }
        measurePreviewPt=null
      }
      const onClick=(e)=>{
        if(e.button!==undefined && e.button!==0) return
        // if measure drag just finished, ignore click
        if(measureDragActive) return
        const mode=interactionModeRef.current
        const rect=renderer.domElement.getBoundingClientRect()
        mouse.x=((e.clientX-rect.left)/rect.width)*2-1
        mouse.y=-((e.clientY-rect.top)/rect.height)*2+1
        raycaster.setFromCamera(mouse,camera)
        if(mode==='transparent'){
          const hits=raycaster.intersectObjects(collectSceneMeshes(),false)
          const hit=hits[0]?.object; if(!hit) return
          e.stopPropagation()
          hit.material.transparent=true; hit.material.opacity= hit.material.opacity===0.25 ? 1 : 0.25; hit.material.needsUpdate=true
          const id=getItemIdFromMeshName(hit.name)||getItemIdFromMeshName(hit.userData?.openKey)
          if(id) setSelectedId(id)
          return
        }
        if(mode==='dimension'){
          const hits=raycaster.intersectObjects(collectSceneMeshes(),false)
          if(!hits.length){ setSelectedId(null); return }
          const hit=hits[0].object
          const id=getItemIdFromMeshName(hit.name)||getItemIdFromMeshName(hit.userData?.openKey)
          if(id) setSelectedId(id); else setSelectedId(null)
          return
        }
        if(mode==='measure'){
          // click fallback for measure (when not dragging)
          // if drag already handled, this is a plain click to set point
          const pt=getMeasurePointAtEvent(e)
          if(!pt) return
          const cur=measurePointsRef.current
          if(cur.length===0) setMeasurePoints([pt])
          else if(cur.length===1){
            // second click without drag: set second point
            const dx=pt.x-cur[0].x, dy=pt.y-cur[0].y
            if(Math.hypot(dx,dy)<2) return
            setMeasurePoints([cur[0], pt])
          } else {
            setMeasurePoints([pt])
          }
          return
        }
        // cabinet mode: animate open
        const hits=raycaster.intersectObjects(clickableCabinets,false)
        const hit=hits[0]?.object
        if(!hit) return
        e.stopPropagation()
        controls.enabled=false
        const wasOpened=hit.userData.opened
        const targetPos=wasOpened? hit.userData.originalPosition.clone() : hit.userData.originalPosition.clone().add(getOffsetForCabinet(hit))
        const startPos=hit.position.clone()
        const startTime=performance.now()
        const dur=380
        const startOpacity=hit.material.opacity ?? 1
        const targetOpacity=wasOpened?1:0.18
        hit.userData.opened=!wasOpened
        if(!wasOpened){ hit.material.transparent=true }
        const animateOpen=(now)=>{
          const t=Math.min(1,(now-startTime)/dur)
          const ease=t<0.5? 2*t*t : -1+(4-2*t)*t
          hit.position.lerpVectors(startPos, targetPos, ease)
          hit.material.opacity = startOpacity + (targetOpacity-startOpacity)*ease
          if(t<1) requestAnimationFrame(animateOpen)
          else {
            hit.material.transparent = targetOpacity<1
            hit.material.needsUpdate=true
            controls.enabled=true
            const label=hit.name.replace('west ','').replace('east ','')
            window.dispatchEvent(new CustomEvent('cabinet-toggle',{detail:{name:label, opened:hit.userData.opened}}))
          }
        }
        requestAnimationFrame(animateOpen)
      }
      renderer.domElement.addEventListener('pointermove', onPointerMove)
      renderer.domElement.addEventListener('pointerdown', onPointerDown)
      renderer.domElement.addEventListener('pointerup', onPointerUp)
      renderer.domElement.addEventListener('click', onClick)
      const resize=()=>{
        const width=mount.clientWidth||1000
        const height=Math.max(620,Math.min(860,Math.round(width*.62)))
        renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
        renderer.setSize(width,height,false)
        camera.aspect=width/height
        camera.updateProjectionMatrix()
      }
      const observer=new ResizeObserver(resize)
      observer.observe(mount)
      resize()
      const updateCursor=()=>{ renderer.domElement.style.cursor=getCursorForMode(interactionModeRef.current,false) }
      const gl=renderer.getContext()
      const debugInfo=gl.getExtension('WEBGL_debug_renderer_info')
      const gpuInfo={
        webglVersion:gl.constructor?.name||'WebGLRenderingContext',
        vendor:debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer:debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        maxAnisotropy:maxTextureAnisotropy,
        toneMapping:RENDER_CONFIG.renderer.toneMapping,
        outputColorSpace:RENDER_CONFIG.renderer.outputColorSpace,
        shadowMapType:RENDER_CONFIG.renderer.shadowMapType,
        pixelRatio:renderer.getPixelRatio()
      }
      threeViewRef.current={renderer,scene,camera,controls,updateCutawayVisibility,updateCursor,clickableCabinets,gpuInfo}
      updateCutawayVisibility(); updateCursor()
      let frameId=0
      const updateMeasureAndDimOverlays=()=>{
        // 3D measurement line
        const pts=measurePointsRef.current||[]
        if(pts.length===2){
          const p0=pts[0], p1=pts[1]
          const toV=(pt)=> new THREE.Vector3(s(KITCHEN.width/2 - pt.x), s(28), s(pt.y - KITCHEN.length/2))
          const v0=toV(p0), v1=toV(p1)
          const pos=[v0.x,v0.y,v0.z, v1.x,v1.y,v1.z]
          measureLineGeom.setAttribute('position', new THREE.Float32BufferAttribute(pos,3))
          measureLineGeom.computeBoundingSphere()
          measureLine.computeLineDistances()
          measureLine.visible=true
          epMesh1.position.copy(v0); epMesh1.visible=true
          epMesh2.position.copy(v1); epMesh2.visible=true
          measureGroup.visible=true
          // label at midpoint projected
          const mid=new THREE.Vector3().addVectors(v0,v1).multiplyScalar(0.5)
          mid.project(camera)
          if(mid.z<1 && mid.z>-1){
            const x=(mid.x*.5+.5)*mount.clientWidth
            const y=(-mid.y*.5+.5)*mount.clientHeight
            const dist=Math.hypot(p1.x-p0.x, p1.y-p0.y)
            const unit=unitRef.current
            const fmt=(v)=> unit==='mm'? `${Math.round(v)} mm` : `${(v/25.4).toFixed(1)}"`
            measureLabel.textContent=`${fmt(dist)}`
            measureLabel.style.left=x+'px'; measureLabel.style.top=y+'px'; measureLabel.style.display='block'
          } else measureLabel.style.display='none'
        } else if(pts.length===1 && measureDragActive && measurePreviewPt){
          const p0=pts[0], p1=measurePreviewPt
          const toV=(pt)=> new THREE.Vector3(s(KITCHEN.width/2 - pt.x), s(28), s(pt.y - KITCHEN.length/2))
          const v0=toV(p0), v1=toV(p1)
          measureLineGeom.setAttribute('position', new THREE.Float32BufferAttribute([v0.x,v0.y,v0.z, v1.x,v1.y,v1.z],3))
          measureLineGeom.computeBoundingSphere()
          measureLine.computeLineDistances()
          measureLine.visible=true
          epMesh1.position.copy(v0); epMesh1.visible=true
          epMesh2.position.copy(v1); epMesh2.visible=true
          measureGroup.visible=true
          const mid=new THREE.Vector3().addVectors(v0,v1).multiplyScalar(0.5)
          mid.project(camera)
          if(mid.z<1){
            const x=(mid.x*.5+.5)*mount.clientWidth
            const y=(-mid.y*.5+.5)*mount.clientHeight
            const dist=Math.hypot(p1.x-p0.x, p1.y-p0.y)
            const unit=unitRef.current
            const fmt=(v)=> unit==='mm'? `${Math.round(v)} mm` : `${(v/25.4).toFixed(1)}"`
            measureLabel.textContent=`${fmt(dist)} (dragging)`
            measureLabel.style.left=x+'px'; measureLabel.style.top=y+'px'; measureLabel.style.display='block'
          } else measureLabel.style.display='none'
        } else {
          measureLine.visible=false; epMesh1.visible=false; epMesh2.visible=false; measureLabel.style.display='none'
          if(pts.length===1){
            const p0=pts[0]
            const v0=new THREE.Vector3(s(KITCHEN.width/2 - p0.x), s(28), s(p0.y - KITCHEN.length/2))
            epMesh1.position.copy(v0); epMesh1.visible=true
            measureGroup.visible=true
          } else if(pts.length===0) measureGroup.visible=true
        }
        // dimension label near selected item
        const sel=selectedItemRef.current
        if(sel){
          const cx=s(KITCHEN.width/2 - (sel.x + sel.d/2))
          const cz=s(sel.y + sel.w/2 - KITCHEN.length/2)
          const cy=s((sel.z??0) + (sel.h||900) + 90)
          const pos=new THREE.Vector3(cx, cy, cz)
          pos.project(camera)
          if(pos.z<1 && pos.z>-1){
            const x=(pos.x*.5+.5)*mount.clientWidth
            const y=(-pos.y*.5+.5)*mount.clientHeight
            if(x>=0 && x<=mount.clientWidth && y>=0 && y<=mount.clientHeight){
              const unit=unitRef.current
              const fmt=(v)=> unit==='mm'? `${Math.round(v)} mm` : `${(v/25.4).toFixed(1)}"`
              dimLabel.textContent=`${sel.id}: ${fmt(sel.w)} x ${fmt(sel.d)} x ${fmt(sel.h||900)}`
              dimLabel.style.left=x+'px'; dimLabel.style.top=y+'px'; dimLabel.style.display='block'
            } else dimLabel.style.display='none'
          } else dimLabel.style.display='none'
        } else dimLabel.style.display='none'
      }
      const animate=()=>{
        controls.update()
        updateCutawayVisibility()
        updateMeasureAndDimOverlays()
        renderer.render(scene,camera)
        frameId=requestAnimationFrame(animate)
      }
      animate()
      return ()=>{cancelAnimationFrame(frameId); observer.disconnect(); controls.dispose(); envTexture.dispose(); pmremGenerator.dispose(); renderer.domElement.removeEventListener('pointermove', onPointerMove); renderer.domElement.removeEventListener('pointerdown', onPointerDown); renderer.domElement.removeEventListener('pointerup', onPointerUp); renderer.domElement.removeEventListener('click', onClick); try{mount.removeChild(overlay)}catch{}; renderer.dispose(); mount.removeChild(renderer.domElement); if(threeViewRef.current?.renderer===renderer)threeViewRef.current=null}
    },[east,west,materials,eastModules,westModules])
    const setPreset=(preset)=>{
      const cam=threeViewRef.current?.camera
      const ctrl=threeViewRef.current?.controls
      if(!cam||!ctrl) return
      const p=RENDER_CONFIG.camera.presets[preset]
      if(!p) return
      cam.position.set(p.pos[0],p.pos[1],p.pos[2])
      ctrl.target.set(p.target[0],p.target[1],p.target[2])
      ctrl.update()
    }
    const [toast,setToast]=useState(null)
    useEffect(()=>{
      const h=(e)=>{ setToast(`${e.detail.opened?'Opened':'Closed'} ${e.detail.name}`); setTimeout(()=>setToast(null),1800)}
      window.addEventListener('cabinet-toggle',h)
      return ()=>window.removeEventListener('cabinet-toggle',h)
    },[])
    return <div style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:10,flexWrap:'wrap'}}><h3 style={{margin:0}}>3D Render - new configuration</h3><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      <button onClick={()=>setPreset('top')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Top</button>
      <button onClick={()=>setPreset('eastWall')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>East wall</button>
      <button onClick={()=>setPreset('westWall')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>West wall</button>
      <button onClick={()=>setPreset('north')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>North view</button>
      <button onClick={()=>setPreset('south')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>South view</button>
      <button onClick={()=>setPreset('walkthrough')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:800}}>Walkthrough</button>
      <button onClick={()=>setPreset('sink')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #0ea5e9',borderRadius:8,fontWeight:800,color:'#0c4a6e'}}>Sink clear</button>
      <button onClick={()=>setPreset('exhaust')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #0ea5e9',borderRadius:8,fontWeight:800,color:'#0c4a6e'}}>Exhaust 12"</button>
      <button onClick={export3DScreenshot} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <button onClick={()=>{
        const view3d=threeViewRef.current; if(!view3d) return;
        // high-res capture - 2x for crisp text on sink/fan/cabinet insides (#002)
        const ren=view3d.renderer, cam=view3d.camera
        const prevSize=new THREE.Vector2(); ren.getSize(prevSize)
        const hiW=Math.round(prevSize.x*2), hiH=Math.round(prevSize.y*2)
        ren.setSize(hiW, hiH, false)
        cam.aspect=hiW/hiH; cam.updateProjectionMatrix()
        view3d.renderer.render(view3d.scene, view3d.camera);
        const dataUrl=view3d.renderer.domElement.toDataURL('image/png')
        // restore
        ren.setSize(prevSize.x, prevSize.y, false)
        cam.aspect=prevSize.x/prevSize.y; cam.updateProjectionMatrix()
        view3d.renderer.render(view3d.scene, view3d.camera);
        const nextNum=diagnostics.length? Math.max(...diagnostics.map(d=>d.number))+1 : 1;
        const pad=n=>String(n).padStart(3,'0');
        const tgt=view3d.controls.target;
        const viewSettings={
          cameraPosition:{x:cam.position.x,y:cam.position.y,z:cam.position.z},
          cameraTarget:{x:tgt.x,y:tgt.y,z:tgt.z},
          cameraFov:cam.fov, cameraAspect:cam.aspect, cameraNear:cam.near, cameraFar:cam.far,
          viewport:{innerWidth:window.innerWidth, innerHeight:window.innerHeight, devicePixelRatio:window.devicePixelRatio||1, canvasWidth:ren.domElement.width, canvasHeight:ren.domElement.height, canvasStyleWidth:ren.domElement.clientWidth, canvasStyleHeight:ren.domElement.clientHeight},
          rendererSize:{width:ren.domElement.width, height:ren.domElement.height, hiRes:true},
          hide3DObstructions, east: [...east], west: [...west], validation: validationRows, timestamp:new Date().toISOString(),
          openedCabinets: (view3d.clickableCabinets||[]).filter(m=>m.userData.opened).map(m=>m.name)
        };
        const entry={number:nextNum, id:`diagnostic-${pad(nextNum)}`, timestamp:viewSettings.timestamp, imageDataUrl:dataUrl, viewSettings, note:''};
        const next=[...diagnostics, entry]; localStorage.setItem('kitchen-diagnostics', JSON.stringify(next)); setDiagnostics(next);
        // download to Diagnostic folder (Downloads/diagnostic-###.png + .json)
        const a=document.createElement('a'); a.href=dataUrl; a.download=`diagnostic-${pad(nextNum)}.png`; a.click();
        setTimeout(()=>{
          const b=document.createElement('a'); b.href=URL.createObjectURL(new Blob([JSON.stringify(entry,null,2)],{type:'application/json'})); b.download=`diagnostic-${pad(nextNum)}.json`; b.click();
        }, 400);
      }} style={{padding:'8px 12px',background:'#c05a2b',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>Diagnostic Screenshot</button>
      <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 10px',background:hide3DObstructions?'#e6f4f1':'#fff',border:'1px solid #2f6f6d',borderRadius:8,fontWeight:800,fontSize:13}}>
        <input type="checkbox" checked={hide3DObstructions} onChange={e=>setHide3DObstructions(e.target.checked)}/>
        Hide blocking walls/ceiling
      </label>
    </div></div><div style={{position:'relative'}}>
      <div ref={mountRef} style={{width:'100%',minHeight:520,border:'1px solid #ddd4c8',background:'#f7f3ed',cursor:'grab'}}/>
      {showHeightGuides && <div style={{position:'absolute',left:18,top:18,bottom:18,width:142,pointerEvents:'none',display:'flex',flexDirection:'column',justifyContent:'stretch',filter:'drop-shadow(0 0 8px rgba(79,70,229,.35))'}}>
        {HEIGHT_GUIDES.map(g=>(
          <div key={g.id} style={{height:`${((g.to-g.from)/KITCHEN.height)*100}%`,minHeight:28,borderLeft:'5px solid #5b5bf7',display:'flex',alignItems:'center',paddingLeft:12,color:'#fff',textShadow:'0 1px 4px #312e81',fontWeight:900,fontSize:18,lineHeight:1.05}}>
            <span>{Math.round((g.to-g.from)/10)} cm<br/><span style={{fontSize:10,color:'#e0e7ff',textShadow:'0 1px 3px #312e81'}}>{g.label}</span></span>
          </div>
        ))}
      </div>}
    </div>
      {toast && <div style={{position:'absolute',left:'50%',top:66,transform:'translateX(-50%)',background:'#111',color:'#fff',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:12,boxShadow:'0 6px 18px rgba(0,0,0,.18)',zIndex:2}}>{toast}</div>}
      <div style={{fontSize:13,color:'#61584f',marginTop:10}}><b>Click a cabinet</b> in 3D to open/close - front slides and fades to show inside (garage, dish rack, upper cabinets, base cabinets). Hover glows orange. Works in cutaway or normal.</div>
      <div style={{fontSize:13,color:'#61584f',marginTop:4}}>Drag to rotate, scroll to zoom. Presets move camera. Check "Hide blocking walls/ceiling" to use live cutaway mode.</div>
      {diagnostics.length>0 && <div style={{marginTop:14,border:'1px solid #ddd4c8',borderRadius:10,background:'#fbfaf8',padding:12}}>
        <div style={{fontSize:11,color:'#61584f',marginBottom:8,background:'#fff',border:'1px solid #ddd4c8',borderRadius:6,padding:'6px 8px'}}>Agnostic PNG + formation JSON - saved as <b>diagnostic-###.png/.json</b> to your Downloads. Also copy them to <b>C:\source\Github\kitchen\diagnostic\</b> (or <b>react-configurator/diagnostic/</b>) where code is - I have full rights to read that folder to see unit + formation.</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}><div style={{fontWeight:800,fontSize:13}}>Diagnostic Folder - {diagnostics.length} saved (numbered) - also in <span style={{fontFamily:'IBM Plex Mono, monospace',fontSize:10}}>diagnostic/</span> where code is</div><div style={{display:'flex',gap:6}}><button onClick={()=>{
          const blob=new Blob([JSON.stringify(diagnostics,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='diagnostic-folder.json'; a.click();
        }} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700,fontSize:11}}>Export All JSON</button><button onClick={()=>{
          if(!confirm('Clear all diagnostics?'))return; localStorage.removeItem('kitchen-diagnostics'); setDiagnostics([]);
        }} style={{padding:'6px 10px',background:'#fee2e2',border:'1px solid #fecaca',borderRadius:8,fontWeight:700,fontSize:11}}>Clear All</button></div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:10,marginTop:10}}>
          {diagnostics.map(d=>(
            <div key={d.id} style={{background:'#fff',border:'1px solid #ddd4c8',borderRadius:8,overflow:'hidden'}}>
              <div style={{position:'relative'}}><img src={d.imageDataUrl} alt={d.id} style={{width:'100%',height:140,objectFit:'cover',display:'block'}}/><div style={{position:'absolute',top:6,left:6,background:'#111',color:'#fff',padding:'3px 7px',borderRadius:6,fontSize:11,fontWeight:800}}>#{String(d.number).padStart(3,'0')}</div></div>
              <div style={{padding:8}}>
                <div style={{fontSize:11,color:'#61584f',fontFamily:'IBM Plex Mono, monospace'}}>{new Date(d.timestamp).toLocaleString()}</div>
                <div style={{fontSize:11,color:'#1a1a18',marginTop:4,lineHeight:1.4}}>Cam pos ({d.viewSettings.cameraPosition.x.toFixed(1)}, {d.viewSettings.cameraPosition.y.toFixed(1)}, {d.viewSettings.cameraPosition.z.toFixed(1)}) to target ({d.viewSettings.cameraTarget.x.toFixed(1)}, {d.viewSettings.cameraTarget.y.toFixed(1)}, {d.viewSettings.cameraTarget.z.toFixed(1)}) - FOV {d.viewSettings.cameraFov?.toFixed(0)} - Viewport {d.viewSettings.viewport.canvasStyleWidth}x{d.viewSettings.viewport.canvasStyleHeight} @ DPR {d.viewSettings.viewport.devicePixelRatio.toFixed(1)} - HideWalls:{d.viewSettings.hide3DObstructions?'yes':'no'}</div>
                <div style={{fontSize:11,color:'#1a1a18',marginTop:4}}>Opened: {(d.viewSettings.openedCabinets||[]).join(', ')||'none'}</div>
                <textarea value={d.note} onChange={e=>{ const next=diagnostics.map(x=>x.id===d.id?{...x,note:e.target.value}:x); localStorage.setItem('kitchen-diagnostics', JSON.stringify(next)); setDiagnostics(next);}} placeholder="Describe what is wrong here... (unit, issue)" style={{width:'100%',marginTop:6,padding:'6px 8px',border:'1px solid #ddd4c8',borderRadius:6,fontSize:11,minHeight:44,resize:'vertical',fontFamily:'IBM Plex Sans, sans-serif'}}/>
                <div style={{display:'flex',gap:6,marginTop:6}}><button onClick={()=>{
                  const cam=threeViewRef.current?.camera, ctrl=threeViewRef.current?.controls; if(!cam||!ctrl) return;
                  cam.position.set(d.viewSettings.cameraPosition.x,d.viewSettings.cameraPosition.y,d.viewSettings.cameraPosition.z);
                  ctrl.target.set(d.viewSettings.cameraTarget.x,d.viewSettings.cameraTarget.y,d.viewSettings.cameraTarget.z);
                  cam.fov=d.viewSettings.cameraFov; cam.updateProjectionMatrix();
                  setHide3DObstructions(!!d.viewSettings.hide3DObstructions); ctrl.update();
                }} style={{flex:1,padding:'6px 8px',background:'#111',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:11}}>Restore View</button><button onClick={()=>{
                  const a=document.createElement('a'); a.href=d.imageDataUrl; a.download=`${d.id}.png`; a.click();
                  setTimeout(()=>{ const b=document.createElement('a'); b.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'})); b.download=`${d.id}.json`; b.click(); },250);
                }} style={{padding:'6px 8px',background:'#fff',border:'1px solid #111',borderRadius:6,fontWeight:700,fontSize:11}}>Download</button><button onClick={()=>{
                  const next=diagnostics.filter(x=>x.id!==d.id); localStorage.setItem('kitchen-diagnostics', JSON.stringify(next)); setDiagnostics(next);
                }} style={{padding:'6px 8px',background:'#fee2e2',border:'1px solid #fecaca',borderRadius:6,fontWeight:700,fontSize:11}}>Delete</button></div>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:'#61584f',marginTop:8}}>Refer me by number: <b>#{String(diagnostics[diagnostics.length-1].number).padStart(3,'0')}</b> - I will open its image + view settings to see the unit.</div>
      </div>}
      </div>
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
    const itemName={applianceGarage:'Appliance garage',gas:'Gas cooktop',dishwasher:'Dishwasher',washing:'Washing',microwave:'Microwave',foodprocessor:'Processor',waterpurifier:'Purifier cabinet',sink:'Sink',shaft:'Shaft',westGarage:'Food processor garage',garage_NE:'Tall cabinet'}
    const modules=isEast?eastModules:westModules
    const runStart=isEast?0:KITCHEN.westGap.to
    const topUpperY=yOf(2700)
    const topUpperH=yOf(1850)-topUpperY
    const lowerUpperY=yOf(1850)
    const lowerUpperH=yOf(1350)-lowerUpperY
    const backsplashY=yOf(1350)
    const backsplashH=yOf(900)-backsplashY
    const baseY=yOf(880)
    const baseH=yOf(PLINTH_HEIGHT)-baseY
    const plinthY=yOf(PLINTH_HEIGHT)
    const counterY=yOf(900)
    const guideText=(g)=>`${Math.round((g.to-g.from)/10)} cm`
    const heightGuideOverlay=()=>{
      if(!showHeightGuides) return null
      const guideX=cabinetRun.x+Math.min(Math.max(cabinetRun.w*.18,72),170)
      const labelX=guideX+34
      return (
        <g pointerEvents="none">
          {[0,PLINTH_HEIGHT,900,1350,1850,KITCHEN.height].map(z=>(
            <line key={`level-${z}`} x1={cabinetRun.x} y1={yOf(z)} x2={cabinetRun.x+cabinetRun.w} y2={yOf(z)} stroke="#4f46e5" strokeWidth="1.4" strokeDasharray="9 8" opacity="0.45"/>
          ))}
          <line x1={guideX} y1={yOf(0)} x2={guideX} y2={yOf(KITCHEN.height)} stroke="#c7d2fe" strokeWidth="10" opacity="0.34" filter={`url(#${key}HeightGlow)`}/>
          {HEIGHT_GUIDES.map(g=>{
            const yTop=yOf(g.to)
            const yBottom=yOf(g.from)
            const mid=(yTop+yBottom)/2
            return (
              <g key={g.id}>
                <line x1={guideX} y1={yTop+4} x2={guideX} y2={yBottom-4} stroke="#5b5bf7" strokeWidth="5" strokeLinecap="round" filter={`url(#${key}HeightGlow)`}/>
                <circle cx={guideX} cy={yTop+4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
                <circle cx={guideX} cy={yBottom-4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
                <text x={labelX} y={mid-5} fontSize="18" fontWeight="900" fill="#ffffff" stroke="#312e81" strokeWidth="4" paintOrder="stroke">{guideText(g)}</text>
                <text x={labelX} y={mid+15} fontSize="10" fontWeight="900" fill="#312e81">{g.label}</text>
              </g>
            )
          })}
          <text x={guideX} y={yOf(900)-10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#312e81">counter 90 cm</text>
        </g>
      )
    }
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
            <rect x={span.x+1.5} y={baseY} width={Math.max(4,span.w-3)} height={baseH} fill={renderStyle.baseCabinet} stroke="#211b17" strokeWidth="1.2"/>
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
          <rect width="80" height="80" fill={renderStyle.middleCabinet}/>
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
        <filter id={`${key}HeightGlow`} x="-80%" y="-20%" width="260%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <text x={frame.x} y="31" fontSize="24" fontWeight="900" fill="#171717">{isEast?'East Wall Elevation':'West Wall Elevation'}</text>
      <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="15" fontWeight="800" fill="#61584f">{isEast?'North (N) left to South (S) right':'South (S) left to North (N) right'}, length 4746 mm, height 2700 mm</text>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${key}WallWash)`} stroke="#171717" strokeWidth="2"/>
      <rect x={cabinetRun.x} y={backsplashY} width={cabinetRun.w} height={backsplashH} fill={`url(#${key}Backsplash)`}/>
      <rect x={cabinetRun.x} y={counterY-4} width={cabinetRun.w} height="18" fill={renderStyle.counter} stroke="#3a2d24" strokeWidth="1.4"/>
      <g filter={`url(#${key}SoftShadow)`}>{basePanels()}</g>
      <rect x={cabinetRun.x} y={plinthY} width={cabinetRun.w} height={yOf(0)-plinthY} fill="#43372f"/>
      <rect x={cabinetRun.x} y={lowerUpperY} width={cabinetRun.w} height={lowerUpperH} fill={`url(#${key}Wood)`} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
      {panelsForModules(1850,1350,`url(#${key}Wood)`)}
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH-8} width={cabinetRun.w} height="7" fill="#201711" opacity="0.55"/>
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+4} width={cabinetRun.w} height="12" fill="#ffd08a" opacity="0.96" filter={`url(#${key}Glow)`}/>
      <rect x={cabinetRun.x} y={lowerUpperY+lowerUpperH+12} width={cabinetRun.w} height={Math.max(1,yOf(900)-(lowerUpperY+lowerUpperH+12))} fill={`url(#${key}LedWash)`} opacity="0.55"/>
      <rect x={cabinetRun.x} y={topUpperY} width={cabinetRun.w} height={topUpperH} fill={renderStyle.topCabinet} stroke="#211b17" strokeWidth="1.5" filter={`url(#${key}SoftShadow)`}/>
      {panelsForModules(2700,1850,renderStyle.topCabinet)}
      {!isEast&&<g>
        <rect x={clearDoor.x} y={frame.y} width={clearDoor.w} height={frame.h} fill="#f9f4ec" stroke="#7b3f21" strokeDasharray="9 7" opacity="0.92"/>
        <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2} textAnchor="middle" fontSize="16" fontWeight="900" fill="#7b3f21">door clear zone</text>
        <text x={clearDoor.x+clearDoor.w/2} y={frame.y+frame.h/2+24} textAnchor="middle" fontSize="13" fontWeight="800" fill="#7b3f21">no counter or cabinets</text>
      </g>}
      <rect x={windowSpan.x} y={yOf(2700)} width={windowSpan.w} height={yOf(900)-yOf(2700)} fill="none" stroke="#2f8ac6" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.62"/>
      {items.map((it,index)=>{
        if(it.hidden || it.id==='westGarage' || it.w<=0 || it.d<=0) return null
        const width=wOf(it.w)
        const x=isEast?xOf(it.y)-width:xOf(it.y)
        const dark=['gas','sink','microwave'].includes(it.id)
        if(it.id==='gas'){
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
        if(it.id==='westGarage') return null
        if(it.id==='garage_NE'){
          // East Tall NE - washing below + MICROWAVE above (contiguous uppers no gap)
          const tallTop=yOf(2700)
          const tallBottom=yOf(0)
          return (<g key={it.id} onClick={()=>setSelectedId(it.id)} style={{cursor:'pointer'}}>
            <rect x={x+2} y={tallTop} width={Math.max(14,width-4)} height={tallBottom-tallTop} fill={renderStyle.tallCabinet} stroke="#111" strokeWidth="1.6" rx="5"/>
            <rect x={x+6} y={baseY+10} width={Math.max(10,width-12)} height={baseH-10} fill="#e7e2dc" stroke="#211b17" strokeWidth="1.2" rx="4"/>
            <rect x={x+width*.18} y={yOf(1480)} width={width*.64} height="48" fill="#1f1f1f" stroke="#111" rx="4"/>
            <rect x={x+width*.22} y={yOf(1480)+18} width={width*.40} height="18" fill="#050505" stroke="#444"/>
            <text x={x+width/2} y={yOf(1480)+38} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">MICROWAVE</text>
            <circle cx={x+width/2} cy={baseY+baseH*.56} r={Math.min(30,width*.22)} fill="#1f2327" stroke="#d2d2d2" strokeWidth="6"/>
            <text x={x+width/2} y={baseY-14} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">Tall NE - Microwave above</text>
            <text x={x+width/2} y={baseY-2} textAnchor="middle" fontSize="8" fontWeight="800" fill="#5a4632">Washing below</text>
          </g>)
        }
        if(it.id==='trashCan'){
          // Trash pull-out Saints frame below sink - cabinet opens then frame pulls out
          return (<g key={it.id} onClick={()=>setSelectedId(it.id)} style={{cursor:'pointer'}}>
            <rect x={x+3} y={baseY+10} width={Math.max(12,width-6)} height={baseH-10} fill="#2b2b2b" stroke="#111" strokeWidth="1.4" rx="4"/>
            <rect x={x+8} y={baseY+22} width={Math.max(10,width-16)} height={baseH-34} fill="#3a3a3a" stroke="#111" rx="3"/>
            <rect x={x+width*.18} y={baseY+34} width={width*.64} height="18" fill="#1a1a1a" rx="2"/>
            <line x1={x+12} y1={baseY+74} x2={x+12} y2={baseY+baseH-32} stroke="#111" strokeWidth="2.2"/>
            <path d={`M ${x+12} ${baseY+baseH-36} Q ${x-width*.24} ${baseY+baseH*.66} ${x+12} ${baseY+baseH*.35}`} fill="none" stroke="#2f6f6d" strokeWidth="2" strokeDasharray="5 4"/>
            <text x={x+width/2} y={baseY+baseH-18} textAnchor="middle" fontSize="8" fontWeight="900" fill="#c8b39d">Saints frame pull-out</text>
            <text x={x+width/2} y={baseY-14} textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">Trash pull-out</text>
            <text x={x+width/2} y={baseY-2} textAnchor="middle" fontSize="8" fontWeight="800" fill="#5a4632">under sink 350x400</text>
          </g>)
        }
        if(it.id==='washing' && items.some(x=>x.id==='garage_NE')){
          // washing is inside tall NE - skip duplicate, garage_NE already shows washing + microwave
          return null
        }
        if(it.id==='dishwasher'||it.id==='washing'){
          const label=it.id==='washing'?'1  Washing + Microwave above':'2  Dishwasher'
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
      {heightGuideOverlay()}
    </svg>)
  }

  const NorthSouthElevation=({isNorth})=>{
    const frame={x:72,y:52,w:1060,h:560}
    const xOf=(x)=>frame.x+(x/2324)*frame.w
    const yOf=(z)=>frame.y+frame.h-(z/2700)*frame.h
    const wOf=(w)=>Math.max(24,(w/2324)*frame.w)
    const hOf=(h)=>Math.max(18,(h/2700)*frame.h)
    const eastX=2324-600, westX=0
    const heightGuideOverlay=()=>{
      if(!showHeightGuides) return null
      const guideX=xOf(isNorth?585:1740)
      const labelX=guideX+(isNorth?-34:34)
      const textAnchor=isNorth?'end':'start'
      return (
        <g pointerEvents="none">
          {[0,PLINTH_HEIGHT,900,1350,1850,KITCHEN.height].map(z=>(
            <line key={`ns-level-${z}`} x1={frame.x} y1={yOf(z)} x2={frame.x+frame.w} y2={yOf(z)} stroke="#4f46e5" strokeWidth="1.2" strokeDasharray="9 8" opacity="0.42"/>
          ))}
          <line x1={guideX} y1={yOf(0)} x2={guideX} y2={yOf(KITCHEN.height)} stroke="#c7d2fe" strokeWidth="10" opacity="0.34" filter="url(#nsHeightGlow)"/>
          {HEIGHT_GUIDES.map(g=>{
            const yTop=yOf(g.to)
            const yBottom=yOf(g.from)
            const mid=(yTop+yBottom)/2
            return (
              <g key={`ns-${g.id}`}>
                <line x1={guideX} y1={yTop+4} x2={guideX} y2={yBottom-4} stroke="#5b5bf7" strokeWidth="5" strokeLinecap="round" filter="url(#nsHeightGlow)"/>
                <circle cx={guideX} cy={yTop+4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
                <circle cx={guideX} cy={yBottom-4} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2"/>
                <text x={labelX} y={mid-5} textAnchor={textAnchor} fontSize="18" fontWeight="900" fill="#ffffff" stroke="#312e81" strokeWidth="4" paintOrder="stroke">{Math.round((g.to-g.from)/10)} cm</text>
                <text x={labelX} y={mid+15} textAnchor={textAnchor} fontSize="10" fontWeight="900" fill="#312e81">{g.label}</text>
              </g>
            )
          })}
          <text x={labelX} y={yOf(900)-10} textAnchor={textAnchor} fontSize="10" fontWeight="900" fill="#312e81">counter 90 cm</text>
        </g>
      )
    }
    return (<svg width="1180" height="560" viewBox="0 0 1180 620" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',height:'auto',display:'block'}}>
      <defs>
        <filter id="nsHeightGlow" x="-80%" y="-20%" width="260%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="#faf6f1" stroke="#111" strokeWidth="2"/>
      <text x={frame.x} y="31" fontSize="22" fontWeight="900">{isNorth?'North Elevation (looking South)':'South Elevation (looking North)'}</text>
      <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="13" fontWeight="700" fill="#61584f">{isNorth?'East (E) right / West (W) left - Window 1100W':'East (E) left / West (W) right - Door 1100W'}</text>
      {/* wall baseline */}
      <line x1={frame.x} y1={yOf(0)} x2={frame.x+frame.w} y2={yOf(0)} stroke="#111" strokeWidth="4"/>
      {/* floor */}
      <rect x={frame.x} y={yOf(0)} width={frame.w} height={hOf(30)} fill={materials.floor||'#ded6cc'} stroke="#111"/>
      {/* east cabinet silhouette */}
      <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(900 - PLINTH_HEIGHT)} fill={renderStyle.baseCabinet} stroke="#111"/>
      <rect x={xOf(eastX)} y={yOf(900)} width={wOf(600)} height={hOf(COUNTER_THICKNESS)} fill={renderStyle.counter} stroke="#7d7165"/>
      <rect x={xOf(eastX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={renderStyle.middleCabinet} stroke="#111"/>
      <rect x={xOf(eastX+80)} y={yOf(2700)} width={wOf(470)} height={hOf(800)} fill={renderStyle.topCabinet} stroke="#111"/>
      {/* west cabinet silhouette */}
      <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(900 - PLINTH_HEIGHT)} fill={renderStyle.baseCabinet} stroke="#111"/>
      <rect x={xOf(westX)} y={yOf(900)} width={wOf(400)} height={hOf(COUNTER_THICKNESS)} fill={renderStyle.counter} stroke="#7d7165"/>
      <rect x={xOf(westX)} y={yOf(1350)} width={wOf(320)} height={hOf(500)} fill={renderStyle.middleCabinet} stroke="#111"/>
      <rect x={xOf(westX)} y={yOf(1900)} width={wOf(400)} height={hOf(800)} fill={renderStyle.topCabinet} stroke="#111"/>
      {/* door / window */}
      {isNorth? (
        <g>
          <rect x={xOf(612)} y={yOf(2700)} width={wOf(1100)} height={hOf(1800)} fill="rgba(126,184,232,0.32)" stroke="#2f8ac6" strokeWidth="2"/>
          {/* transom at 610 from head (2'-0") */}
          <line x1={xOf(612)} y1={yOf(2700-610)} x2={xOf(1712)} y2={yOf(2700-610)} stroke="#1a1a18" strokeWidth="3"/>
          {/* centre vertical mullion - 2 partitions */}
          <line x1={xOf(612+550)} y1={yOf(2700)} x2={xOf(612+550)} y2={yOf(900)} stroke="#1a1a18" strokeWidth="2.2"/>
          {/* left-top exhaust fan 300mm - HIGH CONTRAST */}
          <rect x={xOf(612)+8} y={yOf(2700)-10} width={wOf(550)-16} height={hOf(610)-10} fill="#1a1a18" stroke="#111" strokeWidth="1.4"/>
          <rect x={xOf(612)+16} y={yOf(2700)-10+6} width={wOf(550)-32} height={hOf(610)-22} fill="#eaf0f4" stroke="#c8d2db" strokeWidth="1"/>
          {/* louvre lines */}
          <line x1={xOf(612)+20} y1={yOf(2700-120)} x2={xOf(612+550)-20} y2={yOf(2700-120)} stroke="#b8c7d4" strokeWidth="1"/>
          <line x1={xOf(612)+20} y1={yOf(2700-200)} x2={xOf(612+550)-20} y2={yOf(2700-200)} stroke="#b8c7d4" strokeWidth="1"/>
          <line x1={xOf(612)+20} y1={yOf(2700-280)} x2={xOf(612+550)-20} y2={yOf(2700-280)} stroke="#b8c7d4" strokeWidth="1"/>
          <line x1={xOf(612)+20} y1={yOf(2700-360)} x2={xOf(612+550)-20} y2={yOf(2700-360)} stroke="#b8c7d4" strokeWidth="1"/>
          <line x1={xOf(612)+20} y1={yOf(2700-440)} x2={xOf(612+550)-20} y2={yOf(2700-440)} stroke="#b8c7d4" strokeWidth="1"/>
          <circle cx={xOf(612+275)} cy={yOf(2700-305)} r={Math.min(wOf(300)/2, hOf(300)/2)} fill="#ffffff" stroke="#1a1a18" strokeWidth="2.6"/>
          <circle cx={xOf(612+275)} cy={yOf(2700-305)} r={Math.min(wOf(300)/2, hOf(300)/2)-6} fill="none" stroke="#c05a2b" strokeWidth="1.2"/>
          <circle cx={xOf(612+275)} cy={yOf(2700-305)} r={7} fill="#c05a2b" stroke="#fff" strokeWidth="1.2"/>
          <line x1={xOf(612+275)-34} y1={yOf(2700-305)} x2={xOf(612+275)+34} y2={yOf(2700-305)} stroke="#2b2b2b" strokeWidth="2.2"/>
          <line x1={xOf(612+275)} y1={yOf(2700-305)-34} x2={xOf(612+275)} y2={yOf(2700-305)+34} stroke="#2b2b2b" strokeWidth="2.2"/>
          <text x={xOf(1162)} y={yOf(2430)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1a1a18">TOP 610 - LEFT: 12" METAL EXHAUST / RIGHT: FIXED x1</text>
          <text x={xOf(1162)} y={yOf(1500)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#c05a2b">BOTTOM 1190 - SLIDING x2 (both sides)</text>
          <text x={xOf(1162)} y={yOf(1800)} textAnchor="middle" fontSize="11" fontWeight="900" fill="#1f5f88">Window 1100x1800 sill 900 - 2 BAYS (centre mullion)</text>
          <rect x={xOf(KITCHEN.windowBelow?.x||612)} y={yOf(300)} width={wOf(KITCHEN.windowBelow?.w||1100)} height={hOf(300)} fill="#eaf6fd" stroke="#2f8ac6" strokeDasharray="10 8" opacity="0.72"/>
          <text x={xOf(1162)} y={yOf(150)} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2e6f99">Below window area only - 300 deep</text>
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
        <text x={frame.x+frame.w+70} y={yOf(2300)} transform={`rotate(90 ${frame.x+frame.w+70} ${yOf(2300)})`} textAnchor="middle" fill="#6d6257">Top upper 1850-2700 no gap</text>
      </g>
      <text x={frame.x-10} y={yOf(2700)+4} textAnchor="end" fontSize="12" fontWeight="800">2700</text>
      <text x={frame.x-10} y={yOf(0)+4} textAnchor="end" fontSize="12" fontWeight="800">0</text>
      {heightGuideOverlay()}
    </svg>)
  }

  const ReferencesView=()=>(
    <div style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h3 style={{margin:'0 0 10px 0'}}>Reference Links</h3>
        <div style={{fontSize:12,color:'#61584f',fontWeight:700}}>Source file: docs/references.md</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
        {REFERENCE_LINKS.map(link=>(
          <div key={link.url} style={{border:'1px solid #ddd4c8',borderRadius:8,padding:12,background:'#fffefb'}}>
            <div style={{fontWeight:900,fontSize:15,marginBottom:6}}>{link.title}</div>
            <div style={{fontSize:12,color:'#61584f',marginBottom:8}}>{link.source}</div>
            <a href={link.url} target="_blank" rel="noreferrer" style={{display:'block',fontSize:13,fontWeight:800,color:'#0c4a6e',overflowWrap:'anywhere',marginBottom:8}}>
              {link.url}
            </a>
            <div style={{fontSize:12,color:'#4b4037',lineHeight:1.45}}>{link.note}</div>
          </div>
        ))}
      </div>
    </div>
  )

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
    <h1 style={{fontSize:'clamp(24px,5vw,26px)',fontWeight:900,lineHeight:1.15}}>Galley 2324x4746 - New Configuration - 6 Views - Windows Desktop</h1>
    <div style={{fontSize:13,color:'#666',lineHeight:1.3}}>RIGHT EAST 600D: north tall y4146 washing below microwave above, purifier y3796, sink 30" (762x457) y2996 trash pull-out Saints frame below (350x400 pull-out at y3202), dish rack above, dishwasher y2396 | LEFT WEST 600D equal east: door clear y0-y1220, sink/purifier/dishwasher/geyser run, shaft LAST y4146 NW | Walkway 1124/1004 | Click any item to see WxDxH - Unit mm/inch + Measure above 3D</div>
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
      <button onClick={()=>selectView('references')} style={{padding:'10px 16px',background:view==='references'?'#0c4a6e':'#fff',color:view==='references'?'#fff':'#0c4a6e',border:'2px solid #0c4a6e',borderRadius:10,fontWeight:800}}>Reference Links</button>
      <button onClick={()=>setShowHeightGuides(v=>!v)} style={{padding:'10px 16px',background:showHeightGuides?'#4f46e5':'#fff',color:showHeightGuides?'#fff':'#3730a3',border:'2px solid #4f46e5',borderRadius:10,fontWeight:800}}>Height Guide</button>
      <button onClick={export3DScreenshot} disabled={view!=='three'} style={{padding:'10px 16px',background:view==='three'?'#111':'#ddd',color:view==='three'?'#fff':'#777',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <button onClick={exportPlanSvg} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D SVG</button>
      <button onClick={exportPlanPng} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D PNG</button>
      <button onClick={exportPlanDxf} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D DXF</button>
      {/* Coohom Guide hidden for now - code preserved, button commented out */}
      {/* <button onClick={exportCoohomGuide} style={{padding:'8px 12px',background:'#7b3f21',color:'#fff',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Coohom Guide</button> */}
      <button onClick={exportJSON} style={{padding:'8px 12px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>Export JSON</button>
      <button onClick={exportProjectPackage} style={{padding:'8px 12px',background:'#2f6f6d',color:'#fff',border:'2px solid #2f6f6d',borderRadius:10,fontWeight:800}}>Export Project Package</button>
      <span style={{padding:'8px 12px',background:vSimple.all?'#d1fae5':'#fee2e2',borderRadius:10,fontWeight:800,fontSize:12}}>{vSimple.all?'Config Valid':'Invalid'} East:{vSimple.eastOk?'OK':'No'} West:{vSimple.westOk?'OK':'No'}</span>
      <span style={{display:'inline-flex',gap:6,alignItems:'center',padding:'6px 10px',background:'#fff',border:'2px solid #111',borderRadius:10,fontWeight:800}}>
        Grid:
        <button onClick={()=>setGrid(0)} style={{padding:'6px 10px',background:grid===0?'#111':'#fff',color:grid===0?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>Off</button>
        <button onClick={()=>setGrid(50)} style={{padding:'6px 10px',background:grid===50?'#111':'#fff',color:grid===50?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>50 mm</button>
        <button onClick={()=>setGrid(100)} style={{padding:'6px 10px',background:grid===100?'#111':'#fff',color:grid===100?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>100 mm</button>
      </span>
      <span style={{display:'inline-flex',gap:6,alignItems:'center',padding:'6px 10px',background:'#fff',border:'2px solid #0c4a6e',borderRadius:10,fontWeight:800}}>
        Unit:
        <button onClick={()=>setUnit('mm')} style={{padding:'6px 10px',background:unit==='mm'?'#0c4a6e':'#fff',color:unit==='mm'?'#fff':'#0c4a6e',border:'1px solid #0c4a6e',borderRadius:8,fontWeight:800}}>mm</button>
        <button onClick={()=>setUnit('inch')} style={{padding:'6px 10px',background:unit==='inch'?'#0c4a6e':'#fff',color:unit==='inch'?'#fff':'#0c4a6e',border:'1px solid #0c4a6e',borderRadius:8,fontWeight:800}}>inch</button>
      </span>
      <span style={{display:'inline-flex',gap:6,alignItems:'center',padding:'6px 10px',background:'#fff',border:'2px solid #111',borderRadius:10,fontWeight:800}}>
        Mode:
        <button onClick={()=>{setInteractionMode('cabinet'); setMeasureMode(false); setMeasurePoints([])}} style={{padding:'6px 10px',background:interactionMode==='cabinet'?'#111':'#fff',color:interactionMode==='cabinet'?'#fff':'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}><span style={{fontSize:12}}>OPEN</span> Cabinet</button>
        <button onClick={()=>{setInteractionMode('transparent'); setMeasureMode(false);}} style={{padding:'6px 10px',background:interactionMode==='transparent'?'#7c3aed':'#fff',color:interactionMode==='transparent'?'#fff':'#7c3aed',border:'1px solid #7c3aed',borderRadius:8,fontWeight:800}}><span style={{fontSize:12}}>SEE</span> Transparent</button>
        <button onClick={()=>{setInteractionMode('dimension'); setMeasureMode(false);}} style={{padding:'6px 10px',background:interactionMode==='dimension'?'#0c4a6e':'#fff',color:interactionMode==='dimension'?'#fff':'#0c4a6e',border:'1px solid #0c4a6e',borderRadius:8,fontWeight:800}}><span style={{fontSize:12}}>DIM</span> Dimension</button>
        <button onClick={()=>{setInteractionMode('measure'); setMeasureMode(true); setMeasurePoints([])}} style={{padding:'6px 10px',background:interactionMode==='measure'?'#d97706':'#fff',color:interactionMode==='measure'?'#fff':'#d97706',border:'1px solid #d97706',borderRadius:8,fontWeight:800}}><span style={{fontSize:12}}>MM</span> Measure</button>
      </span>
      {measureDistance!=null && interactionMode==='measure' && <span style={{display:'inline-flex',gap:6,alignItems:'center',padding:'6px 10px',background:'#fef3c7',border:'2px solid #d97706',borderRadius:10,fontWeight:800,fontSize:12}}>{fmt(Math.round(measureDistance))} <span>({fmtPair(measurePoints[1].x-measurePoints[0].x, measurePoints[1].y-measurePoints[0].y)})</span> <button onClick={()=>setMeasurePoints([])} style={{padding:'4px 8px',background:'#fff',color:'#111',border:'1px solid #111',borderRadius:8,fontWeight:800}}>Clear</button></span>}
      </div>
    </div>
    {/* Active mode indicator */}
    <div style={{background:interactionMode==='cabinet'?'#111':interactionMode==='transparent'?'#ede9fe':interactionMode==='dimension'?'#e0f2fe':'#fef3c7',color:interactionMode==='cabinet'?'#fff':interactionMode==='transparent'?'#5b21b6':interactionMode==='dimension'?'#0c4a6e':'#92400e',border:`2px solid ${interactionMode==='cabinet'?'#111':interactionMode==='transparent'?'#7c3aed':interactionMode==='dimension'?'#0c4a6e':'#d97706'}`,borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
      <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:900,fontSize:14}}>
        <span style={{fontSize:14}}>{interactionMode==='cabinet'?'OPEN':interactionMode==='transparent'?'SEE':interactionMode==='dimension'?'DIM':'MM'}</span>
        <span>Active: {interactionMode==='cabinet'?'Cabinet Open Mode':interactionMode==='transparent'?'Transparent Mode':interactionMode==='dimension'?'Dimension Mode':'Measure Mode'}</span>
        <span style={{fontSize:14}}>{interactionMode==='cabinet'?'OPEN':interactionMode==='transparent'?'SEE':interactionMode==='dimension'?'DIM':'MM'}</span>
        <span style={{fontWeight:700,fontSize:13,opacity:0.9}}>{interactionMode==='cabinet'?'- click cabinet to open/close':interactionMode==='transparent'?'- click cabinet to make transparent':interactionMode==='dimension'?'- click any item to see WxDxH':`- left-click 2 points to measure (right-click ignored)${measurePoints.length===1?' * point 1 set':measurePoints.length===2?' * done':''}`}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,fontWeight:800}}>
        <span style={{background:'#fff',color:'#111',padding:'4px 8px',borderRadius:6,border:'1px solid #111'}}>Cursor: {interactionMode==='cabinet'?'pointer':interactionMode==='transparent'?'eye':interactionMode==='dimension'?'pointer':'crosshair'}</span>
        <span style={{opacity:0.8}}>Unit: {unit} * Hide walls: {hide3DObstructions?'ON':'OFF'}</span>
      </div>
    </div>

    {/* Selected item dimension bar - visible above all views */}
    {selectedItem && <div style={{background:'#fff',border:'1px solid #e5e0d5',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
      <div style={{fontWeight:900,fontSize:14}}>{selectedItem.id} - {planLabel(selectedItem.id)} <span style={{fontWeight:700,color:'#61584f'}}> y{fmt(selectedItem.y)} x{fmt(selectedItem.x)} z{fmt(selectedItem.z??0)}</span></div>
      <div style={{fontFamily:'monospace',fontSize:13,background:'#f6f2ec',padding:'6px 10px',borderRadius:8}}>W {fmt(selectedItem.w)} x D {fmt(selectedItem.d)} x H {fmt(selectedItem.h||900)}</div>
      <button onClick={()=>setSelectedId(null)} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Clear</button>
    </div>}
    {!selectedItem && measureMode && <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,fontWeight:700}}>Measure mode: click any 2 points in Top plan or 3D (shift-click in Top) to measure distance. {measurePoints.length===1 && `Start ${fmt(measurePoints[0].x)},${fmt(measurePoints[0].y)} - click second point`}{measurePoints.length===2 && ` Distance ${fmt(Math.round(measureDistance))}`}</div>}

    {view==='three'&&<div ref={activeViewRef} style={{marginBottom:14,scrollMarginTop:12}}><div style={{background:'#fff',border:'1px solid #e5e0d5',borderRadius:10,padding:'10px 14px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
      <div style={{fontWeight:900,fontSize:14}}>Dimension - click any item in 3D, Top plan or Wall view to see its size here ({unit})</div>
      <div style={{fontSize:12,color:'#61584f'}}>{selectedItem ? `${selectedItem.id}: W ${fmt(selectedItem.w)} x D ${fmt(selectedItem.d)} x H ${fmt(selectedItem.h||900)}` : 'No selection'}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        <button onClick={()=>{setInteractionMode('dimension'); setMeasureMode(false); setMeasurePoints([])}} style={{padding:'6px 10px',background:interactionMode==='dimension'?'#0c4a6e':'#fff',color:interactionMode==='dimension'?'#fff':'#0c4a6e',border:'1px solid #0c4a6e',borderRadius:8,fontWeight:800}}>Dimension</button>
        <button onClick={()=>{setInteractionMode('measure'); setMeasureMode(true); setMeasurePoints([])}} style={{padding:'6px 10px',background:interactionMode==='measure'?'#d97706':'#fff',color:interactionMode==='measure'?'#fff':'#d97706',border:'1px solid #d97706',borderRadius:8,fontWeight:800}}>Measure</button>
        <button onClick={()=>{setSelectedId(null); setMeasurePoints([])}} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Clear</button>
      </div>
    </div><ThreeDRender/></div>}
    {view==='top'&&(<div ref={activeViewRef} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}>
      <svg width="900" height={planSvgHeight} viewBox={viewBoxTop} preserveAspectRatio="xMidYMid meet" onClick={(e)=>{if(interactionMode!=='measure') return; const rect=e.currentTarget.getBoundingClientRect(); const vbW=KITCHEN.width+pad*2, vbH=KITCHEN.length+pad*2; const sx=(e.clientX-rect.left)/rect.width*vbW - pad; const sy=(e.clientY-rect.top)/rect.height*vbH - pad; const ky=KITCHEN.length - sy; if(sx<-pad||sx>KITCHEN.width+pad||ky<-pad||ky>KITCHEN.length+pad) return; setMeasurePoints(prev=> prev.length>=2 ? [{x:sx,y:ky}] : [...prev,{x:sx,y:ky}])}} style={{background:'#FFFEFB',border:'1px solid #e5e0d5',borderRadius:10,width:'100%',maxWidth:900,height:'auto',display:'block',margin:'0 auto',cursor:interactionMode==='measure'?'crosshair':interactionMode==='dimension'?'pointer':interactionMode==='transparent'?'cell':interactionMode==='cabinet'?'pointer':'default'}}>
        <rect x={-pad} y={-pad} width={KITCHEN.width+pad*2} height={KITCHEN.length+pad*2} fill="#f6f2ec"/>
        <rect x="0" y="0" width="2324" height="4746" fill={materials.wall||'#FFFEFB'} stroke="#111" strokeWidth="10"/>
        {(grid===50||grid===100)&&(<g>
          {Array.from({length: Math.floor(KITCHEN.width/grid)+1},(_,i)=> i*grid).map(val=><line key={`vg-${val}`} x1={val} y1={0} x2={val} y2={KITCHEN.length} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
          {Array.from({length: Math.floor(KITCHEN.length/grid)+1},(_,i)=> i*grid).map(val=><line key={`hg-${val}`} x1={0} y1={val} x2={KITCHEN.width} y2={val} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
        </g>)}
        <rect x={KITCHEN.windowBelow?.x||612} y="0" width={KITCHEN.windowBelow?.w||1100} height={KITCHEN.windowBelow?.depth||300} fill="#eaf6fd" stroke="#2f8ac6" strokeWidth="4" strokeDasharray="22 14" opacity="0.72"/>
        <text x={(KITCHEN.windowBelow?.x||612)+(KITCHEN.windowBelow?.w||1100)/2} y={170} textAnchor="middle" fontSize="46" fontWeight="900" fill="#1f5f88">BELOW WINDOW AREA</text>
        <rect x="0" y={svgY(0,1220)} width="600" height="1220" fill="#fffaf3" stroke="#7b3f21" strokeWidth="4" strokeDasharray="22 14"/>
        <text x="200" y={svgY(0,1220)+1220/2-10} textAnchor="middle" fontSize="52" fontWeight="900" fill="#7b3f21">DOOR CLEAR</text>
        <text x="200" y={svgY(0,1220)+1220/2+40} textAnchor="middle" fontSize="42" fontWeight="800" fill="#7b3f21">y0-y1220</text>
        <rect x={2324-600} y={svgY(0,eastRunLength)} width="600" height={eastRunLength} fill={renderStyle.baseCabinet} opacity="0.28" stroke="#b89f8a" strokeWidth="3"/>
        <rect x="0" y={svgY(1220,westRunLength)} width="600" height={westRunLength} fill={renderStyle.baseCabinet} opacity="0.28" stroke="#b89f8a" strokeWidth="3"/>
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
            const res= i===0? null : <line key={`wm-${i}`} x1={0} y1={lineY} x2={600} y2={lineY} stroke="#111" strokeWidth={m.type==='filler'?5:3} strokeDasharray={m.type==='filler'?'18 12':''}/>
            return res
          })
        })()}
        {/* Measure overlay */}
        {measurePoints.length>0 && <g>
          {measurePoints.map((p,i)=>(<g key={`mp-${i}`}><circle cx={p.x} cy={svgY(p.y,0)} r="14" fill="#d97706" stroke="#fff" strokeWidth="3"/><text x={p.x} y={svgY(p.y,0)-18} textAnchor="middle" fontSize="24" fontWeight="900" fill="#d97706">{i+1}</text></g>))}
          {measurePoints.length===2 && <g><line x1={measurePoints[0].x} y1={svgY(measurePoints[0].y,0)} x2={measurePoints[1].x} y2={svgY(measurePoints[1].y,0)} stroke="#d97706" strokeWidth="5" strokeDasharray="14 8"/><rect x={(measurePoints[0].x+measurePoints[1].x)/2 -90} y={(svgY(measurePoints[0].y,0)+svgY(measurePoints[1].y,0))/2 -18} width="180" height="30" fill="#fff" stroke="#d97706" strokeWidth="2" rx="8"/><text x={(measurePoints[0].x+measurePoints[1].x)/2} y={(svgY(measurePoints[0].y,0)+svgY(measurePoints[1].y,0))/2+6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#d97706">{fmt(Math.round(measureDistance))}</text></g>}
        </g>}
        <rect x="612" y="0" width="1100" height="62" fill="#7EB8E8" stroke="#111" strokeWidth="6"/>
        <text x="1162" y="44" textAnchor="middle" fontSize="38" fontWeight="800" fill="#0f3550">NORTH WINDOW 1100W</text>
        <rect x="612" y="4684" width="1100" height="62" fill="#fffaf3" stroke="#7b3f21" strokeWidth="6"/>
        <text x="1162" y="4726" textAnchor="middle" fontSize="38" fontWeight="800" fill="#7b3f21">SOUTH DOOR 1100W</text>
        <text x={KITCHEN.width/2} y={-70} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111">NORTH (N)</text>
        <text x={KITCHEN.width/2} y={KITCHEN.length+90} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111">SOUTH (S)</text>
        <text x={-70} y={KITCHEN.length/2} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111" transform={`rotate(-90 -70 ${KITCHEN.length/2})`}>WEST (W)</text>
        <text x={KITCHEN.width+70} y={KITCHEN.length/2} textAnchor="middle" fontSize="58" fontWeight="900" fill="#111" transform={`rotate(90 ${KITCHEN.width+70} ${KITCHEN.length/2})`}>EAST (E)</text>
        {activeEast.map(it=>{
          if(it.id==='washing' && activeEast.some(x=>x.id==='garage_NE')){
            return null
          }
          if(it.id==='garage_NE'){
            // East Tall NE 600x600x2700 y4146 - washing below + microwave above inside tall (right-hand side framing window)
            return (<g key={it.id} onMouseDown={e=>onDown(e,'east',it.id)} style={{cursor:'grab'}}>
              <rect x={2324-it.d} y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
              <rect x={2324-it.d+12} y={svgY(it.y,it.w)+14} width={it.d-24} height={it.w-28} fill="#f7f1e8" stroke="#7b3f21" strokeWidth="3" rx="6" strokeDasharray="12 8"/>
              <rect x={2324-it.d+26} y={svgY(it.y+it.w-250,130)} width={it.d-52} height={130} fill="#1a1a1a" stroke="#111" rx="4"/>
              <text x={2324-it.d/2} y={svgY(it.y+it.w-250,130)+78} textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">MICROWAVE above</text>
              <rect x={2324-it.d+40} y={svgY(it.y+80,120)} width={it.d-80} height={120} fill="#e8e4de" stroke="#111" rx="4"/>
              <circle cx={2324-it.d/2} cy={svgY(it.y+80,120)+34} r="18" fill="#1f2327" stroke="#d2d2d2" strokeWidth="5"/>
              <text x={2324-it.d/2} y={svgY(it.y+80,120)+86} textAnchor="middle" fontSize="14" fontWeight="800" fill="#111">WASHING below</text>
              <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)} Tall NE</text>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2-10} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111">TALL NE</text>
            </g>)
          }
          if(it.id==='trashCan'){
            // Trash pull-out Saints frame below sink - show in top plan
            return (<g key={it.id} onMouseDown={e=>{onDown(e,'east',it.id); setSelectedId(it.id)}} style={{cursor:'grab'}}>
              <rect x={2324-it.d} y={svgY(it.y,it.w)} width={it.d} height={it.w} fill="#2b2b2b" stroke="#111" strokeWidth="4" rx="8"/>
              <rect x={2324-it.d+12} y={svgY(it.y,it.w)+14} width={it.d-24} height={it.w-28} fill="#3a3a3a" stroke="#111" strokeWidth="2" rx="4" strokeDasharray="8 6"/>
              <rect x={2324-it.d+20} y={svgY(it.y+it.w/2-26,52)} width={it.d-40} height={52} fill="#111" stroke="#c8b39d" rx="3"/>
              <text x={2324-it.d/2} y={svgY(it.y+it.w/2-26,52)+32} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">TRASH</text>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Saints pull-out</text>
              <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={2324-it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="16" fontWeight="800" fill="#111">{it.w}x{it.d} y{Math.round(it.y)}</text>
            </g>)
          }
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
          <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={Math.max(1,it.d-16)} height="26" fill="#fff" opacity="0.92" rx="5"/>
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
        {activeWest.map(it=>{
          if(it.hidden || it.id==='westGarage' || it.w<=0 || it.d<=0) return null
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
          if(it.id==='westGarage'){
            // West Appliance Garage top view - FIRST after shaft on west wall right side - microwave + FP
            return (<g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:'grab'}}>
              <rect x="0" y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
              <rect x="10" y={svgY(it.y,it.w)+14} width={it.d-20} height={it.w-28} fill="#f7f1e8" stroke="#7b3f21" strokeWidth="3" rx="6" strokeDasharray="12 8"/>
              <rect x="18" y={svgY(it.y+it.w-250,130)} width={it.d-36} height={130} fill="#1a1a1a" stroke="#111" rx="4"/>
              <text x={it.d/2} y={svgY(it.y+it.w-250,130)+78} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">MICROWAVE</text>
              <rect x="28" y={svgY(it.y+80,120)} width={it.d-56} height={120} fill="#b9b9b9" stroke="#111" rx="4"/>
              <text x={it.d/2} y={svgY(it.y+80,120)+74} textAnchor="middle" fontSize="14" fontWeight="800" fill="#111">FOOD PROCESSOR</text>
              <rect x="8" y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
              <text x={it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)} Appliance Garage</text>
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
          <rect x="8" y={svgY(it.y,it.w)+8} width={Math.max(1,it.d-16)} height="26" fill="#fff" opacity={it.fixed?0.88:0.92} rx="5"/>
          <text x={it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)}mm</text>
          <text x={it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="34" fontWeight="800" fill={it.id==='sink'?'#fff':'#111'}>{planLabel(it.id)}</text>
        </g>)})}
        <DimH x1={0} x2={KITCHEN.width} y={-110} text="Room width 2324 mm"/>
        <DimV y1={0} y2={KITCHEN.length} x={KITCHEN.width+110} text="Room length 4746 mm"/>
        <DimH x1={KITCHEN.width-600} x2={KITCHEN.width} y={36} text="East 600 mm"/>
        <DimH x1={0} x2={600} y={36} text="West 600 mm"/>
        <DimH x1={600} x2={KITCHEN.width-600} y={KITCHEN.length/2} text={`Walkway ${walkwayFloor} mm`}/>
        <DimV y1={svgY(0,KITCHEN.westGap.to)} y2={KITCHEN.length} x={-110} text="Door y0-y1220 (1220 mm)"/>
        <g>
          <rect x={-pad+8} y={KITCHEN.length+pad-46} width={KITCHEN.width+pad*2-16} height="40" fill="#111" rx="8"/>
          <text x={KITCHEN.width/2} y={KITCHEN.length+pad-20} textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">Scale 1:1 mm  |  2324W x 4746L x 2700H  |  Walkway {walkwayFloor} mm / {walkwayEye} mm eye  |  Grid {grid?grid+' mm':'Off'}  |  East 600D  West 600D</text>
        </g>
      </svg>
      <div style={{fontSize:13,marginTop:10,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between'}}>
        <span>Drag Y only - snapping {grid?grid+' mm':'Off (free)'} - North top, South bottom - Shaft fixed (not draggable)</span>
        <span style={{color:'#7b3f21',fontWeight:800}}>Walkway {walkwayFloor} mm floor / {walkwayEye} mm eye</span>
      </div>
    </div>)}
    {view==='front'&&(<div ref={activeViewRef} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><svg width="1000" height="500" viewBox="0 0 800 500" style={{width:'100%'}}><polygon points="0,450 800,450 560,120 240,120" fill="#E8E0D5" stroke="#111"/><polygon points="0,0 800,0 560,80 240,80" fill="#f2ece3" stroke="#111"/><polygon points="0,0 0,450 240,120 240,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><polygon points="800,0 800,450 560,120 560,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><rect x="350" y="95" width="100" height="45" fill="#7EB8E8" stroke="#111"/><text x="400" y="92" textAnchor="middle" fontSize="12" fontWeight="700">N WINDOW</text><rect x="92" y="235" width="68" height="54" fill="#80b5de" stroke="#111"/><text x="126" y="229" textAnchor="middle" fontSize="10" fontWeight="700">PURIFIER</text><rect x="162" y="310" width="70" height="18" fill="#202020" stroke="#111"/><rect x="174" y="313" width="46" height="12" fill="#c9c9c9" stroke="#555"/><text x="197" y="304" textAnchor="middle" fontSize="10" fontWeight="700">SINK</text><rect x="568" y="236" width="86" height="70" fill="#8c7a65" stroke="#111"/><text x="611" y="230" textAnchor="middle" fontSize="10" fontWeight="700">GARAGE</text><rect x="590" y="252" width="42" height="18" fill="#1f1f1f"/><rect x="594" y="276" width="34" height="18" fill="#b9b9b9"/><rect x="640" y="240" width="80" height="20" fill="#2a2a2a"/><text x="680" y="235" textAnchor="middle" fontSize="10" fill="#fff">GAS y2300</text></svg></div>)}
    {view==='east'&&(<div ref={(node)=>{eastSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>East wall front render: tall north cabinet, hidden purifier, sink, dish storage and dishwasher</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(eastSvgRef,'east-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(eastSvgRef,'east-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(eastSvgRef,'east-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={activeEast} isEast={true}/></div>)}
    {view==='west'&&(<div ref={(node)=>{westSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>West wall front render: clear door zone, sink, purifier, dishwasher, geyser and shaft</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(westSvgRef,'west-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(westSvgRef,'west-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(westSvgRef,'west-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={activeWest} isEast={false}/></div>)}
    {view==='north'&&(<div ref={(node)=>{northSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>North elevation (looking South)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(northSvgRef,'north-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(northSvgRef,'north-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(northSvgRef,'north-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={true}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows north window reference, below-window 300 mm area only, counter 900 mm, backsplash 600 mm, lower upper 1350-1850, top upper 1850-2700 no gap, ceiling 2700 mm.</div></div>)}
    {view==='south'&&(<div ref={(node)=>{southSvgRef.current=node; activeViewRef.current=node}} style={{background:'#fff',borderRadius:14,padding:14,scrollMarginTop:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>South elevation (looking North)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(southSvgRef,'south-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(southSvgRef,'south-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(southSvgRef,'south-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={false}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows south door, west door clear zone, counter and upper zones, ceiling 2700 mm.</div></div>)}
    {view==='references'&&<ReferencesView/>}

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
                <input type="color" value={renderMaterials[key]||'#cccccc'} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{width:36,height:28,padding:0,border:'1px solid #ccc',borderRadius:6,flex:'0 0 auto'}}/>
                <input value={renderMaterials[key]||''} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{flex:'1 1 0',minWidth:0,padding:'6px 8px',border:'1px solid #ddd',borderRadius:8,fontSize:12}}/>
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
          <div>Countertop: <b>{bom.counterLenM} m ({bom.counterLenMm} mm)</b> x 600D/400D, {COUNTER_THICKNESS}mm thick, {renderMaterials.counter}</div>
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
          <button onClick={resetRule9} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #c4b5a5',borderRadius:8,fontWeight:800}}>Reset to New Config</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleLoadFile} style={{display:'none'}}/>
        {importWarning && <div style={{marginTop:8,padding:'8px 10px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#991b1b',fontSize:12,whiteSpace:'pre-wrap'}}>{importWarning}</div>}
        {bomNote && <div style={{marginTop:8,padding:'6px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,color:'#166534',fontSize:12}}>{bomNote}</div>}
        <div style={{marginTop:12,borderTop:'1px solid #eee',paddingTop:10}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>Named versions (localStorage)</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              ['current','New config current'],
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

    <div style={{marginTop:14,padding:14,background:'#fff',borderRadius:10,fontFamily:'monospace',fontSize:13,overflowX:'auto',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><b>AI API (Browser Console):</b><br/>window.kitchenAPI.moveItemMM('east','garage_NE',4146) // east tall cabinet matching shaft<br/>window.kitchenAPI.moveItemMM('east','waterpurifier',3796) // hidden purifier north of sink<br/>window.kitchenAPI.moveItemMM('east','sink',2996) // sink with dish storage above<br/>window.kitchenAPI.moveItemMM('east','dishwasher',2396) // dishwasher hidden south of sink<br/>window.kitchenAPI.moveItemMM('west','sink',1800) // west sink<br/>window.kitchenAPI.moveItemMM('west','dishwasher',1100) // west dishwasher below geyser<br/>window.kitchenAPI.getLayout()<br/>window.kitchenAPI.getLayoutModel()<br/>window.kitchenAPI.validate() // detailed rows<br/>window.kitchenAPI.getValidationRows()<br/>window.kitchenAPI.getMaterials()<br/>window.kitchenAPI.getModules()<br/>window.kitchenAPI.getBOM()<br/>window.kitchenAPI.getGrid() / window.kitchenAPI.setGrid(50) // 0|50|100<br/>window.kitchenAPI.getWalkway()<br/>window.kitchenAPI.getDimensions()</div>
  </div></div>)
}
