import * as THREE from 'three'
import {AC_OUTDOOR_UNITS, AC_OUTDOOR_UNIT_SIZES} from '../../config/acOutdoorUnitsConfig.js'
import {compassVector, planToRoomMm} from '../../domain/acOutdoorUnits.mjs'

// One AC outdoor unit at its typical casing size (config/acOutdoorUnitsConfig.js). Built in metres with its long side
// along local x, the fan face toward local +z and its underside at y = 0; a stand or bracket is drawn below it down to
// `bottomM`. The caller places it. `frame`: 'plan' for Whole home 3D model coordinates (x west, z north), 'room' for a
// room page (x east from the west wall, z south from the north wall).
export function createAcOutdoorUnit(unit, {frame = 'plan'} = {}) {
  const size = AC_OUTDOOR_UNIT_SIZES[unit.tons], w = size.widthMm / 1000, h = size.heightMm / 1000, d = size.depthMm / 1000, bottom = unit.bottomMm / 1000
  const group = new THREE.Group(); group.name = `${unit.serves} AC outdoor unit, ${unit.tons} ton (${unit.status})`
  const casing = new THREE.MeshStandardMaterial({color: '#eef0ee', roughness: .5})
  const dark = new THREE.MeshStandardMaterial({color: '#4c555a', metalness: .3, roughness: .5})
  const steel = new THREE.MeshStandardMaterial({color: '#8b9096', metalness: .6, roughness: .45})
  const box = (bw, bh, bd, x, y, z, material) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh }
  box(w, h, d, 0, bottom + h / 2, 0, casing)
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(h * .4, h * .4, .014, 32), dark)
  fan.rotation.x = Math.PI / 2; fan.position.set(-w * .12, bottom + h / 2, d / 2 + .005); group.add(fan)
  box(.03, h * .7, .012, -w * .12, bottom + h / 2, d / 2 + .014, steel)
  box(h * .7, .03, .012, -w * .12, bottom + h / 2, d / 2 + .014, steel)
  box(.06, h * .45, d * .5, w / 2 - .03, bottom + h * .3, 0, dark) // valve cover
  // Two rails under the casing: a stand on a floor, or the arms of a wall bracket.
  if (bottom > .02) for (const x of [-w / 2 + .1, w / 2 - .1]) box(.04, bottom, d + .06, x, bottom / 2, 0, steel)
  const direction = compassVector(unit.fanFaces, frame)
  group.rotation.y = Math.atan2(direction.x, direction.z)
  return group
}

/** All outdoor units for Whole home 3D. `X` and `Z` turn plan pixels into model metres. */
export function createAcOutdoorUnits(X, Z) {
  const group = new THREE.Group(); group.name = 'AC outdoor units'
  for (const unit of AC_OUTDOOR_UNITS) {
    const one = createAcOutdoorUnit(unit, {frame: 'plan'})
    one.position.set(X(unit.centre.planX), 0, Z(unit.centre.planY)); group.add(one)
  }
  return group
}

/** The outdoor units a room page draws itself (unit.roomPage), in that room's frame; `bounds` are the room's plan bounds. */
export function createAcOutdoorUnitsForRoom(roomKey, room, bounds) {
  const group = new THREE.Group(); group.name = 'AC outdoor units'
  for (const unit of AC_OUTDOOR_UNITS.filter(u => u.roomPage === roomKey)) {
    const at = planToRoomMm(bounds, room.widthMm, room.lengthMm, unit.centre.planX, unit.centre.planY)
    const one = createAcOutdoorUnit(unit, {frame: 'room'})
    one.position.set(at.x / 1000, 0, at.z / 1000); group.add(one)
  }
  return group
}
