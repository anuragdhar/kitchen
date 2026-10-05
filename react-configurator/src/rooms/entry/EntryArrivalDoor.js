import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {entryDoorLeaf} from '../../domain/entryFittings.mjs'
import doorWoodTexture from '../../../../Interior/entry-textures/arrival-door-wood.png'

// Plan axes: +X points west, +Z points north. Accept the view's plan converters.
export function createEntryArrivalDoor(x,z){
  const group=new THREE.Group();group.name='Proposed inward-opening wooden arrival door'
  const door=ENTRY.arrivalDoor,height=door.heightMm/1000,leaf=entryDoorLeaf(ENTRY,'arrivalDoor')
  const wallX=x(door.wallPlanX)+leaf.hingeX/1000,south=z(door.fromPlanY),north=z(door.toPlanY)
  const width=north-south
  // Real wood-grain photo, cropped from the owner's Scaniverse scan of this
  // exact door's jamb (Interior/scans/entry-scan-1.glb, owner request 2026-09-29).
  const doorWoodMap=new THREE.TextureLoader().load(doorWoodTexture)
  doorWoodMap.colorSpace=THREE.SRGBColorSpace
  doorWoodMap.wrapS=doorWoodMap.wrapT=THREE.RepeatWrapping
  doorWoodMap.repeat.set(1,2)
  const wood=new THREE.MeshStandardMaterial({map:doorWoodMap,color:'#c9a578',roughness:.63})
  tagSurfaceMaterial(wood,'wood','entry')
  const frame=new THREE.MeshStandardMaterial({color:'#aa7b56',roughness:.67})
  tagSurfaceMaterial(frame,'wood','entry')
  const metal=new THREE.MeshStandardMaterial({color:'#ad936a',metalness:.67,roughness:.3})
  const box=(w,h,d,cx,cy,cz,material,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)
    mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
  }
  const jamb=(door.frameMm+door.leafJambGapMm)/1000
  for(const edge of [south+jamb/2,north-jamb/2])box(.12,height,jamb,wallX,height/2,edge,frame)
  box(.12,.08,width,wallX,height+.04,(south+north)/2,frame)
  box(.085,(ENTRY.wallHeightMm-door.heightMm-80)/1000,width,x(door.wallPlanX),(height+.08+ENTRY.wallHeightMm/1000)/2,(south+north)/2,new THREE.MeshStandardMaterial({color:'#d3ccc2',roughness:.85}))
  const pivot=new THREE.Group();pivot.name=`Wooden leaf (hinge ${door.hinge}, opens ${door.opens}, proposed stop)`
  pivot.position.set(wallX,0,south+leaf.hingeZ/1000)
  const setOpen=degrees=>{pivot.rotation.y=leaf.rotationSign*Math.min(door.maxOpenAngleDegrees,Math.max(0,degrees))*Math.PI/180}
  setOpen(door.openAngleDegrees);group.add(pivot)
  const leafWidth=leaf.widthMm/1000,leafHeight=leaf.heightMm/1000
  box(leaf.thicknessMm/1000,leafHeight,leafWidth,0,leafHeight/2,leaf.sign*leafWidth/2,wood,pivot)
  for(const face of [-1,1])box(.04,.22,.025,face*.044,1.08,leaf.sign*(leafWidth-.14),metal,pivot)
  group.userData.setOpen=setOpen
  return group
}
