import * as THREE from 'three'
import {roomElectricalReport, hasRoomElectrical} from '../../domain/roomElectricalModels.mjs'
import {roomPointPosition} from '../../domain/roomElectrical.mjs'

// Toggleable markers for PROPOSED electrical points: a coloured pin and a "N1 · TV box" tag at each box, drawn on top of
// everything so boxes hidden on purpose (behind a TV, inside a cabinet) still show. One marker style for every room: the
// Drawing Room (rooms/drawing/DrawingRoomElectrical.js) and the room-keyed plans of config/roomElectricalConfig.js.
// Existing points from the phone scan are drawn differently, as grey plates (ExistingElectricalPoints.js).
export const ELECTRICAL_COLOURS = {power: '#dc2626', charging: '#16a34a', lighting: '#d97706', data: '#0f766e', dedicated: '#7c3aed'}
export const ELECTRICAL_OPTIONAL_COLOUR = '#64748b'

/**
 * `items`: [{id, name, kind, optional, at: {x, y, z}}] with `at` in millimetres in the parent's frame (x from the west wall,
 * z from the north wall, y up). Returns a THREE.Group in metres; userData.dispose frees the tag textures.
 */
export function createElectricalPointMarkers(items, {name = 'Electrical points (proposed)'} = {}) {
  const group = new THREE.Group(); group.name = name
  const textures = []
  for (const p of items) {
    const color = p.optional ? ELECTRICAL_OPTIONAL_COLOUR : ELECTRICAL_COLOURS[p.kind]
    const at = p.at
    const marker = new THREE.Group(); marker.name = `${p.id} ${p.name}`
    marker.position.set(at.x / 1000, at.y / 1000, at.z / 1000)
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.035, 18, 12), new THREE.MeshBasicMaterial({color, depthTest: false, transparent: true, opacity: .95}))
    pin.renderOrder = 1200; pin.userData.noMeasure = true; marker.add(pin)
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 112
    const g = canvas.getContext('2d')
    g.fillStyle = 'rgba(255,255,255,.96)'; g.beginPath(); g.roundRect(4, 4, 632, 104, 22); g.fill()
    g.lineWidth = 9; g.strokeStyle = color; g.stroke()
    g.fillStyle = '#172033'; g.font = '800 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(`${p.id} · ${p.name.length > 26 ? p.name.slice(0, 25) + '…' : p.name}`, 320, 58)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture)
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, transparent: true, depthTest: false}))
    // Ceiling and high points hang their tag below the pin, the rest above it.
    tag.position.set(0, at.y > 2200 ? -.11 : .11, 0); tag.scale.set(.46, .08, 1); tag.renderOrder = 1201; marker.add(tag)
    group.add(marker)
  }
  group.userData.dispose = () => textures.forEach(texture => texture.dispose())
  return group
}

/**
 * The markers of a room-keyed plan (ROOM_ELECTRICAL), in the room's own frame; null for a room without one. Points the
 * room's page already draws itself (`drawnBy: 'page'`) and points without a drawn position are skipped. `wallFaceMm` is
 * the drawn inside face of the walls, as for the other room pieces.
 */
export function createRoomElectricalPoints(roomKey, {wallFaceMm = 0} = {}) {
  if (!hasRoomElectrical(roomKey)) return null
  const {model, points} = roomElectricalReport(roomKey)
  const items = points.filter(p => p.drawnBy !== 'page').map(p => ({...p, at: roomPointPosition(model, p, {wallFaceMm})})).filter(p => p.at)
  return createElectricalPointMarkers(items, {name: `${model.name} electrical points (proposed)`})
}
