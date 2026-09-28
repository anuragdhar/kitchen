import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {localRenderUrl,validateCurrentRoomResult} from '../render/currentRoomResult.mjs';

const base=import.meta.env.BASE_URL;
const button={padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:'#fff',color:'#172033',fontWeight:700,cursor:'pointer'};

function disposeModel(model){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  model?.traverse(object=>{
    if(object.geometry)geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!material)continue;
      materials.add(material);
      for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    }
  });
  textures.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());geometries.forEach(value=>value.dispose());
}

function SnapshotCanvas({result}){
  const mountRef=useRef(null),actions=useRef(null);
  const [status,setStatus]=useState('Loading the checked render-input model…');
  useEffect(()=>{
    const mount=mountRef.current,abort=new AbortController();
    let active=true,model,frame=0,renderer,environment,pmrem,observer,controls;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#edf3f7');
    const bounds=new THREE.Box3(new THREE.Vector3(...result.bounds.min),new THREE.Vector3(...result.bounds.max));
    const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),span=Math.max(.1,size.length());
    const source=result.camera;
    let verticalSpan=source.verticalSpan||span;
    const camera=source.type==='orthographic'?new THREE.OrthographicCamera(-1,1,1,-1,.01,Math.max(100,span*20)):new THREE.PerspectiveCamera(source.fov,source.aspect,.01,Math.max(100,span*20));
    const invalidate=()=>{if(active&&!frame)frame=requestAnimationFrame(draw);};
    const draw=()=>{frame=0;if(!active)return;const moving=controls.update();renderer.render(scene,camera);if(moving)invalidate();};
    const resize=()=>{
      const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight),aspect=width/height;
      renderer.setSize(width,height,false);
      if(camera.isOrthographicCamera){camera.left=-verticalSpan*aspect/2;camera.right=verticalSpan*aspect/2;camera.top=verticalSpan/2;camera.bottom=-verticalSpan/2;}
      else camera.aspect=aspect;
      camera.updateProjectionMatrix();invalidate();
    };
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
      mount.appendChild(renderer.domElement);
      pmrem=new THREE.PMREMGenerator(renderer);
      const roomEnvironment=new RoomEnvironment(renderer);
      environment=pmrem.fromScene(roomEnvironment,.04).texture;roomEnvironment.dispose();scene.environment=environment;
      scene.add(new THREE.HemisphereLight('#ffffff','#8897a4',1.5));
      const light=new THREE.DirectionalLight('#fff7eb',2);light.position.copy(center).add(new THREE.Vector3(span,span,span));scene.add(light);
      controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.15;controls.maxDistance=span*10;
      controls.addEventListener('change',invalidate);
      actions.current={
        source(){
          verticalSpan=source.verticalSpan||span;
          camera.position.fromArray(source.position);camera.quaternion.fromArray(source.quaternion);
          const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
          controls.target.copy(camera.position).addScaledVector(forward,Math.max(.5,camera.position.distanceTo(center)));
          controls.update();resize();
        },
        overview(){
          verticalSpan=Math.max(size.y,size.x,size.z)*1.3;
          const distance=span/(2*Math.sin(THREE.MathUtils.degToRad((camera.fov||45)/2)));
          camera.position.copy(center).addScaledVector(new THREE.Vector3(1,.7,1).normalize(),distance);
          controls.target.copy(center);camera.lookAt(center);controls.update();resize();
        },
      };
      observer=new ResizeObserver(resize);observer.observe(mount);actions.current.source();
      (async()=>{
        const response=await fetch(localRenderUrl(base,result.model.url),{signal:abort.signal});
        if(!response.ok)throw Error('The matching room model is missing. Regenerate this room; the old whole-home bake will not be substituted.');
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength>512*1024*1024)throw Error('Room model exceeds the supported size.');
        if(!globalThis.crypto?.subtle)throw Error('Open the local server on localhost or HTTPS to verify the model checksum.');
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');
        if(hash!==result.model.sha256)throw Error('The downloaded model does not match the Blender render. Regenerate the room.');
        if(!active)return;
        const gltf=await new GLTFLoader().parseAsync(bytes,'');
        if(!active){disposeModel(gltf.scene);return;}
        model=gltf.scene;
        // This is already a complete room in metres. Do not crop by the old
        // whole-home plan rectangle or reposition/scale its individual objects.
        scene.add(model);setStatus('Geometry matches the checked Blender input.');invalidate();
      })().catch(error=>{if(active&&error.name!=='AbortError')setStatus(error.message);});
    }catch(error){setStatus(error.message);}
    return()=>{
      active=false;abort.abort();cancelAnimationFrame(frame);observer?.disconnect();
      controls?.removeEventListener('change',invalidate);controls?.dispose();disposeModel(model);
      environment?.dispose();pmrem?.dispose();renderer?.dispose();renderer?.domElement.remove();actions.current=null;
    };
  },[result]);
  return <>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      <button style={button} onClick={()=>actions.current?.source()}>Source camera</button>
      <button style={button} onClick={()=>actions.current?.overview()}>Full model including projections</button>
    </div>
    <div ref={mountRef} style={{height:'clamp(420px,65vh,800px)',width:'100%',borderRadius:12,overflow:'hidden'}}/>
    <p role="status" aria-live="polite">{status}</p>
  </>;
}

export default function CurrentRoomBlenderView({room,mode='model'}){
  const [result,setResult]=useState(null),[message,setMessage]=useState('Loading the latest completed room result…'),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const abort=new AbortController();setResult(null);setMessage('Loading the latest completed room result…');
    (async()=>{
      const response=await fetch(localRenderUrl(base,`/renders/current/${room.key}.json`),{cache:'no-store',signal:abort.signal});
      if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('This room has not yet been regenerated from its editable workspace. No obsolete Blender snapshot is shown.');
      const value=validateCurrentRoomResult(await response.json(),room.key);
      if(!abort.signal.aborted){setResult(value);setMessage('');}
    })().catch(error=>{if(!abort.signal.aborted)setMessage(error.message);});
    return()=>abort.abort();
  },[room.key,revision]);
  return <section style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:22,padding:16,color:'#172033'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}>
      <h1 style={{fontSize:22,margin:'0 0 8px'}}>{room.name} · {mode==='render'?'Blender render':'Blender input model'}</h1>
      <button style={button} onClick={()=>setRevision(value=>value+1)}>Reload completed result</button>
    </div>
    <p>The model and Cycles images use the same checked editable-room snapshot, including geometry outside the room walls. Later workspace edits require a new export and render.</p>
    {message&&<p role="status" aria-live="polite">{message}</p>}
    {!result&&<div>
      <p>For repository defaults, run from the repository root:</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>python scripts/render_archviz_rooms.py --export-defaults --rooms {room.key} --quality draft</pre>
      <p>For your saved edits, export this room through Interior studio, then use <code>--input "path/to/exports"</code> without <code>--export-defaults</code>. Bedroom 3’s <strong>Balcony door + window</strong> view includes the south openings.</p>
    </div>}
    {result&&<>
      <p><small>Job {result.job} · {result.quality} · {result.reviewStatus||'unreviewed'} · snapshot {result.capturedAt||'date unavailable'}</small></p>
      {mode==='model'?<>
        <p><strong>Interactive studio shading, not baked Cycles lighting.</strong> The Blender render tab shows the actual rendered lighting. Drag to orbit; scroll to zoom.</p>
        <SnapshotCanvas key={result.job} result={result}/>
      </>:<div style={{display:'grid',gap:18}}>{result.images.map(image=><figure key={image.url} style={{margin:0}}>
        <img src={localRenderUrl(base,image.url)} alt={`${room.name}: ${image.label}`} loading="lazy" style={{display:'block',width:'100%',maxWidth:1440,height:'auto',borderRadius:12}}/>
        <figcaption style={{marginTop:6}}>{image.label}</figcaption>
      </figure>)}</div>}
      <p><small>The geometry audit checks object bounds and triangle counts. It is not a visual-approval or construction-clearance certificate.</small></p>
    </>}
  </section>;
}
