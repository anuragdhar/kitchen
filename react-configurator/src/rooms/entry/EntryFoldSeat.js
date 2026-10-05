import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'

// A wall-mounted fold-down seat for putting on/taking off shoes, shown in its
// deployed (horizontal) position. Mounted on the west wall (planX 515) next
// to the shoe rack, at the corner nearest the arrival door - owner request
// 2026-09-29 ("a seat where a person can sit and change shoes and can fold
// back", reference: a wall-hinged fold-down bench).
export function createEntryFoldSeat(x,z){
  const g=new THREE.Group();g.name='Entry fold-down shoe seat'
  const frame=new THREE.MeshStandardMaterial({color:'#e8e6e1',roughness:.55,metalness:.15})
  const seatTop=new THREE.MeshStandardMaterial({color:'#2b2f33',roughness:.5,metalness:.1})
  const hinge=new THREE.MeshStandardMaterial({color:'#8c8f92',metalness:.7,roughness:.3})

  const seatConfig=ENTRY.foldSeat,seatHeightM=seatConfig.heightMm/1000,seatDepthM=seatConfig.depthMm/1000,seatWidthM=seatConfig.widthMm/1000,wallX=x(seatConfig.wallPlanX)
  // Position along the west wall, just south of the shoe-rack corner so the
  // door swing and shoe rack access both stay clear.
  const seatZ=z(seatConfig.centrePlanY)

  // Wall mounting plate (fixed, always visible whether the seat is up or down).
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.018,.30,.30),frame)
  plate.position.set(wallX+.009,seatHeightM,seatZ);plate.castShadow=true;plate.receiveShadow=true;g.add(plate)

  // Folding support brackets (shown extended, holding the seat horizontal).
  const bracketLength=Math.hypot(seatDepthM,seatHeightM-.05)
  for(const dz of [-.13,.13]){
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,bracketLength),hinge)
    bracket.position.set(wallX+seatDepthM/2,seatHeightM/2+.03,seatZ+dz)
    bracket.rotation.x=Math.atan2(seatHeightM-.05,seatDepthM)
    bracket.castShadow=true;g.add(bracket)
  }

  // Seat panel, deployed horizontal.
  const seat=new THREE.Mesh(new THREE.BoxGeometry(seatDepthM,.03,seatWidthM),seatTop)
  seat.position.set(wallX+seatDepthM/2,seatHeightM,seatZ)
  seat.castShadow=true;seat.receiveShadow=true;g.add(seat)

  // Piano hinge along the wall edge.
  const hingeRod=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,seatWidthM,12),hinge)
  hingeRod.rotation.x=Math.PI/2;hingeRod.rotation.z=Math.PI/2
  hingeRod.position.set(wallX+.02,seatHeightM,seatZ);g.add(hingeRod)

  return g
}
