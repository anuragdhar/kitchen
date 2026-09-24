import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {ENTRY} from './config/entryConfig.js'

const mm=value=>value/1000
const buttonStyle=active=>({padding:'7px 11px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'})

export default function EntryGallery3D(){
  const [view,setView]=useState('overview')
  const mountRef=useRef(null)
  const sceneRef=useRef(null)

  useEffect(()=>{
    const mount=mountRef.current
    if(!mount) return
    const approach=mm(ENTRY.approachLengthMm),passage=mm(ENTRY.clearWidthMm),doorWidth=mm(ENTRY.mainDoorWidthMm),height=mm(ENTRY.wallHeightMm)
    const scene=new THREE.Scene();scene.background=new THREE.Color('#eef3f6')
    const camera=new THREE.PerspectiveCamera(46,1,.01,100)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2.2))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1
    renderer.shadowMap.enabled=true
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
    const model=new THREE.Group();scene.add(model)
    const floorMaterial=new THREE.MeshStandardMaterial({color:'#d9d0c4',roughness:.8})
    const insideFloorMaterial=new THREE.MeshStandardMaterial({color:'#c6d4cf',roughness:.8})
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#ede9e1',roughness:.83})
    const frameMaterial=new THREE.MeshStandardMaterial({color:'#f7f4ed',roughness:.62})
    const doorMaterial=new THREE.MeshStandardMaterial({color:'#855b42',roughness:.62})
    const shoeMaterial=new THREE.MeshStandardMaterial({color:'#a87956',roughness:.7})
    const metalMaterial=new THREE.MeshStandardMaterial({color:'#c4a46b',metalness:.72,roughness:.28})
    const addBox=(w,h,d,x,y,z,material,parent=model)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
      return mesh
    }

    // The northwest approach follows the 2134 mm entry run, then turns south into the home.
    addBox(approach,.065,passage,approach/2,-.033,passage/2,floorMaterial)
    addBox(1.1,.065,2.35,approach+.55,-.033,1.175,insideFloorMaterial)
    addBox(approach,.16,.08,approach/2,.08,-.04,wallMaterial)
    addBox(.08,1.1,passage,.04,.55,passage/2,wallMaterial)

    // Shoe storage sits beside the approach, outside the 1000 mm clear walking strip.
    addBox(1.72,.83,.42,.95,.415,passage+.24,shoeMaterial)
    addBox(1.78,.05,.48,.95,.855,passage+.24,doorMaterial)
    for(const x of [.38,.95,1.52]) addBox(.025,.69,.025,x,.425,passage+.455,frameMaterial)

    // Main entrance door at the inner end of the entry run.
    const doorLeft=(passage-doorWidth)/2,doorRight=doorLeft+doorWidth,doorHeight=2.2
    for(const z of [doorLeft,doorRight]) addBox(.1,doorHeight,.08,approach,doorHeight/2,z,frameMaterial)
    addBox(.1,height-doorHeight,passage,approach,(height+doorHeight)/2,passage/2,wallMaterial)
    addBox(.12,.045,passage,approach,.022,passage/2,frameMaterial)
    const hinge=new THREE.Group();hinge.position.set(approach,0,doorLeft+.03);model.add(hinge)
    addBox(.045,doorHeight-.07,doorWidth-.09,.02,(doorHeight-.07)/2,(doorWidth-.09)/2,doorMaterial,hinge)
    addBox(.075,.03,.075,.06,1.02,doorWidth-.2,metalMaterial,hinge)
    hinge.rotation.y=1.02

    model.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(.2,.09,passage/2),approach-.47,0x2563eb,.18,.11))
    model.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(approach+.55,.09,.56),1.33,0x2563eb,.18,.11))
    const labelTextures=[]
    const addLabel=(label,x,y,z,width=1.1)=>{
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=96
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(4,4,312,88,18);ctx.fill();ctx.fillStyle='#172033';ctx.font='bold 27px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,160,48)
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;labelTextures.push(texture)
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width*.3,1);sprite.renderOrder=1000;model.add(sprite)
    }
    addLabel('NORTHWEST ENTRY',.42,.18,.17,1.15)
    addLabel('MAIN DOOR',approach,2.48,passage/2,1.15)
    addLabel('SHOE AREA',.95,1.02,passage+.24,.94)
    addLabel('RIGHT TURN',approach+.55,.16,1.86,1.05)
    scene.add(new THREE.HemisphereLight('#ffffff','#78909c',1.15))
    const sun=new THREE.DirectionalLight('#fff3dc',1.7);sun.position.set(-2,7,4);sun.castShadow=true;scene.add(sun)
    const setCamera=key=>{
      if(key==='top'){camera.position.set(1.65,6,1.15);camera.up.set(0,0,1);controls.target.set(1.65,0,1.15)}
      else{camera.position.set(4.55,5.45,-2.65);camera.up.set(0,1,0);controls.target.set(1.65,.45,1.05)}
      camera.lookAt(controls.target);controls.update()
    }
    setCamera('overview')
    const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(mount);resize()
    let raf=0;const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)};render()
    sceneRef.current={setCamera}
    return()=>{
      cancelAnimationFrame(raf);observer.disconnect();controls.dispose()
      labelTextures.forEach(texture=>texture.dispose())
      model.traverse(object=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose?.()})
      environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();sceneRef.current=null
    }
  },[])

  useEffect(()=>{sceneRef.current?.setCamera(view)},[view])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',borderBottom:'1px solid #e2e8f0'}}>
      <div><b style={{fontSize:18,color:'#172033'}}>Northwest entry gallery</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>2,134 mm approach · 1,000 mm clear passage · main entrance door</div></div>
      <div style={{display:'flex',gap:7}}><button onClick={()=>setView('overview')} style={buttonStyle(view==='overview')}>Overview</button><button onClick={()=>setView('top')} style={buttonStyle(view==='top')}>Top</button></div>
    </div>
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1100px)',width:'100%'}}/>
    <div style={{padding:'0 16px 15px',fontSize:12,color:'#64748b'}}>S ↑ · N ↓ · E ← · W → · Blue arrows show the approach and the right turn into the home.</div>
  </section>
}
