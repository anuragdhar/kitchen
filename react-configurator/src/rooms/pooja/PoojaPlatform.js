import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {poojaPlatformGeometry} from '../../domain/poojaPlatform.mjs'

export function createPoojaPlatform(pooja,floorTopMm=0){
  const platform=new THREE.Group()
  platform.name='Raised Pooja Ghar platform with lobby-facing storage drawer'
  platform.position.y=floorTopMm/1000
  const g=poojaPlatformGeometry(pooja),front=g.front/1000
  const from=pooja.fromMm/1000,width=pooja.widthMm/1000,depth=g.depthMm/1000
  const height=pooja.platformHeightMm/1000,drawerDepth=pooja.drawerDepthMm/1000
  const center=from+width/2
  const oak=new THREE.MeshStandardMaterial({color:'#aa825c',roughness:.7})
  tagSurfaceMaterial(oak,'wood','pooja')
  const drawer=new THREE.MeshStandardMaterial({color:'#725039',roughness:.62})
  tagSurfaceMaterial(drawer,'wood','pooja')
  const shadow=new THREE.MeshStandardMaterial({color:'#604b39',roughness:.78})
  const handle=new THREE.MeshStandardMaterial({color:'#aa9066',metalness:.65,roughness:.32})
  const addBox=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;platform.add(mesh)
  }
  addBox(width-.02,height-.025,depth-.02,center,(height-.025)/2,front-depth/2,oak)
  const radius=(pooja.nosingRadiusMm??12.5)/1000 // legacy 25 mm top; proposed half-round edge
  addBox(width,.025,depth-radius,center,height-.0125,front-(depth+radius)/2,oak)
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,width,32),oak)
  nose.rotation.z=Math.PI/2;nose.position.set(center,height-radius,front-radius)
  nose.name='Rounded platform nosing';nose.castShadow=true;nose.receiveShadow=true;platform.add(nose)
  // The west drawer retains its back at z -550 and gains the projection's depth. East area stays fixed.
  const drawerWidth=(g.drawer.x2-g.drawer.x1)/1000,drawerCenter=(g.drawer.x1+g.drawer.x2)/2000
  addBox(drawerWidth,height-.045,drawerDepth,drawerCenter,height/2,front-drawerDepth/2,shadow)
  addBox(drawerWidth,height-.025,.009,drawerCenter,(height-.025)/2,front-.028,shadow)
  addBox(drawerWidth,height-.04,.022,drawerCenter,height/2,front-.011,drawer)
  addBox(.18,.014,.026,drawerCenter,height/2,front+.018,handle)
  return platform
}
