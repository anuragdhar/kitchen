import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'

// Plan axes: +X points west, +Z points north. Accept the view's plan converters.
export function createEntryArrivalDoor(x,z){
  const group=new THREE.Group();group.name='Outward-opening arrival door beside shoe rack'
  const door=ENTRY.arrivalDoor,height=door.heightMm/1000
  const wallX=x(door.wallPlanX),south=z(door.fromPlanY),north=z(door.toPlanY)
  const width=north-south
  const wood=new THREE.MeshStandardMaterial({color:'#825d44',roughness:.63})
  tagSurfaceMaterial(wood,'wood','entry')
  const frame=new THREE.MeshStandardMaterial({color:'#aa7b56',roughness:.67})
  tagSurfaceMaterial(frame,'wood','entry')
  const metal=new THREE.MeshStandardMaterial({color:'#ad936a',metalness:.67,roughness:.3})
  const box=(w,h,d,cx,cy,cz,material,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
  }
  for(const edge of [south+.025,north-.025])box(.12,height,.05,wallX,height/2,edge,frame)
  box(.12,.08,width,wallX,height+.04,(south+north)/2,frame)
  box(.085,(ENTRY.wallHeightMm-door.heightMm-80)/1000,width,wallX,(height+.08+ENTRY.wallHeightMm/1000)/2,(south+north)/2,new THREE.MeshStandardMaterial({color:'#d3ccc2',roughness:.85}))
  const pivot=new THREE.Group();pivot.name='Arrival door leaf opening west into approach'
  pivot.position.set(wallX,0,north-.045)
  pivot.rotation.y=-door.openAngleDegrees*Math.PI/180;group.add(pivot)
  const leafWidth=width-.09
  box(.045,height-.07,leafWidth,0,(height-.07)/2,-leafWidth/2,wood,pivot)
  for(const face of [-1,1])box(.04,.22,.025,face*.044,1.08,-leafWidth+.14,metal,pivot)
  return group
}
