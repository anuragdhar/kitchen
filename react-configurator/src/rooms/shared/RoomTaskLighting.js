import * as THREE from 'three'
import {LOBBY_LIGHTING} from '../../config/lobbyLightingConfig.js'
import {BEDROOM1_LIGHTING} from '../../config/bedroom1LightingConfig.js'
import {BEDROOM3_LIGHTING} from '../../config/bedroom3LightingConfig.js'
import {STUDY_LIGHTING} from '../../config/studyLightingConfig.js'
import {createTrackLights,createCeilingFans} from '../drawing/DrawingRoomLighting.js'

// Track lighting configs by room page (the Drawing Room's lives with its layouts: rooms/drawing/DrawingRoomLighting.js;
// the Kitchen's frame is converted in rooms/kitchen/KitchenTrackLights.js).
const TRACK_CONFIGS={'Lobby / Dining':LOBBY_LIGHTING,'Bedroom 1':BEDROOM1_LIGHTING,'Bedroom 3':BEDROOM3_LIGHTING,'Study':STUDY_LIGHTING}

// Track runs and the (assumed, where unmeasured) ceiling fan of one room, in the room frame in metres: x from the west wall,
// z from the north wall, y up. `realLights`: the room page asks for real, dimmable lights; Whole home 3D keeps only the
// fixtures, to limit its light count. userData.setTrackLight(circuit, level) dims one run id; level 0 = off, 1 = planned.
export function createRoomTrackLighting(config,{widthMm,lengthMm,heightMm},{realLights=false}={}){
  const group=new THREE.Group();group.name='Track lighting'
  const tracks=createTrackLights(config.tracks,heightMm/1000,{realLights,room:{x:widthMm/1000,z:lengthMm/1000}});group.add(tracks)
  if(config.ceilingFans)group.add(createCeilingFans(config.ceilingFans,heightMm/1000))
  group.userData.setTrackLight=(circuit,level)=>tracks.userData.setLevel(circuit,level)
  return group
}

// Fixtures of the shell rooms (EmptyRoomGallery.jsx and Whole home 3D): the Lobby's dining pendant and tracks, and the
// tracks of Bedroom 1 and Bedroom 3. `room` is an EMPTY_ROOM_SHELLS entry.
export function createRoomTaskLighting(room,{realLights=false}={}){
  const group=new THREE.Group();group.name=`${room.name} task lighting`
  const config=TRACK_CONFIGS[room.name]
  const tracks=config?createRoomTrackLighting(config,room,{realLights}):null
  if(tracks)group.add(tracks)
  let pendant=null,pendantBase=0
  if(room.name==='Lobby / Dining'){
    const metal=new THREE.MeshStandardMaterial({color:'#514941',roughness:.55,metalness:.4})
    const warm=new THREE.MeshStandardMaterial({color:'#fff1d4',emissive:'#ffcf8b',emissiveIntensity:.7,roughness:.8})
    warm.userData.taskLightGlow=true
    const box=(w,h,d,x,y,z,material)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
      mesh.position.set(x,y,z);group.add(mesh)
    }
    // The linear pendant over the dining table (config/lobbyLightingConfig.js pendant): its own circuit ('chandelier').
    const table=room.furniture.diningTable,x=table.centerXmm/1000,z=table.centerZmm/1000
    box(.10,.04,.75,x,room.heightMm/1000-.03,z,metal)
    for(const dz of [-.3,.3])box(.006,.90,.006,x,2.17,z+dz,metal)
    box(.16,.075,.90,x,1.70,z,metal)
    box(.13,.01,.87,x,1.657,z,warm)
    if(realLights){pendant=new THREE.PointLight('#ffd9a8',1.4,5,1.5);pendant.position.set(x,1.6,z);group.add(pendant);pendantBase=pendant.intensity}
  }
  // Dimmer, one circuit at a time: 'chandelier' is the dining pendant; a run id ('L1', 'B1', ...) is one track run.
  group.userData.setTrackLight=(circuit,level)=>{
    if(circuit==='chandelier'){if(pendant){pendant.userData.dimLevel=level;pendant.intensity=pendantBase*level}}
    else tracks?.userData.setTrackLight(circuit,level)
  }
  // Drawing Room fixtures depend on the seating layout: see rooms/drawing/DrawingRoomLighting.js.
  return group
}
