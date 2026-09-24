import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'
import {createStudyTerrace} from './StudyTerrace.js'

const mm=value=>value/1000

export default function StudyRoom3D(){
  const mountRef=useRef(null)
  const sceneRef=useRef(null)
  const [preset,setPreset]=useState('overview')
  const [showEastWall,setShowEastWall]=useState(true)
  const [showNorthWall,setShowNorthWall]=useState(false)
  const [showLabels,setShowLabels]=useState(true)
  const [showDirections,setShowDirections]=useState(true)

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const W=mm(STUDY_ROOM.dimensions.widthMm)
    const L=mm(STUDY_ROOM.dimensions.lengthMm)
    const H=mm(STUDY_ROOM.dimensions.heightMm)
    const scene=new THREE.Scene();scene.background=new THREE.Color('#edf2f6')
    const camera=new THREE.PerspectiveCamera(48,1,.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.25));renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer)
    const environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(W/2,H*.42,L/2)
    const room=new THREE.Group();scene.add(room)
    const directionGroup=new THREE.Group();room.add(directionGroup)
    const directionTextures=[]
    const addDirection=(label,x,z,primary=false)=>{
      const canvas=document.createElement('canvas');canvas.width=192;canvas.height=96
      const ctx=canvas.getContext('2d');ctx.fillStyle=primary?'rgba(23,32,51,.95)':'rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(5,5,182,86,20);ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#2563eb';ctx.stroke();ctx.fillStyle=primary?'#fff':'#172033';ctx.font=`900 ${label.length===1?46:38}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,96,49)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;directionTextures.push(texture)
      const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));marker.position.set(x,.08,z);marker.scale.set(label.length===1?.34:.4,.17,1);marker.renderOrder=1300;directionGroup.add(marker)
    }
    addDirection('N',W/2,.28,true);addDirection('NE',W-.3,.3);addDirection('E',W-.28,L/2,true);addDirection('SE',W-.3,L-.3)
    addDirection('S',W/2,L-.28,true);addDirection('SW',.3,L-.3);addDirection('W',.28,L/2,true);addDirection('NW',.3,.3)
    directionGroup.visible=showDirections
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#cfc7bb',roughness:.84})
    const floorMaterial=new THREE.MeshStandardMaterial({color:'#866447',roughness:.78})
    const trimMaterial=new THREE.MeshStandardMaterial({color:'#f8fafc',roughness:.62})
    const addBox=(w,h,d,x,y,z,material=wallMaterial,parent=room)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    addBox(W,.05,L,W/2,-.025,L/2,floorMaterial)
    room.add(createStudyTerrace(STUDY_ROOM))
    const wallT=.1
    const northGroup=new THREE.Group();room.add(northGroup)
    addBox(W,H,wallT,W/2,H/2,0,wallMaterial,northGroup)
    const bookshelf=STUDY_ROOM.cabinetry.northBookshelf
    const bookshelfW=mm(bookshelf.widthMm),bookshelfD=mm(bookshelf.depthMm),bookshelfH=mm(bookshelf.heightMm)
    const bookshelfStart=mm(bookshelf.offsetFromWestMm),bookshelfCenterX=bookshelfStart+bookshelfW/2
    const bookshelfGroup=new THREE.Group();room.add(bookshelfGroup)
    const shelfTimberMaterial=new THREE.MeshStandardMaterial({color:'#69452f',roughness:.58})
    const shelfPanelMaterial=new THREE.MeshStandardMaterial({color:'#d8d9c5',roughness:.7})
    const shelfInteriorMaterial=new THREE.MeshStandardMaterial({color:'#d5c8b7',roughness:.78})
    const shelfGlassMaterial=new THREE.MeshPhysicalMaterial({color:'#6d7880',transparent:true,opacity:.34,roughness:.16,transmission:.32,metalness:.04})
    const shelfHandleMaterial=new THREE.MeshStandardMaterial({color:'#5f625d',roughness:.32,metalness:.62})
    const footH=.085,carcassBottom=footH,frontZ=bookshelfD+.064,bayW=bookshelfW/3
    const lowerTop=.69,drawerTop=.84,middleTop=1.57
    addBox(bookshelfW,.04,bookshelfD,bookshelfCenterX,carcassBottom+.02,bookshelfD/2+.055,shelfTimberMaterial,bookshelfGroup)
    addBox(bookshelfW,.04,bookshelfD,bookshelfCenterX,bookshelfH-.02,bookshelfD/2+.055,shelfTimberMaterial,bookshelfGroup)
    addBox(.04,bookshelfH-carcassBottom,bookshelfD,bookshelfStart+.02,(bookshelfH+carcassBottom)/2,bookshelfD/2+.055,shelfTimberMaterial,bookshelfGroup)
    addBox(.04,bookshelfH-carcassBottom,bookshelfD,bookshelfStart+bookshelfW-.02,(bookshelfH+carcassBottom)/2,bookshelfD/2+.055,shelfTimberMaterial,bookshelfGroup)
    addBox(bookshelfW-.08,bookshelfH-carcassBottom-.06,.025,bookshelfCenterX,(bookshelfH+carcassBottom)/2,.068,shelfInteriorMaterial,bookshelfGroup)
    for(const dividerX of [bookshelfStart+bayW,bookshelfStart+bayW*2]) addBox(.045,bookshelfH-carcassBottom,bookshelfD-.02,dividerX,(bookshelfH+carcassBottom)/2,bookshelfD/2+.065,shelfTimberMaterial,bookshelfGroup)
    for(const level of [lowerTop,drawerTop,middleTop]) addBox(bookshelfW-.06,.035,bookshelfD-.02,bookshelfCenterX,level,bookshelfD/2+.065,shelfTimberMaterial,bookshelfGroup)
    for(const level of [(drawerTop+middleTop)/2,(middleTop+bookshelfH)/2]) addBox(bookshelfW-.09,.022,bookshelfD-.075,bookshelfCenterX,level,bookshelfD/2+.05,shelfInteriorMaterial,bookshelfGroup)
    const addBookcaseDoor=(x,y,w,h,kind,handleSide)=>{
      addBox(w,h,.025,x,y,frontZ,shelfTimberMaterial,bookshelfGroup)
      addBox(w-.025,h-.025,.018,x,y,frontZ+.02,shelfPanelMaterial,bookshelfGroup)
      if(kind==='glass') addBox(w-.11,h-.12,.014,x,y,frontZ+.035,shelfGlassMaterial,bookshelfGroup)
      const handleX=x+(handleSide==='right'?w*.32:-w*.32)
      addBox(.022,.15,.028,handleX,y,frontZ+.055,shelfHandleMaterial,bookshelfGroup)
    }
    const leafGap=.012
    for(let bay=0;bay<3;bay++){
      const bayStart=bookshelfStart+bay*bayW+.035
      const innerBayW=bayW-.07,leafW=(innerBayW-leafGap)/2
      const leftX=bayStart+leafW/2,rightX=bayStart+leafW+leafGap+leafW/2
      const lowerH=lowerTop-carcassBottom-.04
      addBookcaseDoor(leftX,carcassBottom+.02+lowerH/2,leafW,lowerH,'solid','right')
      addBookcaseDoor(rightX,carcassBottom+.02+lowerH/2,leafW,lowerH,'solid','left')
      const middleH=middleTop-drawerTop-.055
      addBookcaseDoor(leftX,drawerTop+.028+middleH/2,leafW,middleH,'glass','right')
      addBookcaseDoor(rightX,drawerTop+.028+middleH/2,leafW,middleH,'glass','left')
      const upperH=bookshelfH-middleTop-.065
      addBookcaseDoor(leftX,middleTop+.03+upperH/2,leafW,upperH,'glass','right')
      addBookcaseDoor(rightX,middleTop+.03+upperH/2,leafW,upperH,'glass','left')
      const drawerW=(innerBayW-leafGap)/2,drawerY=lowerTop+(drawerTop-lowerTop)/2
      for(const [drawerX,handleSign] of [[leftX,1],[rightX,-1]]){
        addBox(drawerW,drawerTop-lowerTop-.025,.028,drawerX,drawerY,frontZ+.012,shelfPanelMaterial,bookshelfGroup)
        addBox(.13,.025,.028,drawerX+handleSign*.04,drawerY,frontZ+.05,shelfHandleMaterial,bookshelfGroup)
      }
      for(const footX of [bookshelfStart+bay*bayW+.12,bookshelfStart+(bay+1)*bayW-.12]){
        const foot=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,footH,12),shelfTimberMaterial);foot.position.set(footX,footH/2,bookshelfD/2+.055);foot.castShadow=true;bookshelfGroup.add(foot)
      }
    }
    const southGroup=new THREE.Group();room.add(southGroup)
    const terrace=STUDY_ROOM.openings.terraceDoor,terraceStart=mm(terrace.offsetFromWestMm),terraceEnd=terraceStart+mm(terrace.widthMm),terraceH=mm(terrace.heightMm)
    const southCabinet=STUDY_ROOM.cabinetry.southBuiltIn
    const cabinetStart=mm(southCabinet.offsetFromWestMm),cabinetEnd=cabinetStart+mm(southCabinet.widthMm)
    const cabinetBottom=mm(southCabinet.floorClearanceMm),cabinetH=mm(southCabinet.heightMm),cabinetTop=cabinetBottom+cabinetH
    addBox(cabinetStart,H,wallT,cabinetStart/2,H/2,L,wallMaterial,southGroup)
    addBox(terraceStart-cabinetEnd,H,wallT,cabinetEnd+(terraceStart-cabinetEnd)/2,H/2,L,wallMaterial,southGroup)
    addBox(mm(southCabinet.widthMm),cabinetBottom,wallT,(cabinetStart+cabinetEnd)/2,cabinetBottom/2,L,wallMaterial,southGroup)
    addBox(mm(southCabinet.widthMm),H-cabinetTop,wallT,(cabinetStart+cabinetEnd)/2,cabinetTop+(H-cabinetTop)/2,L,wallMaterial,southGroup)
    addBox(W-terraceEnd,H,wallT,terraceEnd+(W-terraceEnd)/2,H/2,L,wallMaterial,southGroup)
    addBox(mm(terrace.widthMm),H-terraceH,wallT,(terraceStart+terraceEnd)/2,terraceH+(H-terraceH)/2,L,wallMaterial,southGroup)
    const glass=new THREE.Mesh(new THREE.BoxGeometry(mm(terrace.widthMm)-.04,terraceH-.08,.025),new THREE.MeshPhysicalMaterial({color:'#b9e3f1',transparent:true,opacity:.33,roughness:.12,transmission:.42,metalness:.05}))
    glass.position.set((terraceStart+terraceEnd)/2,terraceH/2,L-.025);southGroup.add(glass)
    const cabinetDepth=mm(southCabinet.depthMm)
    const cabinetMaterial=new THREE.MeshStandardMaterial({color:'#c8a97e',roughness:.62})
    const cabinetInteriorMaterial=new THREE.MeshStandardMaterial({color:'#eadcc7',roughness:.78})
    const cabinetDoorMaterial=new THREE.MeshStandardMaterial({color:'#d7bb91',roughness:.52})
    const southCabinetGroup=new THREE.Group();room.add(southCabinetGroup)
    const cabinetCenterX=(cabinetStart+cabinetEnd)/2
    const cabinetCenterZ=L+cabinetDepth/2-.04
    addBox(mm(southCabinet.widthMm),.035,cabinetDepth,cabinetCenterX,cabinetBottom+.018,cabinetCenterZ,cabinetInteriorMaterial,southCabinetGroup)
    addBox(mm(southCabinet.widthMm),.035,cabinetDepth,cabinetCenterX,cabinetTop-.018,cabinetCenterZ,cabinetInteriorMaterial,southCabinetGroup)
    addBox(.035,cabinetH,cabinetDepth,cabinetStart+.018,cabinetBottom+cabinetH/2,cabinetCenterZ,cabinetMaterial,southCabinetGroup)
    addBox(.035,cabinetH,cabinetDepth,cabinetEnd-.018,cabinetBottom+cabinetH/2,cabinetCenterZ,cabinetMaterial,southCabinetGroup)
    addBox(mm(southCabinet.widthMm)-.07,cabinetH-.07,.035,cabinetCenterX,cabinetBottom+cabinetH/2,L+cabinetDepth-.058,cabinetMaterial,southCabinetGroup)
    const doorGap=.012,doorCount=3,doorW=(mm(southCabinet.widthMm)-doorGap*(doorCount+1))/doorCount
    for(let i=0;i<doorCount;i++){
      const doorX=cabinetStart+doorGap+doorW/2+i*(doorW+doorGap)
      addBox(doorW,cabinetH-.04,.022,doorX,cabinetBottom+cabinetH/2,L-.064,cabinetDoorMaterial,southCabinetGroup)
      addBox(.018,.16,.025,doorX+doorW*.34,cabinetBottom+cabinetH*.53,L-.08,new THREE.MeshStandardMaterial({color:'#4b5563',roughness:.3,metalness:.55}),southCabinetGroup)
    }
    const westGroup=new THREE.Group();room.add(westGroup)
    const office=STUDY_ROOM.openings.balconyOffice
    const westOpeningEnd=L-mm(office.offsetFromSouthMm)
    const westOpeningStart=westOpeningEnd-mm(office.widthMm)
    const westOpeningH=H-mm(office.headWallMm)
    addBox(wallT,H,westOpeningStart,0,H/2,westOpeningStart/2,wallMaterial,westGroup)
    addBox(wallT,H,L-westOpeningEnd,0,H/2,westOpeningEnd+(L-westOpeningEnd)/2,wallMaterial,westGroup)
    addBox(wallT,mm(office.headWallMm),mm(office.widthMm),0,westOpeningH+mm(office.headWallMm)/2,(westOpeningStart+westOpeningEnd)/2,wallMaterial,westGroup)
    const westThreshold=new THREE.Mesh(new THREE.BoxGeometry(.48,.035,mm(office.widthMm)),new THREE.MeshStandardMaterial({color:'#d6d3d1',roughness:.7}))
    westThreshold.position.set(-.2,.018,(westOpeningStart+westOpeningEnd)/2);westGroup.add(westThreshold)
    const eastGroup=new THREE.Group();room.add(eastGroup)
    const main=STUDY_ROOM.openings.mainDoor,mainStart=mm(main.offsetFromNorthMm),mainEnd=mainStart+mm(main.widthMm),mainH=mm(main.heightMm)
    if(mainStart>0) addBox(wallT,H,mainStart,W,H/2,mainStart/2,wallMaterial,eastGroup)
    addBox(wallT,H,L-mainEnd,W,H/2,mainEnd+(L-mainEnd)/2,wallMaterial,eastGroup)
    addBox(wallT,H-mainH,mm(main.widthMm),W,mainH+(H-mainH)/2,(mainStart+mainEnd)/2,wallMaterial,eastGroup)
    const mainDoor=new THREE.Group();mainDoor.position.set(W-.055,0,mainStart);eastGroup.add(mainDoor)
    const mainLeaf=addBox(.035,mainH,mm(main.widthMm),0,mainH/2,mm(main.widthMm)/2,new THREE.MeshStandardMaterial({color:'#8b6747',roughness:.62}),mainDoor);mainDoor.rotation.y=-Math.PI*.38
    const former=STUDY_ROOM.openings.formerToiletDoor
    const patch=new THREE.Mesh(new THREE.BoxGeometry(.018,mm(former.heightMm),mm(former.widthMm)),new THREE.MeshStandardMaterial({color:'#d7d0c5',roughness:.88}))
    patch.position.set(W-.061,mm(former.heightMm)/2,mm(former.offsetFromNorthMm)+mm(former.widthMm)/2);eastGroup.add(patch)
    for(const z of [.05,L-.05]) addBox(W,.085,.03,W/2,.05,z,trimMaterial)
    for(const x of [.05,W-.05]) addBox(.03,.085,L,x,.05,L/2,trimMaterial)
    const rug=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.45),new THREE.MeshStandardMaterial({color:'#b9c8cf',roughness:.95,side:THREE.DoubleSide}))
    rug.rotation.x=-Math.PI/2;rug.position.set(W/2,.006,L/2);rug.receiveShadow=true;room.add(rug)
    const labels=[]
    const addLabel=(text,x,y,z,color='#2563eb')=>{
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=128
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.96)';ctx.beginPath();ctx.roundRect(5,5,630,118,22);ctx.fill();ctx.lineWidth=9;ctx.strokeStyle=color;ctx.stroke();ctx.fillStyle='#172033';ctx.font='800 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,320,64)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(.9,.18,1);sprite.renderOrder=1200;sprite.visible=showLabels;room.add(sprite);labels.push({sprite,texture})
    }
    addLabel('MAIN ENTRY · EAST WALL',W-.18,2.28,(mainStart+mainEnd)/2,'#2563eb')
    addLabel('NORTH BOOKSHELF · 88 W × 18 D',bookshelfCenterX,bookshelfH+.13,bookshelfD+.12,'#92400e')
    addLabel('DOUBLE-HEIGHT TERRACE',terraceStart+mm(terrace.widthMm)/2,2.35,L-.18,'#0f766e')
    addLabel('SOUTH CABINET · 54 W × 92 H · +4',cabinetCenterX,2.53,L-.2,'#a16207')
    addLabel('TO BALCONY OFFICE · WEST · 6 FT',.18,2.43,(westOpeningStart+westOpeningEnd)/2,'#7c3aed')
    const hemi=new THREE.HemisphereLight('#ffffff','#78838a',1.05);scene.add(hemi)
    const sun=new THREE.DirectionalLight('#fff4dc',1.7);sun.position.set(-2,5,3);sun.castShadow=true;scene.add(sun)
    const fill=new THREE.PointLight('#dbeafe',1.15,9);fill.position.set(W*.55,H*.72,L*.5);scene.add(fill)
    const setCamera=key=>{
      if(key==='top'){camera.position.set(W/2,7,L/2+.01);controls.target.set(W/2,0,L/2);camera.up.set(0,0,-1)}
      else if(key==='office'){camera.position.set(-4,H*.62,L*.55);controls.target.set(0,H*.4,(westOpeningStart+westOpeningEnd)/2);camera.up.set(0,1,0)}
      else if(key==='southCabinet'){camera.position.set(cabinetCenterX,H*.62,L-3.6);controls.target.set(cabinetCenterX,cabinetBottom+cabinetH*.5,L);camera.up.set(0,1,0)}
      else if(key==='mainEntry'){camera.position.set(.35,H*.62,1.7);controls.target.set(W,mainH*.48,(mainStart+mainEnd)/2);camera.up.set(0,1,0)}
      else if(key==='northBookshelf'){camera.position.set(bookshelfCenterX,H*.62,L-1.1);controls.target.set(bookshelfCenterX,bookshelfH*.48,.25);camera.up.set(0,1,0)}
      else{camera.position.set(W+2.25,H*1.08,L+2.45);controls.target.set(W/2,H*.44,L/2);camera.up.set(0,1,0)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('overview')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    eastGroup.visible=showEastWall;northGroup.visible=showNorthWall
    sceneRef.current={setCamera,setEastVisible:value=>{eastGroup.visible=value},setNorthVisible:value=>{northGroup.visible=value},setLabelsVisible:value=>{labels.forEach(({sprite})=>{sprite.visible=value})},setDirectionsVisible:value=>{directionGroup.visible=value}}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();labels.forEach(({texture})=>texture.dispose());directionTextures.forEach(texture=>texture.dispose());room.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material?.dispose?.()});environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])
  useEffect(()=>{sceneRef.current?.setCamera(preset)},[preset])
  useEffect(()=>{sceneRef.current?.setEastVisible(showEastWall)},[showEastWall])
  useEffect(()=>{sceneRef.current?.setNorthVisible(showNorthWall)},[showNorthWall])
  useEffect(()=>{sceneRef.current?.setLabelsVisible(showLabels)},[showLabels])
  useEffect(()=>{sceneRef.current?.setDirectionsVisible(showDirections)},[showDirections])

  return <section style={{marginTop:24,background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:17,color:'#172033'}}>Interactive study shell</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>3,239 × 4,908 mm · provisional 2,700 mm ceiling · drag to orbit · scroll to zoom</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {[['overview','Overview'],['top','Top'],['office','Office connection'],['southCabinet','South cabinet'],['mainEntry','Main entry'],['northBookshelf','North bookshelf']].map(([key,label])=><button key={key} onClick={()=>{setPreset(key);if(key==='mainEntry')setShowEastWall(true)}} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:preset===key?'#172033':'#fff',color:preset===key?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}>{label}</button>)}
        <button onClick={()=>setShowEastWall(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showEastWall?'#fff':'#fee2e2',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showEastWall?'Hide east wall':'Show east wall'}</button>
        <button onClick={()=>setShowNorthWall(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showNorthWall?'#fff':'#fee2e2',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showNorthWall?'Hide north wall':'Show north wall'}</button>
        <button onClick={()=>setShowLabels(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showLabels?'#dbeafe':'#fff',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showLabels?'Hide labels':'Show labels'}</button>
        <button onClick={()=>setShowDirections(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showDirections?'#dbeafe':'#fff',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showDirections?'Hide directions':'Show directions'}</button>
      </div>
    </div>
    <div style={{position:'relative'}}><div ref={mountRef} style={{height:'clamp(620px,82vh,1100px)',width:'100%'}}/>{showDirections&&<div aria-label="Study compass directions" style={{position:'absolute',right:12,bottom:12,display:'grid',gridTemplateColumns:'repeat(3,28px)',gridTemplateRows:'repeat(3,24px)',placeItems:'center',padding:'7px 9px',borderRadius:10,background:'rgba(255,255,255,.92)',border:'1px solid rgba(23,32,51,.3)',boxShadow:'0 5px 16px rgba(20,15,35,.16)',color:'#172033',fontSize:10,fontWeight:900}}>{['NW','N','NE','W','•','E','SW','S','SE'].map(direction=><span key={direction}>{direction}</span>)}</div>}</div>
  </section>
}
