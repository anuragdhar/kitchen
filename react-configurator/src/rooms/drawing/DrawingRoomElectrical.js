import {electricalPointPosition} from '../../domain/drawingElectrical.mjs'
import {createElectricalPointMarkers, ELECTRICAL_COLOURS} from '../shared/ElectricalPointMarkers.js'

// Toggleable markers for the proposed Drawing Room electrical points (DRAWING_ELECTRICAL): a coloured pin and a "N1 · TV box"
// tag at each box, drawn on top of everything so hidden boxes (behind the TV, inside the router cabinet) still show.
// Room frame in metres: x from the west wall, z from the north wall. The marker itself is the shared builder
// (rooms/shared/ElectricalPointMarkers.js), which the other rooms' plans use too.
export {ELECTRICAL_COLOURS}

export function createDrawingRoomElectrical(room, plan, {wallFaceMm = 0} = {}) {
  const items = plan.points.map(p => ({...p, at: electricalPointPosition(room, p, {wallFaceMm})}))
  return createElectricalPointMarkers(items, {name: 'Drawing Room electrical points (proposed)'})
}
