import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import * as THREE from 'three'
import {createBedroom3OakMaterial} from './Bedroom3OakMaterial.js'

export function createBedroom3DressingTable(room){
  const group=new THREE.Group();group.name='Bedroom 3 standing vanity'
  const d=room.furniture?.dressingTable
  if(!d)return group
  const x=((d.fromWestMm||0)+d.widthMm/2)/1000,w=d.widthMm/1000,depth=d.depthMm/1000,h=d.heightMm/1000
  if(d.wall==='east'){
    group.rotation.y=-Math.PI/2
    group.position.set(room.widthMm/1000,0,d.fromNorthMm/1000)
  }
  const oak=createBedroom3OakMaterial({base:'#96633d',roughness:.6})
  const pale=createBedroom3OakMaterial({base:'#b27d4c',roughness:.42})
  const dark=new THREE.MeshStandardMaterial({color:'#6c482f',roughness:.55})
  tagSurfaceMaterial(dark,'wood','bedroom3')
  const glass=new THREE.MeshStandardMaterial({color:'#bdced2',metalness:.88,roughness:.12})
  const glow=new THREE.MeshStandardMaterial({color:'#fff0ce',emissive:'#ffe0a0',emissiveIntensity:.8})
  glow.userData.taskLightGlow=true
  const box=(width,height,length,cx,cy,cz,mat,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,length),mat)
    mesh.position.set(cx,cy,cz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh)
  }
  if(d.integratedWithWardrobe){
    const start=d.fromNorthMm/1000,end=start+w,front=depth+.055
    // The wardrobe carcass supplies the top, bottom and back of this bay.
    // The wood lining, drawers and mirrored leaf form one compact dressing unit.
    box(.016,h-.08,w-.04,.045,h/2,(start+end)/2,oak)
    box(depth-.09,.024,w-.06,depth/2,h-.11,(start+end)/2,oak)
    for(const y of [.62,.85,1.08,1.31]){
      box(depth-.16,.025,w-.08,(depth-.16)/2+.09,y,(start+end)/2,oak)
    }
    for(const y of [.18,.39]){
      box(.027,.185,w-.055,depth+.022,y,(start+end)/2,pale)
      box(.01,.018,.14,depth+.044,y,(start+end)/2,dark)
    }
    const leaf=new THREE.Group()
    leaf.position.set(front,0,start+.018);group.add(leaf)
    const doorBottom=d.doorBottomMm/1000,doorTop=d.doorTopMm/1000
    const doorHeight=doorTop-doorBottom
    box(.025,doorHeight,w-.035,0,(doorBottom+doorTop)/2,(w-.035)/2,pale,leaf)
    const mw=d.mirrorWidthMm/1000,mh=d.mirrorHeightMm/1000
    const my=(d.mirrorBottomMm+d.mirrorHeightMm/2)/1000
    const rounded=(width,height,radius)=>{
      const s=new THREE.Shape(),left=-width/2,right=width/2,bottom=-height/2,top=height/2
      s.moveTo(left+radius,bottom)
      s.lineTo(right-radius,bottom);s.quadraticCurveTo(right,bottom,right,bottom+radius)
      s.lineTo(right,top-radius);s.quadraticCurveTo(right,top,right-radius,top)
      s.lineTo(left+radius,top);s.quadraticCurveTo(left,top,left,top-radius)
      s.lineTo(left,bottom+radius);s.quadraticCurveTo(left,bottom,left+radius,bottom)
      return new THREE.ShapeGeometry(s)
    }
    for(const [width,height,offset,mat] of [[mw+.035,mh+.035,-.037,glow],[mw,mh,-.043,glass]]){
      const panel=new THREE.Mesh(rounded(width,height,Math.min(width*.48,.23)),mat)
      panel.rotation.y=-Math.PI/2;panel.position.set(offset,my,w/2)
      panel.material.side=THREE.DoubleSide;leaf.add(panel)
    }
    box(.02,.11,.025,.04,1.07,w-.09,dark,leaf)
    group.userData.setMirrorOpen=open=>{leaf.rotation.y=open?Math.PI*.48:0}
    return group
  }
  box(w,.16,depth,x,h-.08,depth/2+.02,oak)
  const lowerBottom=.08,lowerTop=h-.19,lowerHeight=lowerTop-lowerBottom,lowerCenter=(lowerTop+lowerBottom)/2
  box(w,lowerHeight,depth,x,lowerCenter,depth/2+.02,oak)
  for(const dx of [-w/4,w/4]){
    box(w/2-.012,lowerHeight-.02,.018,x+dx,lowerCenter,depth+.027,pale)
    box(.018,.1,.018,x+dx+(dx<0?.1:-.1),lowerCenter,depth+.044,dark)
  }
  box(w+.015,.025,depth+.01,x,h+.0125,depth/2+.02,pale)
  for(const dx of [-w/4,w/4]){
    box(w/2-.012,.13,.018,x+dx,h-.085,depth+.027,pale)
    box(.12,.012,.015,x+dx,h-.075,depth+.043,dark)
  }
  const mw=d.mirrorWidthMm/1000,mh=d.mirrorHeightMm/1000,my=(d.mirrorBottomMm+d.mirrorHeightMm/2)/1000
  // Account for the mirrored leaf so its face is flush with the lower fronts.
  const frontZ=depth+.036,upperDepth=depth-.012,bottom=my-mh/2
  box(mw+.04,mh+.04,.018,x,my,.035,oak)
  for(const dx of [-mw/2-.01,mw/2+.01])box(.02,mh+.04,upperDepth,x+dx,my,.02+upperDepth/2,oak)
  for(const y of [bottom-.01,bottom+mh*.25,bottom+mh*.5,bottom+mh*.75,bottom+mh+.01])box(mw,.02,upperDepth-.02,x,y,.02+upperDepth/2,pale)
  const leaf=new THREE.Group();leaf.position.set(x-mw/2-.015,0,frontZ-.017);group.add(leaf)
  box(mw+.03,mh+.03,.02,(mw+.03)/2,my,0,oak,leaf)
  box(mw,mh,.006,(mw+.03)/2,my,.014,glass,leaf)
  box(.015,.12,.018,mw+.01,my-.2,.025,dark,leaf)
  group.userData.setMirrorOpen=open=>{leaf.rotation.y=open?-Math.PI*.48:0}
  for(const dx of [-mw/2-.055,mw/2+.055])box(.024,mh-.06,.03,x+dx,my,frontZ-.015,glow)
  return group
}
