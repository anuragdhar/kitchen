import * as THREE from 'three'

export function createLobbyNorthStorage(room){
  const storage=room.furniture?.northStorage
  const group=new THREE.Group()
  group.name='Lobby and dining north-wall storage'
  if(!storage)return group
  const start=storage.fromWestMm/1000,width=storage.widthMm/1000,depth=storage.depthMm/1000,height=storage.heightMm/1000
  const centerX=start+width/2
  const wood=new THREE.MeshStandardMaterial({color:'#ad8968',roughness:.7})
  const door=new THREE.MeshStandardMaterial({color:'#e4dacb',roughness:.62})
  const top=new THREE.MeshStandardMaterial({color:'#c9ae8c',roughness:.58})
  const metal=new THREE.MeshStandardMaterial({color:'#5e625f',metalness:.6,roughness:.34})
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  box(width,.07,depth,centerX,height-.035,depth/2,top)
  box(width,.065,depth,centerX,.07,depth/2,wood)
  for(const x of [start+.025,start+width-.025])box(.05,height-.12,depth,x,height/2,depth/2,wood)
  box(width-.08,height-.14,.025,centerX,height/2,.03,wood)
  const count=storage.doorCount||3,doorWidth=(width-.07)/count
  for(let i=0;i<count;i++){
    const x=start+.035+(i+.5)*doorWidth
    box(doorWidth-.012,height-.19,.025,x,height/2,depth-.018,door)
    box(.12,.014,.022,x,height*.57,depth+.005,metal)
  }
  return group
}
