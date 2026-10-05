import * as THREE from 'three'
import {createDrawingRoomTvWall} from './DrawingRoomTvWall.js'
import {createDrawingRoomCornerTv} from './DrawingRoomCornerTv.js'
import {createDrawingRoomSeating, createDrawingRoomCornerSeating, createDrawingRoomSouthSeating} from './DrawingRoomSeating.js'
import {createDrawingRoomSouthTv} from './DrawingRoomSouthTv.js'
import {createDrawingRoomElectrical} from './DrawingRoomElectrical.js'
import {DRAWING_ELECTRICAL} from '../../config/drawingElectricalConfig.js'
import {createDrawingLayoutLights} from './DrawingRoomLighting.js'
import {createDrawingRoomDoorSwing} from './DrawingRoomDoorSwing.js'
import {createDrawingRoomWallStorage} from './DrawingRoomWallStorage.js'
import {DEFAULT_TV_WALL, isTvWallTreatment} from '../../domain/tvWallSlatStrip.mjs'

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
// `surfaceMm`: where the page's drawn wall mesh actually has its face, if that differs from wallFaceMm (the room page draws its
// walls 100 mm thick, a 50 mm face, but places the furniture from 37 mm). Only finishes laid flat on the wall use it: the
// slat strip and its paint, so they are not buried in the wall mesh. Default: wallFaceMm.
export function createDrawingRoomLayouts(room, {wallFaceMm = 0, surfaceMm = wallFaceMm, initial = 'southSofas'} = {}) {
  const built = new THREE.Group(); built.name = 'Drawing Room fixed pieces'
  const furniture = new THREE.Group(); furniture.name = 'Drawing Room furniture'
  const tvNorth = createDrawingRoomTvWall(room, {insetMm: wallFaceMm})
  const corner = {
    cornerSofas: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'wallTv'}),
    cornerConsole: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'console'}),
    cornerProjector: createDrawingRoomCornerTv(room, {wallFaceMm, variant: 'projector'}),
  }
  const CORNER = Object.keys(corner)
  const south = createDrawingRoomSouthTv(room, {wallFaceMm, surfaceMm})
  // Electrical points belong to layout C; the inner group is the on/off switch, the outer one follows the layout.
  const electrical = new THREE.Group(); electrical.name = 'Drawing Room electrical plan'
  const electricalPoints = createDrawingRoomElectrical(room, DRAWING_ELECTRICAL, {wallFaceMm}); electricalPoints.visible = false; electrical.add(electricalPoints)
  const doorSwing = createDrawingRoomDoorSwing(room, {wallFaceMm})
  const wallStorage = createDrawingRoomWallStorage(room, {wallFaceMm, surfaceMm}) // part of the building: shown in every layout
  const southLights = createDrawingLayoutLights(room, 'southSofas')
  const registry = [
    {part: tvNorth, layouts: ['northTv'], into: built},
    {part: createDrawingLayoutLights(room, 'northTv'), layouts: ['northTv'], into: built},
    {part: createDrawingRoomSeating(room, {wallFaceMm}), layouts: ['northTv'], into: furniture},
    ...Object.entries(corner).map(([key, part]) => ({part, layouts: [key], into: built})),
    {part: createDrawingLayoutLights(room, 'cornerSofas'), layouts: CORNER, into: built},
    {part: createDrawingRoomCornerSeating(room, {wallFaceMm}), layouts: CORNER, into: furniture},
    {part: south, layouts: ['southSofas'], into: built},
    {part: electrical, layouts: [DRAWING_ELECTRICAL.layout], into: built},
    {part: southLights, layouts: ['southSofas'], into: built},
    {part: createDrawingRoomSouthSeating(room, {wallFaceMm}), layouts: ['southSofas'], into: furniture},
  ]
  built.add(doorSwing, wallStorage.storage)
  registry.forEach(({part, into}) => into.add(part))
  let current = initial, tvWall = DEFAULT_TV_WALL
  // The hidden door's leaf follows the layout C TV-wall treatment only while layout C is shown; elsewhere it keeps the panelled finish.
  const applyTvWall = () => { south.userData.setTvWall(tvWall); wallStorage.storage.userData.setFinish(current === 'southSofas' ? tvWall : DEFAULT_TV_WALL) }
  const setLayout = key => {
    if (!DRAWING_LAYOUTS.some(layout => layout.key === key)) throw new Error(`Unknown Drawing Room layout: ${key}`)
    current = key
    registry.forEach(({part, layouts}) => { part.visible = layouts.includes(key) })
    applyTvWall()
  }
  const setLabels = visible => { for (const part of [tvNorth, wallStorage.storage, south, ...Object.values(corner)]) part.userData.setLabels(visible) }
  setLayout(initial)
  return {
    built, furniture, setLayout, setLabels, layout: () => current,
    setDoorSwing: visible => { doorSwing.visible = visible },
    setElectrical: visible => { electricalPoints.visible = visible },
    // Dims one circuit in layout C: 'chandelier', or a track run id ('T1', 'T2'; every head on a run dims together);
    // level 0 = off, 1 = planned brightness.
    setTrackLight: (circuit, level) => southLights.userData.setTrackLight(circuit, level),
    // Opening the hidden west cabinet door also drags the TV console (layout C) out of its way.
    setStorageOpen: open => { wallStorage.storage.userData.setOpen(open); south.userData.setAccess(open) },
    setArm: pulled => corner.cornerConsole.userData.setArm(pulled),
    setTvSize: key => { corner.cornerConsole.userData.setTvSize(key); south.userData.setTvSize(key) },
    // Layout C TV wall: 'panel' (the full-width fluted panelling, default) or 'slatStrip' (owner idea 2026-10-06).
    setTvWall: key => {
      if (!isTvWallTreatment(key)) throw new Error(`Unknown TV wall treatment: ${key}`)
      tvWall = key; applyTvWall()
    },
  }
}
