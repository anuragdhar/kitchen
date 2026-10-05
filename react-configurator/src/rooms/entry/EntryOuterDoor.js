import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {entryOuterDoorGeometry,entryDoorLeaf} from '../../domain/entryFittings.mjs'

// Steel safety leaf on the corridor face of arrivalDoor; the landing opening has no door (owner 2026-10-06).
// Sizes: ENTRY.outerDoor and entryOuterDoorGeometry() (mm); `x`/`z` convert plan pixels to the caller's metres, so
// Whole home 3D and the Main entry page draw the same door. Plan axes: +X points west (outside), +Z points north.
export function createEntryOuterDoor(x,z){
  const d=ENTRY.outerDoor,o=ENTRY[d.mountedAt],g=entryOuterDoorGeometry(ENTRY),leaf=entryDoorLeaf(ENTRY,'outerDoor')
  const group=new THREE.Group();group.name='Ventilated stainless steel outer door'
  const steel=new THREE.MeshStandardMaterial({color:'#c9cdd1',metalness:.85,roughness:.38})
  const sheet=new THREE.MeshStandardMaterial({color:'#bfc4c9',metalness:.8,roughness:.45})
  const mesh=new THREE.MeshStandardMaterial({color:'#2f3438',metalness:.4,roughness:.75,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false})
  const wallX=x(o.wallPlanX)+leaf.hingeX/1000,south=z(o.fromPlanY),north=z(o.toPlanY)
  const frame=(d.frameMm+d.leafJambGapMm)/1000,t=d.leafThicknessMm/1000,H=o.heightMm/1000
  const box=(w,h,dd,cx,cy,cz,material,parent=group)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),material)
    m.position.set(cx,cy,cz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m
  }
  // Frame: two jambs and a head, box sections fixed inside the opening.
  box(t+.02,H,frame,wallX,H/2,south+frame/2,steel)
  box(t+.02,H,frame,wallX,H/2,north-frame/2,steel)
  box(t+.02,d.frameMm/1000,north-south,wallX,H-d.frameMm/2000,(south+north)/2,steel)
  // Proposed packed jambs include leafJambGapMm. Leaf opens west into the corridor, never onto the landing.
  const sign=leaf.sign
  const leafW=g.leafWidthMm/1000,leafH=g.leafHeightMm/1000
  const pivot=new THREE.Group();pivot.name=`Outer door leaf (hinge ${d.hinge}, opens ${d.opens})`
  pivot.position.set(wallX,d.floorGapMm/1000,south+leaf.hingeZ/1000)
  const setOpen=degrees=>{pivot.rotation.y=leaf.rotationSign*Math.min(d.maxOpenAngleDegrees,Math.max(0,degrees))*Math.PI/180}
  setOpen(d.openAngleDegrees);group.add(pivot)
  const zc=sign*leafW/2,inner=leafW-2*t
  // Leaf frame: bottom and top rails, hinge and lock stiles.
  box(t,t,leafW,0,t/2,zc,steel,pivot);box(t,t,leafW,0,leafH-t/2,zc,steel,pivot)
  box(t,leafH,t,0,leafH/2,sign*t/2,steel,pivot);box(t,leafH,t,0,leafH/2,sign*(leafW-t/2),steel,pivot)
  for(const p of g.panels){
    const h=p.heightMm/1000,cy=(p.fromMm+p.toMm)/2000
    if(p.kind==='sheet'){box(Math.max(d.sheetMm/1000,.006),h,inner,0,cy,zc,sheet,pivot);continue}
    // Grille: vertical square bars at the pitch, centred across the leaf, with the insect mesh on the inside face behind them.
    const bar=p.barMm/1000,pitch=p.pitchMm/1000,count=Math.floor((inner-bar)/pitch)+1,first=t+(inner-(count-1)*pitch)/2
    for(let i=0;i<count;i++)box(bar,h,bar,0,cy,sign*(first+i*pitch),steel,pivot)
    const m=box(.002,h,inner,-t/4,cy,zc,mesh,pivot);m.castShadow=false
  }
  // Lock: case on the lock stile with a lever handle on both faces (the inside of the home is toward -X).
  const lockY=d.lock.heightMm/1000,lockZ=sign*(leafW-.07)
  box(t+.004,.18,.03,0,lockY,lockZ,steel,pivot)
  for(const face of [-1,1]){
    box(.012,.05,.05,face*(t/2+.006),lockY,lockZ,steel,pivot)
    box(.012,.012,.12,face*(t/2+.03),lockY,lockZ-sign*.05,steel,pivot)
  }
  group.userData.setOpen=setOpen
  return group
}
