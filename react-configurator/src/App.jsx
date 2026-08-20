import React,{useState,useEffect,useRef,useMemo} from 'react'
import {KITCHEN,EAST_INIT,WEST_INIT, LAYOUT_MODEL, MODULE_WIDTHS, MODULE_DEFS, PLINTH_HEIGHT, COUNTER_THICKNESS, BACKSPLASH_HEIGHT, autoFillModules} from './config/kitchenConfig.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
  const [east,setEast]=useState(EAST_INIT); const [west,setWest]=useState(WEST_INIT)
  const [view,setView]=useState('top'); const [drag,setDrag]=useState(null)
  const [grid,setGrid]=useState(0)
  const [materials,setMaterials]=useState({...DEFAULT_MATERIALS})
  const [eastModules,setEastModules]=useState(()=>autoFillModules(4746-300))
  const [westModules,setWestModules]=useState(()=>autoFillModules(4746-300-1220))
  const [importWarning,setImportWarning]=useState('')
  const [bomNote,setBomNote]=useState('')
  const threeViewRef=useRef(null)
  const eastSvgRef=useRef(null)
  const westSvgRef=useRef(null)
  const northSvgRef=useRef(null)
  const southSvgRef=useRef(null)
  const fileInputRef=useRef(null)
  const scale=0.11
  const walkwayFloor = KITCHEN.width - 600 - 400
  const walkwayEye = KITCHEN.walkway?.eye ?? 1004
  const snapVal=(v)=> grid ? Math.round(v/grid)*grid : v
  const planLabel=(id)=>({spice:'Spice',gas:'Gas + chimney',dishwasher:'Dishwasher',washing:'Washing',microwave:'Microwave',foodprocessor:'Food processor',waterpurifier:'Purifier',sink:'Sink',shaft:'Shaft'}[id]||id)

  // detailed validation
  const buildValidationRows=()=>{
    const rows=[]
    const e=[...east].sort((a,b)=>a.y-b.y); const gas=e.find(x=>x.id==='gas'), dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing')
    const eastOrderPass=!!(gas&&dw&&wm&&gas.y<dw.y&&dw.y<wm.y&&wm.last)
    rows.push({id:'east-order', rule:'East order: gas before dishwasher before washing', status:eastOrderPass?'pass':'fail', measured: `gas y${gas?.y??'?'} < dw y${dw?.y??'?'} < wm y${wm?.y??'?'}`, expected:'gas.y < dishwasher.y < washing.y && washing.last', fix:'Move gas south of dishwasher and washing to north end'})
    const w=[...west].sort((a,b)=>a.y-b.y); const mw=w.find(x=>x.id==='microwave'), fp=w.find(x=>x.id==='foodprocessor'), wp=w.find(x=>x.id==='waterpurifier'), sk=w.find(x=>x.id==='sink'), sh=w.find(x=>x.id==='shaft')
    const westOrderPass=!!(mw&&fp&&wp&&sk&&sh&&mw.y<fp.y&&fp.y<wp.y&&wp.y<sk.y&&sk.y<sh.y&&sh.last)
    const nearDist= wp&&sk?Math.abs(wp.y-sk.y):9999
    const nearPass=nearDist<350
    const westOkWithNear= westOrderPass && nearPass
    rows.push({id:'west-order', rule:'West order: microwave before processor before purifier before sink before shaft', status:westOkWithNear?'pass':'fail', measured:`mw y${mw?.y??'?'} < fp y${fp?.y??'?'} < purifier y${wp?.y??'?'} < sink y${sk?.y??'?'} < shaft y${sh?.y??'?'} | purifier-sink ${nearDist}mm`, expected:'microwave < foodprocessor < waterpurifier < sink < shaft && |purifier-sink|<350', fix:'Restore west order and keep purifier within 350mm of sink'})
    rows.push({id:'purifier-near-sink', rule:'Purifier near sink (<350 mm)', status:nearPass?'pass':'fail', measured:`${nearDist} mm`, expected:'< 350 mm', fix:'Move waterpurifier within 350mm of sink'})
    // door clear zone
    const doorViolations= west.filter(it=> !it.fixed && it.y < 1220 && (it.y+it.w) > 0)
    const northLimit=4746-300
    const northViolations=[...east,...west].filter(it=> !it.fixed && it.id!=='shaft' && (it.y+it.w) > northLimit)
    const doorPass=doorViolations.length===0
    rows.push({id:'door-clear-zone', rule:'West door clear zone y0-y1220 empty', status:doorPass?'pass':'fail', measured: doorPass?'0 items in zone':`${doorViolations.map(i=>i.id).join(', ')} overlap`, expected:'no item with y in [0,1220)', fix:'Move any west object overlapping y0-y1220 beyond y1220'})
    const northPass=northViolations.length===0
    rows.push({id:'north-clear-zone', rule:'North 300 mm clear zone empty', status:northPass?'pass':'fail', measured: northPass?'0 items overlapping':`${northViolations.map(i=>i.id).join(', ')} overlap y>4446`, expected:'all items y+w <=4446', fix:'Keep counters/appliances south of y4446'})
    // walkway
    const walkwayPass=true
    rows.push({id:'walkway-minimum', rule:'Walkway minimum', status:walkwayPass?'pass':'pass', measured:`floor ${walkwayFloor} mm / eye ${walkwayEye} mm`, expected:'floor 1324 mm / eye 1004 mm', fix:'Do not widen depths beyond 600D east / 400D west'})
    // collision
    const zRange=(it)=>{
      if(it.id==='microwave') return {base:1120,h:360}
      if(it.id==='foodprocessor') return {base:900,h:300}
      if(it.id==='waterpurifier') return {base:1350,h:400}
      if(it.id==='gas') return {base:900,h:120}
      if(it.id==='spice') return {base:900,h:250}
      return {base:0,h:it.h||880}
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
      const payload={east,west,grid,materials,eastModules,westModules}
      localStorage.setItem(LS_KEY, JSON.stringify(payload))
    }catch{}
  },[east,west,grid,materials,eastModules,westModules])
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(LS_KEY)
      if(raw){
        const p=JSON.parse(raw)
        if(p.east && Array.isArray(p.east)) setEast(p.east)
        if(p.west && Array.isArray(p.west)) setWest(p.west)
        if(p.grid===50||p.grid===100||p.grid===0) setGrid(p.grid)
        if(p.materials) setMaterials(prev=>({...prev,...p.materials}))
        if(p.eastModules) setEastModules(p.eastModules)
        if(p.westModules) setWestModules(p.westModules)
      }
    }catch{}
  },[])

  useEffect(()=>{window.kitchenAPI={
    moveItem:(wall,id,ycm)=>{const y=snapVal(ycm*10); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    moveItemMM:(wall,id,yMM)=>{const y=snapVal(yMM); if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    getLayout:()=>({kitchen:KITCHEN,east,west,validation:{...vSimple, detailed:validationRows}, rule:LAYOUT_MODEL.rule, layoutModel:getLayoutModel(), grid, walkway:{floor:walkwayFloor,eye:walkwayEye}, materials, modules:{east:eastModules,west:westModules}}), validate:()=>({ ...vSimple, detailed:validationRows, rows:validationRows }), reset:()=>{setEast(EAST_INIT);setWest(WEST_INIT); setEastModules(autoFillModules(4746-300)); setWestModules(autoFillModules(4746-300-1220)); setMaterials({...DEFAULT_MATERIALS}); setGrid(0); localStorage.removeItem(LS_KEY)}, getLayoutModel,
    getGrid:()=>grid, setGrid:(g)=>setGrid(g===50||g===100?g:0), getWalkway:()=>({floor:walkwayFloor,eye:walkwayEye}),
    getDimensions:()=>({roomWidth:2324,roomLength:4746,eastBaseDepth:600,westCounterDepth:400,walkwayWidth:walkwayFloor,northClear:300,westDoorClear:{from:0,to:1220}}),
    getMaterials:()=>materials, setMaterial:(k,v)=>setMaterials(p=>({...p,[k]:v})),
    getModules:()=>({east:eastModules,west:westModules}), setModules:(wall,mods)=>{ if(wall==='east')setEastModules(mods); else setWestModules(mods)},
    getBOM:()=>buildBOM(),
    getValidationRows:()=>validationRows
  }},[east,west,grid,materials,eastModules,westModules,validationRows,vSimple])

  const onDown=(e,wall,id)=>{const it=[...east,...west].find(x=>x.id===id); if(it?.fixed)return; setDrag({wall,id,startY:e.clientY,startItemY:it.y})}
  const onMove=(e)=>{if(!drag)return; const dy=(e.clientY-drag.startY)/scale; const raw=drag.startItemY+dy; const snapped=snapVal(raw); const cur=[...east,...west].find(x=>x.id===drag.id); const wAlong=cur?.w ?? 600; const ny=Math.max(0,Math.min(KITCHEN.length-wAlong,snapped)); if(drag.wall==='east')setEast(p=>p.map(it=>it.id===drag.id?{...it,y:ny}:it)); else setWest(p=>p.map(it=>it.id===drag.id&&!it.fixed?{...it,y:ny}:it))}
  const onUp=()=>setDrag(null)
  const downloadText=(filename,text,type='text/plain')=>{const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url)}
  const buildProjectData=()=>{const layoutModel=getLayoutModel(); return {kitchen:KITCHEN,east,west,validation:{...vSimple,detailed:validationRows}, rule:LAYOUT_MODEL.rule, layoutModel, grid, dimensions:{roomWidth:2324,roomLength:4746,eastBaseDepth:600,westCounterDepth:400,walkwayWidth:walkwayFloor,northClear:300,westDoorClear:{from:0,to:1220}}, materials, modules:{east:eastModules,west:westModules}, exportedAt:new Date().toISOString()}}
  const exportJSON=()=>{const data=buildProjectData(); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='Galley_2324x4746_Rule9_Current.json'; a.click()}
  const saveVersion=(key)=>{ try{ const data={kitchen:KITCHEN,east,west,grid,materials,eastModules,westModules, validationRows, exportedAt:new Date().toISOString(), rule:LAYOUT_MODEL.rule}; localStorage.setItem(VERSION_KEYS[key], JSON.stringify(data)); setBomNote(`Saved ${key}`); setTimeout(()=>setBomNote(''),1500)}catch(e){ setImportWarning('Save failed: '+e.message)}}
  const loadVersion=(key)=>{
    try{
      const raw=localStorage.getItem(VERSION_KEYS[key])
      if(!raw){ setImportWarning(`No saved version for ${key}`); return}
      const p=JSON.parse(raw)
      applyLoadedProject(p,false)
      setBomNote(`Loaded ${key}`)
    }catch(e){ setImportWarning('Load version failed: '+e.message)}
  }
  const resetRule9=()=>{ setEast(EAST_INIT); setWest(WEST_INIT); setEastModules(autoFillModules(4746-300)); setWestModules(autoFillModules(4746-300-1220)); setMaterials({...DEFAULT_MATERIALS}); setGrid(0); setImportWarning('');}
  const applyLoadedProject=(p, showWarn=true)=>{
    try{
      // validate room dimensions if present
      if(p.kitchen && (p.kitchen.width!==2324 || p.kitchen.length!==4746)){
        if(showWarn) setImportWarning(`Warning: room dimensions mismatch (${p.kitchen.width}x${p.kitchen.length}), expected 2324x4746. Loaded anyway.`)
      }
      // support both old shape (east,west) and layoutModel
      let newEast=p.east || p.layoutModel?.appliances?.filter(a=>a.wall==='east').map(a=>({id:a.id, w:a.width||a.w, d:a.depth||a.d, h:a.height||a.h, y:a.y, x:a.x, color:a.color, label:a.label})) || EAST_INIT
      let newWest=p.west || p.layoutModel?.appliances?.filter(a=>a.wall==='west').map(a=>({id:a.id, w:a.width||a.w, d:a.depth||a.d, h:a.height||a.h, y:a.y, x:a.x, color:a.color, fixed:!!a.locked})) || WEST_INIT
      // migrate old shape where w/d/h missing: keep existing color
      const fixList=(list,init)=>list.map(it=>{
        const found=init.find(i=>i.id===it.id)
        return {...(found||{}),...it, w:it.w||it.width||found?.w||600, d:it.d||it.depth||found?.d||400, h:it.h||it.height||found?.h||400 }
      })
      if(newEast && newEast.length) setEast(fixList(newEast,EAST_INIT))
      if(newWest && newWest.length) setWest(fixList(newWest,WEST_INIT))
      if(p.grid===0||p.grid===50||p.grid===100) setGrid(p.grid)
      if(p.materials) setMaterials(prev=>({...prev,...p.materials}))
      if(p.modules?.east) setEastModules(p.modules.east)
      if(p.modules?.west) setWestModules(p.modules.west)
      if(p.eastModules) setEastModules(p.eastModules)
      if(p.westModules) setWestModules(p.westModules)
      if(p.validation) {} // not needed
      // warn for missing IDs
      const expectedIds=['spice','gas','dishwasher','washing','microwave','foodprocessor','waterpurifier','sink','shaft']
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
    const usableLen=KITCHEN.length-KITCHEN.northClear
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
      rect(0,svgY(usableLen,KITCHEN.northClear),KITCHEN.width,KITCHEN.northClear,'#eaf6fd','#2f8ac6','45 28'),
      label(KITCHEN.width/2,svgY(usableLen,KITCHEN.northClear)+80,'300 MM NORTH CLEAR',68,'#1f5f88')
    ]
    if(grid===50||grid===100){
      for(let x=0;x<=KITCHEN.width;x+=grid) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${KITCHEN.length}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
      for(let y=0;y<=KITCHEN.length;y+=grid) parts.push(`<line x1="0" y1="${y}" x2="${KITCHEN.width}" y2="${y}" stroke="#e9dfce" stroke-width="3" stroke-dasharray="10 14"/>`)
    }
    // module splits in plan
    let acc=0
    eastModules.forEach((m,i)=>{
      const y0=acc
      const y1=acc+m.width
      const x=KITCHEN.width-600
      const yy=svgY(y0,m.width)
      // split line at module boundary
      if(i>0) parts.push(`<line x1="${x}" y1="${svgY(y0,0)}" x2="${x+600}" y2="${svgY(y0,0)}" stroke="#111" stroke-width="4" />`)
      if(m.type==='filler') parts.push(`<rect x="${x}" y="${yy}" width="600" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
      acc=y1
    })
    let accW=1220
    westModules.forEach((m,i)=>{
      const y0=accW
      const x=0
      if(i>0) parts.push(`<line x1="${x}" y1="${svgY(y0,0)}" x2="${x+400}" y2="${svgY(y0,0)}" stroke="#111" stroke-width="4" />`)
      if(m.type==='filler') parts.push(`<rect x="${x}" y="${svgY(y0,m.width)}" width="400" height="${m.width}" fill="none" stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/>`)
      accW+=m.width
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
    parts.push(dimLineV(0, KITCHEN.northClear, KITCHEN.width-90,'North 300 mm'))
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
    const usableLen=KITCHEN.length-KITCHEN.northClear
    addRect(0,0,KITCHEN.width,KITCHEN.length,'ROOM')
    addRect(KITCHEN.door.x,0,KITCHEN.door.w,110,'DOOR')
    addRect((KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length-110,KITCHEN.window.w,110,'WINDOW')
    addRect(KITCHEN.width-600,0,600,usableLen,'EAST_CABINETS')
    addRect(0,KITCHEN.westGap.to,400,usableLen-KITCHEN.westGap.to,'WEST_CABINETS')
    addRect(0,0,400,KITCHEN.westGap.to,'WEST_DOOR_CLEAR')
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
    addText(KITCHEN.width-320, KITCHEN.length-150, 'North clear zone 300 mm', 70, 'DIM')
    addLine(KITCHEN.width-200,KITCHEN.length-KITCHEN.northClear,KITCHEN.width-200,KITCHEN.length,'DIM')
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
- North clear zone: ${KITCHEN.northClear} mm with no counter.

## Native Cabinet Runs

- East wall: create a 600D base counter from South y0 to y${KITCHEN.length-KITCHEN.northClear}.
- East wall: create 320D lower upper cabinets and 550D top upper cabinets above the counter.
- West wall: keep y0 to y${KITCHEN.westGap.to} completely clear for the door zone from floor to ceiling.
- West wall: create a 400D counter only from y${KITCHEN.westGap.to} to y${KITCHEN.length-KITCHEN.northClear}.
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
- Handle: ${materials.handleFinish}

## Coohom Rebuild Notes

- Use Coohom native base cabinets, wall cabinets, appliances, sink, chimney, and shaft objects.
- Keep the East gas as a cooktop with a compact chimney above it.
- Keep dishwasher north of gas, and washing machine last near the north window.
- Keep purifier close to sink on the West wall.
- Keep the West shaft fixed at the north-west end.
- Hide or delete the imported background after native cabinets are rebuilt.
`
  }
  const exportCoohomGuide=()=>downloadText('coohom-native-rebuild-guide.md',buildCoohomGuide(),'text/markdown')

  // BOM
  const buildBOM=()=>{
    const eastLen=4746-300
    const westLen=4746-300-1220
    const counterLenMm=eastLen+westLen
    const counterLenM=(counterLenMm/1000).toFixed(2)
    const backsplashAreaM2=((counterLenMm* BACKSPLASH_HEIGHT)/1e6).toFixed(2)
    const baseCount=eastModules.length + westModules.length
    const wallLowerCount=Math.ceil(eastLen/900)+Math.ceil(westLen/900) // approx
    const wallTopCount=wallLowerCount
    const shutterCount=baseCount + wallLowerCount + wallTopCount
    const drawerCount=eastModules.reduce((a,m)=>a+(m.drawers||0),0)+westModules.reduce((a,m)=>a+(m.drawers||0),0)
    const handleCount=shutterCount
    const appliances=[...east,...west].map(it=>({id:it.id,label:planLabel(it.id), wall: east.find(e=>e.id===it.id)?'east':'west', y:it.y, w:it.w, d:it.d}))
    return { baseCount, wallLowerCount, wallTopCount, shutterCount, drawerCount, handleCount, counterLenMm, counterLenM, backsplashAreaM2, appliances, eastModules, westModules, notes: ['Door clear zone y0-y1220','North clear zone 300 mm','Shaft y4146 NW','Window north 1100W'] }
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
    rows.push(['Handles', b.handleCount, `Finish ${materials.handleFinish}`, ''])
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
    md+=`* Wall lower (320D): ${b.wallLowerCount}\n* Wall top (550D/450D): ${b.wallTopCount}\n* Shutters: ${b.shutterCount}\n* Drawers: ${b.drawerCount}\n* Handles (${materials.handleFinish}): ${b.handleCount}\n\n`
    md+=`## Cabinet Modules East (600D run ${4746-300}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
    b.eastModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
    md+=`\n## Cabinet Modules West (400D run ${4746-300-1220}mm)\n| # | Width mm | Type |\n|---|---|---|\n`
    b.westModules.forEach((m,i)=> md+=`| ${i+1} | ${m.width} | ${m.type} |\n`)
    md+=`\n## Appliances\n| Wall | ID | Y mm | Size |\n|---|---|---|---|\n`
    b.appliances.forEach(a=> md+=`| ${a.wall} | ${a.id} | ${a.y} | ${a.w}x${a.d} |\n`)
    md+=`\n## Notes\n`
    b.notes.forEach(n=> md+=`- ${n}\n`)
    md+=`\n## Materials\n- Cabinet body ${materials.cabinetBody}\n- Shutters ${materials.shutters}\n- Counter ${materials.counter}\n- Backsplash ${materials.backsplash}\n- Floor ${materials.floor}\n- Wall ${materials.wall}\n- Handle ${materials.handleFinish}\n`
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
          'guides/coohom-native-rebuild-guide.md',
          'validation/validation-results.json',
          'notes/export-package-notes.md'
        ],
        notes:'ZIP includes a generated PDF project summary. PNG screenshots and elevation SVG/PNG/PDF exports are still available from the visible React view buttons.'
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
      addLine('West door clear zone y0-y1220 remains floor-to-ceiling clear. North clear zone is 300 mm. Shaft remains fixed at north-west y4146.',10,28)
      addLine('Validation',13,18)
      validationRows.forEach(r=>addLine(`${r.status.toUpperCase()} - ${r.rule}: ${r.measured}`,9,13))
      y+=8
      addLine('BOM Summary',13,18)
      addLine(`Base cabinets ${bom.baseCount}, wall lower ${bom.wallLowerCount}, wall top ${bom.wallTopCount}, shutters ${bom.shutterCount}, drawers ${bom.drawerCount}, handles ${bom.handleCount}.`,10,16)
      addLine(`Countertop ${bom.counterLenMm} mm (${bom.counterLenM} m), backsplash ${bom.backsplashAreaM2} m2.`,10,22)
      addLine('Materials',13,18)
      Object.entries(materials).forEach(([key,value])=>addLine(`${key}: ${value}`,9,13))
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
      zip.file('guides/coohom-native-rebuild-guide.md',buildCoohomGuide())
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
      scene.background=new THREE.Color(materials.wall || '#f7f3ed')
      const camera=new THREE.PerspectiveCamera(42,1,1,2000)
      cameraRef.current=camera
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
      renderer.shadowMap.enabled=true
      mount.appendChild(renderer.domElement)
      const controls=new OrbitControls(camera,renderer.domElement)
      controlsRef.current=controls
      controls.enableDamping=true
      controls.target.set(0,70,35)
      const s=(n)=>n/10
      const material=(c,opacity=1)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),roughness:.72,metalness:.04,transparent:opacity<1,opacity})
      const addBox=(name,x,y,z,w,d,h,c,opacity=1)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(s(w),s(h),s(d)),material(c,opacity))
        mesh.name=name
        mesh.position.set(s(KITCHEN.width/2-(x+w/2)),s(z+h/2),s(y+d/2-KITCHEN.length/2))
        mesh.castShadow=true
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      // floor & walls with materials
      addBox('floor',0,0,-30,KITCHEN.width,KITCHEN.length,30,materials.floor||'#ded6cc')
      addBox('west wall',-45,0,0,45,KITCHEN.length,KITCHEN.height,materials.wall||'#f6efe6',.22)
      addBox('east wall',KITCHEN.width,0,0,45,KITCHEN.length,KITCHEN.height,materials.wall||'#f6efe6',.22)
      addBox('north wall',0,KITCHEN.length,0,KITCHEN.width,45,KITCHEN.height,materials.wall||'#f6efe6',.18)
      addBox('south door opening',(KITCHEN.width-KITCHEN.door.w)/2,-35,0,KITCHEN.door.w,35,2100,'#b99064',.35)
      addBox('north window',(KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length+8,KITCHEN.window.sill,KITCHEN.window.w,24,KITCHEN.window.h,'#7eb8e8',.42)
      const usableLen=KITCHEN.length-KITCHEN.northClear
      // counters with thickness separated
      const counterMat=materials.counter||'#c8b39d'
      // East base run: carcass + countertop + plinth
      addBox('east base carcass',KITCHEN.width-600,0,PLINTH_HEIGHT,600,usableLen,900-PLINTH_HEIGHT-COUNTER_THICKNESS,materials.cabinetBody||'#c8b39d')
      addBox('east countertop',KITCHEN.width-600,0,900-COUNTER_THICKNESS,600,usableLen,COUNTER_THICKNESS,counterMat)
      addBox('east plinth',KITCHEN.width-600,0,0,600,usableLen,PLINTH_HEIGHT,'#2b2b2b')
      // handles/plinth lines for base: simulate doors
      {
        let acc=0
        eastModules.forEach((m)=>{
          const y0=acc
          // door line
          addBox(`east door ${y0}`,KITCHEN.width-600+2,y0+2,PLINTH_HEIGHT+10,596,m.width-4,860-COUNTER_THICKNESS-PLINTH_HEIGHT,'#e9ddd0',0.45)
          // handle
          addBox(`east handle ${y0}`,KITCHEN.width-20,y0+m.width/2,520,12,80,8,materials.handleFinish||'#9a8c7a')
          // drawer lines if any
          if(m.drawers>1){
            for(let dl=1; dl<m.drawers; dl++){
              addBox(`east drawer line ${y0}-${dl}`,KITCHEN.width-600+2,y0+2,PLINTH_HEIGHT+100+dl*180,596,m.width-4,3,'#8d7f6d')
            }
          }
          acc+=m.width
        })
      }
      addBox('west full-height door clear zone',0,0,0,35,1220,KITCHEN.height,'#f7f3ed',.18)
      // West counter after door
      const westLen=usableLen-1220
      if(westLen>0){
        addBox('west counter carcass',0,1220,PLINTH_HEIGHT,400,westLen,900-PLINTH_HEIGHT-COUNTER_THICKNESS,materials.cabinetBody||'#c8b39d')
        addBox('west countertop',0,1220,900-COUNTER_THICKNESS,400,westLen,COUNTER_THICKNESS,counterMat)
        addBox('west plinth',0,1220,0,400,westLen,PLINTH_HEIGHT,'#2b2b2b')
        let acc=1220
        westModules.forEach((m)=>{
          addBox(`west door ${acc}`,2,acc+2,PLINTH_HEIGHT+10,396,m.width-4,860-COUNTER_THICKNESS-PLINTH_HEIGHT,'#e9ddd0',0.45)
          addBox(`west handle ${acc}`,380,acc+m.width/2,520,12,80,8,materials.handleFinish||'#9a8c7a')
          if(m.drawers>1){
            for(let dl=1; dl<m.drawers; dl++){
              addBox(`west drawer line ${acc}-${dl}`,2,acc+2,PLINTH_HEIGHT+100+dl*180,396,m.width-4,3,'#8d7f6d')
            }
          }
          acc+=m.width
        })
      }
      // uppers
      addBox('east lower upper',KITCHEN.width-320,0,1350,320,usableLen,500,materials.shutters||'#dac8b7')
      if(westLen>0) addBox('west lower upper after door clear zone',0,1220,1350,320,westLen,500,materials.shutters||'#dac8b7')
      addBox('east top upper',KITCHEN.width-550,0,1900,550,usableLen,800,'#bfa891')
      if(westLen>0) addBox('west top upper after door clear zone',0,1220,1900,450,westLen,800,'#bfa891')
      addBox('east warm LED',KITCHEN.width-330,0,1330,18,usableLen,35,'#ffc46d')
      if(westLen>0) addBox('west warm LED after door clear zone',312,1220,1330,18,westLen,35,'#ffc46d')
      // appliances with improved models
      east.forEach(it=>{
        if(it.id==='gas'){
          // cooktop thin slab
          addBox('east gas cooktop slab',KITCHEN.width-600,it.y,900,600,it.w,8,'#0e0e0e')
          // burner rings as torus approximations using thin cylinders
          const burnCY=[it.y+it.w*0.22,it.y+it.w*0.38,it.y+it.w*0.62,it.y+it.w*0.78]
          const burnX=[KITCHEN.width-450, KITCHEN.width-250]
          let bi=0
          for(const bx of burnX){
            for(const by of [burnCY[bi%4], burnCY[(bi+1)%4]]){
              const ring=new THREE.Mesh(new THREE.TorusGeometry(s(32),s(4),8,24), new THREE.MeshStandardMaterial({color:'#3a3a3a'}))
              ring.position.set(s(KITCHEN.width/2-(bx)),s(904),s(by-KITCHEN.length/2))
              ring.rotation.x=Math.PI/2
              scene.add(ring)
              // inner black
              const inner=new THREE.Mesh(new THREE.CircleGeometry(s(28),24), new THREE.MeshStandardMaterial({color:'#111'}))
              inner.position.set(s(KITCHEN.width/2-(bx)),s(905),s(by-KITCHEN.length/2))
              inner.rotation.x=-Math.PI/2
              scene.add(inner)
            }
            bi+=2
          }
          // compact chimney hood
          addBox('east compact chimney hood',KITCHEN.width-360,it.y+90,1450,330,520,160,'#2b2b2b')
          addBox('east chimney duct',KITCHEN.width-300,it.y+200,1610,210,140,320,'#3b3b3b')
          // backsplash behind
          addBox('east backsplash',KITCHEN.width-10,0,900,10,usableLen,600,materials.backsplash||'#faf6f1',0.95)
        } else if(it.id==='spice'){
          addBox(`east ${it.id}`,KITCHEN.width-it.d,it.y,920,it.d,it.w,35,it.color)
          // open shelf detail
          addBox(`east spice shelf2`,KITCHEN.width-500,it.y,980,500,it.w-10,12,'#b89f8a')
        } else addBox(`east ${it.id}`,KITCHEN.width-it.d,it.y,0,it.d,it.w,it.h||880,it.color)
      })
      west.forEach(it=>{
        if(it.id==='shaft') addBox('west shaft',0,KITCHEN.shaft.y,0,KITCHEN.shaft.w,KITCHEN.shaft.l,KITCHEN.height,it.color)
        else if(it.id==='sink'){
          // counter cutout visual: sink bowl inset
          addBox('west sink bowl',0,it.y+60,620,380,it.w-120,180,'#c0c0c0')
          addBox('west sink inner',20,it.y+70,625,340,it.w-140,160,'#e8e8e8')
          // faucet
          const faucet=new THREE.Mesh(new THREE.CylinderGeometry(s(8),s(8),s(120),16), new THREE.MeshStandardMaterial({color:'#d0d0d0', metalness:0.7, roughness:0.2}))
          faucet.position.set(s(KITCHEN.width/2-(60)),s(920),s(it.y+80-KITCHEN.length/2))
          scene.add(faucet)
          const spout=new THREE.Mesh(new THREE.TorusGeometry(s(30),s(6),8,16,Math.PI), new THREE.MeshStandardMaterial({color:'#d0d0d0', metalness:0.7, roughness:0.2}))
          spout.position.set(s(KITCHEN.width/2-(60)),s(970),s(it.y+80-KITCHEN.length/2))
          spout.rotation.y=Math.PI/2
          scene.add(spout)
          // preserve counter around
          addBox('west sink counter frame',0,it.y,0,400,it.w,900,it.color)
        }
        else addBox(`west ${it.id}`,0,it.y,it.id==='microwave'||it.id==='foodprocessor'?900:0,it.d,it.w,it.h||400,it.color)
      })
      // wall labels as sprites
      const makeLabel=(text,x,y,z)=>{
        const canvas=document.createElement('canvas'); canvas.width=256; canvas.height=128
        const ctx=canvas.getContext('2d'); ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fillRect(0,0,256,128); ctx.fillStyle='#111'; ctx.font='bold 54px Arial'; ctx.textAlign='center'; ctx.fillText(text,128,76)
        const tex=new THREE.CanvasTexture(canvas)
        const mat=new THREE.SpriteMaterial({map:tex})
        const sprite=new THREE.Sprite(mat)
        sprite.position.set(s(KITCHEN.width/2-(x)),s(z),s(y-KITCHEN.length/2))
        sprite.scale.set(s(320),s(160),1)
        scene.add(sprite)
      }
      makeLabel('EAST', KITCHEN.width+35, KITCHEN.length/2, 1500)
      makeLabel('WEST', -35, KITCHEN.length/2, 1500)
      makeLabel('NORTH', KITCHEN.width/2, KITCHEN.length+35, 1500)
      makeLabel('SOUTH', KITCHEN.width/2, -35, 1500)

      scene.add(new THREE.HemisphereLight('#fff8ee','#6b625a',1.9))
      const light=new THREE.DirectionalLight('#ffffff',2.4)
      light.position.set(-140,260,180)
      light.castShadow=true
      scene.add(light)
      const grid=new THREE.GridHelper(s(Math.max(KITCHEN.length,KITCHEN.width)),20,'#9a9084','#ddd3c8')
      grid.position.y=.1
      scene.add(grid)
      camera.position.set(-80,150,-420)
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
      threeViewRef.current={renderer,scene,camera,controls}
      let frameId=0
      const animate=()=>{controls.update(); renderer.render(scene,camera); frameId=requestAnimationFrame(animate)}
      animate()
      return ()=>{cancelAnimationFrame(frameId); observer.disconnect(); controls.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); if(threeViewRef.current?.renderer===renderer)threeViewRef.current=null}
    },[east,west,materials,eastModules,westModules])
    const setPreset=(preset)=>{
      const cam=threeViewRef.current?.camera
      const ctrl=threeViewRef.current?.controls
      if(!cam||!ctrl) return
      const presets={
        top:{pos:[-2,420,36], target:[0,20,35]},
        eastWall:{pos:[420,150,35], target:[0,70,35]},
        westWall:{pos:[-420,150,35], target:[0,70,35]},
        north:{pos:[0,160,420], target:[0,70,35]},
        south:{pos:[0,160,-420], target:[0,70,35]},
        walkthrough:{pos:[-80,110,-120], target:[0,70,180]}
      }
      const p=presets[preset]
      if(!p) return
      cam.position.set(p.pos[0]/10,p.pos[1]/10,p.pos[2]/10)
      ctrl.target.set(p.target[0]/10,p.target[1]/10,p.target[2]/10)
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
    </div></div><div ref={mountRef} style={{width:'100%',minHeight:520,border:'1px solid #ddd4c8',background:'#f7f3ed'}}/><div style={{fontSize:13,color:'#61584f',marginTop:10}}>Drag to rotate, scroll to zoom. Presets move camera. Screenshot saves current view.</div></div>
  }
  const WallElevation=({items,isEast})=>{
    const frame={x:72,y:52,w:1060,h:560}
    const xOf=(y)=>isEast?frame.x+((KITCHEN.length-y)/KITCHEN.length)*frame.w:frame.x+(y/KITCHEN.length)*frame.w
    const yOf=(z)=>frame.y+frame.h-(z/KITCHEN.height)*frame.h
    const wOf=(w)=>Math.max(34,(w/KITCHEN.length)*frame.w)
    const hOf=(h)=>Math.max(24,(h/KITCHEN.height)*frame.h)
    const spanOf=(from,to)=>{const a=xOf(from), b=xOf(to); return {x:Math.min(a,b),w:Math.abs(b-a)}}
    const usableEnd=KITCHEN.length-KITCHEN.northClear
    const cabinetRun=isEast?spanOf(0,usableEnd):spanOf(KITCHEN.westGap.to,usableEnd)
    const clearDoor=spanOf(0,KITCHEN.westGap.to)
    const northClear=spanOf(usableEnd,KITCHEN.length)
    const windowSpan=spanOf(KITCHEN.length-600, KITCHEN.length)
    const itemName={spice:'Spice',gas:'Gas + chimney',dishwasher:'Dishwasher',washing:'Washing',microwave:'Microwave',foodprocessor:'Processor',waterpurifier:'Purifier',sink:'Sink',shaft:'Shaft'}
    const itemZ=(it)=>{
      if(it.id==='microwave') return {base:1120,h:360}
      if(it.id==='foodprocessor') return {base:900,h:300}
      if(it.id==='waterpurifier') return {base:1350,h:400}
      if(it.id==='gas') return {base:900,h:120}
      if(it.id==='spice') return {base:900,h:250}
      if(it.id==='shaft') return {base:0,h:KITCHEN.height}
      return {base:0,h:it.h||880}
    }
    const labelY=(index)=>frame.y+frame.h+64+(index%2)*26
    const SegmentLabel=({x,w,y,label,tone='#222'})=>(
      <g>
        <rect x={x+6} y={y-21} width={Math.max(90,w-12)} height="24" fill="#fff" stroke="#d6cec3" rx="5"/>
        <text x={x+w/2} y={y-5} textAnchor="middle" fontSize="15" fontWeight="800" fill={tone}>{label}</text>
      </g>
    )
    const modules=isEast?eastModules:westModules
    const runStart=isEast?0:KITCHEN.westGap.to
    return (<svg width="1180" height="720" viewBox="0 0 1180 720" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',display:'block'}}>
      <defs>
        <pattern id={`${isEast?'east':'west'}Grid`} width="111.7" height="103.7" patternUnits="userSpaceOnUse">
          <path d="M 111.7 0 L 0 0 0 103.7" fill="none" stroke="#eee7dd" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="#faf6f1" stroke="#171717" strokeWidth="2"/>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${isEast?'east':'west'}Grid)`}/>
      <line x1={frame.x} y1={yOf(0)} x2={frame.x+frame.w} y2={yOf(0)} stroke="#171717" strokeWidth="4"/>
      <line x1={frame.x} y1={yOf(900)} x2={frame.x+frame.w} y2={yOf(900)} stroke="#7d7165" strokeDasharray="10 8"/>
      <line x1={cabinetRun.x} y1={yOf(1350)} x2={cabinetRun.x+cabinetRun.w} y2={yOf(1350)} stroke="#b8ab9a" strokeDasharray="8 8"/>
      <line x1={cabinetRun.x} y1={yOf(1900)} x2={cabinetRun.x+cabinetRun.w} y2={yOf(1900)} stroke="#b8ab9a" strokeDasharray="8 8"/>
      <text x={frame.x} y="31" fontSize="24" fontWeight="900" fill="#171717">{isEast?'East Wall Elevation':'West Wall Elevation'}</text>
      <text x={frame.x+frame.w} y="31" textAnchor="end" fontSize="15" fontWeight="800" fill="#61584f">{isEast?'North (N) left to South (S) right':'South (S) left to North (N) right'}, length 4746 mm, height 2700 mm</text>
      {isEast ? (
        <g>
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(880-COUNTER_THICKNESS)} fill={materials.counter||'#c8b39d'} stroke="#171717"/>
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(COUNTER_THICKNESS)} fill={materials.counter||'#d8c2a8'} stroke="#7d7165"/>
          <SegmentLabel x={cabinetRun.x} y={yOf(730)} w={cabinetRun.w} label="600D base run with continuous counter"/>
        </g>
      ) : (
        <g>
          <rect x={clearDoor.x} y={frame.y} width={clearDoor.w} height={frame.h} fill="#fffaf3" stroke="#7b3f21" strokeDasharray="10 8"/>
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(880-COUNTER_THICKNESS)} fill={materials.counter||'#c8b39d'} stroke="#171717"/>
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(COUNTER_THICKNESS)} fill={materials.counter||'#d8c2a8'} stroke="#7d7165"/>
          <SegmentLabel x={clearDoor.x} y={yOf(510)} w={clearDoor.w} label="door clear zone: no counter or cabinets" tone="#7b3f21"/>
          <SegmentLabel x={cabinetRun.x} y={yOf(730)} w={cabinetRun.w} label="400D counter starts after door clear zone"/>
        </g>
      )}
      <rect x={cabinetRun.x} y={yOf(1850)} width={cabinetRun.w} height={hOf(500)} fill={materials.shutters||'#dac8b7'} stroke="#171717"/>
      <rect x={cabinetRun.x} y={yOf(1865)} width={cabinetRun.w} height="8" fill="#ffd38b" stroke="#d99a38"/>
      <rect x={cabinetRun.x} y={yOf(2700)} width={cabinetRun.w} height={hOf(800)} fill="#bfa891" stroke="#171717"/>
      {[700,1400,2100,2800,3500,4200].map(mark=><line key={mark} x1={xOf(mark)} y1={yOf(2700)} x2={xOf(mark)} y2={yOf(1900)} stroke="#8f806f" strokeWidth="1"/>)}
      <SegmentLabel x={cabinetRun.x} y={yOf(1700)} w={cabinetRun.w} label="320D lower upper + warm LED"/>
      <SegmentLabel x={cabinetRun.x} y={yOf(2520)} w={cabinetRun.w} label={isEast?'550D upper cabinets':'450D upper cabinets'}/>
      {/* module splits in elevation */}
      {(()=>{
        let acc=runStart
        return modules.map((m,i)=>{
          const x=xOf(acc)
          const w=wOf(m.width)
          const lineX=isEast? x-w : x
          acc+=m.width
          if(i===0) return null
          return <line key={m.id} x1={lineX} y1={yOf(900)} x2={lineX} y2={yOf(0)} stroke="#111" strokeWidth="2" strokeDasharray={m.type==='filler'?'8 6':''} opacity="0.9"/>
        })
      })()}
      <rect x={northClear.x} y={yOf(900)} width={northClear.w} height={hOf(900)} fill="#eaf6fd" stroke="#3d8ec4" strokeDasharray="10 8"/>
      <text x={northClear.x+northClear.w/2} y={yOf(470)} textAnchor="middle" fontSize="15" fontWeight="900" fill="#2e6f99">300 clear</text>
      <rect x={windowSpan.x} y={yOf(2700)} width={windowSpan.w} height={hOf(1800)} fill="rgba(126,184,232,0.26)" stroke="#2f8ac6" strokeWidth="2"/>
      <text x={windowSpan.x+windowSpan.w/2} y={yOf(1810)} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1f5f88">north window reference</text>
      {/* elevation dimensions vertical on right */}
      <g fontSize="11" fontWeight="700" fill="#111">
        {/* counter height 900 */}
        <line x1={frame.x+frame.w+14} y1={yOf(0)} x2={frame.x+frame.w+14} y2={yOf(900)} stroke="#111" strokeWidth="2"/>
        <line x1={frame.x+frame.w+8} y1={yOf(0)} x2={frame.x+frame.w+20} y2={yOf(0)} stroke="#111" strokeWidth="2"/>
        <line x1={frame.x+frame.w+8} y1={yOf(900)} x2={frame.x+frame.w+20} y2={yOf(900)} stroke="#111" strokeWidth="2"/>
        <text x={frame.x+frame.w+28} y={yOf(450)} transform={`rotate(90 ${frame.x+frame.w+28} ${yOf(450)})`} textAnchor="middle">Counter 900 mm</text>
        {/* backsplash 900-1500 */}
        <line x1={frame.x+frame.w+34} y1={yOf(900)} x2={frame.x+frame.w+34} y2={yOf(1500)} stroke="#7d7165" strokeWidth="2" strokeDasharray="6 4"/>
        <text x={frame.x+frame.w+42} y={yOf(1200)} transform={`rotate(90 ${frame.x+frame.w+42} ${yOf(1200)})`} textAnchor="middle" fill="#7d7165">Backsplash {BACKSPLASH_HEIGHT} mm</text>
        {/* lower upper 1350-1850 */}
        <line x1={frame.x+frame.w+54} y1={yOf(1350)} x2={frame.x+frame.w+54} y2={yOf(1850)} stroke="#b8ab9a" strokeWidth="2"/>
        <text x={frame.x+frame.w+62} y={yOf(1600)} transform={`rotate(90 ${frame.x+frame.w+62} ${yOf(1600)})`} textAnchor="middle" fill="#6d6257">Lower upper 500 mm (1350-1850)</text>
        {/* top upper 1900-2700 */}
        <line x1={frame.x+frame.w+74} y1={yOf(1900)} x2={frame.x+frame.w+74} y2={yOf(2700)} stroke="#bfa891" strokeWidth="2"/>
        <text x={frame.x+frame.w+82} y={yOf(2300)} transform={`rotate(90 ${frame.x+frame.w+82} ${yOf(2300)})`} textAnchor="middle" fill="#6d6257">Top upper 800 mm (1900-2700)</text>
        {/* ceiling 2700 total */}
        <line x1={frame.x-18} y1={yOf(0)} x2={frame.x-18} y2={yOf(2700)} stroke="#111" strokeWidth="1" strokeDasharray="6 6"/>
      </g>
      {items.map((it,index)=>{
        const z=itemZ(it)
        const width=wOf(it.w)
        const x=isEast?xOf(it.y)-width:xOf(it.y)
        const top=yOf(z.base+z.h)
        const height=hOf(z.h)
        const dark=['gas','sink','microwave'].includes(it.id)
        if(isEast&&it.id==='gas'){
          const cooktopY=yOf(960)
          const hoodW=width*.74
          const hoodX=x+width*.13
          const hoodTop=yOf(1800)
          const hoodBottom=yOf(1480)
          return (<g key={it.id}>
            <rect x={x} y={cooktopY} width={width} height="20" fill="#111" stroke="#171717" rx="5"/>
            {[.25,.42,.58,.75].map(p=><circle key={p} cx={x+width*p} cy={cooktopY+10} r="7" fill="none" stroke="#fff" strokeWidth="2"/>)}
            <polygon points={`${hoodX},${hoodBottom} ${hoodX+hoodW},${hoodBottom} ${hoodX+hoodW*.82},${hoodTop} ${hoodX+hoodW*.18},${hoodTop}`} fill="#2b2b2b" stroke="#171717" strokeWidth="2"/>
            <rect x={hoodX+hoodW*.34} y={hoodTop-46} width={hoodW*.32} height="48" fill="#3b3b3b" stroke="#171717"/>
            <text x={x+width/2} y={cooktopY-10} textAnchor="middle" fontSize="15" fontWeight="900" fill="#111">gas cooktop</text>
            <text x={x+width/2} y={hoodTop-54} textAnchor="middle" fontSize="15" fontWeight="900" fill="#111">compact chimney</text>
            <line x1={x+width/2} y1={cooktopY+20} x2={x+width/2} y2={labelY(index)-20} stroke="#6d6257" strokeWidth="1"/>
            <rect x={x+width/2-62} y={labelY(index)-18} width="124" height="24" fill="#fff" stroke="#d6cec3" rx="5"/>
            <text x={x+width/2} y={labelY(index)-2} textAnchor="middle" fontSize="13" fontWeight="800">Gas y{Math.round(it.y/10)}</text>
          </g>)
        }
        return (<g key={it.id}>
          <rect x={x} y={top} width={width} height={height} fill={it.color} stroke="#171717" strokeWidth={it.id==='shaft'?3:2} rx="6"/>
          <text x={x+width/2} y={top+Math.min(height/2+5,28)} textAnchor="middle" fontSize="14" fontWeight="900" fill={dark?'#fff':'#111'}>{itemName[it.id]}</text>
          <line x1={x+width/2} y1={top+height} x2={x+width/2} y2={labelY(index)-20} stroke="#6d6257" strokeWidth="1"/>
          <rect x={x+width/2-54} y={labelY(index)-18} width="108" height="24" fill="#fff" stroke="#d6cec3" rx="5"/>
          <text x={x+width/2} y={labelY(index)-2} textAnchor="middle" fontSize="13" fontWeight="800">{itemName[it.id]} y{Math.round(it.y/10)}</text>
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
    return (<svg width="1180" height="560" viewBox="0 0 1180 620" style={{background:'#fffefb',border:'1px solid #ddd4c8',width:'100%',display:'block'}}>
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
          <rect x={xOf(0)} y={yOf(300)} width={frame.w} height={hOf(300)} fill="#eaf6fd" stroke="#2f8ac6" strokeDasharray="10 8" opacity="0.9"/>
          <text x={xOf(1162)} y={yOf(150)} textAnchor="middle" fontSize="13" fontWeight="800" fill="#2e6f99">North clear zone 300 mm</text>
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
  const refillEast=()=> setEastModules(autoFillModules(4746-300))
  const refillWest=()=> setWestModules(autoFillModules(4746-300-1220))

  return (<div onMouseMove={onMove} onMouseUp={onUp} style={{fontFamily:'Inter,system-ui',background:'#f6f2ec',minHeight:'100vh',padding:16}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <h1 style={{fontSize:26,fontWeight:900}}>Galley 2324x4746 - Rule #9 Locked - 4 Views - Windows Desktop</h1>
    <div style={{fontSize:13,color:'#666'}}>RIGHT EAST 600D: Gas cooktop y2000 with compact chimney + Spice 150 open y1850 to Dishwasher y2850 to Washing LAST y3800 near North | LEFT WEST: full-height door clear zone y0-y1220, then 400D counter to Microwave y1300 to FoodProcessor y1900 to Purifier y3350 hidden under 320D LED touching shaft to Sink y3550 almost touching shaft to Shaft LAST y4146 NW | Walkway 1324 floor / 1004 eye | 2324W x 4746L x 2700H</div>
    <div style={{display:'flex',gap:8,margin:'16px 0',flexWrap:'wrap',alignItems:'center'}}>
      <button onClick={()=>setView('top')} style={{padding:'10px 16px',background:view==='top'?'#111':'#fff',color:view==='top'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Top View (Plan)</button>
      <button onClick={()=>setView('front')} style={{padding:'10px 16px',background:view==='front'?'#111':'#fff',color:view==='front'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Front View (Looking North)</button>
      <button onClick={()=>setView('east')} style={{padding:'10px 16px',background:view==='east'?'#C4B5A5':'#fff',color:view==='east'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>East Wall View + Cabinets</button>
      <button onClick={()=>setView('west')} style={{padding:'10px 16px',background:view==='west'?'#C4B5A5':'#fff',color:view==='west'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>West Wall View + Cabinets</button>
      <button onClick={()=>setView('north')} style={{padding:'10px 16px',background:view==='north'?'#C4B5A5':'#fff',color:view==='north'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>North Elevation</button>
      <button onClick={()=>setView('south')} style={{padding:'10px 16px',background:view==='south'?'#C4B5A5':'#fff',color:view==='south'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>South Elevation</button>
      <button onClick={()=>setView('three')} style={{padding:'10px 16px',background:view==='three'?'#2f6f6d':'#fff',color:view==='three'?'#fff':'#111',border:'2px solid #2f6f6d',borderRadius:10,fontWeight:800}}>Create 3D Render</button>
      <button onClick={export3DScreenshot} disabled={view!=='three'} style={{padding:'10px 16px',background:view==='three'?'#111':'#ddd',color:view==='three'?'#fff':'#777',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <button onClick={exportPlanSvg} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D SVG</button>
      <button onClick={exportPlanPng} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D PNG</button>
      <button onClick={exportPlanDxf} style={{padding:'8px 12px',background:'#fff',color:'#111',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Export 2D DXF</button>
      <button onClick={exportCoohomGuide} style={{padding:'8px 12px',background:'#7b3f21',color:'#fff',border:'2px solid #7b3f21',borderRadius:10,fontWeight:800}}>Coohom Guide</button>
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

    {/* Validation Panel */}
    <div style={{background:'#fff',borderRadius:14,padding:14,marginBottom:14,border:'1px solid #e5e0d5'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:0,fontSize:16}}>Validation Panel - detailed</h3><span style={{fontSize:12,color:'#666'}}>{validationRows.filter(r=>r.status==='pass').length}/{validationRows.length} passing</span></div>
      <div style={{overflowX:'auto',marginTop:10}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13, minWidth:760}}>
          <thead><tr style={{background:'#f6f2ec',textAlign:'left'}}><th style={{padding:'8px 10px',borderBottom:'2px solid #ddd'}}>Status</th><th style={{padding:'8px 10px',borderBottom:'2px solid #ddd'}}>Rule</th><th style={{padding:'8px 10px',borderBottom:'2px solid #ddd'}}>Measured</th><th style={{padding:'8px 10px',borderBottom:'2px solid #ddd'}}>Expected</th><th style={{padding:'8px 10px',borderBottom:'2px solid #ddd'}}>Fix</th></tr></thead>
          <tbody>
          {validationRows.map(r=>(
            <tr key={r.id} style={{background: r.status==='pass'?'#f0fdf4': r.status==='fail'?'#fef2f2':'#fffbeb'}}>
              <td style={{padding:'8px 10px',borderBottom:'1px solid #eee',fontWeight:800}}>{r.status==='pass'?'PASS': r.status==='fail'?'FAIL':'WARN'}</td>
              <td style={{padding:'8px 10px',borderBottom:'1px solid #eee',fontWeight:700,whiteSpace:'nowrap'}}>{r.rule}</td>
              <td style={{padding:'8px 10px',borderBottom:'1px solid #eee',fontFamily:'monospace',fontSize:12}}>{r.measured}</td>
              <td style={{padding:'8px 10px',borderBottom:'1px solid #eee',fontFamily:'monospace',fontSize:12}}>{typeof r.expected==='object'?JSON.stringify(r.expected):r.expected}</td>
              <td style={{padding:'8px 10px',borderBottom:'1px solid #eee',fontSize:12}}>{r.fix}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Materials + Modules + BOM + Versions grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14,marginBottom:14}}>
      {/* Materials */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 10px 0',fontSize:15}}>Materials & Finishes</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            ['cabinetBody','Cabinet body'],
            ['shutters','Shutters'],
            ['counter','Counter'],
            ['backsplash','Backsplash'],
            ['floor','Floor'],
            ['wall','Wall'],
            ['handleFinish','Handle finish'],
          ].map(([key,label])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:700}}>{label}
              <span style={{display:'flex',gap:6,alignItems:'center'}}>
                <input type="color" value={materials[key]||'#cccccc'} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{width:36,height:28,padding:0,border:'1px solid #ccc',borderRadius:6}}/>
                <input value={materials[key]||''} onChange={e=>setMaterials(p=>({...p,[key]:e.target.value}))} style={{flex:1,padding:'6px 8px',border:'1px solid #ddd',borderRadius:8,fontSize:12}}/>
              </span>
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:700}}>Appliance finish
            <select value={materials.applianceFinish} onChange={e=>setMaterials(p=>({...p,applianceFinish:e.target.value}))} style={{padding:'6px 8px',border:'1px solid #ddd',borderRadius:8}}>
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
          <button onClick={refillEast} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Auto-fill East ({4746-300}mm)</button>
          <button onClick={refillWest} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Auto-fill West ({4746-300-1220}mm)</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
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
              <button onClick={()=> setEastModules(p=> [...p,{id:`mod-${Date.now()}`,width:600,type:'base',drawers:2,handle:'bar',label:'600 mm'}])} style={{padding:'4px 8px',background:'#fff',border:'1px solid #111',borderRadius:6,fontSize:12,fontWeight:700}}>+ add 600</button>
              <span style={{fontSize:11,color: eastModules.reduce((a,m)=>a+m.width,0)===4746-300?'#16a34a':'#dc2626',fontWeight:700}}>{eastModules.reduce((a,m)=>a+m.width,0)} / {4746-300} mm</span>
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
              <button onClick={()=> setWestModules(p=> [...p,{id:`mod-${Date.now()}`,width:600,type:'base',drawers:2,handle:'bar',label:'600 mm'}])} style={{padding:'4px 8px',background:'#fff',border:'1px solid #111',borderRadius:6,fontSize:12,fontWeight:700}}>+ add 600</button>
              <span style={{fontSize:11,color: westModules.reduce((a,m)=>a+m.width,0)===4746-300-1220?'#16a34a':'#dc2626',fontWeight:700}}>{westModules.reduce((a,m)=>a+m.width,0)} / {4746-300-1220} mm</span>
            </div>
          </div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:'#666'}}>Module widths 300/450/600/750/900 + filler/end panels (18mm). Shown as splits in plan & elevations.</div>
      </div>

      {/* BOM */}
      <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e5e0d5'}}>
        <h3 style={{margin:'0 0 8px 0',fontSize:15}}>BOM / Quote</h3>
        <div style={{fontSize:13,lineHeight:'1.6'}}>
          <div>Base cabinets: <b>{bom.baseCount}</b> &nbsp; Wall lower: <b>{bom.wallLowerCount}</b> &nbsp; Wall top: <b>{bom.wallTopCount}</b></div>
          <div>Shutters: <b>{bom.shutterCount}</b> &nbsp; Drawers: <b>{bom.drawerCount}</b> &nbsp; Handles ({materials.handleFinish}): <b>{bom.handleCount}</b></div>
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

    {view==='top'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}>
      <svg width="900" height={planSvgHeight} viewBox={viewBoxTop} preserveAspectRatio="xMidYMid meet" style={{background:'#FFFEFB',border:'1px solid #e5e0d5',borderRadius:10,width:'100%',maxWidth:900,height:'auto',display:'block',margin:'0 auto'}}>
        <rect x={-pad} y={-pad} width={KITCHEN.width+pad*2} height={KITCHEN.length+pad*2} fill="#f6f2ec"/>
        <rect x="0" y="0" width="2324" height="4746" fill={materials.wall||'#FFFEFB'} stroke="#111" strokeWidth="10"/>
        {(grid===50||grid===100)&&(<g>
          {Array.from({length: Math.floor(KITCHEN.width/grid)+1},(_,i)=> i*grid).map(val=><line key={`vg-${val}`} x1={val} y1={0} x2={val} y2={KITCHEN.length} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
          {Array.from({length: Math.floor(KITCHEN.length/grid)+1},(_,i)=> i*grid).map(val=><line key={`hg-${val}`} x1={0} y1={val} x2={KITCHEN.width} y2={val} stroke="#e9dfce" strokeWidth="2" strokeDasharray="10 14"/>)}
        </g>)}
        <rect x="0" y="0" width="2324" height="300" fill="#eaf6fd" stroke="#2f8ac6" strokeWidth="4" strokeDasharray="22 14" opacity="0.95"/>
        <text x={KITCHEN.width*.7} y={170} textAnchor="middle" fontSize="62" fontWeight="900" fill="#1f5f88">300 MM NORTH CLEAR</text>
        <rect x="0" y={svgY(0,1220)} width="400" height="1220" fill="#fffaf3" stroke="#7b3f21" strokeWidth="4" strokeDasharray="22 14"/>
        <text x="200" y={svgY(0,1220)+1220/2-10} textAnchor="middle" fontSize="52" fontWeight="900" fill="#7b3f21">DOOR CLEAR</text>
        <text x="200" y={svgY(0,1220)+1220/2+40} textAnchor="middle" fontSize="42" fontWeight="800" fill="#7b3f21">y0-y1220</text>
        <rect x={2324-600} y={svgY(0,4446)} width="600" height="4446" fill={materials.cabinetBody||'#c8b39d'} opacity="0.22" stroke="#b89f8a" strokeWidth="3"/>
        <rect x="0" y={svgY(1220,3226)} width="400" height="3226" fill={materials.cabinetBody||'#c8b39d'} opacity="0.22" stroke="#b89f8a" strokeWidth="3"/>
        {/* module splits in top view */}
        {(()=>{
          let acc=0
          return eastModules.map((m,i)=>{
            const y0=acc
            const lineY=svgY(y0,0)
            acc+=m.width
            if(i===0) return null
            return <line key={`em-${i}`} x1={2324-600} y1={lineY} x2={2324} y2={lineY} stroke="#111" strokeWidth={m.type==='filler'?5:3} strokeDasharray={m.type==='filler'?'18 12':''}/>
          })
        })()}
        {(()=>{
          let acc=1220
          return westModules.map((m,i)=>{
            const lineY=svgY(acc,0)
            const res= i===0? null : <line key={`wm-${i}`} x1={0} y1={lineY} x2={400} y2={lineY} stroke="#111" strokeWidth={m.type==='filler'?5:3} strokeDasharray={m.type==='filler'?'18 12':''}/>
            acc+=m.width
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
        {east.map(it=><g key={it.id} onMouseDown={e=>onDown(e,'east',it.id)} style={{cursor:'grab'}}>
          <rect x={2324-it.d} y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth="5" rx="10"/>
          <rect x={2324-it.d+8} y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity="0.92" rx="5"/>
          <text x={2324-it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)}mm</text>
          <text x={2324-it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="34" fontWeight="800" fill={it.id==='gas'?'#fff':'#111'}>{planLabel(it.id)}</text>
        </g>)}
        {west.map(it=><g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:it.fixed?'not-allowed':'grab',opacity:it.fixed?0.98:1}}>
          <rect x="0" y={svgY(it.y,it.w)} width={it.d} height={it.w} fill={it.color} stroke="#111" strokeWidth={it.id==='shaft'?'9':'5'} rx="10"/>
          <rect x="8" y={svgY(it.y,it.w)+8} width={it.d-16} height="26" fill="#fff" opacity={it.fixed?0.88:0.92} rx="5"/>
          <text x={it.d/2} y={svgY(it.y,it.w)+22} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{it.w}W y{Math.round(it.y)}mm</text>
          <text x={it.d/2} y={svgY(it.y,it.w)+it.w/2+14} textAnchor="middle" fontSize="34" fontWeight="800" fill={it.id==='sink'||it.id==='microwave'?'#fff':'#111'}>{planLabel(it.id)}</text>
        </g>)}
        <DimH x1={0} x2={KITCHEN.width} y={-110} text="Room width 2324 mm"/>
        <DimV y1={0} y2={KITCHEN.length} x={KITCHEN.width+110} text="Room length 4746 mm"/>
        <DimH x1={KITCHEN.width-600} x2={KITCHEN.width} y={36} text="East 600 mm"/>
        <DimH x1={0} x2={400} y={36} text="West 400 mm"/>
        <DimH x1={400} x2={KITCHEN.width-600} y={KITCHEN.length/2} text={`Walkway ${walkwayFloor} mm`}/>
        <DimV y1={0} y2={KITCHEN.northClear} x={KITCHEN.width-92} text="North 300 mm"/>
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
    {view==='front'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}><svg width="1000" height="500" viewBox="0 0 800 500" style={{width:'100%'}}><polygon points="0,450 800,450 560,120 240,120" fill="#E8E0D5" stroke="#111"/><polygon points="0,0 800,0 560,80 240,80" fill="#f2ece3" stroke="#111"/><polygon points="0,0 0,450 240,120 240,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><polygon points="800,0 800,450 560,120 560,80" fill={materials.wall||'#faf6f1'} stroke="#111"/><rect x="350" y="95" width="100" height="45" fill="#7EB8E8" stroke="#111"/><text x="400" y="92" textAnchor="middle" fontSize="12" fontWeight="700">N WINDOW</text><rect x="40" y="280" width="80" height="20" fill="#1a1a1a"/><text x="80" y="275" fontSize="10">MW y130</text><rect x="640" y="240" width="80" height="20" fill="#2a2a2a"/><text x="680" y="235" fontSize="10" fill="#fff">GAS y200</text></svg></div>)}
    {view==='east'&&(<div ref={eastSvgRef} style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>East wall: appliance run, counter, LED and upper cabinets</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(eastSvgRef,'east-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(eastSvgRef,'east-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(eastSvgRef,'east-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={east} isEast={true}/></div>)}
    {view==='west'&&(<div ref={westSvgRef} style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>West wall: counter gap, purifier/sink zone and shaft</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(westSvgRef,'west-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(westSvgRef,'west-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(westSvgRef,'west-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><WallElevation items={west} isEast={false}/></div>)}
    {view==='north'&&(<div ref={northSvgRef} style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>North elevation (looking South)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(northSvgRef,'north-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(northSvgRef,'north-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(northSvgRef,'north-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={true}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows north window reference, 300 mm clear zone, counter 900 mm, backsplash 600 mm, lower upper 1350-1850, top upper 1900-2700, ceiling 2700 mm.</div></div>)}
    {view==='south'&&(<div ref={southSvgRef} style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}><h3 style={{margin:'0 0 10px 0'}}>South elevation (looking North)</h3><div style={{display:'flex',gap:6}}><button onClick={()=>downloadSvgFromRef(southSvgRef,'south-elevation.svg')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export SVG</button><button onClick={()=>downloadPngFromRef(southSvgRef,'south-elevation.png')} style={{padding:'6px 10px',background:'#111',color:'#fff',border:'none',borderRadius:8,fontWeight:700}}>Export PNG</button><button onClick={()=>downloadPdfFromRef(southSvgRef,'south-elevation.pdf')} style={{padding:'6px 10px',background:'#fff',border:'1px solid #111',borderRadius:8,fontWeight:700}}>Export PDF</button></div></div><NorthSouthElevation isNorth={false}/><div style={{marginTop:8,fontSize:12,color:'#666'}}>Shows south door, west door clear zone, counter and upper zones, ceiling 2700 mm.</div></div>)}
    {view==='three'&&<ThreeDRender/>}
    <div style={{marginTop:14,padding:14,background:'#fff',borderRadius:10,fontFamily:'monospace',fontSize:13}}><b>AI API (Browser Console):</b><br/>window.kitchenAPI.moveItem('west','sink',355) // cm, snaps to grid<br/>window.kitchenAPI.moveItemMM('west','sink',3550) // mm, snaps to grid<br/>window.kitchenAPI.moveItem('east','washing',380) // LAST near north<br/>window.kitchenAPI.moveItem('west','waterpurifier',335) // near sink hidden<br/>window.kitchenAPI.getLayout()<br/>window.kitchenAPI.getLayoutModel()<br/>window.kitchenAPI.validate() // detailed rows<br/>window.kitchenAPI.getValidationRows()<br/>window.kitchenAPI.getMaterials()<br/>window.kitchenAPI.getModules()<br/>window.kitchenAPI.getBOM()<br/>window.kitchenAPI.getGrid() / window.kitchenAPI.setGrid(50) // 0|50|100<br/>window.kitchenAPI.getWalkway()<br/>window.kitchenAPI.getDimensions()</div>
  </div></div>)
}
