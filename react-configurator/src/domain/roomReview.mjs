// Builds the facts an outside reviewer (a person or an online AI) needs about a room, from the same
// config the 3D scenes use. Pure: no React, Three.js or DOM. Units are millimetres unless stated.
import {BEDROOM1_CLOSED_DOOR, closedDoorSpanMm} from '../config/bedroom1ClosedDoor.js'
import {HOME_ROOM_LAYOUTS} from '../config/homeRoomViews.js'
import {checkDrawingRoomLayout, checkCornerLayout, checkCornerConsole, checkCornerProjector, checkSouthLayout, consoleGeometry, projectorPlacement, tvWallGeometry, cornerTvFrontX, WALL_FACE_MM} from './drawingRoomLayout.mjs'
import {windowGeometry} from './windowDesign.mjs'

const mm = v => `${Math.round(v)} mm`
const size = (a, b) => `${Math.round(a)} x ${Math.round(b)}`
export const DRAWING_LAYOUT_LABELS = {
  southSofas: 'C: sofas south + west, TV on the north wall',
  northTv: 'A: TV on the north wall',
  cornerSofas: 'B: corner sofas, 65-inch TV flat on the east wall',
  cornerConsole: 'B2: corner sofas, low 18-inch console and arm-mounted TV',
  cornerProjector: 'B3 (future): corner sofas, ceiling projector and drop-down screen',
}

// Frame used everywhere in the app's room scenes.
export const FRAME_NOTE = 'Room frame: x runs from the WEST wall (x=0) to the EAST wall, z runs from the NORTH wall (z=0) to the SOUTH wall, y is up. '
  + 'Plan north is the wall at z=0. The app\'s top view is drawn with SOUTH at the top of the picture, so left-right is mirrored compared with a normal north-up plan.'

function describeOpenings(room) {
  const lines = []
for (const d of room.doors ?? []) {
    const swing = d.opensInto ? ` It opens INTO ${d.opensInto === room.name ? 'this room' : d.opensInto} (leaf ${mm(d.leafMm)}); the swing sweeps a quarter circle of that radius from the ${d.hinge ?? 'unknown'} jamb${d.hingeKnown ? ' (the hinge side and a leaf of about this width are inferred from the owner confirming that the north-wall sofa does not touch the door; the real leaf width has not been measured)' : ' (hinge side not confirmed, both sides were checked)'}, so nothing may stand in it.` : ''
    lines.push(`Door on the ${d.wall} wall: ${mm(d.widthMm)} wide x ${mm(d.heightMm)} high, starting ${mm(d.fromMm)} from the ${d.wall === 'north' || d.wall === 'south' ? 'west' : 'north'} end, leads to ${d.leadsTo}.${swing}`)
  }
  for (const w of room.windows ?? []) {
    const g = windowGeometry(w)
    const design = g.designed ? ` ${g.bays.length} bays of ${g.bays.map(b => b.widthMm).join(' / ')} mm${g.transomMm ? `, fixed top lights above a transom at ${mm(g.transomMm)}` : ''}${g.leaves.length ? `, ${g.leaves.length} ${w.shutters?.opens || ''} shutters below it` : ''}${g.rollerNets.length ? `, roller mosquito net per section (cassette ${g.rollerNets[0].cassette})` : ''}${g.outsideScreen ? `, outside roll-up screen ${mm(g.outsideScreen.widthMm)} wide parked ${mm(g.outsideScreen.offsetMm)} off the wall` : ''}.` : ''
    lines.push(`Window on the ${w.wall} wall: ${mm(w.widthMm)} wide, sill ${mm(w.bottomMm)}, head ${mm(w.topMm)}, starting ${mm(w.fromMm)} from the west end.${design}`)
  }
  for (const [wall, o] of Object.entries(room.wallOpenings ?? {})) lines.push(`Open (no wall) on the ${wall} side from ${mm(o.fromMm)} to ${mm(o.toMm)}.`)
  const ws = room.wallStorage
  if (ws) lines.push(`Cabinet door on the north wall: ${mm(ws.widthMm)} wide (${ws.doorCount} leaves) x ${mm(ws.heightMm)} high, starting ${mm(ws.fromWestMm)} from the west end, into a closet ${mm(ws.depthMm)} deep behind the wall (the west half of the pocket on the Main Entry side; its east half is a separate cabinet that opens onto the Entry, not into this room). Shelves ${mm(ws.shelves.depthMm)} deep at the back. Not confirmed on site.`)
  for (const b of room.hangingBeams ?? []) lines.push(`Ceiling beam along the ${b.wall} side from ${mm(b.fromMm)} to ${mm(b.toMm)}, drops ${mm(b.dropMm)}.`)
  return lines
}

function describeItem(key, item) {
  if (Array.isArray(item)) return `${key}: ${item.join(', ')}`
  if (!item || typeof item !== 'object') return null
  const parts = Object.entries(item).filter(([, v]) => typeof v === 'number' || typeof v === 'string').map(([k, v]) => `${k.replace(/Mm$/, '')}=${typeof v === 'number' ? Math.round(v) : v}`)
  return parts.length ? `${key}: ${parts.join(', ')}` : null
}

function describeGeneric(room) {
  return Object.entries(room.furniture ?? {}).map(([k, v]) => describeItem(k, v)).filter(Boolean)
}

function drawingLayoutA(room) {
  const w = room.tvWall, g = tvWallGeometry(room), f = room.furniture, check = checkDrawingRoomLayout(room)
  return {
    lines: [
      `TV cabinet on the north wall: x ${w.fromWestMm}-${g.endMm}, ${mm(w.depthMm)} deep (one foot), ${mm(w.heightMm)} high, dark walnut with lattice doors.`,
      `65-inch TV (${w.tv.widthMm} x ${w.tv.heightMm} mm) recessed in the centre bay, bottom edge ${mm(w.tv.bottomMm)}, set back ${mm(w.tv.setbackMm)}; Bose Smart Soundbar 300 (${w.soundbar.widthMm} x ${w.soundbar.heightMm} x ${w.soundbar.depthMm}) on the bay floor below it.`,
      `Bose Bass Module 500 (${w.bassModule.widthMm} x ${w.bassModule.heightMm} x ${w.bassModule.depthMm}) in the west half of the base behind an open lattice, next to the soundbar.`,
      `Wi-Fi router in a ventilated lattice bay above the TV; landline phone and intercom in an open niche at the east end of the cabinet (door side).`,
      `The TV cabinet covers the west cabinet door in the north wall (x ${room.wallStorage.fromWestMm}-${room.wallStorage.fromWestMm + room.wallStorage.widthMm}): with this layout that closet cannot be reached.`,
      `West 3-seater: centre (${f.sofa.centerXmm}, ${f.sofa.centerZmm}), ${size(f.sofa.widthMm, f.sofa.lengthMm)}, back on the west wall, faces east.`,
      `South 3-seater: centre (${f.southSofa.centerXmm}, ${f.southSofa.centerZmm}), same size, back on the south wall under the window, faces north.`,
      `Oval coffee table: centre (${f.coffeeTable.centerXmm}, ${f.coffeeTable.centerZmm}), ${size(f.coffeeTable.widthMm, f.coffeeTable.lengthMm)}. Rug under the seating.`,
    ],
    items: [
      {label: `TV cabinet ${w.widthMm}x${w.depthMm}`, x1: w.fromWestMm, z1: 0, x2: g.endMm, z2: w.depthMm, kind: 'fixed'},
      {label: `Sofa ${f.sofa.lengthMm}x${f.sofa.widthMm}`, x1: f.sofa.centerXmm - f.sofa.widthMm / 2, z1: f.sofa.centerZmm - f.sofa.lengthMm / 2, x2: f.sofa.centerXmm + f.sofa.widthMm / 2, z2: f.sofa.centerZmm + f.sofa.lengthMm / 2, kind: 'seat'},
      {label: `Sofa ${f.southSofa.lengthMm}x${f.southSofa.widthMm}`, x1: f.southSofa.centerXmm - f.southSofa.lengthMm / 2, z1: f.southSofa.centerZmm - f.southSofa.widthMm / 2, x2: f.southSofa.centerXmm + f.southSofa.lengthMm / 2, z2: f.southSofa.centerZmm + f.southSofa.widthMm / 2, kind: 'seat'},
      {label: `Table ${f.coffeeTable.lengthMm}x${f.coffeeTable.widthMm}`, x1: f.coffeeTable.centerXmm - f.coffeeTable.widthMm / 2, z1: f.coffeeTable.centerZmm - f.coffeeTable.lengthMm / 2, x2: f.coffeeTable.centerXmm + f.coffeeTable.widthMm / 2, z2: f.coffeeTable.centerZmm + f.coffeeTable.lengthMm / 2, kind: 'table'},
    ],
    measured: [
      `South sofa seats: ${spread(check.views.southSofa)}.`,
      `West sofa seats: ${spread(check.views.westSofa)}.`,
      `Gaps: west sofa to table ${mm(check.clearances.westSofaToTable)}, south sofa to table ${mm(check.clearances.southSofaToTable)}, between the sofas ${mm(check.clearances.westSofaToSouthSofa)}.`,
    ],
    issues: check.issues,
  }
}

function drawingLayoutB(room) {
  const c = room.cornerLayout, f = c.furniture, check = checkCornerLayout(room), frontX = cornerTvFrontX(room)
  const tvZ1 = c.tv.centerFromNorthMm - c.tv.widthMm / 2, tvZ2 = c.tv.centerFromNorthMm + c.tv.widthMm / 2
  const bm = c.bassModule, rc = c.routerCabinet, ws = room.wallStorage, bmX2 = room.widthMm - WALL_FACE_MM - bm.fromWallMm
  return {
    lines: [
      `North-wall 3-seater: centre (${f.northSofa.centerXmm}, ${f.northSofa.centerZmm}), ${size(f.northSofa.lengthMm, f.northSofa.widthMm)}, back on the north wall, faces south. Its east end passes the entry-door edge line by ${mm(check.clearances.northSofaPastDoorJambLine)}.`,
      `West-wall 3-seater: centre (${f.westSofa.centerXmm}, ${f.westSofa.centerZmm}), ${size(f.westSofa.widthMm, f.westSofa.lengthMm)}, back on the west wall, faces east, ${mm(check.clearances.sofaToSofa)} south of the north sofa (an L).`,
      `Oval coffee table: centre (${f.coffeeTable.centerXmm}, ${f.coffeeTable.centerZmm}), ${size(f.coffeeTable.widthMm, f.coffeeTable.lengthMm)}. Rug under the L.`,
      `65-inch TV (${c.tv.widthMm} x ${c.tv.heightMm} mm) wall-mounted flat on the solid east wall, z ${Math.round(tvZ1)}-${Math.round(tvZ2)}, bottom edge ${mm(c.tv.bottomMm)}, sticks out ${mm(c.tv.depthMm + c.tv.mountMm)}. The east wall is solid only from z=0 to ${room.wallOpenings.east.fromMm}; beyond that it opens to the Lobby.`,
      `Bose Smart Soundbar 300 (${c.soundbar.widthMm} x ${c.soundbar.heightMm} x ${c.soundbar.depthMm}) on the wall under the TV; Bose Bass Module 500 (${bm.widthMm} x ${bm.heightMm} x ${bm.depthMm}) on the floor below it, centre z ${bm.centerFromNorthMm}.`,
      `Small wall-hung cabinet above the north sofa: x ${rc.fromWestMm}-${rc.fromWestMm + rc.widthMm}, ${mm(rc.bottomMm)}-${mm(rc.bottomMm + rc.heightMm)} high, ${mm(rc.depthMm)} deep, holding the Wi-Fi router (open lattice), a landline phone and an intercom.`,
      `The north sofa stands in front of the west cabinet door (x ${ws.fromWestMm}-${ws.fromWestMm + ws.widthMm}): the door cannot be used while the sofa is against the wall there.`,
    ],
    items: [
      {label: `Sofa ${f.northSofa.lengthMm}x${f.northSofa.widthMm}`, x1: f.northSofa.centerXmm - f.northSofa.lengthMm / 2, z1: f.northSofa.centerZmm - f.northSofa.widthMm / 2, x2: f.northSofa.centerXmm + f.northSofa.lengthMm / 2, z2: f.northSofa.centerZmm + f.northSofa.widthMm / 2, kind: 'seat'},
      {label: `Sofa ${f.westSofa.lengthMm}x${f.westSofa.widthMm}`, x1: f.westSofa.centerXmm - f.westSofa.widthMm / 2, z1: f.westSofa.centerZmm - f.westSofa.lengthMm / 2, x2: f.westSofa.centerXmm + f.westSofa.widthMm / 2, z2: f.westSofa.centerZmm + f.westSofa.lengthMm / 2, kind: 'seat'},
      {label: `Table ${f.coffeeTable.lengthMm}x${f.coffeeTable.widthMm}`, x1: f.coffeeTable.centerXmm - f.coffeeTable.widthMm / 2, z1: f.coffeeTable.centerZmm - f.coffeeTable.lengthMm / 2, x2: f.coffeeTable.centerXmm + f.coffeeTable.widthMm / 2, z2: f.coffeeTable.centerZmm + f.coffeeTable.lengthMm / 2, kind: 'table'},
      {label: `TV ${c.tv.widthMm}`, x1: frontX, z1: tvZ1, x2: room.widthMm - WALL_FACE_MM, z2: tvZ2, kind: 'fixed'},
      {label: 'Bass Module', x1: bmX2 - bm.depthMm, z1: bm.centerFromNorthMm - bm.widthMm / 2, x2: bmX2, z2: bm.centerFromNorthMm + bm.widthMm / 2, kind: 'fixed'},
      {label: `Cabinet ${rc.widthMm}x${rc.depthMm}`, x1: rc.fromWestMm, z1: 0, x2: rc.fromWestMm + rc.widthMm, z2: rc.depthMm, kind: 'fixed'},
      {label: `West cabinet door ${ws.widthMm}`, x1: ws.fromWestMm, z1: 0, x2: ws.fromWestMm + ws.widthMm, z2: 40, kind: 'fixed'},
    ],
    measured: [
      `West sofa seats: ${spread(check.views.westSofa)}.`,
      `North sofa seats: ${spread(check.views.northSofa)}.`,
      `Walking lane between the north sofa end and the TV: ${mm(check.clearances.laneNorthSofaToTv)}; table to TV: ${mm(check.clearances.laneTableToTv)}; at the bass module: ${mm(check.clearances.laneBassModule)}.`,
      `Entry door: ${mm(check.clearances.doorClearPastNorthSofa)} still clear past the north sofa; the TV front is ${mm(check.clearances.tvFrontBeyondDoorEastJamb)} beyond the door's east edge line.`,
    ],
    issues: check.issues,
  }
}


function drawingLayoutC(room) {
  const s = room.southLayout, f = s.furniture, check = checkSouthLayout(room), g = check.tv, ct = s.furniture.cornerTable
  const sofa = (r, along) => along === 'x' ? {x1: r.centerXmm - r.lengthMm / 2, x2: r.centerXmm + r.lengthMm / 2, z1: r.centerZmm - r.widthMm / 2, z2: r.centerZmm + r.widthMm / 2} : {x1: r.centerXmm - r.widthMm / 2, x2: r.centerXmm + r.widthMm / 2, z1: r.centerZmm - r.lengthMm / 2, z2: r.centerZmm + r.lengthMm / 2}
  const south = sofa(f.southSofa, 'x'), west = sofa(f.westSofa, 'z'), t = f.coffeeTable
  return {
    lines: [
      `South-wall 3-seater: centre (${f.southSofa.centerXmm}, ${f.southSofa.centerZmm}), ${size(f.southSofa.lengthMm, f.southSofa.widthMm)}, back against the south wall under the window (${mm(check.clearances.southWallGapMm)} off it), faces north to the TV. Its back (about 925 mm high) covers the lower part of the window above the 550 mm sill.`,
      `West-wall 3-seater: centre (${f.westSofa.centerXmm}, ${f.westSofa.centerZmm}), ${size(f.westSofa.widthMm, f.westSofa.lengthMm)}, back on the west wall, faces east, ${mm(check.clearances.sofaToSofa)} north of the south sofa (an L in the south-west corner).`,
      `Oval coffee table: centre (${t.centerXmm}, ${t.centerZmm}), ${size(t.widthMm, t.lengthMm)}, inside the L. Rug under it.`,
      `TV: ${g.tv.diagonalInches}-inch (${g.tv.widthMm} x ${g.tv.heightMm}) flat on the north wall, x ${g.x1}-${g.x2}, bottom edge ${mm(g.bottomMm)}, centre ${mm(s.tv.centerHeightMm)} high; it fits between the west cabinet door and the entry door with ${mm(check.clearances.tvMarginsMm[s.tv.installedTv])} to spare (a 65-inch leaves ${mm(check.clearances.tvMarginsMm['65'])}).`,
      `TV cabinet below the TV: one free-standing console x ${g.console.x1}-${g.console.x2}, on legs in front of fluted wall panelling, ${mm(s.console.depthMm)} deep, ${mm(g.console.bottomMm)}-${mm(g.console.topMm)} high (open below for cleaning). It holds everything: the Wi-Fi router behind an open lattice (west bay), set-top box storage behind a lattice door, the Bose Bass Module 500 behind an open lattice (east bay); on top the Bose Smart Soundbar 300 under the TV, the landline at the west end and a desk intercom at the east end. There is no cabinet on the east wall.`,
      `Round lamp table in the south-west corner at the south sofa's west end: centre (${ct.centerXmm}, ${ct.centerZmm}), ${mm(ct.diameterMm)} across, ${mm(ct.heightMm)} high (no table lamp: the wall reading light and the track lights serve it).`,
      `Hidden west cabinet door: x ${room.wallStorage.fromWestMm}-${room.wallStorage.fromWestMm + room.wallStorage.widthMm}, ${mm(room.wallStorage.heightMm)} high, one flush leaf with no handle, hidden in the wall panelling, opening outward. The console overlaps it by ${mm(check.clearances.consoleMm.overlapsDoorMm)}; drag the console out ${mm(s.console.dragOutMm)} first.`,
    ],
    items: [
      {label: `Sofa ${f.southSofa.lengthMm}x${f.southSofa.widthMm}`, ...south, kind: 'seat'},
      {label: `Sofa ${f.westSofa.lengthMm}x${f.westSofa.widthMm}`, ...west, kind: 'seat'},
      {label: `Table ${t.lengthMm}x${t.widthMm}`, x1: t.centerXmm - t.widthMm / 2, z1: t.centerZmm - t.lengthMm / 2, x2: t.centerXmm + t.widthMm / 2, z2: t.centerZmm + t.lengthMm / 2, kind: 'table'},
      {label: `TV ${g.tv.widthMm}`, x1: g.x1, z1: 0, x2: g.x2, z2: g.frontZ, kind: 'fixed'},
      {label: `TV console ${s.console.lengthMm}x${s.console.depthMm}`, x1: g.console.x1, z1: g.console.z1, x2: g.console.x2, z2: g.console.z2, kind: 'fixed'},
      {label: `Lamp table ${ct.diameterMm}`, x1: ct.centerXmm - ct.diameterMm / 2, z1: ct.centerZmm - ct.diameterMm / 2, x2: ct.centerXmm + ct.diameterMm / 2, z2: ct.centerZmm + ct.diameterMm / 2, kind: 'table'},
      {label: `West cabinet door ${room.wallStorage.widthMm}`, x1: room.wallStorage.fromWestMm, z1: 0, x2: room.wallStorage.fromWestMm + room.wallStorage.widthMm, z2: 40, kind: 'fixed'},
    ],
    measured: [
      `South sofa seats: ${spread(check.views.southSofa)}.`,
      `West sofa seats: ${spread(check.views.westSofa)} (side-on, as in any L).`,
      `Gaps: south sofa to table ${mm(check.clearances.southSofaToTable)}, west sofa to table ${mm(check.clearances.westSofaToTable)}, table to the entry-door walking line ${mm(check.clearances.tableToEntryLine)}.`,
      `At about 4.7 m from the south sofa a 55-inch screen is small (common guides put 4.7 m at 75 inches or more); the 65-inch is the largest that fits this wall.`,
    ],
    issues: check.issues,
  }
}

// B2 and B3 share the seating, the router cabinet and the console; only the picture source differs.
function consoleLines(room) {
  const c = room.cornerLayout, k = c.console, g = consoleGeometry(room), fh = checkCornerConsole(room).fullHeight
  return [
    `Low console on the east wall: ${mm(k.depthMm)} (18 in) deep, ${mm(k.heightMm)} high, z ${g.z1}-${g.z2} (${mm(k.lengthMm)} long), dark walnut. The north ${mm(k.moduleBayMm)} is an open-lattice bay holding the Bose Bass Module 500; the rest is a lattice-fronted storage door. The Bose Soundbar 300 stands on top.`,
    `A floor-to-ceiling 18-inch unit was tested and does NOT fit: beside the north sofa it leaves ${mm(fh.laneBesideNorthSofa)} of walkway (needs 800), and the stretch clear of the sofa is ${mm(fh.lengthClearOfNorthSofa)} long while a TV bay needs ${mm(fh.bayNeeded['55'])} (55-inch) or ${mm(fh.bayNeeded['65'])} (65-inch). Cables would instead run in a recessed in-wall conduit from behind the TV down to the console.`,
  ]
}

function seatingAndCabinet(room) {
  const b = drawingLayoutB(room)
  return {lines: [b.lines[0], b.lines[1], b.lines[2]], cabinetLine: b.lines[5], items: [b.items[0], b.items[1], b.items[2]], cabinetItem: b.items[5]}
}

function drawingCornerConsole(room) {
  const c = room.cornerLayout, k = c.console, g = consoleGeometry(room), check = checkCornerConsole(room), base = seatingAndCabinet(room)
  const tv = k.tvs[k.installedTv], big = k.tvs['65'], p = check.poses[k.installedTv]
  const spot = (name, pose) => `${pose.headTurn.northSofa.angleDeg} degrees (north sofa) and ${pose.headTurn.westSofa.angleDeg} degrees (west sofa)`
  return {
    lines: [
      ...base.lines,
      ...consoleLines(room),
      `TV: ${tv.diagonalInches}-inch (${tv.widthMm} x ${tv.heightMm}) on a full-motion wall arm, centred ${mm(k.tvCenterFromNorthMm)} from the north wall, bottom edge ${mm(k.tvBottomMm)}. It pulls out up to ${mm(k.arm.maxExtendMm)} and turns. A 65-inch (${big.widthMm} x ${big.heightMm}) also fits the solid wall (z ${Math.round(check.tvs['65'].zRange[0])}-${Math.round(check.tvs['65'].zRange[1])}).`,
      base.cabinetLine,
    ],
    items: [...base.items, {label: `Console ${k.lengthMm}x${k.depthMm}`, x1: g.frontX, z1: g.z1, x2: g.face, z2: g.z2, kind: 'fixed'}, base.cabinetItem],
    measured: [
      `Walkway between the console front and the coffee table: ${mm(check.lane)}.`,
      `Head turn (angle off the direction each sofa faces) with the ${tv.diagonalInches}-inch TV flat: ${spot('flat', p.parked)}. Pulled out ${mm(k.arm.watchExtendMm)} and turned ${k.arm.watchSwivelDeg} degrees toward the north sofa: ${spot('watch', p.watch)}. The arm hardly changes how far the north-sofa viewer must turn their head.`,
      `Picture seen off-axis: north sofa ${p.parked.pictureOffAxis.northSofa} degrees flat, ${p.watch.pictureOffAxis.northSofa} degrees with the arm turned; west sofa ${p.parked.pictureOffAxis.westSofa} flat, ${p.watch.pictureOffAxis.westSofa} turned (turning toward one sofa moves the other away).`,
      `Walkway to the coffee table: ${mm(p.parked.laneToTable)} with the TV flat, ${mm(p.watch.laneToTable)} pulled out for watching, ${mm(p.fullReachLaneToTable)} at full reach (blocked): keep the arm folded when walking through.`,
    ],
    issues: check.issues,
  }
}

function drawingCornerProjector(room) {
  const c = room.cornerLayout, pr = c.projector, k = c.console, g = consoleGeometry(room), check = checkCornerProjector(room), base = seatingAndCabinet(room)
  const place = projectorPlacement(room), stubEnd = room.wallOpenings.east.fromMm, face = room.widthMm - WALL_FACE_MM
  const [z1, z2] = check.screen.zRange
  const f = c.furniture
  const seat = (sx, sz, facing) => { const dx = face - 140 - sx, dz = pr.centerFromNorthMm - sz, d = Math.hypot(dx, dz); return `${(d / 1000).toFixed(1)} m, ${Math.round(Math.acos((dx * facing[0] + dz * facing[1]) / d) * 180 / Math.PI)} degrees off its facing direction` }
  return {
    lines: [
      ...base.lines,
      ...consoleLines(room),
      `Drop-down screen (replaces the TV later): ${pr.screenDiagonalInches}-inch 16:9 (${pr.widthMm} x ${pr.heightMm}), bottom edge ${mm(pr.bottomMm)}, centred ${mm(pr.centerFromNorthMm)} from the north wall; it leaves ${mm(z1)} to the door wall and ${mm(stubEnd - z2)} to the end of the solid wall. The case is recessed in the ceiling.`,
      `Ceiling projector: throw ${mm(place.throwMm)} (ratio ${pr.throwRatio}), body ${pr.body.widthMm} x ${pr.body.heightMm} x ${pr.body.depthMm}, hanging ${mm(pr.ceilingDropMm)} below the ceiling at x ${Math.round(place.x)}, z ${Math.round(place.z)}, above ${place.over}. Needs a power and HDMI or network run to the ceiling.`,
      base.cabinetLine,
    ],
    items: [...base.items,
      {label: `Console ${k.lengthMm}x${k.depthMm}`, x1: g.frontX, z1: g.z1, x2: g.face, z2: g.z2, kind: 'fixed'},
      {label: `Screen ${pr.screenDiagonalInches}in`, x1: face - 160, z1, x2: face - 120, z2, kind: 'table'},
      {label: 'Projector', x1: place.x - pr.body.depthMm / 2, z1: place.z - pr.body.widthMm / 2, x2: place.x + pr.body.depthMm / 2, z2: place.z + pr.body.widthMm / 2, kind: 'seat'},
      base.cabinetItem],
    measured: [
      `Seats to the screen: west sofa ${seat(f.westSofa.centerXmm, f.westSofa.centerZmm, [1, 0])}; north sofa ${seat(f.northSofa.centerXmm, f.northSofa.centerZmm, [0, 1])}.`,
      'A projector picture can be seen from much wider angles than a TV, so the side-sofa picture problem goes away; the neck-turn problem of the north sofa stays.',
      `Walkway between the console front and the coffee table: ${mm(g.frontX - (f.coffeeTable.centerXmm + f.coffeeTable.widthMm / 2))}.`,
    ],
    issues: check.issues,
  }
}

// Labelled boxes for the top plan of rooms without a hand-written layout description. Rectangles are room-frame mm
// (x from the west wall, z from the north wall). Items outside the room outline (recess wardrobes, the Pooja alcove) are
// described in text only.
function genericPlanItems(roomKey, room) {
  const f = room.furniture ?? {}, W = room.widthMm, L = room.lengthMm, items = []
  const add = (label, x1, z1, x2, z2, kind) => items.push({label, x1: Math.max(0, x1), z1: Math.max(0, z1), x2: Math.min(W, x2), z2: Math.min(L, z2), kind})
  if (roomKey === 'lobby') {
    const t = f.diningTable, s = f.eastIroningStorage
    if (t) add(`Table ${t.lengthMm}x${t.widthMm}`, t.centerXmm - t.widthMm / 2, t.centerZmm - t.lengthMm / 2, t.centerXmm + t.widthMm / 2, t.centerZmm + t.lengthMm / 2, 'table')
    if (s) add(`Ironing unit ${s.lengthMm}x${s.depthMm}`, W - s.depthMm, s.fromNorthMm, W, s.fromNorthMm + s.lengthMm, 'fixed')
  }
  if (roomKey === 'bedroom1') {
    const b = f.bed, w = f.wardrobe
    if (b) add(`Bed ${b.lengthMm}x${b.widthMm}`, b.fromWestMm, L - b.fromSouthMm - b.widthMm, b.fromWestMm + b.lengthMm, L - b.fromSouthMm, 'seat')
    if (w) add(`Wardrobe ${w.lengthMm}x${w.depthMm}`, 0, w.fromNorthMm, w.depthMm, w.fromNorthMm + w.lengthMm, 'fixed')
  }
  if (roomKey === 'bedroom3') {
    const b = f.bed, w = f.westWardrobe
    if (b) add(`Bed ${b.lengthMm}x${b.widthMm}`, W - b.lengthMm, b.centerFromNorthMm - b.widthMm / 2, W, b.centerFromNorthMm + b.widthMm / 2, 'seat')
    if (w) add(`Wardrobe run ${w.lengthMm}x${w.depthMm}`, 0, w.fromNorthMm, w.depthMm, w.fromNorthMm + w.lengthMm, 'fixed')
    const chest = f.westChest
    if (chest) add(`West chest ${chest.widthMm}x${chest.depthMm}`, 0, chest.fromNorthMm, chest.depthMm, chest.fromNorthMm+chest.widthMm, 'fixed')
    const c = f.eastCabinet
    if (c) for (const [key, label] of [['north', 'NE dressing cabinet'], ['south', 'SE bedside cabinet']]) {
      const unit = c[key]
      add(`${label} ${unit.widthMm}x${c.depthMm}`, W-c.depthMm, unit.fromNorthMm, W, unit.fromNorthMm+unit.widthMm, 'fixed')
    }
  }
  return items
}

function describeExtras(room) {
  const lines = []
  if (room.openSide) lines.push(`This room is drawn open on its ${room.openSide} side.`)
  if (room.poojaAlcove) { const a = room.poojaAlcove; lines.push(`Pooja alcove on the ${a.wall} wall: ${mm(a.widthMm)} wide starting ${mm(a.fromMm)} from the west end, ${mm(a.depthMm)} deep beyond the wall (outside this room's outline), ${a.templeDepthMm ? `temple ${mm(a.templeDepthMm)} deep, ` : ''}seated-person platform ${mm(a.platformHeightMm)} high.`) }
  if (room.balconyExtension) { const b = room.balconyExtension; lines.push(`Enclosed balcony on the ${b.wall} side: ${mm(b.depthMm)} deep, ${mm(b.lengthMm)} long, railing ${mm(b.railingHeightMm)} (outside the main outline in the top plan).`) }
  if (room.southExtension) {
    const b = room.southExtension.balcony
    if (b?.enclosed) lines.push(`The south side has a projecting cabinet bay (x 0-${room.southExtension.cabinet.widthMm}) and an ENCLOSED balcony merged with the room (phone scan 2026-10-04): x ${b.fromWestMm}-${b.fromWestMm + b.widthMm}, ${mm(b.depthMm)} deep beyond the wall line, soffit ${mm(b.ceilingMm)}; the room opens into it ${mm(b.opening.toMm - b.opening.fromWestMm)} wide (x ${b.opening.fromWestMm}-${b.opening.toMm}) under a beam ${mm(b.opening.headMm)} high; window on its outer wall x ${b.outerWindow.fromWestMm}-${b.outerWindow.fromWestMm + b.outerWindow.widthMm}, sill ${mm(b.outerWindow.sillMm)}, head ${mm(b.outerWindow.topMm)}.`)
    else lines.push('The south side has a projecting cabinet and balcony (see the furniture list).')
  }
  if (room.furniture?.westChest) {
    const c=room.furniture.westChest,a=c.artwork,b=room.furniture.bed
    lines.push(`West honey-oak chest: ${c.widthMm} mm along the wall x ${c.depthMm} mm deep x ${c.heightMm} mm high, ${c.drawerRows*c.drawerColumns} drawers. Framed artwork ${a.widthMm} x ${a.heightMm} mm, bottom ${a.bottomMm} mm above floor. Closed chest to bed foot: ${room.widthMm-b.lengthMm-c.depthMm} mm.`)
  }
  if (room.furniture?.eastCabinet) lines.push('East bedside cabinetry: 18 inches (457.2 mm) overall depth, honey oak. Northeast mirror dressing cabinet, southeast low cabinet, overhead cupboards and a slatted AC cover with an open underside. AC dimensions are a concept placeholder; equipment, airflow and service access are not verified. The north cabinet starts 150 mm off the toilet wall; doorway approach and mirror-door use need site review.')
  if (room.name === 'Lobby / Dining') {
    const bounds = HOME_ROOM_LAYOUTS.find(r => r.name === room.name).bounds
    const span = closedDoorSpanMm(BEDROOM1_CLOSED_DOOR, bounds, room.widthMm)
    lines.push(`Closed old door on the north wall to Bedroom 1, x ${Math.round(span.start)}-${Math.round(span.end)} (about ${Math.round(span.end - span.start)} mm wide): sealed with a ${BEDROOM1_CLOSED_DOOR.sheet.thicknessMm} mm fibre-cement sheet flush with the lobby wall, with a shallow medicine cabinet in the cavity on the Bedroom 1 side. It reads as plain wall from the lobby. The working door to Bedroom 1 is the one 100 mm from the west end.`)
  }
  return lines
}

const FURNITURE_AXES = 'Furniture sizes: "width" runs along x (west-east) and "length" along z (north-south) unless a note says otherwise; sofas are the exception (width is the seat depth, length is the seat run). The "plan boxes" list gives the exact x and z range of each drawn box.'

// "2.7-3.2 m, 7-35 degrees" from a list of {distanceMm, angleDeg}
const spread = views => {
  const d = views.map(v => v.distanceMm / 1000), a = views.map(v => v.angleDeg)
  const r = (values, digits) => { const lo = Math.min(...values).toFixed(digits), hi = Math.max(...values).toFixed(digits); return lo === hi ? lo : `${lo}-${hi}` }
  return `${r(d, 1)} m from the TV, ${r(a, 0)} degrees off its facing direction`
}

export const REVIEW_TASKS = [
  'Review the layout for circulation, sight lines, seating distance and safety around the entry door. Point out anything that looks wrong or unbuildable.',
  'Say what you would change and why, keeping the same room size, openings and furniture sizes unless you explain why they must change.',
  'If asked to create a new render: keep the room proportions, wall openings, furniture sizes and positions exactly as drawn; only change materials, colours, lighting and styling.',
  'Tell me which of the dimensions above you could not verify from the pictures.',
]

export function buildRoomReview({roomKey, room, layoutKey = null, references = [], date = new Date()}) {
  const layoutLabel = roomKey === 'drawing' && layoutKey ? `Layout ${DRAWING_LAYOUT_LABELS[layoutKey]}` : null
  let layout = null
  if (roomKey === 'drawing') layout = {southSofas: drawingLayoutC, northTv: drawingLayoutA, cornerSofas: drawingLayoutB, cornerConsole: drawingCornerConsole, cornerProjector: drawingCornerProjector}[layoutKey ?? 'southSofas'](room)
  const dims = `${room.widthMm} x ${room.lengthMm} x ${room.heightMm} mm (width x length x ceiling)`
  const planItems = layout?.items ?? genericPlanItems(roomKey, room)
  const sections = [
    {heading: 'Room', lines: [`${room.name}, interior ${dims}. Source: ${room.source ?? 'app config'}.`, FRAME_NOTE, FURNITURE_AXES]},
    {heading: 'Openings and structure', lines: [...describeOpenings(room), ...describeExtras(room)]},
    {heading: layout ? 'This layout' : 'Furniture and fixtures', lines: layout ? layout.lines : describeGeneric(room)},
  ]
  if (planItems.length) sections.push({heading: 'Plan boxes (x range, z range in mm)', lines: planItems.map(i => `${i.label}: x ${Math.round(i.x1)}-${Math.round(i.x2)}, z ${Math.round(i.z1)}-${Math.round(i.z2)}`)})
  if (layout) sections.push({heading: 'Measured from the model', lines: layout.measured})
  if (layout?.issues.length) sections.push({heading: 'Known problems', lines: layout.issues})
  if (references.length) sections.push({heading: 'Style references (links)', lines: references.map(r => `${r.title}${r.tags?.length ? ` [${r.tags.join(', ')}]` : ''}: ${r.url}${r.notes ? ` - ${r.notes}` : ''}`)})
  sections.push({heading: 'Honest limits', lines: [
    'This is a simplified concept model, not a survey: sizes come from the floor plan and manufacturer specs, walls are drawn 85 mm thick, and textures/colours are placeholders.',
    'Nothing here is structural, electrical or fire-safety advice.',
  ]})
  // Local calendar date: toISOString() is UTC and reads a day behind for part of the day in time zones ahead of UTC.
  const iso = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  const title = `${room.name}${layoutLabel ? ` - ${layoutLabel}` : ''}`
  const text = [`# ${title}`, `Generated ${iso} by the Home Interior app. Units: millimetres.`,
    `The attached image should have the title "${title}" in its top-left corner. If it shows a different room or layout, say so before reviewing anything.`, '',
    ...sections.flatMap(s => [`## ${s.heading}`, ...s.lines.map(l => `- ${l}`), '']),
    '## What I would like from you', ...REVIEW_TASKS.map((t, i) => `${i + 1}. ${t}`), '',
    'The attached image has: a top plan with dimensions (south is at the top), a perspective overview, and the four walls seen from inside.'].join('\n')
  return {title, layoutLabel, iso, dims, sections, planItems, tasks: REVIEW_TASKS, text}
}
