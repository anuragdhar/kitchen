import * as THREE from 'three'
import {createSofa} from '../shared/furniture/Sofa.js'
import {createRug} from '../shared/furniture/Rug.js'

// Two identical 3-seaters plus the coffee table, rug and styling from the owner's references
// (cream sofas, terracotta cushions, dark carved wood). Positions come from the room config
// (millimetres, room frame: x from the west wall, z from the north wall). Decor sub-groups carry
// archvizExclude so the Blender renders skip them, as with the other decor factories.
// Sofa/table/panel materials are deliberately not tagged for the Materials panel: the references
// are dark walnut and the panel would repaint them light oak.
const mm = v => v / 1000
// Sofas are built facing +x with the back at -x; rotation.y turns them to face another way.
const FACING = {east: 0, north: Math.PI / 2, south: -Math.PI / 2, west: Math.PI}

// The sofa model lives in rooms/shared/furniture/Sofa.js (soft upholstered forms, 2026-10-06). Same box as before: widthMm
// deep x lengthMm long, back at 925 mm, and the scatter cushions topping out at 968.8 mm, where the earlier block model's
// cushions reached, so click-for-dimensions still reports 2250 x 880 x 970. Same colours: cream frame, lighter cream
// cushions, dark wood legs, terracotta / ochre / sand scatter cushions.
const SOFA_LOOK = {heightMm: 925, scatterTopMm: 968.8, colours: {frame: '#e6dac6', cushion: '#efe5d3', legs: '#4a2f1e'}}
function sofa(widthMm, lengthMm) {
  return createSofa({depthMm: widthMm, lengthMm, ...SOFA_LOOK, name: 'Three-seater sofa'})
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

  // Wool rug with a bound pile edge and a soft pattern in the same two colours (border #8f4f34, field #b98058), 15 mm thick.
  const rug = createRug({widthMm: spec.rug.widthMm, lengthMm: spec.rug.lengthMm, heightMm: 15, colours: {border: '#8f4f34', field: '#b98058'}, borderMm: 80})
  rug.position.set(mm(spec.rug.centerXmm), 0, mm(spec.rug.centerZmm)); group.add(rug)

  for (const s of spec.sofas) {
    const item = sofa(s.widthMm, s.lengthMm)
    item.position.set(mm(s.centerXmm), 0, mm(s.centerZmm)); item.rotation.y = FACING[s.faces]; group.add(item)
  }

  const t = spec.table, tableGroup = new THREE.Group(); tableGroup.name = 'Coffee table'; group.add(tableGroup)
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .055, 48), wood)
  top.scale.set(mm(t.widthMm) / 2, 1, mm(t.lengthMm) / 2); top.position.set(mm(t.centerXmm), .43, mm(t.centerZmm)); top.castShadow = top.receiveShadow = true; tableGroup.add(top)
  for (const dx of [-.2, .2]) for (const dz of [-.3, .3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.04, .4, .04), wood)
    leg.position.set(mm(t.centerXmm) + dx, .2, mm(t.centerZmm) + dz); leg.castShadow = true; tableGroup.add(leg)
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
    if (spec.lamps === false) return // tables without table lamps (layout C, owner 2026-10-04)
    const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .26, 24), new THREE.MeshStandardMaterial({color: '#3b2a1e', roughness: .5}))
    lampBody.position.set(mm(xMm), h + .15, mm(zMm)); decor.add(lampBody)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.13, .19, .22, 32, 1, true), shadeMaterial); shade.position.set(mm(xMm), h + .4, mm(zMm)); decor.add(shade)
  }
  lampTable(spec.sideTable, decor)
  for (const t of spec.lampTables ?? []) { const item = new THREE.Group(); item.name = 'Lamp table'; group.add(item); lampTable(t, item) }

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
  const group = buildSeating({
    sofas: [{...f.southSofa, faces: 'north'}, {...f.westSofa, faces: 'east'}],
    table: f.coffeeTable, rug: f.rug,
    // Side table just north of the west sofa, where the L opens toward the TV; the corner table at the south sofa's west
    // end (room.southLayout.furniture.cornerTable). Owner 2026-10-04: no table lamps; reading is done by the wall-mounted
    // reading light and the track lights, so the tables stay clear for a cup or a phone.
    lamps: false,
    sideTable: {xMm: wallFaceMm + 260, zMm: f.westSofa.centerZmm - f.westSofa.lengthMm / 2 - 260},
    lampTables: [{xMm: f.cornerTable.centerXmm, zMm: f.cornerTable.centerZmm, diameterMm: f.cornerTable.diameterMm, heightMm: f.cornerTable.heightMm}],
    panelsZ: [f.westSofa.centerZmm - 350, f.westSofa.centerZmm + 350],
  }, {wallFaceMm})
  group.add(southWindowDressing(room, {wallFaceMm}))
  return group
}

// Styling from the owner's two living-room references (inspiration library, applied 2026-10-03; no false ceiling): warm
// floor-length curtains gathered either side of the south window on a dark rod, and a floor plant in the south-east corner.
// Decor only (archvizExclude). The panels hang clear of the south sofa's ends and behind the corner lamp table.
function southWindowDressing(room, {wallFaceMm = 0} = {}) {
  const decor = new THREE.Group(); decor.name = 'south window curtains and plant'; decor.userData.archvizExclude = true
  const win = room.windows.find(w => w.wall === 'south'), sofa = room.southLayout.furniture.southSofa
  const z = mm(room.lengthMm - wallFaceMm) - .07, top = mm(win.topMm) + .18
  const fabric = new THREE.MeshStandardMaterial({color: '#9a5a36', roughness: .95}), rod = new THREE.MeshStandardMaterial({color: '#3b2a1e', roughness: .5, metalness: .3})
  const sofaWest = sofa.centerXmm - sofa.lengthMm / 2, sofaEast = sofa.centerXmm + sofa.lengthMm / 2
  // Each panel is a row of narrow pleats; it stops short of the sofa end it stands beside.
  const panel = (x1Mm, x2Mm) => {
    const pleats = Math.max(3, Math.round((x2Mm - x1Mm) / 55))
    for (let i = 0; i < pleats; i++) {
      const w = mm(x2Mm - x1Mm) / pleats
      const m = new THREE.Mesh(new THREE.BoxGeometry(w * .82, top - .02, i % 2 ? .05 : .03), fabric)
      m.position.set(mm(x1Mm) + w * (i + .5), (top - .02) / 2 + .02, z - (i % 2 ? .012 : 0)); m.castShadow = true; decor.add(m)
    }
  }
  // The rod and the panels overhang the window by up to 400 and 330 mm, but stop at the side walls.
  const westLimit = wallFaceMm + 20, eastLimit = room.widthMm - wallFaceMm - 20
  panel(Math.max(westLimit, win.fromMm - 330), Math.min(sofaWest - 20, win.fromMm + 60))
  panel(Math.max(sofaEast + 30, win.fromMm + win.widthMm - 60), Math.min(eastLimit, win.fromMm + win.widthMm + 330))
  const rodWest = Math.max(westLimit, win.fromMm - 400), rodEast = Math.min(eastLimit, win.fromMm + win.widthMm + 400)
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, mm(rodEast - rodWest), 12), rod)
  bar.rotation.z = Math.PI / 2; bar.position.set(mm((rodWest + rodEast) / 2), top + .02, z); decor.add(bar)
  // Floor plant in a woven-look pot, south-east corner beyond the sofa.
  const px = mm(room.widthMm - wallFaceMm) - .28, pz = mm(room.lengthMm - wallFaceMm) - .3
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.15, .12, .32, 20), new THREE.MeshStandardMaterial({color: '#b08a5a', roughness: .9})); pot.position.set(px, .16, pz); pot.castShadow = true; decor.add(pot)
  const leaf = new THREE.MeshStandardMaterial({color: '#3f7d3a', roughness: .85})
  for (let i = 0; i < 7; i++) {
    const blade = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), leaf)
    const a = i / 7 * Math.PI * 2
    blade.scale.set(.5, 2.6 + (i % 3) * .5, .5); blade.position.set(px + Math.cos(a) * .1, .55 + (i % 3) * .1, pz + Math.sin(a) * .1); blade.rotation.z = Math.cos(a) * .35; blade.rotation.x = Math.sin(a) * .35
    blade.castShadow = true; decor.add(blade)
  }
  return decor
}
