import {bindInteriorLighting} from './interiorLighting.js';
import * as THREE from 'three';
import {appearanceStore} from '../home/appearanceStore.mjs';
import {effectiveMaterials} from '../home/appearance.mjs';
import {getMaterial,mapPath} from '../home/materialCatalog.mjs';

import {paletteStore} from '../home/paletteStore.mjs';
import {paletteSurfaceSpec} from '../home/paletteAppearance.mjs';

// A chosen whole-home palette decides the tagged wood and plaster of the rooms it maps; the built-in "today" palette
// decides nothing, so the saved Interior studio > Materials setting applies exactly as before.
const specFor=(settings,paletteId,room,role)=>paletteSurfaceSpec(paletteId,room,role)??getMaterial(effectiveMaterials(settings,room)[role],role);
const scenes=new Map();
const events=new Set();
export const subscribeScenes=listener=>{events.add(listener);return()=>events.delete(listener);};
const notify=()=>events.forEach(listener=>listener());
export function getInteriorScenes(){return [...scenes.values()];}
export function getInteriorScene(id){return scenes.get(id);}

/** New UVs only: positions, indices, dimensions, visibility and transforms are untouched. */
export function projectSurfaceUV(mesh,metresPerUnit){
  const geometry=mesh.geometry.clone();
  const position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
  if(!position||!normal)return geometry;
  const scale=mesh.getWorldScale(new THREE.Vector3()).multiplyScalar(metresPerUnit);
  const uv=new Float32Array(position.count*2);
  for(let i=0;i<position.count;i++){
    const x=position.getX(i)*scale.x,y=position.getY(i)*scale.y,z=position.getZ(i)*scale.z;
    const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i));
    // Vertical grain on side/front faces, along the panel on horizontal faces.
    const [u,v]=ny>nx&&ny>nz?[x,z]:nx>nz?[z,y]:[x,y];
    uv[i*2]=u;uv[i*2+1]=v;
  }
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}
function roomOf(mesh,fallback,zones){
  for(let object=mesh;object;object=object.parent)if(object.userData?.interiorRoom)return object.userData.interiorRoom;
  const point=mesh.getWorldPosition(new THREE.Vector3());
  return zones.find(zone=>point.x>=zone.min[0]&&point.x<=zone.max[0]&&point.z>=zone.min[2]&&point.z<=zone.max[2])?.id||fallback;
}

/** Register an existing, authored scene. Dispose before the legacy scene teardown. */
export function registerInteriorScene({id,scene,camera,renderer,metresPerUnit=1,zones=[]}){
  if(scenes.has(id))throw new Error(`Interior scene already mounted: ${id}`);
  scene.updateMatrixWorld(true);
  const entries=[],textures=new Map(),generated=new Set();let alive=true,generation=0;
  scene.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.geometry)return;
    const original=mesh.material,list=Array.isArray(original)?original:[original];
    if(!list.some(material=>material?.userData?.interiorRole))return;
    entries.push({mesh,original,geometry:mesh.geometry,room:roomOf(mesh,id,zones),list,projected:null});
  });
  const record={id,scene,camera,renderer,metresPerUnit,zones,ready:false,errors:[],surfaceCount:entries.length,revision:0,dispose:null,whenReady:null};
  const load=async material=>{
    if(!textures.has(material.asset)){
      const loader=new THREE.TextureLoader();
      const pending=Promise.all(['basecolor','normal','roughness'].map(async channel=>{
        const texture=await loader.loadAsync(`${import.meta.env.BASE_URL}${mapPath(material,channel)}`);
        texture.colorSpace=channel==='basecolor'?THREE.SRGBColorSpace:THREE.NoColorSpace;
        texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
        texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
        if(!alive)texture.dispose();
        return [channel,texture];
      })).then(Object.fromEntries);
      textures.set(material.asset,pending);
    }
    return textures.get(material.asset);
  };
  const update=async()=>{
    const token=++generation,settings=appearanceStore.getSnapshot(),paletteId=paletteStore.getSnapshot().palette;record.ready=false;record.errors=[];notify();
    try{
      const needed=new Map();
      for(const entry of entries){for(const original of entry.list){const role=original.userData?.interiorRole;if(role){const spec=specFor(settings,paletteId,original.userData?.interiorRoom||entry.room,role);if(spec)needed.set(spec.id,spec);}}}
      const loaded=new Map(await Promise.all([...needed].map(async([key,value])=>[key,await load(value)])));
      if(!alive||token!==generation)return;
      for(const material of generated)material.dispose();generated.clear();
      const materialCache=new Map();
      for(const entry of entries){
        const list=entry.list.map(original=>{
          const role=original.userData?.interiorRole;if(!role)return original;
          const spec=specFor(settings,paletteId,original.userData?.interiorRoom||entry.room,role);if(!spec)return original;
          const key=`${original.uuid}:${spec.id}`;if(materialCache.has(key))return materialCache.get(key);
          const maps=loaded.get(spec.id),material=original.clone();generated.add(material);materialCache.set(key,material);
          const repeat=(role==='wood'?settings.grainScale:1)/spec.sizeMetres;
          // Texture clones keep transform settings independent between material variants.
          const copy=source=>{const t=source.clone();t.repeat.set(repeat,repeat);t.needsUpdate=true;return t;};
          material.userData={...original.userData,interiorMaterialId:spec.id};material.name=`${role}/${spec.id}`;
          material.map=spec.reliefOnly?null:copy(maps.basecolor);
          material.normalMap=copy(maps.normal);material.normalScale.setScalar(spec.normalStrength);
          material.roughnessMap=copy(maps.roughness);material.roughness=spec.roughness;
          material.color.set(spec.color||'#ffffff');material.metalness=0;
          material.bumpMap=null;material.displacementMap=null;material.aoMap=null;
          if('clearcoat' in material){material.clearcoat=role==='wood'?.12:0;material.clearcoatRoughness=.45;}
          material.needsUpdate=true;
          // Each cloned texture is owned by this material, unlike its cached source.
          material.addEventListener('dispose',()=>{material.map?.dispose();material.normalMap?.dispose();material.roughnessMap?.dispose();});
          return material;
        });
        const themed=list.some((material,index)=>material!==entry.list[index]);
        if(themed&&!entry.projected)entry.projected=projectSurfaceUV(entry.mesh,metresPerUnit);
        entry.mesh.geometry=themed?entry.projected:entry.geometry;
        entry.mesh.material=Array.isArray(entry.original)?list:list[0];
      }
      record.ready=true;record.revision=appearanceStore.getRevision();
    }catch(error){if(alive&&token===generation)record.errors=[error.message];}
    notify();
  };
  const refresh=()=>{record.whenReady=update();};
  const unsubscribeAppearance=appearanceStore.subscribe(refresh),unsubscribePalette=paletteStore.subscribe(refresh);
  const unsubscribe=()=>{unsubscribeAppearance();unsubscribePalette();};
  const lighting=bindInteriorLighting(record,notify);
  record.dispose=()=>{
    lighting.dispose();
    alive=false;generation++;unsubscribe();
    for(const entry of entries){entry.mesh.material=entry.original;entry.mesh.geometry=entry.geometry;entry.projected?.dispose();}
    generated.forEach(material=>material.dispose());
    textures.forEach(promise=>promise.then(maps=>Object.values(maps).forEach(texture=>texture.dispose())).catch(()=>{}));
    if(scenes.get(id)===record)scenes.delete(id);notify();
  };
  scenes.set(id,record);refresh();return record;
}
