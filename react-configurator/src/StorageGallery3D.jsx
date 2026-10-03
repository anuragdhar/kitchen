import {registerInteriorScene} from './render/interiorScene.js'
import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {createStoreStorage} from './rooms/shared/StoreStorage.js'
import {KITCHEN_REFRIGERATOR as FRIDGE} from './config/kitchenConfig.js'
import {createDesignerRender} from './render/designerRender.js'
import {useDesignerRender} from './render/useDesignerRender.js'

export default function StorageGallery3D(){
 const mountRef=useRef(null),sceneRef=useRef(null)
 const designer=useDesignerRender(sceneRef)
 const [open,setOpen]=useState(false)
 useEffect(()=>{
  const mount=mountRef.current,scene=new THREE.Scene();scene.background=new THREE.Color('#f0ede7')
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));mount.appendChild(renderer.domElement)
  const camera=new THREE.PerspectiveCamera(45,1,.01,50),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
  const designerRender=createDesignerRender(renderer,scene,camera,{enabled:designer.ref.current})
  const model=createStoreStorage();scene.add(model)
  const box=(w,h,d,x,y,z,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.6}));mesh.position.set(x,y,z);scene.add(mesh)}
  box(3,.04,2.5,1,.0,1.1,'#d7c9b5')
  const f=FRIDGE,fx=f.fromKitchenWestMm/1000,fz=f.southWallThicknessMm/1000
  box(f.depthMm/1000,f.heightMm/1000,f.widthMm/1000,fx+f.depthMm/2000,f.heightMm/2000,fz+f.widthMm/2000,'#aeb3b7')
  for(let i=0;i<2;i++)box(.025,f.heightMm/1000-.025,f.widthMm/2000-.012,fx-.012,f.heightMm/2000,fz+(i+.5)*f.widthMm/2000,'#c5c9cc')
  scene.add(new THREE.HemisphereLight('#ffffff','#8a8175',2))
  const light=new THREE.DirectionalLight('#fff1d6',3);light.position.set(-2,5,3);scene.add(light)
  const setView=view=>{controls.target.set(1.25,.9,1.2);camera.up.set(0,1,0);if(view==='top'){camera.position.set(1.25,6,1.2);camera.up.set(0,0,1)}else if(view==='front')camera.position.set(-3,1.5,1.2);else camera.position.set(-2.5,3.2,3.9);camera.lookAt(controls.target);controls.update()}
  setView('overview')
  const resize=()=>{renderer.setSize(mount.clientWidth,mount.clientHeight);designerRender.setSize(mount.clientWidth,mount.clientHeight);camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(mount);resize()
  const interiorScene=registerInteriorScene({id:'storage',scene,camera,renderer,zones:[{id:'storage',min:[0,0,0],max:[3,2.7,2.5]}]})
  let raf;const render=()=>{controls.update();designerRender.render();raf=requestAnimationFrame(render)};render()
  sceneRef.current={setDesigner:on=>designerRender.setEnabled(on),setView,setOpen:model.userData.setCoverOpen}
  return()=>{interiorScene.dispose();cancelAnimationFrame(raf);designerRender.dispose();observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});renderer.dispose();renderer.domElement.remove();sceneRef.current=null}
 },[])
 useEffect(()=>{sceneRef.current?.setOpen(open)},[open])
 const style={padding:'9px 14px',borderRadius:8,border:'1px solid #b6a793',background:'#fff',cursor:'pointer'}
 return <main className="storage-workspace" style={{padding:'24px clamp(18px,3vw,48px)'}}><style>{`@media(min-width:1500px){.storage-workspace{padding-left:280px!important}}`}</style><h1>Storage beside the fridge</h1><p>Two sideways rolling racks · sliding cover parks toward the fridge</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button style={style} onClick={()=>setOpen(v=>!v)}>{open?'Close storage cover':'Open storage cover'}</button>{['overview','front','top'].map(v=><button key={v} style={style} onClick={()=>sceneRef.current?.setView(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div><div ref={mountRef} style={{height:'75vh',minHeight:500,marginTop:12,borderRadius:16,overflow:'hidden'}}/><p>The parked cover sits in front of the fridge area; close it before fully opening the fridge doors.</p></main>
}
