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
const decorGroup=name=>{const group=new THREE.Group();group.name=name;group.userData.archvizExclude=true;return group}

export function createRug(width,depth,color){
  const group=decorGroup('decor rug')
  const border=new THREE.Mesh(new THREE.BoxGeometry(width+.06,.010,depth+.06),mat('#d8cfc2',{roughness:.95}))
  border.position.y=.005;group.add(border)
  const rug=new THREE.Mesh(new THREE.BoxGeometry(width,.012,depth),mat(color,{roughness:.95}))
  rug.position.y=.011;group.add(rug)
  return group
}

export function createPottedPlant(scale=1){
  const group=decorGroup('decor plant')
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.11*scale,.09*scale,.22*scale,20),mat('#8a6f5c'))
  pot.position.y=.11*scale;group.add(pot)
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.10*scale,.10*scale,.02,20),mat('#3f342b'))
  soil.position.y=.215*scale;group.add(soil)
  const foliage=mat('#4c7a4a',{roughness:.8})
  for(const [dx,dy,dz,r] of [[0,.42,0,.16],[.1,.34,.06,.12],[-.1,.36,-.05,.12],[.04,.52,-.06,.11],[-.06,.5,.08,.10]]){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(r*scale,12,10),foliage)
    leaf.position.set(dx*scale,dy*scale,dz*scale);leaf.scale.y=1.35;group.add(leaf)
  }
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

export function createFloorLamp(){
  const group=decorGroup('decor floor lamp')
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.03,20),mat('#3a362f'))
  base.position.y=.015;group.add(base)
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,1.35,12),mat('#4a4038',{roughness:.4,metalness:.4}))
  pole.position.y=.705;group.add(pole)
  // Closed, single-sided shade: an earlier open-ended DoubleSide cylinder was
  // the prime suspect in a Cycles 5.2 shader crash during archviz renders.
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.16,.20,.26,20),mat('#f1e4cd',{roughness:.9}))
  shade.position.y=1.45;group.add(shade)
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.05,10,10),new THREE.MeshStandardMaterial({color:'#ffe6b8',emissive:'#ffcf8a',emissiveIntensity:1.2}))
  glow.position.y=1.42;group.add(glow)
  return group
}

// A real functional fixture (owner request 2026-09-29: "where to place the
// laundry box"), not throwaway styling - it stays IN the high-quality
// Blender renders, unlike the decor pieces above (no archvizExclude tag).
// A woven-look hamper with a lift lid, sized for a bedroom corner.
export function createLaundryHamper(){
  const group=new THREE.Group();group.name='laundry hamper'
  const weave=mat('#c9a876',{roughness:.92})
  const rim=mat('#8a6f4a',{roughness:.6})
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.19,.16,.46,20),weave)
  body.position.y=.23;group.add(body)
  const band1=new THREE.Mesh(new THREE.TorusGeometry(.175,.012,8,20),rim)
  band1.rotation.x=Math.PI/2;band1.position.y=.10;group.add(band1)
  const band2=band1.clone();band2.position.y=.36;group.add(band2)
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.03,20),rim)
  lid.position.y=.475;group.add(lid)
  return group
}

export function createCushion(width,color){
  const cushion=new THREE.Mesh(new THREE.BoxGeometry(width,width*.42,width*.9),mat(color,{roughness:.95}))
  cushion.name='decor cushion';cushion.userData.archvizExclude=true
  cushion.geometry.translate(0,width*.21,0)
  return cushion
}
