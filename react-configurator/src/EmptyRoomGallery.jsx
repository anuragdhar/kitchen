import {registerInteriorScene} from './render/interiorScene.js'
import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'
import {createDrawingLobbyPartition} from './rooms/drawing/DrawingLobbyPartition.js'
import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {EMPTY_ROOM_SHELLS} from './config/roomShellConfig.js'
import {createSeatedPoojaPerson} from './rooms/pooja/SeatedPoojaPerson.js'
import {createPoojaPlatform} from './rooms/pooja/PoojaPlatform.js'
import {createPoojaDoorAndInterior} from './rooms/pooja/PoojaDoorAndInterior.js'
import {createBedroom3SouthExtension} from './rooms/bedroom3/Bedroom3SouthExtension.js'
import {createBedroom3Bed} from './rooms/bedroom3/Bedroom3Bed.js'
import {createBedroom3EntryDoor} from './rooms/bedroom3/Bedroom3EntryDoor.js'
import {createBedroom3Wardrobe} from './rooms/bedroom3/Bedroom3Wardrobe.js'
import {createLobbyEastIroningStorage} from './rooms/lobby/LobbyEastIroningStorage.js'
import {createRoomAirConditioning} from './rooms/shared/RoomAirConditioning.js'
import {createRoomTaskLighting} from './rooms/shared/RoomTaskLighting.js'
import {createRug,createPottedPlant,createWallArt,createFloorLamp,createCushion,createLaundryHamper} from './rooms/shared/RoomDecor.js'
import {createDrawingRoomLayouts,DRAWING_LAYOUTS} from './rooms/drawing/DrawingRoomLayouts.js'
import {buildRoomReview} from './domain/roomReview.mjs'
import {composeReviewSheet,canvasToBlob} from './render/reviewSheet.js'
import {parseInspiration,validateInspiration} from './home/inspiration.mjs'
import inspirationSeed from '../../inspiration/library.json'
import {createLobbyConcealedDoor} from './rooms/lobby/LobbyConcealedDoor.js'
import {createBedroom3DressingTable} from './rooms/bedroom3/Bedroom3DressingTable.js'
import WallSelectionPanel from './WallSelectionPanel.jsx'

const mm=value=>value/1000

// Reference links for the review sheet: the browser library when readable, else the project seed.
function referencesFor(roomKey){
  const inspirationRoom=roomKey==='kitchenShell'?'kitchen':roomKey
  let library
  try{const raw=localStorage.getItem('home-interior.inspiration.v1');library=raw?parseInspiration(raw):validateInspiration(inspirationSeed)}catch{library=validateInspiration(inspirationSeed)}
  return library.items.filter(item=>item.room===inspirationRoom).map(item=>({title:item.title,url:item.url,tags:item.tags,notes:item.notes}))
}

export default function EmptyRoomGallery({initialRoomKey='bedroom1',initialView='overview',showSelector=true}){
  const [roomKey,setRoomKey]=useState(initialRoomKey)
  const [view,setView]=useState(initialView)
  const [showSouthWall,setShowSouthWall]=useState(initialRoomKey==='lobby'||initialRoomKey==='drawing'||initialRoomKey==='bedroom1')
  const [tvLabels,setTvLabels]=useState(initialRoomKey==='drawing'),tvLabelsRef=useRef(initialRoomKey==='drawing')
  const [drawingLayout,setDrawingLayout]=useState('cornerConsole'),drawingLayoutRef=useRef('cornerConsole')
  const [armOut,setArmOut]=useState(false),[tvSize,setTvSize]=useState('55')
  const [review,setReview]=useState(null),[reviewBusy,setReviewBusy]=useState(false),[reviewNote,setReviewNote]=useState('')
  const [showFurniture,setShowFurniture]=useState(initialView!=='pooja'&&(initialRoomKey==='bedroom1'||initialRoomKey==='bedroom3'||initialRoomKey==='drawing'||initialRoomKey==='lobby'))
  const [showIroningBoard,setShowIroningBoard]=useState(false)
  const [poojaDoorsOpen,setPoojaDoorsOpen]=useState(true)
  const [partitionOpen,setPartitionOpen]=useState(false)
  const [mirrorOpen,setMirrorOpen]=useState(false)
  const [showBedroom3Renders,setShowBedroom3Renders]=useState(initialRoomKey==='bedroom3')
  const [showDrawingRender,setShowDrawingRender]=useState(initialRoomKey==='drawing')
  const [wallSelection,setWallSelection]=useState(null)
  const [wallNote,setWallNote]=useState('')
  // Daytime natural light is the default per the owner's 2026-09-28 request
  // ("I see only the night time view"); Evening restores the warm task-light mood.
  const [daylightOn,setDaylightOn]=useState(true)
  const daylightRef=useRef(true)
  const mountRef=useRef(null)
  const sceneRef=useRef(null)
  const room=EMPTY_ROOM_SHELLS[roomKey]

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const W=mm(room.widthMm),L=mm(room.lengthMm),H=mm(room.heightMm),extensionDepth=mm(room.balconyExtension?.depthMm||0),southDepth=mm(room.southExtension?.balcony?.depthMm||0),span=Math.max(W+extensionDepth,L+southDepth)
    const openWest=room.openSide==='west'
    const scene=new THREE.Scene();scene.background=new THREE.Color('#eef3f6')
    const camera=new THREE.PerspectiveCamera(46,1,.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.2));renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    const shell=new THREE.Group();scene.add(shell)
    const wallMaterial=new THREE.MeshStandardMaterial({color:roomKey==='drawing'?'#dfd2c4':'#d6d1c9',roughness:.86})
    tagSurfaceMaterial(wallMaterial,'plaster')
    const floorMaterial=new THREE.MeshStandardMaterial({color:room.color,roughness:.82})
    const trimMaterial=new THREE.MeshStandardMaterial({color:'#f8fafc',roughness:.65})
    const doorMaterial=new THREE.MeshStandardMaterial({color:'#a47149',roughness:.68})
    tagSurfaceMaterial(doorMaterial,'wood')
    const frameMaterial=new THREE.MeshStandardMaterial({color:'#f1ede6',roughness:.6})
    const darkFrameMaterial=new THREE.MeshStandardMaterial({color:'#171a1e',metalness:.55,roughness:.28})
    const handleMaterial=new THREE.MeshStandardMaterial({color:'#b89a5c',metalness:.75,roughness:.25})
    const glassMaterial=new THREE.MeshStandardMaterial({color:'#b8e3ef',transparent:true,opacity:.42,roughness:.08,metalness:.15,side:THREE.DoubleSide,depthWrite:false})
    const markedWallMaterial=new THREE.MeshStandardMaterial({color:'#f5ad34',roughness:.72,emissive:'#623600',emissiveIntensity:.15})
    const wallMeshes=[]
    const addBox=(w,h,d,x,y,z,material=wallMaterial,parent=shell)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    addBox(W,.055,L,W/2,-.028,L/2,floorMaterial)
    const T=.1
    const southWall=new THREE.Group();shell.add(southWall)
    const wallParent=side=>side==='south'?southWall:shell
    const addWallSpan=(side,from,to,bottom=0,top=H)=>{
      if(to<=from||top<=bottom) return
      const parent=wallParent(side),height=top-bottom,center=(from+to)/2
      if(side==='north'||side==='south'){
        const z=side==='north'?0:L
        const mesh=addBox(to-from,height,T,center,(bottom+top)/2,z,wallMaterial,parent)
        mesh.userData={wallSide:side};wallMeshes.push(mesh)
        if(bottom===0) addBox(to-from,.085,.035,center,.05,side==='north'?.055:L-.055,trimMaterial,parent)
      }else{
        const x=side==='west'?0:W
        const mesh=addBox(T,height,to-from,x,(bottom+top)/2,center,wallMaterial,parent)
        mesh.userData={wallSide:side};wallMeshes.push(mesh)
        if(bottom===0) addBox(.035,.085,to-from,side==='west'?.055:W-.055,.05,center,trimMaterial,parent)
      }
    }
    const openingsFor=side=>{
      const result=[]
      const passage=room.wallOpenings?.[side]
      if(passage) result.push({kind:'passage',from:mm(passage.fromMm),to:mm(passage.toMm),bottom:0,top:H})
      const recess=room.furniture?.northEastRecessWardrobe
      if(side==='north'&&recess) result.push({kind:'passage',from:W-mm(recess.fromEastMm+recess.widthMm),to:W-mm(recess.fromEastMm),bottom:0,top:H})
      if(side==='south'&&room.southExtension){
        const {cabinet,balcony}=room.southExtension
        result.push({kind:'passage',from:mm(cabinet.fromWestMm),to:mm(cabinet.fromWestMm+cabinet.widthMm),bottom:mm(cabinet.floorClearanceMm),top:mm(cabinet.floorClearanceMm+cabinet.heightMm)})
        result.push({kind:'glassDoor',from:mm(balcony.doorFromWestMm),to:mm(balcony.doorFromWestMm+balcony.doorWidthMm),bottom:0,top:mm(balcony.doorHeightMm),frameStyle:'dark'})
        result.push({kind:'window',from:mm(balcony.windowFromWestMm),to:mm(balcony.windowFromWestMm+balcony.windowWidthMm),bottom:mm(balcony.windowSillMm),top:mm(balcony.windowTopMm),frameStyle:'dark',mullionFractions:[]})
      }
      for(const door of room.doors||[]) if(door.wall===side) result.push({kind:'door',from:mm(door.fromMm),to:mm(door.fromMm+door.widthMm),bottom:0,top:mm(door.heightMm)})
      for(const window of room.windows||[]) if(window.wall===side) result.push({kind:'window',from:mm(window.fromMm),to:mm(window.fromMm+window.widthMm),bottom:mm(window.bottomMm),top:mm(window.topMm),frameStyle:window.frameStyle,mullionFractions:window.mullionFractions})
      return result.sort((a,b)=>a.from-b.from)
    }
    const addOpeningDetail=(side,opening)=>{
      if(side!=='north'&&side!=='south') return
      if(roomKey==='bedroom3'&&side==='north'&&opening.kind==='door')return
      if(roomKey==='lobby'&&side==='south'&&opening.kind==='door')return
      if(roomKey==='drawing'&&side==='north'&&opening.kind==='door'&&opening.from<1)return
      const parent=wallParent(side),z=side==='north'?0:L,width=opening.to-opening.from,center=(opening.from+opening.to)/2
      if(opening.kind==='door'){
        const h=opening.top
        for(const x of [opening.from+.025,opening.to-.025]) addBox(.05,h,.075,x,h/2,z,frameMaterial,parent)
        addBox(width,.05,.075,center,h-.025,z,frameMaterial,parent)
        addBox(width-.1,h-.08,.035,center,(h-.08)/2,z,doorMaterial,parent)
        addBox(.07,.025,.06,opening.to-.17,1.02,z+(side==='north'?.04:-.04),handleMaterial,parent)
      }
      if(opening.kind==='window'||opening.kind==='glassDoor'){
        const h=opening.top-opening.bottom,midY=(opening.top+opening.bottom)/2
        const windowFrame=opening.frameStyle==='dark'?darkFrameMaterial:frameMaterial
        addBox(width-.06,h-.06,.025,center,midY,z,glassMaterial,parent)
        for(const x of [opening.from+.025,...(opening.mullionFractions||[.5]).map(fraction=>opening.from+width*fraction),opening.to-.025]) addBox(.05,h,.065,x,midY,z,windowFrame,parent)
        for(const y of [opening.bottom+.025,opening.top-.025]) addBox(width,.05,.065,center,y,z,windowFrame,parent)
        if(opening.kind==='glassDoor')addBox(.025,.18,.05,opening.from+width*.8,1.05,z-.055,handleMaterial,parent)
      }
    }
    for(const side of ['north','south','west','east']){
      if(room.openSide===side) continue
      const length=side==='north'||side==='south'?W:L
      let cursor=0
      for(const opening of openingsFor(side)){
        addWallSpan(side,cursor,opening.from)
        addWallSpan(side,opening.from,opening.to,0,opening.bottom)
        addWallSpan(side,opening.from,opening.to,opening.top,H)
        addOpeningDetail(side,opening)
        cursor=opening.to
      }
      addWallSpan(side,cursor,length)
    }
    if(room.southExtension)shell.add(createBedroom3SouthExtension(room))
    if(roomKey==='bedroom3')shell.add(createBedroom3EntryDoor(room))
    const northEastWardrobe=room.furniture?.northEastRecessWardrobe
    if(northEastWardrobe){
      const width=mm(northEastWardrobe.widthMm),depth=mm(northEastWardrobe.depthMm),height=mm(northEastWardrobe.heightMm)
      const start=W-mm(northEastWardrobe.fromEastMm)-width
      const body=new THREE.MeshStandardMaterial({color:'#c9b9a3',roughness:.72})
      tagSurfaceMaterial(body,'wood')
      const door=new THREE.MeshStandardMaterial({color:'#eee8df',roughness:.58})
      tagSurfaceMaterial(door,'wood')
      const pull=new THREE.MeshStandardMaterial({color:'#464b4b',metalness:.58,roughness:.34})
      addBox(width,height,depth,start+width/2,height/2,-depth/2,body)
      for(let i=0;i<northEastWardrobe.doorCount;i++){
        const panelWidth=width/northEastWardrobe.doorCount
        const center=start+(i+.5)*panelWidth
        addBox(panelWidth-.018,height-.08,.035,center,height/2,.025,door)
        addBox(.018,.32,.025,center+(i===0?panelWidth*.32:-panelWidth*.32),1.16,.06,pull)
      }
    }
    for(const beam of room.hangingBeams||[]){
      const from=mm(beam.fromMm),to=mm(beam.toMm),drop=mm(beam.dropMm),width=mm(beam.widthMm)
      if(beam.wall==='east'||beam.wall==='west') addBox(width,drop,to-from,beam.wall==='east'?W:0,H-drop/2,(from+to)/2)
      else addBox(to-from,drop,width,(from+to)/2,H-drop/2,beam.wall==='south'?L:0)
    }
    if(room.balconyExtension){
      const balcony=room.balconyExtension,depth=mm(balcony.depthMm),length=mm(balcony.lengthMm),rail=mm(balcony.railingHeightMm)
      const balconyFloor=new THREE.MeshStandardMaterial({color:'#b79a78',roughness:.8})
      const aluminium=new THREE.MeshStandardMaterial({color:'#333b42',metalness:.72,roughness:.28})
      const balconyGlass=new THREE.MeshStandardMaterial({color:'#badbe4',transparent:true,opacity:.28,roughness:.08,side:THREE.DoubleSide,depthWrite:false})
      // The bedroom-side opening stops at the existing southeast return wall.
      addBox(depth,.055,length,W+depth/2,-.028,length/2,balconyFloor)
      addBox(.12,rail,length,W+depth,rail/2,length/2)
      addBox(.018,H-rail-.08,length-.08,W+depth,(H+rail)/2,length/2,balconyGlass)
      for(const z of [.035,length/2,length-.035]) addBox(.04,H-rail,.05,W+depth,(H+rail)/2,z,aluminium)
      for(const y of [rail+.015,H-.035]) addBox(.045,.04,length,W+depth,y,length/2,aluminium)
      addBox(depth,rail,.12,W+depth/2,rail/2,0)
      addBox(depth-.08,H-rail-.08,.018,W+depth/2,(H+rail)/2,0,balconyGlass)
      for(const x of [W+.035,W+depth/2,W+depth-.035]) addBox(.05,H-rail,.04,x,(H+rail)/2,0,aluminium)
      for(const y of [rail+.015,H-.035]) addBox(depth,.04,.045,W+depth/2,y,0,aluminium)
      const wardrobe=balcony.poojaWallWardrobe
      if(wardrobe){
        const cabinetWidth=mm(wardrobe.widthMm),cabinetDepth=mm(wardrobe.depthMm),cabinetHeight=mm(wardrobe.heightMm)
        const cabinetZ=length-mm(wardrobe.northShiftMm||0),frontZ=cabinetZ+.018
        const body=new THREE.MeshStandardMaterial({color:'#a78059',roughness:.7})
        tagSurfaceMaterial(body,'wood')
        const doors=new THREE.MeshStandardMaterial({color:'#dce6dd',roughness:.55})
        tagSurfaceMaterial(doors,'wood')
        const pulls=new THREE.MeshStandardMaterial({color:'#384f49',metalness:.45,roughness:.38})
        addBox(cabinetWidth,cabinetHeight,cabinetDepth,W+cabinetWidth/2,cabinetHeight/2,cabinetZ+cabinetDepth/2,body)
        for(let i=0;i<wardrobe.doorCount;i++){
          const x=W+cabinetWidth*(i+.5)/wardrobe.doorCount
          const front=addBox(cabinetWidth/wardrobe.doorCount-.018,cabinetHeight-.11,.03,x,(cabinetHeight+.04)/2,frontZ,doors)
          front.userData={wallSide:'south',balconyPoojaWall:true};wallMeshes.push(front)
          addBox(.018,.31,.022,x+(i===0?cabinetWidth*.17:-cabinetWidth*.17),1.15,frontZ-.027,pulls)
        }
      }else{
        const poojaSideWall=addBox(depth,H,.10,W+depth/2,H/2,length)
        poojaSideWall.userData={wallSide:'south',balconyPoojaWall:true};wallMeshes.push(poojaSideWall)
      }
    }
    let poojaDoors=null
    if(room.poojaAlcove){
      const alcove=room.poojaAlcove,from=mm(alcove.fromMm),width=mm(alcove.widthMm),depth=mm(alcove.depthMm),center=from+width/2
      const oak=new THREE.MeshStandardMaterial({color:'#a98259',roughness:.68})
      tagSurfaceMaterial(oak,'wood')
      const stone=new THREE.MeshStandardMaterial({color:'#f2e9d9',roughness:.8})
      const brass=new THREE.MeshStandardMaterial({color:'#b99955',metalness:.68,roughness:.28})
      // Recess the prayer niche one metre into the balcony, beyond the former window line.
      addBox(width,.055,depth,center,-.028,-depth/2,stone)
      addBox(width,H,.09,center,H/2,-depth,stone)
      for(const x of [from,from+width])addBox(.07,H,depth,x,H/2,-depth/2,stone)
      addBox(width,.06,.09,center,H-.03,0,oak)
      addBox(width,.025,.12,center,.012,0,stone)
      if(alcove.altarVisible!==false){
        addBox(.97,.38,.34,center,.27,-depth+.21,oak)
        addBox(1.03,.035,.43,center,.48,-depth+.22,stone)
        addBox(.96,1.22,.027,center,1.38,-depth+.07,oak)
        addBox(.88,.04,.28,center,.99,-depth+.25,stone)
        for(const x of [center-.36,center+.36]) addBox(.018,1.12,.032,x,1.45,-depth+.095,brass)
        const arch=new THREE.Mesh(new THREE.TorusGeometry(.33,.018,8,40,Math.PI),brass)
        arch.position.set(center,1.60,-depth+.10);shell.add(arch)
        const altarLight=new THREE.PointLight('#ffe6b4',1.2,2.2);altarLight.position.set(center,2.32,-depth+.42);scene.add(altarLight)
      }
      shell.add(createPoojaPlatform(alcove))
      shell.add(createSeatedPoojaPerson(alcove))
      poojaDoors=createPoojaDoorAndInterior(alcove,room.heightMm)
      shell.add(poojaDoors)
    }
    const furniture=new THREE.Group();shell.add(furniture)
    shell.add(createRoomAirConditioning(room))
    shell.add(createRoomTaskLighting(room))
    const drawingLayouts=roomKey==='drawing'?createDrawingRoomLayouts(room,{wallFaceMm:37,initial:drawingLayoutRef.current}):null
    if(drawingLayouts){drawingLayouts.setLabels(tvLabelsRef.current);shell.add(drawingLayouts.built)}
    const vanity=createBedroom3DressingTable(room);vanity.userData.setMirrorOpen?.(mirrorOpen)
    const partition=createDrawingLobbyPartition(room,roomKey);shell.add(partition)
    partition.userData.setOpen?.(partitionOpen)
    if(roomKey==='lobby')wallParent('south').add(createLobbyConcealedDoor(room))
    let ironingStorage=null
    if(roomKey==='bedroom3'){
      furniture.add(createBedroom3Bed(room))
      furniture.add(vanity)
      furniture.add(createBedroom3Wardrobe(room))
      // Light decor pass, matching Lobby/Bedroom1/Study (owner request
      // 2026-09-28). Placed in the open floor near the north entry door,
      // clear of the bed (headed east), the west wardrobe run and the
      // south balcony/cabinet extension.
      const b3Plant=createPottedPlant(1.05);b3Plant.position.set(0.5,0,0.55);furniture.add(b3Plant)
      const b3Art=createWallArt(.85,.6,'#7a6a55');b3Art.position.set(2.3,1.5,0.05);furniture.add(b3Art)
    }
    if(roomKey==='drawing'){
      furniture.add(drawingLayouts.furniture)
    }else if(roomKey==='bedroom1'&&room.furniture?.bed){
      const bed=room.furniture.bed
      const bedWest=mm(bed.fromWestMm),bedSouth=L-mm(bed.fromSouthMm),bedLength=mm(bed.lengthMm),bedWidth=mm(bed.widthMm)
      const bedCenterX=bedWest+bedLength/2,bedCenterZ=bedSouth-bedWidth/2
      const bedFrame=new THREE.MeshStandardMaterial({color:'#806047',roughness:.68})
      tagSurfaceMaterial(bedFrame,'wood')
      const bedUpholstery=new THREE.MeshStandardMaterial({color:'#efe8dc',roughness:.94})
      const bedCover=new THREE.MeshStandardMaterial({color:'#b7c7bd',roughness:.96})
      const pillowMaterial=new THREE.MeshStandardMaterial({color:'#fbf8f1',roughness:.98})
      const headboardMaterial=new THREE.MeshStandardMaterial({color:'#9a7656',roughness:.74})
      tagSurfaceMaterial(headboardMaterial,'wood')
      const baseHeight=.25,mattressThickness=.19
      // Bed head is at the east/south end; its 1829 mm length follows the south wall westward.
      addBox(bedLength,baseHeight,bedWidth,bedCenterX,baseHeight/2,bedCenterZ,bedFrame,furniture)
      addBox(bedLength-.035,mattressThickness,bedWidth-.035,bedCenterX,baseHeight+mattressThickness/2,bedCenterZ,bedUpholstery,furniture)
      addBox(bedLength-.470,.065,bedWidth-.100,bedWest+(bedLength-.470)/2,baseHeight+mattressThickness+.025,bedCenterZ,bedCover,furniture)
      addBox(.085,.92,bedWidth,bedWest+bedLength-.043,.71,bedCenterZ,headboardMaterial,furniture)
      for(const offset of [-bedWidth*.23,bedWidth*.23]){
        addBox(.38,.08,.61,bedWest+bedLength-.26,.25+ mattressThickness+.07,bedCenterZ+offset,pillowMaterial,furniture)
      }
      const wardrobe=room.furniture.wardrobe
      if(wardrobe){
        const depth=mm(wardrobe.depthMm),length=mm(wardrobe.lengthMm),height=mm(wardrobe.heightMm)
        const start=mm(wardrobe.fromNorthMm),center=start+length/2,doors=wardrobe.doorCount||3
        const body=new THREE.MeshStandardMaterial({color:'#d0c0aa',roughness:.76})
        tagSurfaceMaterial(body,'wood')
        const front=new THREE.MeshStandardMaterial({color:'#e9e1d4',roughness:.66})
        tagSurfaceMaterial(front,'wood')
        const handle=new THREE.MeshStandardMaterial({color:'#373b3c',metalness:.62,roughness:.31})
        addBox(depth,height,length,depth/2,height/2,center,body,furniture)
        for(let i=0;i<doors;i++){
          const panelLength=length/doors-.012,z=start+(i+.5)*length/doors
          addBox(.025,height-.14,panelLength,depth+.014,(height+.09)/2,z,front,furniture)
          addBox(.018,.25,.018,depth+.034,1.15,z+panelLength*.35,handle,furniture)
        }
        addBox(depth+.035,.09,length,depth/2,.045,center,body,furniture)
      }
      const balconyFurniture=room.balconyExtension?.furniture
      if(balconyFurniture){
        const table=balconyFurniture.table,chair=balconyFurniture.chair
        const tableX=W+mm(table.centerFromBedroomWallMm),tableZ=mm(table.centerFromNorthMm)
        const chairX=W+mm(chair.centerFromBedroomWallMm),chairZ=mm(chair.centerFromNorthMm)
        const tabletop=new THREE.MeshStandardMaterial({color:'#b28a60',roughness:.67})
        tagSurfaceMaterial(tabletop,'wood')
        const frame=new THREE.MeshStandardMaterial({color:'#353b3d',metalness:.58,roughness:.34})
        const seat=new THREE.MeshStandardMaterial({color:'#d9cec1',roughness:.92})
        const tw=mm(table.widthMm),td=mm(table.depthMm),th=mm(table.heightMm)
        // The work surface runs north-south beside the east glazing.
        addBox(td,.04,tw,tableX,th,tableZ,tabletop,furniture)
        for(const dx of [-td/2+.055,td/2-.055])for(const dz of [-tw/2+.055,tw/2-.055])
          addBox(.03,th-.04,.03,tableX+dx,(th-.04)/2,tableZ+dz,frame,furniture)
        const cw=mm(chair.widthMm),cd=mm(chair.depthMm),seatH=mm(chair.seatHeightMm),backH=mm(chair.backHeightMm)
        addBox(cd,.07,cw,chairX,seatH,chairZ,seat,furniture)
        for(const dx of [-cd/2+.06,cd/2-.06])for(const dz of [-cw/2+.06,cw/2-.06])
          addBox(.028,seatH-.04,.028,chairX+dx,(seatH-.04)/2,chairZ+dz,frame,furniture)
        addBox(.05,backH-seatH,cw,chairX-cd/2+.03,(backH+seatH)/2,chairZ,seat,furniture)
      }
    }else if(roomKey==='lobby'){
      ironingStorage=createLobbyEastIroningStorage(room)
      furniture.add(ironingStorage)
      const {diningTable,chairRowsZmm,chairOffsetXmm}=room.furniture
      const tableX=mm(diningTable.centerXmm),tableZ=mm(diningTable.centerZmm)
      const oak=new THREE.MeshStandardMaterial({color:'#a98259',roughness:.66})
      tagSurfaceMaterial(oak,'wood')
      const upholstery=new THREE.MeshStandardMaterial({color:'#ded2bd',roughness:.96})
      const metal=new THREE.MeshStandardMaterial({color:'#393b38',metalness:.45,roughness:.42})
      // A 1200 x 700 mm table sits west of the pooja alcove, leaving its
      // east-side approach open. Upgraded 2026-09-28 on the owner's request
      // for higher-quality real furniture in renders: rounded-edge solid-oak
      // top over a shaped apron, on a turned pedestal with a brass collar and
      // a weighted disc foot. Footprint and height are unchanged from
      // roomShellConfig, so clearances are identical to the previous box table.
      const tableTopW=mm(diningTable.widthMm),tableTopL=mm(diningTable.lengthMm),tableTopY=mm(diningTable.heightMm)
      const oakDark=new THREE.MeshStandardMaterial({color:'#8f6a44',roughness:.52,metalness:.02});tagSurfaceMaterial(oakDark,'wood')
      const brass=new THREE.MeshStandardMaterial({color:'#b08d57',roughness:.28,metalness:.72})
      const tableTop=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.042,48),oak)
      tableTop.scale.set(tableTopL,1,tableTopW);tableTop.position.set(tableX,tableTopY,tableZ);furniture.add(tableTop)
      const tableEdge=new THREE.Mesh(new THREE.TorusGeometry(.5,.021,12,48),oakDark)
      tableEdge.rotation.x=Math.PI/2;tableEdge.scale.set(tableTopL,tableTopW,1);tableEdge.position.set(tableX,tableTopY,tableZ);furniture.add(tableEdge)
      const apron=new THREE.Mesh(new THREE.CylinderGeometry(.42,.40,.06,48),oakDark)
      apron.scale.set(tableTopL,1,tableTopW);apron.position.set(tableX,tableTopY-.05,tableZ);furniture.add(apron)
      const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.052,.075,tableTopY-.13,24),oakDark)
      pedestal.position.set(tableX,(tableTopY-.13)/2+.05,tableZ);furniture.add(pedestal)
      const collar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.03,24),brass)
      collar.position.set(tableX,tableTopY-.10,tableZ);furniture.add(collar)
      const foot=new THREE.Mesh(new THREE.CylinderGeometry(.30,.34,.045,36),oakDark)
      foot.scale.set(1.25,1,1);foot.position.set(tableX,.025,tableZ);furniture.add(foot)
      const footRing=new THREE.Mesh(new THREE.TorusGeometry(.31,.008,10,36),brass)
      footRing.rotation.x=Math.PI/2;footRing.scale.set(1.25,1,1);footRing.position.set(tableX,.05,tableZ);furniture.add(footRing)
      for(const side of [-1,1]) for(const zMm of chairRowsZmm){
        const x=tableX+side*mm(chairOffsetXmm),z=mm(zMm)
        addBox(.44,.065,.46,x,.47,z,upholstery,furniture)
        addBox(.055,.47,.46,x+side*.205,.73,z,oak,furniture)
        for(const dx of [-.16,.16]) for(const dz of [-.17,.17]) addBox(.035,.44,.035,x+dx,.22,z+dz,metal,furniture)
      }
      // Decor pass (owner request 2026-09-28): rug under the dining set, plant
      // by the south-west corner, lamp beside the pooja alcove, art on the
      // south wall. Positions avoid the toilet door, ironing storage and the
      // open east/west boundaries.
      const lobbyRug=createRug(1.9,1.5,'#b9c4bb');lobbyRug.position.set(tableX,0,tableZ);furniture.add(lobbyRug)
      const lobbyPlant=createPottedPlant(1.15);lobbyPlant.position.set(.5,0,L-.5);furniture.add(lobbyPlant)
      const lobbyLamp=createFloorLamp();lobbyLamp.position.set(3.55,0,.35);furniture.add(lobbyLamp)
      const lobbyArt=createWallArt(.95,.68,'#87775f');lobbyArt.position.set(2.9,1.5,L-.05);lobbyArt.rotation.y=Math.PI;furniture.add(lobbyArt)
    }
    if(roomKey==='bedroom1'&&room.furniture?.bed){
      // Decor pass (owner request 2026-09-28): rug beside the bed, cushions at
      // the headboard, art on the east wall, plant clear of doors and recess.
      const b1Rug=createRug(1.2,1.3,'#c7b9a6');b1Rug.position.set(1.05,0,2.55);furniture.add(b1Rug)
      for(const dz of [-.28,.28]){const cushion=createCushion(.34,dz<0?'#8d9c8f':'#b48b60');cushion.position.set(3.02,.445,2.478+dz);cushion.rotation.y=Math.PI/2;furniture.add(cushion)}
      const b1Art=createWallArt(.85,.6,'#7e8b99');b1Art.position.set(W-.05,1.55,2.478);b1Art.rotation.y=-Math.PI/2;furniture.add(b1Art)
      const b1Plant=createPottedPlant(1);b1Plant.position.set(2.2,0,.32);furniture.add(b1Plant)
      // Laundry hamper (owner request 2026-09-29): open floor south of the
      // wardrobe (which ends at z=1.8) and west of the bed (which starts at
      // x=1.524), just inside the south door to Lobby/Dining - clear of both
      // and clear of the door swing (door spans x 0.1-1.0 at the south wall).
      const hamper=createLaundryHamper();hamper.position.set(0.85,0,2.65);furniture.add(hamper)
    }
    furniture.visible=showFurniture
    southWall.visible=showSouthWall
    const grid=new THREE.GridHelper(Math.ceil(span),Math.ceil(span),0xffffff,0xffffff);grid.material.opacity=.18;grid.material.transparent=true;grid.position.set(W/2,.006,L/2);shell.add(grid)
    const labelTextures=[]
    const addMarker=(text,x,z)=>{
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=80
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(4,4,152,72,18);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=room.color;ctx.stroke();ctx.fillStyle='#172033';ctx.font='900 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,80,41)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;labelTextures.push(texture)
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(x,.1,z);sprite.scale.set(.34,.17,1);sprite.renderOrder=1000;shell.add(sprite)
    }
    addMarker('N',W/2,.25);addMarker('S',W/2,L-.25);addMarker('W',.25,L/2);addMarker('E',W-.25,L/2)
    const hemi=new THREE.HemisphereLight('#ffffff','#718096',1.15);scene.add(hemi)
    const sun=new THREE.DirectionalLight('#fff4dc',1.65);sun.position.set(-2,6,4);sun.castShadow=true;scene.add(sun)
    // Every other light in the scene is warm task/accent mood lighting; in
    // daylight mode those are dimmed instead of removed so fixtures stay lit.
    const moodLights=[];scene.traverse(object=>{if(object.isLight&&object!==hemi&&object!==sun)moodLights.push({light:object,base:object.intensity})})
    const setDaylight=on=>{
      if(on){
        hemi.color.set('#e9f2ff');hemi.groundColor.set('#b3a897');hemi.intensity=1.7
        sun.color.set('#fff9ec');sun.intensity=2.6
        scene.background.set('#f2f6f9')
        moodLights.forEach(({light,base})=>{light.intensity=base*.1})
      }else{
        // A real dusk mood, so the warm task lighting reads as the room's light.
        hemi.color.set('#c3d2e8');hemi.groundColor.set('#4e463e');hemi.intensity=.5
        sun.color.set('#ffd9a8');sun.intensity=.55
        scene.background.set('#242a33')
        moodLights.forEach(({light,base})=>{light.intensity=base*1.25})
      }
    }
    setDaylight(daylightRef.current)
    controls.target.set(W/2,H*.38,L/2)
    const setCamera=key=>{
      camera.fov=key==='poojaDoor'?54:46;camera.updateProjectionMatrix()
      if(key==='top'){camera.position.set((W+extensionDepth)/2,span*1.22,(L+southDepth)/2-.01);camera.up.set(0,0,1);controls.target.set((W+extensionDepth)/2,0,(L+southDepth)/2)}
      else if(key==='poojaDoor'&&room.poojaAlcove){const center=mm(room.poojaAlcove.fromMm+room.poojaAlcove.widthMm/2);camera.position.set(center,1.42,3.10);camera.up.set(0,1,0);controls.target.set(center,1.20,0)}
      else if(key==='pooja'&&room.poojaAlcove){const alcove=room.poojaAlcove,center=mm(alcove.fromMm+alcove.widthMm/2);camera.position.set(center+.55,1.48,2.55);camera.up.set(0,1,0);controls.target.set(mm(alcove.fromMm)+.30,.82,-.55)}
      else if(roomKey==='drawing'&&key==='tvWall'&&drawingLayoutRef.current!=='northTv'){camera.position.set(.45,1.9,3.9);camera.up.set(0,1,0);controls.target.set(2.9,1.0,1.0)}
      else if(roomKey==='drawing'&&key==='tvWall'){camera.position.set(1.75,1.5,L-.3);camera.up.set(0,1,0);controls.target.set(1.05,1.15,.3)}
      else if(roomKey==='lobby'){camera.position.set(W+span*.36,H*2.5,L+span*.42);camera.up.set(0,1,0);controls.target.set(W/2,H*.30,L/2)}
      else if(roomKey==='bedroom1'){camera.position.set(W+extensionDepth+span*.42,H*2.25,-span*.45);camera.up.set(0,1,0);controls.target.set((W+extensionDepth)/2,H*.40,L/2)}
      else if(roomKey==='bedroom3'&&key==='southOpenings'){camera.position.set(W*.45,H*.76,L*.2);camera.up.set(0,1,0);controls.target.set(W*.72,H*.48,L)}
      else if(roomKey==='bedroom3'){camera.position.set(W*.62,H*2.2,L+southDepth+span*.42);camera.up.set(0,1,0);controls.target.set(W*.65,H*.4,(L+southDepth)/2)}
      else{camera.position.set(openWest?-span*.46:W+span*.46,H*2.05,-span*.42);camera.up.set(0,1,0);controls.target.set(W/2,H*.42,L/2)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera(initialView)
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
      const side=markedMesh.userData.wallSide
      if(markedMesh.userData.balconyPoojaWall){
        const distance=Math.max(0,Math.round((hit.point.x-W)*1000/10)*10)
        setWallSelection({label:`Bedroom 1 balcony — wall between balcony and Pooja Ghar, about ${distance.toLocaleString()} mm from the Bedroom 1 east wall, beside the balcony window`})
      }else{
        const distance=Math.round((side==='north'||side==='south'?hit.point.x:hit.point.z)*1000/10)*10
        const reference=side==='north'||side==='south'?'west':'north'
        setWallSelection({label:`${room.name} — ${side} wall, about ${distance.toLocaleString()} mm from the ${reference} corner`})
      }
      setWallNote('')
    }
    renderer.domElement.addEventListener('pointerdown',onPointerDown)
    renderer.domElement.addEventListener('pointerup',onPointerUp)
    const interiorScene=registerInteriorScene({id:roomKey,scene,camera,renderer,zones:[{id:roomKey,min:[0,0,0],max:[W,H,L]}]})
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    // Renders the six review-sheet views (top plan, overview, four walls from inside) at fixed sizes, then restores the camera.
    const captureReview=()=>{
      const saved={pos:camera.position.clone(),up:camera.up.clone(),target:controls.target.clone(),fov:camera.fov,aspect:camera.aspect,size:renderer.getSize(new THREE.Vector2()),ratio:renderer.getPixelRatio()}
      const views={};let project=null
      const shoot=(name,width,height,place)=>{
        renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height
        place();camera.updateProjectionMatrix();camera.lookAt(controls.target);renderer.render(scene,camera)
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
        canvas.getContext('2d').drawImage(renderer.domElement,0,0,width,height);views[name]=canvas
        return camera.clone()
      }
      drawingLayouts?.setLabels(true)
      try{
        shoot('overview',1200,900,()=>setCamera('overview'))
        // Near-orthographic top plan (narrow lens, far away) so tall walls do not smear the floor outline; no 3D labels here
        // because the plan gets its own dimension labels.
        drawingLayouts?.setLabels(false)
        const topCamera=shoot('top',1000,1000,()=>{setCamera('top');camera.fov=20;camera.position.y*=2.41*1.3;camera.updateProjectionMatrix()}),point=new THREE.Vector3()
        drawingLayouts?.setLabels(true)
        project=(xMm,zMm)=>{point.set(xMm/1000,.02,zMm/1000).project(topCamera);return [(point.x+1)/2*1000,(1-point.y)/2*1000]}
        // Wall views are all shot from the room centre at eye height: near a wall the camera can end up inside a cabinet or sofa.
        const inside=(name,tx,tz,fov)=>shoot(name,800,600,()=>{camera.fov=fov;camera.position.set(W/2,1.5,L/2);camera.up.set(0,1,0);controls.target.set(tx,1.3,tz)})
        inside('north',W/2,0,78);inside('south',W/2,L,78);inside('east',W,L/2,84);inside('west',0,L/2,84)
      }finally{
        drawingLayouts?.setLabels(tvLabelsRef.current)
        renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x,saved.size.y,false)
        camera.aspect=saved.aspect;camera.fov=saved.fov;camera.position.copy(saved.pos);camera.up.copy(saved.up);controls.target.copy(saved.target)
        camera.updateProjectionMatrix();camera.lookAt(controls.target);controls.update()
      }
      return {views,project}
    }
    sceneRef.current={captureReview,setTvLabels:visible=>drawingLayouts?.setLabels(visible),setDrawingLayout:key=>drawingLayouts?.setLayout(key),setDrawingArm:pulled=>drawingLayouts?.setArm(pulled),setDrawingTv:key=>drawingLayouts?.setTvSize(key),setMirrorOpen:value=>vanity.userData.setMirrorOpen?.(value),setPartitionOpen:value=>partition.userData.setOpen?.(value),setCamera,setSouthVisible:value=>{southWall.visible=value},setFurnitureVisible:value=>{furniture.visible=value},setBoardOpen:value=>{ironingStorage?.userData.setBoardOpen(value)},setPoojaDoorsOpen:value=>{poojaDoors?.userData.setDoorsOpen(value)},clearMark,setDaylight}
    return()=>{interiorScene.dispose();cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);controls.dispose();labelTextures.forEach(texture=>texture.dispose());shell.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose?.()});markedWallMaterial.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[roomKey,initialView])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view,roomKey])
  useEffect(()=>{sceneRef.current?.setSouthVisible(showSouthWall)},[showSouthWall,roomKey])
  useEffect(()=>{sceneRef.current?.setFurnitureVisible(showFurniture)},[showFurniture,roomKey])
  useEffect(()=>{tvLabelsRef.current=tvLabels;sceneRef.current?.setTvLabels(tvLabels)},[tvLabels,roomKey])
  useEffect(()=>{drawingLayoutRef.current=drawingLayout;sceneRef.current?.setDrawingLayout(drawingLayout);sceneRef.current?.setCamera(view)},[drawingLayout])
  useEffect(()=>{sceneRef.current?.setDrawingArm(armOut)},[armOut,roomKey])
  useEffect(()=>{sceneRef.current?.setDrawingTv(tvSize)},[tvSize,roomKey])
  useEffect(()=>{sceneRef.current?.setBoardOpen(showIroningBoard)},[showIroningBoard,roomKey])
  useEffect(()=>{sceneRef.current?.setMirrorOpen(mirrorOpen)},[mirrorOpen,roomKey])
  useEffect(()=>{sceneRef.current?.setPartitionOpen(partitionOpen)},[partitionOpen,roomKey])
  useEffect(()=>{sceneRef.current?.setPoojaDoorsOpen(poojaDoorsOpen)},[poojaDoorsOpen,roomKey])
  useEffect(()=>{daylightRef.current=daylightOn;sceneRef.current?.setDaylight(daylightOn)},[daylightOn,roomKey])

  const makeReview=async()=>{
    setReviewBusy(true);setReviewNote('')
    try{
      await new Promise(resolve=>setTimeout(resolve,30))
      const shots=sceneRef.current.captureReview()
      const brief=buildRoomReview({roomKey,room,layoutKey:roomKey==='drawing'?drawingLayoutRef.current:null,references:referencesFor(roomKey)})
      const blob=await canvasToBlob(composeReviewSheet({review:brief,room,views:shots.views,project:shots.project}))
      setReview(previous=>{if(previous)URL.revokeObjectURL(previous.url);return {url:URL.createObjectURL(blob),blob,text:brief.text,title:brief.title}})
    }catch(error){setReviewNote('Could not build the review sheet: '+error.message)}
    finally{setReviewBusy(false)}
  }
  const copyReview=async kind=>{
    try{
      if(kind==='image')await navigator.clipboard.write([new ClipboardItem({'image/png':review.blob})])
      else await navigator.clipboard.writeText(review.text)
      setReviewNote(kind==='image'?'Image copied. Paste it into the AI chat, then paste the text brief as well.':'Text brief copied. Paste it together with the image.')
    }catch{setReviewNote('The browser blocked clipboard access. Use the download buttons instead.')}
  }
  const saveFile=(blobOrText,name,type)=>{
    const url=URL.createObjectURL(blobOrText instanceof Blob?blobOrText:new Blob([blobOrText],{type}))
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const reviewName=roomKey+(roomKey==='drawing'?'-layout-'+drawingLayout:'')+'-review'

  return <>
    {showSelector&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
      {Object.entries(EMPTY_ROOM_SHELLS).map(([key,item])=><button key={key} onClick={()=>{setRoomKey(key);setView('overview');setShowSouthWall(key==='lobby'||key==='drawing'||key==='bedroom1');setShowFurniture(key==='bedroom1'||key==='bedroom3'||key==='drawing'||key==='lobby');setShowBedroom3Renders(key==='bedroom3');setShowDrawingRender(key==='drawing');setWallSelection(null);setWallNote('')}} style={{...buttonStyle(roomKey===key),padding:'9px 13px'}}>{item.name}</button>)}
    </div>}
    <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>{room.name}</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>{room.widthMm.toLocaleString()} × {room.lengthMm.toLocaleString()} mm · provisional {room.heightMm.toLocaleString()} mm ceiling datum</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button onClick={()=>setDaylightOn(true)} aria-pressed={daylightOn} style={buttonStyle(daylightOn)}>Daylight</button>
        <button onClick={()=>setDaylightOn(false)} aria-pressed={!daylightOn} style={buttonStyle(!daylightOn)}>Evening</button>
        <button onClick={()=>setView('overview')} aria-pressed={view==='overview'} style={buttonStyle(view==='overview')}>Overview</button>
        <button onClick={()=>setView('top')} aria-pressed={view==='top'} style={buttonStyle(view==='top')}>Top</button>
        <button onClick={makeReview} disabled={reviewBusy} style={buttonStyle(false)} title="One image with a dimensioned top plan, an overview and the four walls, plus a text brief, for sharing with an online AI">{reviewBusy?'Building review sheet…':'Review sheet for AI'}</button>
        {roomKey==='drawing'&&<button onClick={()=>setView('tvWall')} aria-pressed={view==='tvWall'} style={buttonStyle(view==='tvWall')}>TV wall view</button>}
        {roomKey==='bedroom3'&&<button onClick={()=>{setShowSouthWall(true);setView('southOpenings')}} aria-pressed={view==='southOpenings'} style={buttonStyle(view==='southOpenings')}>Balcony door + window</button>}
        {room.poojaAlcove&&<button onClick={()=>{setView('pooja');setPoojaDoorsOpen(true)}} aria-pressed={view==='pooja'} style={buttonStyle(view==='pooja')}>Pooja view</button>}
        {room.poojaAlcove&&<button onClick={()=>{setView('poojaDoor');setPoojaDoorsOpen(false)}} aria-pressed={view==='poojaDoor'} style={buttonStyle(view==='poojaDoor')}>Door front</button>}
        {roomKey==='bedroom3'&&<button onClick={()=>setMirrorOpen(value=>!value)} style={buttonStyle(mirrorOpen)}>{mirrorOpen?'Close vanity mirror':'Open vanity mirror'}</button>}
        {roomKey==='bedroom3'&&<button onClick={()=>setShowBedroom3Renders(value=>!value)} aria-pressed={showBedroom3Renders} style={buttonStyle(showBedroom3Renders)}>{showBedroom3Renders?'Hide renders':'Show renders'}</button>}
        {roomKey==='drawing'&&<label style={{display:'flex',alignItems:'center',gap:6,fontWeight:800,fontSize:13}}>Layout
          <select value={drawingLayout} onChange={event=>setDrawingLayout(event.target.value)} style={{padding:'7px 8px',borderRadius:9,border:'1px solid #cbd5e1',maxWidth:360}}>{DRAWING_LAYOUTS.map(layout=><option key={layout.key} value={layout.key}>{layout.label}</option>)}</select>
        </label>}
        {roomKey==='drawing'&&drawingLayout==='cornerConsole'&&<>
          <button onClick={()=>setArmOut(value=>!value)} aria-pressed={armOut} style={buttonStyle(armOut)}>{armOut?'Park TV flat on the wall':'Pull TV out and turn it toward the north sofa'}</button>
          <button onClick={()=>setTvSize(value=>value==='55'?'65':'55')} style={buttonStyle(tvSize==='65')}>TV size: {tvSize} inch (click for {tvSize==='55'?'65':'55'})</button>
        </>}
        {roomKey==='drawing'&&<button onClick={()=>setTvLabels(value=>!value)} aria-pressed={tvLabels} style={buttonStyle(tvLabels)}>{tvLabels?'Hide TV wall labels':'Show TV wall labels'}</button>}
        {roomKey==='drawing'&&<button onClick={()=>setShowDrawingRender(value=>!value)} aria-pressed={showDrawingRender} style={buttonStyle(showDrawingRender)}>{showDrawingRender?'Hide Blender preview':'Show Blender preview'}</button>}
        {(roomKey==='drawing'||roomKey==='lobby')&&<button onClick={()=>setPartitionOpen(value=>!value)} style={buttonStyle(partitionOpen)}>{partitionOpen?'Close drawing partition':'Open drawing partition'}</button>}
        {room.poojaAlcove&&<button onClick={()=>setPoojaDoorsOpen(value=>!value)} style={buttonStyle(poojaDoorsOpen)}>{poojaDoorsOpen?'Close Pooja doors':'Open Pooja doors'}</button>}
        {roomKey==='lobby'&&<button onClick={()=>setShowIroningBoard(value=>!value)} style={buttonStyle(showIroningBoard)}>{showIroningBoard?'Stow ironing board':'Pull out ironing board'}</button>}
        <button onClick={()=>setShowSouthWall(value=>!value)} style={buttonStyle(showSouthWall)}>{showSouthWall?'Hide south wall':'Show south wall'}</button>
        {(roomKey==='bedroom1'||roomKey==='bedroom3'||roomKey==='drawing'||roomKey==='lobby')&&<button onClick={()=>setShowFurniture(value=>!value)} style={buttonStyle(showFurniture)}>{showFurniture?'Hide furniture':'Show furniture'}</button>}
      </div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1100px)',width:'100%'}}/>
    {(review||reviewNote)&&<div style={{padding:16,borderTop:'1px solid #e2e8f0',background:'#f8fafc'}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
        <b>{review?'Review sheet: '+review.title:'Review sheet'}</b>
        {review&&<>
          <button onClick={()=>saveFile(review.blob,reviewName+'.png')} style={buttonStyle(false)}>Download image</button>
          <button onClick={()=>copyReview('image')} style={buttonStyle(false)}>Copy image</button>
          <button onClick={()=>copyReview('text')} style={buttonStyle(false)}>Copy text brief</button>
          <button onClick={()=>saveFile(review.text,reviewName+'.md','text/markdown')} style={buttonStyle(false)}>Download text brief</button>
          <button onClick={()=>{URL.revokeObjectURL(review.url);setReview(null);setReviewNote('')}} style={buttonStyle(false)}>Close</button>
        </>}
      </div>
      {reviewNote&&<p role="status" style={{margin:'0 0 10px',color:'#334155'}}>{reviewNote}</p>}
      {review&&<>
        <p style={{margin:'0 0 10px',fontSize:13,color:'#475569'}}>Share the image and the text brief together: the image shows the room, the text carries every size exactly (small print in a picture is easy for an AI to misread). Then ask it to review, or to make a render that keeps the same proportions.</p>
        <img src={review.url} alt="Room review sheet preview" style={{width:'100%',maxWidth:1300,border:'1px solid #cbd5e1',borderRadius:8}}/>
      </>}
    </div>}
    {roomKey==='drawing'&&showDrawingRender&&<div style={{padding:'16px',background:'#f5f0e9',borderTop:'1px solid #e2e8f0'}}>
      <div style={{fontSize:13,color:'#5b5147',marginBottom:10}}>Drawing Room finish and lighting preview · photographed beige plaster texture from Poly Haven · Blender render</div>
      <img src="/renders/drawing-room-chandelier-lighting.png" alt="Drawing Room Blender preview with one chandelier above the oval table and a west-wall uplight" style={{display:'block',width:'100%',maxWidth:1100,height:'auto',borderRadius:12,margin:'0 auto'}}/>
    </div>}
    {roomKey==='drawing'&&<div style={{padding:'16px 20px',borderTop:'1px solid #e2e8f0',background:'#fffaf3',color:'#382c21'}}>
      <b style={{fontSize:16}}>Drawing Room lighting plan · exposed ceiling</b>
      <div style={{fontSize:13,marginTop:5}}>Keep the existing chandelier as the only ceiling light. Add wall and accent light on separate controls for flexible evenings.</div>
      <ul style={{margin:'10px 0 0',paddingLeft:20,fontSize:13,lineHeight:1.65}}>
        <li><b>General:</b> existing chandelier centered above the oval table, about 1.75 m from west and 2.42 m from north.</li>
        <li><b>Wall:</b> one upward-facing sconce on the west wall, 0.85 m from north and 1.8 m high; clear of the AC.</li>
        <li><b>Reading:</b> adjustable lamp by the south window seat, about 1.55 m high.</li>
        <li><b>Accent:</b> dimmable glow behind the east-wall TV and below the window seat; keep both low for evening viewing.</li>
      </ul>
      <div style={{fontSize:12,marginTop:8,color:'#715b47'}}>Concept positions; confirm switch locations, cable routes, and mounting with the electrician on site.</div>
    </div>}
    {roomKey==='bedroom3'&&showBedroom3Renders&&<div style={{padding:'16px',background:'#f5f0e9',borderTop:'1px solid #e2e8f0'}}>
      <div style={{fontSize:13,color:'#5b5147',marginBottom:10}}>Bedroom 3 material preview · warm honey oak · saved Blender views</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))',gap:12}}>
        <figure style={{margin:0}}><img src="/renders/bedroom3-overview.png" alt="Bedroom 3 rendered overview with honey oak wardrobes" style={{display:'block',width:'100%',height:'auto',borderRadius:12}}/><figcaption style={{fontSize:12,color:'#5b5147',marginTop:5}}>Room overview</figcaption></figure>
        <figure style={{margin:0}}><img src="/renders/bedroom3-vanity.png" alt="Bedroom 3 rendered wardrobe vanity with honey oak finish" style={{display:'block',width:'100%',height:'auto',borderRadius:12}}/><figcaption style={{fontSize:12,color:'#5b5147',marginTop:5}}>Integrated vanity</figcaption></figure>
      </div>
    </div>}
    <WallSelectionPanel selection={wallSelection} note={wallNote} onNoteChange={setWallNote} onClear={()=>sceneRef.current?.clearMark()}/>
    </section>
  </>
}

function buttonStyle(active){return{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}
