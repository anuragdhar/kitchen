import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {ENTRY} from './config/entryConfig.js'

export default function BlenderHomeView({room=null}){
  const mountRef=useRef(null)
  const resetRef=useRef(()=>{})
  const interiorRef=useRef(()=>{})
  const rendererRef=useRef(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [lighting,setLighting]=useState('baked')
  const [brightness,setBrightness]=useState(1.5)
  const dedicated=lighting==='baked'&&room?.bakedModel

  useEffect(()=>{
    const mount=mountRef.current
    setError('')
    setLoading(true)
    const scene=new THREE.Scene()
    scene.background=new THREE.Color(dedicated?'#626d78':'#e8e0d5')
    const camera=new THREE.PerspectiveCamera(45,1,.05,200)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=lighting==='baked'?brightness:.85
    rendererRef.current=renderer
    let clippingPlanes=null
    if(room&&!dedicated){
      const [x1,y1,x2,y2]=room.bounds
      const sx=ENTRY.planScale.xMetresPerPixel,sz=ENTRY.planScale.zMetresPerPixel
      const pad=.08
      clippingPlanes=[
        new THREE.Plane(new THREE.Vector3(1,0,0),-x1*sx+pad),
        new THREE.Plane(new THREE.Vector3(-1,0,0),x2*sx+pad),
        new THREE.Plane(new THREE.Vector3(0,0,1),-y1*sz+pad),
        new THREE.Plane(new THREE.Vector3(0,0,-1),y2*sz+pad),
      ]
    }
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer)
    const roomEnvironment=new RoomEnvironment(renderer)
    const environmentTarget=pmrem.fromScene(roomEnvironment,.04)
    const environment=environmentTarget.texture
    roomEnvironment.dispose()
    scene.environment=environment
    if(clippingPlanes)renderer.clippingPlanes=clippingPlanes
    scene.add(new THREE.HemisphereLight('#ffffff','#897f75',.9))
    const sun=new THREE.DirectionalLight('#fff2da',1.25)
    sun.position.set(-8,18,10)
    scene.add(sun)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.enableDamping=true
    let model=null,modelCenter=null,modelSpan=0,disposed=false,raf=0
    const frameModel=()=>{
      if(!modelCenter)return
      const zoomOut=Math.max(1,(room?1.2:.95)/(mount.clientWidth/mount.clientHeight))
      const [dx,dy,dz]=room?.camera||[.55,.95,.8]
      camera.position.set(modelCenter.x+modelSpan*dx*zoomOut,modelCenter.y+modelSpan*dy*zoomOut,modelCenter.z+modelSpan*dz*zoomOut)
      controls.target.copy(modelCenter)
      controls.maxDistance=modelSpan*5
      controls.update()
    }

    const disposeModel=root=>{
      const geometries=new Set(),materials=new Set(),textures=new Set()
      root?.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry)
        for(const material of Array.isArray(object.material)?object.material:[object.material]){
          if(!material)continue
          materials.add(material)
          for(const value of Object.values(material))if(value?.isTexture)textures.add(value)
        }
      })
      textures.forEach(value=>value.dispose())
      materials.forEach(value=>value.dispose())
      geometries.forEach(value=>value.dispose())
    }
    const modelUrl=lighting==='baked'?(room?.bakedModel||'/models/A501-home-baked.glb'):'/models/A501-blender-lighting.glb'
    // Refresh older cached bakes that used a different color encoding.
    new GLTFLoader().load(lighting==='baked'?`${modelUrl}?lighting=v2`:modelUrl,gltf=>{
      if(disposed){disposeModel(gltf.scene);return}
      model=gltf.scene
      // The bake stores linear illumination / 16 in an sRGB PNG. Restore its
      // range once per shared material, and avoid adding diffuse lighting twice.
      const bakedMaterials=new Map()
      model.traverse(object=>{
        const scale=object.userData.bakedLightingScale
        if(!scale||!object.isMesh)return
        const convert=source=>{
          if(!bakedMaterials.has(source)){
            const baked=new THREE.MeshBasicMaterial({
              name:source.name,map:source.emissiveMap,
              // The atlas metadata is authoritative, including older exports
              // without KHR_materials_emissive_strength. Apply it exactly once.
              color:source.emissive.clone().multiplyScalar(scale),side:source.side,
            })
            bakedMaterials.set(source,baked)
          }
          return bakedMaterials.get(source)
        }
        object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material)
        // CAD wall layers can share a plane. Bias the marked finish surface in
        // depth without moving vertices or hiding either authored object.
        if(object.userData.bakedSurfaceOffset){
          const offset=source=>{
            const finish=source.clone()
            finish.polygonOffset=true
            finish.polygonOffsetFactor=object.userData.bakedSurfaceOffset
            finish.polygonOffsetUnits=object.userData.bakedSurfaceOffset
            return finish
          }
          object.material=Array.isArray(object.material)?object.material.map(offset):offset(object.material)
        }
      })
      bakedMaterials.forEach((_,source)=>source.dispose())
      scene.add(model)
      const bounds=new THREE.Box3().setFromObject(model)
      if(dedicated){
        modelCenter=new THREE.Vector3(...room.bakedView.center)
        modelSpan=room.bakedView.span
      }else if(room){
        const [x1,y1,x2,y2]=room.bounds
        const sx=ENTRY.planScale.xMetresPerPixel,sz=ENTRY.planScale.zMetresPerPixel
        modelCenter=new THREE.Vector3((x1+x2)*sx/2,1.2,(y1+y2)*sz/2)
        modelSpan=Math.max((x2-x1)*sx,(y2-y1)*sz,room.cameraSpan||3.5)
      }else{
        modelCenter=bounds.getCenter(new THREE.Vector3())
        const size=bounds.getSize(new THREE.Vector3())
        modelSpan=Math.max(size.x,size.z,1)*1.18
      }
      frameModel()
      setLoading(false)
      renderer.domElement.dataset.sceneReady='true'
    },undefined,()=>{if(!disposed){setLoading(false);setError('Could not load the Blender model. Try Studio lighting or reload the page.')}})
    resetRef.current=frameModel
    interiorRef.current=()=>{
      if(!dedicated||!modelCenter)return
      camera.position.set(...room.bakedView.interiorPosition)
      controls.target.set(...room.bakedView.interiorTarget)
      controls.update()
    }

    const resize=()=>{
      const width=mount.clientWidth,height=mount.clientHeight
      renderer.setSize(width,height,false)
      camera.aspect=width/height
      camera.updateProjectionMatrix()
      frameModel()
    }
    const observer=new ResizeObserver(resize)
    observer.observe(mount)
    resize()
    const render=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render)}
    render()
    return()=>{
      disposed=true
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      resetRef.current=()=>{}
      interiorRef.current=()=>{}
      disposeModel(model)
      environmentTarget.dispose()
      pmrem.dispose()
      renderer.dispose()
      if(rendererRef.current===renderer)rendererRef.current=null
      renderer.domElement.remove()
    }
  },[room,lighting,dedicated])

  // Updating exposure must preserve the current camera and loaded model.
  useEffect(()=>{
    if(rendererRef.current)rendererRef.current.toneMappingExposure=lighting==='baked'?brightness:.85
  },[brightness,lighting])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid #e2e8f0'}}>
      <b style={{fontSize:18,color:'#172033'}}>{room?`${room.name} Blender model`:'Blender lighting model'}</b>
      <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Drag to orbit, scroll or pinch to zoom. Blender lighting preserves the saved scene’s shadows and light pools as you move around. Layout edits appear in the editable view.</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:10}}>
        <label style={{fontSize:13}}>Lighting <select aria-label="Model lighting" value={lighting} onChange={event=>setLighting(event.target.value)} style={{padding:7,marginLeft:6}}>
          <option value="baked">Blender lighting</option>
          <option value="studio">Original studio model</option>
        </select></label>
        {lighting==='baked'&&<label style={{fontSize:13,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          Brightness
          <input aria-label="Model brightness" type="range" min="0.1" max="2" step="0.1" value={brightness} onChange={event=>setBrightness(Number(event.target.value))} style={{width:140}}/>
          <output style={{minWidth:40}}>{Math.round(brightness*100)}%</output>
        </label>}
        <button style={{padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:8,background:'#f8fafc',cursor:'pointer'}} onClick={()=>resetRef.current()} disabled={loading}>Reset view</button>
        {dedicated&&<button style={{padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:8,background:'#f8fafc',cursor:'pointer'}} onClick={()=>interiorRef.current()} disabled={loading}>Eye-level view</button>}
        {loading&&!error&&<span role="status" style={{fontSize:13}}>Loading 3D model…</span>}
      </div>
      {lighting==='baked'&&<div style={{fontSize:12,color:'#64748b',marginTop:7}}>Lighting is precomputed for this layout. Moving furniture or changing lights requires a new lighting bake.</div>}
    </div>
    {error&&<div role="alert" style={{padding:16,color:'#b91c1c'}}>{error}</div>}
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1050px)',width:'100%'}}/>
  </section>
}
