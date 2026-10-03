import * as THREE from 'three'
import {electricalPointPosition} from '../../domain/drawingElectrical.mjs'

// Toggleable markers for the proposed Drawing Room electrical points (DRAWING_ELECTRICAL): a coloured pin and a "N1 · TV box"
// tag at each box, drawn on top of everything so hidden boxes (behind the TV, inside the router cabinet) still show.
// Room frame in metres: x from the west wall, z from the north wall.
export const ELECTRICAL_COLOURS = {power: '#dc2626', charging: '#16a34a', lighting: '#d97706', data: '#0f766e', dedicated: '#7c3aed'}

export function createDrawingRoomElectrical(room, plan, {wallFaceMm = 0} = {}) {
  const group = new THREE.Group(); group.name = 'Drawing Room electrical points (proposed)'
  const textures = []
  for (const p of plan.points) {
    const color = p.optional ? '#64748b' : ELECTRICAL_COLOURS[p.kind]
    const at = electricalPointPosition(room, p, {wallFaceMm})
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
