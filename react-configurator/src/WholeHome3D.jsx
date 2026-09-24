import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import floorPlanImage from '../../Interior/home a 501 floor - unmodified.png'
import {EMPTY_ROOM_SHELLS} from './config/roomShellConfig.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'
import {BALCONY_OFFICE,BALCONY_DESK_HEIGHT_KEY} from './config/balconyOfficeConfig.js'
import {KITCHEN,EAST_INIT,WEST_INIT,KITCHEN_AUTOSAVE_KEY,autoFillModules} from './config/kitchenConfig.js'

// The A501 plan is south-up: image right is west and image down is north.
const PLAN_WIDTH=800,PLAN_HEIGHT=875
const X_METRES_PER_PIXEL=4.993/260
const Z_METRES_PER_PIXEL=3.277/163
const X=x=>x*X_METRES_PER_PIXEL
const Z=y=>y*Z_METRES_PER_PIXEL
const W=X(PLAN_WIDTH),L=Z(PLAN_HEIGHT),HEIGHT=2.45

const ROOMS=[
  {name:'Bedroom 3',bounds:[50,198,255,390],color:'#db8b47'},
  {name:'Study',bounds:[255,198,424,444],color:'#7c93b8'},
  {name:'Balcony office',bounds:[424,188,496,316],color:'#ac91c3'},
  {name:'Terrace',bounds:[255,69,424,188],color:'#b7bb8b'},
  {name:'Kitchen',bounds:[130,503,255,671],color:'#dca56c'},
  {name:'Lobby / Dining',bounds:[255,449,515,612],color:'#80b9c5'},
  {name:'Drawing Room',bounds:[515,449,688,715],color:'#a0ba86'},
  {name:'Bedroom 1',bounds:[339,612,515,794],color:'#bda4d5'},
  {name:'Bedroom 1 balcony',bounds:[273,672,339,794],color:'#d8c5a8'},
  {name:'Main entry',bounds:[515,715,688,874],color:'#c2a88e'},
]

// Wall spans follow the visible plan lines, with gaps left for the current openings.
const WALLS=[
  [50,198,255,198],[50,198,50,390],[50,390,209,390],
  [255,444,424,444],
  [255,69,424,69],[255,69,255,155],[255,188,276,188],[326,188,424,188],
  [424,316,496,316],
  [50,390,50,503],[50,503,130,503],[130,390,130,503],[130,503,130,671],[130,671,255,671],
  [688,449,688,715],
  [515,715,515,794],
  [273,672,339,672],[515,794,688,794],
]

const GLASS=[
  [273,672,273,794,1.0,HEIGHT], // Bedroom 1 enclosed balcony above railing.
  [273,794,339,794,1.0,HEIGHT],
]

export default function WholeHome3D({onOpenRoom}){
  const mountRef=useRef(null),sceneRef=useRef(null)
  const [view,setView]=useState('perspective')
  const [showWalls,setShowWalls]=useState(true)

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const scene=new THREE.Scene();scene.background=new THREE.Color('#edf3f7')
    const camera=new THREE.PerspectiveCamera(45,1,.05,150)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    controls.maxPolarAngle=Math.PI/2.02;controls.minDistance=8;controls.maxDistance=65
    const model=new THREE.Group();scene.add(model)
    const walls=new THREE.Group();model.add(walls)
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#ece8e0',roughness:.87,side:THREE.DoubleSide})
    const aluminium=new THREE.MeshStandardMaterial({color:'#303b45',metalness:.65,roughness:.31})
    const glass=new THREE.MeshStandardMaterial({color:'#a5dbe9',transparent:true,opacity:.35,metalness:.08,roughness:.12,side:THREE.DoubleSide,depthWrite:false})
    const wood=new THREE.MeshStandardMaterial({color:'#b18b67',roughness:.7})
    const addBox=(width,height,depth,x,y,z,material=wallMaterial,parent=walls)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material)
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
    }
    const texture=new THREE.TextureLoader().load(floorPlanImage)
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy()
    const plan=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}))
    plan.rotation.x=-Math.PI/2;plan.position.set(W/2,-.035,L/2);model.add(plan)
    const slab=new THREE.Mesh(new THREE.BoxGeometry(W,.07,L),new THREE.MeshStandardMaterial({color:'#f4f2ed',roughness:.94}))
    slab.position.set(W/2,-.09,L/2);model.add(slab)
    for(const room of ROOMS){
      const [x1,y1,x2,y2]=room.bounds
      const floor=addBox(X(x2-x1),.018,Z(y2-y1),X((x1+x2)/2),.016,Z((y1+y2)/2),new THREE.MeshBasicMaterial({color:room.color,transparent:true,opacity:.22,depthWrite:false}),model)
      floor.castShadow=false
    }
    const addSpan=(segment,bottom=0,top=HEIGHT,material=wallMaterial)=>{
      const [x1,y1,x2,y2]=segment,xA=X(x1),xB=X(x2),zA=Z(y1),zB=Z(y2)
      const dx=xB-xA,dz=zB-zA,length=Math.hypot(dx,dz)
      if(length<.01||top<=bottom) return
      const beam=addBox(length,top-bottom,.085,(xA+xB)/2,(top+bottom)/2,(zA+zB)/2,material)
      beam.rotation.y=-Math.atan2(dz,dx)
    }
    WALLS.forEach(segment=>addSpan(segment))
    for(const [x1,y1,x2,y2,bottom,top] of GLASS){
      const span=[x1,y1,x2,y2]
      if(bottom>0) addSpan(span,0,bottom)
      if(top<HEIGHT) addSpan(span,top,HEIGHT)
      addSpan(span,bottom,top,glass)
      addSpan(span,bottom,bottom+.045,aluminium)
      addSpan(span,top-.045,top,aluminium)
    }
    // Convert each room's own west/north coordinate system into the south-up plan.
    const boundsFor=name=>ROOMS.find(room=>room.name===name).bounds
    const roomPoint=(bounds,width,length,x,z)=>[
      bounds[2]-(x/width)*(bounds[2]-bounds[0]),
      bounds[3]-(z/length)*(bounds[3]-bounds[1]),
    ]
    const roomGroup=(bounds,width,length)=>{
      const group=new THREE.Group()
      group.position.set(X(bounds[2]),0,Z(bounds[3]))
      group.rotation.y=Math.PI
      group.scale.set(X(bounds[2]-bounds[0])/(width/1000),1,Z(bounds[3]-bounds[1])/(length/1000))
      model.add(group)
      return group
    }
    const localBox=(group,w,h,d,x,y,z,material)=>addBox(w/1000,h/1000,d/1000,x/1000,y/1000,z/1000,material,group)
    const roomEdge=(bounds,width,length,side,holes=[])=>{
      const total=side==='north'||side==='south'?width:length
      const valid=holes.map(h=>({...h,start:Math.max(0,h.start),end:Math.min(total,h.end)})).filter(h=>h.end>h.start).sort((a,b)=>a.start-b.start)
      const line=(start,end,bottom=0,top=HEIGHT,material=wallMaterial)=>{
        if(end<=start) return
        const a=side==='north'?[start,0]:side==='south'?[start,length]:side==='west'?[0,start]:[width,start]
        const b=side==='north'?[end,0]:side==='south'?[end,length]:side==='west'?[0,end]:[width,end]
        addSpan([...roomPoint(bounds,width,length,...a),...roomPoint(bounds,width,length,...b)],bottom,top,material)
      }
      let cursor=0
      for(const hole of valid){
        line(cursor,hole.start)
        if(hole.bottom>0)line(hole.start,hole.end,0,hole.bottom)
        if(hole.top<HEIGHT)line(hole.start,hole.end,hole.top,HEIGHT)
        if(hole.glass){
          line(hole.start,hole.end,hole.bottom,hole.top,glass)
          line(hole.start,hole.end,hole.bottom,hole.bottom+.045,aluminium)
          line(hole.start,hole.end,hole.top-.045,hole.top,aluminium)
        }
        cursor=Math.max(cursor,hole.end)
      }
      line(cursor,total)
    }
    const fabric=new THREE.MeshStandardMaterial({color:'#d6c8b9',roughness:.95})
    const cushion=new THREE.MeshStandardMaterial({color:'#eee5d9',roughness:.98})
    const paleWood=new THREE.MeshStandardMaterial({color:'#c8a981',roughness:.72})
    const stone=new THREE.MeshStandardMaterial({color:'#e7dfd3',roughness:.48})
    const cabinet=new THREE.MeshStandardMaterial({color:'#d4d1c9',roughness:.65})
    const screen=new THREE.MeshStandardMaterial({color:'#192c3b',metalness:.16,roughness:.32})

    const drawing=EMPTY_ROOM_SHELLS.drawing,db=boundsFor('Drawing Room')
    const dg=roomGroup(db,drawing.widthMm,drawing.lengthMm)
    const dw=drawing.windows[0],dd=drawing.doors[0],open=drawing.wallOpenings.east
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'south',[{start:dw.fromMm,end:dw.fromMm+dw.widthMm,bottom:dw.bottomMm/1000,top:dw.topMm/1000,glass:true}])
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'north',[{start:dd.fromMm,end:dd.fromMm+dd.widthMm,top:dd.heightMm/1000}])
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'east',[{start:open.fromMm,end:open.toMm,top:HEIGHT}])
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'west')
    const beam=drawing.hangingBeams[0]
    const ba=roomPoint(db,drawing.widthMm,drawing.lengthMm,drawing.widthMm,beam.fromMm)
    const bb=roomPoint(db,drawing.widthMm,drawing.lengthMm,drawing.widthMm,beam.toMm)
    addSpan([...ba,...bb],HEIGHT-beam.dropMm/1000,HEIGHT)
    const {sofa,coffeeTable,windowSeat}=drawing.furniture
    localBox(dg,sofa.widthMm,360,sofa.lengthMm,sofa.centerXmm,350,sofa.centerZmm,fabric)
    localBox(dg,160,490,sofa.lengthMm,sofa.centerXmm-sofa.widthMm/2+80,650,sofa.centerZmm,fabric)
    localBox(dg,coffeeTable.widthMm,55,coffeeTable.lengthMm,coffeeTable.centerXmm,420,coffeeTable.centerZmm,paleWood)
    localBox(dg,windowSeat.widthMm,windowSeat.heightMm,windowSeat.depthMm,windowSeat.centerXmm,windowSeat.heightMm/2,windowSeat.centerZmm,paleWood)
    localBox(dg,windowSeat.widthMm,65,windowSeat.depthMm,windowSeat.centerXmm,windowSeat.heightMm+32,windowSeat.centerZmm,cushion)

    const lobby=EMPTY_ROOM_SHELLS.lobby,lb=boundsFor('Lobby / Dining')
    const lg=roomGroup(lb,lobby.widthMm,lobby.lengthMm)
    const toilet=lobby.doors.find(door=>door.wall==='south'),bedDoor=lobby.doors.find(door=>door.wall==='north')
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'south',[{start:toilet.fromMm,end:toilet.fromMm+toilet.widthMm,top:toilet.heightMm/1000}])
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'north',[
      {start:bedDoor.fromMm,end:bedDoor.fromMm+bedDoor.widthMm,top:bedDoor.heightMm/1000},
      {start:lobby.poojaAlcove.fromMm,end:lobby.poojaAlcove.fromMm+lobby.poojaAlcove.widthMm,top:HEIGHT},
    ])
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'east',[{start:lobby.wallOpenings.east.fromMm,end:lobby.wallOpenings.east.toMm,top:HEIGHT}])
    const table=lobby.furniture.diningTable
    localBox(lg,table.widthMm,55,table.lengthMm,table.centerXmm,table.heightMm,table.centerZmm,paleWood)
    localBox(lg,90,table.heightMm-50,90,table.centerXmm,table.heightMm/2,table.centerZmm,aluminium)
    for(const side of [-1,1])for(const row of lobby.furniture.chairRowsZmm){
      const x=table.centerXmm+side*lobby.furniture.chairOffsetXmm
      localBox(lg,440,85,430,x,450,row,wood)
      localBox(lg,70,510,430,x+side*200,690,row,wood)
    }
    const pooja=lobby.poojaAlcove
    localBox(lg,pooja.widthMm,500,350,pooja.fromMm+pooja.widthMm/2,450,-pooja.depthMm+200,stone)
    localBox(lg,pooja.widthMm,65,pooja.depthMm,pooja.fromMm+pooja.widthMm/2,45,-pooja.depthMm/2,stone)
    const lbeam=lobby.hangingBeams[0],la=roomPoint(lb,lobby.widthMm,lobby.lengthMm,0,lbeam.fromMm),le=roomPoint(lb,lobby.widthMm,lobby.lengthMm,0,lbeam.toMm)
    addSpan([...la,...le],HEIGHT-lbeam.dropMm/1000,HEIGHT)

    const study=STUDY_ROOM,sd=study.dimensions,sb=boundsFor('Study')
    const sg=roomGroup(sb,sd.widthMm,sd.lengthMm)
    const sDoor=study.openings.mainDoor,sTerrace=study.openings.terraceDoor,sOffice=study.openings.balconyOffice
    roomEdge(sb,sd.widthMm,sd.lengthMm,'south',[{start:sTerrace.offsetFromWestMm,end:sTerrace.offsetFromWestMm+sTerrace.widthMm,top:sTerrace.heightMm/1000,glass:true,bottom:0}])
    roomEdge(sb,sd.widthMm,sd.lengthMm,'east',[{start:0,end:sDoor.widthMm,top:sDoor.heightMm/1000}])
    const officeStart=sd.lengthMm-sOffice.offsetFromSouthMm-sOffice.widthMm
    roomEdge(sb,sd.widthMm,sd.lengthMm,'west',[{start:officeStart,end:officeStart+sOffice.widthMm,top:sOffice.heightMm/1000}])
    const shelf=study.cabinetry.northBookshelf
    localBox(sg,shelf.widthMm,shelf.heightMm,shelf.depthMm,shelf.offsetFromWestMm+shelf.widthMm/2,shelf.heightMm/2,shelf.depthMm/2,cabinet)
    for(let bay=1;bay<3;bay++)localBox(sg,16,shelf.heightMm,shelf.depthMm+10,shelf.offsetFromWestMm+shelf.widthMm*bay/3,shelf.heightMm/2,shelf.depthMm/2,wood)
    for(let bay=0;bay<3;bay++)localBox(sg,shelf.widthMm/3-42,1130,18,shelf.offsetFromWestMm+shelf.widthMm*(bay+.5)/3,1530,shelf.depthMm+12,glass)
    const built=study.cabinetry.southBuiltIn
    localBox(sg,built.widthMm,built.heightMm,built.depthMm,built.offsetFromWestMm+built.widthMm/2,built.floorClearanceMm+built.heightMm/2,sd.lengthMm-built.depthMm/2,cabinet)

    const office=BALCONY_OFFICE,od=office.dimensions,ob=boundsFor('Balcony office')
    const og=roomGroup(ob,od.widthMm,od.lengthMm)
    const env=office.envelope,bandBottom=env.lowerBrickParapetMm/1000,bandTop=(env.lowerBrickParapetMm+env.windowBandMm)/1000
    for(const side of env.windowWalls)roomEdge(ob,od.widthMm,od.lengthMm,side,[{start:0,end:side==='south'?od.widthMm:od.lengthMm,bottom:bandBottom,top:bandTop,glass:true}])
    const desk=office.worktop.westAdjustable,rear=office.worktop.rearCabinet
    const savedDeskHeight=Number(localStorage.getItem(BALCONY_DESK_HEIGHT_KEY))
    const deskHeight=Number.isFinite(savedDeskHeight)&&savedDeskHeight>=desk.minHeightMm&&savedDeskHeight<=desk.maxHeightMm?savedDeskHeight:desk.defaultHeightMm
    localBox(og,desk.depthMm,desk.topThicknessMm,desk.widthMm,desk.depthMm/2,deskHeight,od.lengthMm-desk.widthMm/2,paleWood)
    localBox(og,rear.depthMm,rear.topHeightMm-rear.toeClearanceMm,rear.widthMm,rear.depthMm/2,(rear.topHeightMm+rear.toeClearanceMm)/2,od.lengthMm-rear.widthMm/2,cabinet)
    for(let bay=1;bay<rear.bayCount;bay++)localBox(og,18,rear.topHeightMm-rear.toeClearanceMm,rear.depthMm,rear.depthMm/2,(rear.topHeightMm+rear.toeClearanceMm)/2,od.lengthMm-rear.widthMm*bay/rear.bayCount,wood)
    const north=office.cabinetry.northWall
    localBox(og,od.widthMm,north.upper.heightMm,north.upper.depthMm,od.widthMm/2,od.floorToCeilingMm-north.upper.heightMm/2,north.upper.depthMm/2,cabinet)
    localBox(og,north.lower.widthMm,north.lower.heightMm,north.lower.depthMm,north.lower.widthMm/2,north.lower.heightMm/2,north.lower.depthMm/2,cabinet)
    office.equipment.monitors.forEach((monitor,index)=>localBox(og,45,monitor.heightWithStandMm*.75,monitor.widthMm,index?470:350,deskHeight+monitor.heightWithStandMm*.48,od.lengthMm-(index?850:1350),screen))
    localBox(og,215,475,410,155,320,od.lengthMm-rear.widthMm+250,cabinet) // PC in the north desk bay.
    localBox(og,280,190,440,155,410,od.lengthMm-rear.widthMm/2,screen) // Printer on the centre pull-out shelf.
    localBox(og,office.equipment.laptop.depthMm,18,office.equipment.laptop.widthMm,560,deskHeight+18,od.lengthMm-500,screen)

    const bedroom=EMPTY_ROOM_SHELLS.bedroom1,bbounds=boundsFor('Bedroom 1')
    const bg=roomGroup(bbounds,bedroom.widthMm,bedroom.lengthMm)
    roomEdge(bbounds,bedroom.widthMm,bedroom.lengthMm,'east',[{start:bedroom.wallOpenings.east.fromMm,end:bedroom.wallOpenings.east.toMm,top:HEIGHT}])
    const washroomDoor=bedroom.doors.find(door=>door.leadsTo==='Bedroom 1 washroom')
    roomEdge(bbounds,bedroom.widthMm,bedroom.lengthMm,'north',[{start:washroomDoor.fromMm,end:washroomDoor.fromMm+washroomDoor.widthMm,top:washroomDoor.heightMm/1000}])
    localBox(bg,washroomDoor.widthMm-90,washroomDoor.heightMm-80,35,washroomDoor.fromMm+washroomDoor.widthMm/2,(washroomDoor.heightMm-80)/2,0,wood)
    // The south wall and bedroom door are shared with the lobby model above.

    const kb=boundsFor('Kitchen'),kg=roomGroup(kb,KITCHEN.width,KITCHEN.length)
    let savedKitchen={}
    try{savedKitchen=JSON.parse(localStorage.getItem(KITCHEN_AUTOSAVE_KEY)||'{}')}catch{}
    const kitchenItems=[...(Array.isArray(savedKitchen.east)?savedKitchen.east:EAST_INIT),...(Array.isArray(savedKitchen.west)?savedKitchen.west:WEST_INIT)]
    const kitchenCabinet=new THREE.MeshStandardMaterial({color:savedKitchen.materials?.cabinetBody||'#efe9df',roughness:.72})
    for(const [side,modules] of [
      ['east',Array.isArray(savedKitchen.eastModules)?savedKitchen.eastModules:autoFillModules(KITCHEN.length)],
      ['west',Array.isArray(savedKitchen.westModules)?savedKitchen.westModules:autoFillModules(KITCHEN.length-KITCHEN.westGap.to)],
    ]){
      let cursor=KITCHEN.length
      for(const module of modules){
        const width=Number(module.width)||0
        if(width<=0)continue
        const y=cursor-width/2
        localBox(kg,580,820,width,side==='east'?KITCHEN.width-300:300,460,KITCHEN.length-y,kitchenCabinet)
        cursor-=width
      }
    }
    for(const item of kitchenItems){
      if(item.hidden||item.powerPoint||!item.w||!item.d||!item.h)continue
      const itemMaterial=new THREE.MeshStandardMaterial({color:item.color||'#c4b5a5',roughness:.72})
      localBox(kg,item.d,item.h,item.w,(item.x||0)+item.d/2,(item.z||0)+item.h/2,KITCHEN.length-(item.y||0)-item.w/2,itemMaterial)
    }
    scene.add(new THREE.HemisphereLight('#ffffff','#8b9ca8',1.4))
    const sun=new THREE.DirectionalLight('#fff5e5',2);sun.position.set(-5,16,-7);scene.add(sun)

    const centerX=X(370),centerZ=Z(475)
    const setCamera=mode=>{
      if(mode==='top'){
        camera.position.set(centerX,27,centerZ-.001);camera.up.set(0,0,-1);controls.target.set(centerX,0,centerZ)
      }else{
        camera.position.set(centerX+10,17,centerZ-13);camera.up.set(0,1,0);controls.target.set(centerX,0,centerZ)
      }
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('perspective')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    sceneRef.current={setCamera,setWallsVisible:visible=>{walls.visible=visible}}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();model.traverse(object=>{object.geometry?.dispose?.();object.material?.dispose?.()});texture.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view])
  useEffect(()=>{sceneRef.current?.setWallsVisible(showWalls)},[showWalls])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Whole home in 3D</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>South is up in the top view. Drag to orbit and scroll to zoom.</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button onClick={()=>setView('perspective')} style={buttonStyle(view==='perspective')}>3D overview</button>
        <button onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button>
        <button onClick={()=>setShowWalls(value=>!value)} style={buttonStyle(showWalls)}>{showWalls?'Hide walls':'Show walls'}</button>
      </div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1050px)',width:'100%'}}/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'12px 16px 16px',borderTop:'1px solid #e2e8f0'}}>
      {[
        ['Bedroom 3','bedroom3'],['Study','study'],['Kitchen','kitchen'],['Lobby / Dining','lobby'],
        ['Drawing Room','drawing'],['Bedroom 1','bedroom1'],['Main entry','entry'],
      ].map(([label,key])=><button key={key} onClick={()=>onOpenRoom(key)} style={buttonStyle(false)}>{label} ↗</button>)}
    </div>
  </section>
}

function buttonStyle(active){return{padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}
