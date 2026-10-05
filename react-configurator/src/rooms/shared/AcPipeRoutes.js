import * as THREE from 'three'
import {AC_PLAN} from '../../config/acPlanConfig.js'
import {checkAcPlan} from '../../domain/acPlan.mjs'

// The pipe routes of the whole-home AC plan (config/acPlanConfig.js) for Whole home 3D, in model metres: plan x (west) and
// plan y (north) through the caller's X and Z, height up. One colour per room: the thick line is the refrigerant pipe pair
// with its length to order; the thin blue line is the condensate drain down to its discharge point (blue disc); the ring
// is the hole through the wall. Drawn over everything (no depth test) so a route inside a wall or cabinet still shows, and
// never picked or measured (userData.noMeasure). Colours are for telling the routes apart only.
export const AC_ROUTE_COLOURS = {drawing: '#e11d48', lobby: '#f59e0b', bedroom1: '#7c3aed', study: '#2563eb', bedroom3: '#059669'}
const DRAIN_COLOUR = '#0891b2'

function label(text, colour) {
  const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 96
  const g = canvas.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.94)'; g.beginPath(); g.roundRect(4, 4, 712, 88, 18); g.fill()
  g.lineWidth = 6; g.strokeStyle = colour; g.stroke()
  g.fillStyle = '#0f172a'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 360, 50, 690)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, transparent: true}))
  sprite.scale.set(3.3, .44, 1); sprite.renderOrder = 1402; sprite.userData.dispose = () => texture.dispose()
  return sprite
}

/** All routes as one group, hidden until the "Show AC pipe routes" toggle. `X` and `Z` turn plan pixels into model metres. */
export function createAcPipeRoutes(X, Z) {
  const group = new THREE.Group(); group.name = 'AC pipe routes'; group.visible = false
  const result = checkAcPlan(AC_PLAN), textures = []
  const point = p => new THREE.Vector3(X(p.planX), p.heightMm / 1000, Z(p.planY))
  const tube = (points, radius, colour, order) => {
    const material = new THREE.MeshBasicMaterial({color: colour, depthTest: false, transparent: true})
    for (let i = 1; i < points.length; i++) {
      const a = point(points[i - 1]), b = point(points[i]), length = a.distanceTo(b)
      if (length < .001) continue
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material)
      mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
      mesh.renderOrder = order; mesh.userData.noMeasure = true; group.add(mesh)
    }
    for (const p of points) { const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material); joint.position.copy(point(p)); joint.renderOrder = order; joint.userData.noMeasure = true; group.add(joint) }
  }
  const add = (sprite, at, lift) => { sprite.position.copy(at).setY(at.y + lift); textures.push(sprite.userData.dispose); group.add(sprite) }
  result.rows.forEach(row => {
    const colour = AC_ROUTE_COLOURS[row.id], space = AC_PLAN.spaces.find(s => s.id === row.id)
    if (!colour || !row.drain) return
    tube(row.drain.points, .028, DRAIN_COLOUR, 1400)
    const end = point(row.drain.points[row.drain.points.length - 1])
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .02, 20), new THREE.MeshBasicMaterial({color: DRAIN_COLOUR, depthTest: false, transparent: true}))
    disc.position.copy(end).setY(.03); disc.renderOrder = 1400; disc.userData.noMeasure = true; group.add(disc)
    const short = row.name.replace(/ \+.*$/, '').replace(' (Study)', '')
    if (row.pipe) {
      tube(row.pipe.points, .04, colour, 1401)
      const hole = new THREE.Mesh(new THREE.TorusGeometry(.09, .02, 8, 20), new THREE.MeshBasicMaterial({color: '#111827', depthTest: false, transparent: true}))
      hole.position.copy(point(row.pipe.points[0])); hole.rotation.x = Math.PI / 2; hole.renderOrder = 1401; hole.userData.noMeasure = true; group.add(hole)
      const middle = point(row.pipe.points[0]).lerp(point(row.pipe.points[row.pipe.points.length - 1]), .5)
      add(label(`${short}: pipe ${row.pipe.lengthM.toFixed(1)} m, drain ${row.drain.lengthM.toFixed(1)} m`, colour), middle.setY(2.7), .45)
    } else add(label(`${short}: ${space.type} AC, drain ${row.drain.lengthM.toFixed(1)} m`, colour), point(row.drain.points[0]).setY(2.7), .45)
  })
  group.userData.dispose = () => { textures.forEach(dispose => dispose()); group.traverse(node => { node.geometry?.dispose(); node.material?.dispose?.() }) }
  return group
}

/** One line under the toggle: what the colours mean and the lengths, from the same check. */
export function acRoutesSummary() {
  const result = checkAcPlan(AC_PLAN)
  return result.rows.filter(row => row.drain).map(row => ({id: row.id, colour: AC_ROUTE_COLOURS[row.id], name: row.name, type: row.type, tons: row.tons, status: row.status,
    pipeM: row.pipe?.lengthM ?? null, drainM: row.drain.lengthM}))
}
