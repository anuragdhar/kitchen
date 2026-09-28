import {finiteVector,validateRenderGallery} from './archvizContract.mjs';
import {assertEditableRoomSource,usesEditableRoomSource} from './roomParity.mjs';

export function validateCurrentRoomResult(value,room){
  if(!usesEditableRoomSource(room)||value?.schema!=='a501.current-room'||value.version!==1||value.room!==room) throw Error('No matching current-room result.');
  assertEditableRoomSource(value.sceneId,room);
  if(value.sourceKind!=='editable-snapshot'||!/^[a-f0-9]{16}$/.test(value.job)) throw Error('An audited editable-room render is required.');
  if(!/^[a-f0-9]{64}$/.test(value.sourceSha256)||value.model?.sha256!==value.sourceSha256) throw Error('The room model and render checksums disagree.');
  if(value.model.url!==`/renders/archviz/${value.job}/source.glb`||value.model.shading!=='studio-unbaked') throw Error('Invalid current-room model path or shading.');
  const {min,max}=value.bounds||{};
  if(!finiteVector(min)||!finiteVector(max)||min.some((v,i)=>v>max[i])||[...min,...max].some(v=>Math.abs(v)>10000)) throw Error('Invalid room model bounds.');
  const camera=value.camera;
  if(!finiteVector(camera?.position)||!finiteVector(camera?.quaternion,4)||!Number.isFinite(camera.aspect)||camera.aspect<.1||camera.aspect>10) throw Error('Invalid source camera.');
  if(Math.abs(camera.quaternion.reduce((sum,v)=>sum+v*v,0)-1)>.001) throw Error('Invalid camera rotation.');
  if(camera.type==='perspective'){
    if(!Number.isFinite(camera.fov)||camera.fov<=0||camera.fov>=175) throw Error('Invalid source field of view.');
  }else if(camera.type==='orthographic'){
    if(!Number.isFinite(camera.verticalSpan)||camera.verticalSpan<=0||camera.verticalSpan>1000) throw Error('Invalid source camera span.');
  }else throw Error('Unsupported source camera.');
  const audit=value.geometryAudit;
  if(audit?.triangleCountsMatch!==true||!Number.isSafeInteger(audit.sourceObjects)||audit.sourceObjects<1||!Number.isFinite(audit.maximumBoundsErrorMetres)||audit.maximumBoundsErrorMetres<0||audit.maximumBoundsErrorMetres>.0001) throw Error('The source geometry audit did not pass.');
  validateRenderGallery({schema:'a501.archviz-gallery',version:1,renders:[value]});
  if(!value.images.length||value.images.some(image=>!image.url.startsWith(`/renders/archviz/${value.job}/`))) throw Error('The images and model are from different jobs.');
  return value;
}

export function localRenderUrl(base,path){
  return `${base.endsWith('/')?base:base+'/'}${path.replace(/^\//,'')}`;
}
