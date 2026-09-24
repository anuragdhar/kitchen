import * as THREE from 'three'

export function createPoojaPlatform(pooja,floorTopMm=0){
  const platform=new THREE.Group()
  platform.name='Raised Pooja Ghar platform with lobby-facing storage drawer'
  platform.position.y=floorTopMm/1000
  const from=pooja.fromMm/1000,width=pooja.widthMm/1000,depth=pooja.depthMm/1000
  const height=pooja.platformHeightMm/1000,drawerDepth=pooja.drawerDepthMm/1000
  const center=from+width/2
  const oak=new THREE.MeshStandardMaterial({color:'#aa825c',roughness:.7})
  const drawer=new THREE.MeshStandardMaterial({color:'#725039',roughness:.62})
  const shadow=new THREE.MeshStandardMaterial({color:'#604b39',roughness:.78})
  const handle=new THREE.MeshStandardMaterial({color:'#aa9066',metalness:.65,roughness:.32})
  const addBox=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;platform.add(mesh)
  }
  addBox(width-.02,height-.025,depth-.02,center,(height-.025)/2,-depth/2,oak)
  addBox(width,.025,depth,center,height-.0125,-depth/2,oak)
  // The shallow drawer opens toward Lobby / Dining; the rest is a fixed platform.
  addBox(width-.10,height-.045,drawerDepth,center,height/2,-drawerDepth/2,shadow)
  addBox(width-.10,height-.025,.009,center,(height-.025)/2,.003,shadow)
  addBox(width-.14,height-.04,.022,center,height/2,.020,drawer)
  addBox(.18,.014,.026,center,height/2,.049,handle)
  return platform
}
