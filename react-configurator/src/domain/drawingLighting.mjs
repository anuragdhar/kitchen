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

/** Dimmer circuits of a room: the general light first (when the room has one), then one per run. */
export function dimmerCircuits(tracks, general = null) {
  return [...(general ? [['chandelier', general]] : []), ...tracks.runs.map(run => [run.id, run.label.split(':')[0]])]
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
 */
export function checkTrackLighting(room, config, {downTargets = [], needsReading = false, needsSpots = true, obstacles = []} = {}) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const fans = config.ceilingFans ?? {fans: [], bladeDiameterMm: 0, chandelierRadiusMm: 0}, tracks = config.tracks, radius = fans.bladeDiameterMm / 2
  const chandelier = config.ambient?.[0], fanPoints = fans.fans.map(f => ({x: f.xMm, z: f.zMm, label: f.label}))
  const clearances = {}, runs = {}

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
    let runWatts = 0, runLumens = 0
    for (const head of run.heads) {
      const at = headPosition(run, head), half = (head.lengthMm ?? 60) / 2
      need(head.atMm - half >= run.fromMm && head.atMm + half <= run.toMm, `${run.id}: a ${head.kind} head at ${head.atMm} is off the end of the run`)
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
      }
    }
    if (run.driverWatts > 0) need(runWatts <= run.driverWatts * DRIVER_LOAD_FRACTION, `${run.id}: the heads draw ${runWatts} W, over ${DRIVER_LOAD_FRACTION * 100}% of its ${run.driverWatts} W driver`)
    runs[run.id] = {watts: runWatts, lumens: runLumens, heads: run.heads.length, driverWatts: run.driverWatts, driverLoad: run.driverWatts > 0 ? Math.round(runWatts / run.driverWatts * 100) : null, metres: (run.toMm - run.fromMm) / 1000}
    watts += runWatts; lumens += runLumens
  }
  need(diffused > 0 && (spots > 0 || !needsSpots), 'the tracks need both spot and diffused heads for layered light')
  if (needsReading) need(config.reading || reading > 0, 'no reading light: neither a wall reading light nor a reading head over a seat')
  const areaM2 = room.widthMm * room.lengthMm / 1e6
  return {ok: issues.length === 0, issues, clearances, runs, totals: {watts, lumens, spots, diffused, reading, heads: spots + diffused + reading, lumensPerM2: Math.round(lumens / areaM2), trackMetres: tracks.runs.reduce((sum, run) => sum + (run.toMm - run.fromMm), 0) / 1000}}
}
