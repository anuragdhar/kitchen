import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {BALCONY_OFFICE,BALCONY_DESK_HEIGHT_KEY} from './config/balconyOfficeConfig.js'

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
  const [deskHeightIn,setDeskHeightIn]=useState(()=>{
    const saved=Number(localStorage.getItem(BALCONY_DESK_HEIGHT_KEY))
    return Number.isFinite(saved)&&saved>=BALCONY_OFFICE.worktop.westAdjustable.minHeightMm&&saved<=BALCONY_OFFICE.worktop.westAdjustable.maxHeightMm
      ? saved/25.4 : Math.round(BALCONY_OFFICE.worktop.westAdjustable.defaultHeightMm/25.4)
  })
  useEffect(()=>{localStorage.setItem(BALCONY_DESK_HEIGHT_KEY,String(Math.round(deskHeightIn*25.4)))},[deskHeightIn])
  const [isFullscreen,setIsFullscreen]=useState(false)
  const [dimensionUnit,setDimensionUnit]=useState('ft-in')
  const [showItems,setShowItems]=useState(false)
  const [selectedItem,setSelectedItem]=useState(null)
  const [highQuality,setHighQuality]=useState(true)
  const [screenshotStatus,setScreenshotStatus]=useState('idle')
  const [showDirections,setShowDirections]=useState(true)
  const [selectedCarpentryItem,setSelectedCarpentryItem]=useState(null)
  const [allCabinetsOpen,setAllCabinetsOpen]=useState(true)
  const [showSouthWall,setShowSouthWall]=useState(true)
  const [showWestWall,setShowWestWall]=useState(true)
  const [showElectrical,setShowElectrical]=useState(false)
  const [showAiPrompt,setShowAiPrompt]=useState(false)
  const [promptCopyStatus,setPromptCopyStatus]=useState('idle')

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
    const electricalOverlays=[]
    const addElectricalMarker=(parent,label,x,y,z,color='#dc2626')=>{
      const marker=new THREE.Group()
      marker.position.set(x,y,z)
      const pin=new THREE.Mesh(new THREE.SphereGeometry(.028,18,12),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.96}))
      pin.renderOrder=1200;marker.add(pin)
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128
      const context=canvas.getContext('2d')
      context.fillStyle='rgba(255,255,255,.96)';context.beginPath();context.roundRect(4,4,504,120,24);context.fill()
      context.lineWidth=10;context.strokeStyle=color;context.stroke()
      context.fillStyle='#172033';context.font='800 38px Arial';context.textAlign='center';context.textBaseline='middle';context.fillText(label,256,65)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
      const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}))
      tag.position.set(0,.095,0);tag.scale.set(.34,.085,1);tag.renderOrder=1201;marker.add(tag)
      marker.visible=showElectrical;parent.add(marker);electricalOverlays.push({marker,texture})
      return marker
    }
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

    // South/front wall: grouped so it can be removed temporarily for inspection.
    const southWallGroup=new THREE.Group()
    southWallGroup.add(addBox({w:W,h:parapet,d:.08,x:W/2,y:parapet/2,z:L+.04,color:'#ffffff',map:woodTexture,roughness:.58}))
    southWallGroup.add(addBox({w:W,h:windowH,d:.025,x:W/2,y:parapet+windowH/2,z:L,color:'#bdeaff',customMaterial:glassMaterial}))
    southWallGroup.add(addBox({w:W,h:topBand,d:.08,x:W/2,y:H-topBand/2,z:L+.04,color:'#ffffff',map:woodTexture,roughness:.58}))
    southWallGroup.visible=showSouthWall
    room.add(southWallGroup)

    // West wall is on the left in the cabinet-facing view and can also be hidden.
    const westWallGroup=new THREE.Group()
    westWallGroup.add(addBox({w:.08,h:parapet,d:L,x:-.04,y:parapet/2,z:L/2,color:'#ffffff',map:woodTexture,roughness:.58}))
    westWallGroup.add(addBox({w:.025,h:windowH,d:L,x:0,y:parapet+windowH/2,z:L/2,color:'#bdeaff',customMaterial:glassMaterial}))
    westWallGroup.add(addBox({w:.08,h:topBand,d:L,x:-.04,y:H-topBand/2,z:L/2,color:'#ffffff',map:woodTexture,roughness:.58}))
    westWallGroup.visible=showWestWall
    room.add(westWallGroup)

    // A low east-side threshold indicates access from the study without blocking the view.
    addBox({w:.06,h:.08,d:L,x:W+.03,y:.04,z:L/2,color:'#8b8177'})

    const cabinet=office.cabinetry.northWall
    const cabinetW=mm(cabinet.lower.widthMm)
    const lowerH=mm(cabinet.lower.heightMm)
    const lowerD=mm(cabinet.lower.depthMm)
    const upperH=mm(cabinet.upper.heightMm)
    const upperD=mm(cabinet.upper.depthMm)
    const cabinetX=W-cabinetW/2
    const splitY=mm(office.cabinetry.northWall.doors.lower.splitHeightMm)
    const lowerCabinetGroup=new THREE.Group()
    lowerCabinetGroup.position.set(cabinetX,0,0)
    const lowerCarcassMaterial=makeMaterial('#ffffff',.54,woodTexture)
    const addLowerPart=(w,h,d,x,y,z)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lowerCarcassMaterial)
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;lowerCabinetGroup.add(mesh);return mesh
    }
    addLowerPart(cabinetW,.025,lowerD,0,.0125,lowerD/2)
    addLowerPart(cabinetW,.025,lowerD,0,lowerH-.0125,lowerD/2)
    addLowerPart(cabinetW-.05,lowerH-.05,.022,0,lowerH/2,.011)
    addLowerPart(.025,lowerH,lowerD,-cabinetW/2+.0125,lowerH/2,lowerD/2)
    addLowerPart(.025,lowerH,lowerD,cabinetW/2-.0125,lowerH/2,lowerD/2)
    addLowerPart(cabinetW-.025,.022,lowerD-.025,0,splitY,lowerD/2)
    for(const shelfY of [splitY/3,splitY*2/3,splitY+(lowerH-splitY)/2]) addLowerPart(cabinetW-.05,.018,lowerD-.035,0,shelfY,lowerD/2)
    for(const dividerXLocal of [-cabinetW/6,cabinetW/6]) addLowerPart(.018,lowerH-.05,lowerD-.04,dividerXLocal,lowerH/2,lowerD/2)
    const bookMaterialColors=['#854d3f','#315a72','#b8893f','#5d526f','#486b58']
    const shelfBases=[.025,splitY/3+.009,splitY*2/3+.009,splitY+.011,splitY+(lowerH-splitY)/2+.009]
    const displayedBookDepth=Math.min(.18,lowerD-.05)
    for(let row=0;row<shelfBases.length;row++){
      for(let column=0;column<3;column++){
        for(let book=0;book<4;book++){
          const bookH=.235+(book%3)*.008
          const bookMesh=new THREE.Mesh(new THREE.BoxGeometry(.035,bookH,displayedBookDepth),makeMaterial(bookMaterialColors[(row+column+book)%bookMaterialColors.length],.68))
          bookMesh.position.set(-cabinetW/2+.075+column*(cabinetW/3)+book*.041,shelfBases[row]+bookH/2,lowerD-.025-displayedBookDepth/2)
          bookMesh.rotation.z=(book===3?.035:0)
          lowerCabinetGroup.add(bookMesh)
        }
      }
    }
    room.add(lowerCabinetGroup)
    tagCarpentry(lowerCabinetGroup,{name:'North lower book cabinet',widthMm:cabinet.lower.widthMm,heightMm:cabinet.lower.heightMm,depthMm:cabinet.lower.depthMm,note:'Five-inch shallow carcass; three divided columns and adjustable tiers for slim books or files'})
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
    const dividerX=-cabinetW/2+heaterBayW
    addUpperPart(.025,upperH-.05,upperD-.03,dividerX,0,0)
    room.add(upperCabinetGroup)
    tagCarpentry(upperCabinetGroup,{name:'North upper service cabinet',widthMm:cabinet.lower.widthMm,heightMm:cabinet.upper.heightMm,depthMm:cabinet.upper.depthMm,note:'Ventilated northwest heater bay and isolated northeast router bay'})

    const doorMaterial=makeMaterial('#ffffff',.47,woodTexture)

    // Tall lower cabinet: book grid behind bypass sliders above and below the tabletop datum.
    const halfDoor=cabinetW/2-.008
    const sliderH=lowerH-splitY-.025
    addBox({w:cabinetW-.012,h:.025,d:lowerD,x:cabinetX,y:splitY,z:lowerD/2,color:'#72583e',roughness:.55})
    addBox({w:cabinetW-.025,h:.014,d:.035,x:cabinetX,y:splitY+.021,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    addBox({w:cabinetW-.025,h:.014,d:.035,x:cabinetX,y:lowerH-.012,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    const rightSlider=new THREE.Mesh(new THREE.BoxGeometry(halfDoor,sliderH,.018),doorMaterial)
    const rightSliderX=cabinetX+cabinetW/4
    const leftSliderClosedX=cabinetX-cabinetW/4
    rightSlider.position.set(rightSliderX,splitY+.0125+sliderH/2,lowerD+.012)
    rightSlider.castShadow=true
    room.add(rightSlider)
    tagCarpentry(rightSlider,{name:'North upper right sliding panel',widthMm:Math.round(halfDoor*1000),heightMm:Math.round(sliderH*1000),depthMm:18,note:'Bypass sliding front'})
    const leftSlider=new THREE.Mesh(new THREE.BoxGeometry(halfDoor,sliderH,.018),doorMaterial)
    leftSlider.position.set(leftSliderClosedX,splitY+.0125+sliderH/2,lowerD+.034)
    leftSlider.castShadow=true
    room.add(leftSlider)
    tagCarpentry(leftSlider,{name:'North upper left sliding panel',widthMm:Math.round(halfDoor*1000),heightMm:Math.round(sliderH*1000),depthMm:18,note:'Bypass sliding front, shown shifted open'})
    const upperSliderHandle=new THREE.Mesh(new THREE.BoxGeometry(.022,.18,.032),makeMaterial('#20262c',.34,null,.25))
    upperSliderHandle.position.set(halfDoor/2-.045,0,.018);leftSlider.add(upperSliderHandle)
    const northFiller=mm(office.cabinetry.northWall.doors.lower.belowTabletop.cornerFillerMm)
    const lowerSliderW=(cabinetW-northFiller)/2-.008
    const lowerSliderH=splitY-.065
    const lowerRunCenter=cabinetX+northFiller/2
    addBox({w:cabinetW-northFiller-.025,h:.014,d:.035,x:lowerRunCenter,y:.026,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    addBox({w:cabinetW-northFiller-.025,h:.014,d:.035,x:lowerRunCenter,y:splitY-.026,z:lowerD+.027,color:'#20262c',roughness:.34,metalness:.25})
    if(northFiller>0) addBox({w:northFiller,h:splitY-.045,d:.025,x:cabinetX-cabinetW/2+northFiller/2,y:splitY/2,z:lowerD+.02,color:'#b9966d',roughness:.58})
    const lowerRightSlider=new THREE.Mesh(new THREE.BoxGeometry(lowerSliderW,lowerSliderH,.018),doorMaterial)
    const lowerRightSliderX=lowerRunCenter+(cabinetW-northFiller)/4
    const lowerLeftSliderClosedX=lowerRunCenter-(cabinetW-northFiller)/4
    lowerRightSlider.position.set(lowerRightSliderX,.0325+lowerSliderH/2,lowerD+.012)
    lowerRightSlider.castShadow=true
    room.add(lowerRightSlider)
    tagCarpentry(lowerRightSlider,{name:'North lower right sliding panel',widthMm:Math.round(lowerSliderW*1000),heightMm:Math.round(lowerSliderH*1000),depthMm:18,note:'Bypass sliding front'})
    const lowerLeftSlider=new THREE.Mesh(new THREE.BoxGeometry(lowerSliderW,lowerSliderH,.018),doorMaterial)
    lowerLeftSlider.position.set(lowerLeftSliderClosedX,.0325+lowerSliderH/2,lowerD+.034)
    lowerLeftSlider.castShadow=true
    room.add(lowerLeftSlider)
    tagCarpentry(lowerLeftSlider,{name:'North lower left sliding panel',widthMm:Math.round(lowerSliderW*1000),heightMm:Math.round(lowerSliderH*1000),depthMm:18,note:'Bypass sliding front, shown shifted open'})
    const lowerSliderHandle=new THREE.Mesh(new THREE.BoxGeometry(.022,.18,.032),makeMaterial('#20262c',.34,null,.25))
    lowerSliderHandle.position.set(lowerSliderW/2-.045,0,.018);lowerLeftSlider.add(lowerSliderHandle)

    // Upper cabinet: one top-hinged lift-up flap.
    const liftGroup=new THREE.Group()
    liftGroup.position.set(cabinetX,H-.012,upperD+.014)
    const liftPanel=new THREE.Mesh(new THREE.BoxGeometry(cabinetW-.016,upperH-.026,.018),doorMaterial)
    liftPanel.position.y=-(upperH-.026)/2
    liftPanel.castShadow=true
    liftGroup.add(liftPanel)
    tagCarpentry(liftPanel,{name:'North upper lift-up flap',widthMm:Math.round((cabinetW-.016)*1000),heightMm:Math.round((upperH-.026)*1000),depthMm:18,note:'Top-hinged flap shown open 25 degrees'})
    liftGroup.rotation.x=0
    room.add(liftGroup)

    // Existing water heater concealed in the northwest service bay, isolated from the northeast router bay.
    const upperBottomY=H-upperH
    const heaterGroup=new THREE.Group()
    const westUpperEdge=cabinetX-cabinetW/2
    const heaterX=westUpperEdge+heaterBayW/2
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

    // Router shelf in the northeast bay, with an internal socket on the back panel.
    const routerBayW=cabinetW-heaterBayW
    const routerX=W-routerBayW/2
    const routerShelfY=upperBottomY+mm(cabinet.upper.routerShelfHeightAboveBayBottomMm)
    const routerShelf=new THREE.Mesh(new THREE.BoxGeometry(routerBayW-.05,.022,upperD-.055),upperCarcassMaterial)
    routerShelf.position.set(routerX,routerShelfY,upperD/2);routerShelf.castShadow=true;room.add(routerShelf)
    tagCarpentry(routerShelf,{name:'Ventilated router shelf',widthMm:Math.round((routerBayW-.05)*1000),heightMm:22,depthMm:Math.round((upperD-.055)*1000),note:'Separate from the water heater by a solid full-height divider'})
    const routerStorage=cabinet.upper.routerUnderShelfStorage
    const routerStorageH=routerShelfY-upperBottomY-.047
    const routerStorageD=upperD-mm(routerStorage.rearCableChaseMm)-.035
    const routerStorageCenterZ=mm(routerStorage.rearCableChaseMm)+routerStorageD/2
    for(let shelf=0;shelf<routerStorage.shelfCenterHeightsMm.length;shelf++){
      const shelfMesh=new THREE.Mesh(
        new THREE.BoxGeometry(routerBayW-.05,mm(routerStorage.shelfThicknessMm),routerStorageD),
        upperCarcassMaterial
      )
      shelfMesh.position.set(routerX,upperBottomY+.025+mm(routerStorage.shelfCenterHeightsMm[shelf]),routerStorageCenterZ)
      shelfMesh.castShadow=true;shelfMesh.receiveShadow=true;room.add(shelfMesh)
      tagCarpentry(shelfMesh,{name:`Router under-shelf book shelf ${shelf+1}`,widthMm:Math.round((routerBayW-.05)*1000),heightMm:routerStorage.shelfThicknessMm,depthMm:Math.round(routerStorageD*1000),note:`Adjustable horizontal shelf; lower two tiers retain ${routerStorage.minimumBookClearanceMm} mm book clearance and ${routerStorage.rearCableChaseMm} mm clear rear cable chase`})
    }
    const routerGroup=new THREE.Group()
    const routerBody=new THREE.Mesh(new THREE.BoxGeometry(.24,.05,.18),new THREE.MeshStandardMaterial({color:'#f5f5f4',roughness:.4}))
    routerBody.position.set(routerX,routerShelfY+.036,upperD-.12);routerBody.castShadow=true;routerGroup.add(routerBody)
    const antennaMaterial=new THREE.MeshStandardMaterial({color:'#24272b',roughness:.5})
    const antennaSlotGroup=new THREE.Group()
    const routerAntennaSpec=cabinet.upper.routerAntennaPassThrough
    for(const offset of [-.06,0,.06]){
      const slot=new THREE.Mesh(new THREE.BoxGeometry(.006,mm(routerAntennaSpec.slotHeightMm),mm(routerAntennaSpec.slotWidthMm)),new THREE.MeshStandardMaterial({color:'#25282c',roughness:.44}))
      slot.position.set(W+.015,routerShelfY+.08,upperD-.12+offset);antennaSlotGroup.add(slot)
      const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.26,10),antennaMaterial)
      antenna.rotation.z=Math.PI/2;antenna.position.set(W+.01,routerShelfY+.08,upperD-.12+offset);routerGroup.add(antenna)
    }
    room.add(antennaSlotGroup)
    tagCarpentry(antennaSlotGroup,{name:'Router antenna pass-throughs',widthMm:routerAntennaSpec.slotWidthMm,heightMm:routerAntennaSpec.slotHeightMm,depthMm:25,note:'Three rubber-lined slots in the northeast side panel; verify spacing against the selected router'})
    const socketPlate=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.012),new THREE.MeshStandardMaterial({color:'#fafafa',roughness:.45}))
    socketPlate.position.set(routerX,routerShelfY+.13,.028);routerGroup.add(socketPlate)
    room.add(routerGroup)
    itemObjects.router=routerGroup

    // West sit-stand workstation running continuously to the south wall.
    const adjustable=office.worktop.westAdjustable
    const deskDepth=mm(adjustable.depthMm)
    const deskLength=mm(adjustable.widthMm)
    const worktopT=mm(adjustable.topThicknessMm)
    const deskStartZ=L-deskLength
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
    tagCarpentry(desktopMesh,{name:'Adjustable west tabletop',widthMm:adjustable.widthMm,heightMm:adjustable.topThicknessMm,depthMm:adjustable.depthMm,note:'Custom top anchored at the south wall, clear of the shallower north cabinet'})

    // Resolve the monitor position before building the cabinet so its clamp can have a true open shaft.
    const monitorShift=mm(office.equipment.monitorStand.shiftLeftMm)
    const northStart=deskStartZ-.015+monitorShift
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
    const standZ=(rightCenterZ+leftCenterZ)/2

    // FLEXISPOT-style electric frame: fixed feet with telescoping columns and a moving crossbar.
    const frameMaterial=makeMaterial('#252b31',.38)
    const frameHalfSpan=mm(adjustable.frameSpanMm)/2
    const frameCenterZ=deskCenterZ+mm(adjustable.frameOffsetSouthMm)
    const frameLegZ=[frameCenterZ-frameHalfSpan,frameCenterZ+frameHalfSpan]
    const frameLegX=mm(office.worktop.rearCabinet.depthMm)*.62
    const frameColumns=[]
    const frameGroup=new THREE.Group()
    room.add(frameGroup)
    itemObjects['desk-frame']=frameGroup
    for(const z of frameLegZ){
      const foot=new THREE.Mesh(new THREE.BoxGeometry(mm(adjustable.footDepthMm),.045,.075),frameMaterial)
      foot.position.set(frameLegX,.0225,z)
      foot.castShadow=true
      frameGroup.add(foot)
      const column=new THREE.Mesh(new THREE.BoxGeometry(.075,1,.075),frameMaterial)
      column.castShadow=true
      frameGroup.add(column)
      frameColumns.push({mesh:column,z})
    }
    addMovingBox({w:.085,h:.075,d:mm(adjustable.frameSpanMm),x:frameLegX,y:-.105,z:frameCenterZ,color:'#252b31',roughness:.38})

    // A low fixed rear cabinet preserves storage without occupying the moving desk structure.
    const rear=office.worktop.rearCabinet
    const rearD=mm(rear.depthMm)
    const rearLength=mm(rear.widthMm)
    const rearTop=mm(rear.topHeightMm)
    const toe=mm(rear.toeClearanceMm)
    const rearBodyH=rearTop-toe
    const rearModules=3
    const moduleD=rearLength/rearModules
    const centerBayCenterZ=deskStartZ+moduleD*1.5
    const rearCabinetGroup=new THREE.Group()
    rearCabinetGroup.position.set(0,toe,deskStartZ)
    const rearCarcassMaterial=makeMaterial('#ffffff',.56,woodTexture)
    const addRearPart=(w,h,d,x,y,z)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),rearCarcassMaterial)
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;rearCabinetGroup.add(mesh);return mesh
    }
    const clampSlotD=mm(office.equipment.monitorStand.clampClearanceDepthMm)
    const clampSlotStart=moduleD+.02
    const clampSlotEnd=moduleD*2-.02
    const legPocketW=mm(rear.northLegPocketWidthMm)
    const legPocketCenter=frameLegZ[0]-deskStartZ
    const legPocketStart=legPocketCenter-legPocketW/2
    const legPocketEnd=legPocketCenter+legPocketW/2
    const southLegSlotW=mm(rear.legRemovalSlotWidthMm)
    const southLegSlotCenter=frameLegZ[1]-deskStartZ
    const southLegSlotStart=southLegSlotCenter-southLegSlotW/2
    const southLegSlotEnd=southLegSlotCenter+southLegSlotW/2
    const serviceOpeningStart=Math.min(clampSlotStart,legPocketStart)
    const serviceOpeningEnd=Math.max(clampSlotEnd,legPocketEnd)
    // The centre bay has a continuous upper rear chase, allowing the monitor clamp to move south.
    const clampBackLowerH=Math.max(.1,rearBodyH-mm(office.equipment.monitorStand.clampDropMm))
    addRearPart(.02,rearBodyH,clampSlotStart,.01,rearBodyH/2,clampSlotStart/2)
    addRearPart(.02,rearBodyH,rearLength-clampSlotEnd,.01,rearBodyH/2,clampSlotEnd+(rearLength-clampSlotEnd)/2)
    addRearPart(.02,clampBackLowerH,clampSlotEnd-clampSlotStart,.01,clampBackLowerH/2,(clampSlotStart+clampSlotEnd)/2)
    addRearPart(rearD,.025,legPocketStart,rearD/2,.0125,legPocketStart/2)
    addRearPart(rearD,.025,southLegSlotStart-legPocketEnd,rearD/2,.0125,legPocketEnd+(southLegSlotStart-legPocketEnd)/2)
    addRearPart(rearD,.025,rearLength-southLegSlotEnd,rearD/2,.0125,southLegSlotEnd+(rearLength-southLegSlotEnd)/2)
    addRearPart(rearD,.025,serviceOpeningStart,rearD/2,rearBodyH-.0125,serviceOpeningStart/2)
    addRearPart(rearD,.025,southLegSlotStart-serviceOpeningEnd,rearD/2,rearBodyH-.0125,serviceOpeningEnd+(southLegSlotStart-serviceOpeningEnd)/2)
    addRearPart(rearD,.025,rearLength-southLegSlotEnd,rearD/2,rearBodyH-.0125,southLegSlotEnd+(rearLength-southLegSlotEnd)/2)
    // Keep the monitor-clamp chase tied at the front, but leave both desk-leg
    // slots open for their full depth so the assembled frame can slide out.
    addRearPart(.04,.025,clampSlotEnd-clampSlotStart,rearD-.02,rearBodyH-.0125,(clampSlotStart+clampSlotEnd)/2)
    const clampChaseEdge=new THREE.Mesh(new THREE.BoxGeometry(.012,mm(office.equipment.monitorStand.clampDropMm),clampSlotEnd-clampSlotStart),makeMaterial('#31363c',.4,null,.2))
    clampChaseEdge.position.set(clampSlotD,rearBodyH-mm(office.equipment.monitorStand.clampDropMm)/2,(clampSlotStart+clampSlotEnd)/2)
    rearCabinetGroup.add(clampChaseEdge)
    tagCarpentry(clampChaseEdge,{name:'Centre monitor-clamp travel channel',widthMm:rear.centerClampChaseWidthMm,heightMm:rear.centerClampChaseDropMm,depthMm:rear.centerClampChaseDepthMm,note:'Continuous upper rear clearance lets the monitor stand move south while the printer remains below'})
    addRearPart(rearD,rearBodyH,.025,rearD/2,rearBodyH/2,.0125)
    addRearPart(rearD,rearBodyH,.025,rearD/2,rearBodyH/2,rearLength-.0125)
    for(const dividerZ of [moduleD,moduleD*2]) addRearPart(rearD,rearBodyH-.05,.018,rearD/2,rearBodyH/2,dividerZ)
    addRearPart(rearD-.035,.022,moduleD-.05,rearD/2,rearBodyH*.5,moduleD*1.5)
    room.add(rearCabinetGroup)
    tagCarpentry(rearCabinetGroup,{name:'West lower cabinet run',widthMm:rear.widthMm,heightMm:rear.topHeightMm,depthMm:rear.depthMm,note:'Three bays with two full-depth desk-foot installation slots and a centre monitor-clamp channel'})
    const westDoorGroups=[]
    const bayNames=['north','centre','south']
    for(let i=0;i<rearModules;i++){
      const frontDepth=moduleD-.018
      const hingeAtSouth=i%2===0
      const westDoorGroup=new THREE.Group()
      westDoorGroup.position.set(rearD+.012,toe+rearBodyH/2,deskStartZ+i*moduleD+(hingeAtSouth?.009:moduleD-.009))
      const westFront=new THREE.Mesh(new THREE.BoxGeometry(.018,rearBodyH-.035,frontDepth),doorMaterial)
      westFront.position.z=hingeAtSouth?frontDepth/2:-frontDepth/2;westFront.castShadow=true;westDoorGroup.add(westFront)
      const westHandle=new THREE.Mesh(new THREE.BoxGeometry(.032,.16,.018),makeMaterial('#20262c',.34,null,.25))
      westHandle.position.set(.018,0,hingeAtSouth?frontDepth-.055:-frontDepth+.055);westDoorGroup.add(westHandle)
      room.add(westDoorGroup)
      tagCarpentry(westDoorGroup,{name:`West cabinet ${bayNames[i]} door`,widthMm:Math.round(frontDepth*1000),heightMm:Math.round((rearBodyH-.035)*1000),depthMm:18,note:'East-facing hinged cabinet front'})
      westDoorGroups.push({group:westDoorGroup,angle:THREE.MathUtils.degToRad(hingeAtSouth?62:-62)})
    }
    // Proposed equipment bays: tower at the north end, printer on a pull-out shelf at the south end.
    const towerGroup=new THREE.Group()
    const towerBody=new THREE.Mesh(new THREE.BoxGeometry(.216,.489,.410),new THREE.MeshStandardMaterial({color:'#171b20',roughness:.42,metalness:.18}))
    const northStorageCenterZ=deskStartZ+Math.max(.22,(legPocketStart-.025)/2)
    towerBody.position.set(rearD/2,toe+.489/2,northStorageCenterZ)
    towerBody.castShadow=true
    towerGroup.add(towerBody)
    const towerMesh=new THREE.Mesh(new THREE.BoxGeometry(.19,.43,.008),new THREE.MeshStandardMaterial({color:'#263744',emissive:'#14202a',emissiveIntensity:.35,roughness:.55}))
    towerMesh.position.set(rearD/2,toe+.489/2,northStorageCenterZ-.209)
    towerGroup.add(towerMesh)
    room.add(towerGroup)
    itemObjects['pc-tower']=towerGroup

    const printerGroup=new THREE.Group()
    const printerShelf=new THREE.Mesh(new THREE.BoxGeometry(rearD-.025,.025,moduleD-.06),new THREE.MeshStandardMaterial({color:'#75563d',roughness:.5}))
    printerShelf.position.set(rearD/2,toe+.035,centerBayCenterZ)
    printerShelf.castShadow=true
    printerGroup.add(printerShelf)
    const printerBody=new THREE.Mesh(new THREE.BoxGeometry(.332,.189,.446),new THREE.MeshStandardMaterial({color:'#e9edf0',roughness:.55}))
    printerBody.position.set(rearD/2,toe+.142,centerBayCenterZ)
    printerBody.castShadow=true
    printerGroup.add(printerBody)
    room.add(printerGroup)
    itemObjects.printer=printerGroup
    // Toggleable 3D electrical overlay. Markers sit just in front of the
    // cabinet faces so outlet locations remain legible from every preset.
    addElectricalMarker(room,'E1 · HEATER',heaterX,H-.62,upperD+.055,'#ea580c')
    addElectricalMarker(room,'E2 · ROUTER',routerX,routerShelfY+.13,upperD+.055,'#ea580c')
    addElectricalMarker(room,'N1 · DESK FEED',rearD+.045,rearTop-.07,centerBayCenterZ+.20,'#2563eb')
    addElectricalMarker(room,'N2 · PC / UPS',rearD+.045,toe+.29,deskStartZ+.20,'#2563eb')
    addElectricalMarker(room,'N3 · PC SPARE',rearD+.045,toe+.29,deskStartZ+.42,'#2563eb')
    addElectricalMarker(room,'N4 · PRINTER',rearD+.045,toe+.23,centerBayCenterZ,'#2563eb')
    addElectricalMarker(room,'D1 · 2× CAT6',rearD+.045,rearTop-.18,centerBayCenterZ+.35,'#0f766e')
    addElectricalMarker(movingDesk,'P1 · 8-WAY RAIL',deskDepth*.62,-.11,deskCenterZ+.22,'#16a34a')
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
    const screenBottom=.17
    addMonitor({monitor:rightMonitor,centerZ:rightCenterZ,centerY:screenBottom+rightH/2,id:'monitor-lenovo'})
    addMonitor({monitor:leftMonitor,centerZ:leftCenterZ,centerY:screenBottom+leftH/2,id:'monitor-benq'})
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
    const clampDrop=mm(office.equipment.monitorStand.clampDropMm)
    const clampStem=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,clampDrop,14),standMaterial)
    clampStem.position.set(.07,-worktopT-clampDrop/2,standZ)
    clampStem.castShadow=true
    armGroup.add(clampStem)
    const clampPad=new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,.012,18),standMaterial)
    clampPad.rotation.z=Math.PI/2
    clampPad.position.set(.07,-worktopT-clampDrop,standZ)
    armGroup.add(clampPad)

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
    let cabinetOpenTarget=0
    const setCabinetsOpen=open=>{cabinetOpenTarget=open?1:0}
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
    setCabinetsOpen(allCabinetsOpen)
    setQuality(highQuality)
    sceneRef.current={setCamera,setDeskHeight,setCabinetsOpen,setQuality,focusItem,captureScreenshot,clearSelection,setHumanVisible:visible=>{human.visible=visible},setDirectionsVisible:visible=>{directionGroup.visible=visible},setElectricalVisible:visible=>{electricalOverlays.forEach(({marker})=>{marker.visible=visible})},setSouthWallVisible:visible=>{southWallGroup.visible=visible},setWestWallVisible:visible=>{westWallGroup.visible=visible}}

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
    const animate=()=>{
      frame=requestAnimationFrame(animate)
      leftSlider.position.x=THREE.MathUtils.lerp(leftSlider.position.x,THREE.MathUtils.lerp(leftSliderClosedX,rightSliderX,cabinetOpenTarget),.12)
      lowerLeftSlider.position.x=THREE.MathUtils.lerp(lowerLeftSlider.position.x,THREE.MathUtils.lerp(lowerLeftSliderClosedX,lowerRightSliderX,cabinetOpenTarget),.12)
      liftGroup.rotation.x=THREE.MathUtils.lerp(liftGroup.rotation.x,THREE.MathUtils.degToRad(-58)*cabinetOpenTarget,.12)
      for(const {group,angle} of westDoorGroups)group.rotation.y=THREE.MathUtils.lerp(group.rotation.y,angle*cabinetOpenTarget,.12)
      controls.update();renderer.render(scene,camera)
    }
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
      electricalOverlays.forEach(({texture})=>texture.dispose())
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
  useEffect(()=>{sceneRef.current?.setCabinetsOpen(allCabinetsOpen)},[allCabinetsOpen])
  useEffect(()=>{sceneRef.current?.setSouthWallVisible(showSouthWall)},[showSouthWall])
  useEffect(()=>{sceneRef.current?.setWestWallVisible(showWestWall)},[showWestWall])
  useEffect(()=>{sceneRef.current?.setElectricalVisible(showElectrical)},[showElectrical])
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
    pdf.setFillColor(154,116,76);pdf.rect(ox+roomW-northW,oy,northW,north.lower.depthMm*planScale,'FD')
    const desk=office.worktop.westAdjustable
    const deskStart=office.dimensions.lengthMm-desk.widthMm
    const northCabinetToDeskGap=deskStart-north.lower.depthMm
    pdf.setFillColor(112,78,54);pdf.rect(ox,oy+deskStart*planScale,desk.depthMm*planScale,desk.widthMm*planScale,'FD')
    const rear=office.worktop.rearCabinet
    pdf.setFillColor(220,198,165);pdf.rect(ox,oy+deskStart*planScale,rear.depthMm*planScale,rear.widthMm*planScale,'FD')
    dim(ox,oy-7,ox+roomW,oy-7,formatDim(office.dimensions.widthMm),4)
    dim(ox-8,oy,ox-8,oy+roomL,formatDim(office.dimensions.lengthMm),4)
    dim(ox,oy+deskStart*planScale-4,ox+desk.depthMm*planScale,oy+deskStart*planScale-4,`Desk depth ${formatDim(desk.depthMm)}`,2)
    dim(ox+desk.depthMm*planScale+5,oy+deskStart*planScale,ox+desk.depthMm*planScale+5,oy+(deskStart+desk.widthMm)*planScale,`Desk width ${formatDim(desk.widthMm)}`,3)
    note('Plan legend',125,34);note(`Brown: adjustable west desktop\nTan: fixed west-side cabinet\nNorth cabinet: ${formatDim(north.lower.widthMm)} wide; lower ${formatDim(north.lower.depthMm)} deep\nGap from lower cabinet to desk: ${formatDim(northCabinetToDeskGap)}\nDesktop continues to south wall\nSouth wall: no counter or cabinet\nWest cabinet: ${formatDim(rear.depthMm)} deep x ${formatDim(rear.widthMm)} long\nEast-facing access\nOpen floor depth: ${formatDim(desk.depthMm-rear.depthMm)}`,125,40,70)
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
    const serviceDividerX=cabX+north.upper.heaterBayWidthMm*elevScale
    pdf.line(serviceDividerX,baseY-elevH,serviceDividerX,baseY-elevH+north.upper.heightMm*elevScale)
    const splitY=baseY-north.doors.lower.splitHeightMm*elevScale
    pdf.line(cabX,splitY,cabX+cabW,splitY);pdf.line(cabX+cabW/2,baseY-north.lower.heightMm*elevScale,cabX+cabW/2,baseY)
    dim(ex,baseY+7,ex+elevW,baseY+7,formatDim(office.dimensions.widthMm),4)
    dim(ex-8,baseY-elevH,ex-8,baseY,formatDim(office.dimensions.floorToCeilingMm),4)
    dim(cabX,baseY-north.lower.heightMm*elevScale-5,cabX+cabW,baseY-north.lower.heightMm*elevScale-5,`Cabinet ${formatDim(north.lower.widthMm)}`,2)
    note(`NORTH CABINET\nUpper: ${formatDim(north.upper.heightMm)} H x ${formatDim(north.upper.depthMm)} D; removable ventilated access.\nNorthwest heater bay: ${formatDim(north.upper.heaterBayWidthMm)} W; verify tank, pipes, clearances and service access on site.\nNortheast router bay: ${formatDim(north.upper.routerBayWidthMm)} W; raised shelf at ${formatDim(north.upper.routerShelfHeightAboveBayBottomMm)} above bay bottom; internal socket and solid divider.\nUnder-router storage: 2 horizontal shelves; 2 book-height tiers plus 1 shallow accessory tier; ${formatDim(north.upper.routerUnderShelfStorage.rearCableChaseMm)} rear cable chase.\nStraight antenna pass-through: 3 x ${formatDim(north.upper.routerAntennaPassThrough.slotWidthMm)} W x ${formatDim(north.upper.routerAntennaPassThrough.slotHeightMm)} H rubber-lined upper side slots.\nLower: ${formatDim(north.lower.heightMm)} H x ${formatDim(north.lower.widthMm)} W x ${formatDim(north.lower.depthMm)} D.\nBook grid: ${north.lower.bookStorage.columns} columns; ${north.lower.bookStorage.tiersBelowTabletop} tiers below and ${north.lower.bookStorage.tiersAboveTabletop} above tabletop split.\nFull-width two-panel bypass sliders below and above.`,125,38,145)
    note('All cabinet dimensions are nominal carcass dimensions. The five-inch lower cabinet needs wall anchoring; verify actual book depth. Allow for shutters, tracks, edge bands, scribes, wall irregularity and installation tolerances.',125,82,145)

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
    note(`WEST WORKSTATION\nDesktop: ${formatDim(desk.widthMm)} W x ${formatDim(desk.depthMm)} D x ${formatDim(desk.topThicknessMm)} T.\nCurrent exported height: ${formatDim(deskHeightIn*25.4)}.\nAdjustment range: ${formatDim(desk.minHeightMm)} to ${formatDim(desk.maxHeightMm)}.\nFrame span: ${formatDim(desk.frameSpanMm)}; shifted ${formatDim(desk.frameOffsetSouthMm)} south.\nNorth/south end overhangs: ${formatDim(desk.northEndOverhangMm)} / ${formatDim(desk.southEndOverhangMm)}.\nDesk-foot through-slots: north ${formatDim(rear.northLegPocketWidthMm)} W; south ${formatDim(rear.legRemovalSlotWidthMm)} W; full ${formatDim(rear.depthMm)} depth.\nDesktop remains at the south wall, leaving ${formatDim(northCabinetToDeskGap)} from the five-inch north lower cabinet.\nCentre clamp channel: ${formatDim(rear.centerClampChaseWidthMm)} W x ${formatDim(rear.centerClampChaseDepthMm)} D; ${formatDim(rear.centerClampChaseDropMm)} drop.\nWest cabinet: ${formatDim(rear.widthMm)} L x ${formatDim(rear.depthMm)} D x ${formatDim(rear.topHeightMm)} H; east-facing access.\nClear floor depth: ${formatDim(desk.depthMm-rear.depthMm)}.\nNo south-wall counter or cabinet.`,205,36,78)
    note(`ENVELOPE\nBrick parapet: ${formatDim(office.envelope.lowerBrickParapetMm)}\nWindow band: ${formatDim(office.envelope.windowBandMm)}\nTop brick band: ${formatDim(office.envelope.upperBrickBandMm)}\nTotal: ${formatDim(office.dimensions.floorToCeilingMm)}`,205,99,78)
    note('Provide flexible cable loops and confirm that no fixed cabinet, cable or shutter enters the desk lifting path.',205,137,78)

    pdf.addPage('a4','landscape')
    title('Carpenter Fabrication Schedule')
    const cabinetRows=[
      ['North upper cabinet','1',north.lower.widthMm,north.upper.heightMm,north.upper.depthMm,'Ventilated removable access; divided heater and router service bays; two horizontal shelves below router'],
      ['Water-heater bay','1',north.upper.heaterBayWidthMm,north.upper.heightMm,north.upper.depthMm,'Existing heater; drip tray; verify manufacturer clearance, plumbing and service access'],
      ['Router shelf','1',north.upper.routerBayWidthMm-50,22,north.upper.depthMm-55,'Raised shelf; internal socket; ventilated; solid divider; three straight antenna pass-throughs'],
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
    title('Preliminary Electrical and Data Plan')
    const electrical=office.electrical
    note(`OUTLET COUNT\nExisting fixed outlets retained: ${electrical.totals.existingFixedOutlets} (water heater and router).\nNew fixed outlets: ${electrical.totals.newFixedOutlets}.\nMoving under-desk power rail: ${electrical.totals.movingDeskOutlets} outlets.\nDesigned connected equipment plugs: ${electrical.totals.simultaneousEquipmentPlugs}; spare equipment outlets: ${electrical.totals.spareEquipmentOutlets}.`,14,31,82)
    note(`NEW FIXED POINTS\n1. Centre high service zone: 1 x 6/16 A earthed point feeding the moving desk rail.\n2. North PC/UPS bay: 2 x 6 A earthed points.\n3. Centre printer bay: 1 x 6 A earthed point.\n\nDESK RAIL LOADS\nTwo monitors, laptop charger, dock, combined phone/watch charger and sit-stand motor; two spare outlets.`,104,31,90)
    note(`DATA AND ROUTING\n2 x Cat6 from router rear chase to desk dock: one active, one spare.\nKeep data separated from mains and cross only at right angles.\nUse a flexible service loop sized for the full desk travel and quick-disconnect plugs so the desk can slide out.`,205,31,78)
    note(`SAFETY BASIS\nRetain the water heater on a dedicated circuit and verify its existing point and accessible double-pole isolation.\nAll socket outlets: three-pin, permanently earthed, BIS-certified to IS 1293:2019.\nDomestic installation: residual-current protection not exceeding ${electrical.protection.domesticRcdMaxMa} mA.\nLicensed electrician to verify actual load, circuit segregation, breaker and conductor sizing, polarity, insulation resistance, earthing and earth-fault loop impedance before energising. Keep outlets accessible and clear of heater plumbing and possible leaks.`,14,112,pageW-28)

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
  const aiRenderPrompt=`Create a photorealistic interior architectural 3D render of a narrow enclosed balcony home office in an Indian apartment. Room size: ${BALCONY_OFFICE.dimensions.widthMm} mm wide × ${BALCONY_OFFICE.dimensions.lengthMm} mm long × ${BALCONY_OFFICE.dimensions.floorToCeilingMm} mm high. Camera: eye-level wide-angle view from the study entrance, showing the full west workstation and north cabinet without fisheye distortion.

West wall: a continuous ${BALCONY_OFFICE.worktop.westAdjustable.widthMm} × ${BALCONY_OFFICE.worktop.westAdjustable.depthMm} mm light-oak adjustable desktop, currently ${Math.round(deskHeightIn*25.4)} mm high, running to the south wall. Black dual-motor sit-stand frame, two monitors on one clamp-mounted arm, open laptop, clean keyboard and mouse, concealed eight-outlet power rail and organized cable spine. Below it is a ${BALCONY_OFFICE.worktop.rearCabinet.depthMm} mm deep light-oak cabinet run with three east-facing doors, a ventilated PC bay, centre printer pull-out and clear desk-leg installation slots.

North wall: full-height cabinetry. Lower cabinet is ${BALCONY_OFFICE.cabinetry.northWall.lower.widthMm} mm wide × ${BALCONY_OFFICE.cabinetry.northWall.lower.depthMm} mm deep with organized book shelves and sliding fronts. Upper cabinet is ${BALCONY_OFFICE.cabinetry.northWall.upper.depthMm} mm deep: concealed water-heater service bay on the northwest, router shelf on the northeast with three straight antennas passing through the side, and two horizontal book shelves below the router. Use removable ventilated access panels.

Architecture and finish: warm pale oak mica cabinetry with subtle grain, matte off-white walls, black metal frame and hardware, soft neutral floor, window bands along the south and west walls, natural daylight balanced with warm recessed ceiling lights. Keep the south wall free of cabinets. The result should look buildable, uncluttered and accurately scaled, with realistic joinery, shadows and reflections. No people, compass labels, measurement tags, UI elements, text, logos, floating furniture or extra cabinets.`
  const copyAiPrompt=async()=>{
    try{await navigator.clipboard.writeText(aiRenderPrompt);setPromptCopyStatus('copied');setTimeout(()=>setPromptCopyStatus('idle'),1800)}
    catch{setPromptCopyStatus('error')}
  }

  return <section ref={sectionRef} style={{background:'#fff',border:'1px solid #ded8ea',borderRadius:isFullscreen?0:22,overflow:'hidden',marginTop:isFullscreen?0:22,boxShadow:isFullscreen?'none':'0 14px 38px rgba(35,25,66,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e8e3ef'}}>
      <div><b style={{fontSize:17,color:'#231942'}}>Interactive 3D view</b><div style={{fontSize:12,color:'#70677f',marginTop:3}}>Click carpentry for dimensions · drag to orbit · scroll to zoom · right-drag to pan{personAssetStatus==='loading'?' · loading person…':''}{personAssetStatus==='error'?' · person model unavailable':''}</div></div>
      <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
        {[['overview','Overview'],['north','North cabinet'],['top','Top']].map(([key,label])=><button key={key} onClick={()=>setPreset(key)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:preset===key?'#231942':'#fff',color:preset===key?'#fff':'#231942',fontWeight:800,cursor:'pointer'}}>{label}</button>)}
        <button onClick={()=>setHighQuality(value=>!value)} title="Toggle GPU-intensive lighting, reflections and shadows" style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:highQuality?'#dcfce7':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{highQuality?'High quality':'Performance'}</button>
        <button onClick={()=>setShowItems(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showItems?'#fef3c7':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>Items ({BALCONY_OFFICE.equipment.inventory.length})</button>
        <button onClick={()=>setShowElectrical(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showElectrical?'#dbeafe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showElectrical?'Hide electrical points':'Show electrical points'}</button>
        <button onClick={()=>setAllCabinetsOpen(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:allCabinetsOpen?'#ffedd5':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{allCabinetsOpen?'Close all cabinets':'Open all cabinets'}</button>
        <button onClick={()=>setShowSouthWall(value=>!value)} aria-pressed={!showSouthWall} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showSouthWall?'#fff':'#fee2e2',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showSouthWall?'Hide south wall':'Show south wall'}</button>
        <button onClick={()=>setShowWestWall(value=>!value)} aria-pressed={!showWestWall} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showWestWall?'#fff':'#fee2e2',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showWestWall?'Hide west wall':'Show west wall'}</button>
        <button onClick={()=>setShowDirections(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showDirections?'#ede9fe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showDirections?'Hide directions':'Show directions'}</button>
        <button onClick={()=>setShowHuman(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:showHuman?'#e0f2fe':'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>{showHuman?'Hide person':'Show person'}</button>
        <button onClick={copyScreenshot} disabled={screenshotStatus==='copying'} aria-live="polite" title="Copy the current 3D view as a PNG" style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cfc6dc',background:screenshotStatus==='copied'?'#dcfce7':screenshotStatus==='error'?'#fee2e2':'#fff',color:'#231942',fontWeight:800,cursor:screenshotStatus==='copying'?'wait':'pointer'}}>{screenshotStatus==='copying'?'Copying…':screenshotStatus==='copied'?'Copied!':screenshotStatus==='error'?'Copy failed':'Copy screenshot'}</button>
        <button onClick={()=>setShowAiPrompt(true)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #7c3aed',background:'#f3e8ff',color:'#5b21b6',fontWeight:800,cursor:'pointer'}}>AI render prompt</button>
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
      <div ref={mountRef} style={{height:isFullscreen?'calc(100vh - 116px)':'clamp(620px,82vh,1100px)',width:'100%'}}/>
      {selectedCarpentryItem&&<aside aria-live="polite" style={{position:'absolute',zIndex:6,left:12,top:12,width:'min(300px,calc(100% - 24px))',background:'rgba(255,255,255,.96)',border:'2px solid #6d28d9',borderRadius:13,padding:'11px 12px',boxShadow:'0 12px 30px rgba(20,15,35,.22)',color:'#231942'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8}}><b style={{fontSize:14}}>{selectedCarpentryItem.name}</b><button onClick={()=>{setSelectedCarpentryItem(null);sceneRef.current?.clearSelection()}} aria-label="Close dimensions" style={{border:0,background:'transparent',fontSize:18,lineHeight:1,cursor:'pointer',color:'#231942'}}>×</button></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:9}}>{[['W',selectedCarpentryItem.widthMm],['H / T',selectedCarpentryItem.heightMm],['D',selectedCarpentryItem.depthMm]].map(([label,value])=><div key={label} style={{padding:'7px 5px',borderRadius:8,background:'#f3e8ff',textAlign:'center'}}><span style={{display:'block',fontSize:9,fontWeight:900,color:'#6d28d9'}}>{label}</span><b style={{display:'block',fontSize:11,marginTop:2}}>{formatCarpentryDimension(value)}</b></div>)}</div>
        <div style={{fontSize:11,color:'#665d73',marginTop:8,lineHeight:1.35}}>{selectedCarpentryItem.note}</div>
      </aside>}
      {showItems&&<aside style={{position:'absolute',zIndex:5,right:12,top:12,width:'min(360px,calc(100% - 24px))',maxHeight:'calc(100% - 24px)',overflowY:'auto',background:'rgba(255,255,255,.96)',border:'1px solid #d8d0e2',borderRadius:14,padding:12,boxShadow:'0 12px 30px rgba(20,15,35,.22)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:8}}><b style={{color:'#231942'}}>Items and placement</b><button onClick={()=>setShowItems(false)} aria-label="Close items" style={{border:0,background:'transparent',fontSize:18,cursor:'pointer'}}>×</button></div>
        <div style={{display:'grid',gap:7}}>{BALCONY_OFFICE.equipment.inventory.map(item=><button key={item.id} onClick={()=>{setSelectedItem(item.id);sceneRef.current?.focusItem(item.id)}} style={{textAlign:'left',padding:'9px 10px',borderRadius:10,border:selectedItem===item.id?'2px solid #f97316':'1px solid #ddd5e6',background:selectedItem===item.id?'#fff7ed':'#fff',cursor:'pointer',color:'#231942'}}><b style={{display:'block',fontSize:12}}>{item.category}: {item.make} {item.model}</b><span style={{display:'block',fontSize:11,color:'#6f657d',marginTop:3}}>{item.location}</span></button>)}</div>
      </aside>}
      {showElectrical&&<aside aria-label="Electrical points legend" style={{position:'absolute',zIndex:7,right:12,top:12,width:'min(310px,calc(100% - 24px))',background:'rgba(255,255,255,.96)',border:'2px solid #2563eb',borderRadius:14,padding:12,boxShadow:'0 12px 30px rgba(20,15,35,.22)',color:'#231942',fontSize:11,lineHeight:1.45}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8}}><b style={{fontSize:14}}>3D electrical points</b><button onClick={()=>setShowElectrical(false)} aria-label="Hide electrical points" style={{border:0,background:'transparent',fontSize:18,cursor:'pointer'}}>×</button></div>
        <div style={{marginTop:7}}><b style={{color:'#ea580c'}}>E1–E2</b> existing heater and router · <b style={{color:'#2563eb'}}>N1–N4</b> new fixed power · <b style={{color:'#16a34a'}}>P1</b> moving desk rail · <b style={{color:'#0f766e'}}>D1</b> two Cat6 runs</div>
      </aside>}
      {showAiPrompt&&<div role="presentation" onClick={()=>setShowAiPrompt(false)} style={{position:'fixed',zIndex:10000,inset:0,display:'grid',placeItems:'center',padding:20,background:'rgba(23,15,42,.72)',backdropFilter:'blur(4px)'}}>
        <aside role="dialog" aria-modal="true" aria-label="AI render prompt" onClick={event=>event.stopPropagation()} style={{width:'min(820px,calc(100vw - 32px))',maxHeight:'calc(100vh - 40px)',display:'flex',flexDirection:'column',background:'#fff',border:'3px solid #7c3aed',borderRadius:18,padding:'18px 20px',boxShadow:'0 28px 80px rgba(0,0,0,.42)',color:'#231942'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'start'}}><div><b style={{fontSize:23}}>AI prompt for a 3D render</b><div style={{fontSize:12,color:'#6f657d',marginTop:4}}>Generated from the current balcony-office dimensions and desk height.</div></div><button onClick={()=>setShowAiPrompt(false)} aria-label="Close AI render prompt" style={{border:'1px solid #ddd5e6',borderRadius:10,background:'#faf8fc',width:38,height:38,fontSize:24,lineHeight:1,cursor:'pointer'}}>×</button></div>
          <textarea readOnly value={aiRenderPrompt} aria-label="Generated AI render prompt" style={{marginTop:14,width:'100%',minHeight:360,maxHeight:'55vh',resize:'vertical',padding:14,borderRadius:12,border:'1px solid #cfc6dc',background:'#faf8fc',color:'#231942',font:'13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace',boxSizing:'border-box'}}/>
          <div style={{display:'flex',justifyContent:'flex-end',gap:9,marginTop:12}}><button onClick={()=>setShowAiPrompt(false)} style={{padding:'9px 14px',borderRadius:10,border:'1px solid #cfc6dc',background:'#fff',color:'#231942',fontWeight:800,cursor:'pointer'}}>Close</button><button onClick={copyAiPrompt} aria-live="polite" style={{padding:'9px 15px',borderRadius:10,border:'1px solid #7c3aed',background:promptCopyStatus==='copied'?'#dcfce7':'#7c3aed',color:promptCopyStatus==='copied'?'#166534':'#fff',fontWeight:900,cursor:'pointer'}}>{promptCopyStatus==='copied'?'Copied!':promptCopyStatus==='error'?'Copy failed':'Copy prompt'}</button></div>
        </aside>
      </div>}
      {showDirections&&<div aria-label="Compass directions" style={{position:'absolute',zIndex:4,right:12,bottom:12,display:'grid',gridTemplateColumns:'repeat(3,28px)',gridTemplateRows:'repeat(3,24px)',placeItems:'center',padding:'7px 9px',borderRadius:10,background:'rgba(255,255,255,.9)',border:'1px solid rgba(35,25,66,.3)',boxShadow:'0 5px 16px rgba(20,15,35,.16)',color:'#231942',fontSize:10,fontWeight:900}}>
        {['NW','N','NE','W','•','E','SW','S','SE'].map(direction=><span key={direction}>{direction}</span>)}
      </div>}
      <div style={{position:'absolute',left:12,bottom:12,background:'rgba(17,24,39,.82)',color:'#fff',padding:'8px 10px',borderRadius:10,fontSize:11,lineHeight:1.45}}>West: 30 in sit–stand desk to south wall<br/>South wall: no counter or cabinet<br/>Reference person: 5 ft 7 in, facing monitors</div>
    </div>
  </section>
}
