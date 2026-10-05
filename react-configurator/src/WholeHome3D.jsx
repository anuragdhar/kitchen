import {registerInteriorScene} from './render/interiorScene.js'
import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'
import {createDrawingLobbyPartition} from './rooms/drawing/DrawingLobbyPartition.js'
import {createStudyFurniture} from './rooms/study/StudyFurniture.js'
import {createDiningSet} from './rooms/shared/furniture/tables.js'
import {createBedroom1DoorInfill} from './rooms/lobby/Bedroom1DoorInfill.js'
import {BEDROOM1_CLOSED_DOOR,closedDoorSpanMm} from './config/bedroom1ClosedDoor.js'
import {createBedroom3DressingTable} from './rooms/bedroom3/Bedroom3DressingTable.js'
import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {createSeatedPoojaPerson} from './rooms/pooja/SeatedPoojaPerson.js'
import {createPoojaPlatform} from './rooms/pooja/PoojaPlatform.js'
import {createPoojaDoorAndInterior} from './rooms/pooja/PoojaDoorAndInterior.js'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import floorPlanImage from '../../Interior/home a 501 floor - unmodified.png'
import shoeRackWoodTexture from '../../Interior/entry-textures/shoe-rack-wood.png'
import {EMPTY_ROOM_SHELLS} from './config/roomShellConfig.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'
import {createStudyTerrace} from './rooms/study/StudyTerrace.js'
import {createBedroom3SouthExtension} from './rooms/bedroom3/Bedroom3SouthExtension.js'
import {createBedroom3Bed} from './rooms/bedroom3/Bedroom3Bed.js'
import {createBedroom1Bed} from './rooms/bedroom1/Bedroom1Layouts.js'
import {createBedroom3EntryDoor} from './rooms/bedroom3/Bedroom3EntryDoor.js'
import {createBedroom3Wardrobe} from './rooms/bedroom3/Bedroom3Wardrobe.js'
import {createBedroom3WestChest} from './rooms/bedroom3/Bedroom3WestChest.js'
import {createWindowDetail} from './rooms/shared/WindowDetail.js'
import {createLobbyEastIroningStorage} from './rooms/lobby/LobbyEastIroningStorage.js'
import {createRoomAirConditioning,createPlannedAcIndoorUnit} from './rooms/shared/RoomAirConditioning.js'
import {createAcOutdoorUnits} from './rooms/shared/AcOutdoorUnit.js'
import {createAcPipeRoutes} from './rooms/shared/AcPipeRoutes.js'
import AcRoutesLegend from './home/AcRoutesLegend.jsx'
import {createRoomTaskLighting,createRoomTrackLighting} from './rooms/shared/RoomTaskLighting.js'
import {STUDY_LIGHTING} from './config/studyLightingConfig.js'
import {KITCHEN_LIGHTING} from './config/kitchenLightingConfig.js'
import {createDrawingRoomLayouts,DRAWING_LAYOUTS} from './rooms/drawing/DrawingRoomLayouts.js'
import {createStoreStorage} from './rooms/shared/StoreStorage.js'
import {BALCONY_OFFICE,BALCONY_DESK_HEIGHT_KEY} from './config/balconyOfficeConfig.js'
import {balconyDeskLayout} from './domain/balconyDesk.mjs'
import {KITCHEN,KITCHEN_REFRIGERATOR} from './config/kitchenConfig.js'
import {readSavedKitchen,wholeHomeKitchenItems,wholeHomeBaseSpans,wholeHomeUpperRuns} from './kitchen/wholeHomeKitchen.mjs'
import {ENTRY,ENTRY_WALL_SEGMENTS,entryPocketEastWallSpans,PLAN_IMAGE} from './config/entryConfig.js'
import {createEntryArrivalDoor} from './rooms/entry/EntryArrivalDoor.js'
import {createEntryFoldSeat} from './rooms/entry/EntryFoldSeat.js'
import {createEntryEastCabinet} from './rooms/entry/EntryEastCabinet.js'
import {createEntryOuterDoor} from './rooms/entry/EntryOuterDoor.js'
import {createEntryCeilingLights} from './rooms/entry/EntryCeilingLights.js'
import WallSelectionPanel from './WallSelectionPanel.jsx'
import ItemDimensionsPanel from './ItemDimensionsPanel.jsx'
import {pickItem,selectionOutline} from './render/dimensionPick.js'
import PlanMarkPanel from './PlanMarkPanel.jsx'
import HomeLightingGallery from './HomeLightingGallery.jsx'
import BlenderHomeView from './BlenderHomeView.jsx'
import {HOME_ROOM_LAYOUTS,BLENDER_ROOM_VIEWS} from './config/homeRoomViews.js'
import {daylightPreset} from './render/daylight.mjs'
import {TRUE_NORTH_OFFSET_DEG,SITE_LATITUDE_DEG} from './config/orientationConfig.js'
import {wallPiecesAroundStorage} from './domain/wallStorage.mjs'
import {createLiveView} from './render/liveView.js'
import {DAYLIGHT_RIG} from './render/lightRig.js'
import RenderQualityControls from './render/RenderQualityControls.jsx'
import StandingCameraControls from './render/StandingCameraControls.jsx'
import {createStandingCamera} from './render/standingCamera.js'
import {useDesignerRender} from './render/useDesignerRender.js'
import {createExistingElectricalPoints} from './rooms/shared/ExistingElectricalPoints.js'
import {createEntryWallCavity} from './rooms/entry/EntryWallCavity.js'

// The A501 plan is south-up: image right is west and image down is north.
const PLAN_WIDTH=PLAN_IMAGE.widthPx,PLAN_HEIGHT=PLAN_IMAGE.heightPx
const X_METRES_PER_PIXEL=ENTRY.planScale.xMetresPerPixel
const Z_METRES_PER_PIXEL=ENTRY.planScale.zMetresPerPixel
const X=x=>x*X_METRES_PER_PIXEL
const Z=y=>y*Z_METRES_PER_PIXEL
const W=X(PLAN_WIDTH),L=Z(PLAN_HEIGHT),HEIGHT=2.7
// Drawn thickness of every plan wall span (m); shared by addSpan and the closed-door cabinet.
const WALL_THICKNESS_M=.085
// Inside face of a drawn wall, measured from the wall's plan line (mm): half its thickness. Builders that sit against a wall take it.
const WALL_FACE_MM=WALL_THICKNESS_M*500
const PLAN_MARK_KEY='a501-whole-home-plan-mark-v1'

const ROOMS=HOME_ROOM_LAYOUTS
// Where "Stand here" first puts the camera: the middle of the Lobby / Dining, from where every room is a few steps away.
const STAND_START=(([x1,y1,x2,y2])=>({xMm:X((x1+x2)/2)*1000,zMm:Z((y1+y2)/2)*1000,headingDeg:90}))(HOME_ROOM_LAYOUTS.find(room=>room.key==='lobby').bounds)

// Wall spans follow the visible plan lines, with gaps left for the current openings.
const WALLS=[
  [50,198,50,390],
  [255,444,424,444],
  [424,316,496,316],
  [50,390,50,503],[50,503,130,503],[130,390,130,503],[130,503,130,671],
  // The kitchen north wall sits level with the former shaft's far edge.
  [KITCHEN.mergedShaftPlan.x1,671,130,671],
  [KITCHEN.mergedShaftPlan.x1,671,KITCHEN.mergedShaftPlan.x1,KITCHEN.mergedShaftPlan.y2],
  [KITCHEN.mergedShaftPlan.x1,KITCHEN.mergedShaftPlan.y2,130,KITCHEN.mergedShaftPlan.y2],
  [255,671,255,KITCHEN.mergedShaftPlan.y2],
  [688,449,688,715],
  ...ENTRY_WALL_SEGMENTS,
]

const GLASS=[
  [273,672,273,794,1.0,HEIGHT], // Bedroom 1 enclosed balcony above railing.
  [273,794,339,794,1.0,HEIGHT],
]

function LiveWholeHome3D({onOpenRoom}){
  const mountRef=useRef(null),sceneRef=useRef(null)
  const designer=useDesignerRender(sceneRef)
  const [view,setView]=useState('perspective')
  const [stand,setStand]=useState(null) // "Stand here" camera readout (render/standingCamera.js)
  const [showWalls,setShowWalls]=useState(true)
  const [showPoojaPerson,setShowPoojaPerson]=useState(true)
  const [showIroningBoard,setShowIroningBoard]=useState(false)
  const [poojaDoorsOpen,setPoojaDoorsOpen]=useState(true)
  const [partitionOpen,setPartitionOpen]=useState(false)
  const [mirrorOpen,setMirrorOpen]=useState(false)
  const [medicineCabinetOpen,setMedicineCabinetOpen]=useState(false)
  const [tvLabels,setTvLabels]=useState(false)
  const tvLabelsRef=useRef(false)
  // Drawing Room seating layout (DRAWING_LAYOUTS); 'southSofas' (C, owner 2026-10-03) is the default.
  const [drawingLayout,setDrawingLayout]=useState('southSofas'),drawingLayoutRef=useRef('southSofas')
  const [armOut,setArmOut]=useState(false),[tvSize,setTvSize]=useState('55'),[doorSwing,setDoorSwing]=useState(true),[storageOpen,setStorageOpen]=useState(false),[showElectrical,setShowElectrical]=useState(false)
  const [showExisting,setShowExisting]=useState(false) // existing switchboards and sockets from the phone scan (existingElectricalConfig.js)
  const [storageCoverOpen,setStorageCoverOpen]=useState(false)
  const [wallSelection,setWallSelection]=useState(null)
  const [pickedItem,setPickedItem]=useState(null)
  const [wallNote,setWallNote]=useState('')
  const [markMode,setMarkMode]=useState(false)
  // null = existing studio lighting; a decimal hour drives the daylight sun.
  const [sunHour,setSunHour]=useState(null)
  const sunHourRef=useRef(null)
  // 100 = the scene's normal ambient/interior light; 0 = sun only.
  const [roomLightPercent,setRoomLightPercent]=useState(100)
  const roomLightRef=useRef(100)
  const [measureMode,setMeasureMode]=useState(false)
  const [showCavity,setShowCavity]=useState(false)
  const [entryDoorsOpen,setEntryDoorsOpen]=useState(false)
  const [showAcRoutes,setShowAcRoutes]=useState(false) // pipe and drain routes of the whole-home AC plan (config/acPlanConfig.js)
  const [measureResult,setMeasureResult]=useState(null)
  const [planMark,setPlanMark]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAN_MARK_KEY)||'{}')}catch{return {}}})

  useEffect(()=>{try{localStorage.setItem(PLAN_MARK_KEY,JSON.stringify(planMark))}catch{}},[planMark])

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const scene=new THREE.Scene();scene.background=new THREE.Color('#edf3f7')
    const camera=new THREE.PerspectiveCamera(45,1,.05,150)
    // Renderer, tone mapping, environment, shadows, quality and the Designer render: render/liveView.js.
    const view=createLiveView({mount,scene,camera,designer:designer.ref.current}),{renderer}=view
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    controls.maxPolarAngle=Math.PI/2.02;controls.minDistance=8;controls.maxDistance=65
    const model=new THREE.Group();scene.add(model)
    const walls=new THREE.Group();model.add(walls)
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#ece8e0',roughness:.87,side:THREE.DoubleSide})
    tagSurfaceMaterial(wallMaterial,'plaster')
    const drawingWallMaterial=new THREE.MeshStandardMaterial({color:'#dfd2c4',roughness:.87,side:THREE.DoubleSide})
    tagSurfaceMaterial(drawingWallMaterial,'plaster')
    const aluminium=new THREE.MeshStandardMaterial({color:'#303b45',metalness:.65,roughness:.31})
    const glass=new THREE.MeshStandardMaterial({color:'#a5dbe9',transparent:true,opacity:.35,metalness:.08,roughness:.12,side:THREE.DoubleSide,depthWrite:false})
    const wood=new THREE.MeshStandardMaterial({color:'#b18b67',roughness:.7})
    tagSurfaceMaterial(wood,'wood')
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
    slab.position.set(W/2,-.09,L/2);slab.receiveShadow=true;model.add(slab)
    for(const room of ROOMS){
      const [x1,y1,x2,y2]=room.bounds
      const floor=addBox(X(x2-x1),.018,Z(y2-y1),X((x1+x2)/2),.016,Z((y1+y2)/2),new THREE.MeshBasicMaterial({color:room.color,transparent:true,opacity:.22,depthWrite:false}),model)
      floor.castShadow=false
    }
    // Shadow-only ceilings: the daylight sun otherwise has nothing to block it
    // from directly overhead, so every room reads as lit even at floor level
    // away from any window (owner feedback 2026-09-29 - "sunlight shouldn't
    // come from the ceiling, it's covered"). colorWrite/depthWrite are off so
    // these stay invisible and non-occluding for every camera (including the
    // bird's-eye cutaway views); they only ever render into the sun's shadow
    // map. Skip the terrace, which is genuinely open to the sky.
    const shadowCeilingMaterial=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false})
    for(const room of ROOMS){
      if(room.key==='terrace')continue
      const [x1,y1,x2,y2]=room.bounds
      const ceiling=addBox(X(x2-x1),.02,Z(y2-y1),X((x1+x2)/2),HEIGHT,Z((y1+y2)/2),shadowCeilingMaterial,model)
      ceiling.receiveShadow=false
    }
    const mergedShaft=KITCHEN.mergedShaftPlan
    const extensionFloor=addBox(X(130-mergedShaft.x1),.018,Z(mergedShaft.y2-671),X((mergedShaft.x1+130)/2),.016,Z((671+mergedShaft.y2)/2),new THREE.MeshBasicMaterial({color:'#dca56c',transparent:true,opacity:.22,depthWrite:false}),model)
    extensionFloor.castShadow=false
    const addSpan=(segment,bottom=0,top=HEIGHT,material=wallMaterial)=>{
      const [x1,y1,x2,y2]=segment,xA=X(x1),xB=X(x2),zA=Z(y1),zB=Z(y2)
      const dx=xB-xA,dz=zB-zA,length=Math.hypot(dx,dz)
      if(length<.01||top<=bottom) return
      const beam=addBox(length,top-bottom,WALL_THICKNESS_M,(xA+xB)/2,(top+bottom)/2,(zA+zB)/2,material)
      beam.rotation.y=-Math.atan2(dz,dx)
      wallMeshes.push(beam)
      return beam
    }
    // The wall shared with the Drawing Room has the door of the pocket's west cabinet cut through it (the Drawing Room's own north edge is cut in roomEdge).
    const drawingBounds=ROOMS.find(room=>room.name==='Drawing Room').bounds
    WALLS.forEach(segment=>{
      const pieces=wallPiecesAroundStorage(segment,EMPTY_ROOM_SHELLS.drawing,drawingBounds,HEIGHT)
      for(const [piece,bottom,top] of pieces||[[segment,0,HEIGHT]]){const mesh=addSpan(piece,bottom,top);if(mesh)mesh.userData={planWall:segment}}
    })
    // The pocket's east wall (plan-left): the east cabinet is open onto the Entry gallery (ENTRY.wallCavity.eastOpening).
    for(const [segment,bottom,top] of entryPocketEastWallSpans(HEIGHT)){const mesh=addSpan(segment,bottom,top);if(mesh)mesh.userData={planWall:segment}}
    const entryWoodenDoor=createEntryArrivalDoor(X,Z);model.add(entryWoodenDoor)
    model.add(createEntryFoldSeat(X,Z))
    model.add(createEntryEastCabinet(X,Z))
    // Owner 2026-10-06: landing stays plain; proposed steel/wood pair shares the arrival opening.
    const entrySteelDoor=createEntryOuterDoor(X,Z);model.add(entrySteelDoor)
    const setEntryDoorsOpen=open=>{entrySteelDoor.userData.setOpen(open?ENTRY.outerDoor.maxOpenAngleDegrees:0);entryWoodenDoor.userData.setOpen(open?ENTRY.arrivalDoor.maxOpenAngleDegrees:0)}
    setEntryDoorsOpen(false)
    model.add(createEntryCeilingLights(X,Z))
    // Entry wall cavity (owner mark 2026-09-30): translucent volumes and depth labels, shown by 'Show entry wall cavity'.
    const cavityGroup=createEntryWallCavity(X,Z);model.add(cavityGroup)
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
      group.userData.roomScale={x:group.scale.x,y:1,z:group.scale.z} // lets a clicked item report room millimetres (dimensionPick.js)
      model.add(group)
      return group
    }
    const localBox=(group,w,h,d,x,y,z,material)=>addBox(w/1000,h/1000,d/1000,x/1000,y/1000,z/1000,material,group)
    const boundsNames=new Map() // room frames that are not a HOME_ROOM_LAYOUTS bounds array
    const roomEdge=(bounds,width,length,side,holes=[])=>{
      const roomName=boundsNames.get(bounds)||ROOMS.find(room=>room.bounds===bounds)?.name||'Whole home'
      const total=side==='north'||side==='south'?width:length
      const valid=holes.map(h=>({...h,start:Math.max(0,h.start),end:Math.min(total,h.end)})).filter(h=>h.end>h.start).sort((a,b)=>a.start-b.start)
      const line=(start,end,bottom=0,top=HEIGHT,material=roomName==='Drawing Room'?drawingWallMaterial:wallMaterial)=>{
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
    tagSurfaceMaterial(paleWood,'wood')
    const stone=new THREE.MeshStandardMaterial({color:'#e7dfd3',roughness:.48})
    const cabinet=new THREE.MeshStandardMaterial({color:'#d4d1c9',roughness:.65})
    tagSurfaceMaterial(cabinet,'wood')
    const screen=new THREE.MeshStandardMaterial({color:'#192c3b',metalness:.16,roughness:.32})

    const entryRack=ENTRY.shoeRack
    const rackWidth=entryRack.widthMm/1000,rackDepth=entryRack.projectionMm/1000,rackHeight=entryRack.heightMm/1000
    const rackX=X((entryRack.planX1+entryRack.planX2)/2),rackFrontZ=Z(entryRack.planNorthY)-.005,rackBackZ=rackFrontZ+rackDepth
    // Real wood-grain photo, cropped from the owner's Scaniverse scan of this
    // exact shoe rack (Interior/scans/entry-scan-2.glb, owner request 2026-09-29).
    const rackWoodMap=new THREE.TextureLoader().load(shoeRackWoodTexture)
    rackWoodMap.colorSpace=THREE.SRGBColorSpace
    rackWoodMap.wrapS=rackWoodMap.wrapT=THREE.RepeatWrapping
    rackWoodMap.repeat.set(3,2)
    const rackBody=new THREE.MeshStandardMaterial({map:rackWoodMap,color:'#d8c9a8',roughness:.72})
    tagSurfaceMaterial(rackBody,'wood')
    // Mirror-fronted shoe cabinet doors (owner reference, 2026-09-29).
    const rackDoors=new THREE.MeshStandardMaterial({color:'#bdced2',metalness:.88,roughness:.12})
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
    dg.add(createRoomAirConditioning(drawing))
    const drawingLayouts=createDrawingRoomLayouts(drawing,{wallFaceMm:WALL_FACE_MM,initial:drawingLayoutRef.current});dg.add(drawingLayouts.built,drawingLayouts.furniture)
    drawingLayouts.setLabels(tvLabelsRef.current)
    const partition=createDrawingLobbyPartition(drawing,'drawing');dg.add(partition)
    partition.userData.setOpen(partitionOpen)
    const existingDrawing=createExistingElectricalPoints('drawing',drawing,{wallFaceMm:WALL_FACE_MM});if(existingDrawing){existingDrawing.visible=false;dg.add(existingDrawing)}
    const dw=drawing.windows[0],dd=drawing.doors[0],open=drawing.wallOpenings.east
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'south',[{start:dw.fromMm,end:dw.fromMm+dw.widthMm,bottom:dw.bottomMm/1000,top:dw.topMm/1000,glass:true}])
    // Window design (bays, transom, shutters, nets, outside screen) from the same shared builder as the room page, in room metres.
    dg.add(createWindowDetail({kind:'window',from:dw.fromMm/1000,to:(dw.fromMm+dw.widthMm)/1000,bottom:dw.bottomMm/1000,top:dw.topMm/1000,frameStyle:dw.frameStyle,mullionFractions:dw.mullionFractions,design:dw},{z:drawing.lengthMm/1000,outward:1,materials:{frame:cabinet,darkFrame:aluminium,glass,handle:aluminium}}))
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'north',[{start:drawing.wallStorage.fromWestMm,end:drawing.wallStorage.fromWestMm+drawing.wallStorage.widthMm,bottom:drawing.wallStorage.bottomMm/1000,top:(drawing.wallStorage.bottomMm+drawing.wallStorage.heightMm)/1000},...drawing.doors.filter(door=>door.wall==='north').map(door=>({start:door.fromMm,end:door.fromMm+door.widthMm,top:door.heightMm/1000}))])
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'east',[{start:open.fromMm,end:open.toMm,top:HEIGHT}])
    roomEdge(db,drawing.widthMm,drawing.lengthMm,'west')
    const beam=drawing.hangingBeams[0]
    const ba=roomPoint(db,drawing.widthMm,drawing.lengthMm,drawing.widthMm,beam.fromMm)
    const bb=roomPoint(db,drawing.widthMm,drawing.lengthMm,drawing.widthMm,beam.toMm)
    addSpan([...ba,...bb],HEIGHT-beam.dropMm/1000,HEIGHT)

    const lobby=EMPTY_ROOM_SHELLS.lobby,lb=boundsFor('Lobby / Dining')
    const lg=roomGroup(lb,lobby.widthMm,lobby.lengthMm)
    lg.add(createRoomAirConditioning(lobby))
    lg.add(createRoomTaskLighting(lobby))
    const existingLobby=createExistingElectricalPoints('lobby',lobby,{wallFaceMm:WALL_FACE_MM});if(existingLobby){existingLobby.visible=false;lg.add(existingLobby)}
    const toilet=lobby.doors.find(door=>door.wall==='south'),bedDoor=lobby.doors.find(door=>door.wall==='north')
    // The toilet door is an ordinary visible door again (owner 2026-10-06; the panel wall that hid it is dropped).
    localBox(lg,toilet.widthMm-90,toilet.heightMm-80,35,toilet.fromMm+toilet.widthMm/2,(toilet.heightMm-80)/2,lobby.lengthMm,wood)
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'south',[{start:toilet.fromMm,end:toilet.fromMm+toilet.widthMm,top:toilet.heightMm/1000}])
    // The old plan door on this wall is closed (owner, 2026-09-29): sheet on the lobby face, medicine cabinet behind it.
    const closedDoor=BEDROOM1_CLOSED_DOOR,closedSpan=closedDoorSpanMm(closedDoor,lb,lobby.widthMm)
    const doorInfill=createBedroom1DoorInfill(closedDoor,closedSpan,WALL_THICKNESS_M*1000);lg.add(doorInfill)
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'north',[
      {start:bedDoor.fromMm,end:bedDoor.fromMm+bedDoor.widthMm,top:bedDoor.heightMm/1000},
      {start:closedSpan.start,end:closedSpan.end,top:closedDoor.heightMm/1000},
      {start:lobby.poojaAlcove.fromMm,end:lobby.poojaAlcove.fromMm+lobby.poojaAlcove.widthMm,top:HEIGHT},
    ])
    roomEdge(lb,lobby.widthMm,lobby.lengthMm,'east',[{start:lobby.wallOpenings.east.fromMm,end:lobby.wallOpenings.east.toMm,top:HEIGHT}])
    const ironingStorage=createLobbyEastIroningStorage(lobby)
    lg.add(ironingStorage)
    // Dining table and chairs: the same shared builder as the Lobby room page (rooms/shared/furniture/tables.js).
    lg.add(createDiningSet(lobby.furniture))
    const pooja=lobby.poojaAlcove
    // Close the recess so the door interior's backing panel and artwork sit against a
    // solid wall instead of leaving a gap to whatever is beyond the alcove.
    localBox(lg,pooja.widthMm,HEIGHT*1000,90,pooja.fromMm+pooja.widthMm/2,HEIGHT*500,-pooja.depthMm,stone)
    for(const x of [pooja.fromMm,pooja.fromMm+pooja.widthMm])localBox(lg,70,HEIGHT*1000,pooja.depthMm,x,HEIGHT*500,-pooja.depthMm/2,stone)
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

    const bedroom3=EMPTY_ROOM_SHELLS.bedroom3,b3b=boundsFor('Bedroom 3')
    const b3g=roomGroup(b3b,bedroom3.widthMm,bedroom3.lengthMm)
    roomEdge(b3b,bedroom3.widthMm,bedroom3.lengthMm,'north',bedroom3.doors.filter(door=>door.wall==='north').map(door=>({start:door.fromMm,end:door.fromMm+door.widthMm,top:door.heightMm/1000})))
    const {cabinet:b3Cabinet,balcony:b3Balcony}=bedroom3.southExtension
    roomEdge(b3b,bedroom3.widthMm,bedroom3.lengthMm,'south',[
      {start:b3Cabinet.fromWestMm,end:b3Cabinet.fromWestMm+b3Cabinet.widthMm,bottom:b3Cabinet.floorClearanceMm/1000,top:(b3Cabinet.floorClearanceMm+b3Cabinet.heightMm)/1000},
      {start:b3Balcony.doorFromWestMm,end:b3Balcony.doorFromWestMm+b3Balcony.doorWidthMm,bottom:0,top:b3Balcony.doorHeightMm/1000,glass:true},
      {start:b3Balcony.windowFromWestMm,end:b3Balcony.windowFromWestMm+b3Balcony.windowWidthMm,bottom:b3Balcony.windowSillMm/1000,top:b3Balcony.windowTopMm/1000,glass:true},
    ])
    // Scanned transoms and mid rail on the balcony door and window (phone scan 2026-10-04), from the shared window builder.
    if(b3Balcony.doorTransomMm)b3g.add(createWindowDetail({kind:'glassDoor',from:b3Balcony.doorFromWestMm/1000,to:(b3Balcony.doorFromWestMm+b3Balcony.doorWidthMm)/1000,bottom:0,top:b3Balcony.doorHeightMm/1000,frameStyle:'dark',design:{fromMm:b3Balcony.doorFromWestMm,widthMm:b3Balcony.doorWidthMm,bottomMm:0,topMm:b3Balcony.doorHeightMm,transomMm:b3Balcony.doorTransomMm}},{z:bedroom3.lengthMm/1000,outward:1,materials:{frame:cabinet,darkFrame:aluminium,glass,handle:aluminium}}))
    if(b3Balcony.windowTransomMm)b3g.add(createWindowDetail({kind:'window',from:b3Balcony.windowFromWestMm/1000,to:(b3Balcony.windowFromWestMm+b3Balcony.windowWidthMm)/1000,bottom:b3Balcony.windowSillMm/1000,top:b3Balcony.windowTopMm/1000,frameStyle:'dark',mullionFractions:[],design:{fromMm:b3Balcony.windowFromWestMm,widthMm:b3Balcony.windowWidthMm,bottomMm:b3Balcony.windowSillMm,topMm:b3Balcony.windowTopMm,transomMm:b3Balcony.windowTransomMm,railsMm:b3Balcony.windowRailsMm}},{z:bedroom3.lengthMm/1000,outward:1,materials:{frame:cabinet,darkFrame:aluminium,glass,handle:aluminium}}))
    b3g.add(createBedroom3SouthExtension(bedroom3))
    // AC outdoor units at the owner's plan marks (config/acOutdoorUnitsConfig.js), in plan coordinates.
    model.add(createAcOutdoorUnits(X,Z))
    const acRoutes=createAcPipeRoutes(X,Z);model.add(acRoutes) // hidden until 'Show AC pipe routes'
    b3g.add(createBedroom3Bed(bedroom3))
    const vanity=createBedroom3DressingTable(bedroom3);b3g.add(vanity);vanity.userData.setMirrorOpen(mirrorOpen)
    b3g.add(createBedroom3EntryDoor(bedroom3))
    b3g.add(createBedroom3Wardrobe(bedroom3))
    b3g.add(createBedroom3WestChest(bedroom3))
    b3g.add(createRoomTaskLighting(bedroom3)) // tracks and the assumed fan (config/bedroom3LightingConfig.js)

    const study=STUDY_ROOM,sd=study.dimensions,sb=boundsFor('Study')
    const sg=roomGroup(sb,sd.widthMm,sd.lengthMm)
    sg.add(createStudyTerrace(study))
    sg.add(createStudyFurniture(study).group)
    sg.add(createPlannedAcIndoorUnit('study')) // AC plan: west wall, just north of the Home Office opening
    sg.add(createRoomTrackLighting(STUDY_LIGHTING,sd)) // tracks and the assumed fan (config/studyLightingConfig.js)
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
    // Desk positions come from the pure balcony layout (src/domain/balconyDesk.mjs): sit-stand top, rear cabinet, fixed
    // south section with its cabinet, PC, printer and laptop, all in balcony millimetres (x from the west wall, z from the north).
    const desk=office.worktop.westAdjustable,deskLayout=balconyDeskLayout(office),rear=deskLayout.rear,fixedDesk=deskLayout.fixed
    const savedDeskHeight=Number(localStorage.getItem(BALCONY_DESK_HEIGHT_KEY))
    const deskHeight=Number.isFinite(savedDeskHeight)&&savedDeskHeight>=desk.minHeightMm&&savedDeskHeight<=desk.maxHeightMm?savedDeskHeight:desk.defaultHeightMm
    const mid=(a,b)=>(a+b)/2
    localBox(og,desk.depthMm,desk.topThicknessMm,deskLayout.moving.lengthMm,mid(deskLayout.moving.x0,deskLayout.moving.x1),deskHeight-desk.topThicknessMm/2,mid(deskLayout.moving.zStart,deskLayout.moving.zEnd),paleWood)
    localBox(og,rear.depthMm,rear.topMm-rear.toeMm,rear.end-rear.start,rear.depthMm/2,mid(rear.toeMm,rear.topMm),mid(rear.start,rear.end),cabinet)
    for(const bay of rear.bays.slice(1))localBox(og,rear.depthMm+10,rear.topMm-rear.toeMm,18,rear.depthMm/2,mid(rear.toeMm,rear.topMm),bay.start,wood)
    if(fixedDesk){
      localBox(og,fixedDesk.x1-fixedDesk.x0,fixedDesk.thicknessMm,fixedDesk.lengthMm,mid(fixedDesk.x0,fixedDesk.x1),fixedDesk.topHeightMm-fixedDesk.thicknessMm/2,mid(fixedDesk.zStart,fixedDesk.zEnd),paleWood)
      localBox(og,fixedDesk.cabinet.x1-fixedDesk.cabinet.x0,fixedDesk.cabinet.y1-fixedDesk.cabinet.y0,fixedDesk.lengthMm-4,mid(fixedDesk.cabinet.x0,fixedDesk.cabinet.x1),mid(fixedDesk.cabinet.y0,fixedDesk.cabinet.y1),mid(fixedDesk.zStart,fixedDesk.zEnd),cabinet)
      const pr=fixedDesk.printer
      if(pr)localBox(og,pr.x1-pr.x0,pr.y1-pr.y0,pr.zEnd-pr.zStart,mid(pr.x0,pr.x1),mid(pr.y0,pr.y1),pr.centerZ,screen)
    }
    const north=office.cabinetry.northWall
    localBox(og,od.widthMm,north.upper.heightMm,north.upper.depthMm,od.widthMm/2,od.floorToCeilingMm-north.upper.heightMm/2,north.upper.depthMm/2,cabinet)
    localBox(og,north.lower.widthMm,north.lower.heightMm,north.lower.depthMm,north.lower.widthMm/2,north.lower.heightMm/2,north.lower.depthMm/2,cabinet)
    const mon=deskLayout.monitors
    for(const [m,spec] of [[mon.right,office.equipment.monitors.find(x=>x.side==='right')],[mon.left,office.equipment.monitors.find(x=>x.side==='left')]])localBox(og,45,m.heightMm,m.widthMm,deskLayout.moving.x0+130,deskHeight+mon.screenBottomMm+m.heightMm/2,m.centerZ,screen)
    const pc=deskLayout.pcTower
    localBox(og,pc.x1-pc.x0,pc.y1-pc.y0,pc.zEnd-pc.zStart,mid(pc.x0,pc.x1),mid(pc.y0,pc.y1),pc.centerZ,cabinet)
    const lap=deskLayout.laptop,lapY=lap.on==='fixed'?lap.topY:deskHeight
    localBox(og,lap.depthMm,18,lap.widthMm,mid(lap.x0,lap.x1),lapY+9,lap.centerZ,screen)

    // Bedroom 1's plan bounds (HOME_ROOM_LAYOUTS) include its east balcony (plan x 273-339). The room frame is the bedroom
    // itself, west wall (plan x 515) to east wall (plan x 339, the balcony's inner edge); the balcony extension continues past
    // widthMm at the same scale. Fitting widthMm to the whole bounds stretched the room 1.39x east, so the bed ran into the
    // Pooja Ghar and the east wall was drawn through it (owner report 2026-10-03).
    const bedroomPlan=boundsFor('Bedroom 1'),bbounds=[ROOMS.find(room=>room.key==='bedroom1-balcony').bounds[2],...bedroomPlan.slice(1)]
    boundsNames.set(bbounds,'Bedroom 1')
    const bedroom=EMPTY_ROOM_SHELLS.bedroom1
    const bg=roomGroup(bbounds,bedroom.widthMm,bedroom.lengthMm)
    bg.add(createRoomAirConditioning(bedroom))
    bg.add(createRoomTaskLighting(bedroom)) // tracks and the assumed fan (config/bedroom1LightingConfig.js)
    const poojaWardrobe=bedroom.balconyExtension?.poojaWallWardrobe
    if(poojaWardrobe){
      const {widthMm:width,depthMm:depth,heightMm:height,doorCount}=poojaWardrobe
      const cabinetBody=new THREE.MeshStandardMaterial({color:'#a78059',roughness:.7})
      tagSurfaceMaterial(cabinetBody,'wood')
      const cabinetFront=new THREE.MeshStandardMaterial({color:'#dce6dd',roughness:.55})
      tagSurfaceMaterial(cabinetFront,'wood')
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
    // Masonry between the Pooja Ghar and Bedroom 1 (owner report 2026-10-03: "weird gap"). The Pooja Ghar is modelled to plan
    // x 317 and Bedroom 1 starts at x 339; the A501 plan draws a thick wall there, not a space. Filled solid from the Pooja east
    // wall to the bedroom wall, north wall to the balcony's north end, so nothing reads as an empty slot. An assumption from
    // the drawing: the exact thickness (about 420 mm here) is not measured.
    {
      const pooja=BLENDER_ROOM_VIEWS.pooja.bounds,balconyNorth=ROOMS.find(room=>room.key==='bedroom1-balcony').bounds[1]
      const block=addBox(X(bbounds[0]-pooja[2]),HEIGHT,Z(balconyNorth-pooja[1]),X((pooja[2]+bbounds[0])/2),HEIGHT/2,Z((pooja[1]+balconyNorth)/2),wallMaterial)
      block.name='Masonry between Pooja Ghar and Bedroom 1';wallMeshes.push(block);block.userData={planWall:[pooja[2],pooja[1],bbounds[0],balconyNorth]}
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
      tagSurfaceMaterial(body,'wood')
      const front=new THREE.MeshStandardMaterial({color:'#eee8df',roughness:.58})
      tagSurfaceMaterial(front,'wood')
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
    // The bed of layout A (the present one), from the same builder as the Bedroom 1 page (rooms/bedroom1/Bedroom1Layouts.js).
    if(bedroom.furniture?.bed)bg.add(createBedroom1Bed(bedroom,'present'))
    const wardrobe=bedroom.furniture?.wardrobe
    if(wardrobe){
      const {depthMm:depth,lengthMm:length,heightMm:height,fromNorthMm:start}=wardrobe
      const body=new THREE.MeshStandardMaterial({color:'#d0c0aa',roughness:.76})
      tagSurfaceMaterial(body,'wood')
      const front=new THREE.MeshStandardMaterial({color:'#e9e1d4',roughness:.66})
      tagSurfaceMaterial(front,'wood')
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
      tagSurfaceMaterial(tableMat,'wood')
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
    kg.add(createRoomTrackLighting(KITCHEN_LIGHTING,KITCHEN_LIGHTING.room)) // the ceiling track (config/kitchenLightingConfig.js); this group is in the room frame, so no mirroring here
    const fridge=KITCHEN_REFRIGERATOR
    // Storage inherits the kitchen plan's z scale; the existing fridge below is drawn at true width.
    // Convert its span into that room frame so the upper panel covers it without moving racks or fridge.
    // If needed the fixed panel extends behind the closed slider, still separated by the passing gap.
    const storeStorage=createStoreStorage({fridge:{...fridge,widthMm:fridge.widthMm/kg.scale.z,southWallThicknessMm:fridge.southWallThicknessMm/kg.scale.z}})
    storeStorage.userData.setCoverOpen(storageCoverOpen)
    storeStorage.position.z=KITCHEN.length/1000
    kg.add(storeStorage)
    roomEdge(kb,KITCHEN.width,KITCHEN.length,'south',[{start:KITCHEN.door.x,end:KITCHEN.door.x+KITCHEN.door.w,top:HEIGHT}])
    roomEdge(kb,KITCHEN.width,KITCHEN.length,'north',[{start:KITCHEN.window.x,end:KITCHEN.window.x+KITCHEN.window.w,bottom:KITCHEN.window.sill/1000,top:HEIGHT,glass:true}])
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
    // Which items, base spans and upper runs: the saved kitchen project or its defaults (kitchen/wholeHomeKitchen.mjs).
    const savedKitchen=readSavedKitchen(()=>localStorage)
    const kitchenItems=wholeHomeKitchenItems(savedKitchen)
    const kitchenCabinet=new THREE.MeshStandardMaterial({color:savedKitchen.materials?.cabinetBody||'#efe9df',roughness:.72})
    tagSurfaceMaterial(kitchenCabinet,'wood')
    const counterMaterial=new THREE.MeshStandardMaterial({color:savedKitchen.materials?.counter||'#ddd8cf',roughness:.4})
    const darkAppliance=new THREE.MeshStandardMaterial({color:'#22282c',roughness:.28,metalness:.5})
    const steelAppliance=new THREE.MeshStandardMaterial({color:'#afb5b8',roughness:.32,metalness:.65})
    for(const {side,start,end} of wholeHomeBaseSpans(savedKitchen,kitchenItems)){
      localBox(kg,600,820,end-start,side==='east'?KITCHEN.width-300:300,460,KITCHEN.length-(start+end)/2,kitchenCabinet)
      localBox(kg,600,30,end-start,side==='east'?KITCHEN.width-300:300,885,KITCHEN.length-(start+end)/2,counterMaterial)
    }
    // Match the upper runs in the detailed kitchen, including the dish-rack opening.
    for(const {side,start,end,upperDepth,rack,lowerSpans} of wholeHomeUpperRuns(savedKitchen,kitchenItems)){
      for(const [a,b] of lowerSpans)if(b>a)localBox(kg,320,500,b-a,side==='east'?KITCHEN.width-160:160,1600,KITCHEN.length-(a+b)/2,kitchenCabinet)
      localBox(kg,upperDepth,850,end-start,side==='east'?KITCHEN.width-upperDepth/2:upperDepth/2,2275,KITCHEN.length-(start+end)/2,kitchenCabinet)
      for(let y=start;y<end;y+=600){
        const width=Math.min(600,end-y)
        localBox(kg,12,830,3,side==='east'?KITCHEN.width-upperDepth-3:upperDepth+3,2275,KITCHEN.length-y,darkAppliance)
        if(!rack||y+width<=rack.y||y>=rack.y+rack.w)localBox(kg,12,480,3,side==='east'?KITCHEN.width-323:323,1600,KITCHEN.length-y,darkAppliance)
      }
    }
    for(const item of kitchenItems){
      if(item.hidden||item.powerPoint||!item.w||!item.d||!item.h)continue
      const itemMaterial=new THREE.MeshStandardMaterial({color:item.color||'#c4b5a5',roughness:.72})
      if(['applianceGarage','eastBacksplashSlider','westSixInchSlider','sinkUpperDishRack'].includes(item.id))tagSurfaceMaterial(itemMaterial,'wood','kitchen')
      const cx=(item.x||0)+item.d/2,cz=KITCHEN.length-(item.y||0)-item.w/2,cy=(item.z||0)+item.h/2
      if(item.id==='sink'){
        localBox(kg,item.d,25,item.w,cx,885,cz,steelAppliance)
        localBox(kg,item.d-90,8,item.w-120,cx,900,cz,darkAppliance)
        localBox(kg,600-item.d,30,item.w,item.d+(600-item.d)/2,885,cz,counterMaterial)
        localBox(kg,25,230,25,70,1000,cz,steelAppliance)
        localBox(kg,160,22,22,140,1104,cz,steelAppliance)
        continue
      }
      localBox(kg,item.d,item.h,item.w,cx,cy,cz,itemMaterial)
      if(item.id==='washing'){
        const drum=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.025,32),darkAppliance);drum.rotation.z=Math.PI/2;drum.position.set(((item.x||0)+item.d+12)/1000,.45,cz/1000);kg.add(drum)
        localBox(kg,15,65,item.w-50,(item.x||0)+item.d+8,790,cz,steelAppliance)
      }
      if(item.id==='dishwasher'){
        localBox(kg,18,item.h-35,item.w-25,(item.x||0)+item.d+9,item.h/2,cz,steelAppliance)
        localBox(kg,25,25,item.w-100,(item.x||0)+item.d+25,item.h-120,cz,darkAppliance)
      }
      if(item.id==='gas'){
        localBox(kg,item.d-35,20,item.w-25,cx,915,cz,darkAppliance)
        for(const offset of [-item.w*.3,0,item.w*.3]){const burner=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.015,24),steelAppliance);burner.position.set(cx/1000,.933,(cz+offset)/1000);kg.add(burner)}
      }
      if(item.id==='microwave')localBox(kg,15,item.h-60,item.w-90,(item.x||0)-8,cy,cz,darkAppliance)
      if(item.id==='applianceGarage')localBox(kg,15,item.h-70,item.w-50,(item.x||0)-8,cy,cz,darkAppliance)
    }
    // The sun's shadow map size, camera and bias are fitted to the model by render/liveView.js (it was a fixed 2048 px square
    // twice the size of the flat).
    const hemi=new THREE.HemisphereLight('#ffffff','#8b9ca8',1.4);scene.add(hemi)
    const sun=new THREE.DirectionalLight('#fff5e5',2);sun.position.set(-5,16,-7);scene.add(sun);scene.add(sun.target)
    sun.castShadow=true
    // Light balance of the shared daylight rig (render/lightRig.js): less flat sky fill and environment than before, so the
    // sun's shadows and the step between lit and shaded walls read. SKY scales the presets' sky strength the same way.
    const STUDIO=DAYLIGHT_RIG.day,SKY=STUDIO.hemisphere/1.4
    // Interior task/accent lights would mask the pure sun effect (owner
    // feedback 2026-09-28), so daylight hours switch them off entirely and
    // night hands the scene back to them.
    const interiorLights=[];scene.traverse(object=>{if(object.isLight&&object!==hemi&&object!==sun)interiorLights.push({light:object,base:object.intensity})})
    // Emissive fixture glow (pendant lamps, downlight lenses, the vanity mirror)
    // renders as material, not a THREE.Light, so it needs its own day/night list.
    const taskGlowMaterials=[];const seenMaterials=new Set()
    scene.traverse(object=>{
      const materials=object.isMesh?[].concat(object.material||[]):[]
      for(const material of materials){
        if(material?.userData?.taskLightGlow && !seenMaterials.has(material)){
          seenMaterials.add(material)
          taskGlowMaterials.push({material,base:material.emissiveIntensity})
        }
      }
    })

    const centerX=X((50+688)/2),centerZ=Z((69+874)/2)
    // Daylight preview: an indicative equinox sun path oriented by the site's
    // true north (orientationConfig.js). hour==null restores studio lighting.
    // roomLight (0-1) is the owner's "in-home light" dial: it scales everything
    // that is not the sun - ambient fill, image-based environment light,
    // interior lights and emissive fixture glow - so 0 leaves the sun alone.
    let roomLight=1,lastHour=null
    const setDaylight=hour=>{
      lastHour=hour
      scene.environmentIntensity=STUDIO.environment*roomLight
      if(hour==null){
        hemi.color.set('#ffffff');hemi.groundColor.set('#8b9ca8');hemi.intensity=STUDIO.hemisphere*roomLight
        sun.color.set('#fff5e5');sun.intensity=STUDIO.sunIntensity;sun.position.set(-5,16,-7);sun.target.position.set(0,0,0)
        scene.background.set('#edf3f7')
        interiorLights.forEach(({light,base})=>{light.intensity=base*roomLight})
        taskGlowMaterials.forEach(({material,base})=>{material.emissiveIntensity=base*roomLight})
        return null
      }
      const p=daylightPreset(hour,{trueNorthOffsetDeg:TRUE_NORTH_OFFSET_DEG,latitudeDeg:SITE_LATITUDE_DEG})
      hemi.color.set(p.hemiSky);hemi.groundColor.set(p.hemiGround);hemi.intensity=p.hemiIntensity*SKY*roomLight
      if(!p.up)scene.environmentIntensity=DAYLIGHT_RIG.evening.environment*roomLight
      sun.color.set(p.sunColor);sun.intensity=p.sunIntensity
      sun.position.set(centerX+p.direction[0]*40,Math.max(p.direction[1],.03)*40,centerZ+p.direction[2]*40)
      sun.target.position.set(centerX,0,centerZ)
      scene.background.set(p.background)
      interiorLights.forEach(({light,base})=>{light.intensity=(p.up?0:base*1.2)*roomLight})
      taskGlowMaterials.forEach(({material,base})=>{material.emissiveIntensity=(p.up?0:base)*roomLight})
      return p
    }
    const setRoomLight=level=>{roomLight=Math.min(Math.max(level,0),1);setDaylight(lastHour)}
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
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;view.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2()
    let pressedAt=null,markedMesh=null,markedMaterial=null
    const clearMark=()=>{if(markedMesh)markedMesh.material=markedMaterial;markedMesh=null;markedMaterial=null;setWallSelection(null);setWallNote('')}
    // Click furniture or a cabinet: outline it and report its size (render/dimensionPick.js).
    let itemOutline=null
    const clearItem=()=>{if(itemOutline){scene.remove(itemOutline);itemOutline.userData.dispose();itemOutline=null}setPickedItem(null)}
    const showItem=item=>{clearItem();itemOutline=selectionOutline(item.box);scene.add(itemOutline);const {box,object,...rest}=item;setPickedItem(rest)}
    // Tape measure: click a first point on any surface, then the line, the three axis legs and a tooltip follow the mouse
    // live until the second click (Esc cancels). World units are metres; readings snap to 5 mm.
    const measureGroup=new THREE.Group();measureGroup.name='measure overlay';scene.add(measureGroup)
    let measureActive=false,measureStart=null,liveLine=null,liveGuide=null,liveDot=null,hoverDot=null,lastMove=null,moveFrame=0,lastStateAt=0
    const shown=object=>{for(let node=object;node;node=node.parent)if(!node.visible)return false;return true}
    const tip=document.createElement('div')
    tip.style.cssText='position:fixed;z-index:60;pointer-events:none;display:none;padding:6px 10px;border-radius:9px;background:rgba(23,32,51,.94);color:#fff;font:600 13px system-ui,sans-serif;line-height:1.35;box-shadow:0 4px 14px rgba(0,0,0,.28);white-space:nowrap'
    document.body.appendChild(tip)
    const snapMm=v=>Math.round(v*1000/5)*5
    const fmt=v=>`${snapMm(v).toLocaleString()} mm`
    const readingOf=(a,b)=>({direct:fmt(a.distanceTo(b)),floor:fmt(Math.hypot(b.x-a.x,b.z-a.z)),rise:fmt(Math.abs(b.y-a.y)),ew:fmt(Math.abs(b.x-a.x)),ns:fmt(Math.abs(b.z-a.z))})
    const dot=(point,color,radius=.06)=>{
      const marker=new THREE.Mesh(new THREE.SphereGeometry(radius,16,16),new THREE.MeshBasicMaterial({color,depthTest:false}))
      marker.position.copy(point);marker.renderOrder=999;measureGroup.add(marker);return marker
    }
    const polyline=(points,color,opacity=1)=>{
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthTest:false}))
      line.renderOrder=998;line.frustumCulled=false;measureGroup.add(line);return line
    }
    const setPoints=(line,points)=>{
      const position=line.geometry.attributes.position
      points.forEach((p,i)=>position.setXYZ(i,p.x,p.y,p.z));position.needsUpdate=true
    }
    // start -> east-west leg -> north-south leg -> up/down leg to the end: the three axis components of the reading.
    const legs=(a,b)=>[a,new THREE.Vector3(b.x,a.y,a.z),new THREE.Vector3(b.x,a.y,b.z),b]
    const clearMeasure=()=>{
      measureStart=liveLine=liveGuide=liveDot=hoverDot=null;tip.style.display='none'
      measureGroup.children.forEach(child=>{child.geometry.dispose();child.material.dispose()});measureGroup.clear();setMeasureResult(null)
    }
    const setMeasure=active=>{measureActive=active;renderer.domElement.style.cursor=active?'crosshair':'grab';if(!active)clearMeasure()}
    const pickPoint=event=>{
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      const hit=raycaster.intersectObjects(scene.children.filter(child=>child!==measureGroup),true).find(h=>h.object.isMesh&&shown(h.object)&&!h.object.userData.noMeasure)
      return hit?hit.point.clone():null
    }
    const showTip=(event,reading)=>{
      tip.innerHTML=`<div style="font-size:15px">${reading.direct}</div><div style="font-weight:500;color:#cbd5e1;font-size:12px">E–W ${reading.ew} · N–S ${reading.ns} · height ${reading.rise}</div>`
      tip.style.display='block'
      tip.style.left=Math.min(event.clientX+18,window.innerWidth-tip.offsetWidth-8)+'px'
      tip.style.top=Math.min(event.clientY+18,window.innerHeight-tip.offsetHeight-8)+'px'
    }
    const handleMeasureClick=hitPoint=>{
      if(!measureStart){
        clearMeasure();measureStart=hitPoint.clone();dot(measureStart,'#d97706')
        liveLine=polyline([measureStart,measureStart],'#d97706');liveGuide=polyline(legs(measureStart,measureStart),'#f59e0b',.55);liveDot=dot(measureStart,'#fbbf24',.05)
        setMeasureResult({pending:true});return
      }
      const end=hitPoint.clone()
      setPoints(liveLine,[measureStart,end]);setPoints(liveGuide,legs(measureStart,end));liveDot.position.copy(end);liveDot.material.color.set('#d97706');liveDot.geometry.dispose();liveDot.geometry=new THREE.SphereGeometry(.06,16,16)
      tip.style.display='none'
      setMeasureResult(readingOf(measureStart,end))
      measureStart=liveLine=liveGuide=liveDot=hoverDot=null
    }
    const onPointerMove=event=>{
      if(!measureActive)return
      lastMove=event
      if(moveFrame)return
      moveFrame=requestAnimationFrame(()=>{
        moveFrame=0
        if(!measureActive||!lastMove)return
        const event=lastMove,point=pickPoint(event)
        if(!point){tip.style.display='none';return}
        if(!measureStart){
          if(!hoverDot)hoverDot=dot(point,'#94a3b8',.04);hoverDot.position.copy(point)
          tip.innerHTML='<div style="font-weight:500">click to start measuring here</div>';tip.style.display='block'
          tip.style.left=Math.min(event.clientX+18,window.innerWidth-tip.offsetWidth-8)+'px';tip.style.top=Math.min(event.clientY+18,window.innerHeight-tip.offsetHeight-8)+'px'
          return
        }
        setPoints(liveLine,[measureStart,point]);setPoints(liveGuide,legs(measureStart,point));liveDot.position.copy(point)
        const reading=readingOf(measureStart,point);showTip(event,reading)
        const now=performance.now();if(now-lastStateAt>60){lastStateAt=now;setMeasureResult({pending:true,live:reading})}
      })
    }
    const onMeasureKey=event=>{if(event.key==='Escape'&&measureActive&&measureStart)clearMeasure()}
    window.addEventListener('keydown',onMeasureKey)
    renderer.domElement.addEventListener('pointermove',onPointerMove)
    const onPointerDown=event=>{pressedAt={x:event.clientX,y:event.clientY}}
    const onPointerUp=event=>{
      if(!pressedAt||Math.hypot(event.clientX-pressedAt.x,event.clientY-pressedAt.y)>6){pressedAt=null;return}
      pressedAt=null
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      if(measureActive){
        const anyHit=raycaster.intersectObjects(scene.children.filter(child=>child!==measureGroup),true).find(h=>h.object.isMesh&&shown(h.object)&&!h.object.userData.noMeasure)
        if(anyHit)handleMeasureClick(anyHit.point)
        return
      }
      const item=pickItem(raycaster,[model],{stopAt:new Set(wallMeshes)})
      if(item){clearMark();showItem(item);return}
      clearItem()
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
    const interiorRoomIds=['bedroom3','study','balcony','terrace','kitchen','lobby','drawing','bedroom1','bedroom1-balcony','entry']
    const interiorScene=registerInteriorScene({id:'whole-home',scene,camera,renderer,zones:ROOMS.map((r,index)=>({id:interiorRoomIds[index],min:[X(r.bounds[0]),0,Z(r.bounds[1])],max:[X(r.bounds[2]),HEIGHT,Z(r.bounds[3])]}))})
    let raf=0;const render=()=>{controls.update();view.render();raf=requestAnimationFrame(render)};render()
    sceneRef.current={clearItem,liveView:view,setEntryDoorsOpen,setAcRoutes:visible=>{acRoutes.visible=visible},setDesigner:on=>view.setDesigner(on),setCavity:visible=>{cavityGroup.visible=visible},setRoomLight,setTvLabels:visible=>drawingLayouts.setLabels(visible),setDrawingLayout:key=>drawingLayouts.setLayout(key),setDrawingArm:pulled=>drawingLayouts.setArm(pulled),setElectrical:visible=>drawingLayouts?.setElectrical(visible),setExistingElectrical:visible=>{for(const g of [existingDrawing,existingLobby])if(g)g.visible=visible},setDoorSwing:visible=>drawingLayouts.setDoorSwing(visible),setStorageOpen:open=>drawingLayouts.setStorageOpen(open),setDrawingTv:key=>drawingLayouts.setTvSize(key),setMedicineCabinetOpen:value=>doorInfill.userData.setOpen(value),setStorageCoverOpen:value=>storeStorage.userData.setCoverOpen(value),setMirrorOpen:value=>vanity.userData.setMirrorOpen?.(value),setPartitionOpen:value=>partition.userData.setOpen?.(value),setCamera,setWallsVisible:visible=>{walls.visible=visible},setBoardOpen:value=>{ironingStorage.userData.setBoardOpen(value)},setPoojaPersonVisible:visible=>{seatedPerson.visible=visible},setPoojaDoorsOpen:value=>{poojaDoors.userData.setDoorsOpen(value)},clearMark,setDaylight,setMeasure,clearMeasure}
    const standing=createStandingCamera({camera,controls,domElement:renderer.domElement,bounds:{minX:.2,maxX:W-.2,minZ:.2,maxZ:L-.2},onChange:setStand});sceneRef.current.standing=standing
    setRoomLight(roomLightRef.current/100)
    setDaylight(sunHourRef.current)
    return()=>{standing.dispose();acRoutes.userData.dispose();interiorScene.dispose();cancelAnimationFrame(raf);existingDrawing?.userData.dispose();existingLobby?.userData.dispose();view.dispose();observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);renderer.domElement.removeEventListener('pointermove',onPointerMove);window.removeEventListener('keydown',onMeasureKey);cancelAnimationFrame(moveFrame);tip.remove();controls.dispose();model.traverse(object=>{object.geometry?.dispose?.();object.material?.dispose?.()});markedWallMaterial.dispose();texture.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])

  useEffect(()=>{sceneRef.current?.standing?.leave();sceneRef.current?.setCamera(view)},[view])
  useEffect(()=>{sceneRef.current?.setWallsVisible(showWalls)},[showWalls])
  useEffect(()=>{sceneRef.current?.setPoojaPersonVisible(showPoojaPerson)},[showPoojaPerson])
  useEffect(()=>{sceneRef.current?.setBoardOpen(showIroningBoard)},[showIroningBoard])
  useEffect(()=>{sceneRef.current?.setStorageCoverOpen(storageCoverOpen)},[storageCoverOpen])
  useEffect(()=>{sceneRef.current?.setMirrorOpen(mirrorOpen)},[mirrorOpen])
  useEffect(()=>{sceneRef.current?.setMedicineCabinetOpen(medicineCabinetOpen)},[medicineCabinetOpen])
  useEffect(()=>{tvLabelsRef.current=tvLabels;sceneRef.current?.setTvLabels(tvLabels)},[tvLabels])
  useEffect(()=>{drawingLayoutRef.current=drawingLayout;sceneRef.current?.setDrawingLayout(drawingLayout)},[drawingLayout])
  useEffect(()=>{sceneRef.current?.setDrawingArm(armOut)},[armOut])
  useEffect(()=>{sceneRef.current?.setDoorSwing(doorSwing)},[doorSwing])
  // A picked item's outline would be stale once the room, layout or visibility changes.
  useEffect(()=>{sceneRef.current?.clearItem?.();setPickedItem(null)},[drawingLayout,showWalls])
  useEffect(()=>{sceneRef.current?.setElectrical(showElectrical)},[showElectrical])
  useEffect(()=>{sceneRef.current?.setExistingElectrical?.(showExisting)},[showExisting])
  useEffect(()=>{sceneRef.current?.setStorageOpen(storageOpen)},[storageOpen])
  useEffect(()=>{sceneRef.current?.setDrawingTv(tvSize)},[tvSize])
  useEffect(()=>{sceneRef.current?.setPartitionOpen(partitionOpen)},[partitionOpen])
  useEffect(()=>{sceneRef.current?.setPoojaDoorsOpen(poojaDoorsOpen)},[poojaDoorsOpen])
  useEffect(()=>{sunHourRef.current=sunHour;sceneRef.current?.setDaylight(sunHour)},[sunHour])
  useEffect(()=>{roomLightRef.current=roomLightPercent;sceneRef.current?.setRoomLight(roomLightPercent/100)},[roomLightPercent])
  useEffect(()=>{sceneRef.current?.setMeasure(measureMode)},[measureMode])
  useEffect(()=>{sceneRef.current?.setCavity(showCavity)},[showCavity])
  useEffect(()=>{sceneRef.current?.setEntryDoorsOpen(entryDoorsOpen)},[entryDoorsOpen])
  useEffect(()=>{sceneRef.current?.setAcRoutes(showAcRoutes)},[showAcRoutes])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Whole home in 3D</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>South is up in the initial 3D and top views. Drag to orbit and scroll to zoom.</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button aria-pressed={view==='perspective'} onClick={()=>setView('perspective')} style={buttonStyle(view==='perspective')}>3D overview</button>
        <button aria-pressed={view==='top'} onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button>
        <button aria-pressed={view==='south'} onClick={()=>{setView('south');setShowWalls(false)}} style={buttonStyle(view==='south')}>South view</button>
        <button onClick={()=>setShowWalls(value=>!value)} style={buttonStyle(showWalls)}>{showWalls?'Hide walls':'Show walls'}</button>
        <button onClick={()=>setShowPoojaPerson(value=>!value)} style={buttonStyle(showPoojaPerson)}>{showPoojaPerson?'Hide seated person':'Show seated person'}</button>
        <button onClick={()=>setShowIroningBoard(value=>!value)} style={buttonStyle(showIroningBoard)}>{showIroningBoard?'Stow ironing board':'Pull out ironing board'}</button>
        <button onClick={()=>setStorageCoverOpen(value=>!value)} title="Floor-to-ceiling louvre slider with fixed slats above the fridge; close the cover before opening the fridge doors" style={buttonStyle(storageCoverOpen)}>{storageCoverOpen?'Close storage cover':'Open storage cover'}</button>
        {storageCoverOpen&&<span style={{alignSelf:'center'}}>Close the louvred storage cover before opening the fridge doors.</span>}
        <button onClick={()=>setMirrorOpen(value=>!value)} style={buttonStyle(mirrorOpen)}>{mirrorOpen?'Close dressing mirror (south-east)':'Open dressing mirror (south-east)'}</button>
        <button onClick={()=>setMedicineCabinetOpen(value=>!value)} aria-pressed={medicineCabinetOpen} style={buttonStyle(medicineCabinetOpen)}>{medicineCabinetOpen?'Close medicine cabinet':'Open medicine cabinet'}</button>
        <label style={{display:'flex',alignItems:'center',gap:6,fontWeight:800,fontSize:13}}>Drawing Room layout
          <select value={drawingLayout} onChange={event=>setDrawingLayout(event.target.value)} style={{padding:'7px 8px',borderRadius:9,border:'1px solid #cbd5e1',maxWidth:340}}>{DRAWING_LAYOUTS.map(layout=><option key={layout.key} value={layout.key}>{layout.label}</option>)}</select>
        </label>
        <button onClick={()=>setDoorSwing(value=>!value)} aria-pressed={doorSwing} style={buttonStyle(doorSwing)} title="The Drawing Room entry door opens into the room: red is the area its leaf sweeps">{doorSwing?'Hide entry door swing':'Show entry door swing'}</button>
        <button onClick={()=>setStorageOpen(value=>!value)} aria-pressed={storageOpen} style={buttonStyle(storageOpen)} title="The west cabinet of the entry pocket, entered through a narrow hidden door at the west end of the Drawing Room's north wall: the TV console is dragged out and the door, hidden in the wall panelling, swings outward to show the shelves">{storageOpen?'Close hidden west cabinet':'Open hidden west cabinet'}</button>
        {drawingLayout==='southSofas'&&<button onClick={()=>setShowElectrical(value=>!value)} aria-pressed={showElectrical} style={buttonStyle(showElectrical)} title="Proposed sockets, charging, switch, light and data points for layout C (docs/DRAWING_ROOM_ELECTRICAL.md)">{showElectrical?'Hide electrical points':'Show electrical points'}</button>}
        <button onClick={()=>setShowExisting(value=>!value)} aria-pressed={showExisting} style={buttonStyle(showExisting)} title="The switchboards, distribution board, sockets and lights that are on the Drawing Room and Lobby walls TODAY (phone scan 2026-10-04): grey plates with a blue outline, at true size. The conflict list is on each room's own page">{showExisting?'Hide existing electrical points':'Show existing electrical points'}</button>
        {(drawingLayout==='cornerConsole'||drawingLayout==='southSofas')&&<>
          {drawingLayout==='cornerConsole'&&<button onClick={()=>setArmOut(value=>!value)} aria-pressed={armOut} style={buttonStyle(armOut)}>{armOut?'Park TV flat on the wall':'Pull TV out and turn it toward the north sofa'}</button>}
          <button onClick={()=>setTvSize(value=>value==='55'?'65':'55')} style={buttonStyle(tvSize==='65')}>TV size: {tvSize} inch (click for {tvSize==='55'?'65':'55'})</button>
        </>}
        <button onClick={()=>setTvLabels(value=>!value)} aria-pressed={tvLabels} style={buttonStyle(tvLabels)}>{tvLabels?'Hide TV wall labels':'Show TV wall labels'}</button>
        <button onClick={()=>setPartitionOpen(value=>!value)} style={buttonStyle(partitionOpen)}>{partitionOpen?'Close drawing partition':'Open drawing partition'}</button>
        <button onClick={()=>setPoojaDoorsOpen(value=>!value)} style={buttonStyle(poojaDoorsOpen)}>{poojaDoorsOpen?'Close Pooja doors':'Open Pooja doors'}</button>
        <button {...designer.button(buttonStyle(designer.on))}/>
        <RenderQualityControls sceneRef={sceneRef} name="whole-home" buttonStyle={buttonStyle}/>
        <button onClick={()=>{const standing=sceneRef.current?.standing;if(standing)standing.active?standing.leave():standing.enter(STAND_START)}} aria-pressed={!!stand?.active} style={buttonStyle(!!stand?.active)} title="Put the camera at eye height inside the room and look around">{stand?.active?'Leave standing view':'Stand here'}</button>
        <button onClick={()=>setEntryDoorsOpen(value=>!value)} aria-pressed={entryDoorsOpen} style={buttonStyle(entryDoorsOpen)} title="Proposal: steel opens into corridor; wood reverses inward with a limited stop and narrow passage. Review Main entry note before fabrication.">{entryDoorsOpen?'Close':'Open'} entry door pair</button>
        <button onClick={()=>setShowCavity(value=>!value)} aria-pressed={showCavity} style={buttonStyle(showCavity)} title="The empty 3 ft deep cavity on the Main Entry side of the Drawing Room north wall, and the wall between them">{showCavity?'Hide entry wall cavity':'Show entry wall cavity'}</button>
        <button onClick={()=>setShowAcRoutes(value=>!value)} aria-pressed={showAcRoutes} style={buttonStyle(showAcRoutes)} title="The whole-home AC plan (docs/AC_PLAN.md): refrigerant pipes from each indoor unit to its outdoor unit with the length to order, and the drain pipes to where they discharge. A proposal from typical figures; nothing is measured.">{showAcRoutes?'Hide AC pipe routes':'Show AC pipe routes'}</button>
        <button onClick={()=>setMeasureMode(value=>!value)} aria-pressed={measureMode} style={buttonStyle(measureMode)}>{measureMode?'Stop measuring':'Measure'}</button>
        <button onClick={()=>setMarkMode(value=>!value)} style={buttonStyle(markMode)}>{markMode?'Back to 3D':'Mark area on plan'}</button>
      </div>
    </div>
    {!markMode&&showAcRoutes&&<AcRoutesLegend/>}
    {!markMode&&measureMode&&<div role="status" style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap',padding:'8px 16px',borderBottom:'1px solid #fcd9a8',background:'#fff7ea',fontSize:13,color:'#7c4a12'}}>
      <b>Measure:</b>
      {!measureResult&&<span>click a first point on any surface…</span>}
      {measureResult?.pending&&!measureResult.live&&<span>first point set — move the mouse: the line and reading follow it live; click for the second point (Esc cancels)</span>}
      {measureResult?.pending&&measureResult.live&&<>
        <span><b style={{fontSize:16}}>{measureResult.live.direct}</b> direct (live)</span>
        <span>E–W {measureResult.live.ew}</span><span>N–S {measureResult.live.ns}</span><span>height {measureResult.live.rise}</span>
        <span>{measureResult.live.floor} along floor</span>
        <span style={{fontSize:11}}>click to fix · Esc cancels</span>
      </>}
      {measureResult&&!measureResult.pending&&<>
        <span><b style={{fontSize:16}}>{measureResult.direct}</b> direct</span>
        <span>E–W {measureResult.ew}</span><span>N–S {measureResult.ns}</span><span>height {measureResult.rise}</span>
        <span>{measureResult.floor} along floor</span>
      </>}
      <button onClick={()=>sceneRef.current?.clearMeasure()} style={{...buttonStyle(false),padding:'4px 10px',fontSize:12}}>Clear</button>
      <span style={{fontSize:11,color:'#b45309'}}>Readings snap to 5 mm and measure the simplified 3D model, not a site survey.</span>
    </div>}
    {!markMode&&<div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:'9px 16px',borderBottom:'1px solid #e2e8f0',background:'#f8fafc'}}>
      <b style={{fontSize:12,color:'#172033'}}>Daylight</b>
      {[['Studio',null],['Sunrise',6.4],['Morning',9],['Noon',12],['Evening',16.5],['Sunset',17.7],['Night',21]].map(([label,hour])=>
        <button key={label} aria-pressed={sunHour===hour} onClick={()=>setSunHour(hour)} style={{...buttonStyle(sunHour===hour),padding:'5px 10px',fontSize:12}}>{label}</button>)}
      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#475569'}}>
        Time
        <input type="range" min="5" max="21" step="0.25" value={sunHour??12} onChange={event=>setSunHour(Number(event.target.value))} style={{width:150}} aria-label="Time of day for the daylight sun"/>
        {sunHour!=null&&<span style={{fontVariantNumeric:'tabular-nums',minWidth:44}}>{String(Math.floor(sunHour)).padStart(2,'0')}:{String(Math.round(sunHour%1*60)).padStart(2,'0')}</span>}
      </label>
      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#475569'}} title="Dims the ambient fill, interior lights and fixture glow so the sun's light and shadows stand out. 0% leaves only the sun.">
        In-home light
        <input type="range" min="0" max="100" step="5" value={roomLightPercent} onChange={event=>setRoomLightPercent(Number(event.target.value))} style={{width:130}} aria-label="In-home light level"/>
        <span style={{fontVariantNumeric:'tabular-nums',minWidth:34}}>{roomLightPercent}%</span>
      </label>
      <span style={{fontSize:10,color:'#94a3b8'}}>Indicative equinox sun path · true north ≈{TRUE_NORTH_OFFSET_DEG}° off plan north · not a solar study</span>
    </div>}
    <StandingCameraControls readout={stand} onSet={next=>sceneRef.current?.standing?.set(next)} onLeave={()=>sceneRef.current?.standing?.leave()} frame="position in the whole-home model, where x grows west and z grows north" facing="facing 0 = south, 90 = west"/>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1050px)',width:'100%',display:markMode?'none':'block'}}/>
    {markMode?<PlanMarkPanel image={floorPlanImage} width={PLAN_WIDTH} height={PLAN_HEIGHT} rooms={ROOMS} mark={planMark} onChange={setPlanMark} onClose={()=>setMarkMode(false)}/>
      :<><ItemDimensionsPanel item={pickedItem} onClear={()=>sceneRef.current?.clearItem()}/><WallSelectionPanel selection={wallSelection} note={wallNote} onNoteChange={setWallNote} onClear={()=>sceneRef.current?.clearMark()}/></>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'12px 16px 16px',borderTop:'1px solid #e2e8f0'}}>
      {[
        ['Bedroom 3','bedroom3'],['Study','study'],['Kitchen','kitchen'],['Lobby / Dining','lobby'],
        ['Drawing Room','drawing'],['Bedroom 1','bedroom1'],['Main entry','entry'],
      ].map(([label,key])=><button key={key} onClick={()=>onOpenRoom(key)} style={buttonStyle(false)}>{label} ↗</button>)}
    </div>
  </section>
}

function buttonStyle(active){return{padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}

export default function WholeHome3D({onOpenRoom}){
  // Editable 3D first (owner 2026-10-03: "can they always be in sync?"): it is built from the current config on every load, so it
  // can never be out of date. The Blender model is a baked file from an earlier design and only changes when it is re-baked.
  const [source,setSource]=useState('live')
  return <div>
    <nav aria-label="Whole-home 3D source" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
      {[
        ['live','Editable 3D'],
        ['blender-model','Blender model'],
        ['blender-renders','Blender renders and tour'],
      ].map(([value,label])=><button key={value} aria-pressed={source===value} onClick={()=>setSource(value)} style={buttonStyle(source===value)}>{label}</button>)}
    </nav>
    <p style={{fontSize:12,color:'#64748b',margin:'-4px 2px 12px'}}>{source==='live'?'Editable 3D is always the current design: it is rebuilt from the saved settings every time it opens.':'This Blender view is a saved snapshot of an earlier design (its lighting was computed once). Furniture moved since then is only up to date in Editable 3D.'}</p>
    {source==='blender-model'&&<BlenderHomeView/>}
    {source==='blender-renders'&&<HomeLightingGallery/>}
    {source==='live'&&<LiveWholeHome3D onOpenRoom={onOpenRoom}/>}
  </div>
}
