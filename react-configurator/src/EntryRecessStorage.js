import * as THREE from 'three'
import {ENTRY} from './config/entryConfig.js'

// Shared plan coordinates keep the cupboard and access aligned in all three views.
export function createEntryRecessStorage(x,z){
  const s=ENTRY.drawingStorage,g=new THREE.Group()
  g.name='Drawing Room northwest recess storage (estimated footprint)'
  const wood=new THREE.MeshStandardMaterial({color:'#ac8967',roughness:.7})
  const front=new THREE.MeshStandardMaterial({color:'#d3ccc2',roughness:.75})
  const metal=new THREE.MeshStandardMaterial({color:'#8c7657',metalness:.6,roughness:.3})
  const box=(x1,x2,y1,y2,bottom,top,mat)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x(x2)-x(x1)),top-bottom,Math.abs(z(y2)-z(y1))),mat)
    mesh.position.set((x(x1)+x(x2))/2,(bottom+top)/2,(z(y1)+z(y2))/2)
    mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh)
  }
  box(s.planX1,s.planX2,715,775,-.04,0,wood)
  // Cabinet side separates the rear strip from the existing entry-facing storage.
  box(s.planX1,s.planX1+1,716,773,0,2.7,wood)
  box(s.planX1,s.planX2,773,774,0,2.7,wood)
  // Shallow shelves at the back leave access space inside the recess.
  for(const y of [.12,.55,1,1.45,1.9,2.35])box(s.planX1+1,687,754,773,y,y+.025,wood)
  box(s.doorX1,s.doorX2,713,717,2.1,2.7,front)
  for(const px of [s.doorX1,s.doorX2-2])box(px,px+2,713,717,0,2.1,wood)
  box(s.doorX1,s.doorX2,713,717,2.06,2.1,wood)
  const mid=(s.doorX1+s.doorX2)/2
  for(const [a,b] of [[s.doorX1+2,mid-.3],[mid+.3,s.doorX2-2]]){
    box(a,b,714,715.5,.025,2.055,front)
  }
  for(const px of [mid-2,mid+1])box(px,px+.7,712.5,714,1,1.16,metal)
  return g
}
