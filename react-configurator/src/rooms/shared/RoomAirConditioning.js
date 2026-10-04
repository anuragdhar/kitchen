import * as THREE from 'three'
import {AC_PLAN} from '../../config/acPlanConfig.js'
import {indoorUnitBox} from '../../domain/acPlan.mjs'

// Indoor units of the whole-home AC plan (config/acPlanConfig.js, docs/AC_PLAN.md), drawn at TYPICAL casing sizes in the room
// frame in metres (x from the west wall, z from the north wall, y up). Proposals, not installation drawings.
const SPACE_OF_ROOM={'Drawing Room':'drawing','Lobby / Dining':'lobby'}

/** One wall-mounted indoor unit of the plan (space id of AC_SPACES): casing, air outlet toward the side it blows, top trim. */
export function createPlannedAcIndoorUnit(spaceId){
  const space=AC_PLAN.spaces.find(s=>s.id===spaceId),box=indoorUnitBox(space,AC_PLAN)
  const group=new THREE.Group();group.name=space.name+' AC indoor unit ('+space.status+', '+space.tons+' ton)'
  const shell=new THREE.MeshStandardMaterial({color:'#f1f3f1',roughness:.48}),trim=new THREE.MeshStandardMaterial({color:'#aebbc0',metalness:.28,roughness:.44}),grille=new THREE.MeshStandardMaterial({color:'#626c70',metalness:.3,roughness:.5})
  const alongZ=box.wall==='west'||box.wall==='east',w=(alongZ?box.z2-box.z1:box.x2-box.x1)/1000,d=(alongZ?box.x2-box.x1:box.z2-box.z1)/1000,h=(box.topMm-box.bottomMm)/1000
  const cx=(box.x1+box.x2)/2000,cz=(box.z1+box.z2)/2000,y=box.bottomMm/1000,out=box.wall==='west'||box.wall==='north'?1:-1 // +1: the front faces +x or +z
  const part=(along,high,deep,offset,py,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(alongZ?deep:along,high,alongZ?along:deep),material)
    mesh.position.set(cx+(alongZ?offset:0),py,cz+(alongZ?0:offset));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  part(w,h,d,0,y+h/2,shell)
  part(w*.87,.025,.015,out*(d/2+.006),y+.03,grille)
  part(w*.82,.018,.015,out*(d/2+.006),y+h-.01,trim)
  return group
}

export function createRoomAirConditioning(room){
  const group=new THREE.Group()
  group.name=`${room.name} air conditioning`
  const shell=new THREE.MeshStandardMaterial({color:'#f1f3f1',roughness:.48})
  const trim=new THREE.MeshStandardMaterial({color:'#aebbc0',metalness:.28,roughness:.44})
  const grille=new THREE.MeshStandardMaterial({color:'#626c70',metalness:.3,roughness:.5})
  if(SPACE_OF_ROOM[room.name])group.add(createPlannedAcIndoorUnit(SPACE_OF_ROOM[room.name]))
  if(room.name==='Bedroom 1'&&room.balconyExtension){
    // Bedroom 1 is cooled by the owner's window AC alone. The split indoor unit that was drawn on the west wall and the concept
    // Lobby condenser outside the balcony are no longer drawn (AC plan 2026-10-05: acPlanConfig.js bedroom1.splitAlternative;
    // the Lobby's outdoor unit is the one at the owner's plan mark outside the kitchen wall, drawn by AcOutdoorUnit.js).
    const outerX=(room.widthMm+room.balconyExtension.depthMm)/1000
    const ac=room.balconyExtension.windowAc
    if(ac){
      // The owner's 1.5 ton window AC in the balcony's east side, on an iron frame (roomShellConfig.js, 2026-10-05).
      const unit=new THREE.Group();unit.name='Bedroom 1 window AC (owner, proposed position)';group.add(unit)
      const w=ac.widthMm/1000,h=ac.heightMm/1000,d=ac.depthMm/1000,inside=ac.insideMm/1000,z=ac.centerFromNorthMm/1000,y=ac.bottomMm/1000
      const part=(bw,bh,bd,x,py,pz,material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),material);mesh.position.set(x,py,pz);mesh.castShadow=true;unit.add(mesh);return mesh}
      part(d,h,w,outerX-inside+d/2,y+h/2,z,shell)
      part(.012,h*.62,w*.62,outerX-inside-.006,y+h*.6,z-w*.12,grille)
      part(.012,h*.2,w*.9,outerX-inside-.006,y+h*.14,z,trim)
      part(.012,h*.8,w*.8,outerX-inside+d+.006,y+h/2,z,grille)
      // Iron angle frame: a shelf under the outside part and two struts back to the parapet.
      const out=d-inside
      part(out+.04,.03,w+.06,outerX+out/2,y-.015,z,grille)
      for(const side of [-1,1]){const strut=part(Math.hypot(out,.45),.03,.03,outerX+out/2,y-.24,z+side*(w/2+.015),grille);strut.rotation.z=Math.atan2(.45,out)}
    }
  }
  return group
}
