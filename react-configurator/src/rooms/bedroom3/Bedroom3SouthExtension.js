import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createWindowDetail} from '../shared/WindowDetail.js'

// The cabinet projects through Bedroom 3's south wall; the balcony sits beside it.
// Room-frame metres: x east from the west wall, z south from the north wall (the room's south line is z = lengthMm).
// With balcony.enclosed (phone scan 2026-10-04) the balcony is a walled, roofed bay open to the room under a beam, with
// its window on the outer wall; otherwise the older open balcony with railings is drawn.
export function createBedroom3SouthExtension(room){
  const group=new THREE.Group()
  group.name='Bedroom 3 south cabinet and railed balcony'
  const wallZ=room.lengthMm/1000,H=room.heightMm/1000
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
  if(balcony.enclosed){
    group.name='Bedroom 3 south cabinet and enclosed balcony'
    const wall=new THREE.MeshStandardMaterial({color:'#d6d1c9',roughness:.86})
    tagSurfaceMaterial(wall,'plaster','bedroom3')
    const frame=new THREE.MeshStandardMaterial({color:'#f1ede6',roughness:.6})
    const darkFrame=new THREE.MeshStandardMaterial({color:'#171a1e',metalness:.55,roughness:.28})
    const glass=new THREE.MeshStandardMaterial({color:'#b8e3ef',transparent:true,opacity:.42,roughness:.08,metalness:.15,side:THREE.DoubleSide,depthWrite:false})
    const T=.1,ceiling=(balcony.ceilingMm||room.heightMm)/1000,outerZ=wallZ+bd
    // End walls, full balcony depth, up to the balcony soffit.
    for(const x of [bx,bx+bw])addBox(T,ceiling,bd+T/2,x,ceiling/2,wallZ+(bd+T/2)/2,wall)
    // Outer wall around the window (the window frame may reach an end wall).
    const win=balcony.outerWindow,wf=win.fromWestMm/1000,wt=(win.fromWestMm+win.widthMm)/1000,sill=win.sillMm/1000,head=win.topMm/1000
    const span=(from,to,bottom,top)=>{if(to>from&&top>bottom)addBox(to-from,top-bottom,T,(from+to)/2,(bottom+top)/2,outerZ,wall)}
    span(bx,wf,0,ceiling);span(wt,bx+bw,0,ceiling);span(wf,wt,0,sill);span(wf,wt,head,ceiling)
    group.add(createWindowDetail({kind:'window',from:wf,to:wt,bottom:sill,top:head,frameStyle:win.frameStyle,mullionFractions:win.mullionFractions,design:win.transomMm||win.bays||win.rollerNet||win.outsideScreen?win:undefined},{z:outerZ,outward:1,materials:{frame,darkFrame,glass,handle:metal}}))
    // No soffit slab: the room shell draws no ceiling either, and a lid would hide the balcony in the overview and top
    // views. ceilingMm (2690) only sets the wall heights here. Then the beam over the opening and the columns.
    const beam=balcony.beam,opening=balcony.opening
    if(beam){const w=beam.widthMm/1000,under=beam.undersideMm/1000;addBox(bw,H-under,w,bx+bw/2,(H+under)/2,wallZ-w/2,wall)}
    const jamb=balcony.westJamb
    if(jamb){const d=jamb.intoRoomMm/1000,w=jamb.widthMm/1000;addBox(w,H,d,opening.fromWestMm/1000-w/2,H/2,wallZ-d/2,wall)}
    const column=balcony.eastColumn
    if(column){const from=column.fromWestMm/1000,to=bx+bw,d=column.depthMm/1000;addBox(to-from,ceiling,d,(from+to)/2,ceiling/2,wallZ+d/2,wall)}
    return group
  }
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
