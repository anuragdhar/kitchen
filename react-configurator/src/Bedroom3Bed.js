import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'
import * as THREE from 'three'

export function createBedroom3Bed(room){
  const group=new THREE.Group()
  group.name='Bedroom 3 six-foot square bed, headboard at east wall'
  const {bed}=room.furniture
  const length=bed.lengthMm/1000,width=bed.widthMm/1000
  const x=room.widthMm/1000-length/2,z=bed.centerFromNorthMm/1000
  const frame=new THREE.MeshStandardMaterial({color:'#806047',roughness:.68})
  tagSurfaceMaterial(frame,'wood','bedroom3')
  const mattress=new THREE.MeshStandardMaterial({color:'#efe8dc',roughness:.94})
  const cover=new THREE.MeshStandardMaterial({color:'#b7c7bd',roughness:.96})
  const pillow=new THREE.MeshStandardMaterial({color:'#fbf8f1',roughness:.98})
  const headboard=new THREE.MeshStandardMaterial({color:'#9a7656',roughness:.74})
  tagSurfaceMaterial(headboard,'wood','bedroom3')
  const addBox=(w,h,d,cx,cy,cz,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  addBox(length,.25,width,x,.125,z,frame)
  addBox(length-.035,.19,width-.035,x,.345,z,mattress)
  addBox(length-.40,.065,width-.10,x-.17,.475,z,cover)
  addBox(.085,.92,width,room.widthMm/1000-.043,.71,z,headboard)
  for(const offset of [-width*.23,width*.23])addBox(.38,.08,.61,room.widthMm/1000-.26,.51,z+offset,pillow)
  return group
}
