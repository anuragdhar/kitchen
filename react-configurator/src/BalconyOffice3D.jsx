import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {BALCONY_OFFICE} from './config/balconyOfficeConfig.js'

const mm=value=>value/1000
const feetInches=valueMm=>{
  let eighths=Math.round(valueMm/25.4*8)
  let feet=Math.floor(eighths/96)
  eighths-=feet*96
  const inches=Math.floor(eighths/8)
  const fraction=eighths%8
  const divisors=fraction===0?[0,1]:fraction%4===0?[fraction/4,2]:fraction%2===0?[fraction/2,4]:[fraction,8]
  const inchText=`${inches}${fraction?` ${divisors[0]}/${divisors[1]}`:''}`
  return `${feet}'-${inchText}\"`
}

export default function BalconyOffice3D(){
  const mountRef=useRef(null)
  const sectionRef=useRef(null)
  const sceneRef=useRef(null)
  const [preset,setPreset]=useState('overview')
  const [showHuman,setShowHuman]=useState(BALCONY_OFFICE.referenceFigure.defaultVisible)
  const [personAssetStatus,setPersonAssetStatus]=useState('loading')
  const [deskHeightIn,setDeskHeightIn]=useState(Math.round(BALCONY_OFFICE.worktop.westAdjustable.defaultHeightMm/25.4))
  const [isFullscreen,setIsFullscreen]=useState(false)
  const [dimensionUnit,setDimensionUnit]=useState('ft-in')
  const [showItems,setShowItems]=useState(false)
  const [selectedItem,setSelectedItem]=useState(null)
  const [highQuality,setHighQuality]=useState(true)
  const [screenshotStatus,setScreenshotStatus]=useState('idle')
  const [showDirections,setShowDirections]=useState(true)
  const [selectedCarpentryItem,setSelectedCarpentryItem]=useState(null)

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const office=BALCONY_OFFICE
    const W=mm(office.dimensions.widthMm)
    const L=mm(office.dimensions.lengthMm)
    const H=mm(office.dimensions.floorToCeilingMm)
    const parapet=mm(office.envelope.lowerBrickParapetMm)
    const windowH=mm(office.envelope.windowBandMm)
    const topBand=mm(office.envelope.upperBrickBandMm)

    const scene=new THREE.Scene()
    scene.background=new THREE.Color('#e8eef4')
    const camera=new THREE.PerspectiveCamera(48,1,0.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.5))
    renderer.shadowMap.enabled=true
    renderer.shadowMap.type=THREE.PCFSoftShadowMap
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1.08
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer)
    const environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment

    const controls=new OrbitControls(camera,renderer.domElement)
    controls.enableDamping=true
    controls.target.set(W/2,H*.45,L/2)

    const room=new THREE.Group()
    scene.add(room)
    const itemObjects={}
    const directionTextures=[]
    const directionGroup=new THREE.Group()
    const addDirectionMarker=(label,x,z,primary=false)=>{
      const canvas=document.createElement('canvas');canvas.width=192;canvas.height=96
      const context=canvas.getContext('2d')
      context.fillStyle=primary?'rgba(35,25,66,.92)':'rgba(255,255,255,.9)'
      context.strokeStyle=primary?'rgba(255,255,255,.9)':'rgba(35,25,66,.75)'
      context.lineWidth=5
      context.beginPath();context.roundRect(5,5,182,86,22);context.fill();context.stroke()
      context.fillStyle=primary?'#ffffff':'#231942'
      context.font=`800 ${label.length===1?48:40}px Arial`
      context.textAlign='center';context.textBaseline='middle';context.fillText(label,96,50)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
      directionTextures.push(texture)
      const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false})
      const marker=new THREE.Sprite(material)
      marker.position.set(x,.075,z);marker.scale.set(label.length===1?.34:.42,.18,1);marker.renderOrder=1000
      directionGroup.add(marker)
    }
    addDirectionMarker('N',W/2,.11,true)
    addDirectionMarker('S',W/2,L-.11,true)
    addDirectionMarker('W',.11,L/2,true)
    addDirectionMarker('E',W-.11,L/2,true)
    addDirectionMarker('NW',.14,.14)
    addDirectionMarker('NE',W-.14,.14)
    addDirectionMarker('SW',.14,L-.14)
    addDirectionMarker('SE',W-.14,L-.14)
    directionGroup.visible=showDirections
    room.add(directionGroup)
    const makeTexture=(base,draw)=>{
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512
      const context=canvas.getContext('2d');context.fillStyle=base;context.fillRect(0,0,512,512);draw(context)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();return texture
    }
    const woodTexture=makeTexture('#c9aa7b',context=>{
      const wash=context.createLinearGradient(0,0,0,512)
      wash.addColorStop(0,'rgba(255,244,218,.24)');wash.addColorStop(.48,'rgba(116,75,43,.055)');wash.addColorStop(1,'rgba(244,216,172,.18)')
      context.fillStyle=wash;context.fillRect(0,0,512,512)
      for(let y=0;y<512;y+=42){context.fillStyle=y%84===0?'rgba(255,241,211,.09)':'rgba(91,54,28,.035)';context.fillRect(0,y,512,39)}
      for(let i=0;i<230;i++){
        const y=(i*67)%512
        context.strokeStyle=`rgba(${i%3?101:232},${i%3?65:198},${i%3?37:151},${.025+(i%7)*.006})`
        context.lineWidth=.5+(i%4)*.32
        context.beginPath();context.moveTo(0,y)
        for(let x=0;x<=512;x+=24)context.lineTo(x,y+Math.sin((x+i*13)/43)*3+Math.sin((x+i*7)/97)*5)
        context.stroke()
      }
      for(const [x,y,r] of [[118,128,18],[365,338,25],[232,455,13]]){
        context.strokeStyle='rgba(91,52,25,.15)';context.lineWidth=2;context.beginPath();context.ellipse(x,y,r,r*.34,0,0,Math.PI*2);context.stroke()
        context.strokeStyle='rgba(255,232,190,.18)';context.beginPath();context.ellipse(x,y,r+7,r*.48,0,0,Math.PI*2);context.stroke()
      }
    })
    woodTexture.repeat.set(2,5)
    const marbleTexture=makeTexture('#f5f5f2',context=>{
      for(let i=0;i<24;i++){
        const startY=(i*89)%560-24
        context.strokeStyle=`rgba(132,137,142,${.025+(i%5)*.01})`
        context.lineWidth=.6+(i%3)*.45
        context.beginPath();context.moveTo(-20,startY)
        for(let x=0;x<=540;x+=36)context.lineTo(x,startY+x*.17+Math.sin((x+i*23)/62)*13)
        context.stroke()
      }
      for(let i=0;i<350;i++){const shade=210+(i%25);context.fillStyle=`rgba(${shade},${shade},${shade},.12)`;context.fillRect((i*83)%512,(i*151)%512,1.2,1.2)}
    })
    marbleTexture.repeat.set(2,4)
    const makeMaterial=(color,roughness=.72,map=null,metalness=0)=>new THREE.MeshStandardMaterial({color,map,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8})
    const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#bdeaff',transparent:true,opacity:.32,transmission:.7,roughness:.08,metalness:0,clearcoat:1,clearcoatRoughness:.12,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.25})
    const addBox=({w,h,d,x,y,z,color,opacity=1,roughness=.72,map=null,metalness=0,customMaterial=null})=>{
      const geometry=new THREE.BoxGeometry(w,h,d)
      const material=customMaterial||new THREE.MeshStandardMaterial({color,map,transparent:opacity<1,opacity,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8})
      const mesh=new THREE.Mesh(geometry,material)
      mesh.position.set(x,y,z)
      mesh.castShadow=opacity>.5
      mesh.receiveShadow=true
      room.add(mesh)
      return mesh
    }
    const tagCarpentry=(object,item)=>{
      object.userData.carpentryItem=item
      return object
    }

    addBox({w:W,h:.06,d:L,x:W/2,y:-.03,z:L/2,color:'#ffffff',map:marbleTexture,roughness:.32})

    // North wall with the cabinet in front of it.
    addBox({w:W,h:H,d:.08,x:W/2,y:H/2,z:-.04,color:'#f4f1eb'})

    // South/front wall: wood-clad parapet, window band, and top wood-clad band.
    addBox({w:W,h:parapet,d:.08,x:W/2,y:parapet/2,z:L+.04,color:'#ffffff',map:woodTexture,roughness:.58})
    addBox({w:W,h:windowH,d:.025,x:W/2,y:parapet+windowH/2,z:L,color:'#bdeaff',customMaterial:glassMaterial})
    addBox({w:W,h:topBand,d:.08,x:W/2,y:H-topBand/2,z:L+.04,color:'#ffffff',map:woodTexture,roughness:.58})

    // West wall is on the left in the cabinet-facing view.
    addBox({w:.08,h:parapet,d:L,x:-.04,y:parapet/2,z:L/2,color:'#ffffff',map:woodTexture,roughness:.58})
    addBox({w:.025,h:windowH,d:L,x:0,y:parapet+windowH/2,z:L/2,color:'#bdeaff',customMaterial:glassMaterial})
    addBox({w:.08,h:topBand,d:L,x:-.04,y:H-topBand/2,z:L/2,color:'#ffffff',map:woodTexture,roughness:.58})

    // A low east-side threshold indicates access from the study without blocking the view.
    addBox({w:.06,h:.08,d:L,x:W+.03,y:.04,z:L/2,color:'#8b8177'})

    const cabinet=office.cabinetry.northWall
    const cabinetW=mm(cabinet.lower.widthMm)
    const lowerH=mm(cabinet.lower.heightMm)
    const lowerD=mm(cabinet.lower.depthMm)
    const upperH=mm(cabinet.upper.heightMm)
    const upperD=mm(cabinet.upper.depthMm)
    const cabinetX=W-cabinetW/2
    const lowerCabinetMesh=addBox({w:cabinetW,h:lowerH,d:lowerD,x:cabinetX,y:lowerH/2,z:lowerD/2,color:'#ffffff',map:woodTexture,roughness:.54})
    tagCarpentry(lowerCabinetMesh,{name:'North lower cabinet',widthMm:cabinet.lower.widthMm,heightMm:cabinet.lower.heightMm,depthMm:cabinet.lower.depthMm,note:'Two-panel bypass sliders above and below the tabletop line'})
    const upperCabinetGroup=new THREE.Group()
    upperCabinetGroup.position.set(cabinetX,H-upperH/2,upperD/2)
    const upperCarcassMaterial=makeMaterial('#ffffff',.52,woodTexture)
    const addUpperPart=(w,h,d,x,y,z)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),upperCarcassMaterial)
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;upperCabinetGroup.add(mesh);return mesh
    }
    addUpperPart(cabinetW,.025,upperD,0,upperH/2-.0125,0)
    addUpperPart(cabinetW,.025,upperD,0,-upperH/2+.0125,0)
    addUpperPart(cabinetW-.05,upperH-.05,.022,0,0,-upperD/2+.011)
    addUpperPart(.025,upperH,upperD,-cabinetW/2+.0125,0,0)
    addUpperPart(.025,upperH,upperD,cabinetW/2-.0125,0,0)
    const heaterBayW=mm(cabinet.upper.heaterBayWidthMm)
    const dividerX=cabinetW/2-heaterBayW
    addUpperPart(.025,upperH-.05,upperD-.03,dividerX,0,0)
    room.add(upperCabinetGroup)
    tagCarpentry(upperCabinetGroup,{name:'North upper service cabinet',widthMm:cabinet.lower.widthMm,heightMm:cabinet.upper.heightMm,depthMm:cabinet.upper.depthMm,note:'Ventilated heater bay at east and isolated router bay immediately west'})

    const doorMaterial=makeMaterial('#ffffff',.47,woodTexture)

    // Tall lower cabinet: drawers below the tabletop datum and sliding doors above it.
    const halfDoor=cabinetW/2-.008
    const splitY=mm(office.cabinetry.northWall.doors.lower.splitHeightMm)
    const sliderH=lowerH-splitY-.025
    addBox({w:cabinetW-.035,h:sliderH-.025,d:.012,x:cabinetX,y:splitY+.0125+sliderH/2,z:lowerD+.002,color:'#34312e',roughness:.72})
    addBox({w:cabinetW-.012,h:.025,d:lowerD,x:cabinetX,y:splitY,z:lowerD/2,color:'#72583e',roughness:.55})
    addBox({w:cabinetW-.025,h:.014,d:.035,x:cabinetX,y:splitY+.021,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    addBox({w:cabinetW-.025,h:.014,d:.035,x:cabinetX,y:lowerH-.012,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    const rightSlider=new THREE.Mesh(new THREE.BoxGeometry(halfDoor,sliderH,.018),doorMaterial)
    rightSlider.position.set(cabinetX+cabinetW/4,splitY+.0125+sliderH/2,lowerD+.012)
    rightSlider.castShadow=true
    room.add(rightSlider)
    tagCarpentry(rightSlider,{name:'North upper right sliding panel',widthMm:Math.round(halfDoor*1000),heightMm:Math.round(sliderH*1000),depthMm:18,note:'Bypass sliding front'})
    const leftSlider=new THREE.Mesh(new THREE.BoxGeometry(halfDoor,sliderH,.018),doorMaterial)
    leftSlider.position.set(cabinetX+.035,splitY+.0125+sliderH/2,lowerD+.034)
    leftSlider.castShadow=true
    room.add(leftSlider)
    tagCarpentry(leftSlider,{name:'North upper left sliding panel',widthMm:Math.round(halfDoor*1000),heightMm:Math.round(sliderH*1000),depthMm:18,note:'Bypass sliding front, shown shifted open'})
    addBox({w:.022,h:.18,d:.032,x:cabinetX+.035+halfDoor/2-.045,y:splitY+sliderH*.52,z:lowerD+.052,color:'#20262c',roughness:.34,metalness:.25})
    const northFiller=mm(office.cabinetry.northWall.doors.lower.belowTabletop.cornerFillerMm)
    const lowerSliderW=(cabinetW-northFiller)/2-.008
    const lowerSliderH=splitY-.065
    const lowerRunCenter=cabinetX+northFiller/2
    addBox({w:cabinetW-northFiller-.035,h:lowerSliderH-.02,d:.012,x:lowerRunCenter,y:.0325+lowerSliderH/2,z:lowerD+.002,color:'#34312e',roughness:.72})
    addBox({w:cabinetW-northFiller-.025,h:.014,d:.035,x:lowerRunCenter,y:.026,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    addBox({w:cabinetW-northFiller-.025,h:.014,d:.035,x:lowerRunCenter,y:splitY-.026,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    if(northFiller>0) addBox({w:northFiller,h:splitY-.045,d:.025,x:cabinetX-cabinetW/2+northFiller/2,y:splitY/2,z:lowerD+.02,color:'#b9966d',roughness:.58})
    const lowerRightSlider=new THREE.Mesh(new THREE.BoxGeometry(lowerSliderW,lowerSliderH,.018),doorMaterial)
    lowerRightSlider.position.set(lowerRunCenter+(cabinetW-northFiller)/4,.0325+lowerSliderH/2,lowerD+.012)
    lowerRightSlider.castShadow=true
    room.add(lowerRightSlider)
    tagCarpentry(lowerRightSlider,{name:'North lower right sliding panel',widthMm:Math.round(lowerSliderW*1000),heightMm:Math.round(lowerSliderH*1000),depthMm:18,note:'Bypass sliding front'})
    const lowerLeftSlider=new THREE.Mesh(new THREE.BoxGeometry(lowerSliderW,lowerSliderH,.018),doorMaterial)
    lowerLeftSlider.position.set(lowerRunCenter+.035,.0325+lowerSliderH/2,lowerD+.034)
    lowerLeftSlider.castShadow=true
    room.add(lowerLeftSlider)
    tagCarpentry(lowerLeftSlider,{name:'North lower left sliding panel',widthMm:Math.round(lowerSliderW*1000),heightMm:Math.round(lowerSliderH*1000),depthMm:18,note:'Bypass sliding front, shown shifted open'})
    addBox({w:.022,h:.18,d:.032,x:lowerRunCenter+.035+lowerSliderW/2-.045,y:.0325+lowerSliderH*.52,z:lowerD+.052,color:'#20262c',roughness:.34,metalness:.25})

    // Upper cabinet: one top-hinged lift-up flap.
    const liftGroup=new THREE.Group()
    liftGroup.position.set(cabinetX,H-.012,upperD+.014)
    const liftPanel=new THREE.Mesh(new THREE.BoxGeometry(cabinetW-.016,upperH-.026,.018),doorMaterial)
    liftPanel.position.y=-(upperH-.026)/2
    liftPanel.castShadow=true
    liftGroup.add(liftPanel)
    tagCarpentry(liftPanel,{name:'North upper lift-up flap',widthMm:Math.round((cabinetW-.016)*1000),heightMm:Math.round((upperH-.026)*1000),depthMm:18,note:'Top-hinged flap shown open 25 degrees'})
    liftGroup.rotation.x=THREE.MathUtils.degToRad(-25)
    room.add(liftGroup)

    // Existing water heater concealed in the east service bay, isolated from the router bay.
    const upperBottomY=H-upperH
    const heaterGroup=new THREE.Group()
    const heaterX=W-heaterBayW/2
    const heaterH=.5
    const heaterRadius=.18
    const heaterY=H-.31
    const heaterMaterial=new THREE.MeshStandardMaterial({color:'#e8e2d3',roughness:.58,metalness:.12})
    const heaterBody=new THREE.Mesh(new THREE.CylinderGeometry(heaterRadius,heaterRadius,heaterH,32),heaterMaterial)
    heaterBody.position.set(heaterX,heaterY,upperD*.48);heaterBody.castShadow=true;heaterGroup.add(heaterBody)
    for(const y of [heaterY-heaterH/2+.025,heaterY+heaterH/2-.025]){
      const rim=new THREE.Mesh(new THREE.TorusGeometry(heaterRadius+.006,.012,8,32),new THREE.MeshStandardMaterial({color:'#47433d',roughness:.45,metalness:.38}))
      rim.rotation.x=Math.PI/2;rim.position.set(heaterX,y,upperD*.48);heaterGroup.add(rim)
    }
    for(const [offset,color] of [[-.055,'#2563eb'],[.055,'#dc2626']]){
      const pipeH=Math.max(.12,heaterY-heaterH/2-upperBottomY-.06)
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,pipeH,12),new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.35}))
      pipe.position.set(heaterX+offset,upperBottomY+.05+pipeH/2,upperD*.55);heaterGroup.add(pipe)
    }
    const dripTray=new THREE.Mesh(new THREE.BoxGeometry(heaterBayW-.06,.025,upperD-.07),new THREE.MeshStandardMaterial({color:'#aeb7bd',roughness:.32,metalness:.55}))
    dripTray.position.set(heaterX,upperBottomY+.035,upperD/2);heaterGroup.add(dripTray)
    room.add(heaterGroup)
    itemObjects['water-heater']=heaterGroup

    // Router shelf in the bay immediately west of the heater, with an internal socket on the back panel.
    const westUpperEdge=cabinetX-cabinetW/2
    const routerBayW=cabinetW-heaterBayW
    const routerX=westUpperEdge+routerBayW/2
    const routerShelfY=upperBottomY+.22
    const routerShelf=new THREE.Mesh(new THREE.BoxGeometry(routerBayW-.05,.022,upperD-.055),upperCarcassMaterial)
    routerShelf.position.set(routerX,routerShelfY,upperD/2);routerShelf.castShadow=true;room.add(routerShelf)
    tagCarpentry(routerShelf,{name:'Ventilated router shelf',widthMm:Math.round((routerBayW-.05)*1000),heightMm:22,depthMm:Math.round((upperD-.055)*1000),note:'Separate from the water heater by a solid full-height divider'})
    const routerGroup=new THREE.Group()
    const routerBody=new THREE.Mesh(new THREE.BoxGeometry(.24,.05,.18),new THREE.MeshStandardMaterial({color:'#f5f5f4',roughness:.4}))
    routerBody.position.set(routerX,routerShelfY+.036,upperD-.12);routerBody.castShadow=true;routerGroup.add(routerBody)
    for(const offset of [-.09,0,.09]){
      const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.13,10),new THREE.MeshStandardMaterial({color:'#24272b',roughness:.5}))
      antenna.position.set(routerX+offset,routerShelfY+.115,upperD-.17);antenna.rotation.z=offset===0?0:Math.sign(offset)*.18;routerGroup.add(antenna)
    }
    const socketPlate=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.012),new THREE.MeshStandardMaterial({color:'#fafafa',roughness:.45}))
    socketPlate.position.set(routerX,routerShelfY+.13,.028);routerGroup.add(socketPlate)
    room.add(routerGroup)
    itemObjects.router=routerGroup

    // West sit-stand workstation running continuously to the south wall.
    const adjustable=office.worktop.westAdjustable
    const deskDepth=mm(adjustable.depthMm)
    const deskLength=mm(adjustable.widthMm)
    const worktopT=mm(adjustable.topThicknessMm)
    const deskStartZ=lowerD+.05
    const deskCenterZ=deskStartZ+deskLength/2
    const movingDesk=new THREE.Group()
    movingDesk.position.y=mm(adjustable.defaultHeightMm)
    room.add(movingDesk)
    const addMovingBox=({w,h,d,x,y,z,color,roughness=.72,map=null,metalness=0})=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,map,roughness,metalness,side:THREE.DoubleSide,envMapIntensity:.8}))
      mesh.position.set(x,y,z)
      mesh.castShadow=true
      mesh.receiveShadow=true
      movingDesk.add(mesh)
      return mesh
    }
    const desktopMesh=addMovingBox({w:deskDepth,h:worktopT,d:deskLength,x:deskDepth/2,y:-worktopT/2,z:deskCenterZ,color:'#ffffff',map:woodTexture,roughness:.42})
    itemObjects.desktop=desktopMesh
    tagCarpentry(desktopMesh,{name:'Adjustable west tabletop',widthMm:adjustable.widthMm,heightMm:adjustable.topThicknessMm,depthMm:adjustable.depthMm,note:'Custom top running from the north cabinet to the south wall'})

    // FLEXISPOT-style electric frame: fixed feet with telescoping columns and a moving crossbar.
    const frameMaterial=makeMaterial('#252b31',.38)
    const frameHalfSpan=mm(adjustable.frameSpanMm)/2
    const frameLegZ=[deskCenterZ-frameHalfSpan,deskCenterZ+frameHalfSpan]
    const frameLegX=mm(office.worktop.rearCabinet.depthMm)*.62
    const frameColumns=[]
    const frameGroup=new THREE.Group()
    room.add(frameGroup)
    itemObjects['desk-frame']=frameGroup
    for(const z of frameLegZ){
      const foot=new THREE.Mesh(new THREE.BoxGeometry(.56,.045,.075),frameMaterial)
      foot.position.set(frameLegX,.0225,z)
      foot.castShadow=true
      frameGroup.add(foot)
      const column=new THREE.Mesh(new THREE.BoxGeometry(.075,1,.075),frameMaterial)
      column.castShadow=true
      frameGroup.add(column)
      frameColumns.push({mesh:column,z})
    }
    addMovingBox({w:.085,h:.075,d:mm(adjustable.frameSpanMm),x:frameLegX,y:-.105,z:deskCenterZ,color:'#252b31',roughness:.38})

    // A low fixed rear cabinet preserves storage without occupying the moving desk structure.
    const rear=office.worktop.rearCabinet
    const rearD=mm(rear.depthMm)
    const rearLength=mm(rear.widthMm)
    const rearTop=mm(rear.topHeightMm)
    const toe=mm(rear.toeClearanceMm)
    const rearBodyH=rearTop-toe
    const rearCenterZ=deskStartZ+rearLength/2
    const rearCabinetMesh=addBox({w:rearD,h:rearBodyH,d:rearLength,x:rearD/2,y:toe+rearBodyH/2,z:rearCenterZ,color:'#ffffff',map:woodTexture,roughness:.56})
    tagCarpentry(rearCabinetMesh,{name:'West lower cabinet run',widthMm:rear.widthMm,heightMm:rear.topHeightMm,depthMm:rear.depthMm,note:'One-foot-deep cabinet with east-facing access'})
    const rearModules=3
    const moduleD=rearLength/rearModules
    const southBayCenterZ=deskStartZ+moduleD*2.5
    for(let i=0;i<rearModules;i++){
      if(i===1){
        const westFront=addBox({w:.018,h:rearBodyH-.035,d:moduleD-.018,x:rearD+.012,y:toe+rearBodyH/2,z:deskStartZ+i*moduleD+moduleD/2,color:'#ffffff',map:woodTexture,roughness:.47})
        tagCarpentry(westFront,{name:'West cabinet centre front',widthMm:Math.round((moduleD-.018)*1000),heightMm:Math.round((rearBodyH-.035)*1000),depthMm:18,note:'East-facing cabinet front'})
      }
    }
    // Proposed equipment bays: tower at the north end, printer on a pull-out shelf at the south end.
    const towerGroup=new THREE.Group()
    const towerBody=new THREE.Mesh(new THREE.BoxGeometry(.216,.489,.410),new THREE.MeshStandardMaterial({color:'#171b20',roughness:.42,metalness:.18}))
    towerBody.position.set(rearD/2,toe+.489/2,deskStartZ+moduleD/2)
    towerBody.castShadow=true
    towerGroup.add(towerBody)
    const towerMesh=new THREE.Mesh(new THREE.BoxGeometry(.19,.43,.008),new THREE.MeshStandardMaterial({color:'#263744',emissive:'#14202a',emissiveIntensity:.35,roughness:.55}))
    towerMesh.position.set(rearD/2,toe+.489/2,deskStartZ+moduleD/2-.209)
    towerGroup.add(towerMesh)
    room.add(towerGroup)
    itemObjects['pc-tower']=towerGroup

    const printerGroup=new THREE.Group()
    const printerShelf=new THREE.Mesh(new THREE.BoxGeometry(rearD-.025,.025,moduleD-.06),new THREE.MeshStandardMaterial({color:'#75563d',roughness:.5}))
    printerShelf.position.set(rearD/2,toe+.035,southBayCenterZ)
    printerShelf.castShadow=true
    printerGroup.add(printerShelf)
    const printerBody=new THREE.Mesh(new THREE.BoxGeometry(.332,.189,.446),new THREE.MeshStandardMaterial({color:'#e9edf0',roughness:.55}))
    printerBody.position.set(rearD/2,toe+.142,southBayCenterZ)
    printerBody.castShadow=true
    printerGroup.add(printerBody)
    room.add(printerGroup)
    itemObjects.printer=printerGroup
    // West-facing dual-monitor workstation, packed toward the north end.
    const standMaterial=makeMaterial('#242a31',.35)
    const screenMaterial=new THREE.MeshStandardMaterial({color:'#163b56',emissive:'#0d2638',emissiveIntensity:.45,roughness:.18,metalness:.08})
    const addMonitor=({monitor,centerZ,centerY,id})=>{
      const diagonal=monitor.diagonalInches*.0254
      const monitorW=diagonal*(16/Math.sqrt(16*16+9*9))
      const monitorH=diagonal*(9/Math.sqrt(16*16+9*9))
      const monitorGroup=new THREE.Group()
      monitorGroup.position.set(0,centerY,centerZ)
      if(monitor.shape==='curved'){
        const radius=1.15
        const arc=monitorW/radius
        const bezel=new THREE.Mesh(new THREE.CylinderGeometry(radius-.018,radius-.018,monitorH+.035,32,1,false,Math.PI/2-arc/2,arc),standMaterial)
        bezel.position.x=.13-(radius-.018)
        bezel.castShadow=true
        monitorGroup.add(bezel)
        const screen=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,monitorH,32,1,false,Math.PI/2-arc/2+.012,arc-.024),screenMaterial)
        screen.position.x=.151-radius
        monitorGroup.add(screen)
      }else{
        const bezel=new THREE.Mesh(new THREE.BoxGeometry(.032,monitorH+.035,monitorW+.035),standMaterial)
        bezel.position.x=.13
        bezel.castShadow=true
        monitorGroup.add(bezel)
        const screen=new THREE.Mesh(new THREE.BoxGeometry(.008,monitorH,monitorW),screenMaterial)
        screen.position.x=.151
        monitorGroup.add(screen)
      }
      movingDesk.add(monitorGroup)
      itemObjects[id]=monitorGroup
      return {monitorW,monitorH,group:monitorGroup}
    }
    // Shift the complete dual-monitor assembly 6 inches south/left from its earlier position.
    const monitorShift=mm(office.equipment.monitorStand.shiftLeftMm)
    const northStart=lowerD+.035+monitorShift
    const rightMonitor=office.equipment.monitors.find(monitor=>monitor.side==='right')
    const leftMonitor=office.equipment.monitors.find(monitor=>monitor.side==='left')
    const rightDiag=rightMonitor.diagonalInches*.0254
    const rightW=rightDiag*(16/Math.sqrt(337))
    const rightH=rightDiag*(9/Math.sqrt(337))
    const rightCenterZ=northStart+rightW/2
    const leftDiag=leftMonitor.diagonalInches*.0254
    const leftW=leftDiag*(16/Math.sqrt(337))
    const leftH=leftDiag*(9/Math.sqrt(337))
    const leftCenterZ=northStart+rightW+.045+leftW/2
    const screenBottom=.17
    addMonitor({monitor:rightMonitor,centerZ:rightCenterZ,centerY:screenBottom+rightH/2,id:'monitor-lenovo'})
    addMonitor({monitor:leftMonitor,centerZ:leftCenterZ,centerY:screenBottom+leftH/2,id:'monitor-benq'})
    const standZ=(rightCenterZ+leftCenterZ)/2
    const armGroup=new THREE.Group()
    movingDesk.add(armGroup)
    itemObjects['monitor-arm']=armGroup
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.022,.028,.48,18),standMaterial)
    post.position.set(.07,.24,standZ)
    post.castShadow=true
    armGroup.add(post)
    const crossbar=new THREE.Mesh(new THREE.BoxGeometry(.04,.035,leftCenterZ-rightCenterZ+.18),standMaterial)
    crossbar.position.set(.10,.38,standZ)
    crossbar.castShadow=true
    armGroup.add(crossbar)

    const laptopSpec=office.equipment.laptop
    const laptopW=mm(laptopSpec.widthMm)
    const laptopD=mm(laptopSpec.depthMm)
    const laptopZ=Math.min(deskStartZ+deskLength-laptopW/2-.035,leftCenterZ+leftW/2+laptopW/2+.03)
    const laptopGroup=new THREE.Group()
    const laptopMaterial=makeMaterial('#353b43',.36)
    const laptopBase=new THREE.Mesh(new THREE.BoxGeometry(laptopD,.014,laptopW),laptopMaterial)
    laptopBase.position.set(deskDepth-laptopD/2-.055,.012,laptopZ)
    laptopBase.castShadow=true
    laptopGroup.add(laptopBase)
    const laptopScreen=new THREE.Mesh(new THREE.BoxGeometry(.014,.215,laptopW),laptopMaterial)
    laptopScreen.position.set(deskDepth-laptopD+.005,.122,laptopZ)
    laptopScreen.rotation.z=THREE.MathUtils.degToRad(-8)
    laptopScreen.castShadow=true
    laptopGroup.add(laptopScreen)
    const laptopDisplay=new THREE.Mesh(new THREE.BoxGeometry(.008,.195,laptopW-.018),screenMaterial)
    laptopDisplay.position.set(deskDepth-laptopD+.014,.122,laptopZ)
    laptopDisplay.rotation.z=THREE.MathUtils.degToRad(-8)
    laptopGroup.add(laptopDisplay)
    movingDesk.add(laptopGroup)
    itemObjects.laptop=laptopGroup

    // Licensed human reference model, normalized to exactly 5 ft 7 in / 1702 mm tall.
    const human=new THREE.Group()
    const humanH=mm(office.referenceFigure.heightMm)
    human.position.set(W*.78,0,standZ+.12)
    human.visible=showHuman
    room.add(human)
    const personLoader=new GLTFLoader()
    personLoader.load('/models/RiggedFigure.glb',gltf=>{
      const model=gltf.scene
      model.rotation.y=-Math.PI/2
      let bounds=new THREE.Box3().setFromObject(model)
      const naturalHeight=bounds.max.y-bounds.min.y
      model.scale.setScalar(humanH/naturalHeight)
      bounds=new THREE.Box3().setFromObject(model)
      const center=bounds.getCenter(new THREE.Vector3())
      model.position.set(-center.x,-bounds.min.y,-center.z)
      model.traverse(object=>{
        if(object.isMesh){object.castShadow=true;object.receiveShadow=true}
      })
      human.add(model)
      setPersonAssetStatus('ready')
    },undefined,()=>setPersonAssetStatus('error'))

    // Cabinet reveals communicate the proposed three-foot width and stepped depth.
    for(const x of [cabinetX-cabinetW/2,cabinetX+cabinetW/2]){
      addBox({w:.012,h:Math.min(lowerH,H-upperH),d:lowerD+.012,x,y:Math.min(lowerH,H-upperH)/2,z:lowerD/2,color:'#6f5134'})
    }

    scene.add(new THREE.HemisphereLight(0xffffff,0x53606c,1.05))
    const sun=new THREE.DirectionalLight(0xfff4e8,2.45)
    sun.position.set(-3,5,4)
    sun.castShadow=true
    sun.shadow.mapSize.set(2048,2048)
    sun.shadow.camera.left=-4
    sun.shadow.camera.right=4
    sun.shadow.camera.top=5
    sun.shadow.camera.bottom=-3
    sun.shadow.camera.near=.1
    sun.shadow.camera.far=14
    sun.shadow.bias=-.00035
    scene.add(sun)
    const southDaylight=new THREE.RectAreaLight(0xc8efff,3.2,W,windowH)
    southDaylight.position.set(W/2,parapet+windowH/2,L-.08)
    southDaylight.lookAt(W/2,parapet+windowH/2,L/2)
    scene.add(southDaylight)
    const westDaylight=new THREE.RectAreaLight(0xd8f3ff,2.4,L,windowH)
    westDaylight.position.set(.08,parapet+windowH/2,L/2)
    westDaylight.lookAt(W/2,parapet+windowH/2,L/2)
    scene.add(westDaylight)

    const setCamera=view=>{
      const target=new THREE.Vector3(W/2,H*.46,L/2)
      if(view==='north') camera.position.set(W/2,H*.52,L+2.9)
      else if(view==='top') camera.position.set(W/2,6,L/2+.001)
      else camera.position.set(W+2.7,3.1,L+2.6)
      controls.target.copy(target)
      camera.lookAt(target)
      controls.update()
    }
    const setDeskHeight=height=>{
      const safeHeight=THREE.MathUtils.clamp(height,mm(adjustable.minHeightMm),mm(adjustable.maxHeightMm))
      movingDesk.position.y=safeHeight
      for(const {mesh,z} of frameColumns){
        const columnH=Math.max(.38,safeHeight-.075)
        mesh.scale.y=columnH
        mesh.position.set(frameLegX,.045+columnH/2,z)
      }
    }
    const setQuality=enabled=>{
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,enabled?2.5:1.25))
      renderer.shadowMap.enabled=enabled
      renderer.toneMappingExposure=enabled?1.08:1
      sun.shadow.mapSize.set(enabled?2048:1024,enabled?2048:1024)
      sun.shadow.map?.dispose?.()
      renderer.setSize(mount.clientWidth,mount.clientHeight,false)
    }
    let selectionHelper=null
    const clearSelection=()=>{
      if(!selectionHelper) return
      scene.remove(selectionHelper);selectionHelper.geometry?.dispose?.();selectionHelper.material?.dispose?.();selectionHelper=null
    }
    const highlightObject=(object,color=0xff7a18)=>{
      clearSelection()
      const bounds=new THREE.Box3().setFromObject(object)
      if(bounds.isEmpty()) return null
      selectionHelper=new THREE.Box3Helper(bounds,color)
      selectionHelper.material.depthTest=false
      selectionHelper.renderOrder=999
      scene.add(selectionHelper)
      return bounds
    }
    const focusItem=id=>{
      const object=itemObjects[id]
      if(!object) return
      const bounds=highlightObject(object)
      if(!bounds) return
      const center=bounds.getCenter(new THREE.Vector3())
      const size=bounds.getSize(new THREE.Vector3())
      const distance=Math.max(.8,Math.max(size.x,size.y,size.z)*2.6)
      controls.target.copy(center)
      camera.position.set(center.x+distance,center.y+distance*.65,center.z+distance)
      camera.lookAt(center)
      controls.update()
    }
    const captureScreenshot=()=>{
      renderer.render(scene,camera)
      return new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(new Error('Unable to capture the 3D view.')),'image/png'))
    }
    setCamera(preset)
    setDeskHeight(mm(adjustable.defaultHeightMm))
    setQuality(highQuality)
    sceneRef.current={setCamera,setDeskHeight,setQuality,focusItem,captureScreenshot,clearSelection,setHumanVisible:visible=>{human.visible=visible},setDirectionsVisible:visible=>{directionGroup.visible=visible}}

    const raycaster=new THREE.Raycaster()
    const pointer=new THREE.Vector2()
    let pointerStart=null
    const onPointerDown=event=>{pointerStart={x:event.clientX,y:event.clientY}}
    const onPointerUp=event=>{
      if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6){pointerStart=null;return}
      pointerStart=null
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)
      raycaster.setFromCamera(pointer,camera)
      const hit=raycaster.intersectObjects(room.children,true).find(intersection=>{
        let object=intersection.object
        while(object&&object!==room){if(object.userData.carpentryItem)return true;object=object.parent}
        return false
      })
      if(!hit) return
      let object=hit.object
      while(object&&object!==room&&!object.userData.carpentryItem)object=object.parent
      if(!object?.userData.carpentryItem) return
      setSelectedCarpentryItem(object.userData.carpentryItem)
      highlightObject(object,0x6d28d9)
    }
    renderer.domElement.addEventListener('pointerdown',onPointerDown)
    renderer.domElement.addEventListener('pointerup',onPointerUp)

    const resize=()=>{
      const width=mount.clientWidth
      const height=mount.clientHeight
      renderer.setSize(width,height,false)
      camera.aspect=width/height
      camera.updateProjectionMatrix()
    }
    const observer=new ResizeObserver(resize)
    observer.observe(mount)
    resize()
    let frame
    const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
    animate()
    return ()=>{
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown',onPointerDown)
      renderer.domElement.removeEventListener('pointerup',onPointerUp)
      selectionHelper?.geometry?.dispose?.()
      selectionHelper?.material?.dispose?.()
      room.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material?.dispose?.()})
      woodTexture.dispose()
      marbleTexture.dispose()
      directionTextures.forEach(texture=>texture.dispose())
      glassMaterial.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      sceneRef.current=null
    }
  },[])

  useEffect(()=>{sceneRef.current?.setCamera(preset)},[preset])
  useEffect(()=>{sceneRef.current?.setHumanVisible(showHuman)},[showHuman])
  useEffect(()=>{sceneRef.current?.setDeskHeight(deskHeightIn*25.4/1000)},[deskHeightIn])
  useEffect(()=>{sceneRef.current?.setQuality(highQuality)},[highQuality])
  useEffect(()=>{sceneRef.current?.setDirectionsVisible(showDirections)},[showDirections])
  useEffect(()=>{
    const updateFullscreen=()=>setIsFullscreen(document.fullscreenElement===sectionRef.current)
    document.addEventListener('fullscreenchange',updateFullscreen)
    return ()=>document.removeEventListener('fullscreenchange',updateFullscreen)
  },[])

  const toggleFullscreen=async()=>{
    if(document.fullscreenElement) await document.exitFullscreen()
    else await sectionRef.current?.requestFullscreen?.()
  }

  const copyScreenshot=async()=>{
    setScreenshotStatus('copying')
    try{
      if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined') throw new Error('Clipboard image copying is unavailable.')
      const blob=await sceneRef.current?.captureScreenshot()
      if(!blob) throw new Error('The 3D view is not ready.')
      await navigator.clipboard.write([new ClipboardItem({'image/png':blob})])
      setScreenshotStatus('copied')
      window.setTimeout(()=>setScreenshotStatus('idle'),1800)
    }catch(error){
      console.error(error)
      setScreenshotStatus('error')
      window.setTimeout(()=>setScreenshotStatus('idle'),2400)
    }
  }

  const exportCarpenterPdf=async()=>{
    const {jsPDF}=await import('jspdf')
    // Build the export snapshot at click time from the same configuration and live controls used by the renderer.
    const office={...BALCONY_OFFICE,worktop:{...BALCONY_OFFICE.worktop,westAdjustable:{...BALCONY_OFFICE.worktop.westAdjustable,currentHeightMm:Math.round(deskHeightIn*25.4)}}}
    const formatDim=value=>dimensionUnit==='ft-in'?feetInches(value):`${Math.round(value)} mm`
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'})
    const pageW=297
    const pageH=210
    const title=text=>{pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.text(text,14,14);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.text(`Generated from current design | Units: ${dimensionUnit==='ft-in'?'feet and inches':'millimetres'} | Desk height: ${formatDim(deskHeightIn*25.4)}`,14,20)}
    const note=(text,x,y,max=92)=>{pdf.setFontSize(7.5);pdf.text(text,x,y,{maxWidth:max})}
    const dim=(x1,y1,x2,y2,label,offset=4)=>{
      pdf.setDrawColor(75);pdf.setLineWidth(.2);pdf.line(x1,y1,x2,y2)
      if(Math.abs(x2-x1)>=Math.abs(y2-y1)){pdf.line(x1,y1-2,x1,y1+2);pdf.line(x2,y2-2,x2,y2+2);pdf.text(label,(x1+x2)/2,y1-offset,{align:'center'})}
      else{pdf.line(x1-2,y1,x1+2,y1);pdf.line(x2-2,y2,x2+2,y2);pdf.text(label,x1-offset,(y1+y2)/2,{angle:90,align:'center'})}
    }

    title('Balcony Office - Dimensioned Plan')
    const planScale=.055
    const ox=30,oy=32
    const roomW=office.dimensions.widthMm*planScale
    const roomL=office.dimensions.lengthMm*planScale
    pdf.setLineWidth(.45);pdf.rect(ox,oy,roomW,roomL)
    pdf.setFontSize(7);pdf.text('NORTH',ox+roomW/2,oy-4,{align:'center'});pdf.text('SOUTH',ox+roomW/2,oy+roomL+8,{align:'center'});pdf.text('WEST',ox-5,oy+roomL/2,{angle:90,align:'center'});pdf.text('EAST',ox+roomW+5,oy+roomL/2,{angle:90,align:'center'})
    const north=office.cabinetry.northWall
    const northW=north.lower.widthMm*planScale
    pdf.setFillColor(205,174,135);pdf.rect(ox+roomW-northW,oy,northW,north.upper.depthMm*planScale,'FD')
    const desk=office.worktop.westAdjustable
    const deskStart=north.lower.depthMm+50
    pdf.setFillColor(112,78,54);pdf.rect(ox,oy+deskStart*planScale,desk.depthMm*planScale,desk.widthMm*planScale,'FD')
    const rear=office.worktop.rearCabinet
    pdf.setFillColor(220,198,165);pdf.rect(ox,oy+deskStart*planScale,rear.depthMm*planScale,rear.widthMm*planScale,'FD')
    dim(ox,oy-7,ox+roomW,oy-7,formatDim(office.dimensions.widthMm),4)
    dim(ox-8,oy,ox-8,oy+roomL,formatDim(office.dimensions.lengthMm),4)
    dim(ox,oy+deskStart*planScale-4,ox+desk.depthMm*planScale,oy+deskStart*planScale-4,`Desk depth ${formatDim(desk.depthMm)}`,2)
    dim(ox+desk.depthMm*planScale+5,oy+deskStart*planScale,ox+desk.depthMm*planScale+5,oy+(deskStart+desk.widthMm)*planScale,`Desk width ${formatDim(desk.widthMm)}`,3)
    note('Plan legend',125,34);note(`Brown: adjustable west desktop\nTan: fixed west-side cabinet\nNorth cabinet: ${formatDim(north.lower.widthMm)} wide\nDesktop continues to south wall\nSouth wall: no counter or cabinet\nWest cabinet: ${formatDim(rear.depthMm)} deep x ${formatDim(rear.widthMm)} long\nEast-facing access\nOpen floor depth: ${formatDim(desk.depthMm-rear.depthMm)}`,125,40,70)
    note(`Important: the ${formatDim(desk.widthMm)} custom desktop exceeds the FLEXISPOT stated ${formatDim(desk.supportedTopWidthMm[1])} supported-top limit. Confirm stiffness, fixing pattern, load distribution and warranty with the frame supplier before fabrication.`,125,78,120)
    note('Site verification: carpenter must verify room, wall squareness, window/parapet, power points and all clearances before cutting.',125,101,120)

    pdf.addPage('a4','landscape')
    title('North Wall Elevation and Cabinet Schedule')
    const elevScale=.06
    const ex=25,baseY=188
    const elevW=office.dimensions.widthMm*elevScale
    const elevH=office.dimensions.floorToCeilingMm*elevScale
    pdf.rect(ex,baseY-elevH,elevW,elevH)
    const cabW=north.lower.widthMm*elevScale
    const cabX=ex+elevW-cabW
    pdf.setFillColor(199,164,119);pdf.rect(cabX,baseY-north.lower.heightMm*elevScale,cabW,north.lower.heightMm*elevScale,'FD')
    pdf.setFillColor(154,116,76);pdf.rect(cabX,baseY-elevH,cabW,north.upper.heightMm*elevScale,'FD')
    const serviceDividerX=cabX+cabW-north.upper.heaterBayWidthMm*elevScale
    pdf.line(serviceDividerX,baseY-elevH,serviceDividerX,baseY-elevH+north.upper.heightMm*elevScale)
    const splitY=baseY-north.doors.lower.splitHeightMm*elevScale
    pdf.line(cabX,splitY,cabX+cabW,splitY);pdf.line(cabX+cabW/2,baseY-north.lower.heightMm*elevScale,cabX+cabW/2,baseY)
    dim(ex,baseY+7,ex+elevW,baseY+7,formatDim(office.dimensions.widthMm),4)
    dim(ex-8,baseY-elevH,ex-8,baseY,formatDim(office.dimensions.floorToCeilingMm),4)
    dim(cabX,baseY-north.lower.heightMm*elevScale-5,cabX+cabW,baseY-north.lower.heightMm*elevScale-5,`Cabinet ${formatDim(north.lower.widthMm)}`,2)
    note(`NORTH CABINET\nUpper: ${formatDim(north.upper.heightMm)} H x ${formatDim(north.upper.depthMm)} D; removable ventilated access.\nEast heater bay: ${formatDim(north.upper.heaterBayWidthMm)} W; verify tank, pipes, clearances and service access on site.\nAdjacent router bay: ${formatDim(north.upper.routerBayWidthMm)} W; internal socket, ventilated shelf and solid divider.\nLower: ${formatDim(north.lower.heightMm)} H x ${formatDim(north.lower.widthMm)} W x ${formatDim(north.lower.depthMm)} D.\nSplit at ${formatDim(north.doors.lower.splitHeightMm)} above floor.\nFull-width two-panel bypass sliders below and above.`,125,38,145)
    note('All cabinet dimensions are nominal carcass dimensions. Carpenter to allow for shutters, tracks, edge bands, scribes, wall irregularity and installation tolerances.',125,82,145)

    pdf.addPage('a4','landscape')
    title('West Elevation - Adjustable Desk and Window')
    const wx=18,wBase=188
    const westScale=.062
    const westL=office.dimensions.lengthMm*westScale
    const westH=office.dimensions.floorToCeilingMm*westScale
    pdf.rect(wx,wBase-westH,westL,westH)
    const parapet=office.envelope.lowerBrickParapetMm*westScale
    const windowBand=office.envelope.windowBandMm*westScale
    pdf.setFillColor(184,120,90);pdf.rect(wx,wBase-parapet,westL,parapet,'F')
    pdf.setFillColor(180,226,242);pdf.rect(wx,wBase-parapet-windowBand,westL,windowBand,'F')
    pdf.setFillColor(184,120,90);pdf.rect(wx,wBase-westH,westL,office.envelope.upperBrickBandMm*westScale,'F')
    const deskX=wx+deskStart*westScale
    const deskY=wBase-deskHeightIn*25.4*westScale
    pdf.setFillColor(112,78,54);pdf.rect(deskX,deskY,desk.widthMm*westScale,Math.max(1.5,desk.topThicknessMm*westScale),'F')
    const rearTop=wBase-rear.topHeightMm*westScale
    pdf.setFillColor(220,198,165);pdf.rect(deskX,rearTop,rear.widthMm*westScale,rear.topHeightMm*westScale,'F')
    dim(wx,wBase+7,wx+westL,wBase+7,formatDim(office.dimensions.lengthMm),4)
    dim(wx-7,wBase-westH,wx-7,wBase,formatDim(office.dimensions.floorToCeilingMm),4)
    note(`WEST WORKSTATION\nDesktop: ${formatDim(desk.widthMm)} W x ${formatDim(desk.depthMm)} D x ${formatDim(desk.topThicknessMm)} T.\nCurrent exported height: ${formatDim(deskHeightIn*25.4)}.\nAdjustment range: ${formatDim(desk.minHeightMm)} to ${formatDim(desk.maxHeightMm)}.\nFrame span: ${formatDim(desk.frameSpanMm)}.\nEnd overhang: ${formatDim(desk.endOverhangMm)} each.\nDesktop runs from the north cabinet to the south wall.\nWest cabinet: ${formatDim(rear.widthMm)} L x ${formatDim(rear.depthMm)} D x ${formatDim(rear.topHeightMm)} H; east-facing access.\nClear floor depth: ${formatDim(desk.depthMm-rear.depthMm)}.\nNo south-wall counter or cabinet.`,205,36,78)
    note(`ENVELOPE\nBrick parapet: ${formatDim(office.envelope.lowerBrickParapetMm)}\nWindow band: ${formatDim(office.envelope.windowBandMm)}\nTop brick band: ${formatDim(office.envelope.upperBrickBandMm)}\nTotal: ${formatDim(office.dimensions.floorToCeilingMm)}`,205,99,78)
    note('Provide flexible cable loops and confirm that no fixed cabinet, cable or shutter enters the desk lifting path.',205,137,78)

    pdf.addPage('a4','landscape')
    title('Carpenter Fabrication Schedule')
    const cabinetRows=[
      ['North upper cabinet','1',north.lower.widthMm,north.upper.heightMm,north.upper.depthMm,'Ventilated removable access; divided heater and router service bays'],
      ['Water-heater bay','1',north.upper.heaterBayWidthMm,north.upper.heightMm,north.upper.depthMm,'Existing heater; drip tray; verify manufacturer clearance, plumbing and service access'],
      ['Router shelf','1',north.upper.routerBayWidthMm-50,22,north.upper.depthMm-55,'Internal socket; ventilated; solid divider from heater bay'],
      ['North lower cabinet','1',north.lower.widthMm,north.lower.heightMm,north.lower.depthMm,`Full-width bypass sliders above and below ${formatDim(north.doors.lower.splitHeightMm)} split; no filler`],
      ['West adjustable tabletop','1',desk.widthMm,desk.topThicknessMm,desk.depthMm,`Custom top; current height ${formatDim(desk.currentHeightMm)}; FLEXISPOT frame span ${formatDim(desk.frameSpanMm)}`],
      ['West lower cabinet run','1',rear.widthMm,rear.topHeightMm,rear.depthMm,`Uniform one-foot depth to south end; east-facing access; toe clearance ${formatDim(rear.toeClearanceMm)}`],
      ['PC tower bay','1',rear.nominalBayWidthMm,rear.topHeightMm-rear.toeClearanceMm,rear.depthMm,'North bay; open/perforated front and rear; cable cut-out required'],
      ['Printer pull-out shelf','1',rear.printerShelf.widthMm,rear.printerShelf.thicknessMm,rear.printerShelf.depthMm,'South bay of the one-foot-deep run; runners extend east toward seated user'],
    ]
    const colX=[14,69,82,112,142,172]
    const colW=[52,10,27,27,27,108]
    const headers=['Fabricated item','Qty','Width','Height / T','Depth','Construction notes']
    pdf.setFont('helvetica','bold');pdf.setFontSize(7.5)
    headers.forEach((header,index)=>pdf.text(header,colX[index],31,{maxWidth:colW[index]}))
    pdf.line(14,35,pageW-14,35)
    pdf.setFont('helvetica','normal');pdf.setFontSize(7)
    let scheduleY=41
    for(const [name,qty,width,height,depth,notes] of cabinetRows){
      const values=[name,qty,formatDim(width),formatDim(height),formatDim(depth),notes]
      values.forEach((value,index)=>pdf.text(String(value),colX[index],scheduleY,{maxWidth:colW[index]}))
      scheduleY+=16
      pdf.setDrawColor(220);pdf.line(14,scheduleY-5,pageW-14,scheduleY-5)
    }
    note('Dimensions are overall design dimensions, not a finished cut list. Carpenter must deduct material thicknesses, hardware clearances, edge bands, slider tracks, reveals and site scribes when producing individual panels.',14,pageH-15,pageW-28)

    pdf.addPage('a4','landscape')
    title('Equipment Inventory')
    pdf.setFont('helvetica','bold');pdf.setFontSize(8)
    pdf.text('Item',14,31);pdf.text('Make / model',52,31);pdf.text('Dimensions',139,31);pdf.text('Design status',216,31)
    pdf.setLineWidth(.2);pdf.line(14,34,pageW-14,34)
    pdf.setFont('helvetica','normal');pdf.setFontSize(7.5)
    let inventoryY=41
    for(const item of office.equipment.inventory){
      pdf.text(item.category,14,inventoryY,{maxWidth:34})
      pdf.text(`${item.make} ${item.model}`,52,inventoryY,{maxWidth:82})
      pdf.text(item.dimensions,139,inventoryY,{maxWidth:72})
      pdf.text(item.status,216,inventoryY,{maxWidth:66})
      inventoryY+=18
      pdf.setDrawColor(220);pdf.line(14,inventoryY-6,pageW-14,inventoryY-6)
    }
    note('This inventory is generated from the current project configuration. Verify exact purchased models, loaded weights, cable locations and ventilation requirements before fabrication.',14,pageH-14,pageW-28)

    pdf.save(`balcony-office-carpenter-${Math.round(deskHeightIn)}in.pdf`)
  }

  const formatCarpentryDimension=value=>dimensionUnit==='ft-in'?feetInches(value):`${Math.round(value)} mm`

  return <section ref={sectionRef} style={{background:'#fff',border:'1px solid #ded8ea',borderRadius:isFullscreen?0:22,overflow:'hidden',marginTop:isFullscreen?0:22,boxShadow:isFullscreen?'none':'0 14px 38px rgba(35,25,66,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e8e3ef'}}>
      <div><b style={{fontSize:17,color:'#231942'}}>Interactive 3D view</b><div style={{fontSize:12,color:'#70677f',marginTop:3}}>Click carpentry for dimensions · drag to orbit · scroll to zoom · right-drag to pan{personAssetStatus==='loading'?' · loading person…':''}{personAssetStatus==='error'?' · person model unavailable':''}</div></div>
      <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
        {[['overview','Overview'],['north','North cabinet'],['top','Top']].map(([key,label])=><button key={key} onClick={()=>setPreset(key)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:preset===key?'#231942':'#fff',color:preset===key?'#fff':'#231942',fontWeight:800,cursor:'pointer'}}>{label}</button>)}
        <button onClick={()=>setHighQuality(value=>!value)} title="Toggle GPU-intensive lighting, reflections and shadows" style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:highQuality?'#dcfce7':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{highQuality?'High quality':'Performance'}</button>
        <button onClick={()=>setShowItems(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showItems?'#fef3c7':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>Items ({BALCONY_OFFICE.equipment.inventory.length})</button>
        <button onClick={()=>setShowDirections(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showDirections?'#ede9fe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showDirections?'Hide directions':'Show directions'}</button>
        <button onClick={()=>setShowHuman(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showHuman?'#e0f2fe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showHuman?'Hide person':'Show person'}</button>
        <button onClick={copyScreenshot} disabled={screenshotStatus==='copying'} aria-live="polite" title="Copy the current 3D view as a PNG" style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:screenshotStatus==='copied'?'#dcfce7':screenshotStatus==='error'?'#fee2e2':'#fff',color:'#231942',fontWeight:800,cursor:screenshotStatus==='copying'?'wait':'pointer'}}>{screenshotStatus==='copying'?'Copying…':screenshotStatus==='copied'?'Copied!':screenshotStatus==='error'?'Copy failed':'Copy screenshot'}</button>
        <button onClick={exportCarpenterPdf} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #6d28d9',background:'#6d28d9',color:'#fff',fontWeight:800,cursor:'pointer'}}>Carpenter PDF</button>
        <button onClick={toggleFullscreen} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:isFullscreen?'#e0f2fe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{isFullscreen?'Exit full screen':'Full screen'}</button>
      </div>
    </div>
    <div style={{padding:'10px 16px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',borderBottom:'1px solid #e8e3ef',background:'#faf8fc'}}>
      <b style={{fontSize:13,color:'#231942'}}>West desk: {dimensionUnit==='ft-in'?feetInches(deskHeightIn*25.4):`${Math.round(deskHeightIn*25.4)} mm`}</b>
      <input aria-label="Adjust west desk height" type="range" min="29" max="47.6" step="0.5" value={deskHeightIn} onChange={event=>setDeskHeightIn(Number(event.target.value))} style={{flex:'1 1 180px',accentColor:'#6d28d9'}}/>
      {[29,33,39,41].map(height=><button key={height} onClick={()=>setDeskHeightIn(height)} style={{padding:'6px 9px',borderRadius:8,border:'1px solid #cfc6dc',background:deskHeightIn===height?'#6d28d9':'#fff',color:deskHeightIn===height?'#fff':'#231942',fontWeight:800,cursor:'pointer'}}>{height}&quot;</button>)}
      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:800,color:'#231942'}}>Units
        <select value={dimensionUnit} onChange={event=>setDimensionUnit(event.target.value)} style={{padding:'6px 8px',borderRadius:8,border:'1px solid #cfc6dc',background:'#fff',color:'#231942',fontWeight:700}}>
          <option value="mm">Millimetres</option>
          <option value="ft-in">Feet &amp; inches</option>
        </select>
      </label>
    </div>
    <div style={{position:'relative'}}>
      <div ref={mountRef} style={{height:isFullscreen?'calc(100vh - 116px)':'min(68vh,650px)',minHeight:430,width:'100%'}}/>
      {selectedCarpentryItem&&<aside aria-live="polite" style={{position:'absolute',zIndex:6,left:12,top:12,width:'min(300px,calc(100% - 24px))',background:'rgba(255,255,255,.96)',border:'2px solid #6d28d9',borderRadius:13,padding:'11px 12px',boxShadow:'0 12px 30px rgba(20,15,35,.22)',color:'#231942'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8}}><b style={{fontSize:14}}>{selectedCarpentryItem.name}</b><button onClick={()=>{setSelectedCarpentryItem(null);sceneRef.current?.clearSelection()}} aria-label="Close dimensions" style={{border:0,background:'transparent',fontSize:18,lineHeight:1,cursor:'pointer',color:'#231942'}}>×</button></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:9}}>{[['W',selectedCarpentryItem.widthMm],['H / T',selectedCarpentryItem.heightMm],['D',selectedCarpentryItem.depthMm]].map(([label,value])=><div key={label} style={{padding:'7px 5px',borderRadius:8,background:'#f3e8ff',textAlign:'center'}}><span style={{display:'block',fontSize:9,fontWeight:900,color:'#6d28d9'}}>{label}</span><b style={{display:'block',fontSize:11,marginTop:2}}>{formatCarpentryDimension(value)}</b></div>)}</div>
        <div style={{fontSize:11,color:'#665d73',marginTop:8,lineHeight:1.35}}>{selectedCarpentryItem.note}</div>
      </aside>}
      {showItems&&<aside style={{position:'absolute',zIndex:5,right:12,top:12,width:'min(360px,calc(100% - 24px))',maxHeight:'calc(100% - 24px)',overflowY:'auto',background:'rgba(255,255,255,.96)',border:'1px solid #d8d0e2',borderRadius:14,padding:12,boxShadow:'0 12px 30px rgba(20,15,35,.22)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:8}}><b style={{color:'#231942'}}>Items and placement</b><button onClick={()=>setShowItems(false)} aria-label="Close items" style={{border:0,background:'transparent',fontSize:18,cursor:'pointer'}}>×</button></div>
        <div style={{display:'grid',gap:7}}>{BALCONY_OFFICE.equipment.inventory.map(item=><button key={item.id} onClick={()=>{setSelectedItem(item.id);sceneRef.current?.focusItem(item.id)}} style={{textAlign:'left',padding:'9px 10px',borderRadius:10,border:selectedItem===item.id?'2px solid #f97316':'1px solid #ddd5e6',background:selectedItem===item.id?'#fff7ed':'#fff',cursor:'pointer',color:'#231942'}}><b style={{display:'block',fontSize:12}}>{item.category}: {item.make} {item.model}</b><span style={{display:'block',fontSize:11,color:'#6f657d',marginTop:3}}>{item.location}</span></button>)}</div>
      </aside>}
      {showDirections&&<div aria-label="Compass directions" style={{position:'absolute',zIndex:4,right:12,bottom:12,display:'grid',gridTemplateColumns:'repeat(3,28px)',gridTemplateRows:'repeat(3,24px)',placeItems:'center',padding:'7px 9px',borderRadius:10,background:'rgba(255,255,255,.9)',border:'1px solid rgba(35,25,66,.3)',boxShadow:'0 5px 16px rgba(20,15,35,.16)',color:'#231942',fontSize:10,fontWeight:900}}>
        {['NW','N','NE','W','•','E','SW','S','SE'].map(direction=><span key={direction}>{direction}</span>)}
      </div>}
      <div style={{position:'absolute',left:12,bottom:12,background:'rgba(17,24,39,.82)',color:'#fff',padding:'8px 10px',borderRadius:10,fontSize:11,lineHeight:1.45}}>West: 30 in sit–stand desk to south wall<br/>South wall: no counter or cabinet<br/>Reference person: 5 ft 7 in, facing monitors</div>
    </div>
  </section>
}
