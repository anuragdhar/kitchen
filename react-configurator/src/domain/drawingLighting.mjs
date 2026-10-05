// Pure checks for surface track lights and ceiling fans in any room (millimetres, no React or Three.js).
// Room frame: x from the west wall, z from the north wall. Configs: src/config/*LightingConfig.js.
//
// Circuit rule (owner 2026-10-04): the heads on one track run cannot be dimmed separately; the whole run dims together.
// So one run = one circuit, with its own 48 V driver (run.driverWatts) and its own wall dimmer. The mix of light on a run
// is fixed by which heads are clipped on, and the driver limit applies per run.

export const TRACK_TO_BLADE_MM = 50        // a track run must stay this far outside every fan's blade circle
export const DIFFUSE_TO_BLADE_MM = 300     // a diffused or down-pointing head shines down, so it stays further out (flicker)
export const DRIVER_LOAD_FRACTION = 0.8    // do not load a run's 48 V driver beyond this
export const TRACK_TO_OBSTACLE_MM = 100    // a run keeps this far from furniture or wall cabinets that reach the ceiling
export const READING_TILT_MAX_DEG = 35     // an aimed reading head still lights from above, not into the eyes, up to this tilt
export const READING_TARGET_HEIGHT_MM = 600 // a book on the lap or chest of someone sitting or lying (counters pass their own)
// Existing plaster ceiling mouldings (config.ceilingMouldings, optional). A track cannot be screwed flat across a raised
// moulding, so the centre line of a run and of each head's base stays this far from every moulding edge: 11 mm for half the
// 22 mm section, about 9 mm for the lug of a fixing clip or end feed, and 20 mm for the accuracy of the scan.
export const TRACK_TO_MOULDING_MM = 40
export const SPOT_TO_WALL_MAX_MM = 1000    // a wall spot further than this from its wall lights the floor, not the wall

/**
 * The mouldings of a room as plan shapes in the room frame (x from the west wall, z from the north wall):
 * rectangles {label, kind, x1, x2, z1, z2} for the four border bands and the four corner rings, and circles
 * {label, kind, x, z, radius} for the medallions. `mouldings` is a config ceilingMouldings record: border[wall] =
 * {fromMm, toMm} measured from that wall; cornerRings = {fromMm, reachMm: {north, east, south, west}}, the square each
 * corner's ring fills, measured from its two walls; medallions = [{xMm, zMm, diameterMm, label}].
 */
export function mouldingShapes(room, mouldings) {
  if (!mouldings) return []
  const W = room.widthMm, L = room.lengthMm, b = mouldings.border, shapes = []
  if (b) shapes.push(
    {label: 'north border moulding', kind: 'border', x1: b.west.fromMm, x2: W - b.east.fromMm, z1: b.north.fromMm, z2: b.north.toMm},
    {label: 'south border moulding', kind: 'border', x1: b.west.fromMm, x2: W - b.east.fromMm, z1: L - b.south.toMm, z2: L - b.south.fromMm},
    {label: 'west border moulding', kind: 'border', x1: b.west.fromMm, x2: b.west.toMm, z1: b.north.fromMm, z2: L - b.south.fromMm},
    {label: 'east border moulding', kind: 'border', x1: W - b.east.toMm, x2: W - b.east.fromMm, z1: b.north.fromMm, z2: L - b.south.fromMm})
  const r = mouldings.cornerRings
  if (r) for (const [ns, ew] of [['north', 'west'], ['north', 'east'], ['south', 'west'], ['south', 'east']]) shapes.push({
    label: `${ns}-${ew} corner ring`, kind: 'ring',
    x1: ew === 'west' ? r.fromMm : W - r.reachMm.east, x2: ew === 'west' ? r.reachMm.west : W - r.fromMm,
    z1: ns === 'north' ? r.fromMm : L - r.reachMm.south, z2: ns === 'north' ? r.reachMm.north : L - r.fromMm})
  for (const m of mouldings.medallions ?? []) shapes.push({label: m.label, kind: 'medallion', x: m.xMm, z: m.zMm, radius: m.diameterMm / 2})
  return shapes
}

/** Plan position of a head on its run. */
export function headPosition(run, head) {
  return run.axis === 'x' ? {x: head.atMm, z: run.atMm} : {x: run.atMm, z: head.atMm}
}

/** Where a down-pointing ('reading') head shines: straight below it, or at head.targetMm ({xMm, zMm}) when it is aimed. */
export function readingTarget(run, head) {
  if (head.targetMm) return {x: head.targetMm.xMm, z: head.targetMm.zMm}
  return headPosition(run, head)
}

/** Tilt of a reading head from vertical, in degrees, for a ceiling at ceilingMm (0 when it points straight down). */
export function readingTiltDeg(run, head, ceilingMm) {
  const at = headPosition(run, head), target = readingTarget(run, head)
  const drop = ceilingMm - 160 - (head.targetHeightMm ?? READING_TARGET_HEIGHT_MM) // the lens hangs about 160 mm below the slab
  return Math.atan2(Math.hypot(target.x - at.x, target.z - at.z), drop) * 180 / Math.PI
}

/**
 * The same tracks seen in the mirrored frame x' = widthMm - x, z' = lengthMm - z (both axes flipped, so aims swap too).
 * The kitchen planner's 3D view needs it: its x runs west and its z runs north (rooms/kitchen/KitchenTrackLights.js).
 */
export function mirrorTrackConfig(tracks, widthMm, lengthMm) {
  const SWAP = {north: 'south', south: 'north', east: 'west', west: 'east'}, flipX = x => widthMm - x, flipZ = z => lengthMm - z
  return {...tracks, runs: tracks.runs.map(run => {
    const alongX = run.axis === 'x', flipAlong = alongX ? flipX : flipZ, flipAcross = alongX ? flipZ : flipX
    return {...run, atMm: flipAcross(run.atMm), fromMm: flipAlong(run.toMm), toMm: flipAlong(run.fromMm),
      heads: run.heads.map(head => ({...head, atMm: flipAlong(head.atMm), ...(head.aim ? {aim: SWAP[head.aim]} : {}),
        ...(head.targetMm ? {targetMm: {xMm: flipX(head.targetMm.xMm), zMm: flipZ(head.targetMm.zMm)}} : {})}))}
  })}
}

const distanceToRun = (run, point) => {
  const along = run.axis === 'x' ? point.x : point.z, across = run.axis === 'x' ? point.z : point.x
  const clamped = Math.min(Math.max(along, run.fromMm), run.toMm)
  return Math.hypot(along - clamped, across - run.atMm)
}

// Gap between a run (an axis-aligned segment on the ceiling) and a rectangle {x1, x2, z1, z2}; 0 when they overlap.
const distanceToRectangle = (run, rect) => {
  const segment = run.axis === 'x'
    ? {x1: run.fromMm, x2: run.toMm, z1: run.atMm, z2: run.atMm}
    : {x1: run.atMm, x2: run.atMm, z1: run.fromMm, z2: run.toMm}
  const dx = Math.max(0, rect.x1 - segment.x2, segment.x1 - rect.x2), dz = Math.max(0, rect.z1 - segment.z2, segment.z1 - rect.z2)
  return Math.hypot(dx, dz)
}

// Gap between a run (or a piece of one) and a moulding shape from mouldingShapes; 0 when it lies on the moulding.
const distanceToMoulding = (run, shape) => shape.radius === undefined ? distanceToRectangle(run, shape) : Math.max(0, distanceToRun(run, shape) - shape.radius)

/**
 * A linear pendant against what is really on the ceiling (the Lobby's dining pendant; pure, millimetres, room frame).
 * `centre` {x, z} is where it hangs; `pendant` gives lengthMm and bodyWidthMm of the body, canopyLengthMm and canopyWidthMm
 * of the ceiling canopy, and axis ('x' or 'z', the way both run). Returns the plan gap from the canopy and from the body to
 * each fan's blade circle, the mouldings the canopy lies on (it cannot be fixed flat there either), and the distance to
 * each existing ceiling point ({xMm, zMm, label} in the same frame): a pendant with no point above it needs a new point
 * or a swag.
 */
export function pendantCeilingReport(room, config, centre, existingPoints = []) {
  const p = config.pendant, alongX = p.axis === 'x', fans = config.ceilingFans ?? {fans: [], bladeDiameterMm: 0}
  const rect = (length, width) => alongX
    ? {x1: centre.x - length / 2, x2: centre.x + length / 2, z1: centre.z - width / 2, z2: centre.z + width / 2}
    : {x1: centre.x - width / 2, x2: centre.x + width / 2, z1: centre.z - length / 2, z2: centre.z + length / 2}
  const canopy = rect(p.canopyLengthMm, p.canopyWidthMm), body = rect(p.lengthMm, p.bodyWidthMm)
  const toPoint = (r, x, z) => Math.hypot(Math.max(r.x1 - x, 0, x - r.x2), Math.max(r.z1 - z, 0, z - r.z2))
  const overlaps = (r, s) => s.radius === undefined ? r.x1 < s.x2 && r.x2 > s.x1 && r.z1 < s.z2 && r.z2 > s.z1 : toPoint(r, s.x, s.z) < s.radius
  return {
    canopy, body,
    fans: fans.fans.map(f => ({label: f.label, canopyToBladesMm: Math.round(toPoint(canopy, f.xMm, f.zMm) - fans.bladeDiameterMm / 2), bodyToBladesMm: Math.round(toPoint(body, f.xMm, f.zMm) - fans.bladeDiameterMm / 2)})),
    canopyOnMouldings: mouldingShapes(room, config.ceilingMouldings).filter(s => overlaps(canopy, s)).map(s => s.label),
    existingPoints: existingPoints.map(e => ({label: e.label, distanceMm: Math.round(Math.hypot(e.xMm - centre.x, e.zMm - centre.z))})),
  }
}

/** Floor footprints of the layout C sofas (the west sofa faces east, the south sofa faces north). */
function seatRectangles(room) {
  const f = room.southLayout.furniture, w = f.westSofa, s = f.southSofa
  return [
    {x1: w.centerXmm - w.widthMm / 2, x2: w.centerXmm + w.widthMm / 2, z1: w.centerZmm - w.lengthMm / 2, z2: w.centerZmm + w.lengthMm / 2},
    {x1: s.centerXmm - s.lengthMm / 2, x2: s.centerXmm + s.lengthMm / 2, z1: s.centerZmm - s.widthMm / 2, z2: s.centerZmm + s.widthMm / 2},
  ]
}

/** Layout C of the Drawing Room: tracks, two ceiling fans, the chandelier; reading heads must be over the sofas. */
export function checkDrawingLighting(room, config) {
  return checkTrackLighting(room, config, {downTargets: seatRectangles(room), needsReading: true})
}

/**
 * Checks any room's track lights: runs inside the room and off the walls, clear of ceiling fans (config.ceilingFans, optional)
 * and of `obstacles` ({x1,x2,z1,z2,label}: furniture or cabinets that reach the ceiling), diffused and down-pointing heads away
 * from the blades, wall spots aimed at the wall beside their run, each down-pointing ('reading') head shining onto one of
 * `downTargets` ({x1,x2,z1,z2}) without too much tilt, and each run's own driver not overloaded. `needsSpots` is false for a
 * room with no wall worth grazing (the kitchen: cabinets on every wall).
 *
 * Ceiling mouldings (config.ceilingMouldings, optional; see mouldingShapes): a run, and the base of each head, must be
 * TRACK_TO_MOULDING_MM clear of every border band, corner ring and medallion, or the run must say how it crosses:
 * run.crossings = [{moulding: '<shape label>', method: '<how: stand-off spacers bridging it, or the moulding cut and made
 * good>'}]. A crossing of a moulding the run does not reach is an issue too, so a stale one cannot linger. The flat painted
 * border between a wall and its moulding is plain slab and is allowed. `mouldingClearances` in the result lists every gap.
 */
export function checkTrackLighting(room, config, {downTargets = [], needsReading = false, needsSpots = true, obstacles = []} = {}) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const fans = config.ceilingFans ?? {fans: [], bladeDiameterMm: 0, chandelierRadiusMm: 0}, tracks = config.tracks, radius = fans.bladeDiameterMm / 2
  const chandelier = config.ambient?.[0], fanPoints = fans.fans.map(f => ({x: f.xMm, z: f.zMm, label: f.label}))
  const clearances = {}, runs = {}, mouldings = mouldingShapes(room, config.ceilingMouldings), mouldingClearances = {}, crossings = []

  for (const fan of fanPoints) {
    if (chandelier) {
      const toChandelier = Math.hypot(fan.x - chandelier.xMm, fan.z - chandelier.zMm) - radius - (fans.chandelierRadiusMm ?? 0)
      clearances[`${fan.label} to chandelier`] = Math.round(toChandelier)
      need(toChandelier >= 100, `${fan.label}: the blades come within ${Math.round(toChandelier)} mm of the chandelier (needs 100)`)
    }
    need(fan.x - radius >= 150 && fan.x + radius <= room.widthMm - 150 && fan.z - radius >= 150 && fan.z + radius <= room.lengthMm - 150, `${fan.label}: the blades are within 150 mm of a wall`)
  }

  let watts = 0, lumens = 0, spots = 0, diffused = 0, reading = 0
  const targets = downTargets
  for (const run of tracks.runs) {
    const limit = run.axis === 'x' ? room.widthMm : room.lengthMm, across = run.axis === 'x' ? room.lengthMm : room.widthMm
    need(run.fromMm >= 100 && run.toMm <= limit - 100 && run.toMm > run.fromMm, `${run.id}: the run leaves the room`)
    need(run.atMm >= 300 && run.atMm <= across - 300, `${run.id}: the run is closer than 300 mm to a wall, too close for its heads`)
    need(Number.isFinite(run.driverWatts) && run.driverWatts > 0, `${run.id}: no driver; each run is one circuit with its own driver and dimmer`)
    for (const fan of fanPoints) {
      const gap = distanceToRun(run, fan) - radius
      clearances[`${run.id} to ${fan.label}`] = Math.round(gap)
      need(gap >= TRACK_TO_BLADE_MM, `${run.id} passes ${Math.round(gap)} mm from the blades of the ${fan.label} (needs ${TRACK_TO_BLADE_MM})`)
    }
    for (const obstacle of obstacles) {
      const gap = distanceToRectangle(run, obstacle)
      clearances[`${run.id} to ${obstacle.label}`] = Math.round(gap)
      need(gap >= TRACK_TO_OBSTACLE_MM, `${run.id} passes ${Math.round(gap)} mm from the ${obstacle.label}, which reaches the ceiling (needs ${TRACK_TO_OBSTACLE_MM})`)
    }
    const declared = run.crossings ?? [], crossed = new Set()
    for (const shape of mouldings) {
      const gap = distanceToMoulding(run, shape), crossing = declared.find(c => c.moulding === shape.label)
      mouldingClearances[`${run.id} to ${shape.label}`] = Math.round(gap)
      if (gap >= TRACK_TO_MOULDING_MM) need(!crossing, `${run.id}: a crossing of the ${shape.label} is declared, but the run is ${Math.round(gap)} mm clear of it; remove the crossing`)
      else if (crossing) {
        crossed.add(shape.label)
        need(typeof crossing.method === 'string' && crossing.method.trim().length >= 10, `${run.id}: the crossing of the ${shape.label} does not say how it is done (stand-off spacers, or the moulding cut and made good)`)
        crossings.push({run: run.id, moulding: shape.label, method: crossing.method})
      } else need(false, `${run.id} ${gap === 0 ? 'lies across' : `is ${Math.round(gap)} mm from`} the ${shape.label} (needs ${TRACK_TO_MOULDING_MM} of flat slab): a track cannot be screwed flat over a raised moulding; move it or state how it crosses`)
    }
    for (const crossing of declared) need(mouldings.some(s => s.label === crossing.moulding), `${run.id}: a crossing names "${crossing.moulding}", which is not a moulding of this room`)
    let runWatts = 0, runLumens = 0
    for (const head of run.heads) {
      const at = headPosition(run, head), half = (head.lengthMm ?? 60) / 2
      need(head.atMm - half >= run.fromMm && head.atMm + half <= run.toMm, `${run.id}: a ${head.kind} head at ${head.atMm} is off the end of the run`)
      // The head's base clips into the run, so it needs flat slab too unless the run bridges that moulding.
      const base = {axis: run.axis, atMm: run.atMm, fromMm: head.atMm - half, toMm: head.atMm + half}
      for (const shape of mouldings) if (!crossed.has(shape.label)) {
        const gap = distanceToMoulding(base, shape)
        need(gap >= TRACK_TO_MOULDING_MM, `${run.id}: the base of the ${head.kind} head at ${head.atMm} is ${Math.round(gap)} mm from the ${shape.label} (needs ${TRACK_TO_MOULDING_MM})`)
      }
      runWatts += head.watts; runLumens += head.lumens
      if (head.kind === 'diffuse' || head.kind === 'reading') {
        const name = head.kind === 'diffuse' ? 'diffused' : 'reading'
        if (head.kind === 'diffuse') diffused++; else reading++
        for (const fan of fanPoints) {
          const gap = Math.hypot(at.x - fan.x, at.z - fan.z) - radius
          need(gap >= DIFFUSE_TO_BLADE_MM, `${run.id}: a ${name} head is ${Math.round(gap)} mm from the blades of the ${fan.label}; it would flicker (needs ${DIFFUSE_TO_BLADE_MM})`)
        }
        if (head.kind === 'reading') {
          // A reading head shines onto a seat, a bed or a work spot: straight down, or aimed at targetMm with a gentle tilt.
          const target = readingTarget(run, head), where = head.targetMm ? `aims at (${target.x}, ${target.z}), which is` : 'is'
          need(targets.some(r => target.x >= r.x1 && target.x <= r.x2 && target.z >= r.z1 && target.z <= r.z2), `${run.id}: the down-pointing head at ${head.atMm} ${where} not over a sofa, bed or work spot`)
          const tilt = readingTiltDeg(run, head, room.heightMm)
          need(tilt <= READING_TILT_MAX_DEG, `${run.id}: the reading head at ${head.atMm} is tilted ${Math.round(tilt)} degrees toward its target; over ${READING_TILT_MAX_DEG} it shines into the eyes rather than from above`)
        }
      } else {
        spots++
        // A spot must point at the wall nearest its run, away from the middle of the room where the fans are.
        const nearest = run.axis === 'x' ? (run.atMm < room.lengthMm / 2 ? 'north' : 'south') : (run.atMm < room.widthMm / 2 ? 'west' : 'east')
        need(head.aim === nearest, `${run.id}: a spot aims ${head.aim}, across the room, not at the ${nearest} wall beside its run`)
        const toWall = Math.min(run.atMm, across - run.atMm)
        need(toWall <= SPOT_TO_WALL_MAX_MM, `${run.id}: a spot is ${toWall} mm from the ${nearest} wall; beyond ${SPOT_TO_WALL_MAX_MM} it no longer washes the wall`)
      }
    }
    if (run.driverWatts > 0) need(runWatts <= run.driverWatts * DRIVER_LOAD_FRACTION, `${run.id}: the heads draw ${runWatts} W, over ${DRIVER_LOAD_FRACTION * 100}% of its ${run.driverWatts} W driver`)
    runs[run.id] = {watts: runWatts, lumens: runLumens, heads: run.heads.length, driverWatts: run.driverWatts, driverLoad: run.driverWatts > 0 ? Math.round(runWatts / run.driverWatts * 100) : null, metres: (run.toMm - run.fromMm) / 1000}
    watts += runWatts; lumens += runLumens
  }
  need(diffused > 0 && (spots > 0 || !needsSpots), 'the tracks need both spot and diffused heads for layered light')
  if (needsReading) need(config.reading || reading > 0, 'no reading light: neither a wall reading light nor a reading head over a seat')
  const areaM2 = room.widthMm * room.lengthMm / 1e6
  return {ok: issues.length === 0, issues, clearances, mouldingClearances, crossings, runs, totals: {watts, lumens, spots, diffused, reading, heads: spots + diffused + reading, lumensPerM2: Math.round(lumens / areaM2), trackMetres: tracks.runs.reduce((sum, run) => sum + (run.toMm - run.fromMm), 0) / 1000}}
}
