import * as THREE from 'three'

// Two identical 3-seaters plus the coffee table, rug and styling from the owner's references
// (cream sofas, terracotta cushions, dark carved wood). Positions come from the room config
// (millimetres, room frame: x from the west wall, z from the north wall). Decor sub-groups carry
// archvizExclude so the Blender renders skip them, as with the other decor factories.
// Sofa/table/panel materials are deliberately not tagged for the Materials panel: the references
// are dark walnut and the panel would repaint them light oak.
const mm = v => v / 1000
// Sofas are built facing +x with the back at -x; rotation.y turns them to face another way.
const FACING = {east: 0, north: Math.PI / 2, south: -Math.PI / 2, west: Math.PI}

function sofa(widthMm, lengthMm) {
  const group = new THREE.Group(); group.name = 'three-seater sofa'
  const D = mm(widthMm), Ln = mm(lengthMm)
  const cream = new THREE.MeshStandardMaterial({color: '#e6dac6', roughness: .95})
  const seat = new THREE.MeshStandardMaterial({color: '#efe5d3', roughness: .97})
  const wood = new THREE.MeshStandardMaterial({color: '#4a2f1e', roughness: .6})
  const box = (sx, sy, sz, x, y, z, material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material)
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m)
  }
  box(D, .24, Ln, 0, .35, 0, cream)
  box(.22, .57, Ln, -D / 2 + .11, .64, 0, cream)
  for (const z of [-Ln / 2 + .08, Ln / 2 - .08]) box(D, .22, .16, 0, .58, z, cream)
  const seatLength = (Ln - .32) / 3
  for (let i = 0; i < 3; i++) box(D - .27, .12, seatLength - .01, .07, .5, -Ln / 2 + .16 + seatLength * (i + .5), seat)
  for (const x of [-D / 2 + .09, D / 2 - .09]) for (const z of [-Ln / 2 + .12, Ln / 2 - .12]) box(.055, .13, .055, x, .065, z, wood)
  const decor = new THREE.Group(); decor.name = 'sofa cushions'; decor.userData.archvizExclude = true; group.add(decor)
  const colours = ['#b5573a', '#c9803f', '#e2c7a0', '#b5573a', '#c9803f', '#e2c7a0']
  const reach = Ln / 2 - .35
  colours.forEach((color, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .36, i % 3 === 2 ? .4 : .34), new THREE.MeshStandardMaterial({color, roughness: .97}))
    m.position.set(-D / 2 + .3, .78, (i - 2.5) / 2.5 * reach)
    m.rotation.z = -.22; m.rotation.y = (i % 2 ? 1 : -1) * .08; m.castShadow = true; decor.add(m)
  })
  return group
}

function framedPanel(widthMm, heightMm) {
  // Carved-wood wall panel like the reference: dark frame, lighter lattice field. Faces +x.
  const group = new THREE.Group(); group.name = 'carved wall panel'
  const frame = new THREE.MeshStandardMaterial({color: '#3d2717', roughness: .55})
  const field = new THREE.MeshStandardMaterial({color: '#6b4529', roughness: .5})
  const carve = new THREE.MeshStandardMaterial({color: '#94643a', roughness: .45})
  const w = mm(widthMm), h = mm(heightMm)
  const add = (sx, sy, sz, x, y, z, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material); m.position.set(x, y, z); m.castShadow = true; group.add(m) }
  add(.04, h, w, 0, 0, 0, frame)
  add(.05, h - .08, w - .08, .005, 0, 0, field)
  for (let i = -3; i <= 3; i++) add(.056, h - .16, .012, .006, 0, i * (w - .2) / 6, carve)
  for (let j = -5; j <= 5; j++) add(.056, .012, w - .2, .006, j * (h - .2) / 10, 0, carve)
  return group
}

// spec: {sofas:[{centerXmm,centerZmm,widthMm,lengthMm,faces}], table, rug, sideTable:{xMm,zMm}, panelsZ:[mm]}
function buildSeating(spec, {wallFaceMm = 0} = {}) {
  const group = new THREE.Group(); group.name = 'Drawing Room seating'
  const wood = new THREE.MeshStandardMaterial({color: '#4a2f1e', roughness: .58})

  const rug = new THREE.Group(); rug.name = 'rug'; rug.userData.archvizExclude = true
  const border = new THREE.Mesh(new THREE.BoxGeometry(mm(spec.rug.widthMm), .012, mm(spec.rug.lengthMm)), new THREE.MeshStandardMaterial({color: '#8f4f34', roughness: 1}))
  const inner = new THREE.Mesh(new THREE.BoxGeometry(mm(spec.rug.widthMm) - .16, .014, mm(spec.rug.lengthMm) - .16), new THREE.MeshStandardMaterial({color: '#b98058', roughness: 1}))
  border.position.set(mm(spec.rug.centerXmm), .006, mm(spec.rug.centerZmm)); inner.position.set(mm(spec.rug.centerXmm), .008, mm(spec.rug.centerZmm))
  border.receiveShadow = inner.receiveShadow = true; rug.add(border, inner); group.add(rug)

  for (const s of spec.sofas) {
    const item = sofa(s.widthMm, s.lengthMm)
    item.position.set(mm(s.centerXmm), 0, mm(s.centerZmm)); item.rotation.y = FACING[s.faces]; group.add(item)
  }

  const t = spec.table
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .055, 48), wood)
  top.scale.set(mm(t.widthMm) / 2, 1, mm(t.lengthMm) / 2); top.position.set(mm(t.centerXmm), .43, mm(t.centerZmm)); top.castShadow = top.receiveShadow = true; group.add(top)
  for (const dx of [-.2, .2]) for (const dz of [-.3, .3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.04, .4, .04), wood)
    leg.position.set(mm(t.centerXmm) + dx, .2, mm(t.centerZmm) + dz); leg.castShadow = true; group.add(leg)
  }

  const decor = new THREE.Group(); decor.name = 'seating decor'; decor.userData.archvizExclude = true; group.add(decor)
  const shadeMaterial = new THREE.MeshStandardMaterial({color: '#f3dfbf', emissive: '#ffcf8b', emissiveIntensity: .55, roughness: .9, side: THREE.DoubleSide})
  shadeMaterial.userData.taskLightGlow = true
  // Round lamp tables: spec.sideTable, plus any spec.lampTables ({xMm, zMm, diameterMm, heightMm}). A furnished table (not decor)
  // when it is part of the layout's plan, so it reaches the Blender export.
  const lampTable = ({xMm, zMm, diameterMm = 380, heightMm = 550}, parent) => {
    const r = mm(diameterMm) / 2, h = mm(heightMm)
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .04, 32), wood); top.position.set(mm(xMm), h, mm(zMm)); top.castShadow = true; parent.add(top)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, h - .02, 16), wood); leg.position.set(mm(xMm), (h - .02) / 2, mm(zMm)); leg.castShadow = true; parent.add(leg)
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * .62, r * .66, .025, 32), wood); foot.position.set(mm(xMm), .0125, mm(zMm)); parent.add(foot)
    const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .26, 24), new THREE.MeshStandardMaterial({color: '#3b2a1e', roughness: .5}))
    lampBody.position.set(mm(xMm), h + .15, mm(zMm)); decor.add(lampBody)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.13, .19, .22, 32, 1, true), shadeMaterial); shade.position.set(mm(xMm), h + .4, mm(zMm)); decor.add(shade)
  }
  lampTable(spec.sideTable, decor)
  for (const t of spec.lampTables ?? []) lampTable(t, group)

  for (const z of spec.panelsZ) {
    const panel = framedPanel(600, 900); panel.position.set(mm(wallFaceMm) + .02, 1.5, mm(z)); decor.add(panel)
  }
  return group
}

/** Layout A: west sofa (faces east) and south sofa (faces north, replacing the window seat). */
export function createDrawingRoomSeating(room, {wallFaceMm = 0} = {}) {
  const f = room.furniture
  const gapMid = (f.sofa.centerZmm + f.sofa.lengthMm / 2 + f.southSofa.centerZmm - f.southSofa.widthMm / 2) / 2
  return buildSeating({
    sofas: [{...f.sofa, faces: 'east'}, {...f.southSofa, faces: 'north'}],
    table: f.coffeeTable, rug: f.rug, sideTable: {xMm: wallFaceMm + 260, zMm: gapMid},
    panelsZ: [f.sofa.centerZmm - 350, f.sofa.centerZmm + 350],
  }, {wallFaceMm})
}

/** Layout B: north-wall sofa (faces south) and west-wall sofa (faces east) forming an L. */
export function createDrawingRoomCornerSeating(room, {wallFaceMm = 0} = {}) {
  const f = room.cornerLayout.furniture
  return buildSeating({
    sofas: [{...f.northSofa, faces: 'south'}, {...f.westSofa, faces: 'east'}],
    table: f.coffeeTable, rug: f.rug,
    sideTable: {xMm: wallFaceMm + 260, zMm: f.westSofa.centerZmm + f.westSofa.lengthMm / 2 + 260},
    panelsZ: [f.westSofa.centerZmm - 350, f.westSofa.centerZmm + 350],
  }, {wallFaceMm})
}

/** Layout C: south-wall sofa (faces north, back under the window) and west-wall sofa (faces east) in an L in the south-west. */
export function createDrawingRoomSouthSeating(room, {wallFaceMm = 0} = {}) {
  const f = room.southLayout.furniture
  return buildSeating({
    sofas: [{...f.southSofa, faces: 'north'}, {...f.westSofa, faces: 'east'}],
    table: f.coffeeTable, rug: f.rug,
    // Side table and lamp just north of the west sofa, where the L opens toward the TV; the corner lamp table at the south
    // sofa's west end (room.southLayout.furniture.cornerTable).
    sideTable: {xMm: wallFaceMm + 260, zMm: f.westSofa.centerZmm - f.westSofa.lengthMm / 2 - 260},
    lampTables: [{xMm: f.cornerTable.centerXmm, zMm: f.cornerTable.centerZmm, diameterMm: f.cornerTable.diameterMm, heightMm: f.cornerTable.heightMm}],
    panelsZ: [f.westSofa.centerZmm - 350, f.westSofa.centerZmm + 350],
  }, {wallFaceMm})
}
