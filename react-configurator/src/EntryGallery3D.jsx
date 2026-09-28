import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {ENTRY,ENTRY_WALL_SEGMENTS} from './config/entryConfig.js'
import {createEntryArrivalDoor} from './EntryArrivalDoor.js'
import {createEntryRecessStorage} from './EntryRecessStorage.js'

const buttonStyle=active=>({padding:'7px 11px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'})

export default function EntryGallery3D(){
  const [view,setView]=useState('overview')
  const mountRef=useRef(null),sceneRef=useRef(null)

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount)return
    const {planBounds,planScale}=ENTRY
    const x=planX=>(planX-planBounds.x1)*planScale.xMetresPerPixel
    const z=planY=>(planY-planBounds.y1)*planScale.zMetresPerPixel
    const width=x(planBounds.x2),length=z(planBounds.y2),height=ENTRY.wallHeightMm/1000
    const scene=new THREE.Scene();scene.background=new THREE.Color('#eef3f6')
    const camera=new THREE.PerspectiveCamera(47,1,.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.2));renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;renderer.shadowMap.enabled=true
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    const model=new THREE.Group();scene.add(model)
    const floorMaterial=new THREE.MeshStandardMaterial({color:'#bda890',roughness:.84})
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#d3ccc2',roughness:.85})
    const timber=new THREE.MeshStandardMaterial({color:'#aa7b56',roughness:.68})
    const doorMaterial=new THREE.MeshStandardMaterial({color:'#825d44',roughness:.63})
    const metal=new THREE.MeshStandardMaterial({color:'#ad936a',metalness:.67,roughness:.3})
    const addBox=(w,h,d,cx,cy,cz,material,parent=model)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
      mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
      return mesh
    }
    addBox(width,.06,length,width/2,-.03,length/2,floorMaterial)
    const addSpan=([x1,y1,x2,y2],bottom=0,top=height)=>{
      const a=x(x1),b=x(x2),c=z(y1),d=z(y2),span=Math.hypot(b-a,d-c)
      if(span<.01||top<=bottom)return
      const mesh=addBox(span,top-bottom,.085,(a+b)/2,(bottom+top)/2,(c+d)/2,wallMaterial)
      mesh.rotation.y=-Math.atan2(d-c,b-a)
    }
    ENTRY_WALL_SEGMENTS.forEach(segment=>addSpan(segment))
    model.add(createEntryArrivalDoor(x,z))
    model.add(createEntryRecessStorage(x,z))
    const outer=ENTRY.outerEntryOpening
    addSpan([outer.wallPlanX,outer.fromPlanY,outer.wallPlanX,outer.toPlanY],outer.heightMm/1000,height)
    const inner=ENTRY.innerOpening
    addSpan([inner.fromPlanX,inner.wallPlanY,inner.toPlanX,inner.wallPlanY],inner.heightMm/1000,height)

    const rack=ENTRY.shoeRack,rackWidth=rack.widthMm/1000,rackDepth=rack.projectionMm/1000,rackHeight=rack.heightMm/1000
    const rackX=x((rack.planX1+rack.planX2)/2),rackFront=z(rack.planNorthY)-.005
    addBox(rackWidth,rackHeight,rackDepth,rackX,rackHeight/2,rackFront+rackDepth/2,timber)
    for(let i=0;i<rack.doorCount;i++){
      const panelWidth=rackWidth/rack.doorCount,panelX=rackX-rackWidth/2+(i+.5)*panelWidth
      addBox(panelWidth-.012,rackHeight-.06,.024,panelX,rackHeight/2,rackFront-.012,doorMaterial)
      addBox(.025,.24,.026,panelX+(i===0?.11:-.11),1.08,rackFront-.04,metal)
    }

    // Door into the Drawing Room is at the south end of this plan-shaped entry.
    const innerWidth=x(inner.toPlanX)-x(inner.fromPlanX)
    const leafWidth=Math.min(ENTRY.mainDoorWidthMm/1000,innerWidth-.08)
    const leaf=new THREE.Group();leaf.position.set(x(inner.toPlanX)-.035,0,0);leaf.rotation.y=1.02;model.add(leaf)
    addBox(leafWidth,inner.heightMm/1000-.07,.045,-leafWidth/2,(inner.heightMm/1000-.07)/2,0,doorMaterial,leaf)
    addBox(.07,.025,.065,-leafWidth+.17,1.05,.045,metal,leaf)

    const labelTextures=[]
    const addLabel=(label,cx,cy,cz,scale=1)=>{
      const canvas=document.createElement('canvas');canvas.width=360;canvas.height=96
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.roundRect(4,4,352,88,18);ctx.fill();ctx.fillStyle='#172033';ctx.font='bold 25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,180,48)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;labelTextures.push(texture)
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(cx,cy,cz);sprite.scale.set(scale,scale*.27,1);sprite.renderOrder=1000;model.add(sprite)
    }
    addLabel('TO DRAWING ROOM',x((inner.fromPlanX+inner.toPlanX)/2),2.42,.22,1.12)
    addLabel('ENTRY SHAFT',x((ENTRY.shaft.planX1+ENTRY.shaft.planX2)/2),2.44,z((ENTRY.shaft.planY1+ENTRY.shaft.planY2)/2),.95)
    addLabel('OUTER ENTRY',width-.2,2.48,z((outer.fromPlanY+outer.toPlanY)/2),.92)
    addLabel('SHOE RACK',rackX,rackHeight+.18,rackFront+.08,.9)
    scene.add(new THREE.HemisphereLight('#ffffff','#78909c',1))
    const sun=new THREE.DirectionalLight('#fff3dc',1.3);sun.position.set(-2,7,4);sun.castShadow=true;scene.add(sun)
    const setCamera=key=>{
      if(key==='top'){camera.position.set(width/2,10.3,length/2+.01);camera.up.set(0,0,-1);controls.target.set(width/2,0,length/2)}
      else{camera.position.set(width/2+3.2,8.6,length+4.3);camera.up.set(0,1,0);controls.target.set(width/2,.55,length/2)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('overview')
    const resize=()=>{const viewportWidth=mount.clientWidth,viewportHeight=mount.clientHeight;renderer.setSize(viewportWidth,viewportHeight,false);camera.aspect=viewportWidth/viewportHeight;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    sceneRef.current={setCamera}
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();labelTextures.forEach(texture=>texture.dispose());model.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose?.()});environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
  },[])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Northwest entry gallery</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>Outward-opening arrival door · shaft · shoe rack · door to Drawing Room</div></div>
      <div style={{display:'flex',gap:7}}><button onClick={()=>setView('overview')} style={buttonStyle(view==='overview')}>Overview</button><button onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button></div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1100px)',width:'100%'}}/>
    <div style={{padding:'0 16px 15px',fontSize:12,color:'#64748b'}}>S ↑ · N ↓ · E ← · W → · This view uses the same entry wall coordinates as Whole home 3D.</div>
  </section>
}
