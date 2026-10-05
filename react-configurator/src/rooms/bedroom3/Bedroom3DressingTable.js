import * as THREE from 'three'
import {createBedroom3EastDressing} from './Bedroom3EastCabinet.js'

// Bedroom 3 has its mirror dressing cabinet in the east cabinet run (config/roomShellConfig.js furniture.eastCabinet).
// Any other room gets an empty group. The older standing vanity, drawn from furniture.dressingTable, was removed on
// 2026-10-05: no room has that field any more (docs/changes/2026-10-05-cleanup.md).
export function createBedroom3DressingTable(room){
  if(room.furniture?.eastCabinet)return createBedroom3EastDressing(room)
  const group=new THREE.Group();group.name='Bedroom 3 standing vanity'
  return group
}
