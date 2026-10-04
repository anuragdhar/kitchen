import * as THREE from 'three'

// Concept locations only; equipment size and service clearances need installation drawings.
export function createRoomAirConditioning(room){
  const group=new THREE.Group()
  group.name=`${room.name} air conditioning`
  const shell=new THREE.MeshStandardMaterial({color:'#f1f3f1',roughness:.48})
  const trim=new THREE.MeshStandardMaterial({color:'#aebbc0',metalness:.28,roughness:.44})
  const grille=new THREE.MeshStandardMaterial({color:'#626c70',metalness:.3,roughness:.5})
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  if(room.name==='Drawing Room'){
    const z=room.furniture.sofa.centerZmm/1000
    box(.22,.28,1.02,.14,2.37,z,shell)
    box(.015,.025,.89,.26,2.26,z,grille)
    box(.015,.018,.84,.26,2.50,z,trim)
  }
  if(room.name==='Lobby / Dining'){
    const x=2.58
    box(1.02,.28,.22,x,2.37,.14,shell)
    box(.89,.025,.015,x,2.26,.26,grille)
    box(.84,.018,.015,x,2.50,.26,trim)
  }
  if(room.name==='Bedroom 1'&&room.balconyExtension){
    // The clear west-wall stretch south of the wardrobe holds the room unit.
    box(.22,.28,.90,.14,2.37,2.48,shell)
    box(.015,.025,.78,.26,2.26,2.48,grille)
    const outerX=(room.widthMm+room.balconyExtension.depthMm)/1000
    // The Lobby condenser sits outside the east glazing, below its one-metre sill (concept position). Bedroom 1's own
    // outdoor unit is drawn from the owner's plan mark instead (config/acOutdoorUnitsConfig.js, Whole home 3D), a little
    // further north-east, so the Lobby one moved from z 1.46 to the south slot to stay clear of it (2026-10-05).
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
    for(const [label,z] of [['Lobby / Dining',.46]]){
      const unit=new THREE.Group();unit.name=`${label} outdoor AC unit`;group.add(unit)
      const cx=outerX+.20
      const body=new THREE.Mesh(new THREE.BoxGeometry(.36,.52,.70),shell)
      body.position.set(cx,.58,z);body.castShadow=true;unit.add(body)
      const fan=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.018,28),grille)
      fan.rotation.z=Math.PI/2;fan.position.set(cx+.19,.58,z);unit.add(fan)
      const cross=new THREE.Mesh(new THREE.BoxGeometry(.025,.35,.025),trim)
      cross.position.set(cx+.205,.58,z);unit.add(cross)
    }
  }
  return group
}
