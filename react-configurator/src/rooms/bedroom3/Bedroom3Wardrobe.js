import * as THREE from 'three'
import {createBedroom3EastCabinets} from './Bedroom3EastCabinet.js'

// Bedroom 3 keeps its wardrobes in the east cabinet run (config/roomShellConfig.js furniture.eastCabinet).
// Any other room gets an empty group. The older west-wall sliding wardrobe, drawn from furniture.westWardrobe, was
// removed on 2026-10-05: no room has that field any more (docs/changes/2026-10-05-cleanup.md).
export function createBedroom3Wardrobe(room){
  if(room.furniture?.eastCabinet)return createBedroom3EastCabinets(room)
  const group=new THREE.Group();group.name='Bedroom 3 west-wall sliding wardrobe'
  return group
}
