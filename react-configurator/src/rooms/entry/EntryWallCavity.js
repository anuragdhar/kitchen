import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {createDarkLabelSprite} from '../shared/LabelSprite.js'

// Entry wall cavity (owner mark 2026-09-30): translucent volumes for the empty 3-ft pocket on the Entry side of the Drawing
// Room's north wall and for the 9-inch wall between them, with their measured depths as labels. Never hit by the measure
// tool (userData.noMeasure). Sizes come from ENTRY.wallCavity, in plan pixels; X and Z turn plan x and y into metres of
// the caller's frame (the Whole home 3D page passes its plan-to-metre functions).
export function createEntryWallCavity(X, Z) {
  const cavityGroup = new THREE.Group(); cavityGroup.name = 'Entry wall cavity'
  const c = ENTRY.wallCavity, wall = {planX1: c.planX1, planX2: c.planX2, planY1: c.wallPlanY1, planY2: c.wallPlanY2}
  const ghost = (box, heightMm, color, opacity) => {
    const w = X(box.planX2 - box.planX1), d = Z(box.planY2 - box.planY1), h = heightMm / 1000
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({color, transparent: true, opacity, depthWrite: false}))
    mesh.position.set(X((box.planX1 + box.planX2) / 2), h / 2, Z((box.planY1 + box.planY2) / 2)); mesh.renderOrder = 5; mesh.userData.noMeasure = true
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({color})); edges.position.copy(mesh.position); edges.userData.noMeasure = true
    cavityGroup.add(mesh, edges)
  }
  const cavityLabel = (text, x, y, z) => {
    const sprite = createDarkLabelSprite(text, {widthPx: 640, background: 'rgba(15,23,42,.88)'})
    sprite.scale.set(1.5, .225, 1); sprite.position.set(x, y, z); cavityGroup.add(sprite)
  }
  ghost(c, c.heightMm, '#0d9488', .34)
  ghost(wall, c.heightMm, '#f59e0b', .15)
  const depthMm = Math.round(Z(c.planY2 - c.planY1) * 1000 / 5) * 5, wallMm = Math.round(Z(wall.planY2 - wall.planY1) * 1000 / 5) * 5
  cavityLabel(`Empty cavity ~${depthMm} mm deep`, X((c.planX1 + c.planX2) / 2), c.heightMm / 1000 + .25, Z((c.planY1 + c.planY2) / 2) + .4)
  cavityLabel(`Drawing Room wall ~${wallMm} mm`, X((wall.planX1 + wall.planX2) / 2), c.heightMm / 1000 + .25, Z(wall.planY1) - .25)
  return cavityGroup
}
