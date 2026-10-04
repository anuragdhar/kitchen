import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {ENTRY_LIGHTING} from '../../config/entryLightingConfig.js'

// The round LED panel lights of the Main entry (config/entryLightingConfig.js): recessed in the corridor's PVC ceiling,
// surface-mounted on the gallery's slab. Drawn at the slab height (ENTRY.wallHeightMm) because the drop of the PVC ceiling is
// not decided yet. `x`/`z` convert plan pixels to the caller's metres. `realLights`: the Main entry page asks for a small
// light per fitting; Whole home 3D keeps the fixtures only, to limit its light count (same rule as RoomTaskLighting.js).
export function createEntryCeilingLights(x,z,{realLights=false}={}){
  const group=new THREE.Group();group.name='Entry round ceiling lights'
  const ceiling=ENTRY.wallHeightMm/1000
  const trim=new THREE.MeshStandardMaterial({color:'#f6f5f1',roughness:.45,metalness:.1})
  const lens=new THREE.MeshStandardMaterial({color:'#fffaf0',emissive:'#fff1d6',emissiveIntensity:.95,roughness:.9})
  lens.userData.taskLightGlow=true
  const lights=[]
  for(const f of ENTRY_LIGHTING.fittings){
    const cx=x(f.planX),cz=z(f.planY),r=f.diameterMm/2000
    const one=new THREE.Group();one.name=`${f.id}: ${f.kind} round LED panel, ${f.watts} W`;group.add(one)
    const add=(geometry,material,y)=>{const m=new THREE.Mesh(geometry,material);m.position.set(cx,y,cz);one.add(m);return m}
    // The lens is a short glowing cylinder, so the light reads as a bright disc from below AND from the bird's-eye views
    // (no ceiling is drawn there); the trim is a thin ring around it.
    if(f.kind==='recessed'){
      const ring=add(new THREE.TorusGeometry(r+.002,.005,8,40),trim,ceiling-.004);ring.rotation.x=Math.PI/2
      add(new THREE.CylinderGeometry(r-.004,r-.004,.012,40),lens,ceiling-.004)
    }else{
      const depth=(f.depthMm??35)/1000
      add(new THREE.CylinderGeometry(r,r,depth-.008,40),trim,ceiling-(depth-.008)/2)
      add(new THREE.CylinderGeometry(r-.012,r-.012,.012,40),lens,ceiling-depth+.004)
      add(new THREE.CylinderGeometry(r-.012,r-.012,.004,40),lens,ceiling-.002)
    }
    if(realLights){const light=new THREE.PointLight('#fff3df',.9,4.5,1.6);light.position.set(cx,ceiling-.12,cz);one.add(light);lights.push({light,base:light.intensity})}
  }
  // level 0 = off, 1 = planned: one switch per pair in the plan, but the preview dims all of them together.
  group.userData.setLevel=level=>{for(const {light,base} of lights){light.userData.dimLevel=level;light.intensity=base*level}lens.emissiveIntensity=.95*Math.min(level,1.5)}
  return group
}
