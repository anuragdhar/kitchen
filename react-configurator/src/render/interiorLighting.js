import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {lightingStore} from '../home/lightingStore.mjs';
import {HOME_ROOMS} from '../home/rooms.mjs';
import {lightingAt,ROOM_LIGHTING} from '../home/lighting.mjs';
import {lampLinear} from './renderQuality.mjs';
// The preview strengths below (power, and the aggregated whole-home sums) were tuned before the live views shared one daylight
// rig (render/lightRig.js). At those values a room's five rectangle lights put several times the sun's light on every surface
// in daytime, which washed out the sun's shadows and flattened every room to white (render-quality pass, 2026-10-05). They are
// now scaled by PREVIEW_GAIN, which keeps the layers' ratios and the day/evening/night differences: proposed fittings add a
// soft fill by day and become the room's main light at night. Colour: lampLinear (render/renderQuality.mjs) renders the
// Kelvin of each mode with the same white balance as the rooms' own track lights, so 4500 K day reads neutral and 2700 K
// night warm (kelvinRgb alone made 4500 K peach).
export const PREVIEW_GAIN=.25;
const nativePoint=(zone,f)=>zone.min.map((n,i)=>n+(zone.max[i]-n)*f[i]);
/** Authored geometry stays intact. This adds a removable proposed fixture overlay. */
export function bindInteriorLighting(record,onUpdate){
 RectAreaLightUniformsLib.init();const {scene,metresPerUnit:unit}=record;
 const original=[];scene.traverse(o=>{if(o.isLight)original.push({o,intensity:o.intensity,color:o.color.clone(),visible:o.visible});});
 const oldEnv=scene.environmentIntensity??1,oldBackground=scene.background?.isColor?scene.background.clone():scene.background;
 const root=new THREE.Group();root.name='Home Interior proposed lighting';root.userData.interiorFixture=true;scene.add(root);
 const zones=record.zones.filter(z=>HOME_ROOMS.some(r=>r.id===z.id));
 // Shared furniture factories also identify alcoves not represented by a top-level room rectangle.
 const bounds=new Map();scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){const id=m.userData?.interiorRoom;if(id&&HOME_ROOMS.some(r=>r.id===id)&&!zones.some(z=>z.id===id)){if(!bounds.has(id))bounds.set(id,new THREE.Box3());bounds.get(id).expandByObject(o);}}});
 for(const [id,box] of bounds){if(!box.isEmpty())zones.push({id,min:[box.min.x,0,box.min.z],max:[box.max.x,Math.max(box.max.y,2.4/unit),box.max.z],inferredFromFurniture:true});}
 const fixtureData=[],lights=[],strips=[];const multi=zones.length>1;
 for(const zone of zones){
  const d=zone.max.map((v,i)=>v-zone.min[i]),p=ROOM_LIGHTING[zone.id];
  // Relative fixture locations are design proposals, not surveyed electrical installation points.
  const specs=[
   {layer:'ambient',at:[.5,.92,.5],width:Math.min(d[0]*.45,1.5/unit),height:Math.min(d[2]*.35,1.2/unit),power:100},
   {layer:'cove',at:[.5,.95,.09],width:d[0]*.7,height:.04/unit,power:160},
   {layer:'task',at:p.task,width:Math.min(d[0]*.3,1.2/unit),height:.12/unit,power:180*p.taskGain},
   {layer:'accent',at:[.88,.7,.62],width:.16/unit,height:.45/unit,power:40},
   {layer:'cabinet',at:p.cabinet,width:Math.min(d[2]*.6,2.8/unit),height:.015/unit,power:280,alongZ:true},
  ];
  if(zone.id==='kitchen')specs.push({...specs.at(-1),at:[.9,.5,.5]});
  for(const spec of specs){
   const position=nativePoint(zone,spec.at),target=[position[0],zone.min[1],position[2]];
   const group=new THREE.Group();group.name=`${zone.id}/${spec.layer}`;group.userData={interiorFixture:true,interiorRoom:zone.id,lightingLayer:spec.layer};root.add(group);
   const area=new THREE.RectAreaLight('#ffffff',0,spec.width,spec.height);area.position.fromArray(position);area.lookAt(new THREE.Vector3(...target));if(spec.alongZ)area.rotateZ(Math.PI/2);area.userData={...group.userData};
   // The whole-home preview aggregates layers per room to cap shader light count.
   if(!multi||spec.layer==='ambient'){group.add(area);lights.push({area,room:zone.id,layer:spec.layer,power:spec.power,aggregate:multi});}
   if(['cove','cabinet','accent'].includes(spec.layer)&&!p.ownFixtures){
    const material=new THREE.MeshStandardMaterial({color:'#faf8f1',emissive:'#ffffff',emissiveIntensity:0,roughness:.35});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(spec.width,.012/unit,spec.height),material);mesh.position.fromArray(position);if(spec.alongZ)mesh.rotation.y=Math.PI/2;mesh.userData={...group.userData};group.add(mesh);strips.push({mesh,material,room:zone.id,layer:spec.layer});
   }
   fixtureData.push({room:zone.id,layer:spec.layer,position:position.map(v=>v*unit),target:target.map(v=>v*unit),width:spec.width*unit,height:spec.height*unit,previewIntensity:spec.power,alongZ:!!spec.alongZ,kelvin:4500,level:0});
  }
 }
 record.lighting={fixtures:fixtureData,roomModes:{},revision:0,preview:multi?'room-aggregated':'layered',ready:true};
 let alive=true;
 const apply=(date=new Date())=>{
  if(!alive)return;
  const settings=lightingStore.getSnapshot(),hour=date.getHours()+date.getMinutes()/60;
  const profiles=new Map(zones.map(z=>[z.id,lightingAt(settings,z.id,hour)]));
  const active=[...profiles.values()].filter(p=>p.mode!=='original');
  const daylight=active.length?active.reduce((n,p)=>n+p.levels.daylight,0)/active.length:1;
  const allOriginal=active.length===0;
  for(const entry of original){entry.o.visible=entry.visible;entry.o.color.copy(entry.color);entry.o.intensity=allOriginal?entry.intensity:entry.intensity*(entry.o.isDirectionalLight?daylight:((entry.o.isHemisphereLight||entry.o.isAmbientLight)? .12*daylight:0));}
  // Avoid the hidden environment becoming a second bright daytime light at night.
  scene.environmentIntensity=allOriginal?oldEnv:oldEnv*(.04+.3*daylight);
  if(scene.background?.isColor)scene.background.copy(allOriginal?oldBackground:new THREE.Color().setRGB(.07+.65*daylight,.075+.66*daylight,.09+.68*daylight));
  for(const {area,room,layer,power,aggregate} of lights){const p=profiles.get(room),rgb=lampLinear(p.kelvin);area.color.setRGB(...rgb);area.intensity=PREVIEW_GAIN*(p.mode==='original'?0:aggregate?(p.levels.ambient*100+p.levels.cove*16+p.levels.task*22+p.levels.accent*6+p.levels.cabinet*12):power*p.levels[layer]);}
  for(const {mesh,material,room,layer} of strips){const p=profiles.get(room);mesh.visible=p.mode!=='original'&&p.levels[layer]>0;material.emissive.setRGB(...lampLinear(p.kelvin));material.emissiveIntensity=3*p.levels[layer];}
  for(const f of fixtureData){const p=profiles.get(f.room);f.kelvin=p.kelvin;f.level=p.mode==='original'?0:p.levels[f.layer];}
  record.lighting.roomModes=Object.fromEntries([...profiles].map(([id,p])=>[id,p.mode]));record.lighting.revision=lightingStore.getRevision();onUpdate();
 };
 const unsubscribe=lightingStore.subscribe(()=>apply());const timer=setInterval(()=>{if(lightingStore.getSnapshot().mode==='auto'||Object.values(lightingStore.getSnapshot().rooms).some(r=>r.mode==='auto'))apply();},60000);
 apply();return {refresh:apply,dispose(){alive=false;clearInterval(timer);unsubscribe();root.removeFromParent();root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});for(const {o,intensity,color,visible} of original){o.intensity=intensity;o.color.copy(color);o.visible=visible;}scene.environmentIntensity=oldEnv;scene.background=oldBackground;}};
}
