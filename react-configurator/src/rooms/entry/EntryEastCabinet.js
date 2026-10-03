import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'

// The existing cabinet in the east compartment of the pocket behind the Drawing Room's north wall (owner, 2026-10-03).
// Sizes: ENTRY.wallCavity.eastCabinet (plan pixels and mm). Its doors face east, onto the Entry gallery. `x`/`z` convert
// plan pixels to the caller's metres, so Whole home 3D and the Main entry view draw the same cabinet.
export function createEntryEastCabinet(x,z){
  const e=ENTRY.wallCavity.eastCabinet,g=new THREE.Group();g.name='Entry pocket east cabinet'
  const body=new THREE.MeshStandardMaterial({color:'#b18b67',roughness:.7});tagSurfaceMaterial(body,'wood')
  const front=new THREE.MeshStandardMaterial({color:'#a57f5c',roughness:.62});tagSurfaceMaterial(front,'wood')
  const pull=new THREE.MeshStandardMaterial({color:'#2b2622',roughness:.45,metalness:.4})
  const xFace=x(e.planX1),xBack=x(e.planX2),z1=Math.min(z(e.planY1),z(e.planY2)),z2=Math.max(z(e.planY1),z(e.planY2))
  const out=Math.sign(xFace-xBack) // +1 or -1: the direction the doors face
  const depth=Math.abs(xBack-xFace),width=z2-z1,h=e.heightMm/1000,t=e.panelMm/1000,doorH=e.doorHeightMm/1000,xMid=(xFace+xBack)/2,zMid=(z1+z2)/2
  const box=(w,hh,d,cx,cy,cz,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),material)
    mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh
  }
  // Carcass: two sides, back, top, floor panel, and shelves behind the doors.
  box(depth,h,t,xMid,h/2,z1+t/2,body);box(depth,h,t,xMid,h/2,z2-t/2,body)
  box(t,h,width,xBack+out*t/2,h/2,zMid,body)
  box(depth,t,width,xMid,h-t/2,zMid,body);box(depth,t,width,xMid,t/2,zMid,body)
  for(const y of [...e.shelfHeightsMm,e.doorHeightMm])box(depth-2*t,t,width-2*t,xMid,y/1000,zMid,body)
  // Doors on the east face: tall leaves to doorHeightMm and a loft pair above, with a 3 mm reveal between leaves.
  const leaf=width/e.doorCount,gap=.003
  for(let i=0;i<e.doorCount;i++){
    const cz=z1+leaf*(i+.5)
    box(t,doorH-2*gap,leaf-2*gap,xFace-out*t/2,doorH/2,cz,front)
    box(t,h-doorH-2*gap,leaf-2*gap,xFace-out*t/2,(h+doorH)/2,cz,front)
    // Pulls meet at the middle of the pair.
    const pz=z1+leaf*(i+(i%2?.12:.88))
    box(.02,.26,.016,xFace+out*.01,1.05,pz,pull)
  }
  return g
}
