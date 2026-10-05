import * as THREE from 'three'
import {electricalPointPosition} from '../../domain/drawingElectrical.mjs'
import {DRAWING_LIGHT_FEEDS} from '../../config/drawingElectricalConfig.js'
import {createElectricalPointMarkers, ELECTRICAL_COLOURS} from '../shared/ElectricalPointMarkers.js'

// Toggleable markers for the proposed Drawing Room electrical points (DRAWING_ELECTRICAL): a coloured pin and a "N1 · TV box"
// tag at each box, drawn on top of everything so hidden boxes (behind the TV, inside the router cabinet) still show.
// Room frame in metres: x from the west wall, z from the north wall. The marker itself is the shared builder
// (rooms/shared/ElectricalPointMarkers.js), which the other rooms' plans use too.
export {ELECTRICAL_COLOURS}

export function createDrawingRoomElectrical(room, plan, {wallFaceMm = 0} = {}) {
  const items = plan.points.map(p => ({...p, at: electricalPointPosition(room, p, {wallFaceMm})}))
  const group = createElectricalPointMarkers(items, {name: 'Drawing Room electrical points (proposed)'})
  // The cable route from the switchboard to each track's feed end (DRAWING_LIGHT_FEEDS), drawn over everything like the pins.
  const material = new THREE.MeshBasicMaterial({color: ELECTRICAL_COLOURS.lighting, depthTest: false, transparent: true, opacity: .9})
  const inset = wallFaceMm + 12, at = p => new THREE.Vector3(p.xMm / 1000, p.yMm / 1000, Math.max(p.zMm, inset) / 1000)
  for (const route of DRAWING_LIGHT_FEEDS.routes) for (let i = 1; i < route.points.length; i++) {
    const a = at(route.points[i - 1]), b = at(route.points[i]), length = a.distanceTo(b)
    if (length < .001) continue
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, length, 8), material)
    leg.position.copy(a).add(b).multiplyScalar(.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    leg.name = `${route.label} cable route`; leg.renderOrder = 1199; leg.userData.noMeasure = true; group.add(leg)
  }
  return group
}
