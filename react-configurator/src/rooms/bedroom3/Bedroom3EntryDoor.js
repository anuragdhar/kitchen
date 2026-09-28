import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'

// Shared north-wall entry and toilet doors for both room and whole-home views.
export function createBedroom3EntryDoor(room){
  const group=new THREE.Group()
  group.name='Bedroom 3 entry and toilet doors'
  const frame=new THREE.MeshStandardMaterial({color:'#eee7dc',roughness:.65})
  tagSurfaceMaterial(frame,'wood','bedroom3')
  const timber=new THREE.MeshStandardMaterial({color:'#916b4d',roughness:.67})
  tagSurfaceMaterial(timber,'wood','bedroom3')
  const handle=new THREE.MeshStandardMaterial({color:'#b7a17e',metalness:.7,roughness:.25})
  const box=(w,h,d,x,y,z,material,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
    return mesh
  }
  for(const door of room.doors.filter(item=>item.wall==='north')){
  const start=door.fromMm/1000,width=door.widthMm/1000,height=door.heightMm/1000
  box(width,.08,.12,start+width/2,height+.04,0,frame)
  box(.05,height,.12,start+.025,height/2,0,frame)
  box(.05,height,.12,start+width-.025,height/2,0,frame)
  const leaf=new THREE.Group()
  leaf.name=door.leadsTo
  leaf.position.set(start+.045,0,0)
  leaf.rotation.y=(door.opensIntoToilet?1:-1)*Math.PI*.38
  group.add(leaf)
  box(width-.085,height-.07,.04,(width-.085)/2,(height-.07)/2,0,timber,leaf)
  box(.075,.025,.06,width-.22,1.02,.045,handle,leaf)
  }
  return group
}
