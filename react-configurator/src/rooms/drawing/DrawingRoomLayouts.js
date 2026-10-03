import * as THREE from 'three'
import {createDrawingRoomTvWall} from './DrawingRoomTvWall.js'
import {createDrawingRoomCornerTv} from './DrawingRoomCornerTv.js'
import {createDrawingRoomSeating, createDrawingRoomCornerSeating, createDrawingRoomSouthSeating} from './DrawingRoomSeating.js'
import {createDrawingRoomSouthTv} from './DrawingRoomSouthTv.js'
import {createDrawingLayoutLights} from './DrawingRoomLighting.js'
import {createDrawingRoomDoorSwing} from './DrawingRoomDoorSwing.js'
import {createDrawingRoomWallStorage} from './DrawingRoomWallStorage.js'

export const DRAWING_LAYOUTS = [
  {key: 'southSofas', label: 'C: sofas south + west, TV on the north wall'},
  {key: 'northTv', label: 'A: TV on the north wall (cabinet, recessed)'},
  {key: 'cornerSofas', label: 'B: corner sofas, 65-inch TV flat on the east wall'},
  {key: 'cornerConsole', label: 'B2: corner sofas, low 18-inch console + arm TV (55 or 65-inch)'},
  {key: 'cornerProjector', label: 'B3 (future): corner sofas, ceiling projector + screen'},
]

/**
 * Builds every Drawing Room layout once and shows one at a time.
 * `built` holds the fixed pieces (cabinets, TVs, ceiling fixtures); `furniture` holds the seating.
 * Add both groups to the scene; setLayout switches which layout is visible.
 * The three corner-sofa layouts share one seating group and one set of ceiling fixtures.
 */
export function createDrawingRoomLayouts(room, {wallFaceMm = 0, initial = 'southSofas'} = {}) {
  const built = new THREE.Group(); built.name = 'Drawing Room fixed pieces'
  const furniture = new THREE.Group(); furniture.name = 'Drawing Room furniture'
  const tvNorth = createDrawingRoomTvWall(room, {insetMm: wallFaceMm})
  const corner = {
    cornerSofas: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'wallTv'}),
    cornerConsole: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'console'}),
    cornerProjector: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'projector'}),
  }
  const CORNER = Object.keys(corner)
  const south = createDrawingRoomSouthTv(room, {wallFaceMm})
  const doorSwing = createDrawingRoomDoorSwing(room, {wallFaceMm})
  const wallStorage = createDrawingRoomWallStorage(room, {wallFaceMm}) // part of the building: shown in every layout
  const registry = [
    {part: tvNorth, layouts: ['northTv'], into: built},
    {part: createDrawingLayoutLights(room, 'northTv'), layouts: ['northTv'], into: built},
    {part: createDrawingRoomSeating(room, {wallFaceMm}), layouts: ['northTv'], into: furniture},
    ...Object.entries(corner).map(([key, part]) => ({part, layouts: [key], into: built})),
    {part: createDrawingLayoutLights(room, 'cornerSofas'), layouts: CORNER, into: built},
    {part: createDrawingRoomCornerSeating(room, {wallFaceMm}), layouts: CORNER, into: furniture},
    {part: south, layouts: ['southSofas'], into: built},
    {part: createDrawingLayoutLights(room, 'southSofas'), layouts: ['southSofas'], into: built},
    {part: createDrawingRoomSouthSeating(room, {wallFaceMm}), layouts: ['southSofas'], into: furniture},
  ]
  built.add(doorSwing, wallStorage.storage)
  registry.forEach(({part, into}) => into.add(part))
  let current = initial
  const setLayout = key => {
    if (!DRAWING_LAYOUTS.some(layout => layout.key === key)) throw new Error(`Unknown Drawing Room layout: ${key}`)
    current = key
    registry.forEach(({part, layouts}) => { part.visible = layouts.includes(key) })
  }
  const setLabels = visible => { for (const part of [tvNorth, wallStorage.storage, south, ...Object.values(corner)]) part.userData.setLabels(visible) }
  setLayout(initial)
  return {
    built, furniture, setLayout, setLabels, layout: () => current,
    setDoorSwing: visible => { doorSwing.visible = visible },
    setStorageOpen: open => wallStorage.storage.userData.setOpen(open),
    setArm: pulled => corner.cornerConsole.userData.setArm(pulled),
    setTvSize: key => { corner.cornerConsole.userData.setTvSize(key); south.userData.setTvSize(key) },
  }
}
