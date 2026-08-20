import React,{useState,useEffect} from 'react'
import {KITCHEN,EAST_INIT,WEST_INIT} from './config/kitchenConfig.js'
import {useRef} from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
export default function App(){
  const [east,setEast]=useState(EAST_INIT); const [west,setWest]=useState(WEST_INIT)
  const [view,setView]=useState('top'); const [drag,setDrag]=useState(null)
  const threeViewRef=useRef(null)
  const scale=0.11
  const validate=()=>{
    const e=[...east].sort((a,b)=>a.y-b.y); const gas=e.find(x=>x.id==='gas'), dw=e.find(x=>x.id==='dishwasher'), wm=e.find(x=>x.id==='washing')
    const eastOk=gas&&dw&&wm&&gas.y<dw.y&&dw.y<wm.y&&wm.last
    const w=[...west].sort((a,b)=>a.y-b.y); const mw=w.find(x=>x.id==='microwave'), fp=w.find(x=>x.id==='foodprocessor'), wp=w.find(x=>x.id==='waterpurifier'), sk=w.find(x=>x.id==='sink'), sh=w.find(x=>x.id==='shaft')
    const westOk=mw&&fp&&wp&&sk&&sh&&mw.y<fp.y&&fp.y<wp.y&&wp.y<sk.y&&Math.abs(wp.y-sk.y)<350&&sk.y<sh.y&&sh.last
    return {eastOk,westOk,all:eastOk&&westOk}
  }
  const v=validate()
  useEffect(()=>{window.kitchenAPI={
    moveItem:(wall,id,ycm)=>{const y=ycm*10; if(wall==='east')setEast(p=>p.map(it=>it.id===id?{...it,y}:it)); else setWest(p=>p.map(it=>it.id===id&&!it.fixed?{...it,y}:it))},
    getLayout:()=>({kitchen:KITCHEN,east,west,validation:v}), validate:()=>v, reset:()=>{setEast(EAST_INIT);setWest(WEST_INIT)}
  }},[east,west])
  const onDown=(e,wall,id)=>{const it=[...east,...west].find(x=>x.id===id); if(it?.fixed)return; setDrag({wall,id,startY:e.clientY,startItemY:it.y})}
  const onMove=(e)=>{if(!drag)return; const dy=(e.clientY-drag.startY)/scale; const ny=Math.max(0,Math.min(KITCHEN.length-600,drag.startItemY+dy)); if(drag.wall==='east')setEast(p=>p.map(it=>it.id===drag.id?{...it,y:ny}:it)); else setWest(p=>p.map(it=>it.id===drag.id?{...it,y:ny}:it))}
  const onUp=()=>setDrag(null)
  const exportJSON=()=>{const data={kitchen:KITCHEN,east,west,validation:v, rule:"Rule9: Gas middle to DW to WM LAST, MW to FP to Purifier near sink to Sink to Shaft LAST"}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='Galley_2324x4746_Rule9_Current.json'; a.click()}
  const export3DScreenshot=()=>{const view3d=threeViewRef.current; if(!view3d)return; view3d.renderer.render(view3d.scene,view3d.camera); const a=document.createElement('a'); a.href=view3d.renderer.domElement.toDataURL('image/png'); a.download='kitchen-3d-render.png'; a.click()}
  const ThreeDRender=()=>{
    const mountRef=useRef(null)
    useEffect(()=>{
      const mount=mountRef.current
      if(!mount)return
      const scene=new THREE.Scene()
      scene.background=new THREE.Color('#f7f3ed')
      const camera=new THREE.PerspectiveCamera(42,1,1,2000)
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
      renderer.shadowMap.enabled=true
      mount.appendChild(renderer.domElement)
      const controls=new OrbitControls(camera,renderer.domElement)
      controls.enableDamping=true
      controls.target.set(0,70,35)
      const s=(n)=>n/10
      const material=(c,opacity=1)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),roughness:.72,metalness:.04,transparent:opacity<1,opacity})
      const addBox=(name,x,y,z,w,d,h,c,opacity=1)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(s(w),s(h),s(d)),material(c,opacity))
        mesh.name=name
        mesh.position.set(s(x+w/2-KITCHEN.width/2),s(z+h/2),s(y+d/2-KITCHEN.length/2))
        mesh.castShadow=true
        mesh.receiveShadow=true
        scene.add(mesh)
        return mesh
      }
      addBox('floor',0,0,-30,KITCHEN.width,KITCHEN.length,30,'#ded6cc')
      addBox('west wall',-45,0,0,45,KITCHEN.length,KITCHEN.height,'#f6efe6',.22)
      addBox('east wall',KITCHEN.width,0,0,45,KITCHEN.length,KITCHEN.height,'#f6efe6',.22)
      addBox('north wall',0,KITCHEN.length,0,KITCHEN.width,45,KITCHEN.height,'#f6efe6',.18)
      addBox('south door opening',(KITCHEN.width-KITCHEN.door.w)/2,-35,0,KITCHEN.door.w,35,2100,'#b99064',.35)
      addBox('north window',(KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length+8,KITCHEN.window.sill,KITCHEN.window.w,24,KITCHEN.window.h,'#7eb8e8',.42)
      const usableLen=KITCHEN.length-KITCHEN.northClear
      addBox('east base counter',KITCHEN.width-600,0,0,600,usableLen,900,'#c8b39d')
      addBox('west full-height door clear zone',0,0,0,35,1220,KITCHEN.height,'#f7f3ed',.18)
      addBox('west counter after door clear zone',0,1220,0,400,usableLen-1220,900,'#c8b39d')
      addBox('east lower upper',KITCHEN.width-320,0,1350,320,usableLen,500,'#dac8b7')
      addBox('west lower upper after door clear zone',0,1220,1350,320,usableLen-1220,500,'#dac8b7')
      addBox('east top upper',KITCHEN.width-550,0,1900,550,usableLen,800,'#bfa891')
      addBox('west top upper after door clear zone',0,1220,1900,450,usableLen-1220,800,'#bfa891')
      addBox('east warm LED',KITCHEN.width-330,0,1330,18,usableLen,35,'#ffc46d')
      addBox('west warm LED after door clear zone',312,1220,1330,18,usableLen-1220,35,'#ffc46d')
      east.forEach(it=>{
        if(it.id==='gas'){
          addBox('east gas cooktop',KITCHEN.width-600,it.y,900,600,it.w,45,'#151515')
          addBox('east compact chimney hood',KITCHEN.width-360,it.y+90,1450,330,520,260,'#2b2b2b')
        } else addBox(`east ${it.id}`,KITCHEN.width-it.d,it.y,0,it.d,it.w,it.h||880,it.color)
      })
      west.forEach(it=>{
        if(it.id==='shaft') addBox('west shaft',0,KITCHEN.shaft.y,0,KITCHEN.shaft.w,KITCHEN.shaft.l,KITCHEN.height,it.color)
        else addBox(`west ${it.id}`,0,it.y,it.id==='microwave'||it.id==='foodprocessor'?900:0,it.d,it.w,it.h||400,it.color)
      })
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
      threeViewRef.current={renderer,scene,camera}
      let frameId=0
      const animate=()=>{controls.update(); renderer.render(scene,camera); frameId=requestAnimationFrame(animate)}
      animate()
      return ()=>{cancelAnimationFrame(frameId); observer.disconnect(); controls.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); if(threeViewRef.current?.renderer===renderer)threeViewRef.current=null}
    },[east,west])
    return <div style={{background:'#fff',borderRadius:14,padding:14}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:10,flexWrap:'wrap'}}><h3 style={{margin:0}}>3D Render - current Rule #9 layout</h3><button onClick={export3DScreenshot} style={{padding:'10px 16px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button></div><div ref={mountRef} style={{width:'100%',minHeight:520,border:'1px solid #ddd4c8',background:'#f7f3ed'}}/><div style={{fontSize:13,color:'#61584f',marginTop:10}}>Drag to rotate, scroll to zoom. Screenshot saves the current camera view.</div></div>
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
    const windowSpan=spanOf(KITCHEN.length-KITCHEN.window.w,KITCHEN.length)
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
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(850)} fill="#c8b39d" stroke="#171717"/>
          <SegmentLabel x={cabinetRun.x} y={yOf(730)} w={cabinetRun.w} label="600D base run with continuous counter"/>
        </g>
      ) : (
        <g>
          <rect x={clearDoor.x} y={frame.y} width={clearDoor.w} height={frame.h} fill="#fffaf3" stroke="#7b3f21" strokeDasharray="10 8"/>
          <rect x={cabinetRun.x} y={yOf(900)} width={cabinetRun.w} height={hOf(850)} fill="#c8b39d" stroke="#171717"/>
          <SegmentLabel x={clearDoor.x} y={yOf(510)} w={clearDoor.w} label="door clear zone: no counter or cabinets" tone="#7b3f21"/>
          <SegmentLabel x={cabinetRun.x} y={yOf(730)} w={cabinetRun.w} label="400D counter starts after door clear zone"/>
        </g>
      )}

      <rect x={cabinetRun.x} y={yOf(1850)} width={cabinetRun.w} height={hOf(500)} fill="#dac8b7" stroke="#171717"/>
      <rect x={cabinetRun.x} y={yOf(1865)} width={cabinetRun.w} height="8" fill="#ffd38b" stroke="#d99a38"/>
      <rect x={cabinetRun.x} y={yOf(2700)} width={cabinetRun.w} height={hOf(800)} fill="#bfa891" stroke="#171717"/>
      {[700,1400,2100,2800,3500,4200].map(mark=><line key={mark} x1={xOf(mark)} y1={yOf(2700)} x2={xOf(mark)} y2={yOf(1900)} stroke="#8f806f" strokeWidth="1"/>)}
      <SegmentLabel x={cabinetRun.x} y={yOf(1700)} w={cabinetRun.w} label="320D lower upper + warm LED"/>
      <SegmentLabel x={cabinetRun.x} y={yOf(2520)} w={cabinetRun.w} label={isEast?'550D upper cabinets':'450D upper cabinets'}/>

      <rect x={northClear.x} y={yOf(900)} width={northClear.w} height={hOf(900)} fill="#eaf6fd" stroke="#3d8ec4" strokeDasharray="10 8"/>
      <text x={northClear.x+northClear.w/2} y={yOf(470)} textAnchor="middle" fontSize="15" fontWeight="900" fill="#2e6f99">300 clear</text>

      <rect x={windowSpan.x} y={yOf(2700)} width={windowSpan.w} height={hOf(1800)} fill="rgba(126,184,232,0.26)" stroke="#2f8ac6" strokeWidth="2"/>
      <text x={windowSpan.x+windowSpan.w/2} y={yOf(1810)} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1f5f88">north window reference</text>

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
  return (<div onMouseMove={onMove} onMouseUp={onUp} style={{fontFamily:'Inter,system-ui',background:'#f6f2ec',minHeight:'100vh',padding:16}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <h1 style={{fontSize:26,fontWeight:900}}>Galley 2324x4746 - Rule #9 Locked - 4 Views - Windows Desktop</h1>
    <div style={{fontSize:13,color:'#666'}}>RIGHT EAST 600D: Gas cooktop y2000 with compact chimney + Spice 150 open y1850 to Dishwasher y2850 to Washing LAST y3800 near North | LEFT WEST: full-height door clear zone y0-y1220, then 400D counter to Microwave y1300 to FoodProcessor y1900 to Purifier y3350 hidden under 320D LED touching shaft to Sink y3550 almost touching shaft to Shaft LAST y4146 NW | Walkway 1324 floor / 1004 eye | 2324W x 4746L x 2700H</div>
    <div style={{display:'flex',gap:10,margin:'16px 0',flexWrap:'wrap'}}>
      <button onClick={()=>setView('top')} style={{padding:'10px 18px',background:view==='top'?'#111':'#fff',color:view==='top'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Top View (Plan)</button>
      <button onClick={()=>setView('front')} style={{padding:'10px 18px',background:view==='front'?'#111':'#fff',color:view==='front'?'#fff':'#111',border:'2px solid #111',borderRadius:10,fontWeight:800}}>Front View (Looking North)</button>
      <button onClick={()=>setView('east')} style={{padding:'10px 18px',background:view==='east'?'#C4B5A5':'#fff',color:view==='east'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>East Wall View + Cabinets</button>
      <button onClick={()=>setView('west')} style={{padding:'10px 18px',background:view==='west'?'#C4B5A5':'#fff',color:view==='west'?'#111':'#111',border:'2px solid #C4B5A5',borderRadius:10,fontWeight:800}}>West Wall View + Cabinets</button>
      <button onClick={()=>setView('three')} style={{padding:'10px 18px',background:view==='three'?'#2f6f6d':'#fff',color:view==='three'?'#fff':'#111',border:'2px solid #2f6f6d',borderRadius:10,fontWeight:800}}>Create 3D Render</button>
      <button onClick={export3DScreenshot} disabled={view!=='three'} style={{padding:'10px 18px',background:view==='three'?'#111':'#ddd',color:view==='three'?'#fff':'#777',border:'none',borderRadius:10,fontWeight:800}}>3D Screenshot</button>
      <button onClick={exportJSON} style={{padding:'10px 18px',background:'#111',color:'#fff',border:'none',borderRadius:10,fontWeight:800}}>Export JSON</button>
      <span style={{padding:'10px 14px',background:v.all?'#d1fae5':'#fee2e2',borderRadius:10,fontWeight:800}}>{v.all?'Rule #9 Valid':'Invalid'} East:{v.eastOk?'OK':'No'} West:{v.westOk?'OK':'No'}</span>
    </div>
    {view==='top'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}><svg width="900" height="520" viewBox="0 0 2324 4746" style={{background:'#FFFEFB',border:'1px solid #e5e0d5',borderRadius:10,width:'100%',maxWidth:700}}><rect x="0" y="0" width="2324" height="4746" fill="#E8E0D5" stroke="#111" strokeWidth="12"/><rect x="612" y="4646" width="1100" height="100" fill="#f6f2ec" stroke="#111" strokeWidth="8"/><rect x="612" y="0" width="1100" height="100" fill="#7EB8E8" stroke="#111" strokeWidth="8"/>{east.map(it=><g key={it.id} onMouseDown={e=>onDown(e,'east',it.id)} style={{cursor:'grab'}}><rect x={2324-600} y={it.y} width={600} height={it.d} fill={it.color} stroke="#111" strokeWidth="6" rx="12"/><text x={2324-300} y={it.y+it.d/2} textAnchor="middle" fontSize="90" fontWeight="800">{it.label} y{Math.round(it.y/10)}</text></g>)} {west.map(it=><g key={it.id} onMouseDown={e=>onDown(e,'west',it.id)} style={{cursor:it.fixed?'not-allowed':'grab'}}><rect x="0" y={it.y} width={400} height={it.d} fill={it.color} stroke="#111" strokeWidth={it.id==='shaft'?'12':'6'} rx="12"/><text x="200" y={it.y+it.d/2} textAnchor="middle" fontSize="90" fontWeight="800" fill={it.id==='sink'||it.id==='microwave'?'#fff':'#111'}>{it.label} y{Math.round(it.y/10)}</text></g>)} </svg><div style={{fontSize:13,marginTop:10}}>Drag Y only - South 0 bottom to North 4746 top. Washing & Shaft LAST. Purifier within 350 of sink.</div></div>)}
    {view==='front'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}><svg width="1000" height="500" viewBox="0 0 800 500" style={{width:'100%'}}><polygon points="0,450 800,450 560,120 240,120" fill="#E8E0D5" stroke="#111"/><polygon points="0,0 800,0 560,80 240,80" fill="#f2ece3" stroke="#111"/><polygon points="0,0 0,450 240,120 240,80" fill="#faf6f1" stroke="#111"/><polygon points="800,0 800,450 560,120 560,80" fill="#faf6f1" stroke="#111"/><rect x="350" y="95" width="100" height="45" fill="#7EB8E8" stroke="#111"/><text x="400" y="92" textAnchor="middle" fontSize="12" fontWeight="700">N WINDOW</text><rect x="40" y="280" width="80" height="20" fill="#1a1a1a"/><text x="80" y="275" fontSize="10">MW y130</text><rect x="640" y="240" width="80" height="20" fill="#2a2a2a"/><text x="680" y="235" fontSize="10" fill="#fff">GAS y200</text></svg></div>)}
    {view==='east'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}><h3 style={{margin:'0 0 10px 0'}}>East wall: appliance run, counter, LED and upper cabinets</h3><WallElevation items={east} isEast={true}/></div>)}
    {view==='west'&&(<div style={{background:'#fff',borderRadius:14,padding:14}}><h3 style={{margin:'0 0 10px 0'}}>West wall: counter gap, purifier/sink zone and shaft</h3><WallElevation items={west} isEast={false}/></div>)}
    {view==='three'&&<ThreeDRender/>}
    <div style={{marginTop:14,padding:14,background:'#fff',borderRadius:10,fontFamily:'monospace',fontSize:13}}><b>AI API (Windows Console):</b><br/>window.kitchenAPI.moveItem('west','sink',3550) // almost touching shaft<br/>window.kitchenAPI.moveItem('east','washing',3800) // LAST near north<br/>window.kitchenAPI.moveItem('west','waterpurifier',3350) // near sink hidden<br/>window.kitchenAPI.getLayout()<br/>window.kitchenAPI.validate()</div>
  </div></div>)
}

