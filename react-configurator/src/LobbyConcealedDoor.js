import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'
import * as THREE from 'three'

export function createLobbyConcealedDoor(room){
  const group=new THREE.Group();group.name='Lobby continuous panel wall and concealed washroom door'
  const door=room.doors?.find(d=>d.wall==='south')
  if(!door)return group
  const W=room.widthMm/1000,H=room.heightMm/1000,L=room.lengthMm/1000
  const a=door.fromMm/1000,b=a+door.widthMm/1000,top=door.heightMm/1000
  const finish=new THREE.MeshStandardMaterial({color:'#c5b49e',roughness:.78})
  tagSurfaceMaterial(finish,'wood','lobby')
  const shadow=new THREE.MeshStandardMaterial({color:'#746653',roughness:.85})
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  // Narrow reveals distinguish the working leaf without a contrasting architrave.
  const sections=[[0,a,0,H],[a,b,top,H],[b,W,0,H],[a+.003,b-.003,.008,top-.003]]
  for(const [left,right,bottom,upper] of sections){
    box(right-left,upper-bottom,.025,(left+right)/2,(upper+bottom)/2,L-.063,finish)
    // Align the vertical pattern across the leaf and the fixed wall panels.
    for(let x=.15;x<W;x+=.15){
      if(x>left+.004&&x<right-.004)box(.003,upper-bottom,.001,x,(upper+bottom)/2,L-.076,shadow)
    }
  }
  // Small recessed pull on the latch edge, facing into the lobby.
  box(.014,.13,.002,b-.065,1.03,L-.077,shadow)
  return group
}
