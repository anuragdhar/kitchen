import * as THREE from 'three'
import {DRAWING_LIGHTING} from '../../config/drawingLightingConfig.js'

// Drawing Room ceiling and wall fixtures for one seating layout ("northTv" or "cornerSofas").
// Room frame in metres: x from the west wall, z from the north wall.
export function createDrawingLayoutLights(room, layoutKey) {
  const config = DRAWING_LIGHTING[layoutKey]
  const group = new THREE.Group(); group.name = `Drawing Room lights (${layoutKey})`
  const ceiling = room.heightMm / 1000
  const metal = new THREE.MeshStandardMaterial({color: '#514941', roughness: .55, metalness: .4})
  const warm = new THREE.MeshStandardMaterial({color: '#fff1d4', emissive: '#ffcf8b', emissiveIntensity: .7, roughness: .8})
  warm.userData.taskLightGlow = true
  const bronze = new THREE.MeshStandardMaterial({color: '#8d714f', metalness: .58, roughness: .38})
  const diffuser = new THREE.MeshStandardMaterial({color: '#fff7e7', emissive: '#ffd9a1', emissiveIntensity: .48, roughness: .95})
  diffuser.userData.taskLightGlow = true
  const box = (w, h, d, x, y, z, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z); group.add(mesh)
  }
  for (const fixture of config.ambient) {
    const x = fixture.xMm / 1000, z = fixture.zMm / 1000
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .025, 32), bronze)
    canopy.position.set(x, ceiling - .015, z); canopy.name = fixture.label; group.add(canopy)
    box(.012, .38, .012, x, ceiling - .22, z, bronze)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.33, .024, 12, 48), bronze)
    ring.rotation.x = Math.PI / 2; ring.position.set(x, ceiling - .43, z); group.add(ring)
    const lens = new THREE.Mesh(new THREE.TorusGeometry(.305, .014, 8, 48), diffuser)
    lens.rotation.x = Math.PI / 2; lens.position.set(x, ceiling - .455, z); group.add(lens)
  }
  const up = config.wallUplight
  box(.045, .20, .14, .035, up.heightMm / 1000, up.fromNorthMm / 1000, metal)
  box(.055, .02, .105, .042, up.heightMm / 1000 + .11, up.fromNorthMm / 1000, diffuser)
  if (config.reading) {
    const z = config.reading.fromNorthMm / 1000
    box(.04, .22, .10, .06, 1.52, z, metal)
    box(.22, .025, .025, .17, 1.60, z, metal)
    box(.12, .10, .12, .27, 1.56, z, metal)
    box(.10, .008, .10, .27, 1.507, z, warm)
  }
  const glow = config.sofaGlow
  box((glow.lengthMm - 160) / 1000, .012, .025, glow.xMm / 1000, glow.heightMm / 1000, glow.fromNorthMm / 1000, diffuser)
  return group
}
