import * as THREE from 'three'
import {createBedroom3OakMaterial} from './Bedroom3OakMaterial.js'
import {markItem} from '../../render/dimensionPick.js'

// Config is mm, room-local x east / z south / y up; Three.js uses metres. Every size comes from
// roomShellConfig.js bedroom3.furniture.eastCabinet (owner 2026-10-03; units swapped 2026-10-05: the mirror dressing
// cabinet is the SOUTH unit, the full-height storage cabinet the NORTH unit). Fronts and recessed pulls stay inside each
// unit's overall depth (its own depthMm, else the run's).
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
  const depthOf=spec=>(spec.depthMm??c.depthMm)/1000
  const carcass=(spec,parent,{openBottom=false}={})=>{
    const z=spec.fromNorthMm/1000,w=spec.widthMm/1000,h=spec.heightMm/1000,b=(spec.bottomMm||0)/1000,dd=depthOf(spec)
    box(p,h,w,W-p/2,b+h/2,z+w/2,oak,parent)
    for(const end of [z+p/2,z+w-p/2])box(dd,h,p,W-dd/2,b+h/2,end,oak,parent)
    box(dd,p,w-2*p,W-dd/2,b+h-p/2,z+w/2,oak,parent)
    if(!openBottom)box(dd,p,w-2*p,W-dd/2,b+p/2,z+w/2,oak,parent)
  }
  return {c,W,d,p,group,oak,front,dark,box,carcass,depthOf}
}

/** The mirror dressing cabinet (eastCabinet.south since 2026-10-05): drawers below, a mirrored door that opens. */
export function createBedroom3EastDressing(room){
  const {c,W,d,p,group,oak,front,dark,box,carcass}=builder(room,'Bedroom 3 southeast dressing cabinet')
  markItem(group,'Southeast mirror dressing cabinet · 18 inch depth')
  const s=c.south,z=s.fromNorthMm/1000,w=s.widthMm/1000
  const bottom=s.mirrorBottomMm/1000,top=s.mirrorTopMm/1000,h=top-bottom
  carcass(s,group)
  // Shelves behind the mirror door, evenly between the drawers and the top.
  for(let i=0;i<5;i++)box(d-2*p,p,w-2*p,W-d/2,bottom-p/2+(s.heightMm/1000-bottom)*i/5,z+w/2,oak)
  const drawers=s.drawerCount||0,drawerH=(bottom-p)/Math.max(1,drawers)
  for(let i=0;i<drawers;i++){
    const y=p+drawerH*(i+.5)
    box(p,drawerH-.02,w-2*p,W-d+p/2+.004,y,z+w/2,front)
    box(.004,.012,.15,W-d+.002,y+drawerH/2-.05,z+w/2,dark)
  }
  // Hinged on the edge named by mirrorHinge; the leaf opens west into the room.
  const north=(s.mirrorHinge??'north')==='north',sign=north?1:-1,leafW=w-2*p
  const leaf=new THREE.Group();leaf.position.set(W-d+p/2+.004,0,north?z+p:z+w-p);group.add(leaf)
  box(p,h,leafW,0,(bottom+top)/2,sign*leafW/2,front,leaf)
  const mirror=new THREE.MeshStandardMaterial({color:'#bdced2',metalness:.88,roughness:.12})
  box(.004,h-.05,leafW-.05,-p/2-.002,(bottom+top)/2,sign*leafW/2,mirror,leaf)
  box(.006,.14,.016,-p/2-.004,(bottom+top)/2,sign*(leafW-.04),dark,leaf)
  group.userData.setMirrorOpen=open=>{leaf.rotation.y=open?-sign*Math.PI*.48:0}
  return group
}

/** The full-height north storage cabinet, the overhead run with the slatted AC bay, and the headboard shelf. */
export function createBedroom3EastCabinets(room){
  const {c,W,d,p,group,oak,front,dark,box,carcass,depthOf}=builder(room,'Bedroom 3 east cabinetry')
  const n=c.north,nd=depthOf(n),nz=n.fromNorthMm/1000,nw=n.widthMm/1000,nh=n.heightMm/1000,loft=(n.loftBottomMm??n.heightMm)/1000
  const storage=markItem(new THREE.Group(),'Northeast full-height storage cabinet · floor to ceiling');group.add(storage)
  carcass(n,storage)
  for(const y of [...(n.shelvesMm??[]).map(v=>v/1000),loft])box(nd-2*p,p,nw-2*p,W-nd/2,y,nz+nw/2,oak,storage)
  // A pair of solid leaves below the loft line and a loft pair above it, hinged on the outer edges.
  const count=n.doorCount||2,leafW=(nw-2*p)/count
  for(const [y0,y1] of [[p,loft],[loft,nh-p]])for(let i=0;i<count;i++){
    const zc=nz+p+leafW*(i+.5)
    box(p,y1-y0-.006,leafW-.006,W-nd+p/2+.004,(y0+y1)/2,zc,front,storage)
    if(y0===p)box(.004,.22,.012,W-nd+.002,Math.min(1.1,(y0+y1)/2),zc+(i<count/2?1:-1)*(leafW/2-.04),dark,storage)
  }
  const b=c.bridge,a=c.ac,bz=b.fromNorthMm/1000,bw=b.widthMm/1000,by=b.bottomMm/1000,bh=b.heightMm/1000
  const az=a.centerFromNorthMm/1000,aw=a.bayWidthMm/1000
  const bridge=markItem(new THREE.Group(),'Overhead cabinets and slatted AC cover · 18 inch depth');group.add(bridge)
  // Open underside under the AC; closed storage compartments on either side, the doors shared out by length.
  carcass(b,bridge,{openBottom:true})
  const sections=[[bz,az-aw/2],[az+aw/2,bz+bw]].filter(([start,end])=>end-start>2*p),closed=sections.reduce((sum,[s,e])=>sum+e-s,0)
  for(const [start,end] of sections){
    const length=end-start,doors=Math.max(1,Math.round(b.doorCount*length/closed))
    box(d,p,length,W-d/2,by+p/2,(start+end)/2,oak,bridge)
    for(let i=0;i<doors;i++)box(p,bh-2*p,length/doors-.006,W-d+p/2,by+bh/2,start+length*(i+.5)/doors,front,bridge)
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
