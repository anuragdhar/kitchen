import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import JSZip from 'jszip';
import {getInteriorScene} from './interiorScene.js';
import {appearanceStore} from '../home/appearanceStore.mjs';
import {lightingStore} from '../home/lightingStore.mjs';
import {RENDER_CAMERA,validateRenderJob,RENDER_QUALITIES} from '../home/renderJob.mjs';
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
/** Export the actual mounted scene, not boxes regenerated from a second layout definition. */
export async function buildBlenderBundle(id,{quality='balanced'}={}){
 if(!Object.hasOwn(RENDER_QUALITIES,quality))throw Error('Unknown render quality.');
 const record=getInteriorScene(id);if(!record)throw Error('Open this room in 3D before exporting.');
 await record.whenReady;if(!record.ready||record.errors.length)throw Error('Materials are not ready: '+record.errors.join('; '));
 const appearanceRevision=appearanceStore.getRevision(),lightingRevision=lightingStore.getRevision();
 const root=new THREE.Scene();root.name='Home Interior';const unit=record.metresPerUnit;
 const scale=new THREE.Matrix4().makeScale(unit,unit,unit),materials=new Map(),ownedGeometry=[];let meshCount=0,vertices=0;const punctualLights=[];
 const position=o=>o.getWorldPosition(new THREE.Vector3()).multiplyScalar(unit).toArray();
 try{
  record.scene.updateMatrixWorld(true);record.camera.updateMatrixWorld(true);
  record.scene.traverse(object=>{
   if(!visible(object))return;
   if(object.isMesh){
    if(object.isSkinnedMesh||object.isInstancedMesh)throw Error('This exporter requires a resolved mesh for skinned/instanced objects.');
    const materialList=Array.isArray(object.material)?object.material:[object.material];
    const copied=materialList.map(m=>{if(!materials.has(m.uuid)){const c=m.clone();c.userData={interiorRole:m.userData?.interiorRole||'',interiorRoom:m.userData?.interiorRoom||'',interiorMaterialId:m.userData?.interiorMaterialId||''};materials.set(m.uuid,c);}return materials.get(m.uuid);});
    const geometry=object.geometry.clone();ownedGeometry.push(geometry);
    const mesh=new THREE.Mesh(geometry,Array.isArray(object.material)?copied:copied[0]);mesh.name=object.name||`mesh-${meshCount}`;mesh.matrixAutoUpdate=false;mesh.matrix.copy(scale).multiply(object.matrixWorld);mesh.userData={sourceName:object.name||'',interiorFixture:!!object.userData.interiorFixture};root.add(mesh);
    meshCount++;vertices+=geometry.getAttribute('position')?.count||0;
   }else if(object.isLight&&object.intensity>0&&!object.userData.interiorFixture&&['DirectionalLight','PointLight','SpotLight'].includes(object.type)){
    const target=object.target?position(object.target):position(object).map((v,i)=>i===1?v-1:v);
    punctualLights.push({type:object.isDirectionalLight?'sun':object.isSpotLight?'spot':'point',position:position(object),target,color:object.color.toArray(),intensity:object.isDirectionalLight?object.intensity:object.intensity*unit*unit});
   }
  });
  if(!meshCount)throw Error('No visible mesh geometry to export.');
  const camera=record.camera.clone();camera.name=RENDER_CAMERA;camera.position.fromArray(position(record.camera));camera.quaternion.copy(record.camera.getWorldQuaternion(new THREE.Quaternion()));camera.scale.set(1,1,1);camera.near*=unit;camera.far*=unit;
  if(camera.isOrthographicCamera){camera.left*=unit;camera.right*=unit;camera.top*=unit;camera.bottom*=unit;}
  camera.updateProjectionMatrix();root.add(camera);root.updateMatrixWorld(true);
  const glb=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true,maxTextureSize:2048});
  if(!(glb instanceof ArrayBuffer)||glb.byteLength>300_000_000)throw Error('Invalid or excessively large GLB.');
  if(getInteriorScene(id)!==record||appearanceStore.getRevision()!==appearanceRevision||lightingStore.getRevision()!==lightingRevision)throw Error('Scene/settings changed during export. Try again.');
  const job=validateRenderJob({schemaVersion:1,format:'home-interior-render',unit:'m',coordinateSystem:'Y_UP',sceneFile:'scene.glb',sceneSha256:await digest(glb),cameraName:RENDER_CAMERA,room:id,quality,aspect:record.camera.aspect||1.5,meshCount,vertices,fixtures:structuredClone(record.lighting?.fixtures||[]),punctualLights,worldStrength:Math.max(.015,Math.min(.35,(record.scene.environmentIntensity??.2)*.45)),appearance:appearanceStore.getSnapshot(),lighting:lightingStore.getSnapshot(),source:{revision:import.meta.env.VITE_GIT_REVISION||'not supplied',exportedAt:new Date().toISOString(),visibleSceneOnly:true,annotationSpritesExcluded:true}});
  const zip=new JSZip();zip.file('scene.glb',glb);zip.file('render-job.json',JSON.stringify(job,null,2));zip.file('README.txt','Home Interior Blender render package\n\nExtract this folder, then run from the repository:\nnode react-configurator/scripts/blender-render.cjs --job "<folder>/render-job.json" --output "<new render folder>"\nSet BLENDER_PATH to your installed Blender executable if it is not on PATH.\nThe job contains the actual visible meshes and camera in metres; labels/sprites are not architectural geometry. Room dimensions are not certified. Rendered lamp power is an artistic conversion, not photometric certification.\n');
  return {blob:await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}}),job,glb};
 }finally{ownedGeometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
}
export async function downloadBlenderBundle(id,options){const result=await buildBlenderBundle(id,options);const url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download=`home-interior-${id}-${options?.quality||'balanced'}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return result.job;}
