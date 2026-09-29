// Builds the facts an outside reviewer (a person or an online AI) needs about a room, from the same
// config the 3D scenes use. Pure: no React, Three.js or DOM. Units are millimetres unless stated.
import {checkDrawingRoomLayout, checkCornerLayout, tvWallGeometry, cornerTvFrontX, WALL_FACE_MM} from './drawingRoomLayout.mjs'

const mm = v => `${Math.round(v)} mm`
const size = (a, b) => `${Math.round(a)} x ${Math.round(b)}`
export const DRAWING_LAYOUT_LABELS = {
  northTv: 'A: TV on the north wall',
  cornerSofas: 'B: corner sofas, TV on the east wall',
}

// Frame used everywhere in the app's room scenes.
export const FRAME_NOTE = 'Room frame: x runs from the WEST wall (x=0) to the EAST wall, z runs from the NORTH wall (z=0) to the SOUTH wall, y is up. '
  + 'Plan north is the wall at z=0. The app\'s top view is drawn with SOUTH at the top of the picture, so left-right is mirrored compared with a normal north-up plan.'

function describeOpenings(room) {
  const lines = []
  for (const d of room.doors ?? []) lines.push(`Door on the ${d.wall} wall: ${mm(d.widthMm)} wide x ${mm(d.heightMm)} high, starting ${mm(d.fromMm)} from the ${d.wall === 'north' || d.wall === 'south' ? 'west' : 'north'} end, leads to ${d.leadsTo}.`)
  for (const w of room.windows ?? []) lines.push(`Window on the ${w.wall} wall: ${mm(w.widthMm)} wide, sill ${mm(w.bottomMm)}, head ${mm(w.topMm)}, starting ${mm(w.fromMm)} from the west end.`)
  for (const [wall, o] of Object.entries(room.wallOpenings ?? {})) lines.push(`Open (no wall) on the ${wall} side from ${mm(o.fromMm)} to ${mm(o.toMm)}.`)
  for (const b of room.hangingBeams ?? []) lines.push(`Ceiling beam along the ${b.wall} side from ${mm(b.fromMm)} to ${mm(b.toMm)}, drops ${mm(b.dropMm)}.`)
  return lines
}

function describeItem(key, item) {
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
  const bm = c.bassModule, rc = c.routerCabinet, bmX2 = room.widthMm - WALL_FACE_MM - bm.fromWallMm
  return {
    lines: [
      `North-wall 3-seater: centre (${f.northSofa.centerXmm}, ${f.northSofa.centerZmm}), ${size(f.northSofa.lengthMm, f.northSofa.widthMm)}, back on the north wall, faces south. Its east end passes the entry-door edge line by ${mm(check.clearances.northSofaPastDoorJambLine)}.`,
      `West-wall 3-seater: centre (${f.westSofa.centerXmm}, ${f.westSofa.centerZmm}), ${size(f.westSofa.widthMm, f.westSofa.lengthMm)}, back on the west wall, faces east, ${mm(check.clearances.sofaToSofa)} south of the north sofa (an L).`,
      `Oval coffee table: centre (${f.coffeeTable.centerXmm}, ${f.coffeeTable.centerZmm}), ${size(f.coffeeTable.widthMm, f.coffeeTable.lengthMm)}. Rug under the L.`,
      `65-inch TV (${c.tv.widthMm} x ${c.tv.heightMm} mm) wall-mounted flat on the solid east wall, z ${Math.round(tvZ1)}-${Math.round(tvZ2)}, bottom edge ${mm(c.tv.bottomMm)}, sticks out ${mm(c.tv.depthMm + c.tv.mountMm)}. The east wall is solid only from z=0 to ${room.wallOpenings.east.fromMm}; beyond that it opens to the Lobby.`,
      `Bose Smart Soundbar 300 (${c.soundbar.widthMm} x ${c.soundbar.heightMm} x ${c.soundbar.depthMm}) on the wall under the TV; Bose Bass Module 500 (${bm.widthMm} x ${bm.heightMm} x ${bm.depthMm}) on the floor below it, centre z ${bm.centerFromNorthMm}.`,
      `Small wall-hung cabinet above the north sofa: x ${rc.fromWestMm}-${rc.fromWestMm + rc.widthMm}, ${mm(rc.bottomMm)}-${mm(rc.bottomMm + rc.heightMm)} high, ${mm(rc.depthMm)} deep, holding the Wi-Fi router (open lattice), a landline phone and an intercom.`,
    ],
    items: [
      {label: `Sofa ${f.northSofa.lengthMm}x${f.northSofa.widthMm}`, x1: f.northSofa.centerXmm - f.northSofa.lengthMm / 2, z1: f.northSofa.centerZmm - f.northSofa.widthMm / 2, x2: f.northSofa.centerXmm + f.northSofa.lengthMm / 2, z2: f.northSofa.centerZmm + f.northSofa.widthMm / 2, kind: 'seat'},
      {label: `Sofa ${f.westSofa.lengthMm}x${f.westSofa.widthMm}`, x1: f.westSofa.centerXmm - f.westSofa.widthMm / 2, z1: f.westSofa.centerZmm - f.westSofa.lengthMm / 2, x2: f.westSofa.centerXmm + f.westSofa.widthMm / 2, z2: f.westSofa.centerZmm + f.westSofa.lengthMm / 2, kind: 'seat'},
      {label: `Table ${f.coffeeTable.lengthMm}x${f.coffeeTable.widthMm}`, x1: f.coffeeTable.centerXmm - f.coffeeTable.widthMm / 2, z1: f.coffeeTable.centerZmm - f.coffeeTable.lengthMm / 2, x2: f.coffeeTable.centerXmm + f.coffeeTable.widthMm / 2, z2: f.coffeeTable.centerZmm + f.coffeeTable.lengthMm / 2, kind: 'table'},
      {label: `TV ${c.tv.widthMm}`, x1: frontX, z1: tvZ1, x2: room.widthMm - WALL_FACE_MM, z2: tvZ2, kind: 'fixed'},
      {label: 'Bass Module', x1: bmX2 - bm.depthMm, z1: bm.centerFromNorthMm - bm.widthMm / 2, x2: bmX2, z2: bm.centerFromNorthMm + bm.widthMm / 2, kind: 'fixed'},
      {label: `Cabinet ${rc.widthMm}x${rc.depthMm}`, x1: rc.fromWestMm, z1: 0, x2: rc.fromWestMm + rc.widthMm, z2: rc.depthMm, kind: 'fixed'},
    ],
    measured: [
      `West sofa seats: ${spread(check.views.westSofa)}.`,
      `North sofa seats: ${spread(check.views.northSofa)}.`,
      `Walking lane between the north sofa end and the TV: ${mm(check.clearances.laneNorthSofaToTv)}; table to TV: ${mm(check.clearances.laneTableToTv)}; at the bass module: ${mm(check.clearances.laneBassModule)}.`,
      `Entry door: ${mm(check.clearances.doorClearPastNorthSofa)} still clear past the north sofa; the TV front is ${mm(check.clearances.tvFrontBeyondDoorEastJamb)} beyond the door's east edge line. The door swings OUT into the Main Entry, not into this room.`,
    ],
    issues: check.issues,
  }
}

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
  if (roomKey === 'drawing') layout = layoutKey === 'northTv' ? drawingLayoutA(room) : drawingLayoutB(room)
  const dims = `${room.widthMm} x ${room.lengthMm} x ${room.heightMm} mm (width x length x ceiling)`
  const sections = [
    {heading: 'Room', lines: [`${room.name}, interior ${dims}. Source: ${room.source ?? 'app config'}.`, FRAME_NOTE]},
    {heading: 'Openings and structure', lines: describeOpenings(room)},
    {heading: layout ? 'This layout' : 'Furniture and fixtures', lines: layout ? layout.lines : describeGeneric(room)},
  ]
  if (layout) sections.push({heading: 'Measured from the model', lines: layout.measured})
  if (layout?.issues.length) sections.push({heading: 'Known problems', lines: layout.issues})
  if (references.length) sections.push({heading: 'Style references (links)', lines: references.map(r => `${r.title}${r.tags?.length ? ` [${r.tags.join(', ')}]` : ''}: ${r.url}${r.notes ? ` - ${r.notes}` : ''}`)})
  sections.push({heading: 'Honest limits', lines: [
    'This is a simplified concept model, not a survey: sizes come from the floor plan and manufacturer specs, walls are drawn 85 mm thick, and textures/colours are placeholders.',
    'Nothing here is structural, electrical or fire-safety advice.',
  ]})
  const iso = date.toISOString().slice(0, 10)
  const title = `${room.name}${layoutLabel ? ` - ${layoutLabel}` : ''}`
  const text = [`# ${title}`, `Generated ${iso} by the Home Interior app. Units: millimetres.`, '',
    ...sections.flatMap(s => [`## ${s.heading}`, ...s.lines.map(l => `- ${l}`), '']),
    '## What I would like from you', ...REVIEW_TASKS.map((t, i) => `${i + 1}. ${t}`), '',
    'The attached image has: a top plan with dimensions (south is at the top), a perspective overview, and the four walls seen from inside.'].join('\n')
  return {title, layoutLabel, iso, dims, sections, planItems: layout?.items ?? [], tasks: REVIEW_TASKS, text}
}
