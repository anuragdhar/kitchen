import * as THREE from 'three'

export function createRoomTaskLighting(room){
  const group=new THREE.Group();group.name=`${room.name} task lighting`
  const metal=new THREE.MeshStandardMaterial({color:'#514941',roughness:.55,metalness:.4})
  const warm=new THREE.MeshStandardMaterial({color:'#fff1d4',emissive:'#ffcf8b',emissiveIntensity:.7,roughness:.8})
  warm.userData.taskLightGlow=true
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);group.add(mesh)
  }
  if(room.name==='Lobby / Dining'){
    const table=room.furniture.diningTable,x=table.centerXmm/1000,z=table.centerZmm/1000
    box(.10,.04,.75,x,room.heightMm/1000-.03,z,metal)
    for(const dz of [-.3,.3])box(.006,.90,.006,x,2.17,z+dz,metal)
    box(.16,.075,.90,x,1.70,z,metal)
    box(.13,.01,.87,x,1.657,z,warm)
  }
  // Drawing Room fixtures depend on the seating layout: see rooms/drawing/DrawingRoomLighting.js.
  return group
}
