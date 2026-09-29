import * as THREE from 'three'
import {createDrawingRoomTvWall} from './DrawingRoomTvWall.js'
import {createDrawingRoomCornerTv} from './DrawingRoomCornerTv.js'
import {createDrawingRoomSeating, createDrawingRoomCornerSeating} from './DrawingRoomSeating.js'
import {createDrawingLayoutLights} from './DrawingRoomLighting.js'

export const DRAWING_LAYOUTS = [
  {key: 'northTv', label: 'A: TV on the north wall'},
  {key: 'cornerSofas', label: 'B: corner sofas, TV on the east wall'},
]

/**
 * Builds both Drawing Room layouts once and shows one at a time.
 * `built` holds the fixed pieces (cabinets, TVs, ceiling fixtures); `furniture` holds the seating.
 * Add both groups to the scene; setLayout switches which layout is visible.
 */
export function createDrawingRoomLayouts(room, {wallFaceMm = 0, initial = 'cornerSofas'} = {}) {
  const built = new THREE.Group(); built.name = 'Drawing Room fixed pieces'
  const furniture = new THREE.Group(); furniture.name = 'Drawing Room furniture'
  const tvNorth = createDrawingRoomTvWall(room, {insetMm: wallFaceMm})
  const tvCorner = createDrawingRoomCornerTv(room, {wallFaceMm})
  const layouts = {
    northTv: {built: [tvNorth, createDrawingLayoutLights(room, 'northTv')], furniture: [createDrawingRoomSeating(room, {wallFaceMm})], labels: tvNorth},
    cornerSofas: {built: [tvCorner, createDrawingLayoutLights(room, 'cornerSofas')], furniture: [createDrawingRoomCornerSeating(room, {wallFaceMm})], labels: tvCorner},
  }
  for (const layout of Object.values(layouts)) {
    layout.built.forEach(part => built.add(part)); layout.furniture.forEach(part => furniture.add(part))
  }
  let current = initial
  const setLayout = key => {
    if (!layouts[key]) throw new Error(`Unknown Drawing Room layout: ${key}`)
    current = key
    for (const [name, layout] of Object.entries(layouts)) {
      layout.built.concat(layout.furniture).forEach(part => { part.visible = name === key })
    }
  }
  const setLabels = visible => { for (const layout of Object.values(layouts)) layout.labels.userData.setLabels(visible) }
  setLayout(initial)
  return {built, furniture, setLayout, setLabels, layout: () => current}
}
