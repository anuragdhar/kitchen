import React,{useEffect,useRef,useState} from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'

export default function BlenderHomeView(){
  const mountRef=useRef(null)
  const [error,setError]=useState('')

  useEffect(()=>{
    const mount=mountRef.current
    const scene=new THREE.Scene()
    scene.background=new THREE.Color('#e8e0d5')
    const camera=new THREE.PerspectiveCamera(45,1,.05,200)
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=.85
    mount.appendChild(renderer.domElement)
    const pmrem=new THREE.PMREMGenerator(renderer)
    const environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture
    scene.environment=environment
    scene.add(new THREE.HemisphereLight('#ffffff','#897f75',.9))
    const sun=new THREE.DirectionalLight('#fff2da',1.25)
    sun.position.set(-8,18,10)
    scene.add(sun)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.enableDamping=true
    let model=null,modelCenter=null,modelSpan=0,disposed=false,raf=0
    const frameModel=()=>{
      if(!modelCenter)return
      const zoomOut=Math.max(1,.95/(mount.clientWidth/mount.clientHeight))
      camera.position.set(modelCenter.x+modelSpan*.55*zoomOut,modelCenter.y+modelSpan*.95*zoomOut,modelCenter.z+modelSpan*.8*zoomOut)
      controls.target.copy(modelCenter)
      controls.maxDistance=modelSpan*5
      controls.update()
    }

    new GLTFLoader().load('/models/A501-blender-lighting.glb',gltf=>{
      if(disposed)return
      model=gltf.scene
      scene.add(model)
      const bounds=new THREE.Box3().setFromObject(model)
      modelCenter=bounds.getCenter(new THREE.Vector3())
      const size=bounds.getSize(new THREE.Vector3())
      modelSpan=Math.max(size.x,size.z,1)
      frameModel()
    },undefined,()=>{if(!disposed)setError('Could not load the Blender model.')})

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
      model?.traverse(object=>{
        object.geometry?.dispose?.()
        const materials=Array.isArray(object.material)?object.material:[object.material]
        materials.forEach(material=>{
          if(!material)return
          for(const value of Object.values(material))if(value?.isTexture)value.dispose()
          material.dispose()
        })
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  },[])

  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 42px rgba(23,32,51,.1)'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid #e2e8f0'}}>
      <b style={{fontSize:18,color:'#172033'}}>Blender lighting model</b>
      <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Drag to orbit and scroll to zoom. This is an exported Blender scene; saved design edits appear in Editable 3D. Photoreal lighting is in Blender renders.</div>
    </div>
    {error&&<div role="alert" style={{padding:16,color:'#b91c1c'}}>{error}</div>}
    <div ref={mountRef} style={{height:'clamp(620px,82vh,1050px)',width:'100%'}}/>
  </section>
}
