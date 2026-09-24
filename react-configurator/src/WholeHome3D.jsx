import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {createSeatedPoojaPerson} from './SeatedPoojaPerson.js'
import {createPoojaPlatform} from './PoojaPlatform.js'
import {createPoojaDoorAndInterior} from './PoojaDoorAndInterior.js'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import floorPlanImage from '../../Interior/home a 501 floor - unmodified.png'
import {EMPTY_ROOM_SHELLS} from './config/roomShellConfig.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'
import {createStudyTerrace} from './StudyTerrace.js'
import {BALCONY_OFFICE,BALCONY_DESK_HEIGHT_KEY} from './config/balconyOfficeConfig.js'
import {KITCHEN,KITCHEN_REFRIGERATOR,EAST_INIT,WEST_INIT,KITCHEN_AUTOSAVE_KEY,autoFillModules} from './config/kitchenConfig.js'
import {ENTRY} from './config/entryConfig.js'
import WallSelectionPanel from './WallSelectionPanel.jsx'
import PlanMarkPanel from './PlanMarkPanel.jsx'

// The A501 plan is south-up: image right is west and image down is north.
const PLAN_WIDTH=800,PLAN_HEIGHT=875
const X_METRES_PER_PIXEL=4.993/260
const Z_METRES_PER_PIXEL=3.277/163
const X=x=>x*X_METRES_PER_PIXEL
const Z=y=>y*Z_METRES_PER_PIXEL
const W=X(PLAN_WIDTH),L=Z(PLAN_HEIGHT),HEIGHT=2.7
const PLAN_MARK_KEY='a501-whole-home-plan-mark-v1'

const ROOMS=[
  {name:'Bedroom 3',bounds:[50,198,255,390],color:'#db8b47'},
  {name:'Study',bounds:[255,198,424,444],color:'#7c93b8'},
  {name:'Balcony office',bounds:[424,188,496,316],color:'#ac91c3'},
  {name:'Terrace',bounds:[255,69,424,188],color:'#b7bb8b'},
  {name:'Kitchen',bounds:[130,503,255,KITCHEN.mergedShaftPlan.y2],color:'#dca56c'},
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
  [424,316,496,316],
  [50,390,50,503],[50,503,130,503],[130,390,130,503],[130,503,130,671],
  // The kitchen north wall sits level with the former shaft's far edge.
  [KITCHEN.mergedShaftPlan.x1,671,130,671],
  [KITCHEN.mergedShaftPlan.x1,671,KITCHEN.mergedShaftPlan.x1,KITCHEN.mergedShaftPlan.y2],
  [KITCHEN.mergedShaftPlan.x1,KITCHEN.mergedShaftPlan.y2,130,KITCHEN.mergedShaftPlan.y2],
  [255,671,255,KITCHEN.mergedShaftPlan.y2],
  [688,449,688,715],
  [515,715,515,874],[515,874,ENTRY.shoeRack.planX1,874],
  [570,715,688,715],
  [688,715,688,ENTRY.outerEntryOpening.fromPlanY],
  [688,ENTRY.outerEntryOpening.toPlanY,688,874],
  [570,874,688,874],
  // The marked entry shaft uses the existing exterior wall as its fourth side.
  [ENTRY.shaft.planX1,ENTRY.shaft.planY1,ENTRY.shaft.planX2,ENTRY.shaft.planY1],
  [ENTRY.shaft.planX1,ENTRY.shaft.planY1,ENTRY.shaft.planX1,ENTRY.shaft.planY2],
  [ENTRY.shaft.planX1,ENTRY.shaft.planY2,ENTRY.shaft.planX2,ENTRY.shaft.planY2],
]

const GLASS=[
  [273,672,273,794,1.0,HEIGHT], // Bedroom 1 enclosed balcony above railing.
  [273,794,339,794,1.0,HEIGHT],
]

export default function WholeHome3D({onOpenRoom}){
  const mountRef=useRef(null),sceneRef=useRef(null)
  const [view,setView]=useState('perspective')
  const [showWalls,setShowWalls]=useState(true)
  const [showPoojaPerson,setShowPoojaPerson]=useState(true)
  const [poojaDoorsOpen,setPoojaDoorsOpen]=useState(true)
  const [wallSelection,setWallSelection]=useState(null)
  const [wallNote,setWallNote]=useState('')
  const [markMode,setMarkMode]=useState(false)
  const [planMark,setPlanMark]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAN_MARK_KEY)||'{}')}catch{return {}}})

  useEffect(()=>{try{localStorage.setItem(PLAN_MARK_KEY,JSON.stringify(planMark))}catch{}},[planMark])

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
    const markedWallMaterial=new THREE.MeshStandardMaterial({color:'#f5ad34',roughness:.72,emissive:'#623600',emissiveIntensity:.15})
    const wallMeshes=[]
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
    const mergedShaft=KITCHEN.mergedShaftPlan
    const extensionFloor=addBox(X(130-mergedShaft.x1),.018,Z(mergedShaft.y2-671),X((mergedShaft.x1+130)/2),.016,Z((671+mergedShaft.y2)/2),new THREE.MeshBasicMaterial({color:'#dca56c',transparent:true,opacity:.22,depthWrite:false}),model)
    extensionFloor.castShadow=false
    const addSpan=(segment,bottom=0,top=HEIGHT,material=wallMaterial)=>{
      const [x1,y1,x2,y2]=segment,xA=X(x1),xB=X(x2),zA=Z(y1),zB=Z(y2)
      const dx=xB-xA,dz=zB-zA,length=Math.hypot(dx,dz)
      if(length<.01||top<=bottom) return
      const beam=addBox(length,top-bottom,.085,(xA+xB)/2,(top+bottom)/2,(zA+zB)/2,material)
      beam.rotation.y=-Math.atan2(dz,dx)
      wallMeshes.push(beam)
      return beam
    }
    WALLS.forEach(segment=>{const mesh=addSpan(segment);if(mesh)mesh.userData={planWall:segment}})
    const entryOpening=ENTRY.outerEntryOpening
    addSpan([entryOpening.wallPlanX,entryOpening.fromPlanY,entryOpening.wallPlanX,entryOpening.toPlanY],entryOpening.heightMm/1000,HEIGHT)
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
      const roomName=ROOMS.find(room=>room.bounds===bounds)?.name||'Whole home'
      const total=side==='north'||side==='south'?width:length
      const valid=holes.map(h=>({...h,start:Math.max(0,h.start),end:Math.min(total,h.end)})).filter(h=>h.end>h.start).sort((a,b)=>a.start-b.start)
      const line=(start,end,bottom=0,top=HEIGHT,material=wallMaterial)=>{
        if(end<=start) return
        const a=side==='north'?[start,0]:side==='south'?[start,length]:side==='west'?[0,start]:[width,start]
        const b=side==='north'?[end,0]:side==='south'?[end,length]:side==='west'?[0,end]:[width,end]
        const mesh=addSpan([...roomPoint(bounds,width,length,...a),...roomPoint(bounds,width,length,...b)],bottom,top,material)
        if(mesh)mesh.userData={roomName,wallSide:side,bounds,width,length}
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

    const entryRack=ENTRY.shoeRack
    const rackWidth=entryRack.widthMm/1000,rackDepth=entryRack.projectionMm/1000,rackHeight=entryRack.heightMm/1000
    const rackX=X((entryRack.planX1+entryRack.planX2)/2),rackFrontZ=Z(entryRack.planNorthY)-.005,rackBackZ=rackFrontZ+rackDepth
    const rackBody=new THREE.MeshStandardMaterial({color:'#ab805e',roughness:.72})
    const rackDoors=new THREE.MeshStandardMaterial({color:'#d8c4ad',roughness:.59})
    const rackPulls=new THREE.MeshStandardMaterial({color:'#3f4242',metalness:.54,roughness:.34})
    addBox(rackWidth,rackHeight,rackDepth,rackX,rackHeight/2,(rackBackZ+rackFrontZ)/2,rackBody,model)
    for(let i=0;i<entryRack.doorCount;i++){
      const panelWidth=rackWidth/entryRack.doorCount
      const panelX=rackX-rackWidth/2+(i+.5)*panelWidth
      addBox(panelWidth-.012,rackHeight-.06,.025,panelX,rackHeight/2,rackFrontZ-.0125,rackDoors,model)
      addBox(.018,.3,.022,panelX+(i===0?panelWidth*.33:-panelWidth*.33),1.1,rackFrontZ-.035,rackPulls,model)
    }

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
    if(pooja.altarVisible!==false)localBox(lg,pooja.widthMm,500,350,pooja.fromMm+pooja.widthMm/2,450,-pooja.depthMm+200,stone)
    localBox(lg,pooja.widthMm,65,pooja.depthMm,pooja.fromMm+pooja.widthMm/2,45,-pooja.depthMm/2,stone)
    lg.add(createPoojaPlatform(pooja,77.5))
    const poojaDoors=createPoojaDoorAndInterior(pooja,lobby.heightMm,77.5)
    lg.add(poojaDoors)
    // Seated scale figure in the alcove. The face and hands point along local +X (east).
    const seatedPerson=createSeatedPoojaPerson(pooja,77.5)
    lg.add(seatedPerson)
    seatedPerson.visible=showPoojaPerson
    const lbeam=lobby.hangingBeams[0],la=roomPoint(lb,lobby.widthMm,lobby.lengthMm,0,lbeam.fromMm),le=roomPoint(lb,lobby.widthMm,lobby.lengthMm,0,lbeam.toMm)
    addSpan([...la,...le],HEIGHT-lbeam.dropMm/1000,HEIGHT)

    const study=STUDY_ROOM,sd=study.dimensions,sb=boundsFor('Study')
    const sg=roomGroup(sb,sd.widthMm,sd.lengthMm)
    sg.add(createStudyTerrace(study))
    const sDoor=study.openings.mainDoor,sTerrace=study.openings.terraceDoor,sOffice=study.openings.balconyOffice
    const built=study.cabinetry.southBuiltIn
    roomEdge(sb,sd.widthMm,sd.lengthMm,'south',[
      {start:built.offsetFromWestMm,end:built.offsetFromWestMm+built.widthMm,bottom:built.floorClearanceMm/1000,top:(built.floorClearanceMm+built.heightMm)/1000},
      {start:sTerrace.offsetFromWestMm,end:sTerrace.offsetFromWestMm+sTerrace.widthMm,top:sTerrace.heightMm/1000,glass:true,bottom:0},
    ])
    roomEdge(sb,sd.widthMm,sd.lengthMm,'east',[{start:0,end:sDoor.widthMm,top:sDoor.heightMm/1000}])
    const officeStart=sd.lengthMm-sOffice.offsetFromSouthMm-sOffice.widthMm
    roomEdge(sb,sd.widthMm,sd.lengthMm,'west',[{start:officeStart,end:officeStart+sOffice.widthMm,top:sOffice.heightMm/1000}])
    const shelf=study.cabinetry.northBookshelf
    localBox(sg,shelf.widthMm,shelf.heightMm,shelf.depthMm,shelf.offsetFromWestMm+shelf.widthMm/2,shelf.heightMm/2,shelf.depthMm/2,cabinet)
    for(let bay=1;bay<3;bay++)localBox(sg,16,shelf.heightMm,shelf.depthMm+10,shelf.offsetFromWestMm+shelf.widthMm*bay/3,shelf.heightMm/2,shelf.depthMm/2,wood)
    for(let bay=0;bay<3;bay++)localBox(sg,shelf.widthMm/3-42,1130,18,shelf.offsetFromWestMm+shelf.widthMm*(bay+.5)/3,1530,shelf.depthMm+12,glass)
    localBox(sg,built.widthMm,built.heightMm,built.depthMm,built.offsetFromWestMm+built.widthMm/2,built.floorClearanceMm+built.heightMm/2,sd.lengthMm+built.depthMm/2-40,cabinet)
    const builtDoorGap=12,builtDoorWidth=(built.widthMm-builtDoorGap*4)/3
    for(let bay=0;bay<3;bay++){
      const doorX=built.offsetFromWestMm+builtDoorGap+builtDoorWidth/2+bay*(builtDoorWidth+builtDoorGap)
      localBox(sg,builtDoorWidth,built.heightMm-40,22,doorX,built.floorClearanceMm+built.heightMm/2,sd.lengthMm-64,paleWood)
      localBox(sg,18,160,25,doorX+builtDoorWidth*.34,built.floorClearanceMm+built.heightMm*.53,sd.lengthMm-80,aluminium)
    }

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
    const poojaWardrobe=bedroom.balconyExtension?.poojaWallWardrobe
    if(poojaWardrobe){
      const {widthMm:width,depthMm:depth,heightMm:height,doorCount}=poojaWardrobe
      const cabinetBody=new THREE.MeshStandardMaterial({color:'#a78059',roughness:.7})
      const cabinetFront=new THREE.MeshStandardMaterial({color:'#dce6dd',roughness:.55})
      const cabinetPull=new THREE.MeshStandardMaterial({color:'#384f49',metalness:.45,roughness:.38})
      const x=bedroom.widthMm+width/2,z=bedroom.balconyExtension.lengthMm-(poojaWardrobe.northShiftMm||0)
      localBox(bg,width,height,depth,x,height/2,z+depth/2,cabinetBody)
      for(let i=0;i<doorCount;i++){
        const panelX=bedroom.widthMm+width*(i+.5)/doorCount
        const front=localBox(bg,width/doorCount-18,height-110,30,panelX,(height+40)/2,z+18,cabinetFront)
        front.userData={balconyPoojaWall:true};wallMeshes.push(front)
        localBox(bg,18,310,22,panelX+(i===0?width*.17:-width*.17),1150,z-9,cabinetPull)
      }
    }
    roomEdge(bbounds,bedroom.widthMm,bedroom.lengthMm,'east',[{start:bedroom.wallOpenings.east.fromMm,end:bedroom.wallOpenings.east.toMm,top:HEIGHT}])
    const washroomDoor=bedroom.doors.find(door=>door.leadsTo==='Bedroom 1 washroom')
    const northEastWardrobe=bedroom.furniture?.northEastRecessWardrobe
    const northHoles=[{start:washroomDoor.fromMm,end:washroomDoor.fromMm+washroomDoor.widthMm,top:washroomDoor.heightMm/1000}]
    if(northEastWardrobe)northHoles.push({start:bedroom.widthMm-northEastWardrobe.fromEastMm-northEastWardrobe.widthMm,end:bedroom.widthMm-northEastWardrobe.fromEastMm,top:HEIGHT})
    roomEdge(bbounds,bedroom.widthMm,bedroom.lengthMm,'north',northHoles)
    localBox(bg,washroomDoor.widthMm-90,washroomDoor.heightMm-80,35,washroomDoor.fromMm+washroomDoor.widthMm/2,(washroomDoor.heightMm-80)/2,0,wood)
    if(northEastWardrobe){
      const {widthMm:width,depthMm:depth,heightMm:height,doorCount}=northEastWardrobe
      const start=bedroom.widthMm-northEastWardrobe.fromEastMm-width
      const body=new THREE.MeshStandardMaterial({color:'#c9b9a3',roughness:.72})
      const front=new THREE.MeshStandardMaterial({color:'#eee8df',roughness:.58})
      const pull=new THREE.MeshStandardMaterial({color:'#464b4b',metalness:.58,roughness:.34})
      localBox(bg,width,height,depth,start+width/2,height/2,-depth/2,body)
      for(let i=0;i<doorCount;i++){
        const panelWidth=width/doorCount,center=start+(i+.5)*panelWidth
        localBox(bg,panelWidth-18,height-80,35,center,height/2,25,front)
        localBox(bg,18,320,25,center+(i===0?panelWidth*.32:-panelWidth*.32),1160,60,pull)
      }
    }
    const lobbyDoor=bedroom.doors.find(door=>door.leadsTo==='Lobby / Dining')
    localBox(bg,lobbyDoor.widthMm-90,lobbyDoor.heightMm-80,35,lobbyDoor.fromMm+lobbyDoor.widthMm/2,(lobbyDoor.heightMm-80)/2,bedroom.lengthMm,wood)
    const bed=bedroom.furniture?.bed
    if(bed){
      const bedLength=bed.lengthMm,bedWidth=bed.widthMm,bedWest=bed.fromWestMm,bedSouth=bed.fromSouthMm
      const bedCenterX=bedWest+bedLength/2,bedCenterZ=bedroom.lengthMm-bedSouth-bedWidth/2
      const bedFrame=new THREE.MeshStandardMaterial({color:'#806047',roughness:.68})
      const bedUpholstery=new THREE.MeshStandardMaterial({color:'#efe8dc',roughness:.94})
      const bedCover=new THREE.MeshStandardMaterial({color:'#b7c7bd',roughness:.96})
      const headboardMaterial=new THREE.MeshStandardMaterial({color:'#9a7656',roughness:.74})
      const pillowMaterial=new THREE.MeshStandardMaterial({color:'#fbf8f1',roughness:.98})
      const baseHeight=250,mattressThickness=190
      // In room-local coordinates x grows west-to-east and z grows north-to-south.
      // The headboard sits at the east/south end; the bed's length follows the south wall.
      localBox(bg,bedLength,baseHeight,bedWidth,bedCenterX,baseHeight/2,bedCenterZ,bedFrame)
      localBox(bg,bedLength-35,mattressThickness,bedWidth-35,bedCenterX,baseHeight+mattressThickness/2,bedCenterZ,bedUpholstery)
      localBox(bg,bedLength-470,65,bedWidth-100,bedWest+(bedLength-470)/2,baseHeight+mattressThickness+25,bedCenterZ,bedCover)
      localBox(bg,85,920,bedWidth,bedWest+bedLength-43,710,bedCenterZ,headboardMaterial)
      for(const offset of [-bedWidth*.23,bedWidth*.23]){
        localBox(bg,380,80,610,bedWest+bedLength-260,baseHeight+mattressThickness+70,bedCenterZ+offset,pillowMaterial)
      }
    }
    const wardrobe=bedroom.furniture?.wardrobe
    if(wardrobe){
      const {depthMm:depth,lengthMm:length,heightMm:height,fromNorthMm:start}=wardrobe
      const body=new THREE.MeshStandardMaterial({color:'#d0c0aa',roughness:.76})
      const front=new THREE.MeshStandardMaterial({color:'#e9e1d4',roughness:.66})
      const handle=new THREE.MeshStandardMaterial({color:'#373b3c',metalness:.62,roughness:.31})
      localBox(bg,depth,height,length,depth/2,height/2,start+length/2,body)
      const doorCount=wardrobe.doorCount||3
      for(let i=0;i<doorCount;i++){
        const panelLength=length/doorCount-12,z=start+(i+.5)*length/doorCount
        localBox(bg,25,height-140,panelLength,depth+14,(height+90)/2,z,front)
        localBox(bg,18,250,18,depth+34,1150,z+panelLength*.35,handle)
      }
      localBox(bg,depth+35,90,length,depth/2,45,start+length/2,body)
    }
    const balconyFurniture=bedroom.balconyExtension?.furniture
    if(balconyFurniture){
      const table=balconyFurniture.table,chair=balconyFurniture.chair
      const tableX=bedroom.widthMm+table.centerFromBedroomWallMm,tableZ=table.centerFromNorthMm
      const chairX=bedroom.widthMm+chair.centerFromBedroomWallMm,chairZ=chair.centerFromNorthMm
      const tableMat=new THREE.MeshStandardMaterial({color:'#b28a60',roughness:.67})
      const frame=new THREE.MeshStandardMaterial({color:'#353b3d',metalness:.58,roughness:.34})
      const seatMat=new THREE.MeshStandardMaterial({color:'#d9cec1',roughness:.92})
      localBox(bg,table.depthMm,40,table.widthMm,tableX,table.heightMm,tableZ,tableMat)
      for(const dx of [-table.depthMm/2+55,table.depthMm/2-55])for(const dz of [-table.widthMm/2+55,table.widthMm/2-55])
        localBox(bg,30,table.heightMm-40,30,tableX+dx,(table.heightMm-40)/2,tableZ+dz,frame)
      localBox(bg,chair.depthMm,70,chair.widthMm,chairX,chair.seatHeightMm,chairZ,seatMat)
      for(const dx of [-chair.depthMm/2+60,chair.depthMm/2-60])for(const dz of [-chair.widthMm/2+60,chair.widthMm/2-60])
        localBox(bg,28,chair.seatHeightMm-40,28,chairX+dx,(chair.seatHeightMm-40)/2,chairZ+dz,frame)
      localBox(bg,50,chair.backHeightMm-chair.seatHeightMm,chair.widthMm,chairX-chair.depthMm/2+30,(chair.backHeightMm+chair.seatHeightMm)/2,chairZ,seatMat)
    }
    // The south wall and bedroom door are shared with the lobby model above.

    const kb=boundsFor('Kitchen'),kg=roomGroup(kb,KITCHEN.width,KITCHEN.length)
    roomEdge(kb,KITCHEN.width,KITCHEN.length,'south',[{start:KITCHEN.door.x,end:KITCHEN.door.x+KITCHEN.door.w,top:HEIGHT}])
    roomEdge(kb,KITCHEN.width,KITCHEN.length,'north',[{start:KITCHEN.window.x,end:KITCHEN.window.x+KITCHEN.window.w,bottom:KITCHEN.window.sill/1000,top:HEIGHT,glass:true}])
    const fridge=KITCHEN_REFRIGERATOR
    const kitchenXScale=X(kb[2]-kb[0])/(KITCHEN.width/1000)
    const fridgeFrontX=X(kb[2])-fridge.fromKitchenWestMm/1000*kitchenXScale
    const fridgeNorthZ=Z(kb[1])-fridge.southWallThicknessMm/1000
    const fridgeZ=fridgeNorthZ-fridge.widthMm/2000
    const fridgeSteel=new THREE.MeshStandardMaterial({color:'#aaaeb2',metalness:.68,roughness:.3})
    const fridgeFace=new THREE.MeshStandardMaterial({color:'#c5c8ca',metalness:.72,roughness:.24})
    const fridgeTrim=new THREE.MeshStandardMaterial({color:'#3a3e42',metalness:.5,roughness:.35})
    addBox(fridge.depthMm/1000,fridge.heightMm/1000,fridge.widthMm/1000,fridgeFrontX-fridge.depthMm/2000,fridge.heightMm/2000,fridgeZ,fridgeSteel,model)
    for(const side of [-1,1]){
      addBox(.022,(fridge.heightMm-26)/1000,(fridge.widthMm/2-10)/1000,fridgeFrontX+.011,fridge.heightMm/2000,fridgeZ+side*fridge.widthMm/4000,fridgeFace,model)
      addBox(.024,.93,.03,fridgeFrontX+.036,.895,fridgeZ+side*.067,fridgeTrim,model)
    }
    let savedKitchen={}
    try{savedKitchen=JSON.parse(localStorage.getItem(KITCHEN_AUTOSAVE_KEY)||'{}')}catch{}
    const kitchenItems=[...(Array.isArray(savedKitchen.east)?savedKitchen.east:EAST_INIT),...(Array.isArray(savedKitchen.west)?savedKitchen.west:WEST_INIT)].map(item=>item.id==='shaft'?{...item,y:KITCHEN.shaft.y,w:KITCHEN.shaft.l,d:KITCHEN.shaft.w}:item)
    const kitchenCabinet=new THREE.MeshStandardMaterial({color:savedKitchen.materials?.cabinetBody||'#efe9df',roughness:.72})
    const westWetSlots=kitchenItems.filter(item=>!item.hidden&&['washing','dishwasher','sink'].includes(item.id)).sort((a,b)=>a.y-b.y)
    for(const [side,modules] of [
      ['east',Array.isArray(savedKitchen.eastModules)?savedKitchen.eastModules:autoFillModules(KITCHEN.length)],
      ['west',Array.isArray(savedKitchen.westModules)?savedKitchen.westModules:autoFillModules(KITCHEN.length-KITCHEN.westGap.to)],
    ]){
      let cursor=KITCHEN.length
      for(const module of modules){
        const width=Number(module.width)||0
        if(width<=0)continue
        const from=cursor-width, to=cursor
        const spans=side==='west'?(()=>{
          const result=[]
          let start=from
          for(const item of westWetSlots){
            const cutStart=Math.max(from,item.y),cutEnd=Math.min(to,item.y+item.w)
            if(cutEnd<=cutStart)continue
            if(cutStart>start)result.push([start,cutStart])
            start=Math.max(start,cutEnd)
          }
          if(start<to)result.push([start,to])
          return result
        })():[[from,to]]
        for(const [start,end] of spans){
          localBox(kg,580,820,end-start,side==='east'?KITCHEN.width-300:300,460,KITCHEN.length-(start+end)/2,kitchenCabinet)
        }
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

    const centerX=X((50+688)/2),centerZ=Z((69+874)/2)
    const setCamera=mode=>{
      if(mode==='top'){
        camera.position.set(centerX,27,centerZ+.001);camera.up.set(0,0,-1);controls.target.set(centerX,0,centerZ)
      }else if(mode==='south'){
        camera.position.set(centerX,9,centerZ-15);camera.up.set(0,1,0);controls.target.set(centerX,1.2,centerZ)
      }else{
        camera.position.set(centerX,29,centerZ+12);camera.up.set(0,1,0);controls.target.set(centerX,1.2,centerZ)
      }
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('perspective')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2()
    let pressedAt=null,markedMesh=null,markedMaterial=null
    const clearMark=()=>{if(markedMesh)markedMesh.material=markedMaterial;markedMesh=null;markedMaterial=null;setWallSelection(null);setWallNote('')}
    const onPointerDown=event=>{pressedAt={x:event.clientX,y:event.clientY}}
    const onPointerUp=event=>{
      if(!pressedAt||Math.hypot(event.clientX-pressedAt.x,event.clientY-pressedAt.y)>6){pressedAt=null;return}
      pressedAt=null
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      const hit=raycaster.intersectObjects(wallMeshes.filter(mesh=>mesh.visible&&mesh.parent.visible),false)[0]
      if(!hit)return
      if(markedMesh)markedMesh.material=markedMaterial
      markedMesh=hit.object;markedMaterial=markedMesh.material;markedMesh.material=markedWallMaterial
      const px=hit.point.x/X_METRES_PER_PIXEL,py=hit.point.z/Z_METRES_PER_PIXEL
      const {roomName,wallSide,bounds,width,length,planWall,balconyPoojaWall}=markedMesh.userData
      let label
      if(balconyPoojaWall){
        const distance=Math.max(0,Math.round((339-px)*X_METRES_PER_PIXEL*1000/10)*10)
        label=`Bedroom 1 balcony — wall between balcony and Pooja Ghar, about ${distance.toLocaleString()} mm from the Bedroom 1 east wall, beside the balcony window`
      }else if(roomName&&wallSide){
        const distance=wallSide==='north'||wallSide==='south'?(bounds[2]-px)/(bounds[2]-bounds[0])*width:(bounds[3]-py)/(bounds[3]-bounds[1])*length
        const reference=wallSide==='north'||wallSide==='south'?'west':'north'
        label=`${roomName} — ${wallSide} wall, about ${(Math.round(distance/10)*10).toLocaleString()} mm from the ${reference} corner`
      }else{
        const nearest=ROOMS.reduce((best,room)=>{
          const [x1,y1,x2,y2]=room.bounds,dx=Math.max(x1-px,0,px-x2),dy=Math.max(y1-py,0,py-y2),d=dx*dx+dy*dy
          return !best||d<best.distance?{name:room.name,distance:d}:best
        },null)
        const direction=planWall?.[0]===planWall?.[2]?'north–south':'east–west'
        label=`Wall near ${nearest.name}, ${direction}, at plan position ${Math.round(px)} from left and ${Math.round(py)} from top`
      }
      setWallSelection({label});setWallNote('')
    }
    renderer.domElement.addEventListener('pointerdown',onPointerDown)
    renderer.domElement.addEventListener('pointerup',onPointerUp)
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    sceneRef.current={setCamera,setWallsVisible:visible=>{walls.visible=visible},setPoojaPersonVisible:visible=>{seatedPerson.visible=visible},setPoojaDoorsOpen:value=>{poojaDoors.userData.setDoorsOpen(value)},clearMark}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);controls.dispose();model.traverse(object=>{object.geometry?.dispose?.();object.material?.dispose?.()});markedWallMaterial.dispose();texture.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view])
  useEffect(()=>{sceneRef.current?.setWallsVisible(showWalls)},[showWalls])
  useEffect(()=>{sceneRef.current?.setPoojaPersonVisible(showPoojaPerson)},[showPoojaPerson])
  useEffect(()=>{sceneRef.current?.setPoojaDoorsOpen(poojaDoorsOpen)},[poojaDoorsOpen])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Whole home in 3D</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>South is up in the initial 3D and top views. Drag to orbit and scroll to zoom.</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button aria-pressed={view==='perspective'} onClick={()=>setView('perspective')} style={buttonStyle(view==='perspective')}>3D overview</button>
        <button aria-pressed={view==='top'} onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button>
        <button aria-pressed={view==='south'} onClick={()=>{setView('south');setShowWalls(false)}} style={buttonStyle(view==='south')}>South view</button>
        <button onClick={()=>setShowWalls(value=>!value)} style={buttonStyle(showWalls)}>{showWalls?'Hide walls':'Show walls'}</button>
        <button onClick={()=>setShowPoojaPerson(value=>!value)} style={buttonStyle(showPoojaPerson)}>{showPoojaPerson?'Hide seated person':'Show seated person'}</button>
        <button onClick={()=>setPoojaDoorsOpen(value=>!value)} style={buttonStyle(poojaDoorsOpen)}>{poojaDoorsOpen?'Close Pooja doors':'Open Pooja doors'}</button>
        <button onClick={()=>setMarkMode(value=>!value)} style={buttonStyle(markMode)}>{markMode?'Back to 3D':'Mark area on plan'}</button>
      </div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1050px)',width:'100%',display:markMode?'none':'block'}}/>
    {markMode?<PlanMarkPanel image={floorPlanImage} width={PLAN_WIDTH} height={PLAN_HEIGHT} rooms={ROOMS} mark={planMark} onChange={setPlanMark} onClose={()=>setMarkMode(false)}/>
      :<WallSelectionPanel selection={wallSelection} note={wallNote} onNoteChange={setWallNote} onClear={()=>sceneRef.current?.clearMark()}/>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'12px 16px 16px',borderTop:'1px solid #e2e8f0'}}>
      {[
        ['Bedroom 3','bedroom3'],['Study','study'],['Kitchen','kitchen'],['Lobby / Dining','lobby'],
        ['Drawing Room','drawing'],['Bedroom 1','bedroom1'],['Main entry','entry'],
      ].map(([label,key])=><button key={key} onClick={()=>onOpenRoom(key)} style={buttonStyle(false)}>{label} ↗</button>)}
    </div>
  </section>
}

function buttonStyle(active){return{padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}
