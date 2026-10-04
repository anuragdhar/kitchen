import * as THREE from 'three'
import {createBedroom3OakMaterial} from './Bedroom3OakMaterial.js'
import {markItem} from '../../render/dimensionPick.js'

// Config is mm, room-local x east / z south / y up; Three.js uses metres.
// Fronts and recessed pulls stay inside the requested overall depth.
function builder(room,name){
  const c=room.furniture.eastCabinet,W=room.widthMm/1000,d=c.depthMm/1000,p=c.panelMm/1000
  const group=new THREE.Group();group.name=name
  const oak=createBedroom3OakMaterial({base:'#96633d',roughness:.6})
  const front=createBedroom3OakMaterial({base:'#b27d4c',roughness:.42})
  const dark=new THREE.MeshStandardMaterial({color:'#44382c',roughness:.65})
  const box=(width,height,length,x,y,z,mat=oak,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,length),mat)
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh
  }
  const carcass=(spec,parent,{openBottom=false}={})=>{
    const z=spec.fromNorthMm/1000,w=spec.widthMm/1000,h=spec.heightMm/1000,b=(spec.bottomMm||0)/1000
    box(p,h,w,W-p/2,b+h/2,z+w/2,oak,parent)
    for(const end of [z+p/2,z+w-p/2])box(d,h,p,W-d/2,b+h/2,end,oak,parent)
    box(d,p,w-2*p,W-d/2,b+h-p/2,z+w/2,oak,parent)
    if(!openBottom)box(d,p,w-2*p,W-d/2,b+p/2,z+w/2,oak,parent)
  }
  return {c,W,d,p,group,oak,front,dark,box,carcass}
}

export function createBedroom3EastDressing(room){
  const {c,W,d,p,group,oak,front,dark,box,carcass}=builder(room,'Bedroom 3 northeast dressing cabinet')
  markItem(group,group.name)
  const n=c.north,z=n.fromNorthMm/1000,w=n.widthMm/1000
  carcass(n,group)
  for(const y of [.28,.52,.95,1.35,1.75])box(d-2*p,p,w-2*p,W-d/2,y,z+w/2,oak)
  for(const y of [.145,.405]){
    box(p,.24,w-2*p,W-d+p/2+.004,y,z+w/2,front)
    box(.004,.012,.15,W-d+.002,y+.09,z+w/2,dark)
  }
  const bottom=n.mirrorBottomMm/1000,top=n.mirrorTopMm/1000,h=top-bottom
  const leaf=new THREE.Group();leaf.position.set(W-d+p/2+.004,0,z+p);group.add(leaf)
  box(p,h,w-2*p,0,(bottom+top)/2,(w-2*p)/2,front,leaf)
  const mirror=new THREE.MeshStandardMaterial({color:'#bdced2',metalness:.88,roughness:.12})
  box(.004,h-.05,w-2*p-.05,-p/2-.002,(bottom+top)/2,(w-2*p)/2,mirror,leaf)
  group.userData.setMirrorOpen=open=>{leaf.rotation.y=open?-Math.PI*.48:0}
  return group
}

export function createBedroom3EastCabinets(room){
  const {c,W,d,p,group,oak,front,dark,box,carcass}=builder(room,'Bedroom 3 east cabinetry')
  const south=markItem(new THREE.Group(),'Southeast bedside cabinet · 18 inch depth');group.add(south)
  carcass(c.south,south)
  const s=c.south,sw=s.widthMm/1000,sh=s.heightMm/1000,sz=(s.fromNorthMm+s.widthMm/2)/1000
  for(let i=0;i<s.drawerCount;i++){
    const h=(sh-2*p)/s.drawerCount,y=p+h*(i+.5)
    box(p,h-.006,sw-2*p,W-d+p/2+.004,y,sz,front,south)
    box(.004,.012,.15,W-d+.002,y+h/2-.025,sz,dark,south)
  }
  const b=c.bridge,a=c.ac,bz=b.fromNorthMm/1000,bw=b.widthMm/1000,by=b.bottomMm/1000,bh=b.heightMm/1000
  const az=a.centerFromNorthMm/1000,aw=a.bayWidthMm/1000
  const bridge=markItem(new THREE.Group(),'Overhead cabinets and slatted AC cover · 18 inch depth');group.add(bridge)
  // Open underside under the AC; closed storage compartments on either side.
  carcass(b,bridge,{openBottom:true})
  for(const [start,end] of [[bz,az-aw/2],[az+aw/2,bz+bw]]){
    const length=end-start
    box(d,p,length,W-d/2,by+p/2,(start+end)/2,oak,bridge)
    for(let i=0;i<b.doorCount/2;i++)box(p,bh-2*p,length/(b.doorCount/2)-.006,W-d+p/2,by+bh/2,start+length*(i+.5)/(b.doorCount/2),front,bridge)
  }
  for(const z of [az-aw/2-p/2,az+aw/2+p/2])box(d,bh,p,W-d/2,by+bh/2,z,oak,bridge)
  const unit=new THREE.MeshStandardMaterial({color:'#f1f3f1',roughness:.48})
  const ux=W-(a.wallGapMm+a.unitDepthMm/2)/1000,uy=(a.bottomMm+a.unitHeightMm/2)/1000
  box(a.unitDepthMm/1000,a.unitHeightMm/1000,a.unitWidthMm/1000,ux,uy,az,unit,bridge)
  box(.012,.025,(a.unitWidthMm-100)/1000,ux-a.unitDepthMm/2000-.006,a.bottomMm/1000+.025,az,dark,bridge)
  const slat=a.slatHeightMm/1000,pitch=(a.slatHeightMm+a.slatGapMm)/1000
  for(let y=by+slat/2;y<by+bh-p;y+=pitch)box(p,slat,aw,W-d+p/2,y,az,front,bridge)
  const shelf=c.shelf
  const shelfGroup=markItem(new THREE.Group(),'Headboard shelf');group.add(shelfGroup)
  box(shelf.depthMm/1000,p,shelf.widthMm/1000,W-shelf.depthMm/2000,shelf.heightMm/1000-p/2,(shelf.fromNorthMm+shelf.widthMm/2)/1000,front,shelfGroup)
  return group
}
