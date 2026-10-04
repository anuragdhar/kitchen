// Balcony office west workstation: a fixed desk section in the south corner and a shorter electric sit-stand top north of
// it (pure: no React or Three.js). Millimetres. Room frame: x east from the west wall face, z south from the north wall
// face, y up from the floor. Sizes come from BALCONY_OFFICE.worktop (balconyOfficeConfig.js). BalconyOffice3D.jsx,
// WholeHome3D.jsx and the carpenter PDF place the desk parts from this layout, so the clearance check and the drawings
// cannot disagree.

const box = (name, x0, x1, y0, y1, z0, z1, extra = {}) => ({name, x0, x1, y0, y1, z0, z1, ...extra})

export const PANEL_MM = 25 // carcass panel thickness used for ends, bottoms and top rails
export const DIVIDER_MM = 18
export const BACK_MM = 20
export const FRONT_TIE_MM = 40 // the strip along the front edge of the rear cabinet top, between the desk-foot slots
export const FRAME_COLUMN_MM = 75 // square section of the sit-stand columns, and the width of their feet along the wall
export const FRAME_BEAM_WIDTH_MM = 85
export const MONITOR_SCREEN_BOTTOM_MM = 170 // lowest screen edge above the moving top (arm at its lowest)
export const MONITOR_GAP_MM = 45 // between the two screens on the arm
export const CLAMP_PAD_MM = 66 // monitor-arm clamp pad diameter, under the top
export const CLAMP_FROM_WEST_EDGE_MM = 70 // the arm post and clamp stand this far from the top's west edge

/** Remaining solid runs of [start, end] after cutting the given openings out of it, as [start, end] pairs. */
export function solidSegments(start, end, openings) {
  const cuts = openings.map(o => [Math.max(start, o.start ?? o[0]), Math.min(end, o.end ?? o[1])]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0])
  const out = []
  let at = start
  for (const [a, b] of cuts) { if (a > at) out.push([at, a]); at = Math.max(at, b) }
  if (end > at) out.push([at, end])
  return out
}

/** Screen width and height of a 16:9 monitor from its diagonal. */
export function monitorSizeMm(monitor) {
  const diagonal = monitor.diagonalInches * 25.4, k = Math.sqrt(16 * 16 + 9 * 9)
  return {widthMm: diagonal * 16 / k, heightMm: diagonal * 9 / k}
}

/**
 * Where everything on the west wall stands, from the config. Positions are absolute room millimetres (see the frame
 * above). `moving` is the sit-stand top at rest: its height is set separately (movingParts).
 */
export function balconyDeskLayout(office) {
  const L = office.dimensions.lengthMm, W = office.dimensions.widthMm, H = office.dimensions.floorToCeilingMm
  const wt = office.worktop, top = wt.westAdjustable, fixedCfg = wt.southFixed, rear = wt.rearCabinet
  const gapMm = wt.movingGapMm ?? 0
  const wallGapMm = top.wallClearanceMm ?? 0
  const fixedPresent = !!fixedCfg?.present
  const fixedLength = fixedPresent ? fixedCfg.lengthMm : 0
  const fixedStart = L - fixedLength
  const movingEnd = fixedStart - (fixedPresent ? (top.southClearanceMm ?? gapMm) : (top.southClearanceMm ?? 0))
  const movingStart = movingEnd - top.widthMm
  const moving = {x0: wallGapMm, x1: wallGapMm + top.depthMm, zStart: movingStart, zEnd: movingEnd, thicknessMm: top.topThicknessMm,
    minHeightMm: top.minHeightMm, maxHeightMm: top.maxHeightMm, defaultHeightMm: top.defaultHeightMm, lengthMm: top.widthMm}

  // Electric frame: two feet on the floor, columns through the rear cabinet, one beam under the top between the columns.
  const frameCenterZ = (movingStart + movingEnd) / 2 + (top.frameOffsetSouthMm || 0)
  const legZ = [frameCenterZ - top.frameSpanMm / 2, frameCenterZ + top.frameSpanMm / 2]
  const legX = rear.depthMm * .62
  const beamDepthMm = top.frameBeamDepthMm ?? 75
  const frame = {legX, legZ, footDepthMm: top.footDepthMm, columnMm: FRAME_COLUMN_MM, spanMm: top.frameSpanMm,
    beam: {x0: legX - FRAME_BEAM_WIDTH_MM / 2, x1: legX + FRAME_BEAM_WIDTH_MM / 2, depthMm: beamDepthMm},
    northOverhangMm: legZ[0] - movingStart, southOverhangMm: movingEnd - legZ[1],
    lowestUndersideMm: top.minHeightMm - top.topThicknessMm - beamDepthMm}

  // Low rear cabinet under the moving top, aligned with its north edge.
  const rearStart = movingStart, rearEnd = movingStart + rear.widthMm, toe = rear.toeClearanceMm, rearTop = rear.topHeightMm, rearD = rear.depthMm
  const bayLengths = rear.bayLengthsMm ?? Array.from({length: rear.bayCount}, () => rear.widthMm / rear.bayCount)
  const bays = []
  for (let i = 0, at = rearStart; i < bayLengths.length; at += bayLengths[i], i++) bays.push({index: i, start: at, end: at + bayLengths[i], lengthMm: bayLengths[i]})
  const bayLength = bayLengths[0]
  const pocket = {start: legZ[0] - rear.northLegPocketWidthMm / 2, end: legZ[0] + rear.northLegPocketWidthMm / 2}
  const slot = {start: legZ[1] - rear.legRemovalSlotWidthMm / 2, end: legZ[1] + rear.legRemovalSlotWidthMm / 2}
  const chaseBay = bays[Math.min(rear.clampChaseBay ?? rear.bayCount - 1, rear.bayCount - 1)]
  const chase = {start: chaseBay.start + 20, end: chaseBay.end - 20, depthMm: rear.centerClampChaseDepthMm, dropMm: rear.centerClampChaseDropMm, bay: chaseBay.index}
  // The top rail is open from the north foot pocket to the south foot slot: the frame beam travels there at low heights.
  const serviceOpening = {start: Math.min(pocket.start, chase.start), end: Math.max(slot.end, chase.end)}
  const dividerTopMm = Math.min(rearTop - PANEL_MM, frame.lowestUndersideMm - gapMm)
  const parts = []
  const add = (name, x0, x1, y0, y1, z0, z1, extra) => parts.push(box(name, x0, x1, y0, y1, z0, z1, extra))
  for (const [a, b] of solidSegments(rearStart, rearEnd, [chase])) add('rear cabinet back panel', 0, BACK_MM, toe, rearTop, a, b)
  add('rear cabinet back panel below the clamp chase', 0, BACK_MM, toe, rearTop - chase.dropMm, chase.start, chase.end)
  for (const [a, b] of solidSegments(rearStart, rearEnd, [pocket, slot])) add('rear cabinet bottom', 0, rearD, toe, toe + PANEL_MM, a, b)
  for (const [a, b] of solidSegments(rearStart, rearEnd, [serviceOpening])) add('rear cabinet top rail', 0, rearD, rearTop - PANEL_MM, rearTop, a, b)
  for (const [a, b] of solidSegments(serviceOpening.start, serviceOpening.end, [pocket, slot])) add('rear cabinet front tie', rearD - FRONT_TIE_MM, rearD, rearTop - PANEL_MM, rearTop, a, b)
  add('rear cabinet north end', 0, rearD, toe, rearTop, rearStart, rearStart + PANEL_MM)
  add('rear cabinet south end', 0, rearD, toe, rearTop, rearEnd - PANEL_MM, rearEnd)
  for (const bay of bays.slice(1)) add(`rear cabinet divider ${bay.index}`, 0, rearD, toe + PANEL_MM, dividerTopMm, bay.start - DIVIDER_MM / 2, bay.start + DIVIDER_MM / 2)
  const shelfY = toe + (rearTop - toe) / 2
  for (const [a, b] of solidSegments(chaseBay.start + 25, chaseBay.end - 25, [slot])) add('rear cabinet south bay shelf', BACK_MM + 15, rearD - 20, shelfY, shelfY + 22, a, b)
  add('clamp chase lip', chase.depthMm - 6, chase.depthMm + 6, rearTop - chase.dropMm, rearTop, chase.start, chase.end, {decorative: true})
  const rearLayout = {start: rearStart, end: rearEnd, depthMm: rearD, toeMm: toe, topMm: rearTop, bays, bayLengthMm: bayLength, pocket, slot, chase, serviceOpening, dividerTopMm, shelfY, parts}

  // PC tower stands in the north bay, south of the foot pocket, on the cabinet bottom.
  const pc = office.equipment.pcTower ?? {widthMm: 216, heightMm: 489, depthMm: 410}
  const pcStart = Math.max(bays[0].start + PANEL_MM + 10, pocket.end + 10)
  const pcTower = {x0: rearD / 2 - pc.widthMm / 2, x1: rearD / 2 + pc.widthMm / 2, y0: toe + PANEL_MM, y1: toe + PANEL_MM + pc.heightMm, zStart: pcStart, zEnd: pcStart + pc.depthMm, centerZ: pcStart + pc.depthMm / 2}

  // Fixed south section: same set-out from the wall as the moving top so the two fronts align, cabinet below to the floor.
  let fixed = null
  if (fixedPresent) {
    const t = fixedCfg.topThicknessMm, topY = fixedCfg.topHeightMm, under = fixedCfg.under ?? {}
    const x0 = wallGapMm, x1 = wallGapMm + fixedCfg.depthMm, uToe = under.toeClearanceMm ?? toe
    const cabinet = {x0, x1, y0: uToe, y1: topY - t, zStart: fixedStart, zEnd: L}
    const fparts = []
    const fadd = (name, ...rest) => fparts.push(box(name, ...rest))
    fadd('fixed section top', x0, x1, topY - t, topY, fixedStart, L)
    fadd('fixed cabinet bottom', x0, x1, uToe, uToe + PANEL_MM, fixedStart, L)
    fadd('fixed cabinet back', x0, x0 + BACK_MM, uToe, topY - t, fixedStart, L)
    fadd('fixed cabinet north side', x0, x1, uToe, topY - t, fixedStart, fixedStart + PANEL_MM)
    fadd('fixed cabinet south side', x0, x1, uToe, topY - t, L - PANEL_MM, L)
    const shelf = under.printerShelf
    let printerShelf = null, printer = null
    if (shelf) {
      const pr = office.equipment.printer ?? {widthMm: 446, depthMm: 332, heightMm: 189}
      const sy = uToe + PANEL_MM + (shelf.heightAboveBottomMm ?? 10)
      printerShelf = {x0: x1 - shelf.depthMm - 20, x1: x1 - 20, y0: sy, y1: sy + shelf.thicknessMm, zStart: fixedStart + (fixedLength - shelf.widthMm) / 2, zEnd: fixedStart + (fixedLength + shelf.widthMm) / 2}
      fparts.push(box('printer pull-out shelf', printerShelf.x0, printerShelf.x1, printerShelf.y0, printerShelf.y1, printerShelf.zStart, printerShelf.zEnd))
      const pcz = (printerShelf.zStart + printerShelf.zEnd) / 2
      printer = {x0: printerShelf.x1 - 30 - pr.depthMm, x1: printerShelf.x1 - 30, y0: printerShelf.y1, y1: printerShelf.y1 + pr.heightMm, zStart: pcz - pr.widthMm / 2, zEnd: pcz + pr.widthMm / 2, centerZ: pcz}
    }
    for (const y of under.shelfHeightsMm ?? []) fadd('fixed cabinet shelf', x0 + BACK_MM, x1 - 30, y, y + DIVIDER_MM, fixedStart + PANEL_MM, L - PANEL_MM)
    fixed = {x0, x1, zStart: fixedStart, zEnd: L, lengthMm: fixedLength, topHeightMm: topY, thicknessMm: t, cabinet, parts: fparts, printerShelf, printer,
      door: {x: x1 + 12, y0: uToe, y1: topY - t, zStart: fixedStart, zEnd: L, type: under.doors?.type ?? 'two-panel bypass sliding doors', panels: 2}}
  }

  // Dual monitors packed toward the north end of the moving top; the arm post and clamp between them.
  const stand = office.equipment.monitorStand
  const rightMonitor = office.equipment.monitors.find(m => m.side === 'right'), leftMonitor = office.equipment.monitors.find(m => m.side === 'left')
  const right = monitorSizeMm(rightMonitor), left = monitorSizeMm(leftMonitor)
  const northStart = movingStart - 15 + (stand.shiftLeftMm ?? 0)
  const rightCenterZ = northStart + right.widthMm / 2
  const leftCenterZ = northStart + right.widthMm + MONITOR_GAP_MM + left.widthMm / 2
  const standZ = (rightCenterZ + leftCenterZ) / 2
  const monitors = {northStart, right: {...right, centerZ: rightCenterZ}, left: {...left, centerZ: leftCenterZ}, standZ, screenBottomMm: MONITOR_SCREEN_BOTTOM_MM,
    southEdge: leftCenterZ + left.widthMm / 2, clamp: {x: moving.x0 + CLAMP_FROM_WEST_EDGE_MM, dropMm: stand.clampDropMm, padMm: CLAMP_PAD_MM}}

  // The laptop lives on the fixed section when there is one (seated height), otherwise at the south end of the moving top.
  const lp = office.equipment.laptop
  const laptop = fixed
    ? {on: 'fixed', centerZ: (fixed.zStart + fixed.zEnd) / 2, x0: fixed.x1 - 55 - lp.depthMm, x1: fixed.x1 - 55, topY: fixed.topHeightMm, widthMm: lp.widthMm, depthMm: lp.depthMm}
    : {on: 'moving', centerZ: Math.min(movingEnd - lp.widthMm / 2 - 35, monitors.southEdge + lp.widthMm / 2 + 30), x0: moving.x1 - 55 - lp.depthMm, x1: moving.x1 - 55, widthMm: lp.widthMm, depthMm: lp.depthMm}

  const north = office.cabinetry.northWall
  const northCabinet = {x0: W - north.lower.widthMm, x1: W, lower: {depthMm: north.lower.depthMm, heightMm: north.lower.heightMm}, upper: {depthMm: north.upper.depthMm, bottomMm: H - north.upper.heightMm}}
  return {roomMm: {W, L, H}, gapMm, wallGapMm, moving, frame, rear: rearLayout, pcTower, fixed, monitors, laptop, northCabinet}
}

/** The parts that move with the sit-stand top, as boxes, with the top surface at `heightMm`. */
export function movingParts(layout, heightMm) {
  const {moving: m, frame: f, monitors: mo} = layout
  const parts = [
    box('sit-stand top', m.x0, m.x1, heightMm - m.thicknessMm, heightMm, m.zStart, m.zEnd),
    box('frame beam', f.beam.x0, f.beam.x1, heightMm - m.thicknessMm - f.beam.depthMm, heightMm - m.thicknessMm, f.legZ[0], f.legZ[1]),
    box('monitor clamp', mo.clamp.x - mo.clamp.padMm / 2, mo.clamp.x + mo.clamp.padMm / 2, heightMm - m.thicknessMm - mo.clamp.dropMm - 6, heightMm - m.thicknessMm, mo.standZ - mo.clamp.padMm / 2, mo.standZ + mo.clamp.padMm / 2),
    box('monitors', m.x0 + 95, m.x0 + 160, heightMm + mo.screenBottomMm - 18, heightMm + mo.screenBottomMm + Math.max(mo.right.heightMm, mo.left.heightMm) + 18, mo.northStart - 18, mo.southEdge + 18),
  ]
  if (layout.laptop.on === 'moving') {
    const l = layout.laptop
    parts.push(box('laptop', l.x0, l.x1, heightMm, heightMm + 230, l.centerZ - l.widthMm / 2, l.centerZ + l.widthMm / 2))
  }
  return parts
}

/**
 * Everything the moving parts could meet: walls, the north cabinet, the rear cabinet carcass, the PC, the fixed section.
 * The frame's own columns and feet are not here (the top rides on them); their slots are checked in checkBalconyDesk.
 */
export function fixedObstacles(layout) {
  const {roomMm: {W, L, H}, rear, fixed, pcTower, northCabinet: n} = layout
  const big = 1e4
  const out = [
    box('west wall', -big, 0, 0, H, -big, big),
    box('south wall', -big, big, 0, H, L, big),
    box('north wall', -big, big, 0, H, -big, 0),
    box('north lower cabinet', n.x0, n.x1, 0, n.lower.heightMm, 0, n.lower.depthMm),
    box('north upper cabinet', n.x0, n.x1, n.upper.bottomMm, H, 0, n.upper.depthMm),
    box('PC tower', pcTower.x0, pcTower.x1, pcTower.y0, pcTower.y1, pcTower.zStart, pcTower.zEnd),
    ...rear.parts.filter(p => !p.decorative),
  ]
  if (fixed) {
    out.push(box('fixed section top', fixed.x0, fixed.x1, fixed.topHeightMm - fixed.thicknessMm, fixed.topHeightMm, fixed.zStart, fixed.zEnd))
    out.push(box('fixed section cabinet', fixed.cabinet.x0, fixed.cabinet.x1 + 30, fixed.cabinet.y0, fixed.cabinet.y1, fixed.cabinet.zStart, fixed.cabinet.zEnd))
  }
  return out
}

/** Smallest distance between two boxes along the axes; negative when they overlap. */
export function boxClearanceMm(a, b) {
  const sep = [Math.max(b.x0 - a.x1, a.x0 - b.x1), Math.max(b.y0 - a.y1, a.y0 - b.y1), Math.max(b.z0 - a.z1, a.z0 - b.z1)]
  const positive = sep.filter(s => s > 0)
  if (positive.length === 0) return Math.max(...sep)
  return Math.sqrt(positive.reduce((sum, s) => sum + s * s, 0))
}

/**
 * Sweeps the sit-stand top through its whole height range and reports the smallest clearance between each moving part
 * and each fixed thing. Moving parts need `worktop.movingGapMm` to everything they pass (the fixed section, walls, the
 * cabinets); the frame's own columns and feet only need to stay clear of the carcass (they do not move sideways).
 */
export function checkBalconyDesk(office, {stepMm = 1} = {}) {
  const layout = balconyDeskLayout(office)
  const top = office.worktop.westAdjustable, gap = layout.gapMm
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  need(gap >= 25, `the moving gap is ${gap} mm; the owner asked for one inch (25 mm)`)
  need(top.widthMm >= top.supportedTopWidthMm[0] && top.widthMm <= top.supportedTopWidthMm[1], `the ${top.widthMm} mm sit-stand top is outside the frame maker's ${top.supportedTopWidthMm.join('-')} mm range`)
  need(top.depthMm >= top.supportedTopDepthMm[0] && top.depthMm <= top.supportedTopDepthMm[1], `the ${top.depthMm} mm depth is outside the frame maker's ${top.supportedTopDepthMm.join('-')} mm range`)
  need(layout.frame.northOverhangMm >= 50 && layout.frame.southOverhangMm >= 50, `a frame foot is within 50 mm of the top's end (overhangs ${Math.round(layout.frame.northOverhangMm)} / ${Math.round(layout.frame.southOverhangMm)} mm)`)
  need(layout.rear.pocket.start >= layout.rear.start + PANEL_MM, 'the north desk-foot pocket cuts the rear cabinet end panel')
  need(layout.rear.slot.end <= layout.rear.end - PANEL_MM, 'the south desk-foot slot cuts the rear cabinet end panel')
  const column = layout.frame.columnMm
  need((layout.rear.pocket.end - layout.rear.pocket.start - column) / 2 >= 20, `the ${column} mm frame column has under 20 mm each side in the north foot pocket`)
  need((layout.rear.slot.end - layout.rear.slot.start - column) / 2 >= 20, `the ${column} mm frame column has under 20 mm each side in the south foot slot`)
  need(layout.rear.bays.every(b => b.lengthMm > 0) && Math.abs(layout.rear.end - layout.rear.start - layout.rear.bays.reduce((s, b) => s + b.lengthMm, 0)) < .5, 'the rear cabinet bays do not add up to its length')
  need(layout.rear.end <= layout.moving.zEnd, 'the rear cabinet runs past the moving top')
  need(layout.monitors.southEdge <= layout.moving.zEnd - 20, 'the second monitor hangs past the south end of the moving top')
  need(layout.monitors.standZ > layout.rear.chase.start && layout.monitors.standZ < layout.rear.chase.end, 'the monitor clamp is not over the rear clamp chase')
  need(layout.pcTower.zEnd <= layout.rear.bays[0].end - DIVIDER_MM / 2 - 10, 'the PC tower does not fit in the north bay beside the foot pocket')
  if (layout.fixed) {
    const f = layout.fixed, fx = office.worktop.southFixed
    need(f.zStart - layout.moving.zEnd >= gap, `only ${f.zStart - layout.moving.zEnd} mm between the moving top and the fixed section`)
    need(f.topHeightMm >= top.minHeightMm && f.topHeightMm <= top.maxHeightMm, `the fixed section top (${f.topHeightMm} mm) is outside the sit-stand range, so the two never line up`)
    need(fx.levelWith !== 'seatedPreset' || f.topHeightMm === top.seatedPresetMm, `the fixed section is ${f.topHeightMm} mm high but should match the ${top.seatedPresetMm} mm seated preset`)
    if (f.printer) need(f.printer.y1 <= f.cabinet.y1 - 20 && f.printer.zStart >= f.zStart + PANEL_MM && f.printer.zEnd <= f.zEnd - PANEL_MM, 'the printer does not fit in the fixed section cabinet')
  }
  need(layout.moving.zStart - layout.northCabinet.lower.depthMm >= gap, `only ${layout.moving.zStart - layout.northCabinet.lower.depthMm} mm between the moving top and the north cabinet`)

  const obstacles = fixedObstacles(layout)
  const worst = new Map()
  for (let h = top.minHeightMm; h <= top.maxHeightMm; h += stepMm) {
    for (const part of movingParts(layout, h)) {
      for (const ob of obstacles) {
        const c = boxClearanceMm(part, ob)
        const key = `${part.name} / ${ob.name}`
        const w = worst.get(key)
        if (!w || c < w.clearanceMm) worst.set(key, {moving: part.name, obstacle: ob.name, clearanceMm: Math.round(c * 10) / 10, atHeightMm: h, requiredMm: ob.frame ? 1 : gap})
      }
    }
  }
  const clearances = [...worst.values()].sort((a, b) => a.clearanceMm - b.clearanceMm)
  for (const c of clearances) need(c.clearanceMm >= c.requiredMm, `${c.moving} comes within ${c.clearanceMm} mm of the ${c.obstacle} at a top height of ${c.atHeightMm} mm (needs ${c.requiredMm})`)
  return {ok: issues.length === 0, issues, clearances, layout}
}
