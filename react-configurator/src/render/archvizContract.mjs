// The transport is glTF metres, Y up. Blender performs the standard (x,-z,y) import.
export const finiteVector = (value, length=3) => Array.isArray(value) && value.length===length && value.every(Number.isFinite);
export const validRoom = value => typeof value==='string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);
export function validateCapture(value) {
  if(value?.schema!=='a501.archviz-source' || value.version!==1 || value.units!=='metres' || value.axes!=='GLTF_Y_UP') throw Error('Unsupported archviz source.');
  if(!validRoom(value.room) || typeof value.sceneId!=='string') throw Error('Invalid room identity.');
  if(!/^[a-f0-9]{64}$/.test(value.glbSha256)) throw Error('Missing model checksum.');
  if(!Number.isFinite(value.metresPerSourceUnit) || value.metresPerSourceUnit<=0) throw Error('Invalid source scale.');
  if(!Array.isArray(value.meshes) || !value.meshes.length || value.meshes.length>50000) throw Error('Expected 1–50,000 source meshes.');
  const ids=new Set();
  for(const mesh of value.meshes){
    if(typeof mesh.id!=='string' || !mesh.id || ids.has(mesh.id)) throw Error('Missing or duplicate source mesh ID.');
    ids.add(mesh.id);
    if(!finiteVector(mesh.min) || !finiteVector(mesh.max) || mesh.min.some((v,i)=>v>mesh.max[i])) throw Error('Invalid source mesh bounds.');
    if(!Number.isSafeInteger(mesh.triangles) || mesh.triangles<1) throw Error('Invalid source triangle count.');
  }
  if(!finiteVector(value.camera?.position) || !finiteVector(value.camera?.quaternion,4)) throw Error('Missing source camera.');
  if(!['perspective','orthographic'].includes(value.camera.type)) throw Error('Unsupported source camera.');
  if(value.camera.type==='perspective' && !(value.camera.fov>0 && value.camera.fov<175)) throw Error('Invalid source field of view.');
  if(value.camera.type==='orthographic' && !(value.camera.verticalSpan>0)) throw Error('Invalid source orthographic span.');
  return value;
}
export function validateRenderGallery(value){
  if(value?.schema!=='a501.archviz-gallery' || value.version!==1 || !Array.isArray(value.renders) || value.renders.length>200) throw Error('Invalid archviz gallery.');
  for(const item of value.renders){
    if(!validRoom(item.room) || typeof item.sourceKind!=='string' || !Array.isArray(item.images)) throw Error('Invalid room render.');
    for(const shot of item.images){
      if(typeof shot.label!=='string' || !/^\/renders\/archviz\/[a-f0-9]{16}\/[a-z0-9-]+\.png$/.test(shot.url)) throw Error('Invalid local render path.');
    }
  }
  return value;
}
