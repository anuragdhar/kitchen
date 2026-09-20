import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'

const mm=value=>value/1000

export default function StudyRoom3D(){
  const mountRef=useRef(null)
  const sceneRef=useRef(null)
  const [preset,setPreset]=useState('overview')
  const [showEastWall,setShowEastWall]=useState(false)
  const [showNorthWall,setShowNorthWall]=useState(false)
  const [showLabels,setShowLabels]=useState(true)

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
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#cfc7bb',roughness:.84})
    const floorMaterial=new THREE.MeshStandardMaterial({color:'#866447',roughness:.78})
    const trimMaterial=new THREE.MeshStandardMaterial({color:'#f8fafc',roughness:.62})
    const addBox=(w,h,d,x,y,z,material=wallMaterial,parent=room)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
    addBox(W,.05,L,W/2,-.025,L/2,floorMaterial)
    addBox(W,.04,L,W/2,H+.02,L/2,new THREE.MeshStandardMaterial({color:'#fafafa',roughness:.9}))
    const wallT=.1
    const northGroup=new THREE.Group();room.add(northGroup)
    const main=STUDY_ROOM.openings.mainDoor,mainStart=mm(main.offsetFromWestMm),mainEnd=mainStart+mm(main.widthMm),mainH=mm(main.heightMm)
    addBox(mainStart,H,wallT,mainStart/2,H/2,0,wallMaterial,northGroup)
    addBox(W-mainEnd,H,wallT,mainEnd+(W-mainEnd)/2,H/2,0,wallMaterial,northGroup)
    addBox(mm(main.widthMm),H-mainH,wallT,(mainStart+mainEnd)/2,mainH+(H-mainH)/2,0,wallMaterial,northGroup)
    const mainDoor=new THREE.Group();mainDoor.position.set(mainStart,0,.055);northGroup.add(mainDoor)
    const mainLeaf=addBox(mm(main.widthMm),mainH,.035,mm(main.widthMm)/2,mainH/2,0,new THREE.MeshStandardMaterial({color:'#8b6747',roughness:.62}),mainDoor);mainLeaf.rotation.y=-Math.PI*.38
    const southGroup=new THREE.Group();room.add(southGroup)
    const terrace=STUDY_ROOM.openings.terraceDoor,terraceStart=mm(terrace.offsetFromWestMm),terraceEnd=terraceStart+mm(terrace.widthMm),terraceH=mm(terrace.heightMm)
    addBox(terraceStart,H,wallT,terraceStart/2,H/2,L,wallMaterial,southGroup)
    addBox(W-terraceEnd,H,wallT,terraceEnd+(W-terraceEnd)/2,H/2,L,wallMaterial,southGroup)
    addBox(mm(terrace.widthMm),H-terraceH,wallT,(terraceStart+terraceEnd)/2,terraceH+(H-terraceH)/2,L,wallMaterial,southGroup)
    const glass=new THREE.Mesh(new THREE.BoxGeometry(mm(terrace.widthMm)-.04,terraceH-.08,.025),new THREE.MeshPhysicalMaterial({color:'#b9e3f1',transparent:true,opacity:.33,roughness:.12,transmission:.42,metalness:.05}))
    glass.position.set((terraceStart+terraceEnd)/2,terraceH/2,L-.025);southGroup.add(glass)
    addBox(wallT,H,L,.0,H/2,L/2)
    const eastGroup=new THREE.Group();room.add(eastGroup)
    const office=STUDY_ROOM.openings.balconyOffice,officeStart=mm(office.offsetFromNorthMm),officeEnd=officeStart+mm(office.widthMm),officeH=mm(office.heightMm)
    addBox(wallT,H,officeStart,W,H/2,officeStart/2,wallMaterial,eastGroup)
    addBox(wallT,H,L-officeEnd,W,H/2,officeEnd+(L-officeEnd)/2,wallMaterial,eastGroup)
    addBox(wallT,H-officeH,mm(office.widthMm),W,officeH+(H-officeH)/2,(officeStart+officeEnd)/2,wallMaterial,eastGroup)
    const portalFloor=new THREE.Mesh(new THREE.BoxGeometry(.55,.035,mm(office.widthMm)),new THREE.MeshStandardMaterial({color:'#d6d3d1',roughness:.7}))
    portalFloor.position.set(W+.22,.018,(officeStart+officeEnd)/2);eastGroup.add(portalFloor)
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
    addLabel('MAIN ENTRY',mainStart+mm(main.widthMm)/2,2.28,.15,'#2563eb')
    addLabel('DOUBLE-HEIGHT TERRACE',terraceStart+mm(terrace.widthMm)/2,2.35,L-.18,'#0f766e')
    addLabel('TO BALCONY OFFICE',W-.18,2.32,(officeStart+officeEnd)/2,'#7c3aed')
    addLabel('FORMER TOILET DOOR · CLOSED',W-.18,1.55,mm(former.offsetFromNorthMm)+mm(former.widthMm)/2,'#b45309')
    const hemi=new THREE.HemisphereLight('#ffffff','#78838a',1.05);scene.add(hemi)
    const sun=new THREE.DirectionalLight('#fff4dc',1.7);sun.position.set(-2,5,3);sun.castShadow=true;scene.add(sun)
    const fill=new THREE.PointLight('#dbeafe',1.15,9);fill.position.set(W*.55,H*.72,L*.5);scene.add(fill)
    const setCamera=key=>{
      if(key==='top'){camera.position.set(W/2,7,L/2+.01);controls.target.set(W/2,0,L/2);camera.up.set(0,0,-1)}
      else if(key==='office'){camera.position.set(W+4,H*.62,L*.45);controls.target.set(W,H*.4,(officeStart+officeEnd)/2);camera.up.set(0,1,0)}
      else{camera.position.set(W+3.7,H*1.25,L+4);controls.target.set(W/2,H*.42,L/2);camera.up.set(0,1,0)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('overview')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    eastGroup.visible=showEastWall;northGroup.visible=showNorthWall
    sceneRef.current={setCamera,setEastVisible:value=>{eastGroup.visible=value},setNorthVisible:value=>{northGroup.visible=value},setLabelsVisible:value=>{labels.forEach(({sprite})=>{sprite.visible=value})}}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();labels.forEach(({texture})=>texture.dispose());room.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material?.dispose?.()});environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])
  useEffect(()=>{sceneRef.current?.setCamera(preset)},[preset])
  useEffect(()=>{sceneRef.current?.setEastVisible(showEastWall)},[showEastWall])
  useEffect(()=>{sceneRef.current?.setNorthVisible(showNorthWall)},[showNorthWall])
  useEffect(()=>{sceneRef.current?.setLabelsVisible(showLabels)},[showLabels])

  return <section style={{marginTop:24,background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:17,color:'#172033'}}>Interactive study shell</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>3,239 × 4,908 mm · provisional 2,700 mm ceiling · drag to orbit · scroll to zoom</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {[['overview','Overview'],['top','Top'],['office','Office connection']].map(([key,label])=><button key={key} onClick={()=>setPreset(key)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:preset===key?'#172033':'#fff',color:preset===key?'#fff':'#172033',fontWeight:800,cursor:'pointer'}}>{label}</button>)}
        <button onClick={()=>setShowEastWall(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showEastWall?'#fff':'#fee2e2',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showEastWall?'Hide east wall':'Show east wall'}</button>
        <button onClick={()=>setShowNorthWall(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showNorthWall?'#fff':'#fee2e2',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showNorthWall?'Hide north wall':'Show north wall'}</button>
        <button onClick={()=>setShowLabels(value=>!value)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #cbd5e1',background:showLabels?'#dbeafe':'#fff',color:'#172033',fontWeight:800,cursor:'pointer'}}>{showLabels?'Hide labels':'Show labels'}</button>
      </div>
    </div>
    <div ref={mountRef} style={{height:'min(68vh,650px)',minHeight:460,width:'100%'}}/>
  </section>
}
