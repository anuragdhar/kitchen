import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import JSZip from 'jszip';
import {getInteriorScene} from './interiorScene.js';
import {validateCapture,validRoom} from './archvizContract.mjs';

const MATERIAL_KEYS=['interiorRole','interiorRoom','interiorMaterialId'];
const excluded=o=>o.userData?.interiorFixture || o.userData?.archvizExclude || o.isSprite || o.isLine || o.isPoints || o.isLight || o.isCamera || o.isHelper;
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const cleanMetadata=data=>Object.fromEntries(MATERIAL_KEYS.filter(key=>typeof data?.[key]==='string').map(key=>[key,data[key]]));

/** Snapshot actual visible meshes, never rebuild a room from a second set of dimensions.
 * Stand-ins, labels and the proposed-lighting overlay are not architecture.
 * Animated/skinned/instanced meshes fail explicitly rather than silently exporting a wrong pose.
 */
export function captureInteriorScene(record,room){
  if(!validRoom(room)) throw Error('Choose a valid room.');
  if(!record?.ready || record.errors?.length) throw Error(record?.errors?.join('; ') || 'Wait for the editable room materials to finish loading.');
  if(!Number.isFinite(record.metresPerUnit) || record.metresPerUnit<=0) throw Error('The renderer has no valid unit scale.');
  const source=record.scene,unit=record.metresPerUnit;
  source.updateMatrixWorld(true);record.camera.updateMatrixWorld(true);
  const scene=new THREE.Scene();scene.name=`A501 current design - ${room}`;
  const meshes=[],geometries=[],materials=[],warnings=[];
  const scale=new THREE.Matrix4().makeScale(unit,unit,unit);
  let skipped=0;
  const walk=(object,path,visible=true)=>{
    visible=visible && object.visible;
    if(!visible || excluded(object)){skipped++;return;}
    if(object.isMesh){
      if(object.isSkinnedMesh || object.isInstancedMesh || object.morphTargetInfluences?.some(value=>value!==0)) throw Error(`Unsupported animated/instanced object: ${object.name || path}. Hide it before exporting.`);
      const original=Array.isArray(object.material)?object.material:[object.material];
      if(original.some(m=>m?.userData?.bakedLightingScale) || object.userData?.bakedLightingScale) throw Error('Baked lighting cannot be relit. Export the Editable workspace, not a baked preview.');
      if(original.some(m=>!m || m.wireframe || m.depthTest===false)){skipped++;return;}
      const geometry=object.geometry.clone();geometries.push(geometry);
      const count=geometry.index?.count ?? geometry.attributes.position?.count;
      // Exporting partial draw ranges or unused material groups changes the geometry audit.
      if(!count || count%3 || geometry.drawRange.start!==0 || (Number.isFinite(geometry.drawRange.count) && geometry.drawRange.count<count)) throw Error(`Partial/non-triangular geometry: ${object.name || path}`);
      if(Array.isArray(object.material)){
        const groups=[...geometry.groups].sort((a,b)=>a.start-b.start);
        let next=0;for(const group of groups){if(group.start!==next || group.count%3) throw Error('Non-contiguous material groups cannot be audited.');next+=group.count;}
        if(next!==count) throw Error('Material groups do not cover the source mesh.');
      }
      const copied=original.map(material=>{
        const copy=material.clone();materials.push(copy);copy.userData=cleanMetadata(material.userData);
        return copy;
      });
      const mesh=new THREE.Mesh(geometry,Array.isArray(object.material)?copied:copied[0]);
      mesh.name=object.name || `Source mesh ${meshes.length+1}`;
      mesh.matrixAutoUpdate=false;mesh.matrix.multiplyMatrices(scale,object.matrixWorld);
      const id=`mesh-${path}`;
      mesh.userData={archvizSourceId:id,sourceName:mesh.name,sourceScene:record.id};
      scene.add(mesh);mesh.updateMatrixWorld(true);
      // Match actual vertices, not the transformed corners of a rotated local bounding box.
      const box=new THREE.Box3().setFromObject(mesh,true);
      meshes.push({id,name:mesh.name,min:box.min.toArray(),max:box.max.toArray(),triangles:count/3,
        roles:copied.map(m=>m.userData),transparent:copied.some(m=>m.transmission>.2)});
    }
    object.children.forEach((child,index)=>walk(child,`${path}-${index}`,visible));
  };
  try{walk(source,'0');if(!meshes.length) throw Error('No visible editable meshes found.');}
  catch(error){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());throw error;}
  const camera=record.camera;
  const cameraInfo={type:camera.isOrthographicCamera?'orthographic':'perspective',
    position:camera.getWorldPosition(new THREE.Vector3()).multiplyScalar(unit).toArray(),
    quaternion:camera.getWorldQuaternion(new THREE.Quaternion()).toArray(),
    fov:camera.getEffectiveFOV?.() ?? camera.fov ?? 45,aspect:camera.aspect ?? record.renderer.domElement.width/record.renderer.domElement.height,
    verticalSpan:camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom*unit:null};
  warnings.push('Visibility is the current editable view: hidden walls/doors remain hidden. Set the intended view before exporting.');
  warnings.push('Browser environment lighting is not transported by glTF. The Blender studio uses a separate documented lighting treatment.');
  return {scene,meshes,camera:cameraInfo,warnings,skipped,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}

export async function exportArchvizBundle(sceneId,room){
  const record=getInteriorScene(sceneId);
  if(!record) throw Error('Open the room’s Editable workspace and its 3D view first.');
  await record.whenReady;
  if(getInteriorScene(sceneId)!==record) throw Error('The room changed while preparing the export.');
  const revision=record.revision;
  const capture=captureInteriorScene(record,room);
  try{
    // Capture before asynchronous export so the photograph corresponds to the snapshot.
    record.renderer.render(record.scene,record.camera);
    const reference=await new Promise(resolve=>record.renderer.domElement.toBlob(resolve,'image/png'));
    const buffer=await new GLTFExporter().parseAsync(capture.scene,{binary:true,onlyVisible:true,trs:false,includeCustomExtensions:false,maxTextureSize:4096});
    if(getInteriorScene(sceneId)!==record || record.revision!==revision || !record.ready) throw Error('The room or finishes changed during export. Export again.');
    if(!(buffer instanceof ArrayBuffer)) throw Error('The exporter did not produce a binary glTF.');
    const manifest=validateCapture({schema:'a501.archviz-source',version:1,room,sceneId,units:'metres',axes:'GLTF_Y_UP',
      metresPerSourceUnit:record.metresPerUnit,glbSha256:await digest(buffer),camera:capture.camera,meshes:capture.meshes,
      capturedAt:new Date().toISOString(),appearanceRevision:revision,warnings:capture.warnings,excludedNodes:capture.skipped});
    if(!reference) manifest.warnings.push('Browser reference screenshot was unavailable.');
    const zip=new JSZip();zip.file('scene.glb',buffer);zip.file('scene.json',JSON.stringify(manifest,null,2)+'\n');
    if(reference) zip.file('reference.png',reference);
    zip.file('README.txt',`A501 ${room}: actual editable geometry, not the archived whole-home Blender scene.\nExtract this folder and run from the repository root:\nblender --background --python-exit-code 1 --python blender/render_archviz.py -- --bundle "path/to/this/folder" --quality draft\nOr pass this ZIP directly. Read docs/ROOM_ARCHVIZ.md.\n`);
    return {blob:await zip.generateAsync({type:'blob',compression:'STORE'}),manifest};
  }finally{capture.dispose();}
}
export function downloadArchvizBundle(blob,room){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`A501-${room}-archviz.zip`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
