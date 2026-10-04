import * as THREE from 'three'
import {existingPointsFor, existingPointPlacement} from '../../domain/existingElectrical.mjs'

// Toggleable markers for the EXISTING electrical points of a room (EXISTING_ELECTRICAL, phone scan 2026-10-04), drawn in a
// deliberately different style from the proposed plan's coloured pins (DrawingRoomElectrical.js): a translucent grey plate
// at the plate's TRUE size on the wall, a blue outline, and a square-cornered "Switchboard · 195x260" tag. Ceiling points
// are a blue ring of the rosette's size. Drawn on top of everything (depthTest off) so a plate behind the planned
// panelling, TV or sofa is still seen: that is the point of showing them. Room frame in metres: x from the west wall,
// z from the north wall; `wallFaceMm` is the drawn inside face of the walls, as for the other room pieces.
export const EXISTING_STYLE = {fill: '#64748b', outline: '#2563eb', fillOpacity: .5, plateDepthMm: 30, ringMm: 40}

export function createExistingElectricalPoints(roomKey, room, {wallFaceMm = 0} = {}) {
  const points = existingPointsFor(roomKey)
  if (!points.length) return null
  const group = new THREE.Group(); group.name = `${room.name} existing electrical points (phone scan)`
  const disposables = []
  const fill = new THREE.MeshBasicMaterial({color: EXISTING_STYLE.fill, transparent: true, opacity: EXISTING_STYLE.fillOpacity, depthTest: false, side: THREE.DoubleSide})
  const outline = new THREE.LineBasicMaterial({color: EXISTING_STYLE.outline, depthTest: false, transparent: true, opacity: .95})
  disposables.push(fill, outline)
  for (const p of points) {
    const at = existingPointPlacement(room, p, {wallFaceMm})
    const marker = new THREE.Group(); marker.name = `${p.id} ${p.name} (existing)`
    marker.position.set(at.x / 1000, at.y / 1000, at.z / 1000)
    const w = at.widthMm / 1000, h = at.heightMm / 1000, d = EXISTING_STYLE.plateDepthMm / 1000
    let geometry
    if (at.depthAxis === 'y') {
      // A ring on the ceiling, the size of the rosette or medallion, with a small centre disc for the point itself.
      geometry = new THREE.RingGeometry(Math.max(0, w / 2 - EXISTING_STYLE.ringMm / 1000), w / 2, 48)
      const ring = new THREE.Mesh(geometry, fill); ring.rotation.x = Math.PI / 2; ring.position.y = -.004; ring.renderOrder = 1150; ring.userData.noMeasure = true; marker.add(ring)
      const dot = new THREE.Mesh(new THREE.CircleGeometry(.03, 24), fill); dot.rotation.x = Math.PI / 2; dot.position.y = -.004; dot.renderOrder = 1150; dot.userData.noMeasure = true; marker.add(dot)
      const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length: 49}, (_, i) => { const a = i / 48 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * w / 2, -.004, Math.sin(a) * w / 2) })), outline)
      edge.renderOrder = 1151; marker.add(edge); disposables.push(geometry, dot.geometry, edge.geometry)
    } else {
      // The plate stands just proud of the wall face so it is not lost inside the wall box.
      geometry = at.depthAxis === 'z' ? new THREE.BoxGeometry(w, h, d) : new THREE.BoxGeometry(d, h, w)
      const plate = new THREE.Mesh(geometry, fill); plate.renderOrder = 1150; plate.userData.noMeasure = true
      const inward = at.depthAxis === 'z' ? (p.wall === 'north' ? 1 : -1) : (p.wall === 'west' ? 1 : -1)
      if (at.depthAxis === 'z') plate.position.z = inward * d / 2; else plate.position.x = inward * d / 2
      marker.add(plate)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), outline); edges.position.copy(plate.position); edges.renderOrder = 1151; marker.add(edges)
      disposables.push(geometry, edges.geometry)
    }
    const tag = makeTag(p, at); disposables.push(tag.material.map)
    tag.position.set(0, at.depthAxis === 'y' ? -.12 : (at.y > 2000 ? -(h / 2 + .09) : h / 2 + .09), 0); tag.renderOrder = 1152; marker.add(tag)
    group.add(marker)
  }
  group.userData.dispose = () => disposables.forEach(item => item.dispose())
  return group
}

// Square-cornered white tag with a solid blue border and blue text ("Existing: Switchboard 195x260"); the proposed plan's
// tags are rounded with a coloured border and dark text, so the two read differently even when they stand side by side.
function makeTag(p, at) {
  const size = at.depthAxis === 'y' ? `${Math.round(at.widthMm)} across` : `${Math.round(at.widthMm)}x${Math.round(at.heightMm)}`
  const name = p.label ?? p.name
  const text = `Existing: ${name.length > 22 ? name.slice(0, 21) + '…' : name} ${size}`
  const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 110
  const g = canvas.getContext('2d')
  g.fillStyle = 'rgba(255,255,255,.97)'; g.fillRect(5, 5, 710, 100)
  g.lineWidth = 10; g.strokeStyle = EXISTING_STYLE.outline; g.strokeRect(5, 5, 710, 100)
  g.fillStyle = '#1e3a8a'; g.textAlign = 'center'; g.textBaseline = 'middle'
  for (let px = 38; px >= 26; px -= 2) { g.font = `800 ${px}px Arial`; if (g.measureText(text).width <= 680) break } // long names shrink to fit
  g.fillText(text, 360, 57)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, transparent: true, depthTest: false}))
  tag.scale.set(.56, .0855, 1); tag.userData.noMeasure = true
  return tag
}
