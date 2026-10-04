import * as THREE from 'three'
import {ENTRY} from '../../config/entryConfig.js'
import {shoeRackAcBayGeometry} from '../../domain/entryFittings.mjs'

// The shoe rack with the owner's proposed AC outdoor unit bay in its bottom (ENTRY.shoeRack.acBay; proposal, 2026-10-05).
// Local frame in metres: x across the rack from its centre, y up from the floor, z from the rack's gallery face outward
// (north, outside). The caller positions the group at the rack. `materials`: {timber, mirror, metal} of the plain rack.
export function createShoeRackWithAcBay(materials) {
  const rack = ENTRY.shoeRack, bay = rack.acBay, u = bay.unit, c = bay.clearance, m = v => v / 1000
  const group = new THREE.Group(); group.name = 'Shoe rack with AC outdoor unit bay (proposal)'
  const W = m(rack.widthMm), H = m(rack.heightMm), D = m(rack.projectionMm), bayH = m(bay.heightMm), bayD = m(shoeRackAcBayGeometry(ENTRY).bayDepthMm), top0 = bayH + m(bay.dividerMm)
  const steel = new THREE.MeshStandardMaterial({color: '#8b9096', metalness: .7, roughness: .4})
  const casing = new THREE.MeshStandardMaterial({color: '#e9e9e4', roughness: .55})
  const dark = new THREE.MeshStandardMaterial({color: '#2b2f33', roughness: .6})
  const board = new THREE.MeshStandardMaterial({color: '#6f5a45', roughness: .8})
  const box = (w, h, d, x, y, z, material) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh }
  // Shoes above the divider: the same body and mirror doors, shorter.
  box(W, H - top0, D, 0, (top0 + H) / 2, D / 2, materials.timber)
  for (let i = 0; i < rack.doorCount; i++) {
    const panel = W / rack.doorCount, x = -W / 2 + (i + .5) * panel
    box(panel - .012, H - top0 - .06, .024, x, (top0 + H) / 2, -.012, materials.mirror)
    box(.025, .24, .026, x + (i === 0 ? .11 : -.11), Math.max(top0 + .2, 1.08), -.04, materials.metal)
  }
  // Platform, closed insulated divider, and the sealed service door on the gallery side.
  box(W + .06, .04, bayD + .03, 0, .02, bayD / 2, steel)
  box(W, m(bay.dividerMm), bayD, 0, bayH + m(bay.dividerMm) / 2, bayD / 2, board)
  box(W - .012, bayH - .05, .024, 0, (bayH + .04) / 2, -.012, materials.timber)
  box(.025, .16, .026, W / 2 - .09, bayH * .55, -.04, materials.metal)
  // Fixed grille: outer face and both sides (beyond the drawn wall thickness), with top and bottom rails.
  const bar = m(bay.grille.barMm), pitch = m(bay.grille.pitchMm), wall = m(bay.wallThicknessMm), y0 = .04, gh = bayH - y0
  for (let x = -W / 2 + bar / 2; x <= W / 2; x += pitch) box(bar, gh, bar, x, y0 + gh / 2, bayD, steel)
  for (const side of [-1, 1]) for (let z = wall + pitch; z < bayD; z += pitch) box(bar, gh, bar, side * W / 2, y0 + gh / 2, z, steel)
  for (const y of [y0 + bar, bayH - bar]) {
    box(W, bar * 1.5, bar * 1.5, 0, y, bayD, steel)
    for (const side of [-1, 1]) box(bar * 1.5, bar * 1.5, bayD - wall, side * W / 2, y, (bayD + wall) / 2, steel)
  }
  // Masonry reveals of the wall the bay passes through (the unit must stand beyond them).
  const reveal = new THREE.MeshStandardMaterial({color: '#d3ccc2', roughness: .85})
  for (const side of [-1, 1]) box(.02, bayH - .04, wall, side * (W / 2 + .01), (bayH + .04) / 2, wall / 2, reveal)
  // The outdoor unit on its pads. Plan x grows west and so does this local x, so east is -x.
  const uw = m(u.widthMm), uh = m(u.heightMm), ud = m(u.depthMm), feet = m(c.feetMm), uy = .04 + feet + uh / 2
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(uh * .4, uh * .4, .012, 36), dark); group.add(fan)
  if (bay.orientation === 'lengthwise') {
    // Long side running outward: the fan blows through the discharge side grille, the coil faces the other side, and the
    // service valves are at the inner end, at the wall line, behind the service door.
    const out = bay.dischargeSide === 'east' ? -1 : 1
    const ux = out * (W / 2 - m(c.frontGapMm) - ud / 2), uz = wall + uw / 2
    for (const dz of [-uw / 2 + .08, uw / 2 - .08]) box(ud, feet, .05, ux, .04 + feet / 2, uz + dz, dark)
    box(ud, uh, uw, ux, uy, uz, casing)
    fan.rotation.z = Math.PI / 2; fan.position.set(ux + out * (ud / 2 + .004), uy, uz + uw * .12)
    box(ud * .5, uh * .45, .06, ux, .04 + feet + uh * .3, uz - uw / 2 + .03, dark) // valve cover at the inner end
  } else {
    // Long fan face looking straight out: coil at the back with air behind it, service valves on `serviceSide`.
    const dir = u.serviceSide === 'west' ? 1 : -1
    const ux = Math.max(-W / 2 + uw / 2, Math.min(W / 2 - uw / 2, -dir * (W / 2 - m(c.intakeSideMm) - uw / 2)))
    const uz = wall + m(c.rearMm) + ud / 2
    for (const dx of [-uw / 2 + .08, uw / 2 - .08]) box(.05, feet, ud, ux + dx, .04 + feet / 2, uz, dark)
    box(uw, uh, ud, ux, uy, uz, casing)
    fan.rotation.x = Math.PI / 2; fan.position.set(ux - dir * uw * .12, uy, uz + ud / 2 + .004)
    box(.06, uh * .45, ud * .5, ux + dir * (uw / 2 - .03), .04 + feet + uh * .3, uz, dark) // valve cover
  }
  return group
}
