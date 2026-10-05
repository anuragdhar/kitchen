import * as THREE from 'three'
import {KITCHEN} from '../../config/kitchenConfig.js'
import {KITCHEN_MIRROR_MATERIAL} from '../../config/renderConfig.js'

// Finish only: coplanar with the existing tile/slider face; tracks stay in front.
// Kitchen scene uses centimetres and reverses plan x: X=(roomWidth/2-x)/10,
// Y=z/10, Z=(y-roomLength/2)/10. Plane normals point into the room.
export function addKitchenMirrorSplashbacks(scene,rectangles){
  if(!rectangles.length) return []
  const material=new THREE.MeshPhysicalMaterial(KITCHEN_MIRROR_MATERIAL)
  return rectangles.map(panel=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(panel.w/10,panel.h/10),material)
    mesh.name=`${panel.wall} bronze mirror splashback ${panel.applianceId} (${panel.mounting})`
    mesh.position.set((KITCHEN.width/2-panel.x)/10,(panel.z+panel.h/2)/10,(panel.y+panel.w/2-KITCHEN.length/2)/10)
    mesh.rotation.y=panel.wall==='east'?Math.PI/2:-Math.PI/2
    mesh.userData.mirrorSplashback=panel
    scene.add(mesh)
    return mesh
  })
}
