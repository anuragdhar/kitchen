import {tagSurfaceMaterial} from './render/surfaceRoles.mjs'
import * as THREE from 'three'

// The cabinet projects through Bedroom 3's south wall; the balcony sits beside it.
export function createBedroom3SouthExtension(room){
  const group=new THREE.Group()
  group.name='Bedroom 3 south cabinet and railed balcony'
  const wallZ=room.lengthMm/1000
  const {cabinet,balcony}=room.southExtension
  const wood=new THREE.MeshStandardMaterial({color:'#bfa98d',roughness:.69})
  tagSurfaceMaterial(wood,'wood','bedroom3')
  const front=new THREE.MeshStandardMaterial({color:'#e4dacb',roughness:.6})
  tagSurfaceMaterial(front,'wood','bedroom3')
  const metal=new THREE.MeshStandardMaterial({color:'#333c42',metalness:.62,roughness:.34})
  const floor=new THREE.MeshStandardMaterial({color:'#c7c4ba',roughness:.86})
  const addBox=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z)
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
    return mesh
  }
  const cabX=(cabinet.fromWestMm+cabinet.widthMm/2)/1000
  const cabW=cabinet.widthMm/1000,cabD=cabinet.depthMm/1000,cabH=cabinet.heightMm/1000,cabBottom=cabinet.floorClearanceMm/1000
  addBox(cabW,cabH,cabD,cabX,cabBottom+cabH/2,wallZ+cabD/2-.04,wood)
  // The west run masks the corner: put usable fronts beyond it, with a filler.
  const blocked=room.furniture?.westWardrobe?(room.furniture.westWardrobe.depthMm+60)/1000:0
  const frontStart=Math.max(cabinet.fromWestMm/1000,blocked)
  const usable=cabinet.fromWestMm/1000+cabW-frontStart
  if(blocked>0)addBox(blocked,cabH,.025,blocked/2,cabBottom+cabH/2,wallZ-.065,wood)
  for(let i=0;i<2;i++){
    const x=frontStart+usable*(i+.5)/2
    addBox(usable/2-.018,cabH-.05,.025,x,cabBottom+cabH/2,wallZ-.065,front)
    addBox(.018,.16,.026,x+usable*.17,cabBottom+cabH*.53,wallZ-.085,metal)
  }
  const bx=balcony.fromWestMm/1000,bw=balcony.widthMm/1000,bd=balcony.depthMm/1000,rh=balcony.railingHeightMm/1000
  addBox(bw,.06,bd,bx+bw/2,.015,wallZ+bd/2,floor)
  const rail=(x1,z1,x2,z2)=>{
    const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz)
    const horizontal=(y,h,d)=>{
      const mesh=addBox(length,h,d,(x1+x2)/2,y,(z1+z2)/2,metal)
      mesh.rotation.y=-Math.atan2(dz,dx)
    }
    horizontal(rh-.018,.036,.035)
    horizontal(.13,.025,.03)
    const posts=Math.ceil(length/.8)
    for(let i=0;i<=posts;i++)addBox(.045,rh,.045,x1+dx*i/posts,rh/2,z1+dz*i/posts,metal)
    const pickets=Math.ceil(length/.12)
    for(let i=1;i<pickets;i++)addBox(.014,rh-.16,.014,x1+dx*i/pickets,(rh+.13)/2,z1+dz*i/pickets,metal)
  }
  rail(bx,wallZ+cabD,bx,wallZ+bd)
  rail(bx,wallZ+bd,bx+bw,wallZ+bd)
  rail(bx+bw,wallZ+bd,bx+bw,wallZ)
  return group
}
