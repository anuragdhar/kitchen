// The Drawing Room TV wall, layout C: which treatment is shown, and pure checks for the second one, a floor-to-ceiling strip of
// round-fronted timber slats over the hidden west cabinet door (room.southLayout.slatStrip; owner idea 2026-10-06, not chosen).
// No React, Three.js or DOM. Millimetres in the room frame: x from the west wall, z from the north wall LINE (the drawn wall
// face is WALL_FACE_MM in front of it), y up. Door frame: room.wallStorage. docs/changes/2026-10-06-slat-strip.md.
import {southTvGeometry, WALL_FACE_MM} from './drawingRoomLayout.mjs'
import {TRACK_TO_OBSTACLE_MM} from './drawingLighting.mjs'

/** The two treatments of the layout C TV wall; the first is the default (the full-width fluted panelling, room.southLayout.wallPanel). */
export const TV_WALL_TREATMENTS = [
  {key: 'panel', label: 'full panelling'},
  {key: 'slatStrip', label: 'slat strip at the hidden door'},
]
export const DEFAULT_TV_WALL = 'panel'
export const isTvWallTreatment = key => TV_WALL_TREATMENTS.some(t => t.key === key)

/** The treatment that is actually on the wall: the slat strip only when asked for and configured, else the panelling. */
export function tvWallTreatment(room, key = DEFAULT_TV_WALL) {
  return key === 'slatStrip' && room.southLayout?.slatStrip ? 'slatStrip' : 'panel'
}

/**
 * Where every slat of the strip goes. Slats are set out from the door's west edge with that edge in the middle of a gap, so
 * with a pitch that divides the door width both door edges fall in gaps. Returns the band, its slats (x1, x2, onLeaf), the
 * leaf (its body between the joints), the three height ranges (below the head reveal, the reveal, above it) and the depth.
 */
export function slatStripGeometry(room) {
  const s = room.southLayout.slatStrip, ws = room.wallStorage
  const pitch = s.slatWidthMm + s.gapMm, half = s.gapMm / 2
  const door = {x1: ws.fromWestMm, x2: ws.fromWestMm + ws.widthMm, bottomMm: ws.bottomMm, headMm: ws.bottomMm + ws.heightMm}
  const slats = []
  // West of the door: whole slats back toward the corner while they fit; the rest at the corner is a shadow gap.
  for (let x2 = door.x1 - half; x2 - s.slatWidthMm >= s.fromWestMm; x2 -= pitch) slats.unshift({x1: x2 - s.slatWidthMm, x2, onLeaf: false})
  // On the leaf: whole slats while they end at least half a gap short of the east edge.
  for (let x1 = door.x1 + half; x1 + s.slatWidthMm <= door.x2 - half + 1e-9; x1 += pitch) slats.push({x1, x2: x1 + s.slatWidthMm, onLeaf: true})
  // East of the door: the fixed slats that close the band.
  const lastLeaf = slats.filter(slat => slat.onLeaf).at(-1)
  for (let i = 1; i <= s.fixedSlatsEastOfDoor; i++) { const x1 = (lastLeaf?.x2 ?? door.x2 - half) + s.gapMm + (i - 1) * pitch; slats.push({x1, x2: x1 + s.slatWidthMm, onLeaf: false}) }
  const band = {x1: s.fromWestMm, x2: slats.at(-1).x2}
  const revealBottom = door.headMm - s.headReveal.belowHeadMm, revealTop = revealBottom + s.headReveal.heightMm
  const rows = {lower: {y1: s.bottomGapMm, y2: revealBottom}, reveal: {y1: revealBottom, y2: revealTop}, upper: {y1: revealTop, y2: room.heightMm - s.topGapMm}}
  const leaf = {x1: door.x1 + s.leafJointsMm.hinge, x2: door.x2 - s.leafJointsMm.lock, bottomMm: s.bottomGapMm, topMm: revealBottom}
  // Round-fronted profile: a circular segment slatWidthMm across and slatDepthMm deep; its circle's radius and half-angle.
  const radiusMm = ((s.slatWidthMm / 2) ** 2 + s.slatDepthMm ** 2) / (2 * s.slatDepthMm)
  const halfAngleRad = Math.asin(s.slatWidthMm / 2 / radiusMm)
  return {
    pitchMm: pitch, door, slats, band, rows, leaf, cornerGapMm: slats[0].x1 - s.fromWestMm,
    depthMm: s.slatDepthMm, frontZ: WALL_FACE_MM + s.slatDepthMm, profile: {radiusMm, halfAngleRad},
    counts: {total: slats.length, leaf: slats.filter(slat => slat.onLeaf).length, westOfDoor: slats.filter(slat => !slat.onLeaf && slat.x2 <= door.x1).length, eastOfDoor: s.fixedSlatsEastOfDoor},
    areaM2: (band.x2 - band.x1) * room.heightMm / 1e6,
  }
}

// ---- The leaf with its slats, turning outward ----

const inside = (p, r) => p.x > r.x1 + 1e-6 && p.x < r.x2 - 1e-6 && p.z > r.z1 + 1e-6 && p.z < r.z2 - 1e-6

/**
 * Sweeps the slatted leaf outward about a vertical axis on its hinge (west) edge, in 1 degree steps up to `maxDeg`, and returns
 * the first angle at which it touches something (the west jamb, the east jamb, the fixed slats either side, the west wall), or
 * null if it never does. `axis`: 'slat front' (the offset pivot of the config: axis at the front face of the slats) or
 * 'leaf face' (an ordinary concealed hinge, axis at the leaf's room face), to show why the pivot is offset.
 */
export function slatLeafSwing(room, {axis = room.southLayout.slatStrip.pivot.axis, maxDeg = 100} = {}) {
  const g = slatStripGeometry(room), ws = room.wallStorage, T = ws.leafThicknessMm ?? 40, face = WALL_FACE_MM
  const pivot = {x: g.leaf.x1, z: axis === 'slat front' ? face + g.depthMm : face}
  // The leaf in its own frame: a along it from the hinge edge, e outward from the pivot plane (closed: body behind the face).
  const eFace = face - pivot.z, parts = [
    {a1: 0, a2: g.leaf.x2 - g.leaf.x1, e1: eFace - T, e2: eFace},
    ...g.slats.filter(slat => slat.onLeaf).map(slat => ({a1: slat.x1 - pivot.x, a2: slat.x2 - pivot.x, e1: eFace, e2: eFace + g.depthMm})),
  ]
  const samples = parts.flatMap(({a1, a2, e1, e2}) => {
    const out = []
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) out.push({a: a1 + (a2 - a1) * i / 8, e: e1 + (e2 - e1) * j / 4})
    return out
  })
  const wallBack = face - 400 // deeper than the wall: the jambs are solid from the face back
  const obstacles = [
    {name: 'the west jamb', x1: face - 1000, x2: g.door.x1, z1: wallBack, z2: face},
    {name: 'the east jamb', x1: g.door.x2, x2: g.door.x2 + 1000, z1: wallBack, z2: face},
    {name: 'the west wall', x1: -1000, x2: face, z1: wallBack, z2: room.lengthMm},
    ...g.slats.filter(slat => !slat.onLeaf).map(slat => ({name: `the fixed slat at x ${slat.x1}-${slat.x2}`, x1: slat.x1, x2: slat.x2, z1: face, z2: face + g.depthMm})),
  ]
  for (let deg = 1; deg <= maxDeg; deg++) {
    const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t)
    for (const {a, e} of samples) {
      const p = {x: pivot.x + a * c - e * s, z: pivot.z + a * s + e * c}
      const hit = obstacles.find(o => inside(p, o))
      if (hit) return {touchesAtDeg: deg, what: hit.name, pivot}
    }
  }
  return {touchesAtDeg: null, what: null, pivot, freeToDeg: maxDeg}
}

/** How far the slatted leaf reaches into the room while it swings (from the wall face): its width plus the slat depth at most. */
export function slatLeafReachMm(room) {
  const g = slatStripGeometry(room), axis = room.southLayout.slatStrip.pivot.axis
  const w = g.leaf.x2 - g.leaf.x1
  return Math.round(axis === 'slat front' ? g.depthMm + w : Math.hypot(w, g.depthMm))
}

// ---- Checks ----

/**
 * Checks the slat strip against the hidden door, the TV in each size, the console (in place and dragged out), the ceiling
 * mouldings, Track 1, and the planned north-wall electrical points and cable routes. Lighting and electrical configs are passed
 * in (so this stays a function of its inputs): `mouldings` = DRAWING_CEILING_MOULDINGS, `tracks` = the layout's track runs,
 * `points` = DRAWING_ELECTRICAL.points, `routes` = DRAWING_LIGHT_FEEDS.routes. Issues are errors; clearances are reported.
 */
export function checkSlatStrip(room, {mouldings = null, tracks = [], points = [], routes = []} = {}) {
  const s = room.southLayout.slatStrip, issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const g = slatStripGeometry(room), k = room.southLayout.console
  // The door is covered, nothing is cut, and both door edges sit in gaps with room for the joint either side.
  need(g.band.x1 <= g.door.x1 && g.band.x2 >= g.door.x2, `the strip (x ${g.band.x1}-${g.band.x2}) does not cover the hidden door (x ${g.door.x1}-${g.door.x2})`)
  need(g.band.x1 >= WALL_FACE_MM, 'the strip starts inside the west wall')
  need(Math.abs((g.door.x2 - g.door.x1) / g.pitchMm - Math.round((g.door.x2 - g.door.x1) / g.pitchMm)) < 1e-9, `the ${g.door.x2 - g.door.x1} mm door is not a whole number of ${g.pitchMm} mm slat pitches, so a slat would be cut at an edge`)
  const edges = [{name: 'west (hinge)', x: g.door.x1, joint: s.leafJointsMm.hinge}, {name: 'east (lock)', x: g.door.x2, joint: s.leafJointsMm.lock}]
  const edgeGaps = {}
  for (const edge of edges) {
    const west = g.slats.filter(slat => slat.x2 <= edge.x).at(-1), east = g.slats.find(slat => slat.x1 >= edge.x)
    const crossing = g.slats.find(slat => slat.x1 < edge.x && slat.x2 > edge.x)
    need(!crossing, `a slat (x ${crossing?.x1}-${crossing?.x2}) crosses the door's ${edge.name} edge at x ${edge.x}`)
    edgeGaps[edge.name] = {westSlatEndsMm: west ? edge.x - west.x2 : null, eastSlatStartsMm: east ? east.x1 - edge.x : null}
    need(west && east, `the door's ${edge.name} edge is not between two slats`)
    // The joint (gap between leaf and jamb) must lie inside the slat gap.
    const jointWest = edge.name.startsWith('west') ? edge.x : edge.x - edge.joint, jointEast = edge.name.startsWith('west') ? edge.x + edge.joint : edge.x
    need(west && east && jointWest >= west.x2 && jointEast <= east.x1, `the ${edge.joint} mm joint at the door's ${edge.name} edge is not inside the slat gap`)
  }
  need(g.slats.every(slat => slat.onLeaf ? slat.x1 >= g.leaf.x1 && slat.x2 <= g.leaf.x2 : slat.x2 <= g.door.x1 || slat.x1 >= g.door.x2), 'a slat is half on the leaf and half on the wall')
  need(g.cornerGapMm >= 0 && g.cornerGapMm < s.slatWidthMm, `the corner gap is ${g.cornerGapMm} mm: another slat would fit (or one is cut)`)
  // Heights: the leaf's slats stop under the head reveal, the fixed ones above it; the reveal holds the door head.
  need(g.rows.reveal.y1 <= g.door.headMm && g.rows.reveal.y2 >= g.door.headMm, `the door head (${g.door.headMm}) is not inside the reveal (${g.rows.reveal.y1}-${g.rows.reveal.y2})`)
  need(g.rows.lower.y1 >= g.door.bottomMm && g.rows.upper.y2 <= room.heightMm, 'the slats run past the floor or the ceiling')

  // The leaf opens outward and swings clear of the jambs and the fixed slats; the console is dragged out of its way first.
  const swing = slatLeafSwing(room), ordinaryHinge = slatLeafSwing(room, {axis: 'leaf face'})
  need(swing.touchesAtDeg == null || swing.touchesAtDeg >= 90, `the slatted leaf touches ${swing.what} at ${swing.touchesAtDeg} degrees; it must open at least 90`)
  const reachMm = slatLeafReachMm(room)
  const draggedConsoleBack = southTvGeometry(room).console.z1 + k.dragOutMm
  const leafClearOfDraggedConsoleMm = draggedConsoleBack - (WALL_FACE_MM + reachMm)
  need(leafClearOfDraggedConsoleMm >= 50, `the slatted leaf sweeps ${reachMm} mm into the room but the console dragged out ${k.dragOutMm} mm leaves only ${leafClearOfDraggedConsoleMm} mm`)

  // The TV in each size stands beside the strip, not in front of it; the console stands in front of its east end.
  const tvs = {}
  for (const key of Object.keys(room.southLayout.tv.tvs)) {
    const t = southTvGeometry(room, key), backZ = t.frontZ - t.tv.depthMm
    tvs[key] = {xGapMm: t.x1 - g.band.x2, zGapMm: backZ - g.frontZ}
    need(tvs[key].xGapMm >= s.tvClearMinMm, `the ${key}-inch TV (from x ${t.x1}) is ${tvs[key].xGapMm} mm from the strip (to x ${g.band.x2}); keep ${s.tvClearMinMm}`)
  }
  const c = southTvGeometry(room).console
  const consoleOverlapMm = Math.max(0, Math.min(c.x2, g.band.x2) - Math.max(c.x1, g.band.x1))
  const consoleClearMm = c.z1 - g.frontZ
  need(consoleOverlapMm === 0 || consoleClearMm >= s.consoleClearMinMm, `the TV console's back (z ${c.z1}) is ${consoleClearMm} mm from the slat fronts (z ${g.frontZ}); keep ${s.consoleClearMinMm}`)

  // Ceiling: the slats run up to the ceiling at the wall; the plaster border and the corner ring start further out.
  const ceiling = {}
  if (mouldings) {
    ceiling.toBorderMm = mouldings.border.north.fromMm - g.frontZ
    ceiling.toCornerRingMm = mouldings.cornerRings.fromMm - g.frontZ
    need(ceiling.toBorderMm > 0 && ceiling.toCornerRingMm > 0, 'the strip runs into the ceiling moulding')
  }
  for (const run of tracks.filter(r => r.axis === 'x')) {
    const xGap = Math.max(run.fromMm - g.band.x2, g.band.x1 - run.toMm, 0), zGap = run.atMm - g.frontZ
    ceiling[run.id] = {xGapMm: xGap, zGapMm: zGap}
    need(Math.max(xGap, zGap) >= TRACK_TO_OBSTACLE_MM, `${run.id} passes within ${TRACK_TO_OBSTACLE_MM} mm of the full-height strip`)
  }
  // Planned points on the north wall and cable routes along it: under the strip they would be covered (reported).
  const northPoints = points.filter(p => p.wall === 'north').map(p => ({id: p.id, alongMm: p.alongMm, fromBandMm: p.alongMm >= g.band.x2 ? p.alongMm - g.band.x2 : p.alongMm <= g.band.x1 ? g.band.x1 - p.alongMm : 0}))
  const pointsUnderStrip = northPoints.filter(p => p.fromBandMm === 0).map(p => p.id)
  need(pointsUnderStrip.length === 0, `planned electrical points ${pointsUnderStrip.join(', ')} would be behind the slats`)
  const routesUnderStrip = []
  for (const route of routes) for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i - 1], b = route.points[i]
    if (a.zMm !== 0 || b.zMm !== 0) continue // only legs on the north wall face
    const lo = Math.max(Math.min(a.xMm, b.xMm), g.band.x1), hi = Math.min(Math.max(a.xMm, b.xMm), g.band.x2)
    if (hi >= lo) routesUnderStrip.push({id: route.id, label: route.label, xFromMm: lo, xToMm: hi, heightMm: Math.min(a.yMm, b.yMm)})
  }
  return {
    ok: issues.length === 0, issues, geometry: g,
    clearances: {
      edgeGaps, cornerGapMm: g.cornerGapMm, swing: {offsetPivotTouchesAtDeg: swing.touchesAtDeg, ordinaryHingeTouchesAtDeg: ordinaryHinge.touchesAtDeg, ordinaryHingeTouches: ordinaryHinge.what},
      leafReachMm: reachMm, leafClearOfDraggedConsoleMm, consoleOverlapMm, consoleClearMm, tvs, ceiling,
      nearestNorthPointMm: Math.min(...northPoints.map(p => p.fromBandMm).filter(d => d > 0), Infinity),
      northPoints, routesUnderStrip,
    },
  }
}
