import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {KITCHEN_STORE_STORAGE} from '../../config/kitchenConfig.js'

// Shared millimetre boxes: kitchen west-to-east X, southward Z, vertical Y.
export function storeStorageParts(){
  const s=KITCHEN_STORE_STORAGE,parts=[],r=s.racks
  const add=(name,x,y,z,w,h,d,color='#26282b')=>parts.push({name,x,y,z,w,h,d,color})
  const margin=(s.widthMm-2*r.widthMm-r.gapMm)/2
  for(let rack=0;rack<2;rack++){
    const x=s.fromKitchenWestMm,z=s.fromKitchenSouthMm+margin+rack*(r.widthMm+r.gapMm),length=r.lengthMm,width=r.widthMm
    for(const px of [x+18,x+length-36])for(const pz of [z+18,z+width-36]){
      add('rack upright',px,110,pz,18,r.heightMm-110,18)
      add('caster fork',px-8,55,pz-8,34,55,34,'#62666a')
      add('four-inch caster',px-12,0,pz-37,42,101.6,101.6,'#18191b')
    }
    for(const y of r.shelfLevelsMm){
      for(const pz of [z,z+width-12])add('rack shelf edge',x,y,pz,length,22,12)
      for(const px of [x,x+length-12])add('rack shelf end',px,y,z,12,22,width)
      for(let along=22;along<length-12;along+=30)add('wire shelf',x+along,y+16,z+12,4,4,width-24)
      add('shelf centre support',x+12,y+8,z+width/2-3,length-24,6,6)
    }
  }
  const cover=s.slidingCover
  if(cover){
    const px=s.fromKitchenWestMm-cover.frontOffsetMm
    add('storage sliding track',px-12,cover.heightMm+35,cover.fromSouthMm-cover.travelMm,65,45,cover.widthMm+cover.travelMm,'#65625d')
    add('storage sliding cover front',px,12,cover.fromSouthMm,28,cover.heightMm-12,cover.widthMm,'#c5b49e')
    parts[parts.length-1].sliding=true
    add('storage sliding cover handle',px-20,950,cover.fromSouthMm+cover.widthMm-85,20,180,18,'#756650')
    parts[parts.length-1].sliding=true
  }
  return parts
}
export function createStoreStorage(){
  const group=new THREE.Group();group.name='Two sideways five-shelf rolling racks beside refrigerator'
  const sliding=[]
  for(const p of storeStorageParts()){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(p.w/1000,p.h/1000,p.d/1000),new THREE.MeshStandardMaterial({color:p.color,roughness:.72}))
    if(p.name==='storage sliding cover front')tagSurfaceMaterial(mesh.material,'wood','storage')
    mesh.name=p.name;mesh.position.set((p.x+p.w/2)/1000,(p.y+p.h/2)/1000,(p.z+p.d/2)/1000)
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
    if(p.sliding)sliding.push({mesh,z:mesh.position.z})
  }
  group.userData.setCoverOpen=open=>sliding.forEach(({mesh,z})=>{mesh.position.z=z-(open?KITCHEN_STORE_STORAGE.slidingCover.travelMm/1000:0)})
  return group
}
