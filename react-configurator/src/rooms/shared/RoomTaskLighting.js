import * as THREE from 'three'
import {LOBBY_LIGHTING} from '../../config/lobbyLightingConfig.js'
import {BEDROOM1_LIGHTING} from '../../config/bedroom1LightingConfig.js'
import {BEDROOM3_LIGHTING} from '../../config/bedroom3LightingConfig.js'
import {STUDY_LIGHTING} from '../../config/studyLightingConfig.js'
import {createTrackLights,createCeilingFans,createCeilingMouldings} from '../drawing/DrawingRoomLighting.js'
import {createDiningShelfLight} from './DiningShelfLight.js'

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
  // Existing plaster mouldings, where a phone scan recorded them (Lobby, Bedroom 3): drawn so the runs can be judged against them.
  if(config.ceilingMouldings)group.add(createCeilingMouldings(config.ceilingMouldings,{widthMm,lengthMm,heightMm}))
  group.userData.setTrackLight=(circuit,level)=>tracks.userData.setLevel(circuit,level)
  return group
}

// Fixtures of the shell rooms (EmptyRoomGallery.jsx and Whole home 3D): the Lobby's dining shelf light and tracks, and the
// tracks of Bedroom 1 and Bedroom 3. `room` is an EMPTY_ROOM_SHELLS entry.
export function createRoomTaskLighting(room,{realLights=false}={}){
  const group=new THREE.Group();group.name=`${room.name} task lighting`
  const config=TRACK_CONFIGS[room.name]
  const tracks=config?createRoomTrackLighting(config,room,{realLights}):null
  if(tracks)group.add(tracks)
  let pendant=null
  if(room.name==='Lobby / Dining'){
    pendant=createDiningShelfLight(config.pendant,room.furniture.diningTable,room.heightMm,{realLights});group.add(pendant)
  }
  // Keep the existing id/slider: 'chandelier' dims both the shelf's LED glow and its real light.
  group.userData.setTrackLight=(circuit,level)=>{
    if(circuit==='chandelier')pendant?.userData.setLevel(level)
    else tracks?.userData.setTrackLight(circuit,level)
  }
  // Drawing Room fixtures depend on the seating layout: see rooms/drawing/DrawingRoomLighting.js.
  return group
}
