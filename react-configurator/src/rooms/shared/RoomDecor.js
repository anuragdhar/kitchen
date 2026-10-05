import * as THREE from 'three'

// Small reusable decor pieces (metres, y-up, positioned by the caller) added
// on the owner's 2026-09-28 request to make the lobby/dining, Bedroom 1 and
// Study views feel furnished rather than bare shells. Purely decorative:
// nothing here changes room geometry, openings or stored layouts, and the
// materials are deliberately untagged so the interior-materials panel does
// not repaint soft furnishings as wood or plaster.
//
// Same-day follow-up from the owner: decor must stay OUT of the high-quality
// Blender renders ("no artificial objects in the render"), so every factory
// tags its group archvizExclude - the live views keep the styling, the
// archviz capture skips it entirely.

const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0,...extra})
// The floor lamp, potted plant and laundry hamper moved to furniture/decor.js (tables-and-chairs round, 2026-10-06): built
// procedurally with layered leaves, a shade with thickness and a woven hamper. Re-exported here for the existing callers.
export {createPottedPlant,createFloorLamp,createLaundryHamper} from './furniture/decor.js'

const decorGroup=name=>{const group=new THREE.Group();group.name=name;group.userData.archvizExclude=true;return group}

export function createRug(width,depth,color){
  const group=decorGroup('decor rug')
  const border=new THREE.Mesh(new THREE.BoxGeometry(width+.06,.010,depth+.06),mat('#d8cfc2',{roughness:.95}))
  border.position.y=.005;group.add(border)
  const rug=new THREE.Mesh(new THREE.BoxGeometry(width,.012,depth),mat(color,{roughness:.95}))
  rug.position.y=.011;group.add(rug)
  return group
}

export function createWallArt(width,height,artColor){
  const group=decorGroup('decor wall art')
  const frame=new THREE.Mesh(new THREE.BoxGeometry(width,height,.035),mat('#2e2a26',{roughness:.5}))
  group.add(frame)
  const canvas=new THREE.Mesh(new THREE.BoxGeometry(width-.07,height-.07,.012),mat(artColor,{roughness:.65}))
  canvas.position.z=.017;group.add(canvas)
  const accent=new THREE.Mesh(new THREE.BoxGeometry((width-.07)*.55,(height-.07)*.4,.004),mat('#e7dccb',{roughness:.7}))
  accent.position.set(-(width-.07)*.12,(height-.07)*.16,.026);group.add(accent)
  return group
}

export function createCushion(width,color){
  const cushion=new THREE.Mesh(new THREE.BoxGeometry(width,width*.42,width*.9),mat(color,{roughness:.95}))
  cushion.name='decor cushion';cushion.userData.archvizExclude=true
  cushion.geometry.translate(0,width*.21,0)
  return cushion
}
