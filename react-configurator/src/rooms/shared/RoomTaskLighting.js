import * as THREE from 'three'
import {DRAWING_LIGHTING} from '../../config/drawingLightingConfig.js'

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
  if(room.name==='Drawing Room'){
    const ceiling=room.heightMm/1000
    const white=new THREE.MeshStandardMaterial({color:'#8d714f',metalness:.58,roughness:.38})
    const diffuser=new THREE.MeshStandardMaterial({color:'#fff7e7',emissive:'#ffd9a1',emissiveIntensity:.48,roughness:.95})
    diffuser.userData.taskLightGlow=true
    for(const fixture of DRAWING_LIGHTING.ambient){
      const x=fixture.xMm/1000,z=fixture.zMm/1000
      const canopy=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.025,32),white)
      canopy.position.set(x,ceiling-.015,z);canopy.name=fixture.label;group.add(canopy)
      box(.012,.38,.012,x,ceiling-.22,z,white)
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.33,.024,12,48),white)
      ring.rotation.x=Math.PI/2;ring.position.set(x,ceiling-.43,z);group.add(ring)
      const lens=new THREE.Mesh(new THREE.TorusGeometry(.305,.014,8,48),diffuser)
      lens.rotation.x=Math.PI/2;lens.position.set(x,ceiling-.455,z);group.add(lens)
    }
    const west=DRAWING_LIGHTING.wallUplight
    box(.045,.20,.14,.035,west.heightMm/1000,west.fromNorthMm/1000,metal)
    box(.055,.02,.105,.042,west.heightMm/1000+.11,west.fromNorthMm/1000,diffuser)
    const z=DRAWING_LIGHTING.reading.fromNorthMm/1000
    box(.04,.22,.10,.06,1.52,z,metal)
    box(.22,.025,.025,.17,1.60,z,metal)
    box(.12,.10,.12,.27,1.56,z,metal)
    box(.10,.008,.10,.27,1.507,z,warm)
    const sofa=room.furniture.southSofa
    box((sofa.lengthMm-160)/1000,.012,.025,sofa.centerXmm/1000,DRAWING_LIGHTING.seatGlow.heightMm/1000,DRAWING_LIGHTING.seatGlow.fromNorthMm/1000,diffuser)
    // Low-output rear glow behind the north-wall TV; it is not a direct light aimed at the screen.
    const wall=room.tvWall,tvWidth=wall.tv.widthMm-160
    const bayCenter=(wall.fromWestMm+wall.columnWidthMm+(wall.widthMm-2*wall.columnWidthMm)/2)/1000
    box(tvWidth/1000,.014,.018,bayCenter,(wall.tv.bottomMm+wall.tv.heightMm+40)/1000,(wall.backMm+16)/1000,diffuser)
  }
  return group
}
