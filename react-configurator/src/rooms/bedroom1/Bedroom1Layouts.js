import * as THREE from 'three'
import {tagSurfaceMaterial} from '../../render/surfaceRoles.mjs'
import {createRug, createPottedPlant, createWallArt, createLaundryHamper} from '../shared/RoomDecor.js'
import {createBedMaterials, createMadeBed} from '../shared/furniture/Bed.js'
import {createRoomTrackLighting} from '../shared/RoomTaskLighting.js'
import {BEDROOM1_DESIGN, BEDROOM1_LAYOUT_KEYS, bedroom1LightingFor} from '../../config/bedroom1LayoutConfig.js'
import {BEDROOM1_LIGHTING} from '../../config/bedroom1LightingConfig.js'
import {BEDROOM1_CLOSED_DOOR} from '../../config/bedroom1ClosedDoor.js'
import {bedroom1Plan} from '../../domain/bedroom1Layout.mjs'

// Bedroom 1 furniture for every layout of config/bedroom1LayoutConfig.js, built once and shown one layout at a time.
// Room frame in metres: x east from the west wall, z south from the north wall, y up; the balcony continues east of the
// room. Every position and size comes from bedroom1Plan() (src/domain/bedroom1Layout.mjs), the same rectangles the checks
// use. Only finishing details of a few centimetres (handles, legs, the bedding of rooms/shared/furniture/Bed.js) are drawn
// here by eye.
const m = v => v / 1000

function materials() {
  const wood = (color, roughness) => { const material = new THREE.MeshStandardMaterial({color, roughness}); tagSurfaceMaterial(material, 'wood'); return material }
  return {
    bed: createBedroom1BedMaterials(),
    wardrobeBody: wood('#d0c0aa', .76), wardrobeFront: wood('#e9e1d4', .66),
    handle: new THREE.MeshStandardMaterial({color: '#373b3c', metalness: .62, roughness: .31}),
    tabletop: wood('#b28a60', .67),
    frame: new THREE.MeshStandardMaterial({color: '#353b3d', metalness: .58, roughness: .34}),
    seat: new THREE.MeshStandardMaterial({color: '#d9cec1', roughness: .92}),
    mirror: new THREE.MeshStandardMaterial({color: '#dfe9ec', metalness: .9, roughness: .08}),
    cabinetFront: wood('#eee8df', .58),
  }
}

const boxInto = parent => (w, h, d, x, y, z, material) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh
}

// The owner's bed colours (unchanged by the 2026-10-06 furniture pass): timber base and headboard, ivory sheet, sage duvet,
// white pillows and the two accent cushions that were on the bed. The oatmeal knit throw is new (a default, see the note).
const BEDROOM1_BED_COLOURS = {frame: '#806047', headboard: '#9a7656', mattress: '#efe8dc', duvet: '#b7c7bd', pillow: '#fbf8f1',
  throw: '#bfa98a', cushions: ['#8d9c8f', '#b48b60']}
/** Materials for the Bedroom 1 bed (frame and headboard tagged 'wood', as before). */
export const createBedroom1BedMaterials = () => createBedMaterials(BEDROOM1_BED_COLOURS)

/** The bed of a bedroom1Plan() layout, built with its length along local +x (head at the +x end), then turned to its head wall. */
function createBed(bed, materials) {
  const group = createMadeBed({
    name: 'Bedroom 1 bed', lengthMm: bed.lengthMm, widthMm: bed.widthMm,
    base: {topMm: bed.baseMm}, mattressMm: bed.mattressMm,
    headboard: {thicknessMm: bed.headboardMm, topMm: bed.headboardTopMm, bottomMm: bed.baseMm},
    pillows: 2, cushions: 2, throw: {fromFootMm: 110, lengthMm: 430}, seed: 1,
  }, materials)
  group.position.set(m((bed.x1 + bed.x2) / 2), 0, m((bed.z1 + bed.z2) / 2))
  if (bed.headWall === 'south') group.rotation.y = -Math.PI / 2
  return group
}

/**
 * The Bedroom 1 bed alone, for Whole home 3D (which draws the rest of the room itself): layout A ('present') unless asked.
 * Room frame in metres, as on the room page.
 */
export function createBedroom1Bed(room, layoutKey = 'present', materials = createBedroom1BedMaterials()) {
  return createBed(bedroom1Plan(room, layoutKey).bed, materials)
}

function createWestWardrobe(wardrobe, mat) {
  const group = new THREE.Group(); group.name = 'Bedroom 1 west wardrobe'
  const box = boxInto(group)
  const depth = m(wardrobe.x2), length = m(wardrobe.z2 - wardrobe.z1), height = m(wardrobe.heightMm), start = m(wardrobe.z1), center = start + length / 2, doors = wardrobe.doorCount || 3
  box(depth, height, length, depth / 2, height / 2, center, mat.wardrobeBody)
  for (let i = 0; i < doors; i++) {
    const panelLength = length / doors - .012, z = start + (i + .5) * length / doors
    box(.025, height - .14, panelLength, depth + .014, (height + .09) / 2, z, mat.wardrobeFront)
    box(.018, .25, .018, depth + .034, 1.15, z + panelLength * .35, mat.handle)
  }
  box(depth + .035, .09, length, depth / 2, .045, center, mat.wardrobeBody)
  return group
}

function createBalconyFurniture(balcony, mat) {
  const group = new THREE.Group(); group.name = 'Bedroom 1 balcony table and chair'
  const box = boxInto(group)
  const t = balcony.table, c = balcony.chair
  const tableX = m((t.x1 + t.x2) / 2), tableZ = m((t.z1 + t.z2) / 2), td = m(t.x2 - t.x1), tw = m(t.z2 - t.z1), th = m(t.heightMm)
  // The work surface runs north-south beside the east glazing.
  box(td, .04, tw, tableX, th, tableZ, mat.tabletop)
  for (const dx of [-td / 2 + .055, td / 2 - .055]) for (const dz of [-tw / 2 + .055, tw / 2 - .055]) box(.03, th - .04, .03, tableX + dx, (th - .04) / 2, tableZ + dz, mat.frame)
  const chairX = m((c.x1 + c.x2) / 2), chairZ = m((c.z1 + c.z2) / 2), cd = m(c.x2 - c.x1), cw = m(c.z2 - c.z1), backH = m(c.heightMm), seatH = m(c.seatHeightMm)
  box(cd, .07, cw, chairX, seatH, chairZ, mat.seat)
  for (const dx of [-cd / 2 + .06, cd / 2 - .06]) for (const dz of [-cw / 2 + .06, cw / 2 - .06]) box(.028, seatH - .04, .028, chairX + dx, (seatH - .04) / 2, chairZ + dz, mat.frame)
  box(.05, backH - seatH, cw, chairX - cd / 2 + .03, (backH + seatH) / 2, chairZ, mat.seat)
  return group
}

function createDressingTable(table, mat) {
  const group = new THREE.Group(); group.name = 'Bedroom 1 dressing table (layout B)'
  const box = boxInto(group)
  const x1 = m(table.x1), width = m(table.x2 - table.x1), depth = m(table.z2), height = m(table.heightMm), cx = x1 + width / 2
  box(width, .03, depth, cx, height - .015, depth / 2, mat.tabletop)
  box(width - .04, .12, depth - .03, cx, height - .09, depth / 2, mat.wardrobeFront) // drawer band under the top
  for (const x of [x1 + .02, x1 + width - .02]) box(.04, height - .03, depth - .02, x, (height - .03) / 2, depth / 2, mat.tabletop)
  for (const dx of [-width / 4, width / 4]) box(.10, .012, .012, cx + dx, height - .09, depth - .008, mat.handle)
  const mirror = table.mirror, mw = m(mirror.widthMm), mh = m(mirror.heightMm), my = m(mirror.bottomMm) + mh / 2
  box(mw + .04, mh + .04, .02, cx, my, .06, mat.frame)
  box(mw, mh, .006, cx, my, .072, mat.mirror)
  const s = table.stool, sw = m(s.x2 - s.x1), sd = m(s.z2 - s.z1), sh = m(s.heightMm), sx = m((s.x1 + s.x2) / 2), sz = m((s.z1 + s.z2) / 2)
  box(sw, .08, sd, sx, sh - .04, sz, mat.seat)
  for (const dx of [-sw / 2 + .04, sw / 2 - .04]) for (const dz of [-sd / 2 + .04, sd / 2 - .04]) box(.03, sh - .08, .03, sx + dx, (sh - .08) / 2, sz + dz, mat.frame)
  return group
}

function createBedsideTable(table, mat) {
  const group = new THREE.Group(); group.name = 'Bedroom 1 bedside table (layout B)'
  const box = boxInto(group)
  const width = m(table.x2 - table.x1), depth = m(table.z2 - table.z1), height = m(table.heightMm), cx = m((table.x1 + table.x2) / 2), cz = m((table.z1 + table.z2) / 2)
  box(width, height - .08, depth, cx, (height + .08) / 2, cz, mat.tabletop)
  for (const dx of [-width / 2 + .04, width / 2 - .04]) for (const dz of [-depth / 2 + .04, depth / 2 - .04]) box(.03, .08, .03, cx + dx, .04, cz + dz, mat.frame)
  for (const y of [height * .42, height * .76]) { box(width - .03, height * .28, .012, cx, y, cz - depth / 2 - .006, mat.wardrobeFront); box(.10, .012, .012, cx, y, cz - depth / 2 - .018, mat.handle) }
  return group
}

/** The bedroom face of the medicine cabinet in the closed old door: two flush doors, with a fixed panel below when the layout raises them. */
function createCabinetFace(cabinet, lengthMm, wallFaceMm, mat) {
  const group = new THREE.Group(); group.name = 'Medicine cabinet in the closed old door (Bedroom 1 face)'
  const box = boxInto(group)
  const c = BEDROOM1_CLOSED_DOOR.cabinet, gap = m(c.doorGapMm), thick = m(c.doorMm), z = m(lengthMm - wallFaceMm) - thick / 2
  const x1 = m(cabinet.x1), width = m(cabinet.x2 - cabinet.x1), top = m(cabinet.heightMm), bottom = m(cabinet.doorBottomMm), leaf = m(cabinet.leafMm)
  if (bottom > 0) box(width - 2 * gap, bottom - gap, thick, x1 + width / 2, (bottom - gap) / 2, z, mat.wardrobeBody)
  for (let i = 0; i < cabinet.doorCount; i++) {
    const left = x1 + gap + i * (leaf + gap), west = i < cabinet.doorCount / 2
    box(leaf, top - bottom - 2 * gap, thick, left + leaf / 2, (top + bottom) / 2, z, mat.cabinetFront)
    box(.014, .16, .014, west ? left + leaf - .04 : left + .04, Math.max(m(c.handleHeightMm), bottom + .25), z - thick / 2 - .007, mat.handle)
  }
  return group
}

function createLayout(room, key, mat, wallFaceMm) {
  const plan = bedroom1Plan(room, key), W = m(plan.widthMm), L = m(plan.lengthMm)
  const furniture = new THREE.Group(); furniture.name = `Bedroom 1 furniture, layout ${plan.label}`
  furniture.add(createBed(plan.bed, mat.bed), createWestWardrobe(plan.wardrobe, mat), createBalconyFurniture(plan.balcony, mat))
  if (plan.dressingTable) furniture.add(createDressingTable(plan.dressingTable, mat))
  if (plan.bedsideTable) furniture.add(createBedsideTable(plan.bedsideTable, mat))
  // Decor and the laundry hamper (owner requests 2026-09-28 and 2026-09-29); positions from the layout's `loose` list.
  const {rug, plant, hamper} = plan.loose
  if (rug) { const piece = createRug(m(rug.x2 - rug.x1), m(rug.z2 - rug.z1), '#c7b9a6'); piece.position.set(m((rug.x1 + rug.x2) / 2), 0, m((rug.z1 + rug.z2) / 2)); furniture.add(piece) }
  if (plant) { const piece = createPottedPlant(m(plant.heightMm)); piece.position.set(m(plant.centerXmm), 0, m(plant.centerZmm)); furniture.add(piece) }
  if (hamper) { const piece = createLaundryHamper(); piece.position.set(m(hamper.centerXmm), 0, m(hamper.centerZmm)); furniture.add(piece) }
  // Art on the wall behind the bed head.
  const art = createWallArt(.85, .6, '#7e8b99'), bed = plan.bed
  if (bed.headWall === 'east') { art.position.set(W - .05, 1.55, m((bed.z1 + bed.z2) / 2)); art.rotation.y = -Math.PI / 2 }
  else { art.position.set(m((bed.x1 + bed.x2) / 2), 1.55, L - .05); art.rotation.y = Math.PI }
  furniture.add(art)
  return {furniture, southWall: createCabinetFace(plan.medicineCabinet, plan.lengthMm, wallFaceMm, mat)}
}

/**
 * Builds every Bedroom 1 layout once and shows one at a time.
 * `furniture` goes into the room's furniture group, `southWall` onto the south wall (the medicine cabinet face), and
 * `lighting` into the room: it holds the track lights of the layouts whose bed track differs from the default config.
 * `defaultLighting` is the room's own track-light group (rooms/shared/RoomTaskLighting.js); it is hidden while such a layout shows.
 */
export function createBedroom1Layouts(room, {initial = BEDROOM1_DESIGN.defaultLayout, wallFaceMm = 50, defaultLighting = null, realLights = false} = {}) {
  const mat = materials()
  const furniture = new THREE.Group(); furniture.name = 'Bedroom 1 furniture'
  const southWall = new THREE.Group(); southWall.name = 'Bedroom 1 south wall fittings'
  const lighting = new THREE.Group(); lighting.name = 'Bedroom 1 layout lighting'
  const layouts = {}
  for (const key of BEDROOM1_LAYOUT_KEYS) {
    const built = createLayout(room, key, mat, wallFaceMm)
    const own = BEDROOM1_DESIGN.layouts[key].lighting ? createRoomTrackLighting(bedroom1LightingFor(BEDROOM1_LIGHTING, key), room, {realLights}) : null
    furniture.add(built.furniture); southWall.add(built.southWall); if (own) lighting.add(own)
    layouts[key] = {...built, lighting: own}
  }
  let current = initial
  const setLayout = key => {
    if (!layouts[key]) throw new Error(`Unknown Bedroom 1 layout: ${key}`)
    current = key
    for (const [name, parts] of Object.entries(layouts)) { const on = name === key; parts.furniture.visible = on; parts.southWall.visible = on; if (parts.lighting) parts.lighting.visible = on }
    if (defaultLighting) defaultLighting.visible = !layouts[key].lighting
  }
  setLayout(initial)
  return {
    furniture, southWall, lighting, setLayout, layout: () => current,
    // Dims one track run (same run ids as the default config) in the layouts that carry their own track lights.
    setTrackLight: (circuit, level) => { for (const parts of Object.values(layouts)) parts.lighting?.userData.setTrackLight(circuit, level) },
  }
}
