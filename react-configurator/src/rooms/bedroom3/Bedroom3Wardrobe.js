import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createBedroom3OakMaterial} from './Bedroom3OakMaterial.js'
import {createBedroom3EastCabinets} from './Bedroom3EastCabinet.js'

export function createBedroom3Wardrobe(room){
  if(room.furniture?.eastCabinet)return createBedroom3EastCabinets(room)
  const group=new THREE.Group()
  group.name='Bedroom 3 west-wall sliding wardrobe'
  const wardrobe=room.furniture?.westWardrobe
  if(!wardrobe)return group
  const depth=wardrobe.depthMm/1000,length=wardrobe.lengthMm/1000,height=wardrobe.heightMm/1000
  const start=wardrobe.fromNorthMm/1000,centerZ=start+length/2
  const carcass=createBedroom3OakMaterial({base:'#96633d',roughness:.6})
  const door=createBedroom3OakMaterial({base:'#b27d4c',roughness:.42})
  const edge=new THREE.MeshStandardMaterial({color:'#6c482f',roughness:.55})
  tagSurfaceMaterial(edge,'wood','bedroom3')
  const pull=new THREE.MeshStandardMaterial({color:'#856b49',metalness:.55,roughness:.34})
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)
  }
  box(depth,.045,length,depth/2,.04,centerZ,carcass)
  box(depth,.045,length,depth/2,height-.025,centerZ,carcass)
  for(const z of [start+.022,start+length-.022])box(depth,height,.045,depth/2,height/2,z,carcass)
  box(.025,height,length,.035,height/2,centerZ,carcass)
  const vanityBay=(wardrobe.vanityBayWidthMm||0)/1000
  const clothesLength=length-vanityBay
  if(vanityBay)box(depth,height,.025,depth/2,height/2,start+vanityBay,carcass)
  const count=wardrobe.doorCount||3,panelLength=clothesLength/count+.015
  for(let i=0;i<count;i++){
    const z=start+vanityBay+clothesLength*(i+.5)/count
    const x=depth+(i%2===0?.006:.028)
    box(.027,height-.11,panelLength,x,(height+.045)/2,z,door)
    box(.035,height-.11,.012,x+.018,(height+.045)/2,z+(i%2===0?panelLength/2:-panelLength/2),edge)
    box(.025,.19,.025,x+.035,1.08,z+(i%2===0?.21:-.21),pull)
  }
  return group
}
